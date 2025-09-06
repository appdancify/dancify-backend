const express = require('express');
const AdminController = require('../controllers/adminController');
// const { authenticateAdmin } = require('../middleware/auth'); // Uncomment when auth is ready

const router = express.Router();

// Dashboard & Analytics routes
router.get('/dashboard', AdminController.getDashboardStats);
router.get('/analytics', AdminController.getAnalytics);

// Move management routes (admin only)
router.get('/moves', AdminController.getAllMoves);
router.post('/moves', AdminController.createMove);
router.put('/moves/:id', AdminController.updateMove);
router.delete('/moves/:id', AdminController.deleteMove);

// User management routes
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Dance style management
router.get('/dance-styles', AdminController.getAllDanceStyles);
router.post('/dance-styles', AdminController.createDanceStyle);
router.put('/dance-styles/:id', AdminController.updateDanceStyle);
router.delete('/dance-styles/:id', AdminController.deleteDanceStyle);

// Move submission management
router.get('/move-submissions', AdminController.getMoveSubmissions);
router.get('/move-submissions/:id', AdminController.getMoveSubmission);
router.post('/move-submissions/:id/review', AdminController.reviewMoveSubmission);
router.post('/move-submissions/:id/approve', AdminController.approveMoveSubmission);
router.post('/move-submissions/:id/reject', AdminController.rejectMoveSubmission);

module.exports = router;