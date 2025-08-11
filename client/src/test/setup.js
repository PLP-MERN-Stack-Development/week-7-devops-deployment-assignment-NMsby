import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('../config/index.js', () => ({
    default: {
        API_URL: 'http://localhost:5000/api',
        API_TIMEOUT: 10000,
        APP_NAME: 'MERN Test App',
        APP_VERSION: '1.0.0',
        NODE_ENV: 'test',
        SENTRY_DSN: '',
        SENTRY_ENVIRONMENT: 'test',
        ENABLE_ANALYTICS: false,
        ENABLE_DEBUG: true,
        BUILD_TIME: '2025-01-01T00:00:00.000Z',
        IS_PRODUCTION: false,
        IS_DEVELOPMENT: false
    }
}));

// Mock Sentry
vi.mock('../config/sentry.js', () => ({
    initializeSentry: vi.fn(),
    SentryErrorBoundary: ({ children }) => children,
    captureError: vi.fn(),
    captureMessage: vi.fn(),
    setUserContext: vi.fn(),
    Sentry: {
        addBreadcrumb: vi.fn(),
        captureException: vi.fn(),
        captureMessage: vi.fn()
    }
}));

// Mock fetch
global.fetch = vi.fn();

// Mock performance API
global.performance = {
    now: vi.fn(() => Date.now())
};

// Setup DOM APIs
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});