
const express = require('express');
const {
  createGame,
  joinGame,
  startGame,
  playCard,
  drawCard,
  getGame
} = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create', protect, createGame);
router.post('/join', protect, joinGame);
router.post('/:roomId/start', protect, startGame);
router.post('/:roomId/play', protect, playCard);
router.post('/:roomId/draw', protect, drawCard);
router.get('/:roomId', getGame);

module.exports = router;
