import * as Sentry from '@sentry/react';
import config from './index.js';

export function initializeSentry() {
    if (!config.SENTRY_DSN) {
        console.warn('SENTRY_DSN not provided - Sentry error tracking disabled');
        return;
    }

    Sentry.init({
        dsn: config.SENTRY_DSN,
        environment: config.SENTRY_ENVIRONMENT,
        release: config.APP_VERSION,

        integrations: [
            // Browser tracing for performance monitoring
            Sentry.browserTracingIntegration(),
            // Session replay for user interaction recording
            Sentry.replayIntegration({
                // Mask sensitive text inputs
                maskAllText: config.IS_PRODUCTION,
                blockAllMedia: config.IS_PRODUCTION,
            }),
        ],

        // Performance monitoring
        tracesSampleRate: config.IS_PRODUCTION ? 0.1 : 1.0,

        // Track propagation to your backend
        tracePropagationTargets: [
            'localhost',
            config.API_URL,
            /^https:\/\/your-backend-domain\.com\/api/,
        ],

        // Session replay sampling
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% when errors occur

        // Filter out sensitive data
        beforeSend(event, hint) {
            // Don't send events in development for certain errors
            if (config.IS_DEVELOPMENT && hint.originalException?.name === 'ChunkLoadError') {
                return null;
            }

            // Filter out user data
            if (event.user) {
                delete event.user.email;
                delete event.user.password;
            }

            return event;
        },

        // Custom error filtering
        ignoreErrors: [
            // Browser extensions
            'Non-Error promise rejection captured',
            'ResizeObserver loop limit exceeded',
            // Network errors
            'NetworkError',
            'ChunkLoadError',
            // Script loading errors
            'Loading chunk',
            'Script error',
        ],
    });

    console.log('Sentry initialized for error tracking');
}

// Error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Helper functions
export function captureError(error, context = {}) {
    Sentry.withScope((scope) => {
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

export function setUserContext(user) {
    Sentry.setUser({
        id: user.id,
        username: user.username,
        // Don't include sensitive data like email or password
    });
}

export { Sentry };