# namewastaken

Check if a username is taken across multiple social platforms.

## Installation

```bash
npm install namewastaken
```

## CLI Usage

```bash
npx namewastaken mrbeast
```

Or install globally:

```bash
npm install -g namewastaken
namewastaken mrbeast
```

### CLI Examples

```bash
# Check username on all platforms
namewastaken mrbeast

# Check multiple usernames
namewastaken mrbeast pewdiepie ninja

# Check on specific platform(s)
namewastaken mrbeast -p tiktok
namewastaken mrbeast --platforms tt,ig,yt

# Check from URL
namewastaken https://x.com/MrBeast

# Output as JSON
namewastaken mrbeast --json
```

### CLI Options

| Option              | Description                     |
|---------------------|---------------------------------|
| `-p, --platforms`   | Check specific platform(s)      |
| `--json`            | Output results as JSON          |
| `--no-cache`        | Skip cache, fetch fresh results |
| `-v, --version`     | Show version number             |
| `-h, --help`        | Show help message               |

### CLI Commands

| Command         | Description                          |
|-----------------|--------------------------------------|
| `platforms`     | List all supported platforms         |
| `mcp`           | Start MCP server (STDIO)             |
| `mcp --http`    | Start MCP server (HTTP)              |
| `cache clear`   | Clear the cache                      |
| `cache stats`   | Show cache statistics                |

## SDK Usage

```ts
import nwt from 'namewastaken'

// Quick boolean checks
await nwt.available('mrbeast')  // false - taken on at least one platform
await nwt.taken('mrbeast')      // true - taken on at least one platform

// Full check on all platforms
const result = await nwt.check('mrbeast')
result.tiktok.taken      // true
result.instagram.taken   // true  
result.summary           // { available: 0, taken: 5, errors: 0 }

// Filter to specific platforms
const result = await nwt.check('mrbeast', { platforms: ['tiktok', 'ig'] })
result.tiktok.taken     // true
result.youtube          // undefined (not checked)

// Check multiple usernames
const results = await nwt.checkMany(['mrbeast', 'pewdiepie'])
results.get('mrbeast').tiktok.taken  // true

// With platform filter
const results = await nwt.checkMany(['mrbeast', 'pewdiepie'], { platforms: ['tt'] })

// Platform-specific checks (shorthand)
await nwt.tiktok.available('mrbeast')  // false
await nwt.tiktok.taken('mrbeast')      // true
await nwt.tiktok.check('mrbeast')      // { taken: true, available: false, url: '...' }

// List all platforms
console.log(nwt.platforms)
// [
//   { name: 'x', displayName: 'X/Twitter', aliases: ['x', 'twitter'] },
//   { name: 'tiktok', displayName: 'TikTok', aliases: ['tiktok', 'tt'] },
//   ...
// ]

// Parse profile URL
nwt.parseUrl('https://tiktok.com/@mrbeast')
// { platform: 'tiktok', username: 'mrbeast' }
```

### Named Imports

```ts
import { check, checkMany, tiktok, available } from 'namewastaken'

await check('mrbeast')
await check('mrbeast', { platforms: ['tt', 'ig'] })
await tiktok.taken('mrbeast')
await available('mrbeast')
```

## Platforms

| Platform  | Name        | Aliases         |
|-----------|-------------|-----------------|
| X/Twitter | `x`         | `twitter`       |
| TikTok    | `tiktok`    | `tt`            |
| Threads   | `threads`   |                 |
| YouTube   | `youtube`   | `yt`            |
| Instagram | `instagram` | `ig`            |
| Facebook  | `facebook`  | `fb`            |

## MCP Server

namewastaken includes an MCP (Model Context Protocol) server for AI assistants:

```bash
# Start STDIO server (default)
namewastaken mcp

# Start HTTP server (auto-selects port)
namewastaken mcp --http

# Start HTTP server on specific port
namewastaken mcp --http --port 3000
```

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "namewastaken": {
      "command": "npx",
      "args": ["namewastaken", "mcp"]
    }
  }
}
```

### OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "namewastaken": {
      "type": "local",
      "command": ["npx", "namewastaken", "mcp"]
    }
  }
}
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `check` | Check a username on all platforms |
| `check_many` | Check multiple usernames on all platforms |

## License

MIT
