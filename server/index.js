const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { v4: uuidv4 } = require('uuid');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:8080"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:8080"],
  credentials: true
}));
app.use(express.json());

// Game state storage (in production, use MongoDB)
const gameRooms = new Map();
const players = new Map();
const spectators = new Map();
const gameHistory = new Map();
const chatMessages = new Map();

// UNO Game Logic
class UnoGame {
  constructor(roomId, gameMode = 'classic', customRules = null) {
    this.roomId = roomId;
    this.players = [];
    this.spectators = [];
    this.deck = [];
    this.discardPile = [];
    this.currentPlayer = 0;
    this.direction = 1; // 1 for clockwise, -1 for counterclockwise
    this.gameStarted = false;
    this.winner = null;
    this.drawCount = 0; // For draw 2 and draw 4 stacking
    this.gameMode = gameMode;
    this.customRules = customRules;
    this.startTime = null;
    this.endTime = null;
    this.initializeDeck();
    this.initializeSettings();
  }

  initializeSettings() {
    // Base settings
    this.settings = {
      drawStackLimit: 4,
      timeLimit: 30, // seconds per turn
      allowStacking: false,
      forcePlayDrawnCard: false,
      jumpInRules: false,
      sevenSwap: false
    };

    // Apply game mode specific settings
    switch (this.gameMode) {
      case 'speed':
        this.settings.timeLimit = 15;
        break;
      case 'tournament':
        this.settings.timeLimit = 45;
        break;
      case 'house':
        if (this.customRules) {
          this.settings = {...this.settings, ...this.customRules};
        }
        break;
    }
  }

  initializeDeck() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const actions = ['skip', 'reverse', 'draw2'];

    // Add number cards (0 has 1 card per color, 1-9 have 2 cards per color)
    colors.forEach(color => {
      this.deck.push({ color, type: 'number', value: 0 });
      for (let i = 1; i <= 9; i++) {
        this.deck.push({ color, type: 'number', value: i });
        this.deck.push({ color, type: 'number', value: i });
      }
    });

    // Add action cards (2 per color)
    colors.forEach(color => {
      actions.forEach(action => {
        this.deck.push({ color, type: 'action', value: action });
        this.deck.push({ color, type: 'action', value: action });
      });
    });

    // Add wild cards
    for (let i = 0; i < 4; i++) {
      this.deck.push({ type: 'wild', value: 'wild' });
      this.deck.push({ type: 'wild', value: 'draw4' });
    }

    this.shuffleDeck();
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  addPlayer(playerId, playerName) {
    if (this.players.length >= 4) return false;
    this.players.push({
      id: playerId,
      name: playerName,
      hand: [],
      hasCalledUno: false
    });
    return true;
  }

  addSpectator(spectatorId, spectatorName) {
    this.spectators.push({
      id: spectatorId,
      name: spectatorName
    });
    return true;
  }

  removeSpectator(spectatorId) {
    this.spectators = this.spectators.filter(spec => spec.id !== spectatorId);
  }

  startGame() {
    if (this.players.length < 2) return false;
    
    // Deal 7 cards to each player
    this.players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        player.hand.push(this.drawCard());
      }
    });

    // Place first card (make sure it's not a wild card)
    let firstCard;
    do {
      firstCard = this.drawCard();
    } while (firstCard.type === 'wild');
    
    this.discardPile.push(firstCard);
    this.gameStarted = true;
    this.startTime = new Date();
    
    // Send a system message
    return true;
  }

  drawCard() {
    if (this.deck.length === 0) {
      // Reshuffle discard pile except top card
      const topCard = this.discardPile.pop();
      this.deck = [...this.discardPile];
      this.discardPile = [topCard];
      this.shuffleDeck();
    }
    return this.deck.pop();
  }

  playCard(playerId, cardIndex, chosenColor = null) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex !== this.currentPlayer) return { success: false, error: 'Not your turn' };
    
    const player = this.players[playerIndex];
    const card = player.hand[cardIndex];
    const topCard = this.discardPile[this.discardPile.length - 1];

    if (!this.isValidPlay(card, topCard, chosenColor)) {
      return { success: false, error: 'Invalid card play' };
    }

    // Remove card from player's hand
    player.hand.splice(cardIndex, 1);
    
    // Set color for wild cards
    if (card.type === 'wild') {
      card.chosenColor = chosenColor;
    }
    
    this.discardPile.push(card);

    // Handle special cards
    this.handleSpecialCard(card);

    // Check for win
    if (player.hand.length === 0) {
      this.winner = playerId;
      this.endTime = new Date();
      this.saveGameHistory(playerId, player.name);
      return { success: true, winner: playerId, winnerName: player.name };
    }

    // Check for UNO call
    if (player.hand.length === 1) {
      player.hasCalledUno = false; // Reset UNO call
    }

    // Move to next player
    this.nextPlayer();

    return { success: true };
  }

  isValidPlay(card, topCard, chosenColor) {
    if (this.drawCount > 0) {
      // Must play a draw card or draw cards
      return (card.type === 'action' && card.value === 'draw2') || 
             (card.type === 'wild' && card.value === 'draw4');
    }

    if (card.type === 'wild') return true;
    
    const topColor = topCard.chosenColor || topCard.color;
    
    return card.color === topColor || 
           (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) ||
           (card.type === 'action' && topCard.type === 'action' && card.value === topCard.value);
  }

  handleSpecialCard(card) {
    switch (card.value) {
      case 'skip':
        this.nextPlayer();
        break;
      case 'reverse':
        this.direction *= -1;
        if (this.players.length === 2) {
          this.nextPlayer(); // In 2-player game, reverse acts like skip
        }
        break;
      case 'draw2':
        if (this.settings.allowStacking) {
          this.drawCount += 2;
        } else {
          this.nextPlayer();
          this.drawCards(this.players[this.currentPlayer].id, 2);
        }
        break;
      case 'draw4':
        if (this.settings.allowStacking) {
          this.drawCount += 4;
        } else {
          this.nextPlayer();
          this.drawCards(this.players[this.currentPlayer].id, 4);
        }
        break;
    }
  }

  nextPlayer() {
    this.currentPlayer = (this.currentPlayer + this.direction + this.players.length) % this.players.length;
  }

  drawCards(playerId, count = 1) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    for (let i = 0; i < count; i++) {
      player.hand.push(this.drawCard());
    }
    return true;
  }

  callUno(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      console.log('Player not found for UNO call:', playerId);
      return false;
    }

    // Allow UNO call if player has 2 or 1 cards (calling before playing the second-to-last card)
    if (player.hand.length <= 2) {
      player.hasCalledUno = true;
      console.log(`Player ${player.name} called UNO! Cards remaining: ${player.hand.length}`);
      return true;
    }
    
    console.log(`Player ${player.name} cannot call UNO with ${player.hand.length} cards`);
    return false;
  }

  saveGameHistory(winnerId, winnerName) {
    const gameDuration = Math.round((this.endTime - this.startTime) / 60000); // in minutes
    
    const gameRecord = {
      id: uuidv4(),
      roomId: this.roomId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        finalPosition: p.id === winnerId ? 1 : 2,
        cardsLeft: p.hand.length
      })),
      winner: winnerId,
      winnerName,
      duration: gameDuration,
      startTime: this.startTime,
      endTime: this.endTime,
      gameMode: this.gameMode
    };
    
    // Store in memory
    // In production, this would be stored in MongoDB
    if (!gameHistory.has(winnerId)) {
      gameHistory.set(winnerId, [gameRecord]);
    } else {
      gameHistory.get(winnerId).push(gameRecord);
    }
    
    // Store a copy for each player
    this.players.forEach(player => {
      if (player.id !== winnerId) {
        if (!gameHistory.has(player.id)) {
          gameHistory.set(player.id, [gameRecord]);
        } else {
          gameHistory.get(player.id).push(gameRecord);
        }
      }
    });
  }

  getGameState() {
    return {
      roomId: this.roomId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        handCount: p.hand.length,
        hasCalledUno: p.hasCalledUno
      })),
      currentPlayer: this.currentPlayer,
      topCard: this.discardPile[this.discardPile.length - 1],
      gameStarted: this.gameStarted,
      winner: this.winner,
      drawCount: this.drawCount,
      gameMode: this.gameMode,
      spectatorCount: this.spectators.length
    };
  }

  getPlayerHand(playerId) {
    const player = this.players.find(p => p.id === playerId);
    return player ? player.hand : [];
  }

  getSpectators() {
    return this.spectators;
  }
}

// Socket event handlers
io.on('connection', (socket) => {
  socket.on('createRoom', ({ playerName, gameMode = 'classic', customRules = null }) => {
    try {
      console.log('Creating room for player:', playerName, 'with game mode:', gameMode);
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const game = new UnoGame(roomId, gameMode, customRules);
      
      if (game.addPlayer(socket.id, playerName)) {
        gameRooms.set(roomId, game);
        players.set(socket.id, { roomId, playerName });
        
        socket.join(roomId);
        console.log('Room created successfully:', roomId);
        socket.emit('roomCreated', { roomId, game: game.getGameState() });
        socket.emit('handUpdate', game.getPlayerHand(socket.id));
        
        // Initialize chat for this room
        chatMessages.set(roomId, []);
        
        // Send system message
        const systemMessage = {
          id: uuidv4(),
          type: 'system',
          message: `Game room created by ${playerName}`,
          timestamp: new Date()
        };
        
        chatMessages.get(roomId).push(systemMessage);
        io.to(roomId).emit('systemMessage', systemMessage);
      } else {
        socket.emit('error', 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    try {
      console.log('Player', playerName, 'attempting to join room:', roomId);
      const game = gameRooms.get(roomId);
      if (!game) {
        console.log('Room not found:', roomId);
        socket.emit('error', 'Room not found');
        return;
      }

      if (game.addPlayer(socket.id, playerName)) {
        players.set(socket.id, { roomId, playerName });
        socket.join(roomId);
        console.log('Player joined successfully:', playerName, 'to room:', roomId);
        io.to(roomId).emit('gameUpdate', game.getGameState());
        socket.emit('handUpdate', game.getPlayerHand(socket.id));
        
        // Send system message
        const systemMessage = {
          id: uuidv4(),
          type: 'system',
          message: `${playerName} joined the game`,
          timestamp: new Date()
        };
        
        chatMessages.get(roomId).push(systemMessage);
        io.to(roomId).emit('systemMessage', systemMessage);
      } else {
        console.log('Room is full:', roomId);
        socket.emit('error', 'Room is full');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('spectateGame', ({ roomId, spectatorName }) => {
    try {
      console.log('User', spectatorName, 'attempting to spectate room:', roomId);
      const game = gameRooms.get(roomId);
      if (!game) {
        console.log('Room not found:', roomId);
        socket.emit('error', 'Room not found');
        return;
      }

      game.addSpectator(socket.id, spectatorName);
      spectators.set(socket.id, { roomId, spectatorName });
      socket.join(roomId);
      
      console.log('Spectator joined successfully:', spectatorName, 'to room:', roomId);
      
      // Send game state to spectator
      socket.emit('gameUpdate', game.getGameState());
      
      // Update spectator list for all clients in the room
      io.to(roomId).emit('spectatorsUpdate', game.getSpectators());
      
      // Send system message
      const systemMessage = {
        id: uuidv4(),
        type: 'system',
        message: `${spectatorName} is now spectating`,
        timestamp: new Date()
      };
      
      chatMessages.get(roomId).push(systemMessage);
      io.to(roomId).emit('systemMessage', systemMessage);
    } catch (error) {
      console.error('Error spectating game:', error);
      socket.emit('error', 'Failed to spectate game');
    }
  });

  socket.on('toggleSpectate', ({ roomId, playerName, spectate }) => {
    try {
      const game = gameRooms.get(roomId);
      if (!game) return;
      
      if (spectate) {
        // Player -> Spectator
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex === -1) return;
        
        // Remove from players
        game.players.splice(playerIndex, 1);
        players.delete(socket.id);
        
        // Add as spectator
        game.addSpectator(socket.id, playerName);
        spectators.set(socket.id, { roomId, spectatorName: playerName });
        
        // Update game state
        if (game.currentPlayer === playerIndex) {
          game.currentPlayer = game.currentPlayer % game.players.length;
        }
      } else {
        // Spectator -> Player
        if (game.players.length >= 4) {
          socket.emit('error', 'Game is full');
          return;
        }
        
        // Remove from spectators
        game.removeSpectator(socket.id);
        spectators.delete(socket.id);
        
        // Add as player
        game.addPlayer(socket.id, playerName);
        players.set(socket.id, { roomId, playerName });
      }
      
      // Update all clients
      io.to(roomId).emit('gameUpdate', game.getGameState());
      io.to(roomId).emit('spectatorsUpdate', game.getSpectators());
      
      // Send system message
      const systemMessage = {
        id: uuidv4(),
        type: 'system',
        message: spectate 
          ? `${playerName} is now spectating` 
          : `${playerName} joined the game as a player`,
        timestamp: new Date()
      };
      
      chatMessages.get(roomId).push(systemMessage);
      io.to(roomId).emit('systemMessage', systemMessage);
    } catch (error) {
      console.error('Error toggling spectate mode:', error);
    }
  });

  socket.on('startGame', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const game = gameRooms.get(playerData.roomId);
    if (game && game.startGame()) {
      io.to(playerData.roomId).emit('gameUpdate', game.getGameState());
      // Send each player their hand
      game.players.forEach(player => {
        io.to(player.id).emit('handUpdate', game.getPlayerHand(player.id));
      });
      
      // Send system message
      const systemMessage = {
        id: uuidv4(),
        type: 'system',
        message: `Game started! ${game.players[0].name}'s turn`,
        timestamp: new Date()
      };
      
      chatMessages.get(playerData.roomId).push(systemMessage);
      io.to(playerData.roomId).emit('systemMessage', systemMessage);
    }
  });

  socket.on('playCard', ({ cardIndex, chosenColor }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const game = gameRooms.get(playerData.roomId);
    if (game) {
      const result = game.playCard(socket.id, cardIndex, chosenColor);
      if (result.success) {
        io.to(playerData.roomId).emit('gameUpdate', game.getGameState());
        // Update all players' hands
        game.players.forEach(player => {
          io.to(player.id).emit('handUpdate', game.getPlayerHand(player.id));
        });
        
        if (result.winner) {
          io.to(playerData.roomId).emit('gameWon', { 
            winner: result.winner,
            winnerName: result.winnerName
          });
          
          // Send system message
          const systemMessage = {
            id: uuidv4(),
            type: 'system',
            message: `🎉 ${result.winnerName} won the game!`,
            timestamp: new Date()
          };
          
          chatMessages.get(playerData.roomId).push(systemMessage);
          io.to(playerData.roomId).emit('systemMessage', systemMessage);
        } else {
          // Send play card message
          const systemMessage = {
            id: uuidv4(),
            type: 'system',
            message: `${playerData.playerName} played a card`,
            timestamp: new Date()
          };
          
          chatMessages.get(playerData.roomId).push(systemMessage);
          io.to(playerData.roomId).emit('systemMessage', systemMessage);
        }
      } else {
        socket.emit('error', result.error);
      }
    }
  });

  socket.on('drawCard', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const game = gameRooms.get(playerData.roomId);
    if (game) {
      const drawAmount = game.drawCount > 0 ? game.drawCount : 1;
      game.drawCards(socket.id, drawAmount);
      game.drawCount = 0; // Reset draw count
      game.nextPlayer(); // Move to next player after drawing
      
      io.to(playerData.roomId).emit('gameUpdate', game.getGameState());
      socket.emit('handUpdate', game.getPlayerHand(socket.id));
      
      // Send system message
      const systemMessage = {
        id: uuidv4(),
        type: 'system',
        message: `${playerData.playerName} drew ${drawAmount} card${drawAmount > 1 ? 's' : ''}`,
        timestamp: new Date()
      };
      
      chatMessages.get(playerData.roomId).push(systemMessage);
      io.to(playerData.roomId).emit('systemMessage', systemMessage);
    }
  });

  socket.on('callUno', () => {
    const playerData = players.get(socket.id);
    if (!playerData) {
      console.log('No player data found for UNO call');
      return;
    }

    const game = gameRooms.get(playerData.roomId);
    if (!game) {
      console.log('No game found for UNO call');
      return;
    }

    console.log(`Processing UNO call from ${playerData.playerName}`);
    if (game.callUno(socket.id)) {
      io.to(playerData.roomId).emit('gameUpdate', game.getGameState());
      
      // Send system message
      const systemMessage = {
        id: uuidv4(),
        type: 'system',
        message: `${playerData.playerName} called UNO!`,
        timestamp: new Date()
      };
      
      if (chatMessages.has(playerData.roomId)) {
        chatMessages.get(playerData.roomId).push(systemMessage);
      }
      io.to(playerData.roomId).emit('systemMessage', systemMessage);
    } else {
      socket.emit('error', 'Cannot call UNO right now');
    }
  });
  
  socket.on('sendChatMessage', ({ roomId, message }) => {
    console.log('Received chat message:', { roomId, message });
    
    const playerData = players.get(socket.id);
    const spectatorData = spectators.get(socket.id);
    
    if (!playerData && !spectatorData) {
      console.log('No player or spectator data found for chat');
      return;
    }
    
    // Check if chat exists for this room
    if (!chatMessages.has(roomId)) {
      chatMessages.set(roomId, []);
    }
    
    // Create message object
    const chatMessage = {
      id: uuidv4(),
      playerId: socket.id,
      playerName: playerData ? playerData.playerName : spectatorData.spectatorName,
      message: message.message,
      timestamp: new Date(),
      type: 'chat'
    };
    
    console.log('Broadcasting chat message:', chatMessage);
    
    // Save message
    chatMessages.get(roomId).push(chatMessage);
    
    // Send to all in room
    io.to(roomId).emit('chatMessage', chatMessage);
  });
  
  socket.on('getGameHistory', ({ playerId }) => {
    // Get player's game history
    const playerHistory = gameHistory.get(playerId) || [];
    socket.emit('gameHistoryUpdate', playerHistory);
  });
  
  socket.on('rejoinGame', ({ roomId, playerName }) => {
    const game = gameRooms.get(roomId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }
    
    // Check if player was in the game
    const playerIndex = game.players.findIndex(p => p.name === playerName);
    if (playerIndex === -1) {
      socket.emit('error', 'Player not found in this game');
      return;
    }
    
    // Update player's socket ID
    const oldSocketId = game.players[playerIndex].id;
    game.players[playerIndex].id = socket.id;
    
    // Update players map
    players.delete(oldSocketId);
    players.set(socket.id, { roomId, playerName });
    
    // Join room
    socket.join(roomId);
    
    // Send game state
    socket.emit('gameStateRestore', game.getGameState());
    socket.emit('handUpdate', game.getPlayerHand(socket.id));
    
    // Send system message
    const systemMessage = {
      id: uuidv4(),
      type: 'system',
      message: `${playerName} reconnected to the game`,
      timestamp: new Date()
    };
    
    chatMessages.get(roomId).push(systemMessage);
    io.to(roomId).emit('systemMessage', systemMessage);
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for multiple origins');
});
