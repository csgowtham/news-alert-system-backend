import User from '../models/User.js'; // Use ESM import
import News from '../models/News.js'; // Import News model
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';  



// Fetch news from the News API
export const fetchNewsFromAPI = async (categories) => {
    const apiKey = "07fa8d6f7c4f41ed9cbabdeaff6d587b";
    console.log("API Key:", apiKey); // Check the output here
    const query = categories.join(' OR ');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=popularity&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Fetch Error:", errorDetails); // Log the error details
            throw new Error(`API error: ${response.status} ${errorDetails.message}`);
        }

        const data = await response.json();
        return data.articles
            .filter(article => article.content && article.content !== "[Removed]")
            .map(article => ({
                title: article.title,
                content: article.description || '',
                source: article.source.name,
                category: categories[0],
                publishedAt: article.publishedAt,
                image: article.urlToImage,
            }));
    } catch (error) {
        console.error("Error fetching news:", error);
        throw new Error("Failed to fetch news articles");
    }
};





// Fetch news based on user preferences
export const getNews = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
       

        console.log("User Categories:", user.preferences.categories);
        const userCategories = user.preferences.categories;
        if (!userCategories || userCategories.length === 0) {
            return res.status(400).json({ message: 'No categories set for user preferences.' });
        }

        const newsData = await fetchNewsFromAPI(user.preferences.categories);

        if (!newsData || newsData.length === 0) {
            return res.status(404).json({ message: 'No news articles found for your preferences.' });
        }

        await News.insertMany(newsData);
        res.json(newsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Fetch top headlines from News API
// Fetch top headlines from News API
export const getTopHeadlines = async (req, res) => {
    console.log("Fetching top headlines...");
    const apiKey = '07fa8d6f7c4f41ed9cbabdeaff6d587b';
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

// Function to update user preferences
export const updatePreferences = async (req, res) => {
    const { categories, frequency, notificationChannels } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                preferences: {
                    categories: categories || [],
                    frequency: frequency || 'immediate',
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
