import mongoose from 'mongoose';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

class Database {
    constructor() {
        this.mongoUri = process.env.MONGODB_URI;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                logger.info('MongoDB already connected');
                return;
            }

            // Connection options optimized for Atlas
            const options = {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                bufferMaxEntries: 0, // Disable mongoose buffering
                bufferCommands: false, // Disable mongoose buffering
            };

            await mongoose.connect(this.mongoUri, options);
            this.isConnected = true;

            logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
            logger.info(`Database: ${mongoose.connection.name}`);

        } catch (error) {
            logger.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        try {
            await mongoose.connection.close();
            this.isConnected = false;
            logger.info('MongoDB disconnected');
        } catch (error) {
            logger.error('MongoDB disconnection error:', error);
        }
    }

    // Handle connection events
    setupEventListeners() {
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose connected to MongoDB Atlas');
        });

        mongoose.connection.on('error', (error) => {
            logger.error('Mongoose connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('Mongoose disconnected from MongoDB Atlas');
            this.isConnected = false;
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    // Health check method
    isHealthy() {
        return mongoose.connection.readyState === 1;
    }

    getConnectionStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose.connection.readyState] || 'unknown';
    }
}

export default new Database();