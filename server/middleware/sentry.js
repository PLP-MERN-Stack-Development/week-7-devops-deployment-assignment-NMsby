import { Sentry, captureError } from '../config/sentry.js';

// Request context middleware
export function setupSentryMiddleware(app) {
    // RequestHandler creates a separate execution context
    app.use(Sentry.requestHandler());

    // TracingHandler creates a transaction for every request
    app.use(Sentry.tracingHandler());
}

// Error handler middleware (must be after all routes)
export function setupSentryErrorHandler(app) {
    app.use(Sentry.errorHandler({
        shouldHandleError(error) {
            // Capture 4xx and 5xx errors
            return error.status >= 400;
        }
    }));
}

// Custom error middleware
export function sentryErrorMiddleware(err, req, res, next) {
    // Add request context to error
    const context = {
        request: {
            method: req.method,
            url: req.url,
            headers: {
                'user-agent': req.get('User-Agent'),
                'content-type': req.get('Content-Type')
            },
            body: req.body,
            query: req.query,
            params: req.params
        },
        user: req.user ? {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        } : null
    };

    captureError(err, context);
    next(err);
}