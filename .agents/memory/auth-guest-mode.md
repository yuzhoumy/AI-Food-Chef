---
name: Guest auth mode
description: Clerk completely removed; all protected routes use a hardcoded "guest" userId; no sign-in wall anywhere
---

## Rule
All `requireAuth` middleware in the API server sets `(req as any).userId = "guest"` and calls `next()`. No Clerk middleware runs.

**Why:** This is a mockup project. The user explicitly asked to remove the login requirement so restaurant owners can list venues without signing in. Every user's favorites, recommendations, and preferences are stored under the "guest" key — globally shared.

**How to apply:** If real user isolation is needed in the future, replace the guest middleware with proper auth (Replit Auth or Clerk) and ensure all rows in preferences/favorites/recommendations are migrated or cleared.

## Frontend
- `ClerkProvider`, `ProtectedRoute`, `SignIn`/`SignUp` pages removed from `App.tsx`
- All routes are direct (`<Route path="..." component={...} />`)
- `useClerk`/`useUser` removed from all pages (dashboard.tsx, settings.tsx were the last holdouts)
- Home page CTAs point to `/discover` and `/add-restaurant` instead of `/sign-in`/`/sign-up`

## Backend
- `artifacts/api-server/src/middlewares/requireAuth.ts` — passthrough, sets userId="guest"
- `artifacts/api-server/src/app.ts` — no clerkMiddleware, no clerkProxyMiddleware
