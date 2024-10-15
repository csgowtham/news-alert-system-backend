import mongoose from 'mongoose';
import { fetchAndSendNotifications } from './controllers/notificationController.js'; // Adjust path as necessary
import User from './models/User.js'; // Adjust path as necessary
import Notification from './models/Notification.js'; // Adjust path as necessary

// Mock Nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn((mailOptions, callback) => {
            callback(null, { response: 'Mocked email sent' });
        }),
    })),
}));

describe('Notification Tests', () => {
    beforeAll(async () => {
        // Connect to MongoDB in memory or a test database
        await mongoose.connect('mongodb://127.0.0.1:27017/test_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    it('should send notifications to users with daily frequency', async () => {
        // Setup test user
        const testUser = new User({
            email: 'testuser@example.com',
            preferences: {
                frequency: 'daily',
                categories: ['technology', 'sports'],
            },
        });
        await testUser.save();

        // Call the function to test
        await fetchAndSendNotifications('daily');

        // Check if the notification was saved in the database
        const notifications = await Notification.find({ userId: testUser._id });
        expect(notifications.length).toBeGreaterThan(0);
        expect(notifications[0].userId.toString()).toBe(testUser._id.toString());
    });
});
