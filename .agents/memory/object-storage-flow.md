---
name: Object Storage presigned URL upload flow
description: Two-step upload; client never sends files to the Express server; photos stored as serving URLs
---

## Flow
1. Client POSTs JSON metadata to `POST /api/storage/uploads/request-url` → receives `{uploadURL, objectPath}`
2. Client PUTs file bytes directly to `uploadURL` (GCS presigned URL) — does NOT go through Express
3. `objectPath` looks like `/objects/uploads/<uuid>` — prepend `/api/storage` to get serving URL
4. Serving URL (`/api/storage/objects/uploads/<uuid>`) is stored in `restaurants.photos[]`

## Auth
The `POST /storage/uploads/request-url` endpoint has NO auth guard (guest mode — anyone can upload). If auth is restored in future, add the `req.isAuthenticated()` check back.

## Key files
- `artifacts/api-server/src/lib/objectStorage.ts` — GCS client, `getObjectEntityUploadURL()`, `normalizeObjectEntityPath()`
- `artifacts/api-server/src/routes/storage.ts` — presigned URL endpoint + object serving routes
- `artifacts/food-concierge/src/pages/add-restaurant.tsx` — `useImageUpload` hook (stable-ID based, no index race)

## Photo URL format in DB
Photos are stored as full serving paths: `/api/storage/objects/uploads/<uuid>`. These are relative paths — when displayed in `<img src=...>`, the browser resolves them relative to the app domain.
