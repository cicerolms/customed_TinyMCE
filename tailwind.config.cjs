const sharedPreset = require("./tailwind.preset.cjs");

module.exports = {
  content: [
    "./src/**/*.{ts,js}",
    "./test_tinymce/src/**/*.{js,ts}",
    "./README.md",
    "./examples/**/*.json",
  ],
  presets: [sharedPreset],
};
