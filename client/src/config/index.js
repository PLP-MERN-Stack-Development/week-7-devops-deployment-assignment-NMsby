// Environment configuration
const config = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
    APP_NAME: import.meta.env.VITE_APP_NAME || 'MERN App',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',

    // Build-time constants
    BUILD_TIME: __BUILD_TIME__,

    // Computed values
    get IS_PRODUCTION() {
        return this.NODE_ENV === 'production';
    },

    get IS_DEVELOPMENT() {
        return this.NODE_ENV === 'development';
    }
};

export default config;