const Submission = require('../models/Submission');

class SubmissionController {
  // GET /api/submissions - Get all submissions
  static async getAllSubmissions(req, res) {
    try {
      const filters = {
        status: req.query.status,
        danceStyle: req.query.dance_style,
        userId: req.query.user_id,
        moveId: req.query.move_id,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await Submission.findAll(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Retrieved ${result.data.length} submissions`
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch submissions',
        message: error.message
      });
    }
  }

  // GET /api/submissions/:id - Get specific submission
  static async getSubmission(req, res) {
    try {
      const { id } = req.params;
      const submission = await Submission.findById(id);

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
      }

      res.json({
        success: true,
        data: submission,
        message: 'Submission retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch submission',
        message: error.message
      });
    }
  }

  // POST /api/submissions - Create new submission
  static async createSubmission(req, res) {
    try {
      const submissionData = req.body;

      // Validate required fields
      const requiredFields = ['userId', 'moveId', 'videoUrl', 'title'];
      const missingFields = requiredFields.filter(field => !submissionData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields
        });
      }

      const newSubmission = await Submission.create(submissionData);

      res.status(201).json({
        success: true,
        data: newSubmission,
        message: 'Submission created successfully'
      });
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create submission',
        message: error.message
      });
    }
  }

  // PUT /api/submissions/:id/review - Review submission
  static async reviewSubmission(req, res) {
    try {
      const { id } = req.params;
      const reviewData = req.body;

      // Validate required fields for review
      const requiredFields = ['status', 'reviewerId'];
      const missingFields = requiredFields.filter(field => !reviewData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required review fields',
          missing_fields: missingFields
        });
      }

      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'under_review'];
      if (!validStatuses.includes(reviewData.status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          valid_statuses: validStatuses
        });
      }

      const reviewedSubmission = await Submission.addReview(id, reviewData);

      if (!reviewedSubmission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
      }

      res.json({
        success: true,
        data: reviewedSubmission,
        message: 'Submission reviewed successfully'
      });
    } catch (error) {
      console.error('Error reviewing submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to review submission',
        message: error.message
      });
    }
  }

  // POST /api/submissions/:id/approve - Approve submission
  static async approveSubmission(req, res) {
    try {
      const { id } = req.params;
      const { feedback, reviewerId } = req.body;

      if (!reviewerId) {
        return res.status(400).json({
          success: false,
          error: 'Reviewer ID is required'
        });
      }

      const approvedSubmission = await Submission.approve(id, feedback, reviewerId);

      if (!approvedSubmission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
      }

      res.json({
        success: true,
        data: approvedSubmission,
        message: 'Submission approved successfully'
      });
    } catch (error) {
      console.error('Error approving submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve submission',
        message: error.message
      });
    }
  }

  // POST /api/submissions/:id/reject - Reject submission
  static async rejectSubmission(req, res) {
    try {
      const { id } = req.params;
      const { reason, feedback, reviewerId } = req.body;

      if (!reason || !reviewerId) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason and reviewer ID are required'
        });
      }

      const rejectedSubmission = await Submission.reject(id, reason, feedback, reviewerId);

      if (!rejectedSubmission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
      }

      res.json({
        success: true,
        data: rejectedSubmission,
        message: 'Submission rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject submission',
        message: error.message
      });
    }
  }

  // GET /api/submissions/user/:userId - Get user's submissions (when auth is implemented)
  static async getUserSubmissions(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await Submission.findByUserId(userId, { page, limit });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Retrieved ${result.data.length} submissions for user`
      });
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user submissions',
        message: error.message
      });
    }
  }
}

module.exports = SubmissionController;