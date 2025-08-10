import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from '../config/database.js';
import { User } from '../models/index.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testDatabaseConnection() {
    try {
        console.log('Testing MongoDB Atlas connection...');

        // Debug environment variables
        console.log('Environment check:');
        console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'LOADED' : 'NOT FOUND'}`);
        console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI environment variable is not set');
            console.log('Make sure your .env file exists in the server directory');
            process.exit(1);
        }

        // Connect to database
        Database.setupEventListeners();
        await Database.connect();

        console.log('Database connection successful!');

        // Test User model
        console.log('Testing User model...');

        const testUser = new User({
            username: `testuser_${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            password: 'TestPassword123!',
            profile: {
                firstName: 'Test',
                lastName: 'User'
            }
        });

        await testUser.save();
        console.log('User model test successful!');
        console.log('Created user:', testUser.toJSON());

        // Clean up test user
        await User.deleteOne({ _id: testUser._id });
        console.log('Test user cleaned up');

        // Disconnect
        await Database.disconnect();
        console.log('All tests passed!');

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testDatabaseConnection();