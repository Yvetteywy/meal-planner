import { getRequestConfig } from "next-intl/server";

// Static export version: defaults to "en" (locale switching handled client-side)
export default getRequestConfig(async () => {
  return {
    locale: "en",
    messages: (await import("./messages/en.json")).default,
  };
});
