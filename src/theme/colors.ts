export const colors = {
  // Primaires YELY
  primary: "#0F9D58",
  primaryDark: "#0A7A44",
  primaryDeep: "#0A3D2B",       // Nouveau : fond header sombre
  primaryLight: "#E8F5EE",
  primaryMid: "#1AB869",        // Nouveau : accent lumineux

  // Surfaces
  background: "#F4F6F5",        // Légèrement plus contrasté
  surface: "#FFFFFF",
  surfaceSecondary: "#F0F4F2",
  surfaceElevated: "#FFFFFF",   // Cards avec ombre

  // Texte
  text: "#1A2620",              // Plus sombre pour meilleure lisibilité
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
  success: "#0F9D58",
  successSoft: "#E8F5EE",
  info: "#0288D1",
  infoSoft: "#E1F5FE",

  // Bordures
  border: "rgba(0,0,0,0.07)",
  borderStrong: "rgba(0,0,0,0.14)",

  // Aliases legacy (rétrocompatibilité)
  green: "#0F9D58",
  greenDark: "#0A7A44",
  greenSoft: "#E8F5EE",
  ink: "#1A2620",
  line: "rgba(0,0,0,0.07)",
  dangerSoftAlias: "#FDECEC",
  warningSoftAlias: "#FFF3E0",
  white: "#FFFFFF",
} as const;
