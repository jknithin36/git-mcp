# GitHub Insights MCP Server

A small server that lets an AI assistant look up and analyze GitHub repositories.

It's built with the Model Context Protocol (MCP). MCP is a standard way to give an AI access to outside tools and data. You build the server once, and any MCP-compatible app (like Claude Desktop or Cursor) can use it.

## What it can do

**Look up a repo** — get a repository's stars, forks, language, description, and open issues.

**Search repos** — search GitHub by keyword and get back the top results.

**Read a README** — pull any repository's README so the AI can read it.

**Analyze a repo** — a ready-made prompt that tells the AI to gather the repo's stats and README and give a clear verdict on whether the project is healthy and worth using.

## Built with

- TypeScript
- The MCP TypeScript SDK
- Zod (for checking inputs)
- The GitHub API (for live data)
- Node.js

## How to run it

You'll need Node.js 18 or newer.

```bash
git clone https://github.com/YOUR_USERNAME/github-insights-mcp.git
cd git-mcp
npm install
npm run build
```

### Try it out

The MCP Inspector is a simple tool for testing the server in your browser:

```bash
npm run inspect
```

Open the link it prints, click **Connect**, and try:

- **Tools** — look up `facebook` / `react`
- **Resources** — read `repo://facebook/react/readme`
- **Prompts** — run `analyze_repo` and see the instruction it creates

### Use it with Claude Desktop

Add this to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "github-insights": {
      "command": "node",
      "args": ["/full/path/to/github-insights-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop and the tools will be ready to use.

## What I learned

Building this taught me how MCP actually works:

- How the client and server talk to each other, and why keeping them separate is useful
- The three things an MCP server can offer — tools (actions), resources (data to read), and prompts (ready-made instructions)
- How to connect real API calls, handle errors, and check inputs
- How one prompt can tie the tools and resources together into a single task

- END
