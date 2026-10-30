# Aqua Arcade rewards and Google Play preparation

Prepared October 30, 2026. Implementation branch: feature/verified-rewards-android.
**Status: implementation for review; no live Shopify credentials, database migration, real discount, gift order, signing key, Play upload or production activation has been performed.**

## What is implemented
- Verified Shopify customer identity through an HMAC-verified app proxy, a one-time login exchange bound to an HttpOnly state cookie, and an eight-hour secure session cookie.
- PostgreSQL accounts, game sessions, ledger and reward/gift claims. Local browser totals are never imported or accepted as reward proof.
- A resource-limited worker replays the actual checked-in games from a server-issued seed and structured input transcript. No client code, point totals or win boolean are executed or trusted. Bubble Guess and Higher or Lower remain practice-only. 2048 consolation outcomes do not count as wins.
- 20 points per verified win; at most three DIFFERENT games each day. A win must take at least 20 seconds online. First win of the day adds 5; each seventh consecutive day adds 25. Server dates use America/Chicago, including DST. Historical verified stars, spendable points, wins, days and current streak are separate from local practice totals.
- Draft thresholds: 1,000/2,500/5,000 points for 5/10/15% coupons, respectively, with minimum verified wins 10/25/50 and days 3/7/14. $25 minimum merchandise subtotal, one use total, one verified customer, 72-hour validity, no stacking, one code per customer per Monday–Sunday week.
- At 10,000 points, 100 wins and 30 days, a player requests a bath-bomb review. Points are reserved. Victor approves the recipient and an allowlisted variant, or rejects and refunds the reserve. No order, shipping, email or fulfillment is automatically created. A product-specific credit covers one unit's price at issuance, up to $10, excludes shipping/tax, and cannot multiply with quantity. A later price change can leave a difference payable. Customer adds the product in Shopify checkout. Stock is checked before approval and again before issuance; inventory is not reserved by a discount code.
- Weekly program cap: 20 in-progress/issued codes; rolling 30-day gift cap: 5. Defaults are conservative draft business settings, not a confirmed launch policy.
- Stable random code and immutable Shopify input are persisted before API calls. After uncertain issuance the same code is looked up before retry; points are not double-spent. Uncertain claims retain their reserve until reconciliation. Never refund a possibly issued coupon until the Shopify result is checked.
- Same-origin writes, strict customer binding, rate limits, worker/resource limits, unique claim constraints, session cleanup command, privacy notice and authenticated rewards-account deletion. Deleted-account keyed hash retained 365 days to prevent reset abuse.

## Activation: required configuration
1. Register/install a Shopify app on **c4f975-da.myshopify.com** with access scopes read_products, read_discounts, write_discounts, write_app_proxy and whatever customer identity access Shopify requires for the chosen distribution/account setup. Follow Shopify's current app installation/credential lifecycle; do not paste tokens into chat or GitHub. This implementation expects a currently valid Admin access token in Render secrets; if the chosen app uses expiring tokens, implement/operate token refresh before launch.
2. Configure app proxy prefix `apps`, subpath `aqua-arcade`, target URL `https://aquaemoticons-play-win.onrender.com/auth/shopify`. The storefront entry is `/apps/aqua-arcade?state=...` (no extra `/auth` suffix). Sign-in begins on `/api/rewards/login`. Verify your store's active customer-account mode supplies signed logged_in_customer_id through the proxy. If it does not, implement Customer Account OAuth instead; never accept an unverified customer ID.
3. Create a durable PostgreSQL database. Add DATABASE_URL to Render. The current web service's memory is not durable storage. Run `npm run rewards:migrate` once and `npm run rewards:cleanup` daily. Migration creates new tables and does not alter the old demo tables.
4. Set APP_ORIGIN to the exact HTTPS app origin; SHOPIFY_SHOP to c4f975-da.myshopify.com; SHOPIFY_API_SECRET and SHOPIFY_ADMIN_ACCESS_TOKEN using Render secret fields. Generate ARCADE_FRAUD_SALT and ARCADE_ADMIN_TOKEN independently with at least 32 random bytes. Do not rotate the fraud salt without planning existing tombstone retention. Never expose these values to browser code or service workers.
5. Confirm which products are your private label. Search found Love It, Sleepy Time and Citrus Burst, but ownership/private-label status was not inferred from vendor name alone. Candidate variant IDs: 44033428324548 / 44033448804548 / 44033465483460. Set only confirmed FULL `gid://shopify/ProductVariant/...` values in GIFT_VARIANT_ALLOWLIST. The default is empty. Love It was read at $5.99 with stock on October 30; issuance rechecks live data.
6. Read/publish the privacy and rewards terms, confirm thresholds, shipping responsibility and budget caps, then set ARCADE_PROMOTION_TERMS_APPROVED=true. Keep ARCADE_REWARDS_ENABLED=false while testing identity and replay credit. Never promise rewards while redemption is disabled.
7. Using two controlled test customer accounts, verify proxy sign-in, expired/forged/replayed logins, server wins vs modified/offline totals, the daily caps and customer/week duplicate claims. In a test store first, test Shopify issuance, min-subtotal checkout, wrong customer rejection, expiry, stacking rejection, extra gift quantities, stock changes and timeout retry. Confirm database concurrency against real PostgreSQL (CI service supplied), not only the embedded test engine.
8. Only after these pass, enable ARCADE_REWARDS_ENABLED=true for the WEB program and complete a controlled real-store checkout check. No production code has been issued by this change. Review the admin queue at `/rewards-admin`; enter the admin token only on the trusted HTTPS page. It is not persisted in browser storage.

## Limits of abuse protection
Deterministic replay verifies permitted moves/outcomes, not whether a human played. Seeds and public game code can be inspected; bots can solve puzzles. Caps and server-recorded time reduce abuse but do not eliminate it. Before material promotional spend, assess account abuse, monitoring, revocation and operating costs. Server identity is only as good as the actual tested Shopify app-proxy/account configuration.

## Android / Google Play
The Android project is a **separate, explicitly offline practice edition**. It bundles the same 36 game scripts, current supplied branding, English/Spanish, dark mode, categories, search, favorites and virtual progress. It does not load remote code, include the rewards client, request Internet permission, access a rewards account or redeem store value. This is disclosed in listing and privacy drafts; do not remotely enable hidden rewards after review.

Google Play's game loyalty policy restricts transaction-linked real-value rewards driven by game performance. This is a submission-design concern, not an assertion that the web promotion is automatically approved or prohibited. Review the actual business model with Google before including real-value rewards in a Play build. The web rewards feature must not be used to conceal in-app rewards from reviewers.

### Build
JDK 17; Gradle 8.11.1; AGP 8.10.1; Android SDK platform 36 and build tools 35.0.0. `targetSdk=36`, `compileSdk=36`, minSdk 24, applicationId `com.aquaemoticons.arcade`, versionCode 1 / versionName 1.0.0. Confirm ownership/final package ID before first upload; it becomes permanent for that listing.

```
cd aqua-play-win
npm ci
npm test
npm run android:sync
gradle -p android :app:lintRelease :app:assembleDebug :app:bundleRelease
```

The root `.github/workflows/aqua-arcade.yml` provides PostgreSQL tests and an Android build on pull request or manual dispatch. Build artifacts include a debug APK, unsigned release AAB and lint report. No release keystore is generated or committed. The AAB must be signed with your upload key before Play Console can accept it. The local workspace has JDK 17 but no Android SDK/Gradle, so an Android compilation is performed by CI; real-device testing is still required.

### Submission checklist
- Obtain/verify your Google Play developer account and complete its required identity checks. Do not create paid accounts or accept legal agreements automatically.
- Choose/confirm package ID and publisher identity. Enroll in Play App Signing and securely create/retain an upload key. Sign the release AAB.
- Complete Android lint, device/emulator checks (offline first launch, all games, small screens, dark/light, both languages, Back handling, rotation/recreation, keyboard, clearing storage and external store link).
- Capture real screenshots from the Android build for the Play listing. Do not use the AI-rendered storyboard as screenshots. Draft listing text is in android/store-listing. Supplied-logo icon and branded feature graphic are prepared; final store screenshots are not yet captured.
- Publish a stable privacy URL and complete Data safety based on the actual Android artifact, including any later SDKs. Offline practice build currently has no server data upload, ads, accounts or purchases. Do not copy the web rewards data description into the native Data safety form without distinguishing editions.
- Complete content rating, target audience, app access, ads declaration, countries, pricing and policy declarations truthfully. Do not claim approvals or guess questionnaire answers. No Play submission has been performed.
- If a new personal account created after November 13, 2023 is subject to Google's testing rule, run a closed test with at least 12 continuously opted-in testers for 14 days, then apply for production access. Confirm the applicable requirement in your Console.

Sources checked October 30, 2026:
- https://support.google.com/googleplay/android-developer/answer/18258653?hl=en&rd=5
- https://developer.android.com/google/play/requirements/target-sdk
- https://developer.android.com/build/releases/agp-8-10-0-release-notes
- https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
- https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/discountCodeBasicCreate

## Verified build results
GitHub Actions run 41028216036 passed tests against PostgreSQL 17 and Android lint, debug APK and unsigned release AAB generation. The Android source has no real-value rewards. Subsequent changes to web-only capacity reservation do not change bundled Android assets. Native device testing, release signing and Play submission remain outstanding.
