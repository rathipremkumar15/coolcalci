# Phase 2 implementation status

## Initialization
- [x] Supabase production project connected
- [x] Phase 2 database foundation applied to production
- [x] Publishable browser configuration present; no service-role secret committed
- [x] Phase 2 application bridge present
- [ ] Google OAuth provider credentials/configuration verified in Supabase Auth
- [ ] Production auth redirect URL verified

## Backend
- [x] Profiles and subscription tables
- [x] Daily usage table and atomic quota RPC
- [x] Calculation history and saved calculations
- [x] RLS policies for per-user isolation
- [x] Subscription plan/status/expiry model
- [x] Admin/owner role foundation
- [x] Security hardening for exposed functions

## Application
- [x] Supabase publishable client configured
- [x] Email/password authentication UI and session persistence
- [x] Google OAuth flow wired in the application
- [x] Cloud history/saved-data sync bridge
- [x] Daily quota bridge for authenticated users
- [x] History retention guard
- [ ] Final frontend integration verification
- [ ] Cross-device persistence verification
- [ ] Save/reopen/delete verification
- [ ] Owner entitlement verification
- [ ] Mobile/auth UX verification

## Phase 2 final test — not started yet
The full phase test will be performed only after implementation is complete:

Signup -> Login -> Google -> Calculate -> quota -> History -> Save -> Reopen -> Logout -> Login again -> data restored -> entitlement -> user-isolation/security

## Phase 3 intentionally not activated
- Payment collection
- Subscription webhooks
- Automatic Pro activation
- Real trial billing/activation

Those remain disabled until the monetization phase so no user can be charged accidentally.
