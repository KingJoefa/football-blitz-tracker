const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// Route imports
const teamsRoutes = require('./routes/teams');
const playersRoutes = require('./routes/players');
const gamesRoutes = require('./routes/games');
const playsRoutes = require('./routes/plays');
const defensiveRoutes = require('./routes/defensive');
const analyticsRoutes = require('./routes/analytics');
const formationsRoutes = require('./routes/formations');

// Middleware imports
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const cacheMiddleware = require('./middleware/cache');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req) => {
        // Higher limits for authenticated users
        if (req.headers.authorization) return 1000;
        return 100;
    },
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/v1/teams', cacheMiddleware(300), teamsRoutes); // 5 min cache
app.use('/v1/players', cacheMiddleware(300), playersRoutes);
app.use('/v1/games', cacheMiddleware(60), gamesRoutes); // 1 min cache for live games
app.use('/v1/plays', playsRoutes); // No default cache for real-time data
app.use('/v1/defensive-metrics', cacheMiddleware(120), defensiveRoutes);
app.use('/v1/analytics', cacheMiddleware(600), analyticsRoutes); // 10 min cache
app.use('/v1/formations', cacheMiddleware(3600), formationsRoutes); // 1 hour cache

// WebSocket support for real-time updates
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

// WebSocket authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        
        const authResult = await authMiddleware.verifyToken(token);
        socket.userId = authResult.userId;
        socket.userRole = authResult.role;
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Join game-specific rooms for real-time updates
    socket.on('join_game', (gameId) => {
        socket.join(`game_${gameId}`);
        console.log(`User ${socket.userId} joined game ${gameId} room`);
    });
    
    socket.on('leave_game', (gameId) => {
        socket.leave(`game_${gameId}`);
    });
    
    socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
    });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: `Endpoint ${req.method} ${req.originalUrl} not found`,
            timestamp: new Date().toISOString()
        }
    });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`NFL Analytics API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});