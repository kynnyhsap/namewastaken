# namewastaken

Check if a username is taken across multiple social platforms.

## Installation

```bash
npx namewastaken mrbeast
```

Or install globally:

```bash
npm install -g namewastaken
```

## Usage

```bash
# Check username on all platforms
namewastaken <username>

# Check multiple usernames
namewastaken <username1> <username2> ...

# Check on specific platform(s)
namewastaken <username> -p <platform>
namewastaken <username> -p tt,ig,yt

# Check from a profile URL
namewastaken <url>
```

## Examples

```bash
# Check "mrbeast" on all platforms
namewastaken mrbeast

# Check multiple usernames
namewastaken mrbeast pewdiepie ninja

# Check on TikTok only
namewastaken mrbeast -p tiktok
namewastaken mrbeast -p tt        # using alias

# Check on multiple platforms
namewastaken mrbeast -p tt,ig,yt

# Bulk check with specific platforms
namewastaken mrbeast theo -p tt,ig

# Check from URL
namewastaken https://x.com/MrBeast

# Output as JSON
namewastaken mrbeast --json

# Skip cache (fetch fresh results)
namewastaken mrbeast --no-cache
```

## Output

### Single username

```
Checking username: mrbeast

+-----------+---------+-------------------------------+
| Platform  | Status  | URL                           |
+-----------+---------+-------------------------------+
| X/Twitter | x taken | https://x.com/mrbeast         |
| TikTok    | x taken | https://tiktok.com/@mrbeast   |
| Threads   | x taken | https://threads.net/@mrbeast  |
| YouTube   | x taken | https://youtube.com/@mrbeast  |
| Instagram | x taken | https://instagram.com/mrbeast |
+-----------+---------+-------------------------------+

5 taken in 1.23s
```

### Multiple usernames

```
Checking 3 usernames:

+----------+---+--------+---------+---------+-----------+
| Username | x | tiktok | threads | youtube | instagram |
+----------+---+--------+---------+---------+-----------+
| mrbeast  | x | x      | x       | x       | x         |
| pewds    | x | x      | o       | x       | x         |
| ninja    | x | x      | x       | x       | x         |
+----------+---+--------+---------+---------+-----------+

o available  x taken  ? error

Total: 1 available, 14 taken in 2.34s
```

## Platforms

| Platform  | Name        | Aliases         |
|-----------|-------------|-----------------|
| X/Twitter | `x`         | `twitter`       |
| TikTok    | `tiktok`    | `tt`            |
| Threads   | `threads`   |                 |
| YouTube   | `youtube`   | `yt`            |
| Instagram | `instagram` | `ig`            |

List all platforms:

```bash
namewastaken platforms
```

## Options

| Option              | Description                     |
|---------------------|---------------------------------|
| `-p, --platform`    | Check specific platform(s)      |
| `--json`            | Output results as JSON          |
| `--no-cache`        | Skip cache, fetch fresh results |
| `-v, --version`     | Show version number             |
| `-h, --help`        | Show help message               |

## Commands

| Command         | Description                          |
|-----------------|--------------------------------------|
| `platforms`     | List all supported platforms         |
| `mcp`           | Start MCP server (Streamable HTTP)   |
| `mcp --stdio`   | Start MCP server (STDIO)             |
| `cache clear`   | Clear the cache                      |
| `cache stats`   | Show cache statistics                |

## Cache

Results are cached for 24 hours in `~/.namewastaken/cache.json`.

```bash
# View cache statistics
namewastaken cache stats

# Clear the cache
namewastaken cache clear
```

## MCP Server

namewastaken includes an MCP (Model Context Protocol) server for AI assistants:

```bash
# Start HTTP server (for MCP Inspector)
namewastaken mcp

# Start STDIO server (for Claude Desktop, etc.)
namewastaken mcp --stdio
```

### Available Tools

- `check_username` - Check a username on all platforms
- `check_usernames_in_bulk` - Check multiple usernames on all platforms

## Development

```bash
# Clone and install
git clone https://github.com/kynnyhsap/namewastaken.git
cd namewastaken
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Build for npm
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## How It Works

The tool checks username availability by fetching the profile URL for each platform and analyzing the response:

- **TikTok** - Checks if profile data exists in HTML
- **Instagram** - Checks if username pattern exists in HTML
- **X/Twitter** - Checks if "This account doesn't exist" message is absent
- **Threads** - Checks if the request redirects to login page (available) or stays on profile (taken)
- **YouTube** - Checks if the response status is not 404

## Tech Stack

- [Bun](https://bun.sh/) - Runtime and bundler
- [Effect](https://effect.website/) - Concurrency, retries, and error handling
- [Commander](https://github.com/tj/commander.js) - CLI framework
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocol
- [picocolors](https://github.com/alexeyraspopov/picocolors) - Terminal colors
- [Zod](https://zod.dev/) - Input validation

## License

MIT
