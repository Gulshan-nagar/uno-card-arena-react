const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

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

// UNO Game Logic
class UnoGame {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.currentPlayer = 0;
    this.direction = 1; // 1 for clockwise, -1 for counterclockwise
    this.gameStarted = false;
    this.winner = null;
    this.drawCount = 0; // For draw 2 and draw 4 stacking
    this.initializeDeck();
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
      return { success: true, winner: playerId };
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
        this.drawCount += 2;
        break;
      case 'draw4':
        this.drawCount += 4;
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
    if (player && player.hand.length === 1) {
      player.hasCalledUno = true;
      return true;
    }
    return false;
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
      drawCount: this.drawCount
    };
  }

  getPlayerHand(playerId) {
    const player = this.players.find(p => p.id === playerId);
    return player ? player.hand : [];
  }
}

// Socket event handlers
io.on('connection', (socket) => {
  socket.on('createRoom', ({ playerName }) => {
    try {
      console.log('Creating room for player:', playerName);
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const game = new UnoGame(roomId);
      
      if (game.addPlayer(socket.id, playerName)) {
        gameRooms.set(roomId, game);
        players.set(socket.id, { roomId, playerName });
        
        socket.join(roomId);
        console.log('Room created successfully:', roomId);
        socket.emit('roomCreated', { roomId, game: game.getGameState() });
        socket.emit('handUpdate', game.getPlayerHand(socket.id));
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
      } else {
        console.log('Room is full:', roomId);
        socket.emit('error', 'Room is full');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
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
          io.to(playerData.roomId).emit('gameWon', { winner: result.winner });
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
    }
  });

  socket.on('callUno', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const game = gameRooms.get(playerData.roomId);
    if (game && game.callUno(socket.id)) {
      io.to(playerData.roomId).emit('gameUpdate', game.getGameState());
    }
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
