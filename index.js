import { Scraper, SearchMode } from 'agent-twitter-client'; // Import the Scraper class
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Create a new instance of the Scraper class
const scraper = new Scraper();

// Helper function to login
async function loginToTwitter() {
    await scraper.login(
        process.env.TWITTER_USERNAME,
        process.env.TWITTER_PASSWORD,
        process.env.TWITTER_EMAIL,
        process.env.TWITTER_APP_KEY,
        process.env.TWITTER_APP_SECRET,
        process.env.TWITTER_ACCESS_TOKEN,
        process.env.TWITTER_ACCESS_TOKEN_SECRET
    );
}

// Function to fetch tweets
async function fetchTweets(query, limit) {
    let allTweets = [];
    let nextCursor = null;
    let response;

    try {
        do {
            // Fetch tweets with the current cursor
            response = await scraper.fetchSearchTweets(query, limit, SearchMode.Top, nextCursor);
            const tweets = response.tweets;

            allTweets = allTweets.concat(tweets);

            // Break if we have reached the limit
            if (allTweets.length >= limit) {
                allTweets = allTweets.slice(0, limit); // Slice to the exact limit
                break;
            }

            nextCursor = response.next;
        } while (nextCursor); // Continue fetching until limit is reached or no more data
    } catch (error) {
        console.error('Error fetching tweets:', error);
        if (response && response.errors) {
            console.error('Twitter API errors:', response.errors);
        }
    }

    return allTweets;
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Define the /tweets endpoint
app.get('/tweets', async (req, res) => {
    const query = req.query.q || 'DOGECOIN';  // Default query if not provided
    const limit = parseInt(req.query.limit) || 10;  // Default limit if not provided

    try {
        await loginToTwitter();  // Log in to Twitter before fetching tweets
        const allTweets = await fetchTweets(query, limit);
        res.json(allTweets);  // Respond with the fetched tweets
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tweets' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});