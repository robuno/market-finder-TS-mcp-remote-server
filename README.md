# Market Price Finder MCP Server

This project is a Model Context Protocol (MCP) server built on Cloudflare Workers that helps find and compare market prices for products. It provides tools for querying and analyzing product prices across different marketplaces.

An MCP server is a specialized server that implements the Model Context Protocol, allowing AI models to interact with external tools and services. In this case, our server provides tools for market price analysis.

## Features
- Query product prices from various marketplaces
- Compare prices across different vendors
- Real-time price updates
- No authentication required for basic usage
- Deployable on Cloudflare Workers platform

## Getting Started

### Option 1: Quick Deploy
Click the button below to deploy directly to Cloudflare Workers:

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

After deployment, your server will be available at: `remote-mcp-server-authless.<your-account>.workers.dev/sse`

### Option 2: Local Development
To set up the project locally, follow these steps:

1. Create a new project using the template:
```bash
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```

2. Install dependencies:
```bash
cd my-mcp-server
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Customizing the Server

### Adding New Tools
You can extend the server's functionality by adding your own tools:

1. Open `src/index.ts`
2. Locate the `init()` method
3. Add new tools using `this.server.tool(...)` 

For more information about creating tools, check the [MCP tools documentation](https://developers.cloudflare.com/agents/model-context-protocol/tools/).

## Using the Server

### Method 1: Cloudflare AI Playground
The easiest way to interact with your MCP server is through the Cloudflare AI Playground:

1. Visit [Cloudflare AI Playground](https://playground.ai.cloudflare.com/)
2. In the connection settings, enter your server URL:
   - For deployed server: `remote-mcp-server-authless.<your-account>.workers.dev/sse`
   - For local development: `http://localhost:8787/sse`
3. Start using the market price finder tools through the playground interface

### Method 2: Claude Desktop Integration
You can also use the server with Claude Desktop:

1. Install the MCP remote proxy:
```bash
npm install -g mcp-remote
```

2. Configure Claude Desktop:
- Open Claude Desktop
- Go to Settings > Developer > Edit Config
- Update the configuration:
```json
{
  "mcpServers": {
    "market-finder": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // Use your deployed URL for production
      ]
    }
  }
}
```

3. Restart Claude Desktop to apply changes

## API Documentation

Our MCP server provides the following tools:
- `searchProduct`: Search for product prices
- `comparePrice`: Compare prices across marketplaces
- `getPriceHistory`: Get historical price data (if available)

For detailed API documentation and examples, check the source code comments in `src/index.ts`. 
