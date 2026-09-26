/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        yely: {
          // Primaires
          primary: "#0F9D58",
          primaryDark: "#0A7A44",
          primaryDeep: "#0A3D2B",
          primaryLight: "#E8F5EE",
          primaryMid: "#1AB869",

          // Surfaces
          background: "#F4F6F5",
          surface: "#FFFFFF",
          surfaceSecondary: "#F0F4F2",
          surfaceElevated: "#FFFFFF",

          // Texte
          text: "#1A2620",
          textInverse: "#FFFFFF",
          muted: "#6B7F79",
          mutedLight: "#A0B0AA",

          // États
          danger: "#D32F2F",
          dangerSoft: "#FDECEC",
          dangerMid: "#FFCDD2",
          warning: "#E65100",
          warningSoft: "#FFF3E0",
          warningMid: "#FFE0B2",
          info: "#0288D1",
          infoSoft: "#E1F5FE",

          // Bordures
          border: "rgba(0,0,0,0.07)",
          borderStrong: "rgba(0,0,0,0.14)",

          // Legacy
          green: "#0F9D58",
          greenDark: "#0A7A44",
          greenSoft: "#E8F5EE",
          ink: "#1A2620",
          line: "rgba(0,0,0,0.07)",
          white: "#FFFFFF",
        }
      },
      borderRadius: {
        yely: "10px",
        "yely-lg": "16px",
        "yely-xl": "20px",
      },
      spacing: {
        touch: "52px",   // Légèrement plus grand pour terrain
      },
      fontSize: {
        headingLarge: ["32px", { lineHeight: "38px", fontWeight: "800" }],
        headingMedium: ["24px", { lineHeight: "30px", fontWeight: "700" }],
        headingSmall: ["20px", { lineHeight: "26px", fontWeight: "700" }],
        body: ["16px", { lineHeight: "24px" }],
        bodySmall: ["14px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        field: ["16px", { lineHeight: "22px" }],
        // Nouveau : taille pour le timer
        display: ["48px", { lineHeight: "56px", fontWeight: "800" }],
        displayLg: ["56px", { lineHeight: "64px", fontWeight: "800" }],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08)",
        "card-lg": "0 4px 24px rgba(0,0,0,0.12)",
        "card-xl": "0 8px 32px rgba(0,0,0,0.16)",
      }
    }
  },
  plugins: []
};
