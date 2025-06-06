
const Game = require('../models/Game');
const User = require('../models/User');

// UNO Game Logic Helper Functions
const createDeck = () => {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const actions = ['skip', 'reverse', 'draw2'];
  const wilds = ['wild', 'wild4'];
  
  let deck = [];

  // Add number cards (0 has 1 copy, 1-9 have 2 copies each)
  colors.forEach(color => {
    deck.push({ color, type: 'number', value: 0 });
    numbers.slice(1).forEach(number => {
      deck.push({ color, type: 'number', value: number });
      deck.push({ color, type: 'number', value: number });
    });
  });

  // Add action cards (2 copies each)
  colors.forEach(color => {
    actions.forEach(action => {
      deck.push({ color, type: 'action', value: action });
      deck.push({ color, type: 'action', value: action });
    });
  });

  // Add wild cards (4 copies each)
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

const canPlayCard = (card, topCard) => {
  if (card.type === 'wild') return true;
  if (topCard.type === 'wild') return card.color === topCard.chosenColor;
  return card.color === topCard.color || card.value === topCard.value;
};

// @desc    Create a new game
// @route   POST /api/games/create
// @access  Private
const createGame = async (req, res, next) => {
  try {
    const { maxPlayers = 4 } = req.body;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const game = await Game.create({
      roomId,
      maxPlayers,
      players: [{
        userId: req.user.id,
        username: req.user.username,
        socketId: req.body.socketId || '',
        hand: [],
        position: 0
      }]
    });

    res.status(201).json({
      success: true,
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
    next(error);
  }
};

// @desc    Join a game
// @route   POST /api/games/join
// @access  Private
const joinGame = async (req, res, next) => {
  try {
    const { roomId, socketId } = req.body;

    const game = await Game.findOne({ roomId });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (game.gameStarted) {
      return res.status(400).json({
        success: false,
        message: 'Game has already started'
      });
    }

    if (game.players.length >= game.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Game is full'
      });
    }

    // Check if user is already in the game
    const existingPlayer = game.players.find(p => p.userId.toString() === req.user.id);
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this game'
      });
    }

    game.players.push({
      userId: req.user.id,
      username: req.user.username,
      socketId,
      hand: [],
      position: game.players.length
    });

    await game.save();

    res.status(200).json({
      success: true,
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
    next(error);
  }
};

// @desc    Start a game
// @route   POST /api/games/:roomId/start
// @access  Private
const startGame = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (game.players.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 players to start'
      });
    }

    if (game.gameStarted) {
      return res.status(400).json({
        success: false,
        message: 'Game has already started'
      });
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

    res.status(200).json({
      success: true,
      game: {
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
      },
      hands: game.players.map(p => p.hand)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Play a card
// @route   POST /api/games/:roomId/play
// @access  Private
const playCard = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { cardIndex, chosenColor } = req.body;

    const game = await Game.findOne({ roomId });

    if (!game || !game.gameStarted) {
      return res.status(400).json({
        success: false,
        message: 'Game not found or not started'
      });
    }

    const currentPlayer = game.players[game.currentPlayer];
    
    if (currentPlayer.userId.toString() !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Not your turn'
      });
    }

    const card = currentPlayer.hand[cardIndex];
    const topCard = game.discardPile[game.discardPile.length - 1];

    if (!canPlayCard(card, topCard)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot play this card'
      });
    }

    // Remove card from player's hand
    currentPlayer.hand.splice(cardIndex, 1);
    currentPlayer.handCount = currentPlayer.hand.length;

    // Add card to discard pile
    if (card.type === 'wild') {
      card.chosenColor = chosenColor;
    }
    game.discardPile.push(card);

    // Reset UNO call
    currentPlayer.hasCalledUno = false;

    // Check for win condition
    if (currentPlayer.hand.length === 0) {
      game.gameEnded = true;
      game.winner = currentPlayer.username;
      
      // Update user stats
      await User.findByIdAndUpdate(currentPlayer.userId, {
        $inc: { gamesWon: 1, gamesPlayed: 1 }
      });
    }

    // Handle card effects and move to next player
    let nextPlayer = game.currentPlayer;
    
    if (card.value === 'skip') {
      nextPlayer = (nextPlayer + game.direction + game.players.length) % game.players.length;
    } else if (card.value === 'reverse') {
      game.direction *= -1;
      if (game.players.length === 2) {
        nextPlayer = (nextPlayer + game.direction + game.players.length) % game.players.length;
      }
    } else if (card.value === 'draw2') {
      nextPlayer = (nextPlayer + game.direction + game.players.length) % game.players.length;
      // Draw 2 cards for next player
      for (let i = 0; i < 2; i++) {
        if (game.deck.length === 0) {
          // Reshuffle discard pile into deck
          const newDeck = game.discardPile.slice(0, -1);
          game.deck = shuffleDeck(newDeck);
          game.discardPile = [game.discardPile[game.discardPile.length - 1]];
        }
        game.players[nextPlayer].hand.push(game.deck.pop());
      }
      game.players[nextPlayer].handCount = game.players[nextPlayer].hand.length;
    } else if (card.value === 'wild4') {
      nextPlayer = (nextPlayer + game.direction + game.players.length) % game.players.length;
      // Draw 4 cards for next player
      for (let i = 0; i < 4; i++) {
        if (game.deck.length === 0) {
          const newDeck = game.discardPile.slice(0, -1);
          game.deck = shuffleDeck(newDeck);
          game.discardPile = [game.discardPile[game.discardPile.length - 1]];
        }
        game.players[nextPlayer].hand.push(game.deck.pop());
      }
      game.players[nextPlayer].handCount = game.players[nextPlayer].hand.length;
    }

    if (!game.gameEnded) {
      nextPlayer = (nextPlayer + game.direction + game.players.length) % game.players.length;
      game.currentPlayer = nextPlayer;
    }

    await game.save();

    res.status(200).json({
      success: true,
      game: {
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
      },
      hands: game.players.map(p => p.hand)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Draw a card
// @route   POST /api/games/:roomId/draw
// @access  Private
const drawCard = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId });

    if (!game || !game.gameStarted) {
      return res.status(400).json({
        success: false,
        message: 'Game not found or not started'
      });
    }

    const currentPlayer = game.players[game.currentPlayer];
    
    if (currentPlayer.userId.toString() !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Not your turn'
      });
    }

    // Check if deck is empty
    if (game.deck.length === 0) {
      const newDeck = game.discardPile.slice(0, -1);
      game.deck = shuffleDeck(newDeck);
      game.discardPile = [game.discardPile[game.discardPile.length - 1]];
    }

    // Draw card
    const drawnCard = game.deck.pop();
    currentPlayer.hand.push(drawnCard);
    currentPlayer.handCount = currentPlayer.hand.length;

    // Move to next player
    game.currentPlayer = (game.currentPlayer + game.direction + game.players.length) % game.players.length;

    await game.save();

    res.status(200).json({
      success: true,
      game: {
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
      },
      hands: game.players.map(p => p.hand)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get game state
// @route   GET /api/games/:roomId
// @access  Public
const getGame = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.status(200).json({
      success: true,
      game: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGame,
  joinGame,
  startGame,
  playCard,
  drawCard,
  getGame
};
