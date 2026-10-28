# Aqua Arcade Shopify discount integration checklist

## Merchant-approved intended policy (October 27, 2026, America/Chicago)
- Launch: immediately **after** verified customer identity and all security tests pass.
- Audience: **all verified Shopify customers**, not anonymous players.
- Discount tiers based on a **server-validated** ten-round Bubble Guess game: 0–3 correct = 5%; 4–6 = 10%; 7–10 = 15%. Review whether rewarding 0 correct is intended before activation.
- Minimum purchase: USD $25.
- Maximum: one discount claim per verified customer per Monday–Sunday week (America/Chicago).
- One-time, individual codes. Expires 72 hours after issuance. No stacking.
- Offline and browser-local scores never qualify. A game must be played and validated online.

## Current status: **DISABLED**
The live app does NOT verify Shopify customer accounts, does NOT call Shopify discount mutations, and does NOT contain a redemption endpoint. No real coupon is being promised or generated.

## Activation blockers
1. Register/configure a Shopify custom app or public app suitable for authenticated customer identity (Shopify customer account authentication or a properly verified app-proxy signature). **Do not** accept a customer ID from a browser request as proof of identity.
2. Securely provision least-privilege Shopify Admin API credentials on the Render backend. Never put secrets in GitHub, browser code, or service worker caches.
3. Provision persistent Postgres storage; apply `sql/rewards-schema.sql`. Use a transaction-safe unique customer/week constraint. Current Render free instance has only in-memory game sessions and is not durable.
4. Make all reward-eligible gameplay server-authoritative, with session ownership, expiry, rate limiting, replay protection, and session-to-verified-customer binding.
5. Implement a server-side, idempotent discount creation operation with Shopify: restricted customer eligibility where supported; $25 minimum; unique code; one use; 72-hour expiry; all combinations off.
6. Simulate two simultaneous claims, duplicated requests, fake/offline score submissions, reconnect cases, identity spoofing and checkout (eligible/ineligible basket). Confirm no duplicate or unverified codes are created.
7. Confirm margin impact and legal/promotional terms. Review reward odds and discount tier 0–3 before activation.
8. Only after these tests are passed, change the deployment's `ARCADE_REWARDS_ENABLED` flag, by explicit merchant approval, and separately verify a real test code and storefront checkout.

## Existing shop connection
The store's main menu contains a live **Play & Win** link to the Render app. That navigation is separate from discount redemption.

## Offline
The PWA plays offline once cached; no customer login or coupons work offline. Local stars never become redeemable merely by syncing.
