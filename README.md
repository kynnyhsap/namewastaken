# namewastaken

Check if a username is taken across multiple social platforms.

## Installation

### From source

```bash
# Clone the repository
git clone https://github.com/yourusername/namewastaken.git
cd namewastaken

# Install dependencies
bun install

# Run directly
bun run start <username>

# Or build and install globally
bun run build
bun run install:global
```

### Requirements

- [Bun](https://bun.sh/) v1.0 or higher

## Usage

```bash
# Check username on all platforms
namewastaken <username>

# Check on a specific platform
namewastaken <provider> <username>

# Check from a profile URL
namewastaken <url>
```

### Examples

```bash
# Check "mrbeast" on all platforms
namewastaken mrbeast

# Check on TikTok only
namewastaken tiktok mrbeast
namewastaken tt mrbeast        # using alias

# Check on Instagram only
namewastaken instagram mrbeast
namewastaken ig mrbeast        # using alias

# Check from URL
namewastaken https://x.com/MrBeast
namewastaken https://tiktok.com/@mrbeast

# Output as JSON
namewastaken mrbeast --json

# Skip cache (fetch fresh results)
namewastaken mrbeast --no-cache
```

### Output

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

5 taken
```

## Providers

| Provider  | Command     | Aliases         |
|-----------|-------------|-----------------|
| X/Twitter | `x`         | `twitter`       |
| TikTok    | `tiktok`    | `tt`            |
| Threads   | `threads`   |                 |
| YouTube   | `youtube`   | `yt`            |
| Instagram | `instagram` | `ig`            |

## Options

| Option        | Description                    |
|---------------|--------------------------------|
| `--json`      | Output results as JSON         |
| `--no-cache`  | Skip cache, fetch fresh results|
| `-v, --version` | Show version number          |
| `-h, --help`  | Show help message              |

## Cache

Results are cached for 24 hours in `~/.namewastaken/cache.json`.

```bash
# View cache statistics
namewastaken cache stats

# Clear the cache
namewastaken cache clear
```

## Development

```bash
# Run in development mode (with watch)
bun run dev

# Run tests
bun test

# Run integration tests (makes real HTTP requests)
bun run test:integration

# Build executable
bun run build
```

## How It Works

The tool checks username availability by fetching the profile URL for each platform and analyzing the response:

- **TikTok** - Checks if `"desc":"@username` pattern exists in HTML
- **Instagram** - Checks if `{"username":"username"}` pattern exists in HTML
- **X/Twitter** - Checks if "This account doesn't exist" message is absent
- **Threads** - Checks if the request redirects to login page (available) or stays on profile (taken)
- **YouTube** - Checks if the response status is not 404

## Tech Stack

- [Bun](https://bun.sh/) - Runtime and bundler
- [Effect](https://effect.website/) - Concurrency, retries, and error handling
- [Commander](https://github.com/tj/commander.js) - CLI framework
- [picocolors](https://github.com/alexeyraspopov/picocolors) - Terminal colors
- [Zod](https://zod.dev/) - Input validation

## License

MIT
