import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    source: { type: String, required: true },
    category: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    image: { type: String },
});

const News = mongoose.model('News', newsSchema);

export default News;  // Ensure you have this line
