# iOS App Implementation Plan

**Status (2026-11-23):** The Capacitor iOS project, isolated export, and fixed recipe routes are implemented. An unsigned build compiled and launched on the iPhone 18 Pro Simulator (iOS 27.2), and the main recipe and meal-plan workflows passed in its WebView. A signed build was installed directly on an iPhone SE (iOS 26.7.3), and the app process was later confirmed running. Physical-device workflows and release checks are still pending. Safari PWA installation is separate.

## Stage 1: Interim iOS release (Capacitor)

Package the existing Meal Planner with Capacitor. Bundle the web assets locally so recipes, cooking, meal planning, pantry, and shopping lists work offline. Reuse the current screens, translations, and data model. This stage does not include Android or a backend migration. SwiftUI remains the long-term direction.

## Build and run locally

Use Node.js 22.12+ on the Node 22 LTS line and a compatible Xcode with an iOS Simulator runtime. The generated project targets iOS 15+; Simulator verification so far uses iOS 27.2. Swift Package Manager downloads the pinned Capacitor dependencies on first build. No Apple signing team is needed for Simulator.

```bash
npm ci
npm run build:ios
npm run open:ios
```

In Xcode, choose the **App** scheme and an iPhone simulator, then press **⌘R**. Xcode 27 opens the simulator in **Device Hub**; reopen it from **Xcode → Open Developer Tool → Device Hub**. `build:ios` exports and syncs assets, but does not compile the native app. Re-run it after web changes; the native project is already present, so do not run `cap add ios` again.

## Install on a physical iPhone

1. In Terminal on your Mac, run the [build commands above](#build-and-run-locally) from the repository root. Skip `npm ci` if dependencies are already installed and unchanged.
2. Connect and unlock the iPhone. Trust the Mac if prompted. If Developer Mode is off, turn it on under **Settings → Privacy & Security → Developer Mode**, restart, and confirm after unlocking.
3. In Xcode, add your Apple Account under **Xcode → Settings → Accounts**. Select the **App** target → **Signing & Capabilities**, enable **Automatically manage signing**, and choose your team. A Personal Team works for local testing. If the shared bundle ID is unavailable, choose a unique development bundle ID. Keep personal signing changes out of Git.
4. Select the **App** scheme and choose your connected iPhone under **Product → Destination**. Click **Run** or press **⌘R on the Mac**. No `.ipa` export is needed.

If signing says the team has no devices, confirm Developer Mode is on, select the physical iPhone (not **Any iOS Device** or a simulator), wait for Xcode to prepare it, and retry signing. **Build Succeeded** does not confirm installation or launch. If the app is missing, check Xcode’s **Report navigator (⌘9)**. As a fallback, `xcrun devicectl device install app --device '<iPhone name>' '<absolute path to signed App.app>'` installs an already-signed device build but does not bypass developer trust.

If the phone reports an untrusted developer, open **Settings → General → VPN & Device Management**, select your identity under **Developer App**, and follow the trust prompts. Restart if requested, then open **Meal Planner** on the phone.

**Update a test build:** After web changes, rerun `npm run build:ios`, then click **Run** in Xcode. For native-only changes, just click **Run**. Use the same bundle ID and leave the app installed to preserve local data. Safari/PWA data does not transfer automatically.

## Keep the targets separate

| Area | Plan |
|---|---|
| Capacitor iOS project | Keep the Xcode project, icons, permissions, and native integrations under `ios/`. Track source and project settings; ignore generated web copies and Xcode user/build output. Do not commit signing credentials. |
| iOS build | Add `build:ios` and `open:ios` commands. Export in a temporary workspace using an iOS-specific Next.js config and `src/i18n.static.ts`, without swapping tracked files. Publish successful exports to an ignored `.ios-web/` directory. Only point Capacitor there when using the iOS build configuration, and sync only iOS. |
| Shared app | Reuse existing screens and storage. Use small target-specific adapters for routes or device capabilities instead of duplicating screens. Default to existing behavior outside iOS. |
| Web and Android | Keep web URLs, build commands, and PWA behavior unchanged. Keep the existing Android config, commands, and `out/` directory separate. Do not generate or build Android as part of this plan. |

## Milestones

### 1. Bootstrap the iOS target

- [x] Verified Capacitor 8.3.0 with Xcode 27.2 and confirmed the project deployment target (iOS 15). The current bundle ID is `com.mealplanner.app`.
- [ ] Confirm bundle ID ownership and the signing team before TestFlight or App Store distribution.
- [x] Add `@capacitor/ios` at the version compatible with the existing Capacitor packages, update the lockfile, and generate the Xcode project under `ios/`.
- [x] Add the isolated export and sync workflow. Exclude `.env` files and generated PWA service worker artifacts from staging and the bundle. Leave `server.url` unset so the app launches local assets. Do not put secrets in public build-time environment variables.
- [x] Verified `npm ci` and `build:ios` in a disposable clean copy. A forced compile failure skipped sync and left the prior bundle intact. Both runs preserved the web config/cache and Android project and output. A previous web build’s generated PWA workers did not enter the iOS bundle.

### 2. Make shared features work from the bundled export

- [x] Add fixed exported pages for recipe detail, edit, and cook. Pass the recipe ID as a query parameter on iOS; static export cannot generate paths for recipes created after installation. Keep the hosted web URLs unchanged. Do not change Android as part of this milestone; its [existing static-route issue](android-build.md#known-issues-and-next-fixes) is tracked separately.
- [x] Route iOS recipe links and redirects through the target-aware adapter. Preserve `servings`, `mealId`, and `newVersion`; use the native asset router to serve exported pages on hard navigation.
- [x] Verify meal-plan links, post-save redirects, back navigation, and a hard reload of a nested recipe in the packaged WebView.
- [ ] Verify links from history and reminders with representative data.
- [x] Hide the unwired URL-import action on iOS.
- [x] Switch between English and Simplified Chinese on a nested recipe page, with a WebView reload on each switch.

### 3. Verify on Simulator and iPhone

- [x] Compile, install, and launch the unsigned iOS bundle on an iPhone 18 Pro Simulator. The generated Capacitor template crashed on iOS 27 without UIKit scene adoption; the iOS shell now uses `UIWindowScene`.
- [x] Test the exported bundle in the Simulator WebView, with no live-reload server. Create, open, edit, version, and cook a recipe. Cook from a planned meal with a different serving count, verify pantry deduction and shopping-list generation, and confirm data survives a process restart.
- [x] Build with local development signing and install directly on an iPhone SE. The first launch returned a security error; the app process was later confirmed running. This does not verify installation via Xcode Run or the on-device UI.
- [ ] Verify startup in Airplane Mode. On the iPhone, create and edit a recipe, cook from the meal plan, verify pantry deduction and shopping lists, and force-quit and relaunch to check persistence.
- [ ] On an iPhone, verify JSON backup export and import through Files, safe areas, keyboard behavior, and cooking timer behavior when backgrounded. Add an iOS-only file/share adapter if needed; keep the backup format compatible with the web app. Verify that import replaces the collections present in the file rather than merging them. Safari/PWA data does not transfer automatically.
- [x] Run the existing web checks and production build: 131 unit tests and 16 browser tests passed on Node 22. Confirmed the production server serves the hosted-style recipe URL and the PWA service worker. Verified the iOS export leaves Android files unchanged; Android device testing is out of scope.

### 4. Prepare a TestFlight build

- [ ] Finalize app icon, display name, version and build numbers, signing, required privacy declarations, and App Store Connect setup.
- [ ] Archive and upload a signed build. Verify clean install, offline startup, and data persistence across an update on a physical iPhone before inviting testers.
- [ ] Document the verified build and release steps, supported iOS versions, and known limitations.

## Stage 2: Native iOS app (SwiftUI)

Rebuild the iOS interface in SwiftUI for an iPhone-first experience. Keep the web app and Android path independent. The interim release does not depend on this stage.

- [ ] Define the first SwiftUI release and which core offline workflows it must support before replacing the interim app.
- [ ] Decide which data formats, API contracts, and server-side rules to share with the web app, and which client-side logic SwiftUI must implement separately.
- [ ] Before publishing the interim app to the App Store, decide whether SwiftUI will ship as an update under the same bundle ID and App Store record or as a separate app.
- [ ] Plan to preserve recipes, meal plans, pantry data, shopping lists, and settings. Do not assume SwiftUI storage can automatically read Capacitor WebView data. Keep JSON backup/import available as a fallback and test the chosen migration on a physical iPhone before rollout.

## Known issues and verification follow-ups

- [ ] Verify safe-area insets, orientation, and keyboard on physical iPhones. The iOS WebView now applies UIKit content insets; Simulator keyboard automation could not reliably focus off-screen fields, so the workflow checks drove the WebView directly.
- [ ] Add a checked-in, repeatable Simulator smoke test. The initial workflow checks used temporary diagnostics; no diagnostic code is included in the app.
- [ ] Move shared theme/viewport settings to Next.js’s separate `viewport` export and regression-test this separately. The current build emits metadata warnings.
- [ ] Use real cooked/skipped meals in meal history before evaluating realistic history-to-recipe navigation; the current shared history page uses mock data.
- [ ] Make tests compatible with newer Node versions. On this Mac, Node 26 had `localStorage` failures in jsdom; the existing suite passed on Node 22. Use Node 22 for local verification for now.
- [ ] Confirm the actual minimum supported iOS version before release. The Xcode target declares iOS 15, but the Simulator run used iOS 27.2; in particular, verify `crypto.randomUUID()` on early iOS 15 versions or provide a fallback.
- [ ] Decide whether to bundle a licensed local font for repeatable builds; the existing Google font import may need network access at build time (not at runtime).
- [ ] Remove or revise AI-recommendation copy on the packaged home screen before release; the UI still advertises an integration that is not implemented.

## Backlog across releases

- [ ] Evaluate native reminders and timers. Existing reminders are in-app only; background scheduling and permission handling need separate design and device testing.
- [ ] Evaluate more durable on-device storage if usage warrants it. Plan migration and backup compatibility before changing the storage layer.
- [ ] Revisit recipe URL import, AI suggestions, and account sync after their backend requirements are defined. Use an explicit HTTPS API for the packaged app, keep provider keys server-side, and design for offline failures.
