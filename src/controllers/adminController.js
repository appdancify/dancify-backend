const { supabase, supabaseAdmin } = require('../config/supabase');
const DanceMove = require('../models/DanceMove');
const DanceStyle = require('../models/DanceStyle');
const User = require('../models/User');

class AdminController {
  // Dashboard & Analytics
  static async getDashboardStats(req, res) {
    try {
      // Get total counts
      const { data: moveCount, error: moveError } = await supabase
        .from('dance_moves')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      const { data: userCount, error: userError } = await supabase
        .from('users')
        .select('id', { count: 'exact' });

      const { data: submissionCount, error: submissionError } = await supabase
        .from('move_submissions')
        .select('id', { count: 'exact' });

      const { data: styleCount, error: styleError } = await supabase
        .from('dance_styles')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      if (moveError || userError || submissionError || styleError) {
        throw new Error('Failed to fetch dashboard stats');
      }

      // Get recent activity
      const { data: recentMoves, error: recentMovesError } = await supabase
        .from('dance_moves')
        .select('id, name, created_at, dance_style')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentSubmissions, error: recentSubmissionsError } = await supabase
        .from('move_submissions')
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      const stats = {
        totalMoves: moveCount?.length || 0,
        totalUsers: userCount?.length || 0,
        totalSubmissions: submissionCount?.length || 0,
        totalStyles: styleCount?.length || 0,
        recentMoves: recentMoves || [],
        recentSubmissions: recentSubmissions || []
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getAnalytics(req, res) {
    try {
      // Get analytics data for charts
      const { data: movesByStyle, error: styleError } = await supabase
        .from('dance_moves')
        .select('dance_style')
        .eq('is_active', true);

      const { data: submissionsByMonth, error: submissionError } = await supabase
        .from('move_submissions')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      // Process data for charts
      const styleDistribution = {};
      movesByStyle?.forEach(move => {
        styleDistribution[move.dance_style] = (styleDistribution[move.dance_style] || 0) + 1;
      });

      const monthlySubmissions = {};
      submissionsByMonth?.forEach(submission => {
        const month = new Date(submission.created_at).toISOString().substring(0, 7);
        monthlySubmissions[month] = (monthlySubmissions[month] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          styleDistribution,
          monthlySubmissions
        }
      });

    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Dance Move Management
  static async getAllMoves(req, res) {
    try {
      const { page = 1, limit = 20, dance_style, difficulty, section } = req.query;
      
      let query = supabaseAdmin
        .from('dance_moves')
        .select('*')
        .order('created_at', { ascending: false });

      if (dance_style) {
        query = query.eq('dance_style', dance_style);
      }
      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }
      if (section) {
        query = query.eq('section', section);
      }

      const { data: moves, error } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: moves || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: moves?.length || 0
        }
      });

    } catch (error) {
      console.error('Get moves error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async createMove(req, res) {
    try {
      const move = await DanceMove.create(req.body);
      res.status(201).json({
        success: true,
        data: move
      });
    } catch (error) {
      console.error('Create move error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async updateMove(req, res) {
    try {
      const move = await DanceMove.update(req.params.id, req.body);
      res.json({
        success: true,
        data: move
      });
    } catch (error) {
      console.error('Update move error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async deleteMove(req, res) {
    try {
      const move = await DanceMove.delete(req.params.id);
      res.json({
        success: true,
        data: move
      });
    } catch (error) {
      console.error('Delete move error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Dance Style Management - FIXED IMPLEMENTATION
  static async getAllDanceStyles(req, res) {
    try {
      const { includeStats = 'true' } = req.query;
      const styles = await DanceStyle.findAllAdmin({ 
        includeStats: includeStats === 'true' 
      });
      
      res.json({
        success: true,
        data: styles
      });
    } catch (error) {
      console.error('Get dance styles error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async createDanceStyle(req, res) {
    try {
      const style = await DanceStyle.create(req.body);
      res.status(201).json({
        success: true,
        data: style
      });
    } catch (error) {
      console.error('Create dance style error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async updateDanceStyle(req, res) {
    try {
      const style = await DanceStyle.update(req.params.id, req.body);
      res.json({
        success: true,
        data: style
      });
    } catch (error) {
      console.error('Update dance style error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async deleteDanceStyle(req, res) {
    try {
      const style = await DanceStyle.delete(req.params.id);
      res.json({
        success: true,
        data: style
      });
    } catch (error) {
      console.error('Delete dance style error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // User Management
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, status } = req.query;
      
      let query = supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (role) {
        query = query.eq('role', role);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data: users, error } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: users || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users?.length || 0
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getUser(req, res) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Move Submission Management
  static async getMoveSubmissions(req, res) {
    try {
      const { page = 1, limit = 20, status, move_id } = req.query;
      
      let query = supabaseAdmin
        .from('move_submissions')
        .select(`
          *,
          users (id, username, email),
          dance_moves (id, name)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (move_id) {
        query = query.eq('move_id', move_id);
      }

      const { data: submissions, error } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        data: submissions || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: submissions?.length || 0
        }
      });

    } catch (error) {
      console.error('Get submissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getMoveSubmission(req, res) {
    try {
      const { data: submission, error } = await supabaseAdmin
        .from('move_submissions')
        .select(`
          *,
          users (id, username, email),
          dance_moves (id, name)
        `)
        .eq('id', req.params.id)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Get submission error:', error);
      res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }
  }

  static async reviewMoveSubmission(req, res) {
    try {
      const { rating, feedback, status } = req.body;
      
      const { data: submission, error } = await supabaseAdmin
        .from('move_submissions')
        .update({
          status: status || 'reviewed',
          rating,
          feedback,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Review submission error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async approveMoveSubmission(req, res) {
    try {
      const { data: submission, error } = await supabaseAdmin
        .from('move_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Approve submission error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async rejectMoveSubmission(req, res) {
    try {
      const { reason } = req.body;
      
      const { data: submission, error } = await supabaseAdmin
        .from('move_submissions')
        .update({
          status: 'rejected',
          feedback: reason,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Reject submission error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Utility method to seed initial dance styles
  static async seedDanceStyles(req, res) {
    try {
      const styles = await DanceStyle.seedInitialStyles();
      res.status(201).json({
        success: true,
        data: styles,
        message: 'Initial dance styles created successfully'
      });
    } catch (error) {
      console.error('Seed dance styles error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AdminController;