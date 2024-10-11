import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: {
        categories: { type: [String], default: [] },
        frequency: { type: String, default: 'immediate' },
        notificationChannels: { type: [String], default: ['email'] }, // Add this line
    },
    notifications: { type: [{ type: String }], default: [] },
});


const User = mongoose.model('User', userSchema);

export default User;  
