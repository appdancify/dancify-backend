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

// Rate limiting with different tiers
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Higher limit for admin operations
  message: {
    success: false,
    error: 'Too many admin requests from this IP, please try again later.',
    retryAfter: '5 minutes'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit uploads
  message: {
    success: false,
    error: 'Upload limit exceeded, please try again later.',
    retryAfter: '1 hour'
  }
});

app.use('/api', generalLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/*/upload', uploadLimiter);

// CORS configuration - FIXED for Render deployment
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://dancify-admin.vercel.app',
      'https://dancify-dashboard.netlify.app',
      // Add Render domains
      'https://dancify-backend.onrender.com',
      'https://dancify-admin.onrender.com'
    ];
    
    // In development or if origin contains onrender.com, allow all
    if (process.env.NODE_ENV === 'development' || 
        (origin && origin.includes('.onrender.com'))) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all for now, restrict in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Serve static files for admin dashboard with proper MIME types
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

// Health check endpoint with detailed information
app.get('/health', async (req, res) => {
  let databaseStatus = 'connected';
  
  // Test database connection
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
  
  const healthCheck = {
    status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: databaseStatus,
      provider: 'Supabase'
    },
    server: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage()
    }
  };
  
  res.status(databaseStatus === 'connected' ? 200 : 503).json(healthCheck);
});

// API health endpoint
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

// API Routes
const movesRouter = require('./src/routes/moves');
const danceStylesRouter = require('./src/routes/danceStyles');
const adminRouter = require('./src/routes/admin');
const submissionsRouter = require('./src/routes/submissions');

app.use('/api/moves', movesRouter);
app.use('/api/dance-styles', danceStylesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/submissions', submissionsRouter);

// Create move endpoint
app.post('/api/admin/moves', async (req, res) => {
  try {
    const {
      name, videoUrl, description, detailedInstructions, danceStyle,
      section, subsection, difficulty, levelRequired, xpReward,
      estimatedDuration, equipment, moveType, targetRepetitions,
      recordingTimeLimit, keyTechniques, prerequisites,
      instructorId, instructorName
    } = req.body;

    // Extract video ID from YouTube URL
    const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    const { data, error } = await supabase
      .from('dance_moves')
      .insert([{
        name,
        video_id: videoId,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        description,
        detailed_instructions: detailedInstructions,
        dance_style: danceStyle,
        section,
        subsection,
        difficulty,
        level_required: levelRequired || 1,
        xp_reward: xpReward || 50,
        estimated_duration: estimatedDuration || 10,
        equipment: equipment || [],
        move_type: moveType || 'time',
        target_repetitions: targetRepetitions,
        recording_time_limit: recordingTimeLimit,
        key_techniques: keyTechniques || [],
        prerequisites: prerequisites || [],
        instructor_id: instructorId,
        instructor_name: instructorName
      }])
      .select()
      .single();

    if (error) throw error;

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
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get moves endpoint
app.get('/api/admin/moves', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dance_moves')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      message: `Found ${data?.length || 0} moves`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching moves:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

// Update move endpoint
app.put('/api/admin/moves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Extract video ID if video URL is provided
    if (updateData.videoUrl) {
      const videoId = extractYouTubeId(updateData.videoUrl);
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

    res.json({
      success: true,
      data: data,
      message: 'Move updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating move:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/admin/moves/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('dance_moves')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Move deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting move:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Submissions Routes
app.get('/api/submissions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('move_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      message: `Found ${data?.length || 0} submissions`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

// Admin dashboard route - Serve index.html for the main admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'index.html'));
});

// SPA support for admin dashboard - serve index.html for all admin routes except static files
app.get('/admin/*', (req, res, next) => {
  // Don't intercept requests for static files
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|html)$/)) {
    return next();
  }
  // Serve index.html for SPA routes
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'index.html'));
});

// Root endpoint with comprehensive API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Dancify Backend API',
    version: '1.0.0',
    documentation: {
      health: [
        'GET /health - System health check',
        'GET /api/health - API health check',
        'GET /api/health/database - Database connectivity check'
      ],
      moves: [
        'GET /api/moves - Get all dance moves',
        'GET /api/moves/:id - Get specific move',
        'GET /api/moves/sections/:danceStyle - Get sections for dance style'
      ],
      danceStyles: [
        'GET /api/dance-styles - Get all dance styles',
        'GET /api/dance-styles/:id - Get specific dance style',
        'POST /api/dance-styles - Create new style (admin)',
        'PUT /api/dance-styles/:id - Update style (admin)',
        'DELETE /api/dance-styles/:id - Delete style (admin)'
      ],
      admin: [
        'GET /api/admin/dashboard - Admin dashboard data',
        'GET /api/admin/analytics - Analytics data',
        'GET /api/admin/moves - Admin move management',
        'POST /api/admin/moves - Create new move',
        'PUT /api/admin/moves/:id - Update move',
        'DELETE /api/admin/moves/:id - Delete move'
      ],
      submissions: [
        'GET /api/submissions - Get move submissions',
        'GET /api/submissions/:id - Get specific submission',
        'POST /api/submissions - Submit move video',
        'PUT /api/submissions/:id/review - Review submission (admin)',
        'POST /api/submissions/:id/approve - Approve submission',
        'POST /api/submissions/:id/reject - Reject submission'
      ]
    },
    admin_dashboard: '/admin',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Dancify API v1.0.0',
    endpoints: {
      health: '/api/health',
      moves: '/api/moves',
      danceStyles: '/api/dance-styles',
      admin: '/api/admin',
      submissions: '/api/submissions'
    },
    authentication: 'Bearer token required for admin endpoints',
    rateLimit: {
      general: '100 requests per 15 minutes',
      admin: '200 requests per 5 minutes',
      uploads: '50 requests per hour'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/api/health',
      '/api/moves',
      '/api/dance-styles',
      '/api/admin',
      '/api/submissions'
    ]
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    message: 'The requested resource does not exist'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Helper function to extract YouTube video ID
function extractYouTubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Port configuration
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`API Documentation: http://localhost:${PORT}/api`);
});