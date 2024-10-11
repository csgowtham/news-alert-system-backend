import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import authRoutes from './routes/authRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import User from './models/User.js'; // Import User model
import { fetchNewsFromAPI } from './controllers/newsController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);

// MongoDB connection function
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/newsAlertSystem', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

// Create HTTP server and Socket.IO server
const server = http.createServer(app);
const io = new Server(server);

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Schedule a job to fetch news periodically
cron.schedule('0 * * * *', async () => { // Every hour
    try {
        const users = await User.find({}); // Fetch all users
        users.forEach(async (user) => {
            const newsData = await fetchNewsFromAPI(user.preferences.categories);
            if (newsData) {
                io.emit('newsUpdate', newsData); // Notify connected clients
            }
        });
    } catch (error) {
        console.error("Error fetching news for users:", error);
    }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).json({ error: 'Something went wrong!' });
});

console.log("Starting the server...");

const startServer = async () => {
    await connectDB(); // Wait for DB connection
    server.listen(PORT, () => { // Use server for Socket.IO
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
