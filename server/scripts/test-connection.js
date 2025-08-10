import dotenv from 'dotenv';
import Database from '../config/database.js';
import { User } from '../models/index.js';

dotenv.config();

async function testDatabaseConnection() {
    try {
        console.log('Testing MongoDB Atlas connection...');

        // Connect to database
        Database.setupEventListeners();
        await Database.connect();

        console.log('Database connection successful!');

        // Test User model
        console.log('🧪 Testing User model...');

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
        console.log('✅ User model test successful!');
        console.log('📄 Created user:', testUser.toJSON());

        // Clean up test user
        await User.deleteOne({ _id: testUser._id });
        console.log('🧹 Test user cleaned up');

        // Disconnect
        await Database.disconnect();
        console.log('✅ All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testDatabaseConnection();