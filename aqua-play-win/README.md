# Aquaemoticons Play & Win — prototype

Standalone browser game with a server-authoritative 10-round guessing game and **demo-only** rewards. It does NOT create Shopify discounts or modify the live store.

## Run

Install Node.js 20 or newer, then run:

```bash
npm start
```

Open http://localhost:3000. No dependencies or secrets needed.

## Reward tiers (prototype)
- 0–3 correct: 5% demo reward
- 4–6 correct: 10% demo reward
- 7–10 correct: 15% demo reward
- Intended minimum order: $25

## Shopify integration plan (not implemented)
1. Deploy this app to a dedicated HTTPS host, e.g. play.aquaemoticons.com.
2. Add a storefront navigation link to the game.
3. Implement authenticated, single-use customer rewards backed by a durable database. Enforce weekly limits, replay and fraud protection.
4. Add a server-side Shopify Admin API integration with minimum scopes and a securely stored token. Generate unique discount codes with customer eligibility, minimum purchase, expiration, one-use limit and non-stacking rules. Never expose Admin credentials in browser JavaScript.
5. Add a claim flow, promotion terms, analytics, and test checkout end-to-end in nonproduction before enabling real codes.
6. Replace the sample Bubble Guess game or add the earlier 15-game collection when its source is available.

**Important:** This demo is not resistant to automated farming or repeated play. Do not activate live discounts without authentication, rate limits, persistent claim records, and fraud controls. Reward thresholds are suggestions, not a live offer. 
