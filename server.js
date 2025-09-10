const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database connection
const { supabase } = require('./src/config/supabase');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', generalLimiter);

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'development' || 
        (origin && origin.includes('.onrender.com'))) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Serve static files for admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'admin-dashboard'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Health check endpoints
app.get('/health', async (req, res) => {
  let databaseStatus = 'connected';
  
  try {
    const { error } = await supabase
      .from('dance_moves')
      .select('count')
      .limit(1);
    
    if (error) {
      databaseStatus = 'disconnected';
      console.error('Database health check failed:', error);
    }
  } catch (error) {
    databaseStatus = 'disconnected';
    console.error('Database health check error:', error);
  }
  
  res.status(databaseStatus === 'connected' ? 200 : 503).json({
    status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: { status: databaseStatus, provider: 'Supabase' }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase
      .from('dance_moves')
      .select('count')
      .limit(1);
    
    if (error) {
      return res.status(503).json({
        success: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'API is healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// PUBLIC API ENDPOINTS FOR iOS APP

// Get all moves for iOS app
app.get('/api/moves', async (req, res) => {
  try {
    console.log('Fetching moves for iOS app...');
    
    // Apply filters from query parameters
    let query = supabase
      .from('dance_moves')
      .select('*')
      .eq('is_active', true);

    // Add filters if provided
    if (req.query.dance_style) {
      query = query.eq('dance_style', req.query.dance_style);
    }
    if (req.query.section) {
      query = query.eq('section', req.query.section);
    }
    if (req.query.difficulty) {
      query = query.eq('difficulty', req.query.difficulty);
    }
    if (req.query.min_level) {
      query = query.gte('level_required', parseInt(req.query.min_level));
    }
    if (req.query.max_level) {
      query = query.lte('level_required', parseInt(req.query.max_level));
    }

    // Order by dance style, section, level
    query = query.order('dance_style').order('section').order('level_required');

    const { data, error } = await query;

    if (error) throw error;

    console.log(`Found ${data?.length || 0} moves for iOS app`);
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      message: `Retrieved ${data?.length || 0} dance moves`
    });
  } catch (error) {
    console.error('Error fetching moves for iOS app:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dance moves',
      message: error.message
    });
  }
});

// Get specific move for iOS app
app.get('/api/moves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching move for iOS app:', id);

    const { data, error } = await supabase
      .from('dance_moves')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Dance move not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data,
      message: 'Dance move retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching move for iOS app:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dance move',
      message: error.message
    });
  }
});

// Get dance styles for iOS app
app.get('/api/dance-styles', async (req, res) => {
  try {
    console.log('Fetching dance styles for iOS app...');
    
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    console.log(`Found ${data?.length || 0} dance styles for iOS app`);
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      message: `Retrieved ${data?.length || 0} dance styles`
    });
  } catch (error) {
    console.error('Error fetching dance styles for iOS app:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dance styles',
      message: error.message
    });
  }
});

// ADMIN ENDPOINTS

// Dance Styles Admin Endpoints
app.get('/api/admin/dance-styles', async (req, res) => {
  try {
    console.log('Fetching admin dance styles...');
    
    const { includeStats = 'true' } = req.query;
    
    const { data: styles, error } = await supabase
      .from('dance_styles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let stylesWithStats = styles || [];

    if (includeStats === 'true' && styles && styles.length > 0) {
      stylesWithStats = await Promise.all(
        styles.map(async (style) => {
          try {
            const { count: moveCount } = await supabase
              .from('dance_moves')
              .select('*', { count: 'exact', head: true })
              .eq('dance_style', style.name)
              .eq('is_active', true);

            let submissionCount = 0;
            try {
              const { count } = await supabase
                .from('move_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('dance_style', style.name);
              submissionCount = count || 0;
            } catch (submissionError) {
              console.log('Submissions table not found, setting count to 0');
            }

            let averageRating = 0;
            try {
              const { data: submissions } = await supabase
                .from('move_submissions')
                .select('rating')
                .eq('dance_style', style.name)
                .not('rating', 'is', null);

              if (submissions && submissions.length > 0) {
                averageRating = submissions.reduce((sum, sub) => sum + sub.rating, 0) / submissions.length;
                averageRating = Math.round(averageRating * 10) / 10;
              }
            } catch (ratingError) {
              console.log('Could not fetch ratings, setting to 0');
            }

            return {
              ...style,
              stats: {
                moveCount: moveCount || 0,
                submissionCount,
                averageRating
              }
            };
          } catch (statsError) {
            console.error(`Error getting stats for style ${style.name}:`, statsError);
            return {
              ...style,
              stats: {
                moveCount: 0,
                submissionCount: 0,
                averageRating: 0
              }
            };
          }
        })
      );
    }

    console.log(`Found ${stylesWithStats.length} dance styles`);
    
    res.json({
      success: true,
      data: stylesWithStats,
      count: stylesWithStats.length,
      message: `Found ${stylesWithStats.length} dance styles`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dance styles:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dance styles',
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/admin/dance-styles', async (req, res) => {
  try {
    console.log('Creating new dance style:', req.body);
    
    const { name, description, icon, color } = req.body;

    if (!name || !description || !icon || !color) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, description, icon, and color',
        required: ['name', 'description', 'icon', 'color']
      });
    }

    const { data, error } = await supabase
      .from('dance_styles')
      .insert([{
        name,
        description,
        icon,
        color
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('Dance style created successfully:', data.id);

    res.status(201).json({
      success: true,
      data: data,
      message: 'Dance style created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating dance style:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create dance style',
      timestamp: new Date().toISOString()
    });
  }
});

// FIXED: Dance Style Update Endpoint - Removed .single() to prevent "Cannot coerce the result to a single JSON object" error
app.put('/api/admin/dance-styles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;
    
    console.log('Updating dance style:', id);

    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (icon) updateData.icon = icon;
    if (color) updateData.color = color;

    updateData.updated_at = new Date().toISOString();

    // CRITICAL FIX: Remove .single() to prevent "Cannot coerce the result to a single JSON object" error
    const { data, error } = await supabase
      .from('dance_styles')
      .update(updateData)
      .eq('id', id)
      .select(); // Removed .single() here

    if (error) throw error;
    
    // Check if any rows were updated
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dance style not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get the first (and should be only) updated record
    const updatedStyle = data[0];

    console.log('Dance style updated successfully:', id);

    res.json({
      success: true,
      data: updatedStyle,
      message: 'Dance style updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating dance style:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update dance style',
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/admin/dance-styles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting dance style:', id);

    const { error: softDeleteError } = await supabase
      .from('dance_styles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (softDeleteError) {
      console.log('Soft delete failed, attempting hard delete:', softDeleteError.message);
      
      const { error: hardDeleteError } = await supabase
        .from('dance_styles')
        .delete()
        .eq('id', id);

      if (hardDeleteError) throw hardDeleteError;
    }

    console.log('Dance style deleted successfully:', id);

    res.json({
      success: true,
      message: 'Dance style deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting dance style:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete dance style',
      timestamp: new Date().toISOString()
    });
  }
});

// Dance Moves Admin Endpoints
app.get('/api/admin/moves', async (req, res) => {
  try {
    console.log('Fetching admin moves...');
    
    const { data, error } = await supabase
      .from('dance_moves')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${data?.length || 0} moves`);
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      message: `Found ${data?.length || 0} moves`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching moves:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dance moves',
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

// FIXED MOVE CREATION - WITH SLUG SUPPORT FOR DATABASE TRIGGER
app.post('/api/admin/moves', async (req, res) => {
  try {
    console.log('Creating new move:', req.body);
    
    const {
      name, video_url, description, detailed_instructions, dance_style,
      section, subsection, difficulty, xp_reward
    } = req.body;

    if (!name || !description || !detailed_instructions || !dance_style || !section || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'description', 'detailed_instructions', 'dance_style', 'section', 'difficulty']
      });
    }

    // Extract YouTube video ID if URL provided
    const videoId = video_url ? extractYouTubeId(video_url) : null;
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    // Insert data - slug will be generated automatically by database trigger
    const insertData = {
      name,
      description,
      detailed_instructions,
      dance_style,
      section,
      difficulty,
      xp_reward: xp_reward || 50,
      is_active: true
    };

    // Add optional fields only if they have values
    if (video_url) insertData.video_url = video_url;
    if (videoId) insertData.video_id = videoId;
    if (thumbnailUrl) insertData.thumbnail_url = thumbnailUrl;
    if (subsection) insertData.subsection = subsection;

    console.log('About to insert move data:', insertData);

    const { data, error } = await supabase
      .from('dance_moves')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Move created successfully:', data.id);

    res.status(201).json({
      success: true,
      data: data,
      message: 'Move created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating move:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create move',
      timestamp: new Date().toISOString()
    });
  }
});

// FINAL FIX: Move Update Endpoint - Addresses 404 error with better debugging
app.put('/api/admin/moves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('Updating move:', id);
    console.log('Update data:', updateData);

    // First, check if the move exists (regardless of is_active status)
    const { data: existingMove, error: checkError } = await supabase
      .from('dance_moves')
      .select('id, name, is_active')
      .eq('id', id)
      .single();

    if (checkError || !existingMove) {
      console.log('Move not found in database:', id);
      console.log('Check error:', checkError);
      return res.status(404).json({
        success: false,
        error: 'Move not found',
        timestamp: new Date().toISOString()
      });
    }

    console.log('Found existing move:', existingMove);

    // Process video URL if provided
    if (updateData.video_url) {
      const videoId = extractYouTubeId(updateData.video_url);
      updateData.video_id = videoId;
      updateData.thumbnail_url = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    }

    // Update the move (without is_active filter in WHERE clause)
    const { data, error } = await supabase
      .from('dance_moves')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(); // Removed .single() to prevent "Cannot coerce" error

    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    
    // Check if any rows were updated
    if (!data || data.length === 0) {
      console.log('No rows updated for move:', id);
      return res.status(404).json({
        success: false,
        error: 'Move could not be updated',
        timestamp: new Date().toISOString()
      });
    }

    // Get the first (and should be only) updated record
    const updatedMove = data[0];

    console.log('Move updated successfully:', id);
    console.log('Updated move data:', updatedMove);

    res.json({
      success: true,
      data: updatedMove,
      message: 'Move updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating move:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update move',
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/admin/moves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting move:', id);

    const { error } = await supabase
      .from('dance_moves')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    console.log('Move deleted successfully:', id);

    res.json({
      success: true,
      message: 'Move deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting move:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete move',
      timestamp: new Date().toISOString()
    });
  }
});

// Dashboard and Analytics Endpoints
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    console.log('Fetching dashboard data...');

    const [movesResult, stylesResult] = await Promise.all([
      supabase.from('dance_moves').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('dance_styles').select('id', { count: 'exact' })
    ]);

    const { data: recentMoves } = await supabase
      .from('dance_moves')
      .select('id, name, dance_style, difficulty, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalMoves: movesResult.count || 0,
          totalStyles: stylesResult.count || 0,
          totalSubmissions: 0
        },
        recentMoves: recentMoves || []
      },
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

app.get('/api/admin/analytics', async (req, res) => {
  try {
    console.log('Fetching analytics data...');

    const { data: styleStats } = await supabase
      .from('dance_moves')
      .select('dance_style')
      .eq('is_active', true);

    const styleBreakdown = styleStats?.reduce((acc, move) => {
      acc[move.dance_style] = (acc[move.dance_style] || 0) + 1;
      return acc;
    }, {}) || {};

    const { data: difficultyStats } = await supabase
      .from('dance_moves')
      .select('difficulty')
      .eq('is_active', true);

    const difficultyBreakdown = difficultyStats?.reduce((acc, move) => {
      acc[move.difficulty] = (acc[move.difficulty] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      data: {
        styleBreakdown,
        difficultyBreakdown,
        totalMoves: styleStats?.length || 0
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
});

// Load public API routers (commented out since we're using direct endpoints above)
/*
try {
  const movesRouter = require('./src/routes/moves');
  app.use('/api/moves', movesRouter);
  console.log('Moves router loaded');
} catch (error) {
  console.error('Error loading moves router:', error);
}

try {
  const danceStylesRouter = require('./src/routes/DanceStyles.js');
  app.use('/api/dance-styles', danceStylesRouter);
  console.log('Dance styles router loaded');
} catch (error) {
  console.error('Error loading dance styles router:', error);
}
*/

try {
  const submissionsRouter = require('./src/routes/submissions');
  app.use('/api/submissions', submissionsRouter);
  console.log('Submissions router loaded');
} catch (error) {
  console.error('Error loading submissions router:', error);
}

// Static routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'index.html'));
});

app.get('/admin/*', (req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|html)$/)) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'index.html'));
});

app.get('/', (req, res) => {
  res.json({
    message: 'Dancify Backend API',
    version: '1.0.0',
    status: 'running',
    admin_dashboard: '/admin',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Dancify API v1.0.0',
    endpoints: {
      health: '/api/health',
      moves: '/api/moves',
      admin: '/api/admin',
      submissions: '/api/submissions',
      'dance-styles': '/api/dance-styles'
    }
  });
});

// Error handlers
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Helper function
function extractYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`API Documentation: http://localhost:${PORT}/api`);
  console.log(`Server started successfully with admin endpoints`);
});