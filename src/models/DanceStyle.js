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
      .eq('is_active', true)
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

  // Get dance style by ID (ADMIN VERSION)
  static async findByIdAdmin(id, options = {}) {
    const { data, error } = await supabaseAdmin
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

  // Get dance style by ID (PUBLIC VERSION)
  static async findById(id, options = {}) {
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    // Include stats if requested
    if (options.includeStats && data) {
      const stats = await this.getStyleStats(id);
      return { ...data, stats };
    }

    return data;
  }

  // Get dance style by name
  static async findByName(name) {
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .ilike('name', name)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Update dance style
  static async update(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('dance_styles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Soft delete dance style
  static async delete(id) {
    const { data, error } = await supabaseAdmin
      .from('dance_styles')
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

  // Hard delete dance style (admin only)
  static async hardDelete(id) {
    const { data, error } = await supabaseAdmin
      .from('dance_styles')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get statistics for a dance style
  static async getStyleStats(styleId) {
    try {
      // Get move count
      const { data: moveCount, error: moveError } = await supabase
        .from('dance_moves')
        .select('id', { count: 'exact' })
        .eq('dance_style', styleId)
        .eq('is_active', true);

      if (moveError) throw moveError;

      // Get submission count
      const { data: submissionCount, error: submissionError } = await supabase
        .from('move_submissions')
        .select('id', { count: 'exact' })
        .eq('dance_style', styleId);

      if (submissionError) throw submissionError;

      // Get average rating
      const { data: ratingData, error: ratingError } = await supabase
        .rpc('get_average_style_rating', { style_id: styleId });

      if (ratingError) console.error('Rating error:', ratingError);

      return {
        moveCount: moveCount?.length || 0,
        submissionCount: submissionCount?.length || 0,
        averageRating: ratingData || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting style stats:', error);
      return {
        moveCount: 0,
        submissionCount: 0,
        averageRating: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Get popular dance styles
  static async getPopular(limit = 10) {
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get featured dance styles
  static async getFeatured() {
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('popularity_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update popularity score
  static async updatePopularityScore(id, score) {
    const { data, error } = await supabaseAdmin
      .from('dance_styles')
      .update({ 
        popularity_score: score,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Search dance styles
  static async search(query, options = {}) {
    const limit = options.limit || 20;
    
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .or(`name.ilike.%${query}%, description.ilike.%${query}%, cultural_origin.ilike.%${query}%`)
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Seed initial dance styles (for setup)
  static async seedInitialStyles() {
    const initialStyles = [
      {
        name: 'Ballet',
        description: 'Classical dance form emphasizing grace, precision, and technique',
        icon: '🩰',
        color: '#FFB6C1',
        difficulty_level: 'intermediate',
        popularity_score: 85,
        is_featured: true,
        cultural_origin: 'European',
        music_genres: ['Classical', 'Orchestral'],
        key_characteristics: ['Grace', 'Precision', 'Technique', 'Flexibility']
      },
      {
        name: 'Hip-Hop',
        description: 'Urban dance style with street culture roots and rhythmic movement',
        icon: '🎤',
        color: '#FF6B35',
        difficulty_level: 'beginner',
        popularity_score: 95,
        is_featured: true,
        cultural_origin: 'African American',
        music_genres: ['Hip-Hop', 'Rap', 'R&B'],
        key_characteristics: ['Rhythm', 'Flow', 'Attitude', 'Creativity']
      },
      {
        name: 'Salsa',
        description: 'Energetic Latin dance with partner work and spicy rhythms',
        icon: '💃',
        color: '#FF4757',
        difficulty_level: 'intermediate',
        popularity_score: 75,
        is_featured: true,
        cultural_origin: 'Latin American',
        music_genres: ['Salsa', 'Latin', 'Mambo'],
        key_characteristics: ['Partnership', 'Rhythm', 'Passion', 'Connection']
      }
    ];

    try {
      const { data, error } = await supabaseAdmin
        .from('dance_styles')
        .insert(initialStyles)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error seeding initial styles:', error);
      throw error;
    }
  }
}

module.exports = DanceStyle;