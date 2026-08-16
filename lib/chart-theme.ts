/**
 * Shared Recharts theming for the dark design system.
 * Keeps axis/grid/tooltip styling in one place so charts stay consistent
 * with the CSS tokens in app/globals.css.
 */

export const chartColors = {
  lime: "#c8ff3d",
  cyan: "#22d3ee",
  purple: "#a78bfa",
  orange: "#ff9a4d",
  red: "#f87171",
  grid: "#222c39",
  axis: "#5d6b7d",
  axisStrong: "#8494a6",
  surface: "#141a23",
  track: "#212a37",
} as const;

export const chartTooltip = {
  background: chartColors.surface,
  border: `1px solid #2e3a4a`,
  borderRadius: 12,
  color: "#f2f5f8",
  fontSize: 13,
  boxShadow: "0 16px 40px rgba(0,0,0,.5)",
} as const;

export const gridProps = {
  vertical: false,
  stroke: chartColors.grid,
  strokeDasharray: "4 5",
} as const;

export const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: chartColors.axis, fontSize: 12 },
} as const;
