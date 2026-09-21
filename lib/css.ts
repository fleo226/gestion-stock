// CSS variables as string constants for inline styles
// These match the :root and .dark variables in globals.css

export const cssVars = {
  // Light mode
  light: {
    background: "#ffffff",
    foreground: "#111827",
    primary: "#2563eb",
    "primary-hover": "#1d4ed8",
    card: "#ffffff",
    "card-border": "#e5e7eb",
    muted: "#f3f4f6",
    "muted-foreground": "#6b7280",
    border: "#e5e7eb",
    input: "#e5e7eb",
    ring: "#2563eb",
    destructive: "#ef4444",
    "destructive-foreground": "#ffffff",
  },
  // Dark mode
  dark: {
    background: "#0f172a",
    foreground: "#f1f5f9",
    primary: "#3b82f6",
    "primary-hover": "#2563eb",
    card: "#1e293b",
    "card-border": "#334155",
    muted: "#1e293b",
    "muted-foreground": "#94a3b8",
    border: "#334155",
    input: "#334155",
    ring: "#3b82f6",
    destructive: "#ef4444",
    "destructive-foreground": "#ffffff",
  },
};

// Helper to get CSS variable value
export function getCssVar(name: keyof typeof cssVars.light, isDark = false): string {
  return isDark ? cssVars.dark[name] : cssVars.light[name];
}

// Export individual vars for inline style usage
export const {
  background,
  foreground,
  primary,
  "primary-hover": primaryHover,
  card,
  "card-border": cardBorder,
  muted,
  "muted-foreground": mutedForeground,
  border,
  input,
  ring,
  destructive,
  "destructive-foreground": destructiveForeground,
} = cssVars.light;