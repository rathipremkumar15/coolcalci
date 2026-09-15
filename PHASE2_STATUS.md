# Phase 2 implementation status

## Backend
- [x] Supabase production project connected
- [x] Profiles and subscription tables
- [x] Daily usage table and atomic quota RPC
- [x] Calculation history and saved calculations
- [x] RLS policies for per-user isolation
- [x] Subscription plan/status/expiry model
- [x] Admin role foundation
- [x] Security hardening for exposed functions

## Application
- [x] Supabase publishable client configured
- [x] Email/password authentication UI and session persistence
- [x] Google OAuth flow wired (provider configuration still required in Supabase Auth)
- [x] Cloud history/saved-data sync bridge
- [x] Daily quota bridge for authenticated users
- [x] History retention guard

## Phase 3 intentionally not activated
- Payment collection
- Subscription webhooks
- Automatic Pro activation
- Real trial billing/activation

Those remain disabled until the monetization phase so no user can be charged accidentally.
