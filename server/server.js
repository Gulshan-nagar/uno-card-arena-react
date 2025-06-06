const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const Game = require('./models/Game');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Body parser middleware
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// Error handler
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('createRoom', async (data) => {
    try {
      const { playerName } = data;
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      const game = new Game({
        roomId,
        players: [{
          userId: null,
          username: playerName,
          socketId: socket.id,
          hand: [],
          position: 0
        }]
      });

      await game.save();
      socket.join(roomId);

      socket.emit('roomCreated', {
        roomId,
        game: {
          roomId: game.roomId,
          players: game.players.map(p => ({
            id: p.socketId,
            name: p.username,
            handCount: p.hand.length,
            hasCalledUno: p.hasCalledUno
          })),
          currentPlayer: game.currentPlayer,
          gameStarted: game.gameStarted,
          winner: game.winner,
          drawCount: game.drawCount
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });

  socket.on('joinRoom', async (data) => {
    try {
      const { roomId, playerName } = data;
      
      const game = await Game.findOne({ roomId });
      
      if (!game) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (game.gameStarted) {
        socket.emit('error', 'Game has already started');
        return;
      }

      if (game.players.length >= game.maxPlayers) {
        socket.emit('error', 'Room is full');
        return;
      }

      game.players.push({
        userId: null,
        username: playerName,
        socketId: socket.id,
        hand: [],
        position: game.players.length
      });

      await game.save();
      socket.join(roomId);

      const gameUpdate = {
        roomId: game.roomId,
        players: game.players.map(p => ({
          id: p.socketId,
          name: p.username,
          handCount: p.hand.length,
          hasCalledUno: p.hasCalledUno
        })),
        currentPlayer: game.currentPlayer,
        gameStarted: game.gameStarted,
        winner: game.winner,
        drawCount: game.drawCount
      };

      io.to(roomId).emit('gameUpdate', gameUpdate);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('startGame', async () => {
    try {
      const game = await Game.findOne({ 'players.socketId': socket.id });
      
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      if (game.players.length < 2) {
        socket.emit('error', 'Need at least 2 players to start');
        return;
      }

      if (game.gameStarted) {
        socket.emit('error', 'Game has already started');
        return;
      }

      // Create and shuffle deck
      const deck = createDeck();
      
      // Deal cards to players
      const hands = dealCards(deck, game.players.length);
      
      // Update players with their hands
      game.players.forEach((player, index) => {
        player.hand = hands[index];
        player.handCount = hands[index].length;
      });

      // Set first card (make sure it's not a wild card)
      let topCard;
      do {
        topCard = deck.pop();
      } while (topCard.type === 'wild');

      game.deck = deck;
      game.discardPile = [topCard];
      game.gameStarted = true;
      game.currentPlayer = 0;

      await game.save();

      const gameUpdate = {
        roomId: game.roomId,
        players: game.players.map(p => ({
          id: p.socketId,
          name: p.username,
          handCount: p.hand.length,
          hasCalledUno: p.hasCalledUno
        })),
        currentPlayer: game.currentPlayer,
        topCard: game.discardPile[game.discardPile.length - 1],
        gameStarted: game.gameStarted,
        winner: game.winner,
        drawCount: game.drawCount
      };

      io.to(game.roomId).emit('gameUpdate', gameUpdate);

      // Send each player their hand
      game.players.forEach(player => {
        io.to(player.socketId).emit('handUpdate', player.hand);
      });

    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', 'Failed to start game');
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    try {
      const game = await Game.findOne({ 'players.socketId': socket.id });
      if (game) {
        // Remove the disconnected player
        game.players = game.players.filter(p => p.socketId !== socket.id);
        
        if (game.players.length === 0) {
          // If no players left, delete the game
          await Game.deleteOne({ _id: game._id });
        } else {
          // Update player positions
          game.players.forEach((player, index) => {
            player.position = index;
          });
          
          // If it was the disconnected player's turn, move to next player
          if (game.currentPlayer >= game.players.length) {
            game.currentPlayer = 0;
          }
          
          await game.save();
          
          // Notify remaining players
          io.to(game.roomId).emit('playerLeft', {
            gameUpdate: {
              roomId: game.roomId,
              players: game.players.map(p => ({
                id: p.socketId,
                name: p.username,
                handCount: p.hand.length,
                hasCalledUno: p.hasCalledUno
              })),
              currentPlayer: game.currentPlayer,
              gameStarted: game.gameStarted,
              winner: game.winner,
              drawCount: game.drawCount
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  socket.on('playCard', async (data) => {
    try {
      const { cardIndex, chosenColor } = data;
      const game = await Game.findOne({ 'players.socketId': socket.id });
      
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      const player = game.players.find(p => p.socketId === socket.id);
      if (!player) {
        socket.emit('error', 'Player not found');
        return;
      }

      if (game.currentPlayer !== player.position) {
        socket.emit('error', 'Not your turn');
        return;
      }

      const card = player.hand[cardIndex];
      const topCard = game.discardPile[game.discardPile.length - 1];

      // Check if card can be played
      if (!canPlayCard(card, topCard)) {
        socket.emit('error', 'Invalid card play');
        return;
      }

      // Remove card from player's hand
      player.hand.splice(cardIndex, 1);
      game.discardPile.push(card);

      // Handle special cards
      let skipNext = false;
      let reverse = false;
      let drawCards = 0;

      if (card.type === 'action') {
        switch (card.value) {
          case 'skip':
            skipNext = true;
            break;
          case 'reverse':
            reverse = true;
            break;
          case 'draw2':
            drawCards = 2;
            break;
        }
      } else if (card.type === 'wild' && card.value === 'wild4') {
        drawCards = 4;
      }

      // Update card color if it's a wild card
      if (card.type === 'wild') {
        card.color = chosenColor;
      }

      // Calculate next player
      let nextPlayer = (game.currentPlayer + (reverse ? -1 : 1)) % game.players.length;
      if (nextPlayer < 0) nextPlayer = game.players.length - 1;
      
      if (skipNext) {
        nextPlayer = (nextPlayer + (reverse ? -1 : 1)) % game.players.length;
        if (nextPlayer < 0) nextPlayer = game.players.length - 1;
      }

      game.currentPlayer = nextPlayer;

      // Handle draw cards
      if (drawCards > 0) {
        const nextPlayerObj = game.players[nextPlayer];
        const newCards = game.deck.splice(0, drawCards);
        if (game.deck.length < drawCards) {
          game.deck = shuffleDeck([...game.discardPile.slice(0, -1)]);
          game.discardPile = [game.discardPile[game.discardPile.length - 1]];
        }
        nextPlayerObj.hand.push(...newCards);
      }

      // Check for winner
      if (player.hand.length === 0) {
        game.winner = player.socketId;
        game.gameStarted = false;
      }

      await game.save();

      // Emit updates
      io.to(game.roomId).emit('gameUpdate', {
        roomId: game.roomId,
        players: game.players.map(p => ({
          id: p.socketId,
          name: p.username,
          handCount: p.hand.length,
          hasCalledUno: p.hasCalledUno
        })),
        currentPlayer: game.currentPlayer,
        topCard: game.discardPile[game.discardPile.length - 1],
        gameStarted: game.gameStarted,
        winner: game.winner,
        drawCount: game.drawCount
      });

      // Update hands
      game.players.forEach(p => {
        io.to(p.socketId).emit('handUpdate', p.hand);
      });

    } catch (error) {
      console.error('Error playing card:', error);
      socket.emit('error', 'Failed to play card');
    }
  });

  socket.on('drawCard', async () => {
    try {
      const game = await Game.findOne({ 'players.socketId': socket.id });
      
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      const player = game.players.find(p => p.socketId === socket.id);
      if (!player) {
        socket.emit('error', 'Player not found');
        return;
      }

      if (game.currentPlayer !== player.position) {
        socket.emit('error', 'Not your turn');
        return;
      }

      // Draw card
      if (game.deck.length === 0) {
        game.deck = shuffleDeck([...game.discardPile.slice(0, -1)]);
        game.discardPile = [game.discardPile[game.discardPile.length - 1]];
      }
      
      const drawnCard = game.deck.pop();
      player.hand.push(drawnCard);
      
      // Move to next player
      game.currentPlayer = (game.currentPlayer + 1) % game.players.length;

      await game.save();

      // Emit updates
      io.to(game.roomId).emit('gameUpdate', {
        roomId: game.roomId,
        players: game.players.map(p => ({
          id: p.socketId,
          name: p.username,
          handCount: p.hand.length,
          hasCalledUno: p.hasCalledUno
        })),
        currentPlayer: game.currentPlayer,
        topCard: game.discardPile[game.discardPile.length - 1],
        gameStarted: game.gameStarted,
        winner: game.winner,
        drawCount: game.drawCount
      });

      // Update player's hand
      socket.emit('handUpdate', player.hand);

    } catch (error) {
      console.error('Error drawing card:', error);
      socket.emit('error', 'Failed to draw card');
    }
  });

  socket.on('callUno', async () => {
    try {
      const game = await Game.findOne({ 'players.socketId': socket.id });
      
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      const player = game.players.find(p => p.socketId === socket.id);
      if (!player) {
        socket.emit('error', 'Player not found');
        return;
      }

      if (player.hand.length !== 1) {
        socket.emit('error', 'Can only call UNO with one card remaining');
        return;
      }

      player.hasCalledUno = true;
      await game.save();

      io.to(game.roomId).emit('unoCalled', {
        playerId: socket.id,
        playerName: player.username
      });

    } catch (error) {
      console.error('Error calling UNO:', error);
      socket.emit('error', 'Failed to call UNO');
    }
  });

  socket.on('catchUno', async (targetPlayerId) => {
    try {
      const game = await Game.findOne({ 'players.socketId': targetPlayerId });
      
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      const targetPlayer = game.players.find(p => p.socketId === targetPlayerId);
      if (!targetPlayer) {
        socket.emit('error', 'Target player not found');
        return;
      }

      if (targetPlayer.hand.length !== 1 || targetPlayer.hasCalledUno) {
        socket.emit('error', 'Cannot catch UNO from this player');
        return;
      }

      // Draw 2 cards as penalty
      if (game.deck.length < 2) {
        game.deck = shuffleDeck([...game.discardPile.slice(0, -1)]);
        game.discardPile = [game.discardPile[game.discardPile.length - 1]];
      }
      
      const penaltyCards = game.deck.splice(0, 2);
      targetPlayer.hand.push(...penaltyCards);
      
      await game.save();

      io.to(game.roomId).emit('unoCaught', {
        caughtPlayerId: targetPlayerId,
        caughtPlayerName: targetPlayer.username,
        catcherId: socket.id
      });

      // Update caught player's hand
      io.to(targetPlayerId).emit('handUpdate', targetPlayer.hand);

    } catch (error) {
      console.error('Error catching UNO:', error);
      socket.emit('error', 'Failed to catch UNO');
    }
  });
});

// Helper functions for game logic (same as in controller)
const createDeck = () => {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const actions = ['skip', 'reverse', 'draw2'];
  const wilds = ['wild', 'wild4'];
  
  let deck = [];

  colors.forEach(color => {
    deck.push({ color, type: 'number', value: 0 });
    numbers.slice(1).forEach(number => {
      deck.push({ color, type: 'number', value: number });
      deck.push({ color, type: 'number', value: number });
    });
  });

  colors.forEach(color => {
    actions.forEach(action => {
      deck.push({ color, type: 'action', value: action });
      deck.push({ color, type: 'action', value: action });
    });
  });

  wilds.forEach(wild => {
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'wild', type: 'wild', value: wild });
    }
  });

  return shuffleDeck(deck);
};

const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const dealCards = (deck, numPlayers) => {
  const hands = Array(numPlayers).fill().map(() => []);
  
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < numPlayers; j++) {
      hands[j].push(deck.pop());
    }
  }
  
  return hands;
};

// Add helper function to check if a card can be played
const canPlayCard = (card, topCard) => {
  if (card.type === 'wild') return true;
  if (card.color === topCard.color) return true;
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
  if (card.type === 'action' && topCard.type === 'action' && card.value === topCard.value) return true;
  return false;
};

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
