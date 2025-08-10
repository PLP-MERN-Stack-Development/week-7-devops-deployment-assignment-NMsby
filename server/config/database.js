import mongoose from 'mongoose';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log')
        }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

class Database {
    constructor() {
        this.mongoUri = process.env.MONGODB_URI;
        this.isConnected = false;

        // Validate environment variable
        if (!this.mongoUri) {
            logger.error('MONGODB_URI environment variable is not set');
            throw new Error('MONGODB_URI environment variable is required');
        }
    }

    async connect() {
        try {
            if (this.isConnected) {
                logger.info('MongoDB already connected');
                return;
            }

            logger.info('Attempting to connect to MongoDB Atlas...');
            logger.info(`Connection string format: ${this.mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

            // Connection options optimized for Atlas
            const options = {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 10000, // Increased timeout for Atlas
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

            // Provide specific error guidance
            if (error.message.includes('authentication failed')) {
                logger.error('Authentication failed - check username and password');
            } else if (error.message.includes('ENOTFOUND')) {
                logger.error('Network error - check connection string and internet connectivity');
            } else if (error.message.includes('serverSelectionTimeoutMS')) {
                logger.error('Connection timeout - check network access rules in MongoDB Atlas');
            }

            throw error; // Don't exit process in database class
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