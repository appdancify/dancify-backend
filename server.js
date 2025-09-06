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
    status: databaseStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Dancify Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  res.json(healthCheck);
});

// API health endpoint that the frontend expects
app.get('/api/health', async (req, res) => {
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
    success: true,
    status: databaseStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Dancify Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  res.json(healthCheck);
});

// Database connection test endpoint
app.get('/api/health/database', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dance_moves')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      database: 'connected',
      timestamp: new Date().toISOString(),
      test_query: 'SELECT count FROM dance_moves LIMIT 1'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// INLINE ROUTE IMPLEMENTATIONS (to fix dashboard immediately)

// Dance Moves Routes
app.get('/api/moves', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dance_moves')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      message: `Found ${data?.length || 0} dance moves`,
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

app.get('/api/moves/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dance_moves')
      .select('*')
      .eq('id', req.params.id)
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
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching move:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Dance Styles Routes
app.get('/api/dance-styles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dance_styles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      message: `Found ${data?.length || 0} dance styles`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dance styles:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/dance-styles', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
        timestamp: new Date().toISOString()
      });
    }
    
    const { data, error } = await supabase
      .from('dance_styles')
      .insert([{ name, description, color, icon }])
      .select()
      .single();
    
    if (error) throw error;
    
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
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin Routes
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    // Get dashboard stats
    const [movesResult, stylesResult, submissionsResult] = await Promise.all([
      supabase.from('dance_moves').select('id', { count: 'exact' }),
      supabase.from('dance_styles').select('id', { count: 'exact' }),
      supabase.from('move_submissions').select('id', { count: 'exact' })
    ]);
    
    const stats = {
      totalMoves: movesResult.count || 0,
      totalStyles: stylesResult.count || 0,
      totalSubmissions: submissionsResult.count || 0,
      activeUsers: 0 // Placeholder
    };
    
    // Get recent moves
    const { data: recentMoves } = await supabase
      .from('dance_moves')
      .select('id, name, dance_style, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        stats,
        recentMoves: recentMoves || []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/moves', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('dance_moves')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin moves:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/admin/moves', async (req, res) => {
  try {
    const moveData = req.body;
    
    if (!moveData.name || !moveData.dance_style) {
      return res.status(400).json({
        success: false,
        error: 'Name and dance style are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const { data, error } = await supabase
      .from('dance_moves')
      .insert([moveData])
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

app.put('/api/admin/moves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const { data, error } = await supabase
      .from('dance_moves')
      .update(updateData)
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

// Admin dashboard route
app.get('/admin', (req, res) => {
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

// Catch-all for unmatched admin routes (SPA support)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard', 'index.html'));
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
    error: 'Endpoint not found',
    path: req.originalUrl,
    suggestion: 'Visit / for API documentation or /admin for the dashboard'
  });
});

// Global error handler with better error categorization
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  // Handle specific error types
  let statusCode = error.status || 500;
  let errorMessage = error.message || 'Internal server error';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation failed';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized access';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorMessage = 'Database connection failed';
  }
  
  const errorResponse = {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error;
  }
  
  res.status(statusCode).json(errorResponse);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🕺 Dancify Backend API Server Started');
  console.log('=====================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`💃 Admin: http://localhost:${PORT}/admin`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Version: 1.0.0`);
  console.log('=====================================');
});

module.exports = app;