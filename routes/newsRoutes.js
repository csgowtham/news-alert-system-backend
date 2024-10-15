import express from 'express';
import { getNews, getSavedNews, updatePreferences, getTopHeadlines, getWeather, getNotificationHistory, sendNotifications } from '../controllers/newsController.js'; // Import the updatePreferences function
import { authenticate } from '../middleware/authMiddleware.js'; // Ensure this path is correct

const router = express.Router();

router.get('/test', (req, res) => {
    res.send("Test route works!");
});

// Route to fetch news based on user preferences
router.get('/', authenticate, getNews);

// Route to fetch saved news articles from the database
router.get('/saved', authenticate, getSavedNews);

router.get('/weather', getWeather);

// Route to update user preferences
router.post('/preferences', authenticate, updatePreferences); // New route for preferences

router.get('/top-headlines', getTopHeadlines, authenticate, updatePreferences);

router.get('/notifications/:userId', getNotificationHistory);

// Route to send notifications to the user
router.post('/send-notifications', sendNotifications);



export default router;
