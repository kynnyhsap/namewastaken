# namewastaken

Check if a username is taken across multiple social platforms.

## Installation

```bash
npm install namewastaken
```

## SDK Usage

```ts
import nwt from 'namewastaken'

// Quick boolean checks
await nwt.available('mrbeast')  // false - taken on at least one platform
await nwt.taken('mrbeast')      // true - taken on at least one platform

// Platform-specific checks
await nwt.tiktok.available('mrbeast')  // false
await nwt.tiktok.taken('mrbeast')      // true
await nwt.tiktok.check('mrbeast')      // { taken: true, available: false, url: '...' }

// Full check on all platforms
const result = await nwt.check('mrbeast')
result.tiktok.taken      // true
result.instagram.taken   // true  
result.summary           // { available: 0, taken: 5, errors: 0 }

// Check multiple usernames
const results = await nwt.checkMany(['mrbeast', 'pewdiepie'])
results.get('mrbeast').tiktok.taken  // true

// Filter to specific platforms
const filtered = await nwt.only('tiktok', 'instagram').check('mrbeast')
filtered.tiktok.taken     // true
filtered.youtube          // undefined (not checked)

// Use aliases
await nwt.only('tt', 'ig').check('mrbeast')  // same as above

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
import { check, tiktok, available, only } from 'namewastaken'

await check('mrbeast')
await tiktok.taken('mrbeast')
await available('mrbeast')
await only('tt', 'ig').check('mrbeast')
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
