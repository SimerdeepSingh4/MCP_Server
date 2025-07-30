import fetch from "node-fetch";
import { TwitterApi } from "twitter-api-v2";
import { config } from "dotenv";
import fs from "fs";
import axios from "axios";

config();

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

export async function getTrendingHashtags({ category }) {
    try {
        // Get trending topics from Twitter API
        // Twitter Trends API requires a WOEID (Where On Earth ID). 1 is the worldwide ID
        const trends = await twitterClient.v1.trendsPlace(1);
        
        if (!trends || !trends[0] || !trends[0].trends) {
            throw new Error("No trends data available");
        }

        // Filter trends based on category and get hashtags
        const allTrends = trends[0].trends;
        const relevantTrends = allTrends
            .filter(trend => {
                const trendText = trend.name.toLowerCase();
                const categoryText = category.toLowerCase();
                return (trend.name.startsWith('#') && 
                       (trendText.includes(categoryText) || 
                        trendText.includes('tech') || 
                        trendText.includes('ai') || 
                        trendText.includes('education')));
            })
            .slice(0, 5)
            .map(t => t.name);

        const hashtagsText = relevantTrends.length > 0 
            ? relevantTrends.join(' ') 
            : `#${category} #AI #Education #Tech #Innovation`;

        return {
            content: [{
                type: "text",
                text: hashtagsText
            }]
        };
    } catch (error) {
        console.error("Error getting trends:", error);
        return {
            content: [{
                type: "text",
                text: `#${category} #AI #Education #Tech #Innovation`
            }]
        };
    }
}

export async function findImage(args) {
    try {
        // Validate Pexels API key
        if (!process.env.PEXELS_API_KEY) {
            throw new Error("Pexels API key is not configured");
        }

        // Extract topic from args and ensure it's a string
        const topic = typeof args === 'object' ? args.topic : args;
        const topicLower = String(topic || '').toLowerCase();
        let searchQuery = topic + " education technology";  // Always include education and technology
        let specificKeywords = [];

        // AI and ML specific terms
        if (topicLower.includes('ai') || topicLower.includes('artificial intelligence') || topicLower.includes('machine learning')) {
            specificKeywords = [
                'data visualization classroom',
                'digital technology education',
                'computer learning student',
                'smart classroom technology',
                'artificial intelligence education'
            ];
        }

        // Education specific terms
        if (topicLower.includes('education') || topicLower.includes('learning') || topicLower.includes('student')) {
            specificKeywords = specificKeywords.concat([
                'classroom technology modern',
                'digital learning student',
                'educational technology computer',
                'modern classroom technology',
                'student learning computer'
            ]);
        }

        // Add specific contexts
        if (topicLower.includes('data') || topicLower.includes('analytics')) {
            specificKeywords.push('data analysis education', 'learning analytics dashboard');
        }
        if (topicLower.includes('virtual') || topicLower.includes('vr')) {
            specificKeywords.push('virtual reality classroom', 'vr education student');
        }
        if (topicLower.includes('robot')) {
            specificKeywords.push('educational robotics', 'classroom robot learning');
        }

        let bestMatch = null;
        let bestMatchDescription = "";

        // Try each keyword combination until we find a good match
        for (const keyword of [searchQuery, ...specificKeywords]) {
            console.log("Trying image search with query:", keyword);
            console.log(`Searching Pexels with keyword: "${keyword}"`);
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=5`, {
                headers: {
                    Authorization: process.env.PEXELS_API_KEY
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API error for query:", keyword, "Status:", res.status, "Response:", errorText);
                continue;
            }

            const data = await res.json();
            if (!data.photos?.length) {
                console.log("No photos found for query:", keyword);
                continue;
            }

            // Find the best photo from this batch
            for (const photo of data.photos) {
                if (photo.src.large && photo.alt) {
                    const description = photo.alt.toLowerCase();
                    if (description.includes('technology') || 
                        description.includes('digital') || 
                        description.includes('computer') || 
                        description.includes('education') || 
                        description.includes('learning') ||
                        description.includes('classroom') ||
                        description.includes('student')) {
                        bestMatch = photo.src.large;
                        bestMatchDescription = photo.alt;
                        console.log("Found relevant image:", bestMatchDescription);
                        break;
                    }
                }
            }

            if (bestMatch) break;
        }

        if (!bestMatch) {
            console.log("No suitable image found after trying all keywords");
            return {
                content: [{
                    type: "text",
                    text: "No suitable image found for the topic"
                }],
                isError: true
            };
        }

        return {
            content: [{
                type: "text",
                text: bestMatch
            }]
        };
    } catch (error) {
        console.error("Error finding image:", error);
        return {
            content: [{
                type: "text",
                text: "Error finding image: " + error.message
            }],
            isError: true
        };
    }
}


export async function createPost({ status, image_url, isThread = false, threadParts = [] }) {
    try {
        console.log("Posting to Twitter:", status);
        const tweetText = status.slice(0, 280); // Ensure we don't exceed Twitter's limit

        let mediaId;
        if (image_url) {
            try {
                console.log("Downloading image from:", image_url);
                const response = await axios.get(image_url, { 
                    responseType: 'arraybuffer',
                    timeout: 5000 // 5 second timeout
                });
                
                if (response.status !== 200) {
                    throw new Error(`Image download failed with status ${response.status}`);
                }

                console.log("Image downloaded, uploading to Twitter...");
                const buffer = Buffer.from(response.data, 'binary');
                mediaId = await twitterClient.v1.uploadMedia(buffer, { mimeType: 'image/jpeg' });
                console.log("Image uploaded successfully with mediaId:", mediaId);
            } catch (e) {
                console.error("Image processing failed:", e);
                // Continue without the image
            }
        }

        console.log("Sending tweet...");
        let reply_to;
        
        // Post the main tweet
        const tweet = await twitterClient.v2.tweet({
            text: tweetText,
            media: mediaId ? { media_ids: [mediaId] } : undefined
        });
        
        reply_to = tweet.data.id;

        // If this is a thread, post the additional parts
        if (isThread && threadParts && threadParts.length > 0) {
            console.log("Creating thread with", threadParts.length, "additional tweets");
            for (const part of threadParts) {
                const threadTweet = await twitterClient.v2.tweet({
                    text: part.slice(0, 280),
                    reply: { in_reply_to_tweet_id: reply_to }
                });
                reply_to = threadTweet.data.id;
            }
            return {
                content: [{ 
                    type: "text", 
                    text: `Thread posted! Main tweet: ${tweetText}${mediaId ? ' (with image)' : ''}\nThread length: ${threadParts.length + 1} tweets` 
                }]
            };
        }

        return {
            content: [{ 
                type: "text", 
                text: `Tweeted: ${tweetText}${mediaId ? ' (with image)' : ''}` 
            }]
        };
    } catch (error) {
        console.error("Tweet error:", error);
        return {
            content: [{ type: "text", text: `Failed to tweet: ${error.message}` }],
            isError: true
        };
    }
}

