const express = require('express');
const DanceStyleController = require('../controllers/danceStyleController');

const router = express.Router();

// Public routes for dance styles
router.get('/', DanceStyleController.getAllDanceStyles);
router.get('/:id', DanceStyleController.getDanceStyle);

// Public route to get sections for a dance style
router.get('/:danceStyle/sections', DanceStyleController.getSections);

module.exports = router;