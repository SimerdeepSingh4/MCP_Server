import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createPost, findImage, getTrendingHashtags } from "./mcp.tool.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// Create the MCP server instance
const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

// ✅ Add tools from the YouTuber's example
server.tool(
  "addTwoNumbers",
  "Add two numbers",
  {
    a: z.number(),
    b: z.number()
  },
  async ({ a, b }) => ({
    content: [
      {
        type: "text",
        text: `The sum of ${a} and ${b} is ${a + b}`
      }
    ]
  })
);

server.tool(
  "getTrendingHashtags",
  "Get trending hashtags related to a category",
  {
    category: z.string()
  },
  getTrendingHashtags
);

server.tool(
  "findImage",
  "Find an image related to a topic using Pexels API",
  {
    topic: z.string()
  },
  findImage
);

server.tool(
  "createPost",
  "Create a post or thread on X (formerly Twitter) with optional image",
  {
    status: z.string(),
    image_url: z.string().optional(),
    isThread: z.boolean().optional(),
    threadParts: z.array(z.string()).optional()
  },
  createPost
);

// Store transports by session ID
const transports = {};

// POST - client sends messages
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  let transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        transports[newSessionId] = transport;
      },
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided"
      },
      id: null
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// GET & DELETE - server pushes updates or ends session
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get("/mcp", handleSessionRequest);
app.delete("/mcp", handleSessionRequest);

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
