import User from '../models/User.js'; // Use ESM import
import News from '../models/News.js'; // Import News model
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';  
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

dotenv.config();





// Fetch news from the News API
export const fetchNewsFromAPI = async (categories) => {
   
    const apiKey = process.env.NEWS_API_KEY;
    const query = categories.join(' OR ');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=popularity&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(`API error: ${response.status} ${errorDetails.message}`);
        }

        const data = await response.json();
        return data.articles
            .filter(article => article.content && article.content !== "[Removed]")
            .map(article => ({
                id: crypto.createHash('md5').update(article.title + article.source.name + article.publishedAt).digest('hex'), // Unique hash
                title: article.title,
                content: article.description || '',
                source: article.source.name,
                category: categories[0],
                publishedAt: article.publishedAt,
                image: article.urlToImage || null,
            }));
    } catch (error) {
        throw new Error("Failed to fetch news articles");
    }
};

// Send a notification to a user
const sendNotificationToUser = (user, article) => {
    // Logic for sending email, push notifications, etc.
    console.log(`Notification sent to ${user.email} for article: ${article.title}`);
};

// Send news notifications to users
export const sendNewsNotifications = async (categories) => {
    try {
        const articles = await fetchNewsFromAPI(categories);
        const users = await User.find({});

        for (const user of users) {
            const userId = user._id;
            const sentNews = await Notification.find({ userId });
            const sentNewsIds = sentNews.map(news => news.newsId);

            const newArticles = articles.filter(article => !sentNewsIds.includes(article.id));

            if (newArticles.length > 0) {
                for (const article of newArticles) {
                    sendNotificationToUser(user, article);

                    const newNotification = new Notification({
                        userId,
                        newsId: article.id,
                        title: article.title,
                    });

                    await newNotification.save(); // Save notification record
                }

                console.log(`${newArticles.length} new notifications sent to user ${user.email}`);
            } else {
                console.log(`No new articles to notify for user ${user.email}`);
            }
        }
    } catch (error) {
        console.error("Error sending notifications:", error);
    }
};




export const getSavedNews = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const savedArticles = await News.find({ _id: { $in: user.notifications } });
        res.json(savedArticles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getNews = async (req, res) => {
    try {
        // Find the user by their ID
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userEmail = user.email; // Store user's email
        const userCategories = user.preferences.categories; 

        console.log("Fetching news for user:", userEmail);
        console.log("User Categories:", userCategories);

        // Check if user has categories set in their preferences
        if (!userCategories || userCategories.length === 0) {
            userCategories = "general";
            //return res.status(400).json({ message: 'No categories set for user preferences.' });
        }

        // Fetch news articles based on user categories
        const newsData = await fetchNewsFromAPI(userCategories);

        if (!newsData || newsData.length === 0) {
            return res.status(404).json({ message: 'No news articles found for your preferences.' });
        }

        // Check for duplicates by filtering newsData that isn't already in the database for this user
        const existingNewsTitles = await News.find({ userEmail }).select('title');
        const existingTitlesSet = new Set(existingNewsTitles.map(news => news.title));

        const uniqueNewsData = newsData.filter(article => !existingTitlesSet.has(article.title));

        // If there are no new unique articles, return a message
        if (uniqueNewsData.length === 0) {
            console.log("There is no unique article to notify...")
        }

        // Add userEmail to each news article before inserting into the database
        const newsToInsert = uniqueNewsData.map(article => ({
            title: article.title,
            content: article.content,
            source: article.source,
            category: article.category,
            publishedAt: article.publishedAt,
            image: article.image,
            userEmail: userEmail,  // Track which user viewed this news
            notificationSent: false 
        }));

        // Insert unique news articles into the database
        await News.insertMany(newsToInsert);

        // Respond with the newly inserted news articles
        res.json(newsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};



// Function to update user preferences
export const updatePreferences = async (req, res) => {
    const { categories, frequency, notificationChannels } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                preferences: {
                    categories: categories || [],
                    frequency: frequency || 'daily',
                    notificationChannels: notificationChannels || ['email'], // Add this line
                },
            },

            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Preferences updated successfully', preferences: user.preferences });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating preferences' });
    }
};

// Fetch current weather for a given location (e.g., Chennai)
export const getWeather = async (req, res) => {
    const weather_apiKey = process.env.WEATHER_API_KEY;
    const location = req.query.q || 'Coimbatore'; // Default location set to Chennai

    const url = `https://api.weatherapi.com/v1/current.json?key=${weather_apiKey}&q=${encodeURIComponent(location)}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Fetch Error:", errorDetails); // Log the error details
            return res.status(500).json({ message: 'Failed to fetch weather data' });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        res.status(500).json({ error: error.message });
    }
};

// Fetch top headlines
export const getTopHeadlines = async (req, res) => {
    console.log("Fetching top headlines...");
    //const apiKey = '07fa8d6f7c4f41ed9cbabdeaff6d587b';
    const apiKey = process.env.NEWS_API_KEY;
    console.log(apiKey);
    const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Fetch Error:", errorDetails); // Log the error details
            return res.status(500).json({ message: 'Failed to fetch headlines' });
        }
        
        const data = await response.json(); // Correctly access the JSON response

        // Filter out articles with "[Removed]" in title, description, content, or source name
        const filteredArticles = data.articles.filter(article => {
            return !(
                article.title && article.title.includes("[Removed]") ||
                article.description && article.description.includes("[Removed]") ||
                article.content && article.content.includes("[Removed]") ||
                article.source && article.source.name.includes("[Removed]")
            );
        });

        res.json({ articles: filteredArticles });
    } catch (error) {
        console.error("Error fetching top headlines:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getNotificationHistory = async (req, res) => {
    try {
        const { userId } = req.params;  // Assuming you're passing userId as a route parameter

        // Fetch all notifications for the specific user
        const notifications = await Notification.find({ userId });

        if (notifications.length === 0) {
            return res.status(404).json({ message: 'No notifications found for this user' });
        }

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving notifications', error: error.message });
    }
};

export const sendNotifications = async (req, res) => {
    try {
        console.log("Notification request received", req.body);
        console.log("Inside sendNotifications:", req.body);
      const { email } = req.body; // Get the user's email from the request
      console.log("Sending notifications to:", email);
  
      // Find all unnotified news for the user
      const unnotifiedNews = await News.find({ userEmail: email, notificationSent: false });
  
      if (unnotifiedNews.length === 0) {
        return res.status(404).json({ message: 'No new notifications to send' });
      }
  
      // Collect the titles of the unnotified news
      const newsTitles = unnotifiedNews.map(news => news.title);
  
      // Send email to the user (you can customize the email body)
      const transporter = nodemailer.createTransport({
        service: 'Gmail', // or your email provider
        auth: {
          user: process.env.EMAIL, // Your email
          pass: process.env.PASS, // Your password
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your News Updates',
        text: `Here are your latest news updates:\n\n${newsTitles.join('\n')}`,
      };
  
      // Send the email
      await transporter.sendMail(mailOptions);
  
      // Update notificationSent to true for the news that has been notified
      await News.updateMany({ userEmail: email, notificationSent: false }, { $set: { notificationSent: true } });
  
      return res.status(200).json({ message: 'Notifications sent successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error sending notifications' });
    }
  };
  
