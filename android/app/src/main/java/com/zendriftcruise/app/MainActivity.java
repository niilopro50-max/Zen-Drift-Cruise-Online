package com.zendriftcruise.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public final class MainActivity extends Activity {
    private static final String ONLINE_GAME_URL = "https://zen-drift-cruise-online.onrender.com/play?mobileapp=1";
    private WebView gameView;
    private boolean onlineGameRequested;
    private boolean openedOfflineCopy;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
        gameView = new WebView(this);
        WebSettings settings = gameView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        gameView.setWebChromeClient(new WebChromeClient());
        gameView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                if (url.startsWith("https://zen-drift-cruise-online.onrender.com/")) {
                    onlineGameRequested = false;
                }
            }

            @Override
            public void onReceivedError(
                WebView view,
                android.webkit.WebResourceRequest request,
                android.webkit.WebResourceError error
            ) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame() && onlineGameRequested && !openedOfflineCopy) {
                    openedOfflineCopy = true;
                    onlineGameRequested = false;
                    gameView.loadUrl("file:///android_asset/index.html");
                }
            }
        });
        setContentView(gameView);
        onlineGameRequested = true;
        gameView.loadUrl(ONLINE_GAME_URL);
        checkForUpdates();
    }

    private void checkForUpdates() {
        Thread updateCheck = new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                URL releaseUrl = new URL(
                    "https://api.github.com/repos/niilopro50-max/Zen-Drift-Cruise-Online/releases/latest"
                );
                connection = (HttpURLConnection) releaseUrl.openConnection();
                connection.setRequestMethod("GET");
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "Zen-Drift-Cruise-Android");
                connection.setConnectTimeout(7000);
                connection.setReadTimeout(7000);
                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return;

                StringBuilder response = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream())
                )) {
                    String line;
                    while ((line = reader.readLine()) != null) response.append(line);
                }

                JSONObject release = new JSONObject(response.toString());
                String latestVersion = release.optString("tag_name", "").replaceFirst("^[vV]", "");
                PackageInfo packageInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                String currentVersion = packageInfo.versionName == null ? "0.0.0" : packageInfo.versionName;
                if (!isNewerVersion(latestVersion, currentVersion)) return;

                JSONArray assets = release.optJSONArray("assets");
                String downloadUrl = null;
                if (assets != null) {
                    for (int index = 0; index < assets.length(); index++) {
                        JSONObject asset = assets.optJSONObject(index);
                        if (asset == null) continue;
                        if ("zen-drift-cruise-android.apk".equalsIgnoreCase(asset.optString("name"))) {
                            downloadUrl = asset.optString("browser_download_url", null);
                            break;
                        }
                    }
                }
                if (downloadUrl == null || !downloadUrl.startsWith("https://")) return;

                String updateUrl = downloadUrl;
                runOnUiThread(() -> showUpdateDialog(latestVersion, updateUrl));
            } catch (Exception error) {
                Log.w("ZenDriftCruise", "Could not check for Android updates", error);
            } finally {
                if (connection != null) connection.disconnect();
            }
        }, "zdc-update-check");
        updateCheck.setDaemon(true);
        updateCheck.start();
    }

    private boolean isNewerVersion(String latest, String current) {
        String[] latestParts = latest.split("\\.");
        String[] currentParts = current.split("\\.");
        try {
            for (int index = 0; index < Math.max(latestParts.length, currentParts.length); index++) {
                int latestPart = index < latestParts.length ? Integer.parseInt(latestParts[index]) : 0;
                int currentPart = index < currentParts.length ? Integer.parseInt(currentParts[index]) : 0;
                if (latestPart > currentPart) return true;
                if (latestPart < currentPart) return false;
            }
        } catch (NumberFormatException ignored) {
            return false;
        }
        return false;
    }

    private void showUpdateDialog(String latestVersion, String downloadUrl) {
        if (isFinishing() || isDestroyed()) return;
        new AlertDialog.Builder(this)
            .setTitle("Actualización disponible")
            .setMessage("Zen Drift Cruise " + latestVersion + " ya está disponible. ¿Quieres descargarla?")
            .setPositiveButton("Descargar", (dialog, which) -> {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl));
                startActivity(intent);
            })
            .setNegativeButton("Más tarde", null)
            .show();
    }

    @Override
    public void onBackPressed() {
        if (gameView != null && gameView.canGoBack()) gameView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (gameView != null) gameView.destroy();
        super.onDestroy();
    }
}
