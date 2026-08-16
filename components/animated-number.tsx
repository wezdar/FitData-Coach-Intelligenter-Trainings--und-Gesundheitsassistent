"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatNumber } from "@/lib/utils";

/** Page visibility as an external store — a hidden tab throttles rAF. */
const visibilityStore = {
  subscribe(onChange: () => void) {
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  },
  getSnapshot: () => !document.hidden,
  getServerSnapshot: () => true,
};

export function AnimatedNumber({
  value,
  digits = 0,
  suffix = "",
}: {
  value: number;
  digits?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();
  const visible = useSyncExternalStore(
    visibilityStore.subscribe, visibilityStore.getSnapshot, visibilityStore.getServerSnapshot,
  );

  // Only count up when the tab is actually rendering frames; otherwise the
  // exact value is rendered directly instead of a frozen intermediate one.
  const shouldAnimate = !reduceMotion && visible;

  useEffect(() => {
    if (!shouldAnimate) {
      previous.current = value;
      return undefined;
    }
    const control = animate(previous.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    previous.current = value;
    return () => control.stop();
  }, [value, shouldAnimate]);

  return <>{formatNumber(shouldAnimate ? display : value, digits)}{suffix}</>;
}
