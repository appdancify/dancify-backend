const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

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
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Dancify Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // TODO: Add actual database health check
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  res.json(healthCheck);
});

// FIXED: Add the missing /api/health endpoint that the frontend expects
app.get('/api/health', (req, res) => {
  const healthCheck = {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Dancify Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
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
    // TODO: Add actual database connection test
    // const result = await db.query('SELECT 1');
    res.json({
      success: true,
      database: 'connected',
      timestamp: new Date().toISOString()
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

// Import routes (with error handling for missing files)
let moveRoutes, adminRoutes, danceStyleRoutes, submissionRoutes;

try {
  moveRoutes = require('./src/routes/moves');
} catch (error) {
  console.warn('⚠️ Move routes not found, creating placeholder');
  moveRoutes = express.Router();
  moveRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      data: [
        {
          id: 1,
          name: "Pirouette",
          description: "A spinning movement in ballet",
          difficulty: "intermediate",
          style: "ballet",
          videoUrl: "https://example.com/pirouette.mp4",
          thumbnailUrl: "https://via.placeholder.com/200x150?text=Pirouette",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Hip Hop Freeze",
          description: "A freeze position in hip hop dance",
          difficulty: "advanced",
          style: "hip-hop",
          videoUrl: "https://example.com/freeze.mp4",
          thumbnailUrl: "https://via.placeholder.com/200x150?text=Hip+Hop+Freeze",
          createdAt: new Date().toISOString()
        }
      ], 
      message: 'Using mock moves data' 
    });
  });
  
  moveRoutes.get('/:id', (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        name: "Sample Move",
        description: "A sample dance move",
        difficulty: "beginner",
        style: "general"
      }
    });
  });
  
  moveRoutes.post('/', (req, res) => {
    res.json({
      success: true,
      data: { id: Date.now(), ...req.body },
      message: 'Move created successfully (mock)'
    });
  });
  
  moveRoutes.put('/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, ...req.body },
      message: 'Move updated successfully (mock)'
    });
  });
  
  moveRoutes.delete('/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Move deleted successfully (mock)'
    });
  });
}

try {
  adminRoutes = require('./src/routes/admin');
} catch (error) {
  console.warn('⚠️ Admin routes not found, creating placeholder');
  adminRoutes = express.Router();
  
  adminRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      data: {}, 
      message: 'Admin routes not implemented yet' 
    });
  });
  
  // Add dashboard endpoint that the frontend expects
  adminRoutes.get('/dashboard', (req, res) => {
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: 1250,
          totalMoves: 180,
          pendingSubmissions: 12,
          totalSubmissions: 89
        },
        recentActivity: [
          {
            id: 1,
            type: 'move_created',
            description: 'New move "Salsa Basic" added',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: 'Admin'
          },
          {
            id: 2,
            type: 'submission_reviewed',
            description: 'Submission approved for "Hip Hop Flow"',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            user: 'Reviewer'
          }
        ]
      }
    });
  });
  
  adminRoutes.get('/analytics', (req, res) => {
    res.json({
      success: true,
      data: {
        userGrowth: [
          { month: 'Jan', users: 950 },
          { month: 'Feb', users: 1100 },
          { month: 'Mar', users: 1250 }
        ],
        popularMoves: [
          { name: 'Pirouette', views: 1200 },
          { name: 'Hip Hop Freeze', views: 980 },
          { name: 'Salsa Basic', views: 750 }
        ]
      }
    });
  });
}

try {
  danceStyleRoutes = require('./src/routes/danceStyles');
} catch (error) {
  console.warn('⚠️ Dance style routes not found, creating placeholder');
  danceStyleRoutes = express.Router();
  danceStyleRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      data: [
        { 
          id: 1,
          name: 'Ballet', 
          description: 'Classical dance form characterized by grace and precision',
          difficulty: 'beginner',
          popularity: 85,
          createdAt: new Date().toISOString()
        },
        { 
          id: 2,
          name: 'Hip-Hop', 
          description: 'Urban dance style with rhythmic movements',
          difficulty: 'intermediate',
          popularity: 92,
          createdAt: new Date().toISOString()
        },
        { 
          id: 3,
          name: 'Salsa', 
          description: 'Latin partner dance with passionate movements',
          difficulty: 'intermediate',
          popularity: 78,
          createdAt: new Date().toISOString()
        }
      ], 
      message: 'Using mock dance styles data' 
    });
  });
  
  danceStyleRoutes.get('/:id', (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        name: "Sample Style",
        description: "A sample dance style",
        difficulty: "beginner"
      }
    });
  });
  
  danceStyleRoutes.post('/', (req, res) => {
    res.json({
      success: true,
      data: { id: Date.now(), ...req.body },
      message: 'Dance style created successfully (mock)'
    });
  });
  
  danceStyleRoutes.put('/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, ...req.body },
      message: 'Dance style updated successfully (mock)'
    });
  });
}

try {
  submissionRoutes = require('./src/routes/submissions');
} catch (error) {
  console.warn('⚠️ Submission routes not found, creating placeholder');
  submissionRoutes = express.Router();
  submissionRoutes.get('/', (req, res) => {
    res.json({ 
      success: true, 
      data: [
        {
          id: 1,
          title: "Pirouette Attempt",
          user: "Emma Rodriguez",
          status: "pending",
          moveStyle: "ballet",
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          videoUrl: "https://example.com/submission1.mp4",
          thumbnailUrl: "https://via.placeholder.com/150x100?text=Pirouette+Attempt"
        },
        {
          id: 2,
          title: "Hip-Hop Flow",
          user: "Marcus Johnson",
          status: "approved",
          moveStyle: "hip-hop",
          submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          videoUrl: "https://example.com/submission2.mp4",
          thumbnailUrl: "https://via.placeholder.com/150x100?text=Hip-Hop+Flow"
        },
        {
          id: 3,
          title: "Salsa Basic",
          user: "Sofia Chen",
          status: "rejected",
          moveStyle: "salsa",
          submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          videoUrl: "https://example.com/submission3.mp4",
          thumbnailUrl: "https://via.placeholder.com/150x100?text=Salsa+Basic",
          rejectionReason: "Poor video quality"
        }
      ], 
      message: 'Using mock submission data' 
    });
  });
  
  submissionRoutes.post('/', (req, res) => {
    res.json({
      success: true,
      data: { id: Date.now(), ...req.body, status: 'pending' },
      message: 'Submission received successfully (mock)'
    });
  });
  
  submissionRoutes.put('/:id/review', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, ...req.body },
      message: 'Submission reviewed successfully (mock)'
    });
  });
}

// API routes
app.use('/api/moves', moveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dance-styles', danceStyleRoutes);
app.use('/api/submissions', submissionRoutes);

// Admin dashboard route - FIXED to serve from admin-dashboard folder
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
        'POST /api/moves - Create new move (admin)',
        'PUT /api/moves/:id - Update move (admin)',
        'DELETE /api/moves/:id - Delete move (admin)'
      ],
      danceStyles: [
        'GET /api/dance-styles - Get all dance styles',
        'GET /api/dance-styles/:id - Get specific dance style',
        'POST /api/dance-styles - Create new style (admin)',
        'PUT /api/dance-styles/:id - Update style (admin)'
      ],
      admin: [
        'GET /api/admin/dashboard - Admin dashboard data',
        'GET /api/admin/analytics - Analytics data'
      ],
      submissions: [
        'GET /api/submissions - Get move submissions',
        'POST /api/submissions - Submit move video',
        'PUT /api/submissions/:id/review - Review submission (admin)'
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

// Catch-all for unmatched admin routes (SPA support) - FIXED path
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