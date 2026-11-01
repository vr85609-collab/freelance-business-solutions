package com.aquaemoticons.arcade;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/** Exact, packaged-only HTTPS resources. No path decoding or filesystem access. */
final class OfflineAssets {
    private static final Set<String> FILES = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "index.html", "privacy.html", "ocean-art.svg", "ocean-hero.webp", "game-art.svg",
            "app.js", "extra-games.js", "new-games.js", "catalog.js", "arcade.css", "theme.js",
            "language.js", "brand-logo.webp", "app-icon.png", "experience.js", "multiplayer.js",
            "multiplayer-rules.js")));
    static String resolve(String scheme, String host, int port, String method, String path) {
        if (!"https".equals(scheme) || !"appassets.androidplatform.net".equals(host)
                || (port != -1 && port != 443) || !"GET".equals(method)
                || path == null || !path.startsWith("/")) return null;
        String file = path.substring(1);
        return FILES.contains(file) ? file : null;
    }
    static String mime(String file) {
        if (file.endsWith(".html")) return "text/html";
        if (file.endsWith(".js")) return "text/javascript";
        if (file.endsWith(".css")) return "text/css";
        if (file.endsWith(".svg")) return "image/svg+xml";
        if (file.endsWith(".webp")) return "image/webp";
        if (file.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }
    static boolean isText(String file) { return file.endsWith(".html") || file.endsWith(".js") || file.endsWith(".css") || file.endsWith(".svg"); }
}
