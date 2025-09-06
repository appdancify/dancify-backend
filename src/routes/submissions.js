const express = require('express');
const SubmissionController = require('../controllers/submissionController');
// const { authenticateToken } = require('../middleware/auth'); // Uncomment when auth is ready

const router = express.Router();

// Public routes (for now - add auth later)
router.get('/', SubmissionController.getAllSubmissions);
router.get('/:id', SubmissionController.getSubmission);
router.post('/', SubmissionController.createSubmission);

// Review routes (admin only when auth is implemented)
router.put('/:id/review', SubmissionController.reviewSubmission);
router.post('/:id/approve', SubmissionController.approveSubmission);
router.post('/:id/reject', SubmissionController.rejectSubmission);

// User-specific routes (when auth is implemented)
// router.get('/user/:userId', authenticateToken, SubmissionController.getUserSubmissions);

module.exports = router;