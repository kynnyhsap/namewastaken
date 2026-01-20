# Changelog

All notable changes to this project will be documented in this file.

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
