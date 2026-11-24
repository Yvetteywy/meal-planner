# Android Build Guide

## Status

The Capacitor Android project is checked in under `android/` (application ID `com.mealplanner.app`). It builds an installable Android app with a native shell that runs the bundled React UI in Android WebView; the screens are not written in Kotlin or Jetpack Compose. You do not need to run `cap add android`. This is separate from installing the web PWA in Chrome. The checked-in project is not proof of a working APK or a Play Store release.

**Verified 2026-11-20:** `npm ci` and `npm run build:android` completed in a disposable checkout. The synced output contained only placeholder detail, edit, and cook pages. APK assembly could not proceed on the audit Mac because no Java runtime or Android SDK was available there.

## Prerequisites

- Node.js 22.12 or newer on the Node 22 LTS line, or a newer supported LTS line, and its bundled npm.
- JDK 21 for Gradle. Set `JAVA_HOME` for terminal builds or select a compatible Gradle JDK in Android Studio.
- Android SDK Platform 36 and Platform-Tools. Install them through a current Android Studio SDK Manager or the SDK command-line tools. Set `ANDROID_HOME` or let Android Studio create the ignored `android/local.properties` with `sdk.dir`.
- The repo supplies Gradle through `android/gradlew`. The project targets API 36 and supports devices starting at API 24.

## Build a debug APK

Run from the repository root in a clean checkout, or use a disposable checkout while the export script still swaps tracked files:

```bash
npm ci
npm run build:android
(cd android && ./gradlew :app:assembleDebug)
```

`build:android` exports the web app to `out/` and runs `cap sync android`. Sync copies assets to `android/app/src/main/assets/public/` and regenerates integration files. It does **not** assemble an APK. Gradle writes the debug-signed APK to `android/app/build/outputs/apk/debug/app-debug.apk`.

For a physical phone, enable **USB debugging** under **Developer options**, connect and unlock the phone, and approve the USB debugging prompt. Confirm it appears as `device` in `adb devices`.

Install on a connected device or running emulator with `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`, or run `npm run open:android` from the root after sync and use **Run** in Android Studio. Re-run the export/sync after changing the web app.

For distribution, configure release signing separately and generate a signed APK or App Bundle in Android Studio. Keep the keystore and credentials out of Git. The `apksigner` setting in `capacitor.config.ts` selects a signing tool; it does not configure a signing identity.

## Known issues and next fixes

- [ ] **Recipe navigation in the packaged app.** The static export generates only placeholder pages for dynamic recipe detail, edit, and cook URLs. Use fixed exported routes with a recipe ID query parameter in Android, preserve the existing hosted URLs, and carry `servings`, `mealId`, and `newVersion` through navigation.
- [ ] **Build isolation.** `scripts/build-android.js` temporarily replaces `next.config.js` and `src/i18n.ts` and deletes the shared `.next` cache. Its error path exits before cleanup can restore the originals. Do not run it alongside the web build. If the script fails, inspect `git diff` and any `.android-bak` files before further builds; do not discard local edits. Move to an isolated build and exclude previously generated PWA service-worker files from the packaged output.
- [ ] **Android instrumentation.** Update the stock package assertion to expect `com.mealplanner.app`, then run the test on an emulator or device.

## Smoke test before calling Android ready

- [ ] Assemble and install a debug APK from a clean checkout. Launch in airplane mode.
- [ ] Open a seeded recipe, create a new recipe, and verify detail, edit, versioning, and cook for both. Start cooking from the meal plan and verify the serving count and meal association.
- [ ] Check back navigation, nested-page reload, and changing language on a nested page.
- [ ] Verify pantry and shopping changes, then force-quit and relaunch to confirm persistence.
- [ ] Verify the production web/PWA build still works and Android failures do not modify tracked web config files.

The existing Playwright suite runs against the web dev server; it does not replace these packaged-app checks.

## Future: evaluate native Android (Kotlin and Jetpack Compose)

See the [Android app implementation plan](android-implementation-plan.md#stage-2-evaluate-native-android-kotlin-and-jetpack-compose) for the decision criteria and migration checklist.
