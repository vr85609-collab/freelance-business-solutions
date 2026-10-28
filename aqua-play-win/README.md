# Aquaemoticons Play & Win — Aqua Arcade (prototype)

A browser-based mini-game arcade with six games, optional daily featured challenges, virtual stars, browser-local progress, and simulated rewards.

## Games
1. Bubble Guess — server-validated 10-round lucky bubble guesses.
2. Tic-Tac Tactics — play X against a minimax opponent.
3. Memory Match — find eight shuffled icon pairs.
4. Pattern Pulse — repeat increasingly long color sequences.
5. Light Switch — Lights Out logic puzzle on a 4x4 board.
6. Merge 2048 — combine matching tiles using arrow keys, screen buttons, or swipe gestures.

## Return-play features
- Rotating daily featured game, with a **one-time virtual 5-star bonus** upon completion.
- Virtual stars awarded after completing puzzles, including bonus for efficiency where applicable.
- Completed games and distinct days played.
- Local progress in the browser (localStorage); no penalties for missed days, no pressure-based streak loss, no purchases, and no random paid rewards.
- No customer accounts or cross-device syncing in this prototype.

## Run locally
Requires Node.js 20+; no dependencies.
```bash
npm start
```
Visit http://localhost:3000 and select a game.

## Shopify integration status
The storefront at https://aquaemoticons.com has **not been modified**. The prototype does not generate real Shopify discount codes. Bubble Guess only *simulates* tiers of 5%, 10%, or 15% off, with a suggested minimum purchase of $25; these are not redeemable.

For real rewards later, build:
1. Login / verified customer identity and accessible promotional terms.
2. Server-authoritative completion records for all games (currently only Bubble Guess sends guesses to the server); other games and virtual stars are client-side and **must not be trusted** for real rewards.
3. Persistent database, one claim per customer per qualifying period, bot defenses and rate limits.
4. Secure Shopify Admin API token on the server only; create unique expiring customer-restricted codes with minimum purchase, use limits, and non-stacking rules.
5. Test checkout and customer support flows before offering any real discount.
6. Add the remaining original games when their source is available and deploy to a standalone HTTPS host (e.g. Vercel with appropriate Node hosting or a compatible Node server).

## Notes
This is a prototype, not a verified production deployment. The full six-game browser UI has been committed to the `aquaemoticons-play-win` development branch of the `vr85609-collab/freelance-business-solutions` repository in the `aqua-play-win/` folder. It is intentionally isolated from the repository's `main` branch.
