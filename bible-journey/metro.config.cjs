const { getDefaultConfig } = require("expo/metro-config");
require("./scripts/build-content.cjs").generate(__dirname);
module.exports = getDefaultConfig(__dirname);
