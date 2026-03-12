## Verification

After finishing any task, always run this check command:

```bash
bun check
```

The check command must pass cleanly before considering the task done. Fix any errors you introduce; do not leave broken lint, formatting, or type checks behind.

## Check Commands

- `bun format` - format project files with oxfmt
- `bun format:check` - verify formatting without writing
- `bun lint` - run oxlint on source files
- `bun lint:type-aware` - run type-aware linting
- `bun lint:type-aware:check` - run type-aware linting with type-check diagnostics
- `bun typecheck` - run TypeScript native type checking (tsgo)
- `bun check` - run root checks plus monorepo app checks

## Dev Commands

- `bun dev:api` - run Cloudflare API worker in local dev mode
- `bun dev:website` - run Cloudflare website worker in local dev mode
- `bun dev:cloudflare` - run API and website workers together with Turbo
