// 7. src/routes/admin.js (Updated)
// ================================================================
const express = require('express');
const AdminController = require('../controllers/adminController');

const router = express.Router();

// Admin routes (no auth for now - add later)
router.get('/moves', AdminController.getAllMoves);
router.post('/moves', AdminController.createMove);
router.put('/moves/:id', AdminController.updateMove);
router.delete('/moves/:id', AdminController.deleteMove);

module.exports = router;