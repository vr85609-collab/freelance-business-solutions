# Aqua Arcade lightweight quality update

Prepared October 30, 2026. Source update for the existing 36-game app.

## Measured changes

| Item | Previous review build | Updated source bundle |
| --- | ---: | ---: |
| Uncompressed offline assets | 1,091,717 bytes | 444,292 bytes |
| Header artwork dimensions | 3400 × 3219 | 1200 × 1136 |
| Approximate RGBA logo bitmap alone | 41.75 MiB | 5.20 MiB |

Offline content is about 59% smaller. Bitmap figures are width × height × 4 estimates for one decoded image, not measurements of total app RAM. Actual WebView allocations vary. The previous debug APK was 1,931,471 bytes. No new APK/AAB size, installed-storage result, FPS, or phone RAM result is claimed.

## Implemented

- Preserve the supplied logo using a smaller WebP asset; replace the duplicate embedded SVG icon in active/offline packages with a small PNG.
- Retain all 36 local games, vector illustrations, English/Spanish, dark mode, and the external Shopify link.
- Track 2048 tile origins for finite movement/merge animations; cancel old animations on rapid input and leaving games.
- Add optional synthesized tap and victory audio with no audio-file downloads. Sound defaults off.
- Add persistent Light effects mode, selected initially on devices reporting at most 4 GiB RAM or 4 logical processors. Respect system reduced motion. Reduce shadows and skip offscreen library painting where supported.
- Release completed timer cleanup closures during play; pending timers still cancel when exiting.
- Pause WebView timers when Android goes into the background; suspend audio and animation when hidden.
- Enable Android release code/resource shrinking, with a debug-signed optimizedReview variant configured for emulator instrumentation.
- Add a 600 KiB offline-content budget check to Android CI.

## Validation

68 automated tests passed. Regression coverage includes all games, 2048 move conservation/replay, timer disposal, effects preferences, reduced motion, cancellation, and offline packaging. New asset routes return HTTP 200 with correct MIME types.

Android compilation, optimizedReview installation, emulator checks, new visual screenshots, physical-device testing and size/RAM/FPS measurements have NOT run for this update. Local Android build tools were unavailable; a browser download failed. GitHub publication was blocked by automatic approval review, so remote CI did not run. The previously generated APK is not updated by this source package.

## Build and review

From aqua-play-win:

```sh
npm ci
npm test
npm run android:sync
npm run size:check
gradle -p android :app:lintRelease :app:assembleOptimizedReview :app:bundleRelease
```

Use Java 17, Gradle 8.11.1, Android platform 36 and build tools 35.0.0, as configured in the workflow. Install the new debug-signed review APK at android/app/build/outputs/apk/optimizedReview/app-optimizedReview.apk. Run scripts/android-device-smoke.sh with an API 36 emulator attached. The release AAB remains unsigned without the owner's upload-key environment settings.

Before release: inspect the logo at phone/tablet density; play fast 2048 inputs and each game; test Light effects, sound, English/Spanish and dark mode; background/resume; test offline reopening. Measure startup, frame pacing, total RAM and installed storage on a lower-spec physical phone. Competitive quality needs these checks and player feedback; this update is not a claim of parity with every commercial app.

The production website and prior installable review build have not been changed. Rewards eligibility and redemption logic are unchanged.
