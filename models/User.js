import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: {
        categories: { type: [String], default: [] }, // News categories
        frequency: { type: String, default: 'immediate' }, // 'daily', 'weekly', 'monthly'
        notificationChannels: { type: [String], default: ['email'] },
    },
    notifications: { type: [{ newsId: String, dateSent: Date }], default: [] }, // Tracks sent notifications
});

const User = mongoose.model('User', userSchema);
export default User;
