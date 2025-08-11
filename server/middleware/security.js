import rateLimit from 'express-rate-limit';
import { Sentry } from '../config/sentry.js';

// Enhanced rate limiting for different endpoints
export const createRateLimit = (windowMs, max, message) =>
    rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            // Log rate limit violations to Sentry
            Sentry.addBreadcrumb({
                message: 'Rate limit exceeded',
                category: 'security',
                data: {
                    ip: req.ip,
                    path: req.path,
                    userAgent: req.get('User-Agent')
                }
            });

            res.status(429).json({
                error: message,
                retryAfter: Math.round(windowMs / 1000),
                timestamp: new Date().toISOString()
            });
        }
    });

// Strict rate limiting for authentication endpoints
export const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts, please try again later'
);

// General API rate limiting
export const apiRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests from this IP, please try again later'
);

// Strict rate limiting for password reset
export const passwordResetRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts
    'Too many password reset attempts, please try again later'
);

// Request validation middleware
export function validateRequest(req, res, next) {
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /(\.|%2e){2,}/i, // Path traversal
        /<script|javascript:/i, // XSS attempts
        /union.*select|drop.*table/i, // SQL injection
        /(\x00|\x04|\x1a)/, // Null bytes
    ];

    const checkString = `${req.path}${JSON.stringify(req.query)}${JSON.stringify(req.body)}`;

    if (suspiciousPatterns.some(pattern => pattern.test(checkString))) {
        // Log security violation
        Sentry.addBreadcrumb({
            message: 'Suspicious request pattern detected',
            category: 'security',
            level: 'warning',
            data: {
                ip: req.ip,
                path: req.path,
                userAgent: req.get('User-Agent'),
                pattern: 'detected'
            }
        });

        return res.status(400).json({
            error: 'Invalid request pattern detected',
            timestamp: new Date().toISOString()
        });
    }

    next();
}

// Request size middleware
export function limitRequestSize(maxSize = '10mb') {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || 0);
        const maxBytes = parseSize(maxSize);

        if (contentLength > maxBytes) {
            return res.status(413).json({
                error: 'Request entity too large',
                maxSize,
                timestamp: new Date().toISOString()
            });
        }

        next();
    };
}

// Helper function to parse size strings
function parseSize(size) {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    return parseFloat(match[1]) * (units[match[2]] || 1);
}

// Security headers middleware
export function securityHeaders(req, res, next) {
    // OWASP security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remove revealing headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
}

// Request ID middleware for tracing
export function requestId(req, res, next) {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.id = id;
    res.setHeader('X-Request-ID', id);

    // Add to Sentry scope
    Sentry.configureScope(scope => {
        scope.setTag('requestId', id);
    });

    next();
}