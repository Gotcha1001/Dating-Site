// lib/appearance.ts
//
// Single source of truth for the Settings page: accent colors + rain options.
// Imported by the client (context, CyberRain, settings page) AND by Convex
// (convex/users.ts) so both sides validate against the same lists.
//
// Accent colors are applied by writing data-accent="<id>" on <html>; the CSS
// in globals.css maps that to --accent-300 .. --accent-700 variables.

/* ---------------------------------- accents --------------------------------- */

export const ACCENT_IDS = [
  "pink",
  "cyan",
  "violet",
  "lime",
  "amber",
  "blue",
] as const;

export type AccentId = (typeof ACCENT_IDS)[number];

export interface AccentShades {
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
}

export interface AccentTheme {
  id: AccentId;
  label: string;
  hex400: string;
  shades: AccentShades;
}

export const ACCENT_THEMES: Record<AccentId, AccentTheme> = {
  pink: {
    id: "pink",
    label: "Neon pink",
    hex400: "#f472b6",
    shades: {
      300: "#f9a8d4",
      400: "#f472b6",
      500: "#ec4899",
      600: "#db2777",
      700: "#be185d",
    },
  },
  cyan: {
    id: "cyan",
    label: "Cyber cyan",
    hex400: "#22d3ee",
    shades: {
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
    },
  },
  violet: {
    id: "violet",
    label: "Ultraviolet",
    hex400: "#a78bfa",
    shades: {
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
    },
  },
  lime: {
    id: "lime",
    label: "Acid lime",
    hex400: "#a3e635",
    shades: {
      300: "#bef264",
      400: "#a3e635",
      500: "#84cc16",
      600: "#65a30d",
      700: "#4d7c0f",
    },
  },
  amber: {
    id: "amber",
    label: "Sodium amber",
    hex400: "#fbbf24",
    shades: {
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
    },
  },
  blue: {
    id: "blue",
    label: "Electric blue",
    hex400: "#60a5fa",
    shades: {
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
  },
};

export const ACCENT_LIST: AccentTheme[] = ACCENT_IDS.map(
  (id) => ACCENT_THEMES[id],
);

export function isAccentId(value: unknown): value is AccentId {
  return (
    typeof value === "string" &&
    (ACCENT_IDS as readonly string[]).includes(value)
  );
}

/* ----------------------------------- rain ----------------------------------- */

export const RAIN_MODES = ["code", "hearts", "neon", "off"] as const;

export type RainMode = (typeof RAIN_MODES)[number];

export interface RainModeInfo {
  id: RainMode;
  label: string;
  description: string;
}

export const RAIN_MODE_LIST: RainModeInfo[] = [
  {
    id: "code",
    label: "Code rain",
    description: "Falling glyphs and hearts, matrix style.",
  },
  {
    id: "hearts",
    label: "Hearts",
    description: "Slow hearts drifting down the screen.",
  },
  {
    id: "neon",
    label: "Neon streaks",
    description: "Fast, slanted city rain.",
  },
  {
    id: "off",
    label: "Off",
    description: "No animation.",
  },
];

export function isRainMode(value: unknown): value is RainMode {
  return (
    typeof value === "string" &&
    (RAIN_MODES as readonly string[]).includes(value)
  );
}

/* --------------------------------- appearance -------------------------------- */

export interface Appearance {
  accent: AccentId;
  rainMode: RainMode;
  /** 1–100. How many drops are on screen. */
  rainDensity: number;
  /** 1–100. How fast drops fall. */
  rainSpeed: number;
  /** 10–100. Overall brightness of the rain layer. */
  rainOpacity: number;
  /** Soft neon glow on drops. Costs GPU, so it can be turned off. */
  glow: boolean;
}

export const DEFAULT_APPEARANCE: Appearance = {
  accent: "pink",
  rainMode: "code",
  rainDensity: 40,
  rainSpeed: 45,
  rainOpacity: 40,
  glow: true,
};

export const RANGE_LIMITS = {
  rainDensity: { min: 1, max: 100 },
  rainSpeed: { min: 1, max: 100 },
  rainOpacity: { min: 10, max: 100 },
} as const;

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Turns anything (localStorage JSON, a Convex row, a partial update) into a
 * fully valid Appearance. Unknown or out-of-range fields fall back to defaults,
 * so old saved data never breaks the UI when options change.
 */
export function normalizeAppearance(raw: unknown): Appearance {
  if (typeof raw !== "object" || raw === null) return DEFAULT_APPEARANCE;
  const r = raw as Record<string, unknown>;
  return {
    accent: isAccentId(r.accent) ? r.accent : DEFAULT_APPEARANCE.accent,
    rainMode: isRainMode(r.rainMode) ? r.rainMode : DEFAULT_APPEARANCE.rainMode,
    rainDensity: clampNumber(
      r.rainDensity,
      RANGE_LIMITS.rainDensity.min,
      RANGE_LIMITS.rainDensity.max,
      DEFAULT_APPEARANCE.rainDensity,
    ),
    rainSpeed: clampNumber(
      r.rainSpeed,
      RANGE_LIMITS.rainSpeed.min,
      RANGE_LIMITS.rainSpeed.max,
      DEFAULT_APPEARANCE.rainSpeed,
    ),
    rainOpacity: clampNumber(
      r.rainOpacity,
      RANGE_LIMITS.rainOpacity.min,
      RANGE_LIMITS.rainOpacity.max,
      DEFAULT_APPEARANCE.rainOpacity,
    ),
    glow: typeof r.glow === "boolean" ? r.glow : DEFAULT_APPEARANCE.glow,
  };
}

/** Append an alpha channel (0–1) to a #rrggbb color: alpha("#f472b6", 0.4) */
export function alpha(hex: string, a: number): string {
  const v = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${v}`;
}
