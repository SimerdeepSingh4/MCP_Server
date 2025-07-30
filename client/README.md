# MCP Client - AI Content Generator

A sophisticated client application that leverages Google's Gemini AI to generate educational technology-focused social media content.

## 🎯 Features

### Content Generation
- Educational technology focus
- Data-driven content creation
- SEO optimization
- Hashtag integration
- Visual content support

### AI Integration
- Google Gemini AI powered responses
- Context-aware conversations
- Smart error handling
- Graceful degradation for failed operations

### User Interface
- Interactive command-line interface
- Real-time content generation
- Immediate feedback
- Graceful exit handling

- Interactive chat interface with AI content strategist
- Automatic image search and content generation
- Smart handling of failed image searches
- Professional content generation following best practices
- Support for hashtags and SEO optimization
- Graceful exit handling

## Prerequisites

- Node.js v22.17.1 or later
- Google Gemini API key
- Running MCP server instance

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd client
   npm install
   ```
3. Create a `.env` file in the client directory with:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Usage

1. Start the MCP server (see server directory for instructions)
2. Run the client:
   ```bash
   node index.js
   ```
3. Interact with the AI by typing your requests
4. Type 'exit' to quit the application

## Content Generation Guidelines

The AI follows specific guidelines to create content that is:
- Benefit and impact-focused
- Professional yet conversational
- Backed by statistics when possible
- Optimized for visibility with relevant hashtags
- Enhanced with appropriate visuals when available

## Project Structure

```
client/
  ├── index.js         # Main application file
  ├── package.json     # Project dependencies
  └── .env            # Environment configuration

```

## Tools

The application integrates with MCP tools for:
- Image search functionality
- Content post creation
- Additional extensible tools via MCP server

## License

MIT License
