import { McpServer, ResourceTemplate, } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
async function main() {
    const server = new McpServer({
        name: "github-insights",
        version: "1.0.0",
    });
    // tools
    server.registerTool("get_repo_info", {
        title: "Get Repository Info",
        description: "Get key stats about a public GitHub repository: stars, forks, primary language, description, and open issue count. Use when the user asks about a specific repo's popularity or details.",
        inputSchema: {
            owner: z.string().describe("The Repository Owner, eg : Facebok"),
            repo: z.string().describe("The Repository Name, eg: React"),
        },
    }, async ({ owner, repo }) => {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Could not fetch ${owner}/${repo} (status ${res.status}). Check the names are correct.",
                    },
                ],
                isError: true,
            };
        }
        const data = await res.json();
        const summary = [
            `Repository: ${data.full_name}`,
            `Description: ${data.description ?? "none"}`,
            `Language :${data.language ?? "unknown"}`,
            `Stars : ${data.stargazers_count} `,
            `Forks : ${data.forks_count}`,
            `Open issues: ${data.open_issues_count}`,
        ].join("\n");
        return {
            content: [{ type: "text", text: summary }],
        };
    });
    server.registerTool("search_repos", {
        title: "Search Repositories",
        description: "Search public GitHub repositories by keyword. Returns the top matches by stars. Use when the user wants to discover repos on a topic rather than look up a specific one.",
        inputSchema: {
            query: z
                .string()
                .describe("Search keywords, e.g. 'react state management'"),
        },
    }, async ({ query }) => {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=5`;
        const res = await fetch(url, {
            headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) {
            return {
                content: [
                    { type: "text", text: `Search failed (status ${res.status}).` },
                ],
                isError: true,
            };
        }
        const data = await res.json();
        if (data.items.length === 0) {
            return {
                content: [
                    { type: "text", text: `No repositories found for "${query}".` },
                ],
            };
        }
        const results = data.items
            .map((r, i) => `${i + 1}. ${r.full_name} (⭐ ${r.stargazers_count})\n   ${r.description ?? "no description"}`)
            .join("\n\n");
        return {
            content: [
                { type: "text", text: `Top results for "${query}":\n\n${results}` },
            ],
        };
    });
    // Resource
    server.registerResource("repo-readme", new ResourceTemplate("repo://{owner}/{repo}/readme", { list: undefined }), {
        title: "Repository README",
        description: "The README file of a public GitHub repository.",
    }, async (uri, { owner, repo }) => {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: { Accept: "application/vnd.github.raw+json" } });
        if (!res.ok) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: `Could not fetch README for ${owner}/${repo} (status ${res.status}).`,
                    },
                ],
            };
        }
        const text = await res.text();
        return {
            contents: [{ uri: uri.href, text }],
        };
    });
    // prompt
    server.registerPrompt("analyze_repo", {
        title: "Analyze Repository",
        description: "Generate a thorough health analysis of a GitHub repository.",
        argsSchema: {
            owner: z.string().describe("Repository owner, e.g. 'facebook'"),
            repo: z.string().describe("Repository name, e.g. 'react'"),
        },
    }, ({ owner, repo }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Analyze the GitHub repository ${owner}/${repo}.

Use the available tools to gather data: get its stats with get_repo_info, and read its README resource at repo://${owner}/${repo}/readme.

Then assess:
1. Popularity and activity (stars, forks, open issues)
2. Documentation quality (based on the README)
3. What the project does and who it's for
4. Whether it looks healthy and worth using or contributing to

Give a clear, structured verdict.`,
                },
            },
        ],
    }));
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("github-server-running-on-stido");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
