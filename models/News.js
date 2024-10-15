import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    source: { type: String, required: true },
    category: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    image: { type: String },
    userEmail: { type: String, required: true },  // New field added to track the user
    notificationSent: { type: Boolean, default: false } 
});

const News = mongoose.model('News', newsSchema);

export default News;
