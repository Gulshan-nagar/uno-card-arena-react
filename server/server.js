
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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
