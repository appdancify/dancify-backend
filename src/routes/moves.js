const express = require('express');
const MoveController = require('../controllers/moveController');

const router = express.Router();

// Public routes for dance moves
router.get('/', MoveController.getAllMoves);
router.get('/sections/:danceStyle', MoveController.getSections);
router.get('/:id', MoveController.getMove);

module.exports = router;