---
name: DB declarations rebuild requirement
description: After any schema change, compiled declarations must be rebuilt or api-server typecheck sees stale types
---

## Rule
After editing any file in `lib/db/src/schema/`, run:
```
pnpm exec tsc --build lib/db
```
This regenerates `lib/db/dist/` declaration files. The `@workspace/api-server` references these compiled outputs via TypeScript project references (`"references": [{"path": "../../lib/db"}]`).

**Why:** `lib/db/tsconfig.json` uses `composite: true` + `emitDeclarationOnly: true`. The api-server does NOT read source files from lib/db directly — it reads the compiled `.d.ts` in `lib/db/dist/`. Without rebuilding, new columns or exports are invisible to the api-server typecheck.

**How to apply:** Any time you add columns to a Drizzle table schema OR add new exports to schema files, run the rebuild command before running `pnpm --filter @workspace/api-server run typecheck`.
