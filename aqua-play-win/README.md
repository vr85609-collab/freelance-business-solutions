# Aquaemoticons Play & Win — Aqua Arcade (prototype)

A browser-based mini-game arcade with twelve games, optional daily featured challenges, virtual stars, browser-local progress, and simulated rewards.

## Games — two choices in each category
| Category | Option 1 | Option 2 |
|---|---|---|
| Strategy | Tic-Tac Tactics (minimax CPU) | Connect Four (computer opponent) |
| Memory | Memory Match (8 pairs) | Word Recall (remember 5 words) |
| Concentration | Pattern Pulse (growing sequences) | Number Sprint (tap 1–16 in order) |
| Logic | Light Switch (Lights Out puzzle) | Codebreaker (3-digit deduction game) |
| Planning | Merge 2048 (combine tiles) | Slide Puzzle (3x3 number slide) |
| Luck | Bubble Guess (server-checked) | Higher or Lower (5 guesses) |

12 playable prototypes in total. Games are intended to work on mobile and desktop. Test every game on the deployed Node server before linking from your storefront.

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
This is a prototype, not a verified production deployment. The twelve-game browser UI has been committed to the `aquaemoticons-play-win` development branch of the `vr85609-collab/freelance-business-solutions` repository in the `aqua-play-win/` folder. It is intentionally isolated from the repository's `main` branch.
