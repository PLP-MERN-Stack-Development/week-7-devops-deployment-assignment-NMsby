import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],

    // Build optimization
    build: {
        // Target modern browsers with ES2022 support
        target: 'es2022',
        // Optimize chunk size
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor chunks for better caching
                    vendor: ['react', 'react-dom'],
                    // Add more chunks as needed
                }
            }
        },
        // Enable source maps for production debugging
        sourcemap: process.env.NODE_ENV === 'development',
        // Minimize bundle size
        minify: 'esbuild',
        // Chunk size warning limit
        chunkSizeWarningLimit: 1000
    },

    // Development server configuration
    server: {
        port: 5173,
        host: true, // Allow external connections
        proxy: {
            // Proxy API requests to backend during development
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false
            }
        }
    },

    // Preview server (for production build testing)
    preview: {
        port: 4173,
        host: true
    },

    // Path aliases for cleaner imports
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@assets': path.resolve(__dirname, './src/assets')
        }
    },

    // Environment variables prefix
    envPrefix: 'VITE_',

    // Define global constants
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
})