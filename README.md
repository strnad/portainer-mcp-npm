# portainer-mcp-stacks

MCP server for Portainer with **regular stacks support**.

Fork of [portainer/portainer-mcp](https://github.com/portainer/portainer-mcp) v0.6.0 with a fix: `listStacks` and `getStackFile` now work with regular Docker Compose stacks created through the Portainer UI (the upstream version only supports Edge Stacks).

## Usage with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "portainer": {
      "command": "npx",
      "args": [
        "-y",
        "portainer-mcp-stacks",
        "-server", "your-portainer-host.example.com",
        "-token", "your-api-token",
        "-disable-version-check"
      ]
    }
  }
}
```

Replace `your-portainer-host.example.com` and `your-api-token` with your Portainer server hostname and API access token.

## Usage with Claude Code

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "portainer": {
      "command": "npx",
      "args": [
        "-y",
        "portainer-mcp-stacks",
        "-server", "your-portainer-host.example.com",
        "-token", "your-api-token",
        "-disable-version-check"
      ]
    }
  }
}
```

## What's fixed

The upstream `portainer-mcp` only queries `/api/edge_stacks`, which returns empty results for regular stacks created via the Portainer UI. This package queries `/api/stacks` instead.

- `listStacks` - returns all regular Portainer stacks with `status` and `endpoint_id`
- `getStackFile` - returns the compose file for a regular stack

## Supported platforms

- Linux x86_64
- Linux ARM64
- macOS ARM64 (Apple Silicon)

The correct binary is downloaded automatically on install.

## Source

[github.com/strnad/portainer-mcp](https://github.com/strnad/portainer-mcp)
