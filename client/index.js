import { config } from 'dotenv'
import readline from 'readline/promises'
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { type } from 'os';


config()

let tools = []
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const mcpClient = new Client({
    name: "example-client",
    version: "1.0.0",
})

const chatHistory = [
    {
        role: "user",
        parts: [{
            text: `You are a communication and content strategist. For this conversation, generate engaging, informative, and audience-tailored content that follows these guidelines:

- Highlight specific benefits, use cases, or real-world applications
- Focus on clear outcomes or impact—especially on people such as students, educators, professionals, or end users
- Use a tone that is professional yet conversational—avoid jargon unless necessary
- Support claims with recent data, statistics, or real-world examples when possible
- Keep the content concise and structured (e.g., 1-2 short paragraphs or 200–250 characters for short-form content)
- Use emojis selectively to enhance engagement if the platform or context allows it
- Add relevant hashtags, keywords, or tags for visibility when the content is used on platforms like social media or blogs

For content that includes visual elements:
- First call the "findImage" function with **specific, descriptive search terms**
- Include contextual keywords such as “classroom”, “remote learning”, “corporate training”, “AI tools”
- Be specific about technologies (e.g., “AI-powered learning assistants” instead of just “AI”)
- Optionally describe the type of scene desired (e.g., “students interacting with a digital whiteboard” or “a teacher using virtual tools”)
- If image search fails, proceed with creating the content without referencing visuals

The goal is to make the message informative, relevant, visually compelling (when applicable), and easily understandable by a general audience.`,
            type: "text"
        }]
    },
    {
        role: "model",
        parts: [{
            text: "I understand. I'll create engaging social media posts about technology and education following those guidelines. I'll use findImage to get relevant visuals when appropriate, handle image search failures gracefully, and include recent statistics and studies. How can I help you today?",
            type: "text"
        }]
    }
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

mcpClient.connect(new StreamableHTTPClientTransport(new URL("http://localhost:3000/mcp")))

    .then(async () => {
        // console.log("Connected to MCP server");
        tools = (await mcpClient.listTools()).tools.map(tool => {
            return {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.inputSchema.type,
                    properties: tool.inputSchema.properties,
                    required: tool.inputSchema.required
                }
            }
        });

        chatLoop()

    })
async function chatLoop(toolCall) {
    if (toolCall) {
        // Add context about what's happening with the tool call
        let contextMessage = "";
        if (toolCall.name === "findImage") {
            contextMessage = "Searching for a relevant image...";
        } else if (toolCall.name === "createPost") {
            contextMessage = "Creating post with the composed message and image...";
        }

        chatHistory.push({
            role: "model",
            parts: [
                {
                    text: contextMessage || `Calling tool ${toolCall.name}`,
                    type: "text",
                }
            ]
        })
        const toolResult = await mcpClient.callTool({
            name: toolCall.name,
            arguments: toolCall.args
        });

        // console.log("Tool result from server:", toolResult); // ✅ log it

        const textResult =
            toolResult?.content?.[0]?.text || "⚠️ No content returned from tool.";

        // Handle failed image searches more gracefully
        if (toolCall.name === 'findImage' && toolResult.isError) {
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
            chatHistory.push({
                role: "user",
                parts: [
                    {
                        text: "Tool result: " + textResult,
                        type: "text",
                    },
                ],
            });
        }

    } else {
        const question = await rl.question('You:');
        
        if (question.toLowerCase() === 'exit') {
            console.log('Goodbye! Closing the application...');
            rl.close();
            process.exit(0);
        }

        chatHistory.push({
            role: "user",
            parts: [
                {
                    text: question,
                    type: "text"
                }
            ]

        })
    }



    const response = await ai.models.generateContent({

        model: "gemini-2.0-flash-001",
        contents: chatHistory,
        config: {
            tools: [
                {
                    functionDeclarations: tools,
                }
            ]
        }
    })
    // console.dir(response, { depth: null });

    const candidate = response.candidates?.[0];
    const functionCall = candidate?.content?.parts?.[0]?.functionCall;
    const maybeText = candidate?.content?.parts?.[0]?.text;

    if (functionCall) {
        // console.log(`🔧 Gemini is calling tool: ${functionCall.name}`);
        return chatLoop(functionCall);
    }

    const responseText = maybeText || "⚠️ Gemini returned no message.";

    chatHistory.push({
        role: "model",
        parts: [
            {
                text: responseText,
                type: "text"
            }
        ]
    });

    console.log(`AI: ${responseText}`);
    chatLoop()

}


