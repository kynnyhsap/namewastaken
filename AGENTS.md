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
- `bun check` - run format check, lint:type-aware:check, typecheck, and tests
