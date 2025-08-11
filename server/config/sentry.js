import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry() {
    if (!process.env.SENTRY_DSN) {
        console.warn('SENTRY_DSN not provided - Sentry error tracking disabled');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.APP_VERSION || '1.0.0',

        integrations: [
            // Add profiling integration
            nodeProfilingIntegration(),
            // HTTP integration for request tracking
            Sentry.httpIntegration(),
            // Express integration
            Sentry.expressIntegration(),
        ],

        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Filter out sensitive data
        beforeSend(event) {
            // Remove sensitive headers
            if (event.request?.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
            }

            // Remove password fields
            if (event.extra?.body) {
                const body = event.extra.body;
                if (typeof body === 'object' && body.password) {
                    body.password = '[Filtered]';
                }
            }

            return event;
        },

        // Custom error filtering
        beforeSendTransaction(event) {
            // Don't send health check transactions in production
            if (process.env.NODE_ENV === 'production' &&
                event.transaction?.includes('/api/health')) {
                return null;
            }
            return event;
        }
    });

    console.log('Sentry initialized for error tracking');
}

// Helper functions for manual error reporting
export function captureError(error, context = {}) {
    Sentry.withScope((scope) => {
        // Add context
        Object.keys(context).forEach(key => {
            scope.setContext(key, context[key]);
        });

        Sentry.captureException(error);
    });
}

export function captureMessage(message, level = 'info', context = {}) {
    Sentry.withScope((scope) => {
        Object.keys(context).forEach(key => {
            scope.setContext(key, context[key]);
        });

        Sentry.captureMessage(message, level);
    });
}

export function addBreadcrumb(message, category = 'default', data = {}) {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now() / 1000
    });
}

export { Sentry };