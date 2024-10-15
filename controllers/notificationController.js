import User from '../models/User.js';
import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

console.log('Email :', process.env.EMAIL);
console.log('Password :', process.env.PASS);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: process.env.EMAIL, // Use environment variables
        pass: process.env.PASS, // Use environment variables
    },
    secure: true,
    tls: {
        rejectUnauthorized: false,
    },
});

// Fetch news based on user categories
const fetchNewsForCategories = async (categories) => {
    const apiKey = "07fa8d6f7c4f41ed9cbabdeaff6d587b"; // Replace with your News API key
    const query = categories.join(' OR ');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=popularity&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Log the entire response for debugging
        //console.log('API Response:', data);

        // Check if the response contains articles
        if (!data.articles) {
            throw new Error('No articles found in response');
        }

        return data.articles;
    } catch (error) {
        console.error('Error fetching news:', error);
        return []; // Return an empty array in case of error
    }
};


// Function to send notifications
const sendNotification = async (email, message) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'News Update Notification',
        text: message,
    };

    await transporter.sendMail(mailOptions);
};

// Function to fetch and send notifications based on user preferences
export const fetchAndSendNotifications = async (frequency) => {
    const users = await User.find({ 'preferences.frequency': frequency });

    for (const user of users) {
        const { preferences } = user;
        if (!preferences || !preferences.categories.length) continue; // Skip if no categories set

        const articles = await fetchNewsForCategories(preferences.categories);
        const sentNotifications = await Notification.find({ userId: user._id });

        // Filter out duplicate notifications
        const sentNewsIds = sentNotifications.map(notif => notif.newsId);
        const newArticles = articles.filter(article => !sentNewsIds.includes(article.id));

        // Send notifications if new articles are found
        if (newArticles.length > 0) {
            let message = newArticles.map(article => article.title).join('\n');
            await sendNotification(user.email, message);

            // Save new notifications in the database
            for (const article of newArticles) {
                const notification = new Notification({
                    userId: user._id,
                    newsId: article.id,
                    title: article.title,
                });
                await notification.save();
            }

            console.log(`Notifications sent to ${user.email}`);
        } else {
            console.log(`No new articles to notify for user ${user.email}`);
        }
    }
};
