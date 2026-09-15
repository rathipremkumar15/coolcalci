# CoolCalci Phase 2 backend

Supabase project: `coolcalci-production` (Mumbai / `ap-south-1`).

## Implemented
- Auth profile bootstrap through an `auth.users` trigger.
- Free, monthly Pro and yearly Pro entitlement records.
- Per-user daily usage tracking.
- Per-user calculation history and saved calculations.
- Row Level Security on all user tables.
- Server-side calculation quota RPC (`consume_calculation`).
- Admin-role foundation on `profiles.role`.
- `current_plan()` helper for active/trialing subscriptions with period expiry handling.

## Security
- Browser uses only the Supabase publishable key.
- Service-role/database passwords must never be committed.
- User tables are scoped with `auth.uid()` policies.
- The quota RPC is executable by authenticated users only.
- Payment/provider entitlement updates are intentionally reserved for Phase 3 trusted server/webhook flows.

## Product rules
- Free: 3 calculation previews per UTC day.
- Pro monthly: unlimited calculations; target history retention 1 month.
- Pro yearly: unlimited calculations; target history retention 1 year.
- Saved calculations are separate from the daily calculation quota.
