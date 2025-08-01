import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

config();
const app = express();
const PORT = 4444;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const mcpClient = new Client({ name: "example-client", version: "1.0.0" });

let tools = [];
let chatHistory = [
    {
        role: "user",
        parts: [
            {
                text: `You are a communication and content strategist...`, // your original system prompt
                type: "text"
            }
        ]
    },
    {
        role: "model",
        parts: [
            {
                text: "I understand. I'll create engaging social media posts...",
                type: "text"
            }
        ]
    }
];

await mcpClient.connect(new StreamableHTTPClientTransport(new URL("http://localhost:3000/mcp")));
tools = (await mcpClient.listTools()).tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
        type: tool.inputSchema.type,
        properties: tool.inputSchema.properties,
        required: tool.inputSchema.required
    }
}));

async function handleToolCall(toolCall) {
    let contextMessage = "";
    if (toolCall.name === "findImage") {
        contextMessage = "Searching for a relevant image...";
    } else if (toolCall.name === "createPost") {
        contextMessage = "Creating post with the composed message and image...";
    }

    chatHistory.push({
        role: "model",
        parts: [{ text: contextMessage || `Calling tool ${toolCall.name}`, type: "text" }]
    });

    const toolResult = await mcpClient.callTool({
        name: toolCall.name,
        arguments: toolCall.args
    });

    const textResult = toolResult?.content?.[0]?.text || "⚠️ No content returned from tool.";

    if (toolCall.name === 'findImage' && toolResult.isError) {
        chatHistory.push({
            role: "user",
            parts: [{ text: "Image search failed. Continue without image.", type: "text" }]
        });
    } else {
        chatHistory.push({
            role: "user",
            parts: [{ text: "Tool result: " + textResult, type: "text" }]
        });
    }
}

app.post("/chat", async (req, res) => {
    const { message } = req.body;

    chatHistory.push({
        role: "user",
        parts: [{ text: message, type: "text" }]
    });

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: chatHistory,
        config: {
            tools: [{ functionDeclarations: tools }]
        }
    });

    const candidate = response.candidates?.[0];
    const functionCall = candidate?.content?.parts?.[0]?.functionCall;
    const maybeText = candidate?.content?.parts?.[0]?.text;

    if (functionCall) {
        await handleToolCall(functionCall);
        return res.json({ response: "Tool used, please continue the chat." });
    }

    const responseText = maybeText || "⚠️ Gemini returned no message.";
    chatHistory.push({ role: "model", parts: [{ text: responseText, type: "text" }] });

    res.json({ response: responseText });
});

app.listen(PORT, () => {
    console.log(`🧠 AI Chat API running on http://localhost:${PORT}`);
});
