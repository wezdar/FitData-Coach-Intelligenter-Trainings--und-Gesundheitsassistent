"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, ArrowRight, CalendarCheck, Check, ChevronDown, CircleGauge,
  Dumbbell, Flame, Footprints, Info, MapPin, Scale, Sparkles, TrendingDown, Trophy,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AnimatedNumber } from "@/components/animated-number";
import { Badge, Card, ProgressBar, SectionHeader } from "@/components/ui";
import {
  calorieData, muscleLoad, pipelineStages, recentActivities, trainingDistribution,
  weeklyActivity, weightProgress,
} from "@/lib/data";
import { chartColors, chartTooltip } from "@/lib/chart-theme";
import { localeMeta } from "@/lib/i18n";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";
import { MetricDrawer, type MetricExplanation } from "@/components/metric-drawer";
import { AnimatePresence } from "framer-motion";
import { DataFlowArt } from "@/components/data-flow-art";
import { useLocale } from "@/components/locale-provider";

function KpiCard({
  label, value, suffix, hint, icon: Icon, tone, digits = 0, progress, onExplain, explainLabel,
}: {
  label: string; value: number; suffix: string; hint: string;
  icon: typeof Activity; tone: string; digits?: number; progress?: number;
  onExplain?: () => void;
  explainLabel?: string;
}) {
  return (
    <Card className={`kpi-card kpi-${tone}`}>
      <div className="kpi-top">
        <span className="kpi-icon"><Icon size={19} /></span>
        <button onClick={onExplain} aria-label={`${explainLabel ?? ""} ${label}`.trim()} title={explainLabel}><Info size={16} /></button>
      </div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value"><AnimatedNumber value={value} digits={digits} /><span>{suffix}</span></p>
      <div className="kpi-hint">{hint}</div>
      {progress !== undefined && <ProgressBar value={progress} tone={tone} />}
    </Card>
  );
}

function GoalRing({ percent, label }: { percent: number; label: string }) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="goal-ring" style={{ "--progress": filled ? `${percent}%` : "0%" } as React.CSSProperties}>
      <div><strong>{percent}%</strong><span>{label}</span></div>
    </div>
  );
}

function ActivityChart() {
  const { tp, tc, to } = useLocale();
  const [metric, setMetric] = useState<"steps" | "distance">("steps");
  return (
    <Card className="chart-card activity-chart-card" delay={0.08}>
      <SectionHeader eyebrow={tp("chart.last7")} title={tp("chart.yourActivity")} action={
        <div className="segmented" role="group" aria-label={to("l.activityMetric")}>
          <button className={metric === "steps" ? "active" : ""} onClick={() => setMetric("steps")}>{tp("chart.steps")}</button>
          <button className={metric === "distance" ? "active" : ""} onClick={() => setMetric("distance")}>{tp("chart.distance")}</button>
        </div>
      } />
      <div className="chart-statline"><strong>{metric === "steps" ? "69.072" : "51,1 km"}</strong><span><TrendingDown size={14} /> 6,4% {tp("chart.moreThanLastWeek")}</span></div>
      <div className="chart-area tall-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyActivity.map((r) => ({ ...r, day: tc(r.dayKey as never) }))} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke={chartColors.grid} strokeDasharray="4 5" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
            <Tooltip contentStyle={chartTooltip} formatter={(value) => metric === "steps" ? [`${Number(value).toLocaleString("de-DE")} ${to("l.steps")}`, to("l.activity")] : [`${value} km`, to("l.distance")]} />
            <Area type="monotone" dataKey={metric} stroke={chartColors.cyan} strokeWidth={3} fill="url(#activityFill)" animationDuration={900} />
            {metric === "steps" && <Line type="monotone" dataKey="goal" stroke={chartColors.axis} strokeDasharray="5 6" dot={false} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function NextWorkout() {
  const { tp } = useLocale();
  return (
    <Card className="next-workout" delay={0.1}>
      <div className="workout-glow" />
      <div className="workout-heading"><span><Dumbbell size={18} /></span><Badge tone="lime">{tp("workout.today")}</Badge></div>
      <p className="eyebrow">{tp("workout.next")}</p>
      <h2>{tp("workout.lowerBody")}</h2>
      <p className="workout-description">{tp("workout.description")}</p>
      <div className="workout-meta"><span>48 min</span><span>6 {tp("workout.exercises")}</span><span>{tp("workout.medium")}</span></div>
      <div className="exercise-peek"><span className="exercise-index">01</span><div><strong>{tp("workout.squats")}</strong><small>4 × 8 {tp("workout.reps")}</small></div><span>90 s</span></div>
      <LinkButton label={tp("workout.start")} />
    </Card>
  );
}

function LinkButton({ label }: { label: string }) {
  return <button className="primary-button">{label}<ArrowRight size={17} /></button>;
}

function WeightChart() {
  const { tp, to } = useLocale();
  return (
    <Card className="chart-card" delay={0.12}>
      <SectionHeader eyebrow={tp("chart.12weeks")} title={tp("chart.weightTrend")} action={<Badge tone="lime">−2,6 kg</Badge>} />
      <div className="chart-area medium-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weightProgress} margin={{ top: 18, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chartColors.grid} strokeDasharray="4 5" />
            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
            <YAxis domain={[76, 81]} axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
            <Tooltip contentStyle={chartTooltip} formatter={(value) => [`${value} kg`, to("l.weight")]} />
            <Line type="monotone" dataKey="weight" stroke={chartColors.purple} strokeWidth={3} dot={{ fill: chartColors.surface, stroke: chartColors.purple, strokeWidth: 2, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mini-insight"><Sparkles size={16} /><span>{tp("chart.weightInsight")}</span></div>
    </Card>
  );
}

function CaloriesChart() {
  const { tp, tc } = useLocale();
  return (
    <Card className="chart-card" delay={0.14}>
      <SectionHeader eyebrow={tp("chart.dailyEstimate")} title={tp("chart.calorieBurn")} action={<button className="ghost-button">{tp("chart.thisWeek")} <ChevronDown size={14} /></button>} />
      <div className="chart-area medium-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={calorieData.map((r) => ({ ...r, day: tc(r.dayKey as never) }))} margin={{ top: 18, right: 2, left: -22, bottom: 0 }} barGap={0}>
            <CartesianGrid vertical={false} stroke={chartColors.grid} strokeDasharray="4 5" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
            <Tooltip contentStyle={chartTooltip} />
            <Bar dataKey="base" stackId="a" fill={chartColors.track} radius={[0, 0, 6, 6]} />
            <Bar dataKey="active" stackId="a" fill={chartColors.orange} radius={[7, 7, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="legend-row"><span><i className="dot orange" />{tp("chart.active")}: 4.228 kcal</span><span><i className="dot gray" />{tp("chart.basal")}: 13.160 kcal</span></div>
    </Card>
  );
}

function DistributionChart() {
  const { tp, tc } = useLocale();
  return (
    <Card className="chart-card distribution-card" delay={0.16}>
      <SectionHeader eyebrow={tp("chart.last30")} title={tp("chart.trainingMix")} />
      <div className="donut-layout">
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={trainingDistribution.map((i) => ({ ...i, name: tc(i.key as never) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="52%" outerRadius="76%" paddingAngle={3} stroke="none" isAnimationActive={false}>{trainingDistribution.map((item) => <Cell key={item.key} fill={item.color} />)}</Pie><Tooltip contentStyle={chartTooltip} formatter={(value, name) => [`${value}%`, String(name)]} /></PieChart></ResponsiveContainer>
          <div className="donut-center"><strong>13</strong><span>{tp("chart.sessions")}</span></div>
        </div>
        <div className="distribution-legend">{trainingDistribution.map((item) => <div key={item.key}><span><i style={{ background: item.color }} />{tc(item.key as never)}</span><strong>{item.value}%</strong></div>)}</div>
      </div>
    </Card>
  );
}

function MuscleHeatmap() {
  const { tp, tc } = useLocale();
  return (
    <Card className="heatmap-card" delay={0.18}>
      <SectionHeader eyebrow={tp("chart.load7")} title={tp("chart.muscleGroups")} action={<Badge tone="purple">{tp("chart.balanced")}</Badge>} />
      <div className="heatmap-grid">{muscleLoad.map(([key, value]) => <div key={key} className="heatmap-cell" style={{ "--heat": value / 100 } as React.CSSProperties}><span>{tc(key as never)}</span><strong>{value}%</strong></div>)}</div>
      <p className="heatmap-note"><Info size={15} /> {tp("chart.loadNote")}</p>
    </Card>
  );
}

const calendarGridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.012 } },
};
const calendarCellVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

function CompletionCalendar() {
  const { tp, to, locale } = useLocale();
  const monthLabel = new Intl.DateTimeFormat(localeMeta[locale].intl, { month: "long", year: "numeric" }).format(new Date(2026, 7, 1));
  const reduceMotion = useReducedMotion();
  const days = Array.from({ length: 35 }, (_, index) => ({
    date: index - 2, done: [2, 4, 7, 8, 11, 14, 16, 18, 21, 23, 25, 28, 30].includes(index), active: index === 17,
  }));
  return (
    <Card className="calendar-card" delay={0.2}>
      <SectionHeader eyebrow={monthLabel} title={tp("chart.consistency")} action={<div className="calendar-controls"><button aria-label={to("l.prevMonth")}>‹</button><button aria-label={to("l.nextMonth")}>›</button></div>} />
      <div className="week-labels">{["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => <span key={day}>{day}</span>)}</div>
      <motion.div
        className="calendar-grid"
        variants={calendarGridVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        {days.map((day, index) => (
          <motion.div
            key={index}
            variants={calendarCellVariants}
            whileHover={reduceMotion || day.date < 1 ? undefined : { scale: 1.08, zIndex: 1 }}
            className={`${day.done ? "done" : ""} ${day.active ? "today" : ""} ${day.date < 1 ? "muted" : ""}`}
          >
            <span>{day.date > 0 ? day.date : 30 + day.date}</span>{day.done && <Check size={12} />}
          </motion.div>
        ))}
      </motion.div>
      <div className="streak-strip"><Trophy size={18} /><div><strong>5 {tp("chart.weeksOnTarget")}</strong><span>{tp("chart.longestStreak")}: 8 {tp("chart.weeks")}</span></div></div>
    </Card>
  );
}

function RecentActivities() {
  const { t, tp, tc } = useLocale();
  return (
    <Card className="activities-card" delay={0.22}>
      <SectionHeader eyebrow={tp("recent.synced")} title={tp("recent.title")} action={<button className="text-button">{t("common.showAll")} <ArrowRight size={15} /></button>} />
      <div className="table-scroll"><table><thead><tr><th>{tp("recent.activity")}</th><th>{tp("recent.time")}</th><th>{tp("recent.duration")}</th><th>{tp("recent.performance")}</th><th>{tp("recent.status")}</th></tr></thead><tbody>{recentActivities.map((activity) => <tr key={activity.typeKey + activity.time}><td><span className="activity-type-icon"><Activity size={16} /></span><strong>{tc(activity.typeKey)}</strong></td><td>{tc(activity.dateKey)}, {activity.time}</td><td>{activity.duration}</td><td>{activity.value}</td><td><Badge tone={activity.imported ? "cyan" : "lime"}>{activity.imported ? tc("d.imported") : tc("d.completed")}</Badge></td></tr>)}</tbody></table></div>
    </Card>
  );
}

function PipelineStatus() {
  const { tp, tc } = useLocale();
  return (
    <Card className="pipeline-card" delay={0.24}>
      <SectionHeader eyebrow={`${tp("pipe.quality")}: 99,7%`} title={tp("pipe.statusTitle")} action={<Badge tone="lime"><span className="status-dot" /> {tp("pipe.current")}</Badge>} />
      <div className="pipeline-flow">{pipelineStages.map((stage, index) => <div className="pipeline-stage-wrap" key={stage.key}><div className={`pipeline-stage pipeline-${stage.tone}`}><span>{tc(stage.key as never)}</span><strong>{stage.countKey ? tc(stage.countKey as never) : stage.count}</strong></div>{index < pipelineStages.length - 1 && <div className="pipeline-connector"><motion.span animate={{ x: [0, 18, 36], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: index * 0.18 }} /></div>}</div>)}</div>
      <div className="pipeline-metrics"><div><span>{tp("lin.lastRun")}</span><strong>Heute, 08:02</strong></div><div><span>{tp("lin.processed")}</span><strong>12.482</strong></div><div><span>{tp("lin.rejected")}</span><strong className="warning-text">31</strong></div><div><span>{tp("lin.runtime")}</span><strong>48,2 s</strong></div><div><span>{tp("lin.freshness")}</span><strong className="success-text">4 Min.</strong></div></div>
    </Card>
  );
}

export function Dashboard() {
  const { t, tp, tc } = useLocale();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [explain, setExplain] = useState<MetricExplanation | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  const k = summary?.kpis;
  const nf = (value: number | null | undefined, digits = 0) =>
    value === null || value === undefined ? "—" : value.toLocaleString("de-DE", {
      minimumFractionDigits: digits, maximumFractionDigits: digits,
    });

  const stepGoal = 10000;
  const stepProgress = k ? Math.min(Math.round((k.steps_today / stepGoal) * 100), 100) : 0;
  const adherence = k && k.workouts_planned
    ? Math.round((k.workouts_completed / k.workouts_planned) * 100) : 0;
  const healthy = k?.healthy_weight_range_kg;

  const explanations: Record<string, MetricExplanation> = {
    weight: {
      title: tp("kpi.weight"), value: `${nf(k?.weight_kg, 1)} kg`,
      formula: tc("m.weightFormula"),
      unit: tc("m.weightUnit"),
      inputs: [{ label: tc("m.weightMeasurements"), value: `${summary?.weight_series.length ?? 0}` }],
      assumptions: tc("m.weightAssumptions"),
      limitations: tc("m.weightLimits"),
      lineage: ["weight_measurements.weight_kg", "weight_measurements.measured_on"],
    },
    bmi: {
      title: tp("kpi.bmi"), value: nf(k?.bmi, 1),
      formula: tc("m.bmiFormula"),
      unit: tc("m.bmiUnit"),
      inputs: [
        { label: tp("kpi.weight"), value: `${nf(k?.weight_kg, 1)} kg` },
        { label: tp("kpi.healthyRange"), value: healthy ? `${nf(healthy[0], 1)}–${nf(healthy[1], 1)} kg` : "—" },
      ],
      assumptions: tc("m.bmiAssumptions"),
      limitations: tc("m.bmiLimits"),
      lineage: ["profiles.height_cm", "weight_measurements.weight_kg"],
    },
    steps: {
      title: tp("kpi.steps"), value: nf(k?.steps_today),
      formula: tc("m.stepsFormula"),
      unit: tc("m.stepsUnit"),
      inputs: [
        { label: tc("m.stepsGoal"), value: nf(stepGoal) },
        { label: tc("m.stepsFulfil"), value: `${stepProgress}%` },
        { label: tc("m.stepsWeek"), value: nf(k?.week_steps) },
      ],
      sources: summary?.weekly_activity.slice(-3).map((row) => ({
        label: row.date, value: `${nf(row.steps)} ${tc("m.stepsUnit")}`,
      })),
      assumptions: tc("m.stepsAssumptions"),
      limitations: tc("m.stepsLimits"),
      lineage: ["daily_activity.steps", "daily_activity.activity_date"],
    },
    distance: {
      title: tp("kpi.distance"), value: `${nf(k?.distance_km, 2)} km`,
      formula: tc("m.distFormula"),
      unit: tc("m.distUnit"),
      inputs: [
        { label: tp("kpi.steps"), value: nf(k?.steps_today) },
        { label: tc("m.distStride"), value: `74 cm (${tc("m.distFromProfile")})` },
      ],
      assumptions: tc("m.distAssumptions"),
      limitations: tc("m.distLimits"),
      lineage: ["daily_activity.steps", "profiles.stride_length_cm"],
    },
    calories: {
      title: tp("kpi.calories"), value: `${nf(k?.active_calories_kcal)} kcal`,
      formula: tc("m.calFormula"),
      unit: tc("m.calUnit"),
      inputs: [{ label: tc("m.calMinutes"), value: `${summary?.weekly_activity.at(-1)?.workout_minutes ?? 0} min` }],
      assumptions: tc("m.calAssumptions"),
      limitations: tc("m.calLimits"),
      lineage: ["daily_activity.active_calories_kcal", "daily_activity.workout_minutes"],
    },
    adherence: {
      title: tp("kpi.trainingWeek"), value: `${k?.workouts_completed ?? 0} / ${k?.workouts_planned ?? 0}`,
      formula: tc("m.adhFormula"),
      unit: tc("m.adhUnit"),
      inputs: [
        { label: tc("m.adhDone"), value: `${k?.workouts_completed ?? 0}` },
        { label: tc("m.adhPlanned"), value: `${k?.workouts_planned ?? 0}` },
        { label: tc("m.adhRate"), value: `${adherence}%` },
      ],
      assumptions: tc("m.adhAssumptions"),
      limitations: tc("m.adhLimits"),
      lineage: ["daily_activity.workout_minutes", "profiles.available_days"],
    },
  };

  return (
    <AppShell title={tp("dash.title")} subtitle={tp("dash.subtitle")}>
      <div className="dashboard-hero">
        <div>
          <Badge tone={failed ? "orange" : "lime"}>
            <Sparkles size={13} /> {failed ? tp("dash.offline") : tp("dash.live")}
          </Badge>
          <h2>{tp("dash.heroLead")} <em>{k && k.workouts_planned > k.workouts_completed
            ? `${k.workouts_planned - k.workouts_completed} ${k.workouts_planned - k.workouts_completed > 1 ? tp("dash.trainings") : tp("dash.training")}`
            : tp("dash.onTrack")}</em><br />{tp("dash.heroTrail")}</h2>
          <p>
            {k?.steps_change_percent !== null && k?.steps_change_percent !== undefined
              ? `${tp("dash.activityIs")} ${nf(Math.abs(k.steps_change_percent), 1)}% ${k.steps_change_percent >= 0 ? tp("dash.aboveLastWeek") : tp("dash.belowLastWeek")}.`
              : tp("dash.noComparison")}
            {" "}{tp("dash.fromHistory")}
          </p>
        </div>
        <DataFlowArt />
        <GoalRing percent={adherence} label={tp("dash.weekGoal")} />
      </div>
      <div className="kpi-grid">
        <KpiCard label={tp("kpi.weight")} value={k?.weight_kg ?? 0} digits={1} suffix=" kg"
          hint={healthy ? `${tp("kpi.healthyRange")}: ${nf(healthy[0], 1)}–${nf(healthy[1], 1)} kg` : "—"}
          icon={Scale} tone="purple" explainLabel={t("metric.why")} onExplain={() => setExplain(explanations.weight)} />
        <KpiCard label={tp("kpi.bmi")} value={k?.bmi ?? 0} digits={1} suffix=""
          hint={tp("kpi.bmiHint")} icon={CircleGauge} tone="lime"
          explainLabel={t("metric.why")} onExplain={() => setExplain(explanations.bmi)} />
        <KpiCard label={tp("kpi.steps")} value={k?.steps_today ?? 0} suffix=""
          hint={`${stepProgress}% ${tp("kpi.stepsHint")}`} icon={Footprints} tone="cyan"
          progress={stepProgress} explainLabel={t("metric.why")} onExplain={() => setExplain(explanations.steps)} />
        <KpiCard label={tp("kpi.distance")} value={k?.distance_km ?? 0} digits={2} suffix=" km"
          hint={tp("kpi.distanceHint")} icon={MapPin} tone="cyan"
          explainLabel={t("metric.why")} onExplain={() => setExplain(explanations.distance)} />
        <KpiCard label={tp("kpi.calories")} value={k?.active_calories_kcal ?? 0} suffix=" kcal"
          hint={tp("kpi.caloriesHint")} icon={Flame} tone="orange"
          explainLabel={t("metric.why")} onExplain={() => setExplain(explanations.calories)} />
        <KpiCard label={tp("kpi.trainingWeek")} value={k?.workouts_completed ?? 0}
          suffix={` / ${k?.workouts_planned ?? 0}`} hint={`${adherence}% ${tp("kpi.weekFulfilment")}`}
          icon={CalendarCheck} tone="lime" progress={adherence}
          explainLabel={t("metric.why")} onExplain={() => setExplain(explanations.adherence)} />
      </div>
      <div className="dashboard-grid dashboard-grid-top"><ActivityChart /><NextWorkout /></div>
      <div className="dashboard-grid dashboard-grid-thirds"><WeightChart /><CaloriesChart /><DistributionChart /></div>
      <div className="dashboard-grid dashboard-grid-mid"><MuscleHeatmap /><CompletionCalendar /></div>
      <RecentActivities />
      <PipelineStatus />
      <p className="medical-disclaimer">
        {tp("disclaimer")}
      </p>
      <AnimatePresence>
        {explain && <MetricDrawer metric={explain} onClose={() => setExplain(null)} />}
      </AnimatePresence>
    </AppShell>
  );
}
