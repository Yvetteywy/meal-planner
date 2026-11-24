const withNextIntl = require("next-intl/plugin")("./src/i18n.static.ts");

module.exports = withNextIntl({
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
});