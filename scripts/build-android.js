/**
 * Build script for Android/iOS (Capacitor)
 *
 * 1. Temporarily swaps i18n + next.config for static export
 * 2. Runs `next build` to produce static HTML in `out/`
 * 3. Syncs with Capacitor platform projects
 * 4. Restores original config files
 *
 * Usage: node scripts/build-android.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const NEXT_CONFIG = path.join(ROOT, "next.config.js");
const NEXT_CONFIG_BAK = NEXT_CONFIG + ".android-bak";
const I18N_ORIGINAL = path.join(ROOT, "src", "i18n.ts");
const I18N_STATIC = path.join(ROOT, "src", "i18n.static.ts");
const I18N_BAK = I18N_ORIGINAL + ".android-bak";

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function cleanup() {
  if (fs.existsSync(NEXT_CONFIG_BAK)) {
    fs.copyFileSync(NEXT_CONFIG_BAK, NEXT_CONFIG);
    fs.unlinkSync(NEXT_CONFIG_BAK);
  }
  if (fs.existsSync(I18N_BAK)) {
    fs.copyFileSync(I18N_BAK, I18N_ORIGINAL);
    fs.unlinkSync(I18N_BAK);
  }
  console.log("✓ Restored original config files");
}

try {
  console.log("🤖 Building Meal Planner for Android...\n");

  // Backup originals
  fs.copyFileSync(NEXT_CONFIG, NEXT_CONFIG_BAK);
  fs.copyFileSync(I18N_ORIGINAL, I18N_BAK);

  // Swap i18n to static version (no cookies() server API)
  fs.copyFileSync(I18N_STATIC, I18N_ORIGINAL);

  // Write static export config (no PWA — not needed in native app)
  const staticConfig = `const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};

module.exports = withNextIntl(nextConfig);
`;
  fs.writeFileSync(NEXT_CONFIG, staticConfig);

  // Clear Next.js cache to avoid stale module resolution
  const nextCacheDir = path.join(ROOT, ".next");
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
  }

  // Build static export
  console.log("📦 Building static export...");
  run("npx next build");

  // Sync Capacitor
  console.log("\n📱 Syncing with Capacitor Android...");
  run("npx cap sync android");

  console.log("\n✅ Android build ready!");
  console.log("   Open in Android Studio:  npx cap open android");
  console.log("   Run on device/emulator:  npx cap run android");
} catch (err) {
  console.error("\n❌ Build failed:", err.message);
  process.exit(1);
} finally {
  cleanup();
}
