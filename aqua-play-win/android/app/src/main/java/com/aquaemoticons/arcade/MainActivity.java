package com.aquaemoticons.arcade;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.window.OnBackInvokedDispatcher;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.ByteArrayInputStream;

public final class MainActivity extends Activity {
    private WebView webView;
    private static final String HOST = "appassets.androidplatform.net";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        setContentView(webView);
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        // Keep the game clear of status/navigation bars with Android 15+ edge-to-edge.
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true); // Only packaged, first-party scripts are loaded.
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("https".equals(url.getScheme()) && HOST.equals(url.getHost())) {
                    WebResourceResponse response = loader.shouldInterceptRequest(url);
                    if (response != null) return response;
                }
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not found", null,
                        new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                if ("https".equals(uri.getScheme()) && ("aquaemoticons.com".equals(uri.getHost()) || ("aquaemoticons-play-win.onrender.com".equals(uri.getHost()) && "/".equals(uri.getPath()) && "1".equals(uri.getQueryParameter("multiplayer")))) && request.hasGesture()) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (ActivityNotFoundException ignored) { }
                }
                return true;
            }
        });
        if (state == null || webView.restoreState(state) == null) webView.loadUrl("https://" + HOST + "/index.html");
    }
    @Override protected void onSaveInstanceState(Bundle out) { webView.saveState(out); super.onSaveInstanceState(out); }
    @Override public void onBackPressed() { handleBack(); }
    private void handleBack() {
        webView.evaluateJavascript("Boolean(['playing','multiplayer'].includes(document.body.dataset.mode))", result -> {
            if ("true".equals(result)) webView.evaluateJavascript("home()", null);
            else if (webView.canGoBack()) webView.goBack();
            else finish();
        });
    }
    @Override protected void onPause() { webView.onPause(); webView.pauseTimers(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) { webView.resumeTimers(); webView.onResume(); } }
    @Override protected void onDestroy() { webView.destroy(); super.onDestroy(); }
}
