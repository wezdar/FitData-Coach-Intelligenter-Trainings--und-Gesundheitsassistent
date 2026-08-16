"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";

export type MetricExplanation = {
  title: string;
  value: string;
  formula: string;
  unit: string;
  inputs: { label: string; value: string }[];
  assumptions: string;
  limitations: string;
  lineage: string[];
  sources?: { label: string; value: string }[];
};

/**
 * "Why this value?" explanation drawer.
 *
 * Every KPI on the dashboard is derived, so each one can show its formula,
 * the concrete inputs it was computed from, and the fields it came from.
 */
export function MetricDrawer({ metric, onClose }: { metric: MetricExplanation; onClose: () => void }) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="metric-drawer-backdrop"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.aside
        className="metric-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${t("metric.why")} ${metric.title}`}
        initial={reduceMotion ? false : { x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={reduceMotion ? undefined : { x: 40, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="metric-drawer-head">
          <div>
            <Badge tone="purple">{t("metric.why")}</Badge>
            <h3>{metric.title}</h3>
            <p className="metric-drawer-value">{metric.value}</p>
          </div>
          <button ref={closeRef} className="icon-button" onClick={onClose} aria-label={t("common.close")}>
            <X size={17} />
          </button>
        </div>

        <section className="metric-drawer-section">
          <h4>{t("metric.formula")}</h4>
          <code className="metric-formula">{metric.formula}</code>
          <p className="metric-unit">{t("metric.unit")}: {metric.unit}</p>
        </section>

        <section className="metric-drawer-section">
          <h4>{t("metric.inputs")}</h4>
          <dl className="metric-inputs">
            {metric.inputs.map((item) => (
              <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
            ))}
          </dl>
        </section>

        {metric.sources && metric.sources.length > 0 && (
          <section className="metric-drawer-section">
            <h4>{t("metric.sources")}</h4>
            <dl className="metric-inputs">
              {metric.sources.map((item) => (
                <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
              ))}
            </dl>
          </section>
        )}

        <section className="metric-drawer-section">
          <h4>{t("metric.assumptions")}</h4>
          <p>{metric.assumptions}</p>
        </section>

        <section className="metric-drawer-section">
          <h4>{t("metric.limitations")}</h4>
          <p>{metric.limitations}</p>
        </section>

        <section className="metric-drawer-section">
          <h4>{t("metric.lineage")}</h4>
          <div className="metric-lineage">{metric.lineage.map((field) => <code key={field}>{field}</code>)}</div>
        </section>
      </motion.aside>
    </motion.div>
  );
}
