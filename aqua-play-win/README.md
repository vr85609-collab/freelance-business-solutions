# Aquaemoticons Play & Win — Aqua Arcade (prototype)

An installable, offline-capable browser mini-game arcade with twelve games, optional daily featured challenges, virtual stars, browser-local progress, and simulated rewards.

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

## Offline play / install on phone
1. Visit https://aquaemoticons-play-win.onrender.com once while online, allow all game files to load, and stay on the site until the service worker has installed.
2. On Android Chrome, use the Install app option (browser menu or in-page button when available).
3. On iPhone Safari, use Share → Add to Home Screen, then open the saved app at least once while online.
4. Turn on airplane mode and reopen the installed Aqua Arcade. The game UI and all 12 games are designed to run offline.
5. Virtual stars and scores remain on this device. **Offline scores and offline practice are not trusted for discounts and will not be automatically converted into coupons on reconnect.**
6. If offline reopening fails on the first try, reconnect once, reopen the app online, then repeat. Browser storage can be cleared by the OS or by the user, so offline files are not guaranteed forever.

Offline limitations: Shopify's storefront and checkout, customer sign-in, verification, and redemption always require internet. The arcade cannot create live Shopify discount codes offline. Bubble Guess falls back to a clearly labeled offline practice session when the server is unreachable. On a mid-session disconnect, it starts a fresh local round and does not carry over server results.

## Real discount integration — NOT ACTIVE
Proposed policy: 5/10/15 percent tiers; $25 minimum order; one claim per verified Shopify customer each calendar week; unique one-use codes; time-limited codes; no discount stacking. These are proposals and no Shopify codes have been created.

Do **not** issue live discounts from client-only stars, offline scores or localStorage. Before launch:
- Establish Shopify customer authentication and a trusted server-side game completion record.
- Add a persistent store (for example Postgres) with unique customer-week claim constraints and completed session identifiers; Render service memory is not durable.
- Set up securely managed Shopify Admin API credentials on the server. Never place tokens in frontend JavaScript, GitHub, or service worker caches.
- Call Shopify's discount API only after verifying identity, eligibility, replay protections, weekly limits and concurrent claim handling; enforce validity window, minimum purchase, one-time use and non-combination.
- Log claims minimally and test checkout and cancellations. Use email/marketing consent separately; winning a game must not opt anyone into advertising.
- The `GET /api/rewards/status` endpoint makes the disabled state clear; no redemption API is enabled.

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

## Additional games

The catalog now contains 17 games, including five original additions:

- Pocket Pool: solo six-ball pocket challenge, aim preview, adjustable power, collisions, scratches, and a 20-shot limit. 25 virtual stars for clearing the table.
- Color Clash: UNO-style color/number matching against a computer, with wilds, skip, and draw-two cards. No stacking. 20 virtual stars for an empty hand.
- Block Garden: place three-piece trays on an 8×8 board; clear six rows/columns for 25 virtual stars. Pieces do not rotate.
- Word Search: six generated words on a 9×9 grid, including diagonal/backward placements. Select both endpoints. 20 virtual stars for finding all six.
- Word Tiles: a Scrabble-style rack challenge using a visible curated word bank, one point per letter plus three for words of five or more letters. Reach 30 points in eight turns for 25 virtual stars. This is not a full Scrabble board or unrestricted dictionary.

All five work offline after the updated application has been loaded and cached online. English/Spanish guides, visual examples, local star rewards, and dark styling are included. Word content is generated using the language selected when a game starts. Real Shopify redemption remains disabled.

Validation: syntax checks and DOM-based gameplay simulations covered all guides, 30 generated word searches, 30 English/Spanish word-tile wins, 40 computer card games, block placement, pool physics and exit cleanup, language toggling, and offline asset registration. A full browser visual/offline run was unavailable because the browser download failed; offline cache registration was checked in source.
