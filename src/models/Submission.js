const { supabase, supabaseAdmin } = require('../config/supabase');

class Submission {
  // Create a new submission
  static async create(submissionData) {
    const { data, error } = await supabaseAdmin
      .from('move_submissions')
      .insert([{
        user_id: submissionData.userId,
        move_id: submissionData.moveId,
        title: submissionData.title,
        description: submissionData.description,
        video_url: submissionData.videoUrl,
        thumbnail_url: submissionData.thumbnailUrl,
        duration: submissionData.duration,
        status: 'pending',
        dance_style: submissionData.danceStyle,
        difficulty_level: submissionData.difficultyLevel,
        tags: submissionData.tags || [],
        is_public: submissionData.isPublic || false,
        submission_notes: submissionData.submissionNotes
      }])
      .select(`
        *,
        user_profiles!inner(username, full_name),
        dance_moves!inner(name, dance_style)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Get all submissions with filtering and pagination
  static async findAll(filters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('move_submissions')
      .select(`
        *,
        user_profiles!inner(username, full_name, avatar_url),
        dance_moves!inner(name, dance_style, difficulty)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.danceStyle) {
      query = query.eq('dance_style', filters.danceStyle);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.moveId) {
      query = query.eq('move_id', filters.moveId);
    }
    if (filters.difficultyLevel) {
      query = query.eq('difficulty_level', filters.difficultyLevel);
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

  // Get submission by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('move_submissions')
      .select(`
        *,
        user_profiles!inner(username, full_name, avatar_url),
        dance_moves!inner(name, dance_style, difficulty),
        submission_reviews(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get submissions by user ID
  static async findByUserId(userId, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('move_submissions')
      .select(`
        *,
        dance_moves!inner(name, dance_style, difficulty)
      `, { count: 'exact' })
      .eq('user_id', userId)
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

  // Get submissions by move ID
  static async findByMoveId(moveId, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('move_submissions')
      .select(`
        *,
        user_profiles!inner(username, full_name, avatar_url)
      `, { count: 'exact' })
      .eq('move_id', moveId);

    // Only show approved submissions for public view
    if (options.publicOnly) {
      query = query.eq('status', 'approved').eq('is_public', true);
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

  // Add review to submission
  static async addReview(submissionId, reviewData) {
    // First, add the review record
    const { data: reviewRecord, error: reviewError } = await supabaseAdmin
      .from('submission_reviews')
      .insert([{
        submission_id: submissionId,
        reviewer_id: reviewData.reviewerId,
        status: reviewData.status,
        feedback: reviewData.feedback,
        score: reviewData.score,
        internal_notes: reviewData.internalNotes,
        reviewed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Then, update the submission status
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('move_submissions')
      .update({
        status: reviewData.status,
        reviewed_at: new Date().toISOString(),
        reviewer_id: reviewData.reviewerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select(`
        *,
        user_profiles!inner(username, full_name),
        dance_moves!inner(name, dance_style)
      `)
      .single();

    if (updateError) throw updateError;

    return {
      ...updatedSubmission,
      latest_review: reviewRecord
    };
  }

  // Approve submission
  static async approve(submissionId, feedback = null, reviewerId) {
    const reviewData = {
      reviewerId,
      status: 'approved',
      feedback,
      score: null
    };

    return await this.addReview(submissionId, reviewData);
  }

  // Reject submission
  static async reject(submissionId, reason, feedback = null, reviewerId) {
    const reviewData = {
      reviewerId,
      status: 'rejected',
      feedback: feedback || reason,
      score: null,
      internalNotes: `Rejection reason: ${reason}`
    };

    return await this.addReview(submissionId, reviewData);
  }

  // Update submission
  static async update(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('move_submissions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user_profiles!inner(username, full_name),
        dance_moves!inner(name, dance_style)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete submission (soft delete)
  static async delete(id) {
    const { data, error } = await supabaseAdmin
      .from('move_submissions')
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

  // Get submission statistics
  static async getStats(filters = {}) {
    try {
      let query = supabase
        .from('move_submissions')
        .select('status, created_at, dance_style');

      // Apply filters
      if (filters.danceStyle) {
        query = query.eq('dance_style', filters.danceStyle);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(s => s.status === 'pending').length || 0,
        approved: data?.filter(s => s.status === 'approved').length || 0,
        rejected: data?.filter(s => s.status === 'rejected').length || 0,
        under_review: data?.filter(s => s.status === 'under_review').length || 0
      };

      // Calculate approval rate
      const reviewed = stats.approved + stats.rejected;
      stats.approvalRate = reviewed > 0 ? (stats.approved / reviewed * 100).toFixed(1) : 0;

      return stats;
    } catch (error) {
      console.error('Error getting submission stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        under_review: 0,
        approvalRate: 0
      };
    }
  }

  // Get recent submissions
  static async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from('move_submissions')
      .select(`
        *,
        user_profiles!inner(username, full_name),
        dance_moves!inner(name, dance_style)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Search submissions
  static async search(query, options = {}) {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('move_submissions')
      .select(`
        *,
        user_profiles!inner(username, full_name),
        dance_moves!inner(name, dance_style)
      `, { count: 'exact' })
      .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
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

  // Bulk update submissions
  static async bulkUpdateStatus(submissionIds, status, reviewerId) {
    const { data, error } = await supabaseAdmin
      .from('move_submissions')
      .update({
        status,
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', submissionIds)
      .select();

    if (error) throw error;
    return data;
  }
}

module.exports = Submission;