# Android App Implementation Plan

**Status:** The Capacitor project is checked in under `android/`. Web export and Capacitor sync have been verified; APK assembly and on-device workflows have not. A native Kotlin/Jetpack Compose UI is a future option, not a committed rewrite.

Use the [Android build guide](android-build.md) for SDK setup, build commands, known issues, and smoke-test steps. This plan tracks milestones and decisions. The [product plan](implementation-plan.md) and [iOS plan](ios-implementation-plan.md) are separate.

## Stage 1: Stabilize and release the Capacitor app

Capacitor packages the existing React UI in Android WebView. Keep the hosted web URLs, web/PWA build, and iOS build path unchanged when fixing Android-specific behavior.

- [ ] **Fix recipe navigation:** Use fixed exported pages for detail, edit, and cook, with recipe IDs and existing parameters in the query string. Verify seeded and newly created recipes, reloads, and back navigation in the packaged app.
- [ ] **Isolate the Android build:** Stop replacing tracked web config files or deleting the shared web build cache. Sync only a fresh, successful export and exclude generated PWA artifacts. Verify a forced export failure leaves the checkout unchanged and skips sync.
- [ ] **Verify an APK:** Fix the instrumentation test's package assertion, assemble a debug APK from a clean checkout, and pass the [Android smoke tests](android-build.md#smoke-test-before-calling-android-ready) on an emulator or device. Run the web regression checks as well.
- [ ] **Prepare release distribution:** Confirm signing, versioning, and Play Console requirements. Test a signed build and verify that an update preserves local data before broader distribution.

## Stage 2: Evaluate native Android (Kotlin and Jetpack Compose)

Start the evaluation after the packaged app passes smoke tests. Native development is not required to release the Capacitor app.

- [ ] **Decide whether to proceed:** Identify specific Android UX, performance, or device-integration needs. Compare a native UI with improving the packaged app or adding a Capacitor plugin for isolated capabilities.
- [ ] **If approved, define scope:** Prototype a core offline workflow and define what recipe, meal plan, cooking, pantry, and shopping-list behavior must be retained for the first native release. Specify what backup formats and API contracts remain shared with the web app.
- [ ] **Plan the transition:** Decide whether to ship as an update under the same application ID and signing identity or as a separate app. Design and device-test migration from WebView data rather than assuming it transfers automatically; keep compatible JSON backup/import as a fallback.