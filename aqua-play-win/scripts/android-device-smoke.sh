#!/usr/bin/env bash
set -euo pipefail
# Run instrumentation directly so Gradle's post-test uninstall cannot remove screenshots.
gradle -p android :app:assembleOptimizedReview :app:assembleOptimizedReviewAndroidTest
adb install -r android/app/build/outputs/apk/optimizedReview/app-optimizedReview.apk
adb install -r android/app/build/outputs/apk/androidTest/optimizedReview/app-optimizedReview-androidTest.apk
adb shell am instrument -w com.aquaemoticons.arcade.test/androidx.test.runner.AndroidJUnitRunner | tee android/instrumentation-result.txt
# am instrument can return zero even when its test failed. Require JUnit's success summary.
adb pull /sdcard/Android/data/com.aquaemoticons.arcade/files/screenshots android/device-screenshots
grep -Eq '^OK [(]1 test[)]' android/instrumentation-result.txt
test "$(find android/device-screenshots -name '*.png' | wc -l)" -eq 9
