"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Check, CheckCircle2,
  ChevronLeft, ChevronRight, CloudUpload, Database, Download, Dumbbell,
  FileCheck2, FileSpreadsheet, Flame, Footprints, Gauge, Info,
  Link2, LockKeyhole, Play, Plus, RefreshCw, Save, Scale, Settings2, ShieldCheck,
  Sparkles, Trash2, Trophy, UserRound, WandSparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { pipelineStages, recentActivities, weeklyActivity, weightProgress } from "@/lib/data";
import { metricDocumentation } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { localeMeta } from "@/lib/i18n";

import { chartColors, chartTooltip as tooltipStyle } from "@/lib/chart-theme";

function PageIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-intro"><div><Badge tone="lime">{eyebrow}</Badge><h2>{title}</h2><p>{description}</p></div>{actions ? <div className="page-intro-actions">{actions}</div> : null}</div>;
}

function MetricGrid({ items }: { items: { label: string; value: string; hint: string }[] }) {
  return <div className="metric-grid">{items.map((item) => <div className="metric-tile" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.hint}</small></div>)}</div>;
}

const exercises = [
  { nameKey: "e.squats", detail: "4 × 8", rest: "90 s", muscleKey: "e.mLegsCore", noteKey: "e.n1", perSide: false },
  { nameKey: "e.rdl", detail: "3 × 10", rest: "90 s", muscleKey: "e.mPosterior", noteKey: "e.n2", perSide: false },
  { nameKey: "e.bulgarian", detail: "3 × 10", rest: "75 s", muscleKey: "e.mLegsGlutes", noteKey: "e.n3", perSide: true },
  { nameKey: "e.legCurl", detail: "3 × 12", rest: "60 s", muscleKey: "e.mHamstrings", noteKey: "e.n4", perSide: false },
  { nameKey: "e.pallof", detail: "3 × 12", rest: "45 s", muscleKey: "e.mCore", noteKey: "e.n5", perSide: true },
  { nameKey: "e.calfRaise", detail: "3 × 15", rest: "45 s", muscleKey: "e.mCalves", noteKey: "e.n6", perSide: false },
] as const;

export function WorkoutPlanPage() {
  const { t, tp, tf, to } = useLocale();
  const [duration, setDuration] = useState("50");
  const [split, setSplit] = useState<"o.fullBody" | "o.upperLower" | "o.pushPullLegs">("o.upperLower");
  return <AppShell title={t("nav.plan")} subtitle={tp("plan.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={tf("f.plan.week")} title={tp("plan.heading")} description={tf("f.plan.desc")} actions={<><button className="secondary-button"><RefreshCw size={15} /> {tf("f.plan.regenerate")}</button><button className="secondary-button primary"><Save size={15} /> {tf("f.plan.save")}</button></>} />
    <div className="planner-banner"><div><WandSparkles /><span><strong>{tf("f.plan.logic")}</strong><small>{to("o.hypertrophy")} · {to("o.advanced")} · 4 {tf("f.plan.days").toLowerCase()} · {to("o.gym")}</small></span></div><Badge tone="lime">{tf("f.plan.ruleBased")}</Badge></div>
    <div className="split-layout">
      <Card><SectionHeader eyebrow={tf("f.plan.config")} title={tf("f.plan.configTitle")} /><div className="form-grid planner-form">
        <div className="field"><label htmlFor="goal">{tf("f.plan.goal")}</label><select id="goal"><option>{to("o.hypertrophy")}</option><option>{to("o.strength")}</option><option>{to("o.generalFitness")}</option></select></div>
        <div className="field"><label htmlFor="experience">{tf("f.plan.experience")}</label><select id="experience"><option>{to("o.advanced")}</option><option>{to("o.beginner")}</option><option>{to("o.experienced")}</option></select></div>
        <div className="field"><label htmlFor="split">{tf("f.plan.split")}</label><select id="split" value={split} onChange={(event) => setSplit(event.target.value as typeof split)}><option value="o.fullBody">{to("o.fullBody")}</option><option value="o.upperLower">{to("o.upperLower")}</option><option value="o.pushPullLegs">{to("o.pushPullLegs")}</option></select></div>
        <div className="field"><label htmlFor="duration">{tf("f.plan.duration")}</label><select id="duration" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="35">{to("o.min35")}</option><option value="50">{to("o.min50")}</option><option value="65">{to("o.min65")}</option></select></div>
        <div className="field"><label htmlFor="equipment">{tf("f.plan.equipment")}</label><select id="equipment"><option>{to("o.gym")}</option><option>{to("o.dumbbells")}</option><option>{to("o.bodyweight")}</option></select></div>
        <div className="field"><label>{tf("f.plan.days")}</label><div className="day-selector">{["Mo","Di","Mi","Do","Fr","Sa","So"].map((day, index) => <button key={day} className={[0,2,4,6].includes(index) ? "selected" : ""}>{day}</button>)}</div></div>
      </div></Card>
      <Card className="plan-summary-card"><SectionHeader eyebrow={tf("f.plan.recommendation")} title={to(split)} /><div className="plan-score"><div className="goal-ring mini" style={{ "--progress": "92%" } as React.CSSProperties}><div><strong>92</strong><span>{tf("f.plan.score")}</span></div></div><div><strong>{tf("f.plan.goodBalance")}</strong><p>{tf("f.plan.balanceText")}</p></div></div><ul className="check-list"><li><CheckCircle2 /> {tf("f.plan.check1").replace("{d}", duration)}</li><li><CheckCircle2 /> {tf("f.plan.check2")}</li><li><CheckCircle2 /> {tf("f.plan.check3")}</li></ul></Card>
    </div>
    <Card><SectionHeader eyebrow={`${to("l.friday")} · ${to("l.sessionOf")}`} title={to("v.lowerCore")} action={<Badge tone="purple">{to("l.approx")} {duration} {to("l.minShort")}</Badge>} /><div className="exercise-list">{exercises.map((exercise, index) => <motion.div layout className="exercise-row" key={exercise.nameKey}><span className="exercise-number">{String(index + 1).padStart(2, "0")}</span><div className="exercise-main"><strong>{to(exercise.nameKey)}</strong><small>{to(exercise.muscleKey)} · {to(exercise.noteKey)}</small></div><div><span>{tf("f.plan.sets")}</span><strong>{exercise.detail}{exercise.perSide ? ` ${to("e.perSide")}` : ""}</strong></div><div><span>{tf("f.plan.rest")}</span><strong>{exercise.rest}</strong></div><button aria-label={`${to(exercise.nameKey)} ${tf("f.plan.edit")}`}><Settings2 size={16} /></button></motion.div>)}</div></Card>
  </div></AppShell>;
}

const calendarViews = [
  { key: "dayGridMonth", labelKey: "f.cal.month" },
  { key: "timeGridWeek", labelKey: "f.cal.week" },
  { key: "listMonth", labelKey: "f.cal.list" },
] as const;

const calendarLegend = [
  { tone: "lime", key: "d.strength" },
  { tone: "cyan", key: "d.endurance" },
  { tone: "purple", key: "v.upperBody" },
  { tone: "orange", key: "d.mobility" },
] as const;

export function CalendarPage() {
  const { t, tp, tf, to, tc, locale } = useLocale();
  const events = [
    { titleKey: "v.lowerCore", date: "2026-08-15", className: "event-lime" },
    { titleKey: "v.zone2", date: "2026-08-16", className: "event-cyan" },
    { titleKey: "v.upperBody", date: "2026-08-18", className: "event-purple" },
    { titleKey: "v.mobility", date: "2026-08-20", className: "event-orange" },
    { titleKey: "v.lowerBody", date: "2026-08-22", className: "event-lime" },
  ];
  const calendarRef = useRef<FullCalendar | null>(null);
  const [view, setView] = useState<(typeof calendarViews)[number]["key"]>("dayGridMonth");
  const [title, setTitle] = useState(() => new Intl.DateTimeFormat(localeMeta[locale].intl, { month: "long", year: "numeric" }).format(new Date(2026, 7, 1)));
  const [switching, setSwitching] = useState(false);
  const reduceMotion = useReducedMotion();

  const changeView = (nextView: (typeof calendarViews)[number]["key"]) => {
    if (nextView === view) return;
    setSwitching(true);
    setView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  };

  return <AppShell title={t("nav.calendar")} subtitle={tp("cal.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={title} title={tp("cal.heading")} description={tp("cal.subtitle")} actions={<button className="secondary-button primary"><Plus size={15} /> {tf("f.cal.add")}</button>} />
    <MetricGrid items={[{label:tf("f.cal.planned"),value:"5",hint:tf("f.cal.plannedHint")},{label:tf("f.cal.done"),value:"4",hint:`80% ${tf("f.cal.doneHint")}`},{label:tf("f.cal.time"),value:"3:18 h",hint:`+24 Min. ${tf("f.cal.timeHint")}`},{label:tf("f.cal.recovery"),value:tf("f.cal.recoveryGood"),hint:tf("f.cal.recoveryHint")}]} />
    <Card className="full-calendar-card">
      <div className="calendar-toolbar">
        <AnimatePresence mode="wait">
          <motion.h3
            key={title}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.h3>
        </AnimatePresence>
        <div className="segmented" role="group" aria-label={to("l.calendarView")}>
          {calendarViews.map((item) => (
            <button key={item.key} className={view === item.key ? "active" : ""} onClick={() => changeView(item.key)}>{tf(item.labelKey)}</button>
          ))}
        </div>
      </div>
      <div className={cn("calendar-shell", !reduceMotion && switching && "calendar-shell-switching")}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate="2026-08-15"
          locale="de"
          firstDay={1}
          height="auto"
          headerToolbar={{ left: "prev,next today", center: "", right: "" }}
          buttonText={{ today: "Heute" }}
          events={events.map((e) => ({ ...e, title: to(e.titleKey as never) }))}
          editable
          dayMaxEvents
          datesSet={(info) => { setTitle(info.view.title); setSwitching(false); }}
        />
      </div>
      <div className="legend-row calendar-legend">
        {calendarLegend.map((item) => <span key={item.key}><i className={`dot ${item.tone}`} />{item.key.startsWith("v.") ? to(item.key as never) : tc(item.key as never)}</span>)}
      </div>
    </Card>
  </div></AppShell>;
}

export function ActivitiesPage() {
  const { t, tp, tc, tf } = useLocale();
  const [filter, setFilter] = useState<string>("all");
  return <AppShell title={t("nav.activities")} subtitle={tp("act.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={`12.438 ${tf("f.act.records")}`} title={tp("act.heading")} description={tf("f.act.desc")} actions={<><button className="secondary-button"><Download size={15} /> {tf("f.act.export")}</button><button className="secondary-button primary"><Plus size={15} /> {tf("f.act.add")}</button></>} />
    <MetricGrid items={[{label:tf("f.act.steps30"),value:"287.450",hint:`9.582 ${tf("f.act.stepsAvg")}`},{label:tf("f.act.distance"),value:"212,7 km",hint:`48,3 km ${tf("f.act.distanceHint")}`},{label:tf("f.act.activeTime"),value:"31,4 h",hint:`+8,2% ${tf("f.act.vsMonth")}`},{label:tf("f.act.calories"),value:"18.930",hint:tf("f.act.caloriesHint")}]} />
    <Card><div className="filter-row">{(["all","d.strength","d.run","f.act.walking","d.mobility"] as const).map((key) => <button key={key} onClick={() => setFilter(key)} className={filter === key ? "active" : ""}>{key === "all" ? tf("f.act.all") : key === "f.act.walking" ? tf(key) : tc(key)}</button>)}<label className="field compact"><span className="sr-only">{tf("f.act.period")}</span><select><option>{tf("f.act.last30")}</option><option>{tf("f.act.thisYear")}</option></select></label></div>
      <div className="activity-feed">{recentActivities.map((item, index) => <div className="activity-feed-row" key={item.typeKey + index}><span className={`feed-icon tone-${index%4}`}><Activity /></span><div><strong>{tc(item.typeKey)}</strong><small>{tc(item.dateKey)}, {item.time} · {item.imported ? "Apple Health CSV" : "FitData Coach"}</small></div><div><span>Dauer</span><strong>{item.duration}</strong></div><div><span>Leistung</span><strong>{item.value}</strong></div><Badge tone={item.imported ? "cyan" : "lime"}>{item.imported ? tc("d.imported") : tc("d.completed")}</Badge><button aria-label={tf("f.act.openDetails")}><ChevronRight /></button></div>)}</div>
    </Card>
  </div></AppShell>;
}

export function ProgressPage() {
  const { t, tp, tf } = useLocale();
  return <AppShell title={t("nav.progress")} subtitle={tp("prog.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={`${tf("f.prog.goal")}: 74,0 kg`} title={tf("f.prog.title")} description={tf("f.prog.desc")} actions={<button className="secondary-button"><Scale size={15} /> {tf("f.prog.addMeasurement")}</button>} />
    <MetricGrid items={[{label:tf("f.prog.weightChange"),value:"−2,6 kg",hint:tf("f.prog.in12Weeks")},{label:tf("f.prog.goalReached"),value:"61%",hint:`3,2 kg ${tf("f.prog.remaining")}`},{label:tf("f.prog.adherence"),value:"87%",hint:`52 ${tf("f.prog.ofSessions")}`},{label:tf("f.prog.streak"),value:`19 ${tf("f.prog.days")}`,hint:`${tf("f.prog.record")}: 27`}]} />
    <div className="split-layout progress-layout"><Card><SectionHeader eyebrow={tf("f.prog.smoothed")} title={tf("f.prog.corridor")} /><div className="feature-chart"><ResponsiveContainer><LineChart data={weightProgress}><CartesianGrid vertical={false} stroke={chartColors.grid} strokeDasharray="4 5"/><XAxis dataKey="week" axisLine={false} tickLine={false}/><YAxis domain={[72,82]} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle}/><Line dataKey="weight" stroke={chartColors.purple} strokeWidth={3}/><Line dataKey={() => 74} stroke={chartColors.lime} strokeDasharray="6 5" dot={false}/></LineChart></ResponsiveContainer></div></Card><Card><SectionHeader eyebrow={tf("f.prog.autoInsight")} title={tf("f.prog.whatChanges")} /><div className="insight-list"><div className="insight positive"><Trophy /><span><strong>{tf("f.prog.stableTrend")}</strong><small>{tf("f.prog.stableTrendText")}</small></span></div><div className="insight"><Gauge /><span><strong>{tf("f.prog.perfStable")}</strong><small>{tf("f.prog.perfStableText")}</small></span></div><div className="insight warning"><Info /><span><strong>{tf("f.prog.watchRecovery")}</strong><small>{tf("f.prog.watchRecoveryText")}</small></span></div></div></Card></div>
    <Card><SectionHeader eyebrow={tf("f.prog.weeklyEyebrow")} title={tf("f.prog.weeklyTitle")} /><div className="feature-chart compact-chart"><ResponsiveContainer><ComposedProgress /></ResponsiveContainer></div></Card>
  </div></AppShell>;
}

function ComposedProgress() {
  return <BarChart data={weeklyActivity}><CartesianGrid vertical={false} stroke={chartColors.grid} strokeDasharray="4 5"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="steps" fill={chartColors.cyan} radius={[7,7,0,0]}/><Legend /></BarChart>;
}

export function AnalyticsPage() {
  const { t, tp, tc, tf } = useLocale();
  const metricEntries = Object.entries(metricDocumentation);
  return <AppShell title={t("nav.analytics")} subtitle={tp("ana.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={tf("f.ana.servingLayer")} title={tp("ana.heading")} description={tf("f.ana.desc")} actions={<button className="secondary-button"><Download size={15}/> {tf("f.ana.dictionary")}</button>} />
    <MetricGrid items={[{label:tf("f.ana.lastRun"),value:"08:02",hint:`${tf("f.ana.successIn")} 48,2 s`},{label:tf("f.ana.completeness"),value:"99,7%",hint:`12.438 ${tf("f.ana.validRows")}`},{label:tf("f.ana.duplicates"),value:"13",hint:tf("f.ana.autoRemoved")},{label:tf("f.ana.invalid"),value:"18",hint:tf("f.ana.inQuarantine")}]} />
    <Card className="pipeline-analytics"><SectionHeader eyebrow={tf("f.ana.orchestration")} title={tf("f.ana.rawToDecision")} action={<Badge tone="lime"><span className="status-dot"/> {tf("f.ana.pipelineCurrent")}</Badge>} /><div className="pipeline-flow expanded">{pipelineStages.map((stage,index)=><div className="pipeline-stage-wrap" key={stage.key}><div className={`pipeline-stage pipeline-${stage.tone}`}><Database size={17}/><span>{tc(stage.key as never)}</span><strong>{stage.countKey ? tc(stage.countKey as never) : stage.count}</strong></div>{index < pipelineStages.length-1 && <div className="pipeline-connector"><span/></div>}</div>)}</div><div className="quality-strip"><div><CheckCircle2/><span><strong>{tf("f.ana.schemaValid")}</strong><small>{tf("f.ana.panderaChecks")}</small></span></div><div><CheckCircle2/><span><strong>{tf("f.ana.dbtTests")}</strong><small>{tf("f.ana.dbtPassed")}</small></span></div><div><CheckCircle2/><span><strong>{tf("f.ana.freshness")}</strong><small>4 {tf("f.ana.minutesOld")}</small></span></div><div><AlertTriangle/><span><strong>{tf("f.ana.quarantine")}</strong><small>31 {tf("f.ana.records")}</small></span></div></div></Card>
    <div className="metric-doc-grid">{metricEntries.map(([key, item]) => <Card key={key} className="metric-doc-card"><div className="metric-doc-title"><span>{key === "bmi" ? <Gauge/> : key === "distance" ? <Footprints/> : <Flame/>}</span><div><p className="eyebrow">{tf("f.ana.calculatedMetric")}</p><h3>{key === "bmi" ? tf("f.ana.bmiTitle") : key === "distance" ? tf("f.ana.distanceTitle") : tf("f.ana.caloriesTitle")}</h3></div></div><dl><div><dt>{t("metric.formula")}</dt><dd>{tc(item.formulaKey)}</dd></div><div><dt>{t("metric.unit")}</dt><dd>{item.unit}</dd></div><div><dt>{t("metric.assumptions")}</dt><dd>{tc(item.assumptionsKey)}</dd></div><div><dt>{t("metric.limitations")}</dt><dd>{tc(item.limitationsKey)}</dd></div><div><dt>{t("metric.lineage")}</dt><dd className="lineage-list">{item.lineage.map((field)=><code key={field}>{field}</code>)}</dd></div></dl></Card>)}</div>
  </div></AppShell>;
}

export function RecommendationsPage() {
  const { t, tp, tf } = useLocale();
  const cards = [
    { icon: Dumbbell, tone:"lime", tag:tf("f.rec.tag1"), title:tf("f.rec.title1"), text:tf("f.rec.text1"), evidence:tf("f.rec.ev1") },
    { icon: Footprints, tone:"cyan", tag:tf("f.rec.tag2"), title:tf("f.rec.title2"), text:tf("f.rec.text2"), evidence:tf("f.rec.ev2") },
    { icon: Flame, tone:"orange", tag:tf("f.rec.tag3"), title:tf("f.rec.title3"), text:tf("f.rec.text3"), evidence:tf("f.rec.ev3") },
    { icon: Scale, tone:"purple", tag:tf("f.rec.tag4"), title:tf("f.rec.title4"), text:tf("f.rec.text4"), evidence:tf("f.rec.ev4") },
  ];
  return <AppShell title={t("nav.recommendations")} subtitle={tp("rec.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={`4 ${tf("f.rec.count")}`} title={tp("rec.heading")} description={tf("f.rec.desc")} actions={<button className="secondary-button"><Settings2 size={15}/> {tf("f.rec.adjustRules")}</button>} />
    <div className="recommendation-hero"><span><Sparkles/></span><div><p className="eyebrow">{tf("f.rec.briefing")}</p><h3>{tf("f.rec.briefingTitle")}</h3><p>{tf("f.rec.briefingText")}</p></div><Badge tone="lime">{tf("f.rec.confidence")}</Badge></div>
    <div className="recommendation-grid">{cards.map(({icon:Icon,...card}) => <Card key={card.title} className={`recommendation-card rec-${card.tone}`}><span className="recommendation-icon"><Icon/></span><Badge tone={card.tone}>{card.tag}</Badge><h3>{card.title}</h3><p>{card.text}</p><div className="evidence"><BarChart3/><span><strong>{tf("f.rec.dataBasis")}</strong><small>{card.evidence}</small></span></div><button className="text-button">{tf("f.rec.seeReason")} <ArrowRight/></button></Card>)}</div>
    <div className="medical-panel"><ShieldCheck/><div><strong>{tf("f.rec.important")}</strong><p>{tf("f.rec.medicalText")}</p></div></div>
  </div></AppShell>;
}

export function ImportPage() {
  const { t, tp, tc, tf } = useLocale();
  const [dragging, setDragging] = useState(false);
  const [simulated, setSimulated] = useState(false);
  return <AppShell title={t("nav.import")} subtitle={tp("imp.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={tf("f.imp.formats")} title={tp("imp.heading")} description={tf("f.imp.desc")} actions={<button className="secondary-button"><Download size={15}/> {tf("f.imp.sampleData")}</button>} />
    <div className="split-layout import-layout"><Card><SectionHeader eyebrow={tf("f.imp.step1")} title={tf("f.imp.uploadFiles")} /><label className={`upload-zone ${dragging ? "dragging" : ""}`} onDragEnter={()=>setDragging(true)} onDragLeave={()=>setDragging(false)} onDrop={(event)=>{event.preventDefault();setDragging(false);setSimulated(true)}} onDragOver={(event)=>event.preventDefault()}><input type="file" accept=".csv,.json" onChange={()=>setSimulated(true)}/><span><CloudUpload/></span><strong>{tf("f.imp.dropHere")}</strong><p>{tf("f.imp.orClick")}</p><small>{tf("f.imp.maxSize")}</small></label>{simulated && <motion.div className="uploaded-file" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><FileSpreadsheet/><div><strong>activity_export_august.csv</strong><small>2,4 MB · 12.482 Zeilen</small></div><Badge tone="lime">{tf("f.imp.ready")}</Badge><button onClick={()=>setSimulated(false)} aria-label={tf("f.imp.removeFile")}><Trash2/></button></motion.div>}</Card>
      <Card><SectionHeader eyebrow={tf("f.imp.schemas")} title={tf("f.imp.whatToImport")} /><div className="schema-list">{[{icon:Footprints,title:tf("f.imp.schemaSteps"),fields:"timestamp, steps, distance"},{icon:Dumbbell,title:tf("f.imp.schemaWorkouts"),fields:"exercise, sets, reps, duration"},{icon:Scale,title:tf("f.imp.schemaWeight"),fields:"timestamp, weight_kg"},{icon:Flame,title:tf("f.imp.schemaCalories"),fields:"timestamp, kcal, source"}].map(({icon:Icon,...item})=><div key={item.title}><span><Icon/></span><div><strong>{item.title}</strong><code>{item.fields}</code></div><FileCheck2/></div>)}</div></Card></div>
    <Card><SectionHeader eyebrow={`${tf("f.imp.lastRun")} · 08:02`} title={tf("f.imp.processingStatus")} action={<button className="secondary-button primary" disabled={!simulated} onClick={()=>setSimulated(true)}><Play size={14}/> {tf("f.imp.startPipeline")}</button>} /><div className="pipeline-flow expanded">{pipelineStages.map((stage,index)=><div className="pipeline-stage-wrap" key={stage.key}><div className={`pipeline-stage pipeline-${stage.tone}`}><span>{tc(stage.key as never)}</span><strong>{stage.countKey ? tc(stage.countKey as never) : stage.count}</strong></div>{index<pipelineStages.length-1&&<div className="pipeline-connector"><motion.span animate={{x:[0,28],opacity:[0,1,0]}} transition={{repeat:Infinity,duration:1.6}}/></div>}</div>)}</div><MetricGrid items={[{label:tf("f.imp.rowsProcessed"),value:"12.482",hint:`100% ${tf("f.imp.allRead")}`},{label:tf("f.imp.rejected"),value:"31",hint:`0,25% ${tf("f.imp.inQuarantine")}`},{label:tf("f.imp.duplicates"),value:"13",hint:tf("f.imp.removed")},{label:tf("f.ana.completeness"),value:"99,7%",hint:`${tf("f.imp.threshold")} > 98%`}]} /></Card>
  </div></AppShell>;
}

const onboardingStepKeys = ["f.prof.s1","f.prof.s2","f.prof.s3","f.prof.s4","f.prof.s5"] as const;

export function ProfilePage() {
  const { t, tp, tf, to } = useLocale();
  const [step, setStep] = useState(0);
  return <AppShell title={t("nav.profile")} subtitle={tp("prof.subtitle")}><div className="feature-page profile-page">
    <PageIntro eyebrow={`${tf("f.prof.step")} ${step+1} ${tf("f.prof.of")} ${onboardingStepKeys.length}`} title={tf("f.prof.title")} description={tf("f.prof.desc")} />
    <div className="onboarding-shell"><aside><div className="onboarding-progress">{onboardingStepKeys.map((item,index)=><button key={item} className={`${index===step?"active":""} ${index<step?"done":""}`} onClick={()=>setStep(index)}><span>{index<step?<Check/>:index+1}</span><div><strong>{tf(item)}</strong><small>{[to("l.ageGenderMeasures"),to("l.expGoalDays"),to("l.stepsEquipment"),to("l.optionalLimits"),to("l.checkDetails")][index]}</small></div></button>)}</div><div className="privacy-card"><LockKeyhole/><div><strong>Datenschutz zuerst</strong><span>Export und Löschung jederzeit möglich.</span></div></div></aside><Card className="onboarding-form"><AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-18}}>
      {step===0&&<><SectionHeader eyebrow={tf("f.prof.s1")} title={tf("f.prof.s1Title")}/><div className="form-grid"><div className="field"><label htmlFor="age">{tf("f.prof.age")}</label><input id="age" type="number" defaultValue="32" min="16" max="100"/></div><div className="field"><label htmlFor="sex">Geschlecht</label><select id="sex"><option>{to("o.female")}</option><option>{to("o.male")}</option><option>{to("o.diverse")}</option></select></div><div className="field"><label htmlFor="height">Größe in Zentimetern</label><input id="height" type="number" defaultValue="180"/></div><div className="field"><label htmlFor="weight">Gewicht in Kilogramm</label><input id="weight" type="number" defaultValue="77.2" step="0.1"/></div></div></>}
      {step===1&&<><SectionHeader eyebrow={tf("f.prof.s2")} title={tf("f.prof.s2Title")}/><div className="form-grid"><div className="field"><label htmlFor="experience-profile">Trainingserfahrung</label><select id="experience-profile"><option>{to("o.advancedYears")}</option><option>{to("o.beginner")}</option><option>{to("o.experiencedYears")}</option></select></div><div className="field"><label htmlFor="goal-profile">Trainingsziel</label><select id="goal-profile"><option>{to("o.hypertrophy")}</option><option>{to("o.strength")}</option><option>{to("o.generalFitness")}</option></select></div><div className="field"><label>Verfügbare Trainingstage</label><div className="day-selector">{["Mo","Di","Mi","Do","Fr","Sa","So"].map((day,i)=><button key={day} className={[0,2,4,6].includes(i)?"selected":""}>{day}</button>)}</div></div><div className="field"><label htmlFor="session-duration">Bevorzugte Dauer</label><select id="session-duration"><option>45–60 Minuten</option><option>30–45 Minuten</option><option>60–90 Minuten</option></select></div></div></>}
      {step===2&&<><SectionHeader eyebrow={tf("f.prof.s3")} title={tf("f.prof.s3Title")}/><div className="form-grid"><div className="field"><label htmlFor="daily-steps">Durchschnittliche tägliche Schritte</label><input id="daily-steps" type="number" defaultValue="8500"/></div><div className="field"><label htmlFor="activity-factor">Aktivitätsfaktor für TDEE</label><select id="activity-factor"><option>{to("o.moderateActive")}</option><option>{to("o.lightActive")}</option><option>{to("o.veryActive")}</option></select></div><div className="field"><label htmlFor="equipment-profile">Ausstattung</label><select id="equipment-profile"><option>{to("o.gym")}</option><option>{to("o.dumbbells")}</option><option>{to("o.noEquipment")}</option></select></div><div className="field"><label htmlFor="stride">Schrittlänge in cm</label><input id="stride" type="number" defaultValue="74"/></div></div></>}
      {step===3&&<><SectionHeader eyebrow={tf("f.prof.optional")} title={tf("f.prof.s4Title")}/><div className="health-callout"><Info/><p>{tf("f.prof.healthNote")}</p></div><div className="field"><label htmlFor="limitations">Gesundheitliche Einschränkungen</label><textarea id="limitations" placeholder={to("l.optionalPlaceholder")}/></div></>}
      {step===4&&<><SectionHeader eyebrow={tf("f.prof.summary")} title={tf("f.prof.s5Title")}/><div className="profile-summary"><div><UserRound/><span><strong>32 Jahre · weiblich</strong><small>180 cm · 77,2 kg</small></span></div><div><Dumbbell/><span><strong>Muskelaufbau</strong><small>Fortgeschritten · 4 Tage pro Woche</small></span></div><div><Activity/><span><strong>Moderat aktiv</strong><small>8.500 Schritte · Faktor 1,55</small></span></div><div><ShieldCheck/><span><strong>Keine Einschränkungen</strong><small>Kann jederzeit ergänzt werden</small></span></div></div></>}
    </motion.div></AnimatePresence><div className="onboarding-actions"><button className="secondary-button" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}><ChevronLeft/> {tf("f.prof.back")}</button><button className="secondary-button primary" onClick={()=>setStep(Math.min(onboardingStepKeys.length-1,step+1))}>{step===onboardingStepKeys.length-1?to("l.saveProfile"):tf("f.prof.next")}<ChevronRight/></button></div></Card></div>
  </div></AppShell>;
}

export function SettingsPage() {
  const { t, tp, tf, locale } = useLocale();
  return <AppShell title={t("nav.settings")} subtitle={tp("set.subtitle")}><div className="feature-page">
    <PageIntro eyebrow={tf("f.set.eyebrow")} title={tf("f.set.title")} description={tf("f.set.desc")} />
    <div className="settings-grid"><aside>{([tf("f.set.account"),tf("f.set.appearance"),tf("f.set.calculations"),tf("f.set.sources"),tf("f.set.privacy")]).map((item,index)=><button className={index===0?"active":""} key={item}>{index===0?<UserRound/>:index===1?<Sparkles/>:index===2?<Gauge/>:index===3?<Link2/>:<ShieldCheck/>}{item}</button>)}</aside><div className="settings-content"><Card><SectionHeader eyebrow={tf("f.set.personalData")} title={tf("f.set.account")}/><div className="form-grid"><div className="field"><label htmlFor="display-name">{tf("f.set.displayName")}</label><input id="display-name" defaultValue="Leonie M."/></div><div className="field"><label htmlFor="email">{tf("f.set.email")}</label><input id="email" type="email" defaultValue="demo@fitdata-coach.de"/></div><div className="field"><label htmlFor="language">{tf("f.set.language")}</label><select id="language"><option>{localeMeta[locale].label}</option></select></div><div className="field"><label htmlFor="timezone">{tf("f.set.timezone")}</label><select id="timezone"><option>Europe/Berlin (UTC+2)</option></select></div></div><button className="secondary-button primary settings-save"><Save/> {tf("f.set.saveChanges")}</button></Card><Card><SectionHeader eyebrow={tf("f.set.portability")} title={tf("f.set.manageData")}/><div className="data-actions"><div><Download/><span><strong>{tf("f.set.export")}</strong><small>{tf("f.set.exportText")}</small></span><button className="secondary-button">{tf("f.set.requestExport")}</button></div><div className="danger-action"><Trash2/><span><strong>{tf("f.set.deleteAccount")}</strong><small>{tf("f.set.deleteText")}</small></span><button className="secondary-button danger">{tf("f.set.startDeletion")}</button></div></div></Card></div></div>
  </div></AppShell>;
}

export function SignInPage() {
  const { tc } = useLocale();
  const [showDemo, setShowDemo] = useState(true);
  return <div className="signin-page"><Image className="signin-bg" src="/auth-bg.jpg" alt="" aria-hidden="true" fill priority unoptimized sizes="100vw" /><div className="signin-brand"><span><Activity /></span><strong>FitData</strong><small>COACH</small></div><div className="signin-layout"><section className="signin-story"><Badge tone="lime"><Sparkles size={13}/> {tc("s.badge")}</Badge><h1>{tc("s.h1a")}<br/><em>{tc("s.h1b")}</em></h1><p>{tc("s.lead")}</p><div className="signin-proof"><div><strong>99,7%</strong><span>{tc("s.proof1")}</span></div><div><strong>10</strong><span>{tc("s.proof2")}</span></div><div><strong>100%</strong><span>{tc("s.proof3")}</span></div></div></section><Card className="signin-card"><p className="eyebrow">{tc("s.welcome")}</p><h2>{tc("s.signInTitle")}</h2><p>{tc("s.signInLead")}</p>{showDemo&&<div className="demo-credentials"><Info/><div><strong>{tc("s.demoAccess")}</strong><code>demo@fitdata-coach.de</code><code>FitData-Demo-2026!</code></div><button onClick={()=>setShowDemo(false)} aria-label={tc("s.dismissDemo")}>×</button></div>}<form onSubmit={(event)=>event.preventDefault()}><div className="field"><label htmlFor="signin-email">{tc("s.email")}</label><input id="signin-email" type="email" defaultValue="demo@fitdata-coach.de" autoComplete="email"/></div><div className="field"><label htmlFor="signin-password">{tc("s.password")}</label><input id="signin-password" type="password" defaultValue="FitData-Demo-2026!" autoComplete="current-password"/></div><button className="primary-button" type="submit">{tc("s.submit")} <ArrowRight/></button></form><div className="signin-footer"><ShieldCheck/><span>{tc("s.security")}</span></div><Link href="/" className="text-button">{tc("s.skip")} <ArrowRight/></Link></Card></div></div>;
}
