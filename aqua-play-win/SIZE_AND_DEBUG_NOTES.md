# Aqua Arcade 1.3.1 — size and debug update

The previous 1.3.0 review APK is 340,095 bytes. Its offline content is 544,889 bytes. This revision keeps the hero WebP, brand WebP and app-icon PNG byte-for-byte unchanged, and preserves all 36 games, English/Spanish and offline play.

Repeated SVG font attributes move to their enclosing symbols. A Chromium rendering comparison of all 36 illustrations found zero pixel differences. Packaged classic scripts and CSS are compacted at build time, preserving their public names. The game source remains readable.

Android's framework WebView now serves an exact allowlist of bundled files on the same HTTPS origin, replacing the AndroidX asset-loading dependency. Unknown paths, traversal, foreign origins, nonstandard ports and write requests fail closed. File/content access stay disabled, and no Internet permission is added.

A parent container applies system-bar and display-cutout insets, addressing the controls overlap found in Android 16 screenshots. Device checks assert the WebView stays within those bounds before play and after activity recreation. UI-thread assertion failures are forwarded to the test runner. Emulator/Gradle resource use is bounded, and device failures collect focused diagnostics.

Validation includes the existing gameplay/rewards suite, packaged-engine gameplay tests, image-byte checks, a framework loader policy check, responsive browser checks and native Android instrumentation. Final APK size and device results must come from this revision's CI artifacts; do not infer them from raw asset sizes. Installed storage and runtime RAM are separate measurements. Release signing and physical-phone review remain owner tasks.
