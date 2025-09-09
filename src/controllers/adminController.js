const DanceMove = require('../models/DanceMove');
const DanceStyle = require('../models/DanceStyle');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { supabase } = require('../config/supabase');

class AdminController {
  // GET /api/admin/dashboard - Get dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      // Get all stats in parallel
      const [movesStats, usersStats, submissionsStats, stylesStats] = await Promise.all([
        // Moves statistics
        supabase
          .from('dance_moves')
          .select('id, is_active, created_at')
          .eq('is_active', true),
        
        // Users statistics
        supabase
          .from('user_profiles')
          .select('id, created_at, is_active')
          .eq('is_active', true),
        
        // Submissions statistics
        supabase
          .from('move_submissions')
          .select('id, status, created_at'),
        
        // Dance styles statistics
        supabase
          .from('dance_styles')
          .select('id, is_active, created_at')
          .eq('is_active', true)
      ]);

      // Calculate totals and changes
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const stats = {
        totalUsers: usersStats.data?.length || 0,
        totalMoves: movesStats.data?.length || 0,
        totalSubmissions: submissionsStats.data?.length || 0,
        totalDanceStyles: stylesStats.data?.length || 0,
        pendingSubmissions: submissionsStats.data?.filter(s => s.status === 'pending').length || 0,
        approvedSubmissions: submissionsStats.data?.filter(s => s.status === 'approved').length || 0,
        rejectedSubmissions: submissionsStats.data?.filter(s => s.status === 'rejected').length || 0,
        newUsersThisMonth: usersStats.data?.filter(u => new Date(u.created_at) > lastMonth).length || 0,
        newMovesThisMonth: movesStats.data?.filter(m => new Date(m.created_at) > lastMonth).length || 0
      };

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      res.json({
        success: true,
        data: {
          stats,
          recentActivity: recentActivity || []
        },
        message: 'Dashboard data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard statistics',
        message: error.message
      });
    }
  }

  // GET /api/admin/analytics - Get analytics data
  static async getAnalytics(req, res) {
    try {
      // Get user growth over last 12 months
      const { data: userGrowth } = await supabase
        .rpc('get_user_growth_by_month');

      // Get popular moves
      const { data: popularMoves } = await supabase
        .from('dance_moves')
        .select('name, view_count, submission_count')
        .order('view_count', { ascending: false })
        .limit(10);

      // Get dance style popularity
      const { data: stylePopularity } = await supabase
        .from('dance_styles')
        .select('name, (dance_moves(count))')
        .order('dance_moves.count', { ascending: false });

      // Get submission trends
      const { data: submissionTrends } = await supabase
        .rpc('get_submission_trends_by_week');

      res.json({
        success: true,
        data: {
          userGrowth: userGrowth || [],
          popularMoves: popularMoves || [],
          stylePopularity: stylePopularity || [],
          submissionTrends: submissionTrends || []
        },
        message: 'Analytics data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics data',
        message: error.message
      });
    }
  }

  // GET /api/admin/moves - Get all moves (admin view)
  static async getAllMoves(req, res) {
    try {
      const filters = {
        danceStyle: req.query.dance_style,
        section: req.query.section,
        difficulty: req.query.difficulty,
        minLevel: req.query.min_level ? parseInt(req.query.min_level) : undefined,
        maxLevel: req.query.max_level ? parseInt(req.query.max_level) : undefined,
        includeInactive: req.query.include_inactive === 'true'
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) delete filters[key];
      });

      const moves = await DanceMove.findAll(filters);

      res.json({
        success: true,
        data: moves,
        count: moves.length,
        message: `Retrieved ${moves.length} dance moves`
      });
    } catch (error) {
      console.error('Error fetching moves:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dance moves',
        message: error.message
      });
    }
  }

  // POST /api/admin/moves - Create new move
  static async createMove(req, res) {
    try {
      const moveData = req.body;

      // Validate required fields (using frontend field names)
      const requiredFields = ['name', 'description', 'detailed_instructions', 'dance_style', 'section', 'difficulty'];
      const missingFields = requiredFields.filter(field => !moveData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields
        });
      }

      // Map frontend field names to backend field names
      const mappedMoveData = {
        name: moveData.name,
        description: moveData.description,
        detailedInstructions: moveData.detailed_instructions,
        danceStyle: moveData.dance_style,
        section: moveData.section,
        subsection: moveData.subsection,
        difficulty: moveData.difficulty,
        xpReward: moveData.xp_reward || 50,
        videoUrl: moveData.video_url,
        levelRequired: moveData.level_required || 1,
        estimatedDuration: moveData.estimated_duration || 10,
        equipment: moveData.equipment || [],
        moveType: moveData.move_type || 'time',
        targetRepetitions: moveData.target_repetitions,
        recordingTimeLimit: moveData.recording_time_limit,
        keyTechniques: moveData.key_techniques || [],
        prerequisites: moveData.prerequisites || [],
        instructorId: moveData.instructor_id,
        instructorName: moveData.instructor_name
      };

      // Extract and validate YouTube video
      if (mappedMoveData.videoUrl) {
        const videoId = DanceMove.extractYouTubeId(mappedMoveData.videoUrl);
        if (videoId) {
          mappedMoveData.videoId = videoId;
          mappedMoveData.thumbnailUrl = DanceMove.generateThumbnailUrl(videoId);
        }
      }

      const newMove = await DanceMove.create(mappedMoveData);

      res.status(201).json({
        success: true,
        data: newMove,
        message: 'Dance move created successfully'
      });
    } catch (error) {
      console.error('Error creating move:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create dance move',
        message: error.message
      });
    }
  }

  // PUT /api/admin/moves/:id - Update move
  static async updateMove(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Map frontend field names to backend field names
      const mappedUpdateData = {
        name: updateData.name,
        description: updateData.description,
        detailedInstructions: updateData.detailed_instructions,
        danceStyle: updateData.dance_style,
        section: updateData.section,
        subsection: updateData.subsection,
        difficulty: updateData.difficulty,
        xpReward: updateData.xp_reward,
        videoUrl: updateData.video_url,
        levelRequired: updateData.level_required,
        estimatedDuration: updateData.estimated_duration,
        equipment: updateData.equipment,
        moveType: updateData.move_type,
        targetRepetitions: updateData.target_repetitions,
        recordingTimeLimit: updateData.recording_time_limit,
        keyTechniques: updateData.key_techniques,
        prerequisites: updateData.prerequisites,
        instructorId: updateData.instructor_id,
        instructorName: updateData.instructor_name
      };

      // Remove undefined values
      Object.keys(mappedUpdateData).forEach(key => {
        if (mappedUpdateData[key] === undefined) delete mappedUpdateData[key];
      });

      // Handle video URL updates
      if (mappedUpdateData.videoUrl) {
        const videoId = DanceMove.extractYouTubeId(mappedUpdateData.videoUrl);
        if (videoId) {
          mappedUpdateData.videoId = videoId;
          mappedUpdateData.thumbnailUrl = DanceMove.generateThumbnailUrl(videoId);
        }
      }

      const updatedMove = await DanceMove.update(id, mappedUpdateData);

      if (!updatedMove) {
        return res.status(404).json({
          success: false,
          error: 'Dance move not found'
        });
      }

      res.json({
        success: true,
        data: updatedMove,
        message: 'Dance move updated successfully'
      });
    } catch (error) {
      console.error('Error updating move:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update dance move',
        message: error.message
      });
    }
  }

  // DELETE /api/admin/moves/:id - Delete move
  static async deleteMove(req, res) {
    try {
      const { id } = req.params;
      const deletedMove = await DanceMove.delete(id);

      if (!deletedMove) {
        return res.status(404).json({
          success: false,
          error: 'Dance move not found'
        });
      }

      res.json({
        success: true,
        data: deletedMove,
        message: 'Dance move deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting move:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete dance move',
        message: error.message
      });
    }
  }

  // GET /api/admin/users - Get all users
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const { data: users, error, count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: users || [],
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        },
        message: `Retrieved ${users?.length || 0} users`
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  }

  // GET /api/admin/users/:id - Get specific user
  static async getUser(req, res) {
    try {
      const { id } = req.params;
      
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'User retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
        message: error.message
      });
    }
  }

  // PUT /api/admin/users/:id - Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data: updatedUser, error } = await supabase
        .from('user_profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        message: error.message
      });
    }
  }

  // DELETE /api/admin/users/:id - Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const { data: deletedUser, error } = await supabase
        .from('user_profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: deletedUser,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        message: error.message
      });
    }
  }

  // GET /api/admin/dance-styles - Get all dance styles
  static async getAllDanceStyles(req, res) {
    try {
      const styles = await DanceStyle.findAll();

      res.json({
        success: true,
        data: styles,
        count: styles.length,
        message: `Retrieved ${styles.length} dance styles`
      });
    } catch (error) {
      console.error('Error fetching dance styles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dance styles',
        message: error.message
      });
    }
  }

  // POST /api/admin/dance-styles - Create dance style
  static async createDanceStyle(req, res) {
    try {
      const styleData = req.body;

      // Validate required fields
      const requiredFields = ['name', 'description'];
      const missingFields = requiredFields.filter(field => !styleData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields
        });
      }

      const newStyle = await DanceStyle.create(styleData);

      res.status(201).json({
        success: true,
        data: newStyle,
        message: 'Dance style created successfully'
      });
    } catch (error) {
      console.error('Error creating dance style:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create dance style',
        message: error.message
      });
    }
  }

  // PUT /api/admin/dance-styles/:id - Update dance style
  static async updateDanceStyle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedStyle = await DanceStyle.update(id, updateData);

      if (!updatedStyle) {
        return res.status(404).json({
          success: false,
          error: 'Dance style not found'
        });
      }

      res.json({
        success: true,
        data: updatedStyle,
        message: 'Dance style updated successfully'
      });
    } catch (error) {
      console.error('Error updating dance style:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update dance style',
        message: error.message
      });
    }
  }

  // DELETE /api/admin/dance-styles/:id - Delete dance style
  static async deleteDanceStyle(req, res) {
    try {
      const { id } = req.params;
      const deletedStyle = await DanceStyle.delete(id);

      if (!deletedStyle) {
        return res.status(404).json({
          success: false,
          error: 'Dance style not found'
        });
      }

      res.json({
        success: true,
        data: deletedStyle,
        message: 'Dance style deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting dance style:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete dance style',
        message: error.message
      });
    }
  }

  // GET /api/admin/move-submissions - Get move submissions
  static async getMoveSubmissions(req, res) {
    try {
      const filters = {
        status: req.query.status,
        danceStyle: req.query.dance_style,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const submissions = await Submission.findAll(filters);

      res.json({
        success: true,
        data: submissions.data,
        pagination: submissions.pagination,
        message: `Retrieved ${submissions.data.length} submissions`
      });
    } catch (error) {
      console.error('Error fetching move submissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch move submissions',
        message: error.message
      });
    }
  }

  // GET /api/admin/move-submissions/:id - Get specific submission
  static async getMoveSubmission(req, res) {
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

  // POST /api/admin/move-submissions/:id/review - Review submission
  static async reviewMoveSubmission(req, res) {
    try {
      const { id } = req.params;
      const reviewData = req.body;

      const reviewedSubmission = await Submission.addReview(id, reviewData);

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

  // POST /api/admin/move-submissions/:id/approve - Approve submission
  static async approveMoveSubmission(req, res) {
    try {
      const { id } = req.params;
      const { feedback } = req.body;

      const approvedSubmission = await Submission.approve(id, feedback);

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

  // POST /api/admin/move-submissions/:id/reject - Reject submission
  static async rejectMoveSubmission(req, res) {
    try {
      const { id } = req.params;
      const { reason, feedback } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        });
      }

      const rejectedSubmission = await Submission.reject(id, reason, feedback);

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
}

module.exports = AdminController;