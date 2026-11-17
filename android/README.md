# Zen Drift Cruise for Android

This Android Studio project wraps the bundled game in a full-screen Android app. The APK served by the website is built from `app/src/main/assets/index.html`.

To update the game in the Android app, copy the latest `game/index.html` into that assets folder, increase `versionCode` in `app/build.gradle`, build a release APK, and sign it with the existing release key.

Keep `zen-drift-release.jks` and `signing.local.env` backed up privately. They are ignored by Git; future APK updates must use this same signing key to install over the existing app.
