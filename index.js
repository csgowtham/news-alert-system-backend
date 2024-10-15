import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import authRoutes from './routes/authRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import User from './models/User.js';
import bodyParser from 'body-parser';
import { fetchAndSendNotifications } from './controllers/notificationController.js'; // Import notification logic

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json()); 
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

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // Use environment variables
        pass: process.env.PASS,
    },
    pool: true,  // Use pooled connections
    rateLimit: true,  // Enable rate limiting
    maxConnections: 5,  // Limit the number of concurrent connections
    maxMessages: 100,  // Maximum number of messages to send in a batch
    keepAlive: true,  // Keep the connection alive
    connectionTimeout: 10000,  // Timeout if no response from the server in 10 seconds
    socketTimeout: 10000,  // Socket timeout to 10 seconds
    debug: true,  // Enable debug mode to see logs
});


// Function to send email
const sendEmail = (email, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: subject,
        text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

// Schedule notifications for daily, weekly, and monthly users
const scheduleNotifications = () => {
    // Daily notifications at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log("Sending daily notifications...");
        await fetchAndSendNotifications('daily');
    });

    // Weekly notifications on Monday at 9 AM
    cron.schedule('0 9 * * 1', async () => {
        console.log("Sending weekly notifications...");
        await fetchAndSendNotifications('weekly');
    });

    // Monthly notifications on the 1st of every month at 9 AM
    cron.schedule('0 9 1 * *', async () => {
        console.log("Sending monthly notifications...");
        await fetchAndSendNotifications('monthly');
    });
};

// Start scheduling
// scheduleNotifications();
//fetchAndSendNotifications('daily');

// Function to test sending an email
const testEmail = () => {
    const testEmail = 'csgowtham2004@gmail.com'; // Change this to a valid recipient email
    sendEmail(testEmail, 'Test Email', 'This is a test email from Nodemailer.');
};

// Call the test function
//testEmail();


// Start Express server and Socket.IO
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server and DB connection
const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();

