# Changelog

All notable changes to this project will be documented in this file.

## [1.6.0] - 2025-01-20

### Added
- GitHub platform provider (`github`, `gh`)

### Fixed
- Threads: Use `threads.com` instead of `threads.net` for profile URLs

## [1.5.0] - 2025-01-20

### Added
- Telegram platform provider (`telegram`, `tg`)
- Facebook platform provider (`facebook`, `fb`)
- `nwt` CLI alias - use `npx nwt mrbeast` as shorthand

### Changed
- X/Twitter: Now uses syndication API for reliable detection
- Removed cache functionality (was causing stale results)

### Breaking Changes
- Removed `--no-cache` CLI option
- Removed `cache clear` and `cache stats` CLI commands
- Removed `cache` option from SDK methods

## [1.3.0] - 2025-01-20

### Added
- MCP: HTTP server auto-selects free port when `--port` not specified
- MCP: Claude Desktop configuration example in README

### Changed
- MCP: STDIO is now the default transport (was HTTP)
- MCP: Use `--http` flag for HTTP transport (was default)
- MCP: Replaced Elysia with Hono for Node.js compatibility
- MCP: Renamed tools to align with SDK (`check`, `check_many`)
- MCP: Renamed `useCache` param to `cache` (matches SDK)
- CLI: Smaller bundle size (4.2MB → 2.2MB)

### Fixed
- MCP: HTTP server now works on Node.js (not just Bun)
- MCP: Streamable HTTP transport works with MCP Inspector

### Breaking Changes
- MCP: Default transport changed from HTTP to STDIO
  ```bash
  # Before
  namewastaken mcp          # HTTP server
  namewastaken mcp --stdio  # STDIO server
  
  # After  
  namewastaken mcp          # STDIO server
  namewastaken mcp --http   # HTTP server
  ```
- MCP: Tool names changed
  - `check_username` → `check`
  - `check_usernames_in_bulk` → `check_many`

## [1.2.0] - 2025-01-20

### Added
- SDK: `{ platforms: [...] }` option for filtering platforms in `check()`, `checkMany()`, `available()`, `taken()`
- CLI: `--platforms` as primary flag name (`-p` still works)
- Package keywords for npm discoverability

### Changed
- SDK: Removed `.only()` method - use `{ platforms: [...] }` option instead
- README: CLI documentation now comes before SDK

### Breaking Changes
- SDK: `.only()` removed - migrate to options:
  ```ts
  // Before
  await nwt.only('tiktok', 'ig').check('mrbeast')
  
  // After
  await nwt.check('mrbeast', { platforms: ['tiktok', 'ig'] })
  ```

## [1.1.0] - 2025-01-20

### Added
- SDK for programmatic usage
- `check()` - check single username
- `checkMany()` - check multiple usernames (returns Map)
- `available()` / `taken()` - quick boolean checks
- `nwt.tiktok.*`, `nwt.instagram.*`, etc. - platform-specific checkers
- `.only()` - filter to specific platforms
- TypeScript declarations

### Changed
- Results now keyed by platform name instead of array
- Bulk results return `Map` for O(1) lookup

## [1.0.0] - 2025-01-20

### Added
- CLI tool to check username availability
- Support for TikTok, Instagram, X/Twitter, Threads, YouTube
- Single username check: `namewastaken mrbeast`
- Bulk check: `namewastaken user1 user2 user3`
- Platform filter: `-p tiktok` or `-p tt,ig,yt`
- URL parsing: `namewastaken https://x.com/MrBeast`
- JSON output: `--json`
- Caching with 24h TTL
- MCP server with Streamable HTTP and STDIO transports
- `platforms` command to list supported platforms
- `cache clear` and `cache stats` commands
