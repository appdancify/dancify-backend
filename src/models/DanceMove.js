const { supabase, supabaseAdmin } = require('../config/supabase');

class DanceMove {
  // Create a new dance move
  static async create(moveData) {
    const { data, error } = await supabaseAdmin
      .from('dance_moves')
      .insert([{
        name: moveData.name,
        video_id: moveData.videoId,
        video_url: moveData.videoUrl,
        thumbnail_url: moveData.thumbnailUrl,
        description: moveData.description,
        detailed_instructions: moveData.detailedInstructions,
        dance_style: moveData.danceStyle,
        section: moveData.section,
        subsection: moveData.subsection,
        difficulty: moveData.difficulty,
        level_required: moveData.levelRequired || 1,
        xp_reward: moveData.xpReward || 50,
        estimated_duration: moveData.estimatedDuration || 10,
        equipment: moveData.equipment || [],
        move_type: moveData.moveType || 'time',
        target_repetitions: moveData.targetRepetitions,
        recording_time_limit: moveData.recordingTimeLimit,
        key_techniques: moveData.keyTechniques || [],
        prerequisites: moveData.prerequisites || [],
        instructor_id: moveData.instructorId,
        instructor_name: moveData.instructorName
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all moves with filtering
  static async findAll(filters = {}) {
    let query = supabase
      .from('dance_moves')
      .select(`
        *,
        dance_sections!left(description)
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters.danceStyle) {
      query = query.eq('dance_style', filters.danceStyle);
    }
    if (filters.section) {
      query = query.eq('section', filters.section);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.minLevel) {
      query = query.gte('level_required', filters.minLevel);
    }
    if (filters.maxLevel) {
      query = query.lte('level_required', filters.maxLevel);
    }

    // Order by dance style, section, level
    query = query.order('dance_style').order('section').order('level_required');

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get move by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('dance_moves')
      .select(`
        *,
        dance_sections!left(description)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Update move
  static async update(id, updateData) {
    // Build update object with only valid database fields
    const updateFields = {};
    
    // Map camelCase fields to snake_case database fields
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.videoId !== undefined) updateFields.video_id = updateData.videoId;
    if (updateData.videoUrl !== undefined) updateFields.video_url = updateData.videoUrl;
    if (updateData.thumbnailUrl !== undefined) updateFields.thumbnail_url = updateData.thumbnailUrl;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.detailedInstructions !== undefined) updateFields.detailed_instructions = updateData.detailedInstructions;
    if (updateData.danceStyle !== undefined) updateFields.dance_style = updateData.danceStyle;
    if (updateData.section !== undefined) updateFields.section = updateData.section;
    if (updateData.subsection !== undefined) updateFields.subsection = updateData.subsection;
    if (updateData.difficulty !== undefined) updateFields.difficulty = updateData.difficulty;
    if (updateData.levelRequired !== undefined) updateFields.level_required = updateData.levelRequired;
    if (updateData.xpReward !== undefined) updateFields.xp_reward = updateData.xpReward;
    if (updateData.estimatedDuration !== undefined) updateFields.estimated_duration = updateData.estimatedDuration;
    if (updateData.equipment !== undefined) updateFields.equipment = updateData.equipment;
    if (updateData.moveType !== undefined) updateFields.move_type = updateData.moveType;
    if (updateData.targetRepetitions !== undefined) updateFields.target_repetitions = updateData.targetRepetitions;
    if (updateData.recordingTimeLimit !== undefined) updateFields.recording_time_limit = updateData.recordingTimeLimit;
    if (updateData.keyTechniques !== undefined) updateFields.key_techniques = updateData.keyTechniques;
    if (updateData.prerequisites !== undefined) updateFields.prerequisites = updateData.prerequisites;
    if (updateData.instructorId !== undefined) updateFields.instructor_id = updateData.instructorId;
    if (updateData.instructorName !== undefined) updateFields.instructor_name = updateData.instructorName;
    
    // Always update the timestamp
    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('dance_moves')
      .update(updateFields)
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Soft delete move
  static async delete(id) {
    const { data, error } = await supabaseAdmin
      .from('dance_moves')
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

  // Get sections for dance style
  static async getSections(danceStyle) {
    const { data, error } = await supabase
      .from('dance_sections')
      .select('*')
      .eq('dance_style', danceStyle)
      .eq('is_visible', true)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  // Increment view count
  static async incrementViewCount(id) {
    const { data, error } = await supabaseAdmin
      .rpc('increment_view_count', { move_id: id });

    if (error) {
      console.error('Error incrementing view count:', error);
      return null;
    }
    return data;
  }

  // Extract YouTube video ID from URL
  static extractYouTubeId(url) {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Generate thumbnail URL from video ID
  static generateThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
}

module.exports = DanceMove;