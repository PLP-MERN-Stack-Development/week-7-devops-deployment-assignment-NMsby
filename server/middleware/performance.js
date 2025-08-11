import { performance } from 'perf_hooks';
import { Sentry } from '../config/sentry.js';

// Response time middleware
export function responseTime(req, res, next) {
    const start = performance.now();

    res.on('finish', () => {
        const duration = performance.now() - start;

        // Log slow requests
        if (duration > 1000) { // 1 second threshold
            Sentry.addBreadcrumb({
                message: 'Slow request detected',
                category: 'performance',
                level: 'warning',
                data: {
                    path: req.path,
                    method: req.method,
                    duration: `${duration.toFixed(2)}ms`,
                    statusCode: res.statusCode
                }
            });
        }

        // Add performance header
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    });

    next();
}

// Memory monitoring middleware
export function memoryMonitor(req, res, next) {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);

    // Warning threshold: 512MB
    if (totalMB > 512) {
        Sentry.addBreadcrumb({
            message: 'High memory usage detected',
            category: 'performance',
            level: 'warning',
            data: {
                memoryUsage: `${totalMB}MB`,
                heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
                path: req.path
            }
        });
    }

    next();
}

// Request monitoring middleware
export function requestMonitor(req, res, next) {
    const startTime = Date.now();

    // Track request details
    Sentry.addBreadcrumb({
        message: 'Request started',
        category: 'http',
        data: {
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        }
    });

    res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Track response details
        Sentry.addBreadcrumb({
            message: 'Request completed',
            category: 'http',
            data: {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration}ms`
            }
        });
    });

    next();
}

// Graceful shutdown handler
export function setupGracefulShutdown(server) {
    const gracefulShutdown = (signal) => {
        console.log(`📡 Received ${signal}. Starting graceful shutdown...`);

        server.close(() => {
            console.log('✅ HTTP server closed.');
            process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
            console.error('❌ Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
}

// Health check middleware with detailed metrics
export function healthCheck(req, res, next) {
    if (req.path === '/api/health') {
        const usage = process.memoryUsage();
        const uptime = process.uptime();

        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0',
            uptime: {
                seconds: Math.floor(uptime),
                human: formatUptime(uptime)
            },
            memory: {
                rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(usage.external / 1024 / 1024)}MB`
            },
            system: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                pid: process.pid
            }
        };

        return res.json(healthData);
    }

    next();
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}