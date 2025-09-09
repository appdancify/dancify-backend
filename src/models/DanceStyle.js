const { supabase, supabaseAdmin } = require('../config/supabase');

class DanceStyle {
  // Create a new dance style
  static async create(styleData) {
    const { data, error } = await supabaseAdmin
      .from('dance_styles')
      .insert([{
        name: styleData.name,
        description: styleData.description,
        icon: styleData.icon || '💃',
        color: styleData.color || '#FF6B9D',
        difficulty_level: styleData.difficultyLevel || 'beginner',
        popularity_score: styleData.popularityScore || 0,
        is_featured: styleData.isFeatured || false,
        instructor_id: styleData.instructorId,
        estimated_duration: styleData.estimatedDuration || 30,
        equipment_needed: styleData.equipmentNeeded || [],
        cultural_origin: styleData.culturalOrigin,
        music_genres: styleData.musicGenres || [],
        key_characteristics: styleData.keyCharacteristics || []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all dance styles with optional stats (ADMIN VERSION)
  static async findAllAdmin(options = {}) {
    let query = supabaseAdmin
      .from('dance_styles')
      .select('*')
      .order('created_at', { ascending: false }); // Admin sees all, including inactive

    const { data, error } = await query;
    if (error) throw error;

    // Include stats if requested
    if (options.includeStats && data) {
      const stylesWithStats = await Promise.all(
        data.map(async (style) => {
          const stats = await this.getStyleStats(style.id);
          return { ...style, stats };
        })
      );
      return stylesWithStats;
    }

    return data || [];
  }

  // Get all dance styles with optional stats (PUBLIC VERSION)
  static async findAll(options = {}) {
    let query = supabase
      .from('dance_styles')
      .select('*')
      .eq('is_active', true) // Only show active styles to public
      .order('popularity_score', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Include stats if requested
    if (options.includeStats && data) {
      const stylesWithStats = await Promise.all(
        data.map(async (style) => {
          const stats = await this.getStyleStats(style.id);
          return { ...style, stats };
        })
      );
      return stylesWithStats;
    }

    return data || [];
  }

  // Get dance style by ID
  static async findById(id, options = {}) {
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Include stats if requested
    if (options.includeStats && data) {
      const stats = await this.getStyleStats(id);
      return { ...data, stats };
    }

    return data;
  }

  // Update dance style
  static async update(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('dance_styles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete dance style
  static async delete(id) {
    const { data, error } = await supabaseAdmin
      .from('dance_styles')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get stats for a dance style
  static async getStyleStats(styleId) {
    try {
      // Get move count
      const { count: moveCount } = await supabase
        .from('dance_moves')
        .select('*', { count: 'exact', head: true })
        .eq('dance_style_id', styleId)
        .eq('is_published', true);

      // Get submission count
      const { count: submissionCount } = await supabase
        .from('move_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('dance_style_id', styleId);

      // Get average rating
      const { data: submissions } = await supabase
        .from('move_submissions')
        .select('rating')
        .eq('dance_style_id', styleId)
        .not('rating', 'is', null);

      const averageRating = submissions && submissions.length > 0
        ? submissions.reduce((sum, sub) => sum + sub.rating, 0) / submissions.length
        : 0;

      return {
        moveCount: moveCount || 0,
        submissionCount: submissionCount || 0,
        averageRating: Math.round(averageRating * 10) / 10
      };
    } catch (error) {
      console.error('Error getting style stats:', error);
      return {
        moveCount: 0,
        submissionCount: 0,
        averageRating: 0
      };
    }
  }

  // Search dance styles
  static async search(query, filters = {}) {
    let dbQuery = supabase
      .from('dance_styles')
      .select('*')
      .eq('is_active', true);

    // Add text search
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Add filters
    if (filters.difficulty) {
      dbQuery = dbQuery.eq('difficulty_level', filters.difficulty);
    }

    if (filters.featured !== undefined) {
      dbQuery = dbQuery.eq('is_featured', filters.featured);
    }

    if (filters.culturalOrigin) {
      dbQuery = dbQuery.eq('cultural_origin', filters.culturalOrigin);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data || [];
  }

  // REMOVED: No more hardcoded seed data
  // This was causing the 3 hardcoded styles to appear in the iOS app
  // Let the database be truly empty and require admin to create styles
}

module.exports = DanceStyle;