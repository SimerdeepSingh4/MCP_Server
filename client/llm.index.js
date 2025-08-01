import { config } from "dotenv";
import readline from "readline/promises";
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { type } from "os";

config();

let tools = [];
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const mcpClient = new Client({
    name: "example-client",
    version: "1.0.0",
});

const chatHistory = [
    {
        role: "user",
        parts: [
            {
                text: `📌 USER PROFILE:
My name is Simerdeep Singh. I'm a developer and creator who works on diverse projects—from full-stack web development to AI automation tools. I like to keep my tools practical and powerful.

I often:
- Post code snippets for review or debugging
- Ask for quick content generation (blogs, social posts, product copy)
- Need ideas for UI/UX improvements
- Build automation tools using AI and APIs (e.g., Twitter bots, file handlers)
- Want help brainstorming names, strategies, and app features

My tone preference:
- Professional but friendly
- Simple, clean, not overly formal
- SEO-aware when writing public content

Keep all responses aligned with my voice and goals.`,
                type: "text",
            },
        ],
    },

    {
        role: "user",
        parts: [
            {
                text: `You are my personal AI assistant, built to help me with any task I give—technical or non-technical. Whether I post code, ask for content, need design ideas, or want automation tips, your job is to:

## 🧠 Content Creation & Writing
- Write clear, concise, and engaging content for blogs, social media, product descriptions, case studies, or project documentation.
- Use a confident but friendly tone — like a **tech mentor who explains simply but professionally**.
- Avoid jargon unless it’s necessary. Write for real-world humans (students, clients, developers, businesses).
- Highlight outcomes, benefits, or use-cases in your writing.
- Add SEO keywords, relevant hashtags, emojis (when appropriate), and formatting for visibility and engagement.
- Structure long-form content using headings, bullet points, short paragraphs, etc.
- Suggest visuals using the findImage() tool with **descriptive search prompts** (e.g., "developer using AI assistant", "student using voice interface").

 💻 Code & Development Tasks
- Read, debug, and improve any code I send (JavaScript, Python, Java, React, Node, etc.).
- Build complete frontend components, backend routes, utilities, and automation scripts based on my stack.
- Suggest best practices, performance improvements, and cleaner structure.
- Explain concepts simply — like you're helping a peer or junior dev.
- Help me fix bugs or build features quickly, with helpful inline comments where needed.

---

## 🎨 UI/UX, Projects & Product Thinking
- Suggest UI/UX improvements for any screen, form, app, dashboard, etc.
- Break down big ideas into modular tasks or phases.
- Help with naming, branding, storytelling, or feature prioritization.
- Write professional README files, project summaries, and case studies for my portfolio or GitHub.

---

## 🔁 Automation, APIs & Strategic Help
- Help me automate workflows, generate content, connect services, or write cron jobs.
- Assist with API integration (Twitter, Unsplash, Whisper, GPT, Gemini, etc.)
- Recommend smart system design, cloud functions, or serverless workflows.
- Tailor strategies and content for platforms like **Twitter, LinkedIn, GitHub, Medium**, etc.

---

## ⚙️ Tool Behavior (MCP Integration)
- Use the "createReadWriteFile" tool **whenever I say something like:**
  - "Create a file Hello.txt and write Hello World"
  - "Read notes.md"
  - You should infer **intent** and call the tool naturally based on my input.
- You do **not** need to ask for a structured command if the natural language is clear.
- Do **not** rewrite the command back to me — just call the tool and show the result.

---

## 🎯 General Rules
- Be fast, helpful, and never generic.
- Default to **my stack** (React, Node.js, Express, MongoDB) unless I say otherwise.
- Assume I’m building something valuable — your job is to make it faster, smarter, and cleaner.
- Always offer extra suggestions (e.g., performance, design, or SEO tweaks) without me asking.
`,
                type: "text",
            },
        ],
    },
    {
        role: "model",
        parts: [
            {
                text: "I understand. I'll create engaging social media posts about technology and education following those guidelines. I'll use findImage to get relevant visuals when appropriate, handle image search failures gracefully, and include recent statistics and studies. How can I help you today?",
                type: "text",
            },
        ],
    },
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function start() {
    try {
        await mcpClient.connect(
            new StreamableHTTPClientTransport(new URL("http://localhost:3000/mcp"))
        );
        console.log("✅ Connected to MCP server");

        tools = (await mcpClient.listTools()).tools.map((tool) => {
            return {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.inputSchema.type,
                    properties: tool.inputSchema.properties,
                    required: tool.inputSchema.required,
                },
            };
        });

        chatLoop(); // Start interaction loop only after connection is ready
    } catch (err) {
        console.error("❌ Failed to connect to MCP server:", err.message);
    }
}

start();
async function chatLoop(toolCall) {
    if (toolCall) {
        // Show what's happening in conversation
        let contextMessage = "";
        if (toolCall.name === "findImage") {
            contextMessage = "🔍 Searching for a relevant image...";
        } else if (toolCall.name === "createPost") {
            contextMessage = "📝 Creating post with the message and image...";
        } else {
            contextMessage = `⚙️ Calling tool: ${toolCall.name}`;
        }

        chatHistory.push({
            role: "model",
            parts: [{ text: contextMessage, type: "text" }],
        });

        try {
            const toolResult = await mcpClient.callTool({
                name: toolCall.name,
                arguments: toolCall.args,
            });

            // If tool call failed
            if (toolResult.isError) {
                const errorMsg = toolResult.error?.message || "Unknown error.";
                if (
                    toolCall.name === "createPost" &&
                    errorMsg.includes("duplicate content")
                ) {
                    errorMsg =
                        "It seems I've already posted that tweet before. Would you like me to try a different version?";
                }

                const userFacingMessage = `❌ An error occurred while calling ${toolCall.name}: ${errorMsg}`;
                chatHistory.push({
                    role: "model",
                    parts: [{ text: userFacingMessage, type: "text" }],
                });
                console.log(`AI: ${userFacingMessage}`);
                return chatLoop(); // Continue the conversation loop
            }

            // If image search fails but not an error
            if (toolCall.name === "findImage" && !toolResult.content?.[0]?.text) {
                chatHistory.push({
                    role: "model",
                    parts: [
                        {
                            text: "⚠️ No image found. Proceeding without image.",
                            type: "text",
                        },
                    ],
                });
                chatHistory.push({
                    role: "user",
                    parts: [
                        {
                            text: "The image search was unsuccessful. Please create the post without an image and call createPost with it.",
                            type: "text",
                        },
                    ],
                });
            } else {
                // Otherwise normal successful output
                const textResult =
                    toolResult?.content?.[0]?.text || "✅ Tool executed successfully.";
                chatHistory.push({
                    role: "user",
                    parts: [{ text: "Tool result: " + textResult, type: "text" }],
                });
            }
            if (toolCall.name === "getTweetAnalytics") {
                if (!toolResult.content?.[0]?.text) {
                    chatHistory.push({
                        role: "model",
                        parts: [
                            {
                                text: "⚠️ Tweet analytics could not be fetched. The tweet ID might be invalid or missing access permissions.",
                            },
                        ],
                    });
                    chatHistory.push({
                        role: "user",
                        parts: [
                            {
                                text: "The analytics could not be fetched. If possible, retry with a valid tweet ID or check API access level.",
                            },
                        ],
                    });
                } else {
                    const textResult =
                        toolResult.content[0].text || "✅ Tool executed successfully.";
                    chatHistory.push({
                        role: "user",
                        parts: [{ text: "Tool result: " + textResult }],
                    });
                }
            }
            if (toolCall.name === "createReadWriteFile") {
                const isError = toolResult?.isError;
                const message = toolResult?.content?.[0]?.text;

                if (isError || !message) {
                    chatHistory.push({
                        role: "model",
                        parts: [
                            {
                                text: "⚠️ File operation failed. Please check if the filename, type, or content was missing or invalid.",
                            },
                        ],
                    });
                    chatHistory.push({
                        role: "user",
                        parts: [
                            {
                                text: "Please retry with a valid filename, type (like txt, js), and if writing, make sure to include content.",
                            },
                        ],
                    });
                } else {
                    chatHistory.push({
                        role: "model",
                        parts: [{ text: message }],
                    });
                }
            }


            // Handle getMyTweets → extract ID → trigger getTweetAnalytics
            if (toolCall.name === "getMyTweets") {
                const tweetText = toolResult.content?.[0]?.text;

                if (tweetText) {
                    // Try to extract tweet ID — update this regex to match your real output
                    const tweetIdMatch = tweetText.match(/ID: (\d{5,})/); // 5+ digits

                    if (tweetIdMatch) {
                        const tweetId = tweetIdMatch[1];

                        chatHistory.push({
                            role: "model",
                            parts: [
                                {
                                    text: `✅ Found tweet ID: ${tweetId}. Fetching analytics now...`,
                                },
                            ],
                        });

                        // Automatically trigger getTweetAnalytics with found tweetId
                        chatHistory.push({
                            role: "tool_call",
                            parts: [
                                {
                                    functionCall: {
                                        name: "getTweetAnalytics",
                                        args: JSON.stringify({ tweet_id: tweetId }),
                                    },
                                },
                            ],
                        });
                    } else {
                        chatHistory.push({
                            role: "model",
                            parts: [
                                {
                                    text: "⚠️ I could not find any valid Tweet ID in your recent posts.",
                                },
                            ],
                        });
                    }
                }
            }
        } catch (err) {
            const errorText = `❌ MCP tool execution failed: ${err.message}`;
            chatHistory.push({
                role: "model",
                parts: [{ text: errorText, type: "text" }],
            });
            console.log(`AI: ${errorText}`);
        }
    } else {
        const question = await rl.question("You: ");
        if (question.toLowerCase() === "exit") {
            console.log("Goodbye! Closing the application...");
            rl.close();
            process.exit(0);
        }

        chatHistory.push({
            role: "user",
            parts: [{ text: question, type: "text" }],
        });
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: chatHistory,
        config: {
            tools: [
                {
                    functionDeclarations: tools,
                },
            ],
        },
    });

    const candidate = response.candidates?.[0];
    const functionCall = candidate?.content?.parts?.[0]?.functionCall;
    const maybeText = candidate?.content?.parts?.[0]?.text;

    if (functionCall) {
        return chatLoop(functionCall); // Recurse to handle tool
    }

    const responseText = maybeText || "⚠️ Gemini returned no message.";
    chatHistory.push({
        role: "model",
        parts: [{ text: responseText, type: "text" }],
    });

    console.log(`AI: ${responseText}`);
    chatLoop();
}
