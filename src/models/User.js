const { supabase, supabaseAdmin } = require('../config/supabase');

class User {
  // Create a new user profile
  static async create(userData) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert([{
        user_id: userData.userId,
        username: userData.username,
        full_name: userData.fullName,
        email: userData.email,
        avatar_url: userData.avatarUrl,
        bio: userData.bio,
        location: userData.location,
        birth_date: userData.birthDate,
        preferred_dance_styles: userData.preferredDanceStyles || [],
        skill_level: userData.skillLevel || 'beginner',
        role: userData.role || 'user',
        is_instructor: userData.isInstructor || false,
        is_verified: userData.isVerified || false,
        privacy_settings: userData.privacySettings || {
          profile_public: true,
          show_progress: false,
          show_submissions: true
        }
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all users with filtering and pagination
  static async findAll(filters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.skillLevel) {
      query = query.eq('skill_level', filters.skillLevel);
    }
    if (filters.isInstructor !== undefined) {
      query = query.eq('is_instructor', filters.isInstructor);
    }
    if (filters.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified);
    }
    if (filters.danceStyle) {
      query = query.contains('preferred_dance_styles', [filters.danceStyle]);
    }

    // Search by name or username
    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%, full_name.ilike.%${filters.search}%`);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  // Get user by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Get user by user_id (Supabase auth ID)
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Get user by username
  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Get user by email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Update user
  static async update(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Soft delete user
  static async delete(id) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get user statistics
  static async getUserStats(userId) {
    try {
      // Get submission count
      const { data: submissions, error: submissionError } = await supabase
        .from('move_submissions')
        .select('status', { count: 'exact' })
        .eq('user_id', userId);

      if (submissionError) throw submissionError;

      // Get progress records
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Calculate stats
      const stats = {
        totalSubmissions: submissions?.length || 0,
        approvedSubmissions: submissions?.filter(s => s.status === 'approved').length || 0,
        pendingSubmissions: submissions?.filter(s => s.status === 'pending').length || 0,
        rejectedSubmissions: submissions?.filter(s => s.status === 'rejected').length || 0,
        totalProgress: progress?.length || 0,
        completedMoves: progress?.filter(p => p.is_completed).length || 0,
        totalXP: progress?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalSubmissions: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0,
        rejectedSubmissions: 0,
        totalProgress: 0,
        completedMoves: 0,
        totalXP: 0
      };
    }
  }

  // Get user progress
  static async getUserProgress(userId, options = {}) {
    let query = supabase
      .from('user_progress')
      .select(`
        *,
        dance_moves!inner(name, dance_style, difficulty, xp_reward)
      `)
      .eq('user_id', userId);

    if (options.danceStyle) {
      query = query.eq('dance_moves.dance_style', options.danceStyle);
    }

    if (options.isCompleted !== undefined) {
      query = query.eq('is_completed', options.isCompleted);
    }

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  // Update user role
  static async updateRole(id, role) {
    const validRoles = ['user', 'instructor', 'admin', 'moderator'];
    
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Verify user
  static async verify(id, isVerified = true) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get instructors
  static async getInstructors(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('is_instructor', true)
      .eq('is_active', true);

    if (options.isVerified !== undefined) {
      query = query.eq('is_verified', options.isVerified);
    }

    if (options.danceStyle) {
      query = query.contains('preferred_dance_styles', [options.danceStyle]);
    }

    query = query.order('created_at', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  // Search users
  static async search(query, options = {}) {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .or(`username.ilike.%${query}%, full_name.ilike.%${query}%, bio.ilike.%${query}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  // Get recent users
  static async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get user activity
  static async getUserActivity(userId, options = {}) {
    const limit = options.limit || 50;
    
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Update user preferences
  static async updatePreferences(userId, preferences) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        preferred_dance_styles: preferences.danceStyles,
        privacy_settings: preferences.privacy,
        notification_settings: preferences.notifications,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = User;