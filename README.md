# MCP-Powered Terminal AI Assistant

A powerful, terminal-based AI assistant powered by a large language model and the Model Context Protocol (MCP). This assistant can help you with a variety of tasks, from content creation and social media management to file operations and coding assistance.

## 🌟 Project Overview

This project provides a command-line interface to a powerful AI assistant. It's designed for developers, content creators, and anyone who wants to leverage the power of AI in their terminal. The assistant is extensible with custom tools and can be personalized to your needs.

### Key Features

- **🤖 Conversational AI:** Interact with the Gemini Pro model in a chat-like interface in your terminal.
- **🛠️ Extensible Tool System:** The assistant can use a variety of tools to perform tasks like:
    - **Social Media:** Post to Twitter, get tweet analytics, and find trending hashtags.
    - **Content Creation:** Find images for your content.
    - **File System:** Read and write files on your local machine.
- **💻 Code Assistance:** Get help with your code, ask for explanations, and generate code snippets.
- **👤 Personalization:** The assistant can be personalized with a user profile to tailor its responses to your needs.
- **🚀 MCP Based:** The assistant uses the Model Context Protocol (MCP) to communicate with the tool server, making it modular and scalable.

## 🏗️ Architecture

The project is divided into two main components:

- **`client/`**: A Node.js command-line application that you interact with. It connects to the MCP server and the Gemini AI model.
- **`server/`**: A Node.js server that exposes a set of tools to the AI assistant using the Model Context Protocol (MCP).

```
MCP_Server/
├── client/           # The terminal-based AI assistant client
├── server/           # The MCP server with all the tools
├── README.md         # Main project documentation
└── .gitignore        # Git ignore configuration
```

## 🚀 Getting Started

To get started with the Gemini Powered Terminal AI Assistant, follow these steps:

### 1. Clone the Repository

```bash
git clone [repository-url]
cd MCP_Server
```

### 2. Set Up the Server

The server provides the tools for the AI assistant.

```bash
cd server
npm install
```

You'll also need to create a `.env` file in the `server` directory with the following API keys:

```
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### 3. Set Up the Client

The client is the command-line interface you'll use to interact with the assistant.

```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory with your Google Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Application

First, start the MCP server:

```bash
cd ../server
node index.js
```

Then, in a new terminal, start the client:

```bash
cd ../client
node llm.index.js
```

## 💬 Usage

Once the client is running, you can start chatting with your AI assistant. You can ask it to do anything, and it will use its tools to help you.

For example, you can ask it to:

- "Create a file named `hello.txt` with the content `Hello, World!`"
- "What are the trending hashtags for #AI?"
- "Find an image of a robot."
- "Post a tweet saying 'Hello from my new AI assistant!'"

## 🛠️ Available Tools

The assistant has access to the following tools:

- **`getTrendingHashtags`**: Get trending hashtags for a given category.
- **`findImage`**: Find an image on a given topic.
- **`createPost`**: Create a post on Twitter.
- **`getTweetAnalytics`**: Get analytics for a given tweet ID.
- **`getMyTweets`**: Get your most recent tweets.
- **`createReadWriteFile`**: Create, read, or write files.

## 💻 Technical Stack

- **Server:**
  - Node.js
  - Express.js
  - Model Context Protocol (MCP)
  - zod for schema validation
- **Client:**
  - Node.js
  - Google Gemini AI
  - @modelcontextprotocol/sdk

## 🙋‍♂️ Author

**Simerdeep Singh Gandhi**

- Portfolio: [https://simerdeep-portfolio.vercel.app/](https://simerdeep-portfolio.vercel.app/)
- GitHub: [@SimerdeepSingh4](https://github.com/SimerdeepSingh4)
- LinkedIn: [Simerdeep Singh Gandhi](https://www.linkedin.com/in/simerdeep-singh-gandhi-5569a7279/)

---

## ✨ Show Your Support

Give a ⭐️ if this project helped you!