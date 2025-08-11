import { Sentry, captureError } from '../config/sentry.js';

// Request context middleware
export function setupSentryMiddleware(app) {
    // Only setup Sentry middleware if Sentry is properly initialized
    if (!process.env.SENTRY_DSN) {
        console.log('ℹ️ Sentry middleware skipped - no SENTRY_DSN provided');
        return; // Exit early if no Sentry DSN
    }

    try {
        // RequestHandler creates a separate execution context
        app.use(Sentry.requestHandler());

        // TracingHandler creates a transaction for every request
        app.use(Sentry.tracingHandler());
        console.log('✅ Sentry middleware initialized');
    } catch (error) {
        console.warn('⚠️ Sentry middleware setup failed:', error.message);
    }
}

// Error handler middleware (must be after all routes)
export function setupSentryErrorHandler(app) {
    // Only setup error handler if Sentry is initialized
    if (!process.env.SENTRY_DSN) {
        return; // Exit early if no Sentry DSN
    }

    try {
        app.use(Sentry.errorHandler({
            shouldHandleError(error) {
                // Capture 4xx and 5xx errors
                return error.status >= 400;
            }
        }));
        console.log('✅ Sentry error handler initialized');
    } catch (error) {
        console.warn('⚠️ Sentry error handler setup failed:', error.message);
    }
}

// Custom error middleware
export function sentryErrorMiddleware(err, req, res, next) {
    // Only capture to Sentry if it's available
    if (process.env.SENTRY_DSN) {
        try {
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
        } catch (sentryError) {
            console.warn('⚠️ Failed to capture error to Sentry:', sentryError.message);
        }
    }

    next(err);
}