export default {
    // Enable experimental VM modules for ES modules support
    extensionsToTreatAsEsm: ['.js'],

    // Test environment
    testEnvironment: 'node',

    // Transform configuration - don't transform ES modules
    transform: {},

    // Module name mapping for ES modules
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    // Test file patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.js',
        '<rootDir>/src/**/*.{test,spec}.js'
    ],

    // Coverage settings
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js'
    ],

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output
    verbose: true
};