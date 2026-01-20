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
namewastaken mrbeast -p tt,ig,yt

# Check from URL
namewastaken https://x.com/MrBeast

# Output as JSON
namewastaken mrbeast --json
```

## SDK Usage

```ts
import { check, checkBulk, platforms, parseUrl } from 'namewastaken'

// Check a single username on all platforms
const result = await check('mrbeast')
console.log(result)
// {
//   username: 'mrbeast',
//   results: [
//     { platform: 'x', displayName: 'X/Twitter', taken: true, available: false, url: '...' },
//     { platform: 'tiktok', displayName: 'TikTok', taken: true, available: false, url: '...' },
//     ...
//   ],
//   summary: { available: 0, taken: 5, errors: 0 }
// }

// Check on specific platforms only
const result = await check('mrbeast', { platforms: ['tiktok', 'instagram'] })

// Check multiple usernames
const results = await checkBulk(['mrbeast', 'pewdiepie', 'ninja'])
console.log(results.summary) // { available: 2, taken: 13, errors: 0 }

// List all supported platforms
console.log(platforms)
// [
//   { name: 'x', displayName: 'X/Twitter', aliases: ['x', 'twitter'] },
//   { name: 'tiktok', displayName: 'TikTok', aliases: ['tiktok', 'tt'] },
//   ...
// ]

// Parse a profile URL
const parsed = parseUrl('https://tiktok.com/@mrbeast')
// { platform: 'tiktok', username: 'mrbeast' }
```

### SDK Options

```ts
interface CheckOptions {
  // Specific platforms to check (e.g., ['tiktok', 'ig', 'x'])
  platforms?: string[]
  // Whether to use cached results (default: true)
  cache?: boolean
}

await check('mrbeast', { platforms: ['tiktok', 'ig'], cache: false })
```

## Platforms

| Platform  | Name        | Aliases         |
|-----------|-------------|-----------------|
| X/Twitter | `x`         | `twitter`       |
| TikTok    | `tiktok`    | `tt`            |
| Threads   | `threads`   |                 |
| YouTube   | `youtube`   | `yt`            |
| Instagram | `instagram` | `ig`            |

## CLI Options

| Option              | Description                     |
|---------------------|---------------------------------|
| `-p, --platform`    | Check specific platform(s)      |
| `--json`            | Output results as JSON          |
| `--no-cache`        | Skip cache, fetch fresh results |
| `-v, --version`     | Show version number             |
| `-h, --help`        | Show help message               |

## CLI Commands

| Command         | Description                          |
|-----------------|--------------------------------------|
| `platforms`     | List all supported platforms         |
| `mcp`           | Start MCP server (Streamable HTTP)   |
| `mcp --stdio`   | Start MCP server (STDIO)             |
| `cache clear`   | Clear the cache                      |
| `cache stats`   | Show cache statistics                |

## MCP Server

namewastaken includes an MCP (Model Context Protocol) server for AI assistants:

```bash
# Start HTTP server (for MCP Inspector)
namewastaken mcp

# Start STDIO server (for Claude Desktop, etc.)
namewastaken mcp --stdio
```

### MCP Tools

- `check_username` - Check a username on all platforms
- `check_usernames_in_bulk` - Check multiple usernames on all platforms

## License

MIT
