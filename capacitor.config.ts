import type { CapacitorConfig } from "@capacitor/cli";

const isIOS = process.env.CAPACITOR_TARGET === "ios";

const config: CapacitorConfig = {
  appId: "com.mealplanner.app",
  appName: "Meal Planner",
  webDir: isIOS ? ".ios-web" : "out",
  server: {
    androidScheme: "https",
  },
  ...(isIOS ? { ios: { contentInset: "always" } } : {}),
  android: {
    buildOptions: {
      signingType: "apksigner",
    },
  },
};

export default config;
