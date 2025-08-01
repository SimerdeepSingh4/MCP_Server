import fetch from "node-fetch";
import { TwitterApi } from "twitter-api-v2";
import { config } from "dotenv";
import fs from "fs";
import axios from "axios";
import { exec } from "child_process";
import util from "util";
import { log } from "console";
import path from "path";

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
        const accessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!accessKey) throw new Error("Unsplash Access Key is not configured");

        const topic = typeof args === 'object' ? args.topic : args;
        const fullQuery = String(topic || '').toLowerCase().trim();
        if (!fullQuery) throw new Error("Empty topic provided");

        console.log("Extracting keywords from:", fullQuery);

        const stopwords = ['the', 'is', 'a', 'an', 'and', 'or', 'to', 'in', 'on', 'of', 'for', 'with', 'as', 'by', 'at', 'from'];
        const extractedKeywords = fullQuery
            .split(/\s+/)
            .map(word => word.replace(/[^\w]/g, ''))
            .filter(word => word.length > 2 && !stopwords.includes(word))
            .slice(0, 5);

        const userQuery = extractedKeywords.join(' ') || fullQuery;
        const primarySearchQueries = [userQuery];
        let fallbackQueries = [];

        // Only add fallback educational queries if relevant
        if (/(education|learning|student|ai|technology|classroom|teacher)/i.test(fullQuery)) {
            fallbackQueries = [
                fullQuery + " education technology",
                "AI in education",
                "students using computers",
                "modern classroom learning",
                "digital education"
            ];
        }

        let bestMatch = null;

        for (const query of [...primarySearchQueries, ...fallbackQueries]) {
            console.log("Searching Unsplash with query:", query);

            const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
                headers: { Authorization: `Client-ID ${accessKey}` }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API error:", query, res.status, errorText);
                continue;
            }

            const data = await res.json();
            if (!data.results?.length) {
                console.log("No results for:", query);
                continue;
            }

            // ✅ Allow any image from the first valid query
            for (const photo of data.results) {
                if (photo.urls?.regular) {
                    bestMatch = photo.urls.regular;
                    console.log("Selected:", photo.alt_description || "No description");
                    break;
                }
            }

            if (bestMatch) break;
        }

        if (!bestMatch) {
            console.log("No suitable image found for topic:", fullQuery);
            return {
                content: [{ type: "text", text: "No suitable image found for the topic" }],
                isError: true
            };
        }

        return {
            content: [{ type: "text", text: bestMatch }]
        };

    } catch (error) {
        console.error("Error finding image:", error);
        return {
            content: [{ type: "text", text: "Error finding image: " + error.message }],
            isError: true
        };
    }
}



export async function createPost({ status, image_url, isThread = false, threadParts = [] }) {
    try {
        console.log("Posting to Twitter:", status);
        const tweetText = status.slice(0, 280); // Twitter limit

        let mediaId;
        let imageUploadErrorMessage = null;

        if (image_url) {
            try {
                console.log("Downloading image from:", image_url);
                const response = await axios.get(image_url, {
                    responseType: 'arraybuffer',
                    timeout: 7000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                if (response.status !== 200) {
                    throw new Error(`Image download failed with status ${response.status}`);
                }

                const contentType = response.headers['content-type'];
                if (!['image/jpeg', 'image/jpg', 'image/png'].includes(contentType)) {
                    throw new Error(`Unsupported image format: ${contentType}`);
                }

                const buffer = Buffer.from(response.data, 'binary');
                mediaId = await twitterClient.v1.uploadMedia(buffer, { mimeType: contentType });
                console.log("Image uploaded successfully with mediaId:", mediaId);
            } catch (e) {
                console.error("Image processing failed:", e);
                imageUploadErrorMessage = `⚠️ Image upload failed: ${e.message}`;
            }
        }

        // Post the main tweet
        console.log("Sending tweet...");
        const tweet = await twitterClient.v2.tweet({
            text: tweetText,
            media: mediaId ? { media_ids: [mediaId] } : undefined
        });

        let reply_to = tweet.data.id;

        // If it's a thread
        if (isThread && threadParts && threadParts.length > 0) {
            console.log("Creating thread with", threadParts.length, "additional tweets");
            for (const part of threadParts) {
                const threadTweet = await twitterClient.v2.tweet({
                    text: part.slice(0, 280),
                    reply: { in_reply_to_tweet_id: reply_to }
                });
                reply_to = threadTweet.data.id;
            }
        }

        // Prepare final response
        const resultText = isThread
            ? `🧵 Thread posted! Main tweet: ${tweetText}${mediaId ? ' (with image)' : ''}\nThread length: ${threadParts.length + 1} tweets`
            : `✅ Tweeted: ${tweetText}${mediaId ? ' (with image)' : ''}`;

        const content = [
            { type: "text", text: resultText }
        ];

        if (imageUploadErrorMessage) {
            content.unshift({ type: "text", text: imageUploadErrorMessage });
        }

        return { content };

    } catch (error) {
        console.error("Tweet error:", error);
        return {
            content: [{ type: "text", text: `❌ Failed to tweet: ${error.message}` }],
            isError: true
        };
    }
}
export async function getTweetAnalytics({ tweet_id }) {
    try {
        console.log("Fetching analytics for Tweet ID:", tweet_id);

        // Get tweet with public metrics
        const tweet = await twitterClient.v2.singleTweet(tweet_id, {
            "tweet.fields": ["public_metrics", "created_at"]
        });

        const metrics = tweet?.data?.public_metrics;

        if (!metrics) {
            throw new Error("No metrics found for this tweet.");
        }

        const resultText = `📊 Tweet Analytics:
🆔 ID: ${tweet_id}
📅 Created at: ${tweet.data.created_at}
👀 Impressions: Not available via API
❤️ Likes: ${metrics.like_count}
🔁 Retweets: ${metrics.retweet_count}
💬 Replies: ${metrics.reply_count}
🔁 Quotes: ${metrics.quote_count}`;

        return {
            content: [
                { type: "text", text: resultText }
            ]
        };

    } catch (error) {
        console.error("Analytics fetch failed:", error);
        return {
            content: [{ type: "text", text: `❌ Failed to get analytics: ${error.message}` }],
            isError: true
        };
    }
}

export async function getMyTweets() {
    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

    const userRes = await fetch(`https://api.twitter.com/2/users/me`, {
        headers: {
            Authorization: `Bearer ${BEARER_TOKEN}`
        }
    });

    const userData = await userRes.json();
    const userId = userData.data?.id;

    if (!userId) {
        return {
            content: [
                {
                    type: "text",
                    text: "❌ Unable to retrieve user ID. Make sure authentication is correct."
                }
            ]
        };
    }

    const tweetsRes = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5`, {
        headers: {
            Authorization: `Bearer ${BEARER_TOKEN}`
        }
    });

    const tweetsData = await tweetsRes.json();

    if (!tweetsData?.data) {
        return {
            content: [
                {
                    type: "text",
                    text: "⚠️ No tweets found for the user."
                }
            ]
        };
    }

    const tweetsList = tweetsData.data
        .map(tweet => `🆔 ${tweet.id}\n📄 ${tweet.text}`)
        .join("\n\n");

    return {
        content: [
            {
                type: "text",
                text: `📝 Here are your recent tweets:\n\n${tweetsList}\n\nProvide a Tweet ID to fetch analytics.`
            }
        ]
    };
}


export async function createReadWriteFile({ filename = '', content = '', mode = 'write' }) {
    const generatedPath = './generated';
    const filePath = path.join(generatedPath, filename);

    if (!filename.trim()) {
        return {
            content: [{ type: "text", text: "⚠️ Please provide a valid filename." }],
            isError: true
        };
    }

    // Ensure output folder exists
    if (!fs.existsSync(generatedPath)) {
        fs.mkdirSync(generatedPath);
    }

    if (mode === 'read') {
        if (!fs.existsSync(filePath)) {
            return {
                content: [{ type: "text", text: `❌ File "${filename}" does not exist.` }],
                isError: true
            };
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return {
                content: [{
                    type: "text",
                    text: `📄 Content of ${filename}:\n\n${fileContent.slice(0, 1000)}${fileContent.length > 1000 ? '...\n\n(Truncated)' : ''}`
                }]
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: `❌ Failed to read file: ${err.message}` }],
                isError: true
            };
        }
    }

    // Default is write mode
    try {
        fs.writeFileSync(filePath, content);
        return {
            content: [{
                type: "text",
                text: `✅ File created: ${filename}\n📂 Location: ${filePath}`
            }]
        };
    } catch (err) {
        return {
            content: [{ type: "text", text: `❌ Failed to write file: ${err.message}` }],
            isError: true
        };
    }
}
