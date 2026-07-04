---
name: Restaurant schema dual fields
description: New structured fields coexist with legacy single-value fields for backward compat with seeded data
---

## Current state
The `restaurants` table has both old and new fields:

| New field | Legacy field | Notes |
|---|---|---|
| `cuisines text[]` | `cuisine text` | cuisines[0] is written to cuisine on insert |
| `diningOccasion text[]` | `atmosphere text[]`, `diningOptions text[]` | new field for user-facing occasion picker |
| `priceMin integer`, `priceMax integer` | `budgetRange text` | budgetRange derived as "RMmin-RMmax" on insert |
| `isUserSubmitted boolean` | — | true for listings from the Add Restaurant form |

**Why:** 15 seeded KL restaurants were inserted before the new columns existed. They have cuisine/atmosphere/budgetRange populated, but cuisines[]/diningOccasion[]/priceMin/priceMax are defaults/empty. Rather than re-seeding everything, the new form writes to both old and new fields.

**How to apply:** AI recommendation filtering still uses the legacy fields (cuisine, budgetRange, atmosphere). Future work (Task #7) should migrate filtering to use the new structured columns for better accuracy.
