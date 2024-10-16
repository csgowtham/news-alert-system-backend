import User from '../models/User.js';
import { sendNewsNotifications } from './newsController.js'; // Use your existing news sending logic

// Fetch and send notifications to users based on their frequency preferences
export const fetchAndSendNotifications = async (frequency) => {
    try {
        const users = await User.find({ 'preferences.frequency': frequency });

        if (users.length === 0) {
            console.log(`No users with ${frequency} notification preference found.`);
            return;
        }

        // Iterate over each user and send notifications
        for (const user of users) {
            const { email, preferences } = user;

            if (!email || !preferences.categories || preferences.categories.length === 0) {
                console.log(`User ${email} has no categories set.`);
                continue;
            }

            // Send notifications based on user preferences
            await sendNewsNotifications(preferences.categories);

            console.log(`Notifications sent to ${email} for frequency: ${frequency}`);
        }
    } catch (error) {
        console.error("Error fetching and sending notifications:", error);
    }
};
