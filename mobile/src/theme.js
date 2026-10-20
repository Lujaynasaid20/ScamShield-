// ScamShield design tokens, matching the website: navy and blue, with green/amber/red only for security status.
export const colors = {
  navy950: "#071022",
  navy900: "#0b1730",
  navy800: "#13244a",
  blue700: "#1d4ed8",
  blue600: "#2563eb",
  blue100: "#dbe7ff",
  blue50: "#eef4ff",
  bg: "#f3f6fb",
  surface: "#ffffff",
  surface2: "#f8fafd",
  ink: "#0f1b33",
  ink2: "#33415c",
  muted: "#5d6b85",
  line: "#e2e8f2",
  lineStrong: "#cdd6e4",
  safeText: "#0d6b38",
  safeBg: "#e7f6ed",
  warnText: "#8a5300",
  warnBg: "#fff4dc",
  dangerText: "#b42318",
  dangerBg: "#fdecea",
  infoText: "#1d4ed8",
  infoBg: "#eef4ff",
  neutralText: "#33415c",
  neutralBg: "#eef1f6",
  highlight: "#ffe8a3"
};

export const tones = {
  safe: { fg: colors.safeText, bg: colors.safeBg },
  warn: { fg: colors.warnText, bg: colors.warnBg },
  danger: { fg: colors.dangerText, bg: colors.dangerBg },
  info: { fg: colors.infoText, bg: colors.infoBg },
  neutral: { fg: colors.neutralText, bg: colors.neutralBg }
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 10, md: 14, pill: 999 };
