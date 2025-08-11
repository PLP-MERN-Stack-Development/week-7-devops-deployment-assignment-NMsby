import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';

export default [
    // Global ignores
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            '.vite/**',
            'build/**'
        ]
    },

    // Main configuration for JS/JSX files
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2022,
                // Node.js globals for config files
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                // Vite build-time constants
                __BUILD_TIME__: 'readonly',
                __APP_VERSION__: 'readonly'
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },
        rules: {
            ...js.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,

            // React rules
            'react/jsx-uses-react': 'error',
            'react/jsx-uses-vars': 'error',
            'react/prop-types': 'off', // We'll use TypeScript for prop validation

            // React Hooks rules
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // React Refresh rules
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true }
            ],

            // General rules
            'no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^(_|error|resetError)' // Allow error parameters
            }],
            'no-undef': 'error',
            'prefer-const': 'error',
            'no-var': 'error'
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    },

    // Configuration for Vite config files
    {
        files: ['vite.config.js', 'vitest.config.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly'
            }
        }
    },

    // Configuration for test files
    {
        files: ['src/test/**/*.js', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.jest,
                vi: 'readonly',
                global: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'off' // Tests often have unused variables
        }
    }
];