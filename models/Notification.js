import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user who received the notification
    newsId: { type: String, required: true }, // The ID of the news article
    title: { type: String, required: true },  // News title for reference
    sentAt: { type: Date, default: Date.now }, // Time the notification was sent
});

const Notification = mongoose.model('Notification', NotificationSchema);
 export default Notification;