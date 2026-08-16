"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Info, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { chartColors, chartTooltip } from "@/lib/chart-theme";
import {
  getPipelineRuns, getPipelineStatus, getQualityIncidents, runPipeline,
  type PipelineRunSummary, type PipelineStatus, type QualityIncident,
} from "@/lib/api";
import { localeMeta } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const severityIcon = { kritisch: ShieldAlert, warnung: AlertTriangle, info: Info } as const;
const severityTone = { kritisch: "red", warnung: "orange", info: "cyan" } as const;

export function DataQualityPage() {
  const { t, to, locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const [incidents, setIncidents] = useState<QualityIncident[] | null>(null);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [runs, setRuns] = useState<PipelineRunSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [incidentList, statusResult, runList] = await Promise.all([
        getQualityIncidents(), getPipelineStatus(), getPipelineRuns(),
      ]);
      setError(null);
      setIncidents(incidentList);
      setStatus(statusResult);
      setRuns(runList);
    } catch {
      setError(t("common.error"));
      setIncidents([]);
    }
  };

  // `load` only calls setState after awaiting the network, so no cascading
  // render occurs; the rule cannot see across the await boundary.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  const triggerRun = async () => {
    setBusy(true);
    try {
      await runPipeline();
      await load();
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(localeMeta[locale].intl, { dateStyle: "medium", timeStyle: "short" }),
    [locale],
  );

  const counts = useMemo(() => {
    const list = incidents ?? [];
    return {
      kritisch: list.filter((item) => item.severity === "kritisch").length,
      warnung: list.filter((item) => item.severity === "warnung").length,
      info: list.filter((item) => item.severity === "info").length,
      rows: list.reduce((sum, item) => sum + item.affected_rows, 0),
    };
  }, [incidents]);

  // Completeness per recorded run, oldest first, for the trend sparkline.
  const trend = useMemo(
    () => [...runs].reverse().map((run, index) => ({
      index: index + 1,
      completeness: run.completeness_percent,
      rejected: run.rejected_records,
    })),
    [runs],
  );

  /** Prefer the translated message for a known code; fall back to the server text. */
  const localiseIncident = (incident: QualityIncident) => {
    if (!incident.code) return incident.message;
    const template = to(`msg.${incident.code}` as never);
    return template.startsWith("msg.")
      ? incident.message
      : template.replace("{n}", String(incident.affected_rows));
  };

  const selectedIncident = incidents?.find((item) => item.id === selected) ?? null;

  return (
    <AppShell title={t("quality.title")} subtitle={t("quality.subtitle")}>
      <div className="feature-page">
        <div className="page-intro">
          <div>
            <Badge tone="cyan">{t("common.liveData")}</Badge>
            <h2>{t("quality.timeline")}</h2>
            <p>{t("quality.subtitle")}</p>
          </div>
          <div className="page-intro-actions">
            <button className="secondary-button primary" onClick={triggerRun} disabled={busy}>
              <RefreshCw size={15} className={cn(busy && "spin")} />
              {busy ? t("pipeline.running") : t("pipeline.run")}
            </button>
          </div>
        </div>

        {error && <div className="form-error"><AlertTriangle size={15} /> {error}</div>}

        <div className="dq-summary">
          <div className="metric-tile">
            <span>{t("quality.severity.kritisch")}</span>
            <strong style={{ color: "var(--red)" }}>{counts.kritisch}</strong>
            <small>{t("quality.timeline")}</small>
          </div>
          <div className="metric-tile">
            <span>{t("quality.severity.warnung")}</span>
            <strong style={{ color: "var(--orange)" }}>{counts.warnung}</strong>
            <small>{t("quality.timeline")}</small>
          </div>
          <div className="metric-tile">
            <span>{t("pipeline.completeness")}</span>
            <strong>{status ? `${status.completeness_percent}%` : "—"}</strong>
            <small>{status ? `${status.processed_records} ${t("common.rows")}` : t("common.loading")}</small>
          </div>
          <div className="metric-tile">
            <span>{t("quality.affectedRows")}</span>
            <strong>{counts.rows}</strong>
            <small>{status ? `${status.rejected_records} ${t("pipeline.rejected").toLowerCase()}` : "—"}</small>
          </div>
        </div>

        <div className="dq-layout">
          <Card>
            <SectionHeader eyebrow={t("quality.title")} title={t("quality.timeline")} />
            {incidents === null && <p className="cmdk-empty">{t("common.loading")}</p>}
            {incidents?.length === 0 && (
              <div className="lineage-empty">
                <ShieldCheck size={28} />
                <strong>{t("quality.noIncidents")}</strong>
                <p>{t("pipeline.run")}</p>
              </div>
            )}
            <div className="dq-timeline">
              {incidents?.map((incident) => {
                const Icon = severityIcon[incident.severity] ?? Info;
                return (
                  <button
                    key={incident.id}
                    className={cn("dq-item", selected === incident.id && "dq-item-selected")}
                    onClick={() => setSelected((current) => (current === incident.id ? null : incident.id))}
                    aria-expanded={selected === incident.id}
                  >
                    <span className="dq-rail"><i className={`dq-bullet dq-bullet-${incident.severity}`} /></span>
                    <span className="dq-body">
                      <strong><Icon size={14} aria-hidden="true" /> {incident.rule}</strong>
                      <p>{localiseIncident(incident)}</p>
                      <span className="dq-meta">
                        <code>{incident.dataset}</code>
                        {incident.column && <code>{incident.column}</code>}
                        <code>{incident.affected_rows} {t("common.rows")}</code>
                      </span>
                    </span>
                    <span className="dq-time">{dateFormat.format(new Date(incident.detected_at))}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <div style={{ display: "grid", gap: 14 }}>
            <Card>
              <SectionHeader eyebrow={t("pipeline.completeness")} title={t("pipeline.duration")} />
              {trend.length > 1 ? (
                <div className="dq-spark">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dqFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColors.lime} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={chartColors.lime} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="index" hide />
                      <YAxis domain={[90, 100]} tick={{ fill: chartColors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltip} formatter={(v) => [`${v}%`, t("pipeline.completeness")]} />
                      <Area type="monotone" dataKey="completeness" stroke={chartColors.lime} strokeWidth={2} fill="url(#dqFill)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="cmdk-empty">{t("common.empty")}</p>
              )}
            </Card>

            <Card className="dq-detail">
              <SectionHeader eyebrow={t("common.details")} title={t("quality.sampleRows")} />
              <AnimatePresence mode="wait">
                {selectedIncident ? (
                  <motion.div
                    key={selectedIncident.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Badge tone={severityTone[selectedIncident.severity]}>
                      {t(`quality.severity.${selectedIncident.severity}` as const)}
                    </Badge>
                    <dl className="lineage-drawer-lineage" style={{ marginTop: 12 }}>
                      <div><dt>{t("quality.rule")}</dt><dd><code>{selectedIncident.rule}</code></dd></div>
                      <div><dt>{t("quality.dataset")}</dt><dd><code>{selectedIncident.dataset}</code></dd></div>
                      <div><dt>{t("quality.affectedRows")}</dt><dd><code>{selectedIncident.affected_rows}</code></dd></div>
                    </dl>
                    {selectedIncident.sample_rows.length > 0 ? (
                      <table className="dq-sample-table">
                        <thead>
                          <tr>{Object.keys(selectedIncident.sample_rows[0]).map((key) => <th key={key}>{key}</th>)}</tr>
                        </thead>
                        <tbody>
                          {selectedIncident.sample_rows.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, cellIndex) => <td key={cellIndex}>{String(value)}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="cmdk-empty">{t("common.empty")}</p>
                    )}
                  </motion.div>
                ) : (
                  <div className="dq-detail-empty">
                    <CheckCircle2 size={24} />
                    <p>{t("common.details")}</p>
                  </div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
