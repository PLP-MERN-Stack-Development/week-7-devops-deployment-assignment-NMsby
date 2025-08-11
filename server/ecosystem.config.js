export default {
    apps: [{
        name: 'mern-server',
        script: 'src/index.js',
        instances: 'max', // Use all CPU cores
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development',
            PORT: 5000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        env_staging: {
            NODE_ENV: 'staging',
            PORT: 5000
        },
        // Production optimizations
        max_memory_restart: '1G',
        restart_delay: 5000,
        max_restarts: 5,
        min_uptime: '10s',

        // Logging
        log_file: './logs/combined.log',
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm Z',
        merge_logs: true,

        // Health monitoring
        health_check_grace_period: 3000,
        health_check_timeout: 3000,

        // Advanced features
        instance_var: 'INSTANCE_ID',
        watch: false, // Disable in production
        ignore_watch: ['node_modules', 'logs', '.git'],

        // Graceful shutdown
        kill_timeout: 5000,
        listen_timeout: 8000,

        // Monitoring
        pmx: true,

        // Auto-restart conditions
        autorestart: true,

        // Environment variables for production
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000,
            NODE_OPTIONS: '--max-old-space-size=2048'
        }
    }]
};