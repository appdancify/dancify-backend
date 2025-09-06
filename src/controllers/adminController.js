const DanceMove = require('../models/DanceMove');

class AdminController {
  // GET /api/admin/moves - Get all moves (admin)
  static async getAllMoves(req, res) {
    try {
      const filters = {
        danceStyle: req.query.dance_style,
        section: req.query.section,
        difficulty: req.query.difficulty,
        minLevel: req.query.min_level ? parseInt(req.query.min_level) : undefined,
        maxLevel: req.query.max_level ? parseInt(req.query.max_level) : undefined
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

      // Validate required fields
      const requiredFields = ['name', 'description', 'detailedInstructions', 'danceStyle', 'section', 'subsection', 'difficulty'];
      const missingFields = requiredFields.filter(field => !moveData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missing_fields: missingFields
        });
      }

      // Extract and validate YouTube video
      if (moveData.videoUrl) {
        const videoId = DanceMove.extractYouTubeId(moveData.videoUrl);
        if (videoId) {
          moveData.videoId = videoId;
          moveData.thumbnailUrl = DanceMove.generateThumbnailUrl(videoId);
        }
      }

      const newMove = await DanceMove.create(moveData);

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

      // Handle video URL updates
      if (updateData.videoUrl) {
        const videoId = DanceMove.extractYouTubeId(updateData.videoUrl);
        if (videoId) {
          updateData.videoId = videoId;
          updateData.thumbnailUrl = DanceMove.generateThumbnailUrl(videoId);
        }
      }

      const updatedMove = await DanceMove.update(id, updateData);

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
}

module.exports = AdminController;
