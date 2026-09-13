# CoolCalci

### 🚀 [Try CoolCalci Live](https://coolcalci.vercel.app/)

**CoolCalci** is a professional calculation assistant for everyday mathematics and trading calculations, designed to grow into a secure AI-powered productivity product.

## Current capabilities
- Arithmetic and percentages
- Percentage change
- Compound growth / daily targets
- Account risk calculations
- XAUUSD estimated position sizing and P&L
- Risk-to-reward calculations
- Approximate USD-quoted forex P&L
- Saved calculations
- Local conversation history
- Responsive professional UI

## Phase 1 — Monetization UX
- Free plan positioning with daily usage meter
- Pro Monthly: **$5/month**
- Pro Annual: **$50/year**
- Monthly / yearly pricing selector
- Upgrade prompts and pricing modal
- Pro feature comparison
- Optional premium-service/add-on positioning
- Planned **2-day free trial** messaging

**Phase 1 is UX/product design only. No payment is collected and no subscription is activated yet.** Real authentication, server-side usage enforcement, trials, payment checkout, webhooks and entitlements are intentionally reserved for Phases 2–3.

## Development workflow
We complete each phase before requesting a full product test. Small implementation changes are not treated as separate test cycles.

## Run locally

```bash
python -m http.server 3000
```

Open http://localhost:3000.

## Deployment

The production site is deployed through Vercel and connected to the `main` branch of this repository.

> Trading calculations use assumptions noted in the UI. Always verify contract size, tick value, commissions, spread, and other broker-specific specifications before placing a trade.
