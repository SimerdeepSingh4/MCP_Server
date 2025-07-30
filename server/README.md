# MCP Server Implementation

A robust Model Context Protocol (MCP) server implementation that provides tool functionalities for the AI content generation system.

## 🎯 Features

### MCP Protocol Support
- Full MCP specification implementation
- Tool registration and management
- Streamable HTTP transport
- Robust error handling

### Available Tools
1. **Image Search Tool**
   - Educational image search
   - Context-aware queries
   - Error handling and fallbacks

2. **Content Post Creation Tool**
   - Multi-platform support
   - Format validation
   - Media integration

## 🛠️ Technical Requirements

- Node.js v22.17.1 or later
- npm or yarn package manager
- Internet connection for external services

## 📦 Dependencies

```json
{
  "@modelcontextprotocol/sdk": "latest",
  "express": "latest"
}
```

## 🚀 Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 💻 Usage

1. Start the server:
   ```bash
   node index.js
   ```

2. Server will be available at:
   ```
   http://localhost:3000/mcp
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the server directory with the following variables:
```env
# Server Configuration
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=
PEXELS_API_KEY=

# Image Search API Configuration
PEXELS_API_KEY=
```


### Tool Configuration
Tools are defined in `mcp.tool.js`:
```javascript
// Example tool configuration
{
    name: "findImage",
    description: "Searches for relevant educational images",
    inputSchema: {
        type: "object",
        properties: {
            query: { type: "string" }
        },
        required: ["query"]
    }
}
```

## 📡 API Endpoints

### MCP Endpoint
- **URL**: `/mcp`
- **Method**: `POST`
- **Headers**: 
  ```
  Content-Type: application/json
  ```

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: Server status information

## 🔍 Tool Implementation

### Image Search Tool
```javascript
// Implementation details in mcp.tool.js
async function findImage(query) {
    // Image search implementation
}
```

### Content Post Tool
```javascript
// Implementation details in mcp.tool.js
async function createPost(content) {
    // Post creation implementation
}
```

## 🐛 Troubleshooting

### Common Issues

1. Port Conflicts
   ```
   Solution: Modify PORT in environment variables
   ```

2. Tool Registration Failures
   ```
   Solution: Check tool implementation in mcp.tool.js
   ```

3. Connection Issues
   ```
   Solution: Verify network connectivity and port availability
   ```

## 📁 Project Structure

```
server/
├── index.js           # Main server file
├── mcp.tool.js        # Tool implementations
├── package.json       # Dependencies and scripts
└── README.md         # Documentation
```

## 🔄 Updates

To update dependencies:
```bash
npm update
```

## 🔐 Security

- Input validation on all tool operations
- Error handling for malformed requests
- Rate limiting (to be implemented)

## 🧪 Testing

To implement testing:
```bash
npm test
```

Tests should cover:
- Tool functionality
- MCP protocol compliance
- Error handling
- Edge cases

## 📚 API Reference

### MCP Protocol
- [Model Context Protocol Documentation](https://modelcontextprotocol.github.io/)

## 🔄 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📈 Monitoring

Future implementations will include:
- Request logging
- Performance metrics
- Error tracking
- Usage statistics

