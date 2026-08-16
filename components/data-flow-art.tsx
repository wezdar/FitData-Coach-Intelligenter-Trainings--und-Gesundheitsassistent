"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";

/**
 * Animated data-flow artwork for the dashboard hero.
 *
 * Pure inline SVG + SMIL/CSS animation: ~4 KB, theme-aware through CSS custom
 * properties, and crisp at any size — the same visual result a short looping
 * video would give without the megabytes or the decode cost.
 *
 * Motion is suppressed entirely under `prefers-reduced-motion`, leaving a
 * static composition rather than a frozen first frame.
 */
export function DataFlowArt() {
  const { tp } = useLocale();
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  // Three lanes carrying packets left → right, mirroring raw → serving.
  const lanes = [
    { d: "M0,54 C90,54 120,26 210,26 S330,26 420,26", tone: "var(--cyan)", dur: 3.6, delay: 0 },
    { d: "M0,78 C90,78 120,78 210,78 S330,78 420,78", tone: "var(--lime)", dur: 3.1, delay: 0.7 },
    { d: "M0,102 C90,102 120,130 210,130 S330,130 420,130", tone: "var(--purple)", dur: 4.1, delay: 1.4 },
  ];
  const nodes = [
    { cx: 0, cy: 78, r: 7, tone: "var(--cyan)" },
    { cx: 210, cy: 26, r: 5.5, tone: "var(--cyan)" },
    { cx: 210, cy: 78, r: 6.5, tone: "var(--lime)" },
    { cx: 210, cy: 130, r: 5.5, tone: "var(--purple)" },
    { cx: 420, cy: 26, r: 5, tone: "var(--lime)" },
    { cx: 420, cy: 78, r: 8, tone: "var(--lime)" },
    { cx: 420, cy: 130, r: 5, tone: "var(--lime)" },
  ];

  return (
    <svg
      className="dataflow-art"
      viewBox="0 0 420 156"
      fill="none"
      role="img"
      aria-label={tp("lin.subtitle")}
    >
      <defs>
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.05" />
          <stop offset="55%" stopColor="var(--lime)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--lime)" stopOpacity="0.05" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {lanes.map((lane, index) => (
        <g key={index}>
          <path d={lane.d} stroke={`url(#${uid}-fade)`} strokeWidth="1.4" />
          {!reduceMotion && (
            <circle r="3.2" fill={lane.tone} filter={`url(#${uid}-glow)`}>
              <animateMotion dur={`${lane.dur}s`} begin={`${lane.delay}s`} repeatCount="indefinite" path={lane.d} />
              <animate attributeName="opacity" values="0;1;1;0" dur={`${lane.dur}s`} begin={`${lane.delay}s`} repeatCount="indefinite" />
            </circle>
          )}
        </g>
      ))}

      {nodes.map((node, index) => (
        <g key={index}>
          <circle cx={node.cx} cy={node.cy} r={node.r} fill="var(--surface)" stroke={node.tone} strokeWidth="1.6" />
          <circle cx={node.cx} cy={node.cy} r={node.r * 0.42} fill={node.tone}>
            {!reduceMotion && (
              <animate
                attributeName="opacity"
                values="0.45;1;0.45"
                dur="2.6s"
                begin={`${index * 0.28}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>
      ))}
    </svg>
  );
}
