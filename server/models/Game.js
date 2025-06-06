
const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  color: {
    type: String,
    enum: ['red', 'blue', 'green', 'yellow', 'wild'],
    required: true
  },
  type: {
    type: String,
    enum: ['number', 'action', 'wild'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be number or string
    required: true
  },
  chosenColor: {
    type: String,
    enum: ['red', 'blue', 'green', 'yellow'],
    default: null
  }
});

const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  hand: [cardSchema],
  handCount: {
    type: Number,
    default: 0
  },
  hasCalledUno: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    required: true
  }
});

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  players: [playerSchema],
  deck: [cardSchema],
  discardPile: [cardSchema],
  currentPlayer: {
    type: Number,
    default: 0
  },
  direction: {
    type: Number,
    default: 1 // 1 for clockwise, -1 for counter-clockwise
  },
  gameStarted: {
    type: Boolean,
    default: false
  },
  gameEnded: {
    type: Boolean,
    default: false
  },
  winner: {
    type: String,
    default: null
  },
  drawCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  maxPlayers: {
    type: Number,
    default: 4,
    min: 2,
    max: 10
  },
  settings: {
    drawStackLimit: {
      type: Number,
      default: 4
    },
    timeLimit: {
      type: Number,
      default: 30 // seconds per turn
    }
  }
}, {
  timestamps: true
});

// Update last activity on save
gameSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('Game', gameSchema);
