const DanceStyle = require('../models/DanceStyle');
const DanceMove = require('../models/DanceMove');

class DanceStyleController {
  // GET /api/dance-styles - Get all dance styles
  static async getAllDanceStyles(req, res) {
    try {
      const includeStats = req.query.include_stats === 'true';
      const styles = await DanceStyle.findAll({ includeStats });

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

  // GET /api/dance-styles/:id - Get specific dance style
  static async getDanceStyle(req, res) {
    try {
      const { id } = req.params;
      const includeStats = req.query.include_stats === 'true';
      
      const style = await DanceStyle.findById(id, { includeStats });

      if (!style) {
        return res.status(404).json({
          success: false,
          error: 'Dance style not found'
        });
      }

      res.json({
        success: true,
        data: style,
        message: 'Dance style retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching dance style:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dance style',
        message: error.message
      });
    }
  }

  // GET /api/dance-styles/:danceStyle/sections - Get sections for dance style
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

module.exports = DanceStyleController;