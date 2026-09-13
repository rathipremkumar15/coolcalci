# CoolCalci — Phase 1 Product Specification

## Goal
Create a professional monetization experience without activating real billing yet.

## Plans

### Free
- Price: $0
- Planned allowance: 3 calculations/day
- Basic calculations
- Limited history
- Browser-local saved calculations

### Pro Monthly
- Price: $5/month
- Unlimited calculations
- Advanced XAUUSD and Forex tools
- Lot size, SL/TP and R:R
- Full history and saved calculations
- AI calculation assistant (Phase 2+)
- Export and advanced explanations

### Pro Annual
- Price: $50/year
- Same Pro feature set
- Save $10 versus 12 monthly payments

## Launch trial
The planned launch offer is a 2-day free trial. It is not active during Phase 1. Trial eligibility and enforcement will be server-side in Phase 2/3.

## Extra services
Potential add-ons are intentionally presented as future products:
- AI Calculation Pack
- Trading Analysis Pack
- Premium Reports

No add-on payment is active in Phase 1.

## UX requirements
- Pricing must be reachable from the main navigation and top bar.
- Pricing modal must work on desktop and mobile.
- Billing period selection must be visually obvious.
- Free and Pro features must be clearly differentiated.
- No checkout should imply that payment has completed.
- Trial copy must clearly indicate that it is planned, not active.

## Security boundary
The browser must never be trusted for subscription status, payment confirmation, trial eligibility, or paid usage limits. These become backend-enforced in later phases.
