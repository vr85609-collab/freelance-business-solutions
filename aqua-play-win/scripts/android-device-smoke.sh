#!/usr/bin/env bash
set -euo pipefail
# Run instrumentation directly so Gradle's post-test uninstall cannot remove screenshots.
gradle -p android :app:assembleOptimizedReview :app:assembleOptimizedReviewAndroidTest
adb install -r android/app/build/outputs/apk/optimizedReview/app-optimizedReview.apk
adb install -r android/app/build/outputs/apk/androidTest/optimizedReview/app-optimizedReview-androidTest.apk
adb logcat -v threadtime AndroidRuntime:E chromium:E AquaArcade:I '*:S' > android/device-logcat.txt &
arcade_log_pid=$!
trap 'kill "$arcade_log_pid" 2>/dev/null || true' EXIT
timeout 180s adb shell am instrument -w -r com.aquaemoticons.arcade.test/com.aquaemoticons.arcade.OfflineArcadeInstrumentation | tee android/instrumentation-result.txt
# am instrument can return zero on failure; require the runner's success result.
adb pull /sdcard/Android/data/com.aquaemoticons.arcade/files/screenshots android/device-screenshots
grep -Eq '^INSTRUMENTATION_RESULT: aqua_result=PASS' android/instrumentation-result.txt
test "$(find android/device-screenshots -name '*.png' | wc -l)" -eq 9
