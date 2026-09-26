// ─── Design tokens for Dhaka Tesla Pool ───
// Deep charcoal base with an electric teal accent - a "premium EV app"
// feel rather than a generic admin-panel look.
export const COLORS = {
  bg: "#0B0F0E",
  surface: "#151B1A",
  surfaceMuted: "#1D2523",
  border: "#2A332F",
  ink: "#F3F7F5",
  inkMuted: "#8FA39B",
  primary: "#14E8B4",
  primaryDark: "#0FB88E",
  accent: "#F2A93B",
  danger: "#F2545B",
  success: "#14E8B4",
};

export const fontDisplay = { fontFamily: "var(--font-display)" };

export const STATUS_STYLES = {
  REQUESTED: { label: "Requested", bg: "#2A2417", color: "#F2A93B" },
  MATCHED: { label: "Matched", bg: "#132B26", color: "#14E8B4" },
  DRIVER_ARRIVED: { label: "Driver Arrived", bg: "#132B26", color: "#14E8B4" },
  STARTED: { label: "In Progress", bg: "#132436", color: "#4FA3F7" },
  COMPLETED: { label: "Completed", bg: "#16231C", color: "#8FA39B" },
  CANCELLED: { label: "Cancelled", bg: "#2B1618", color: "#F2545B" },
};
