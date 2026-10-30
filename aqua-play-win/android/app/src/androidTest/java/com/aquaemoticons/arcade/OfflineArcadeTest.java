package com.aquaemoticons.arcade;

import android.graphics.Bitmap;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Runs against the real packaged WebView with no Internet permission. */
@RunWith(AndroidJUnit4.class)
public final class OfflineArcadeTest {
    private String js(ActivityScenario<MainActivity> scene, String expression) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scene.onActivity(activity -> {
            ViewGroup content = activity.findViewById(android.R.id.content);
            ((WebView) content.getChildAt(0)).evaluateJavascript(expression, value -> {
                result.set(value); done.countDown();
            });
        });
        assertTrue("WebView JavaScript timed out", done.await(10, TimeUnit.SECONDS));
        return result.get();
    }
    private void ready(ActivityScenario<MainActivity> scene) throws Exception {
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(30);
        while (System.nanoTime() < until) {
            if ("true".equals(js(scene, "typeof keys !== 'undefined' && Object.keys(keys).length === 36 && !!window.AquaCatalog && !!window.AquaLanguage"))) return;
            Thread.sleep(100);
        }
        fail("Bundled arcade did not initialize");
    }
    private void screenshot(String name) throws Exception {
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
        Thread.sleep(350); // Allow WebView compositor to present the already-checked state.
        Bitmap bitmap = InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        assertNotNull("Screenshot unavailable", bitmap);
        File folder = new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getExternalFilesDir(null), "screenshots");
        assertTrue(folder.isDirectory() || folder.mkdirs());
        try (FileOutputStream out = new FileOutputStream(new File(folder, name + ".png"))) {
            assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, out));
        } finally { bitmap.recycle(); }
    }
    @Test public void offlineGamesProgressLanguagesAndScreenshots() throws Exception {
        try (ActivityScenario<MainActivity> scene = ActivityScenario.launch(MainActivity.class)) {
            ready(scene);
            assertEquals("true", js(scene, "!document.querySelector('#rewardsPanel') && !document.querySelector('script[src=\"/rewards.js\"]')"));
            js(scene, "localStorage.clear(); location.reload();");
            Thread.sleep(500);
            ready(scene);
            js(scene, "window.__arcadeErrors=[]; window.addEventListener('error',e=>window.__arcadeErrors.push(e.message)); if(document.documentElement.dataset.theme==='dark')document.querySelector('#themeToggle').click(); home(); window.scrollTo(0,0);");
            screenshot("01-home-en");
            // Open every real bundled game, including those below the initial library page.
            String ids = js(scene, "Object.keys(keys).join(',')").replace("\"", "");
            assertEquals(36, ids.split(",").length);
            for (String id : ids.split(",")) {
                js(scene, "open('" + id + "');");
                assertEquals(id + " opens", "true", js(scene, "document.body.dataset.mode==='playing' && document.querySelector('#gameTitle').textContent.length>0"));
                if (id.equals("twenty")) screenshot("02-merge-2048-en");
                if (id.equals("wordsearch")) screenshot("03-word-search-en");
                if (id.equals("blocks")) screenshot("04-block-garden-en");
                if (id.equals("cards")) screenshot("05-color-clash-en");
                js(scene, "home();");
            }
            assertEquals("[]", js(scene, "window.__arcadeErrors"));
            // Complete a real game via its input handlers and check persisted progress.
            assertEquals("true", js(scene, "open('focus'); for(let n=1;n<=16;n++) [...document.querySelectorAll('#board button')].find(b=>b.textContent===String(n)).click(); finished && progress.stars===20 && progress.finished===1"));
            js(scene, "home(); document.querySelector('#themeToggle').click();");
            assertEquals("\"dark\"", js(scene, "document.documentElement.dataset.theme"));
            js(scene, "document.querySelector('#languageToggle').click();");
            assertEquals("\"es\"", js(scene, "window.AquaLanguage.language"));
            js(scene, "open('wordsearch');");
            screenshot("06-word-search-es-dark");
            js(scene, "home();");
            scene.recreate();
            ready(scene);
            assertEquals("true", js(scene, "progress.stars===20 && progress.finished===1 && window.AquaLanguage.language==='es' && document.documentElement.dataset.theme==='dark'"));
            screenshot("07-home-es-dark");
        }
    }
}
