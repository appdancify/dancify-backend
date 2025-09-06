const DanceMove = require('../models/DanceMove');

class MoveController {
  // GET /api/moves - Get all moves
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

  // GET /api/moves/:id - Get specific move
  static async getMove(req, res) {
    try {
      const { id } = req.params;
      const move = await DanceMove.findById(id);

      if (!move) {
        return res.status(404).json({
          success: false,
          error: 'Dance move not found'
        });
      }

      // Increment view count (don't await, fire and forget)
      DanceMove.incrementViewCount(id).catch(console.error);

      res.json({
        success: true,
        data: move,
        message: 'Dance move retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching move:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dance move',
        message: error.message
      });
    }
  }

  // GET /api/moves/sections/:danceStyle - Get sections
  static async getSections(req, res) {
    try {
      const { danceStyle } = req.params;
      const sections = await DanceMove.getSections(danceStyle);

      res.json({
        success: true,
        data: sections,
        count: sections.length,
        message: `Retrieved ${sections.length} sections for ${danceStyle}`
      });
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sections',
        message: error.message
      });
    }
  }
}

module.exports = MoveController;