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
import rateLimit from 'express-rate-limit';
import Database from '../config/database.js';
import { setupSentryMiddleware, setupSentryErrorHandler, sentryErrorMiddleware } from '../middleware/sentry.js';

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
        console.error('Please check your MongoDB Atlas configuration and try again');
        process.exit(1);
    }
}

// Initialize database
await initializeDatabase();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting - Apply to all API routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'MERN Stack Server is running!',
        version: process.env.APP_VERSION || '1.0.0',
        status: 'healthy',
        endpoints: {
            health: '/api/health',
            api: '/api'
        }
    });
});

// Basic API route
app.get('/api', (req, res) => {
    res.json({
        message: 'MERN Stack API is running!',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: Database.getConnectionStatus(),
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint with database status
app.get('/api/health', (req, res) => {
    const dbStatus = Database.getConnectionStatus();
    const isHealthy = Database.isHealthy();

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        database: {
            status: dbStatus,
            connected: isHealthy
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Test error endpoint (development only)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/test-error', (req, res, next) => {
        const error = new Error('Test error for Sentry monitoring');
        error.status = 500;
        next(error);
    });
}

// Custom error middleware (before Sentry error handler)
app.use(sentryErrorMiddleware);

// Sentry error handler (must be after all routes)
setupSentryErrorHandler(app);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err.stack);

    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(500).json({
        message: 'Something went wrong!',
        error: isDevelopment ? err.message : 'Internal Server Error',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
});

// 404 handler - FIXED: Use proper route pattern for Express 5.x
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Version: ${process.env.APP_VERSION || '1.0.0'}`);
    console.log(`Database: ${Database.getConnectionStatus()}`);
});

export default app;