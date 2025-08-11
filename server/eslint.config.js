import js from '@eslint/js';
import globals from 'globals';

export default [
    // Global ignores
    {
        ignores: [
            'node_modules/**',
            'logs/**',
            'temp/**',
            'coverage/**',
            '**/*.test.js',
            '**/*.spec.js'
        ]
    },

    // Main configuration for all JavaScript files
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2022
            }
        },
        rules: {
            ...js.configs.recommended.rules,

            // Node.js specific rules
            'no-console': 'warn',
            'no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'prefer-const': 'error',
            'no-var': 'error',

            // ES6+ rules
            'arrow-spacing': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-template': 'error',

            // Async/await best practices
            'no-async-promise-executor': 'error',
            'require-await': 'warn'
        }
    },

    // Configuration for test files
    {
        files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest
            }
        },
        rules: {
            'no-console': 'off'
        }
    }
];