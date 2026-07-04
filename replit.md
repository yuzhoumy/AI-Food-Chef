# AI Food Concierge

A smart food decision web app that eliminates decision fatigue by recommending restaurants based on mood, preferences, and context — helping users decide what to eat in under 30 seconds.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/food-concierge run dev` — run the frontend (port 22008)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `OPENAI_API_KEY`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS v4, Wouter routing, @clerk/react
- API: Express 5, @clerk/express (auth middleware)
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI gpt-4o-mini for mood-based restaurant recommendation
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Auth: Clerk (Replit-managed tenant)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, preferences, restaurants, recommendations, favorites)
- `artifacts/api-server/src/routes/` — Express route handlers (preferences, restaurants, recommendations, favorites, dashboard)
- `artifacts/api-server/src/lib/ai.ts` — OpenAI recommendation engine
- `artifacts/food-concierge/src/` — React frontend with Clerk auth, all pages

## Architecture decisions

- OpenAI gpt-4o-mini processes mood text → returns ranked restaurant ID + match reason + alternatives; all validated with Zod before use.
- Restaurants are seeded locally (15 KL restaurants); AI filters/scores from candidates matching hard constraints (halal, vegetarian, budget).
- Clerk auth is cookie-based on web; Bearer tokens only for mobile (not applicable here).
- CORS restricted to same-origin + env-configured origins in production; open in development.
- User preferences auto-created (empty) on first GET so onboarding flow always has a record to update.

## Product

- Landing page for unauthenticated users
- Onboarding wizard (4-step preference survey)
- /discover — mood input + context filters + AI recommendation CTA
- /recommendation — AI result with Shuffle / Top 5 actions
- /restaurant/:id — full restaurant details with Navigate/Save/Share
- /favorites, /history, /dashboard, /settings pages

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema change: run `pnpm run typecheck:libs` before checking artifact packages.
- After OpenAPI spec changes: run `pnpm --filter @workspace/api-spec run codegen`.
- Clerk dev keys warning in console is expected and not an error.
- `zod/v4` is the correct import for lib packages; standalone server packages need `zod` added as their own dependency.
