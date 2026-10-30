# Aqua Arcade rewards and Google Play preparation

Prepared October 30, 2026. Implementation branch: feature/verified-rewards-android.
**Status: web code, visible store link and reward rules deployed October 30. Redemption is DISABLED and accounts are not configured. No runtime Shopify credentials, database migration, real discount, gift order, upload signing key or Play upload has been performed.**

## What is implemented
- Verified Shopify customer identity through an HMAC-verified app proxy, a one-time login exchange bound to an HttpOnly state cookie, and an eight-hour secure session cookie.
- PostgreSQL accounts, game sessions, ledger and reward/gift claims. Local browser totals are never imported or accepted as reward proof.
- A resource-limited worker replays the actual checked-in games from a server-issued seed and structured input transcript. No client code, point totals or win boolean are executed or trusted. Bubble Guess and Higher or Lower remain practice-only. 2048 consolation outcomes do not count as wins.
- 20 points per verified win; at most three DIFFERENT games each day. A win must take at least 20 seconds online. First win of the day adds 5; each seventh consecutive day adds 25. Server dates use America/Chicago, including DST. Historical verified stars, spendable points, wins, days and current streak are separate from local practice totals.
- Current thresholds: 500 / 1,500 / 3,000 points for fixed $2 / $4 / $6 coupons, with minimum wins 20 / 60 / 120 and active days 7 / 21 / 45. Eligible-product subtotals: $25 / $40 / $50. Only Citrus Burst, Sleepy Time and Love It bath-bomb variants qualify. One verified customer, one use, seven days, no stacking, one code per customer per Monday–Sunday week. See REWARD_ECONOMICS.md.
- At 4,000 points, 150 wins and 60 active days, a player requests a gift review. Victor approves the player and one confirmed scent, or rejects and refunds the reserved points. The approved code is buy ANY five eligible bath bombs, get ONE additional unit of the approved scent free; six units must be in the cart. Shopify BXGY quantity rules enforce one free unit and one application per order. No order, shipment, email or fulfillment is created automatically. Shipping and taxes are excluded. One accepted gift request per account.
- Initial caps: 10 in-progress/issued codes weekly and 3 gift codes per rolling 30 days. Current gift retail cap at issuance is $6. Costs, stock and estimated contribution are checked before reserving points and before creating a code.
- Stable random code and immutable Shopify input are persisted before API calls. After uncertain issuance the same code is looked up before retry; points are not double-spent. Uncertain claims retain their reserve until reconciliation. Never refund a possibly issued coupon until the Shopify result is checked.
- Same-origin writes, strict customer binding, rate limits, worker/resource limits, unique claim constraints, session cleanup command, privacy notice and authenticated rewards-account deletion. Deleted-account keyed hash retained 365 days to prevent reset abuse.

## Activation: required configuration
1. Register/install a Shopify app on **c4f975-da.myshopify.com** with access scopes read_products, read_inventory, read_discounts, write_discounts, write_app_proxy and whatever customer identity access Shopify requires for the chosen distribution/account setup. Follow Shopify's current app installation/credential lifecycle; do not paste tokens into chat or GitHub. For a new app acting on its own organization’s store, set SHOPIFY_CLIENT_ID and SHOPIFY_API_SECRET in Render. The backend exchanges client credentials for a token, refreshes before expiry and retries one unauthorized response with a renewed token. An already-existing legacy installed-app token can instead use SHOPIFY_ADMIN_ACCESS_TOKEN. Never reuse or extract the ChatGPT connector’s token.
2. Configure app proxy prefix `apps`, subpath `aqua-arcade`, target URL `https://aquaemoticons-play-win.onrender.com/auth/shopify`. The storefront entry is `/apps/aqua-arcade?state=...` (no extra `/auth` suffix). Sign-in begins on `/api/rewards/login`. Verify your store's active customer-account mode supplies signed logged_in_customer_id through the proxy. If it does not, implement Customer Account OAuth instead; never accept an unverified customer ID.
3. Create a durable PostgreSQL database. Add DATABASE_URL to Render. The current web service's memory is not durable storage. Set `ARCADE_MIGRATE_ON_START=true` after wiring the approved database. The prestart task applies the schema transactionally under an advisory lock and runs cleanup; startup fails safely if initialization fails. The configured web process also cleans expired sessions at startup and hourly while awake; after sleeping, cleanup catches up when it resumes. `npm run rewards:migrate` and `npm run rewards:cleanup` remain available for manual operations. Migration creates new tables and does not alter the old demo tables.
4. Set APP_ORIGIN to the exact HTTPS app origin; SHOPIFY_SHOP to c4f975-da.myshopify.com; SHOPIFY_CLIENT_ID and SHOPIFY_API_SECRET using Render secret fields (or a legacy token only for a pre-existing legacy app). Generate ARCADE_FRAUD_SALT and ARCADE_ADMIN_TOKEN independently with at least 32 random bytes. Do not rotate the fraud salt without planning existing tombstone retention. Never expose these values to browser code or service workers.
5. Victor confirmed Citrus Burst, Sleepy Time and Love It as the gift products. Their variant GIDs are prefilled in .env.example and policy.js. Prices, private recorded unit costs and stock were checked on October 30; the merchant margin worksheet is delivered privately. Issuance rechecks live prices, costs and stock. Review actual packaging, transaction fees and store-funded shipping; the budget estimates are not verified expenses. See REWARD_ECONOMICS.md.
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
GitHub Actions run 41090094903 passed all 61 tests against PostgreSQL 17, Android lint, APK/AAB builds and Android 16 instrumentation. Instrumentation opened all 36 games, completed Number Sprint, checked persisted progress and Spanish/dark mode, tapped the visible store link and verified the external browser destination, and captured seven original screenshots. Physical-device testing, release signing and Play submission remain outstanding.

## Continued Android preparation
The `android-device` CI job boots an API 36 Android emulator and runs the actual packaged WebView. It opens all 36 games, completes Number Sprint through its inputs, checks saved stars after activity recreation, switches English/Spanish and light/dark mode, and captures seven unmodified device screenshots. Results and screenshots are uploaded as `aqua-arcade-device-review`. This is a smoke check, not a substitute for physical-device testing or playing every game to completion. The app itself has no Internet permission. Emulator access to Google infrastructure does not add network permission to the app.

The Android packaging script removes website service-worker/installer scripts, including versioned URLs, to avoid missing resources in the bundled app.

### Signing an upload bundle
The release build optionally reads four environment variables from the release operator's secure environment:

- `AQUA_UPLOAD_STORE_FILE`: absolute path to the existing upload keystore.
- `AQUA_UPLOAD_STORE_PASSWORD`: keystore password.
- `AQUA_UPLOAD_KEY_ALIAS`: upload key alias.
- `AQUA_UPLOAD_KEY_PASSWORD`: upload key password.

Supply all four or none. Partial credentials fail the build; no credentials produce an unsigned review bundle. Do not paste secrets in chat, commit them, or run a command that prints them. Use a local secure terminal or your release secret manager. Build with `gradle -p android :app:bundleRelease`; verify the output signature with `jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab`. Compare the certificate fingerprint with your Play Console upload certificate. A new app may first need Play App Signing enrollment and an upload key chosen by the owner. No upload key is generated or configured by this change, and no automatic Play publishing is enabled.

Current live infrastructure was read again October 30: the deployed service still uses branch `aquaemoticons-play-win`, and the connected Render workspace has no PostgreSQL instance. Pull request #1 is merged and the web update is live. The three approved gift variants and disabled-redemption flags are configured on Render. Real rewards still require a production database, installed Shopify app credentials, reviewed cost assumptions and checkout checks.

Additional implementation references:
- https://developer.android.com/training/testing/instrumented-tests/androidx-test-libraries/runner
- https://developer.android.com/build/build-variants
- https://github.com/ReactiveCircus/android-emulator-runner

## Updated storefront and credentials status
The Shop bath bombs & more link is visible on phone and desktop during browsing and gameplay. In Android it opens the external browser. Localized English/Spanish labels are included. Native instrumentation taps the actual link and verifies the external ACTION_VIEW destination.

Shopify Admin API cannot disclose a separate app’s client secret. The Dev Dashboard opened to Shopify sign-in in this session. Secure owner authentication, app creation/installation with the stated scopes and secure Render secret configuration remain required. Creating or expanding app access requires the owner’s action-time approval. The runtime now supports the 24-hour client-credentials lifecycle instead of requiring manual daily tokens.

Before any real issuance, use controlled test accounts to test the fixed coupons on mixed eligible-product carts and ineligible-product-only carts, the minimum qualifying subtotals, five paid plus one approved gift (also same-scent six-unit carts), no discount on five total units, no multiplied gift with twelve units, wrong-customer rejection, no stacking, expiry, cost pauses and timeout reconciliation. No live checkout or real coupon issuance is claimed.

Deployment verification: Render deploy dep-dbicdiqvcj2c73cgf8bg reached live for merge commit 973b3de2f245c319fb03aa6b53159620ae6e1cda. Direct HTTP checks confirmed the visible store navigation, the new public rules and /api/rewards/status returning enabled=false and accountsReady=false. Shopify secure sign-in was not completed; no client secret was obtained.

## Production and submission follow-through
A dedicated Android policy is served at `/android-privacy` and the exact same document is bundled in the Android app. Use that URL for the offline Android edition, rather than the web rewards policy. Android cloud backup and device-transfer rules explicitly exclude every app data domain.

The cheapest current paid database plan was checked at $6/month with 1 GB included, in Virginia alongside the app. No database was created without an approved recurring budget. Free Postgres expires after 30 days and is unsuitable for durable rewards.

Chrome reached Shopify developer sign-in. Google Play showed new developer-account registration for the currently signed-in personal Google account; the final publisher/owner account has not been chosen. Account registration, identity checks and payment must be completed by the owner. No production release signing key has been generated or submitted.
