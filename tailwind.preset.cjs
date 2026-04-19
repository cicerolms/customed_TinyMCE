module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "\"Noto Sans JP\"", "\"Segoe UI\"", "Arial", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f8fbff",
          100: "#eff4ff",
          500: "#15305e",
          700: "#0f172a",
        },
        accent: {
          orange: "#df3e0d",
          orangeSoft: "#fef6f0",
          orangeLine: "#ffc87c",
          orangeLineStrong: "#e66a2d",
          yellowMarker: "#ffffbc",
          green: "#105469",
        },
      },
      boxShadow: {
        "cms-card": "0 20px 50px rgba(15, 23, 42, 0.08)",
      },
      maxWidth: {
        prose: "1000px",
        shell: "1320px",
      },
    },
  },
};
