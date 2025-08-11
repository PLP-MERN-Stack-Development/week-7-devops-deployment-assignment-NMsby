import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRITICAL: Load environment variables FIRST before any other imports
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Sentry BEFORE importing other modules
import { initializeSentry } from '../config/sentry.js';
initializeSentry();

// Now import everything else after environment variables are loaded
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import Database from '../config/database.js';
import { setupSentryMiddleware, setupSentryErrorHandler, sentryErrorMiddleware } from '../middleware/sentry.js';
import {
    apiRateLimit,
    authRateLimit,
    validateRequest,
    securityHeaders,
    requestId
} from '../middleware/security.js';
import {
    responseTime,
    memoryMonitor,
    requestMonitor,
    setupGracefulShutdown,
    healthCheck
} from '../middleware/performance.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Sentry request handling
setupSentryMiddleware(app);

// Initialize database connection with proper error handling
async function initializeDatabase() {
    try {
        Database.setupEventListeners();
        await Database.connect();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        process.exit(1);
    }
}

// Initialize database
await initializeDatabase();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(requestId);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.CLIENT_URL || 'http://localhost:5173',
            'http://localhost:3000',    // Additional development origins
            'http://localhost:4173'     // Vite preview
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Performance monitoring
app.use(responseTime);
app.use(memoryMonitor);
app.use(requestMonitor);

// Request validation
app.use(validateRequest);

// Logging (only in production/staging)
if (process.env.NODE_ENV !== 'development') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// Rate limiting - Apply to all API routes
app.use('/api/auth', authRateLimit);    // Strict rate limiting for auth
app.use('/api', apiRateLimit);          // General API rate limiting

// Health check (before other routes)
app.use(healthCheck);

// API routes
app.get('/api', (req, res) => {
    res.json({
        message: 'MERN Stack API is running!',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: Database.getConnectionStatus(),
        timestamp: new Date().toISOString()
    });
});

// Test endpoints (development only)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/test-error', (req, res, next) => {
        const error = new Error('Test error for Sentry monitoring');
        error.status = 500;
        next(error);
    });

    app.get('/api/test-slow', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        res.json({ message: 'Slow endpoint for testing' });
    });
}

// Custom error middleware (before Sentry error handler)
app.use(sentryErrorMiddleware);

// Sentry error handler (must be after all routes)
setupSentryErrorHandler(app);

// Final Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    const isDevelopment = process.env.NODE_ENV === 'development';
    const status = err.status || err.statusCode || 500;

    res.status(status).json({
        error: {
            message: err.message || 'Internal Server Error',
            status,
            ...(isDevelopment && {
                stack: err.stack,
                details: err
            }),
            timestamp: new Date().toISOString(),
            requestId: req.id
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            path: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
            requestId: req.id
        }
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Version: ${process.env.APP_VERSION || '1.0.0'}`);
    console.log(`Security: Enhanced middleware enabled`);
    console.log(`Performance: Monitoring enabled`);
    console.log(`Database: ${Database.getConnectionStatus()}`);
});

// Setup graceful shutdown
setupGracefulShutdown(server);

export default app;