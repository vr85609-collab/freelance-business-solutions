# JavaScript interfaces must remain callable if a future first-party bridge is added.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
