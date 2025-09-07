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

// ADMIN ENDPOINTS - Direct implementation to avoid import issues
app.get('/api/admin/moves', async (req, res) => {
  try {
    console.log('🔍 Fetching admin moves...');
    
    const { data, error } = await supabase
      .from('dance_moves')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} moves`);
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      message: `Found ${data?.length || 0} moves`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching moves:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dance moves',
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/admin/moves', async (req, res) => {
  try {
    console.log('🆕 Creating new move:', req.body);
    
    const {
      name, video_url, description, detailed_instructions, dance_style,
      section, subsection, difficulty, level_required, xp_reward,
      estimated_duration, equipment, move_type, target_repetitions,
      recording_time_limit, key_techniques, prerequisites,
      instructor_id, instructor_name
    } = req.body;

    if (!name || !description || !detailed_instructions || !dance_style || !section || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'description', 'detailed_instructions', 'dance_style', 'section', 'difficulty']
      });
    }

    const videoId = video_url ? extractYouTubeId(video_url) : null;
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    const { data, error } = await supabase
      .from('dance_moves')
      .insert([{
        name,
        video_id: videoId,
        video_url,
        thumbnail_url: thumbnailUrl,
        description,
        detailed_instructions,
        dance_style,
        section,
        subsection,
        difficulty,
        level_required: level_required || 1,
        xp_reward: xp_reward || 50,
        estimated_duration: estimated_duration || 10,
        equipment: equipment || [],
        move_type: move_type || 'time',
        target_repetitions,
        recording_time_limit,
        key_techniques: key_techniques || [],
        prerequisites: prerequisites || [],
        instructor_id,
        instructor_name
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Move created successfully:', data.id);

    res.status(201).json({
      success: true,
      data: data,
      message: 'Move created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating move:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create move',
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/admin/moves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('📝 Updating move:', id);

    if (updateData.video_url) {
      const videoId = extractYouTubeId(updateData.video_url);
      updateData.video_id = videoId;
      updateData.thumbnail_url = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    }

    const { data, error } = await supabase
      .from('dance_moves')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Move not found',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Move updated successfully:', id);

    res.json({
      success: true,
      data: data,
      message: 'Move updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating move:', error);
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
    
    console.log('🗑️ Deleting move:', id);

    const { error } = await supabase
      .from('dance_moves')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Move deleted successfully:', id);

    res.json({
      success: true,
      message: 'Move deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error deleting move:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete move',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard data...');

    const [movesResult, stylesResult, submissionsResult] = await Promise.all([
      supabase.from('dance_moves').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('dance_styles').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('move_submissions').select('id', { count: 'exact' })
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
          totalSubmissions: submissionsResult.count || 0
        },
        recentMoves: recentMoves || []
      },
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

app.get('/api/admin/analytics', async (req, res) => {
  try {
    console.log('📈 Fetching analytics data...');

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
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
});

// Load only the working routers (NOT admin router)
try {
  const movesRouter = require('./src/routes/moves');
  app.use('/api/moves', movesRouter);
  console.log('✅ Moves router loaded');
} catch (error) {
  console.error('❌ Error loading moves router:', error);
}

try {
  const danceStylesRouter = require('./src/routes/DanceStyles.js');
  app.use('/api/dance-styles', danceStylesRouter);
  console.log('✅ Dance styles router loaded');
} catch (error) {
  console.error('❌ Error loading dance styles router:', error);
}

try {
  const submissionsRouter = require('./src/routes/submissions');
  app.use('/api/submissions', submissionsRouter);
  console.log('✅ Submissions router loaded');
} catch (error) {
  console.error('❌ Error loading submissions router:', error);
}

// DO NOT LOAD ADMIN ROUTER - it has browser code that breaks the server
console.log('⚠️ Admin router skipped due to browser code in server file');

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
    environment: process.env.NODE_ENV || 'development',
    note: 'Admin endpoints implemented directly due to router issues'
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
      submissions: '/api/submissions'
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`API Documentation: http://localhost:${PORT}/api`);
  console.log(`✅ Server started successfully without problematic admin router`);
});