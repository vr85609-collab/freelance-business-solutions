package com.aquaemoticons.arcade;

import android.app.Activity;
import android.app.Instrumentation;
import android.os.Bundle;
import android.util.Log;

/** Framework-only runner: tests the shrunk APK without requiring its removed Kotlin classes. */
public final class OfflineArcadeInstrumentation extends Instrumentation {
    volatile Activity resumedActivity;
    @Override public void onCreate(Bundle arguments) { super.onCreate(arguments); start(); }
    @Override public void callActivityOnResume(Activity activity) {
        super.callActivityOnResume(activity);
        resumedActivity = activity;
    }
    @Override public void onStart() {
        Bundle result = new Bundle();
        try {
            new OfflineArcadeTest(this).offlineGamesProgressLanguagesAndScreenshots();
            result.putString("aqua_result", "PASS");
            result.putString("stream", "\nAll 36 solo games, three pass-and-play games, external links, input guards, progress, language, theme and effects persistence passed.\n");
            finish(Activity.RESULT_OK, result);
        } catch (Throwable failure) {
            result.putString("aqua_result", "FAIL");
            result.putString("stream", Log.getStackTraceString(failure));
            finish(Activity.RESULT_CANCELED, result);
        }
    }
}
