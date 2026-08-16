export const weeklyActivity = [
  { dayKey: "d.mon", steps: 8240, distance: 6.1, goal: 10000 },
  { dayKey: "d.tue", steps: 11280, distance: 8.3, goal: 10000 },
  { dayKey: "d.wed", steps: 9360, distance: 6.9, goal: 10000 },
  { dayKey: "d.thu", steps: 12420, distance: 9.2, goal: 10000 },
  { dayKey: "d.fri", steps: 7140, distance: 5.3, goal: 10000 },
  { dayKey: "d.sat", steps: 13790, distance: 10.2, goal: 10000 },
  { dayKey: "d.sun", steps: 6842, distance: 5.1, goal: 10000 },
];

export const weightProgress = [
  { week: "KW 22", weight: 79.8 }, { week: "KW 23", weight: 79.2 },
  { week: "KW 24", weight: 78.9 }, { week: "KW 25", weight: 78.4 },
  { week: "KW 26", weight: 78.1 }, { week: "KW 27", weight: 77.6 },
  { week: "KW 28", weight: 77.2 },
];

export const calorieData = [
  { dayKey: "d.mon", active: 480, base: 1880 }, { dayKey: "d.tue", active: 690, base: 1880 },
  { dayKey: "d.wed", active: 520, base: 1880 }, { dayKey: "d.thu", active: 760, base: 1880 },
  { dayKey: "d.fri", active: 410, base: 1880 }, { dayKey: "d.sat", active: 830, base: 1880 },
  { dayKey: "d.sun", active: 538, base: 1880 },
];

export const trainingDistribution = [
  { key: "d.strength", value: 46, color: "#c8ff3d" },
  { key: "d.endurance", value: 31, color: "#22d3ee" },
  { key: "d.mobility", value: 15, color: "#a78bfa" },
  { key: "d.recovery", value: 8, color: "#ff9a4d" },
];

export const recentActivities = [
  { typeKey: "d.strengthTraining", dateKey: "d.today", time: "07:32", duration: "52 min", value: "412 kcal", imported: false },
  { typeKey: "d.run", dateKey: "d.yesterday", time: "18:10", duration: "38 min", value: "6,2 km", imported: false },
  { typeKey: "d.walk", dateKey: "d.today", time: "12:24", duration: "31 min", value: "3.820", imported: true },
  { typeKey: "d.mobility", dateKey: "d.yesterday", time: "20:04", duration: "18 min", value: "96 kcal", imported: false },
] as const;

export const muscleLoad = [
  ["d.chest", 72], ["d.back", 86], ["d.shoulders", 58], ["d.arms", 47],
  ["d.core", 63], ["d.legs", 91], ["d.glutes", 76], ["d.calves", 42],
] as const;

export const pipelineStages: { key: string; count: string | null; countKey: string | null; tone: string }[] = [
  { key: "d.rawData", count: "12.482", countKey: null, tone: "cyan" },
  { key: "d.validation", count: "12.451", countKey: null, tone: "purple" },
  { key: "d.transformation", count: "12.438", countKey: null, tone: "orange" },
  { key: "d.warehouse", count: "12.438", countKey: null, tone: "lime" },
  { key: "d.dashboard", count: null, countKey: "d.upToDate", tone: "lime" },
];

export type LineageKind = "ingest" | "validate" | "transform" | "load" | "serve" | "present";

export type LineageStage = {
  id: string;
  labelKey: string;
  kind: LineageKind;
  descriptionKey: string;
  inputs: string[];
  outputs: string[];
  processed: number;
  rejected: number;
  completeness: number;
  freshness: string;
  duration: string;
  lastRun: string;
  airflowTask: string;
  dbtModel: string;
  table: string;
  apiEndpoint: string;
  endStatus: "success" | "warning";
  dataset: "raw" | "staging" | "analytics" | "serving" | "api" | "dashboard";
};

export const lineageStages: LineageStage[] = [
  {
    id: "raw",
    labelKey: "d.rawData",
    kind: "ingest",
    descriptionKey: "ls.raw",
    inputs: ["CSV-Upload", "JSON-Upload"],
    // Object-store bucket and table names are technical identifiers, not UI copy.
    outputs: ["minio://fitdata-raw", "raw.raw_activity_events"],
    processed: 12482, rejected: 0, completeness: 100, freshness: "4 Min.", duration: "6,1 s",
    lastRun: "08:02", airflowTask: "ingest_raw", dbtModel: "—",
    table: "raw.raw_activity_events", apiEndpoint: "POST /api/v1/imports",
    endStatus: "success", dataset: "raw",
  },
  {
    id: "validate",
    labelKey: "d.validation",
    kind: "validate",
    descriptionKey: "ls.validate",
    inputs: ["raw.raw_activity_events"],
    outputs: ["staging.staging_activities", "staging.quarantined_events"],
    processed: 12451, rejected: 31, completeness: 99.7, freshness: "5 Min.", duration: "3,4 s",
    lastRun: "08:02", airflowTask: "validate_and_stage", dbtModel: "—",
    table: "staging.staging_activities", apiEndpoint: "—",
    endStatus: "warning", dataset: "staging",
  },
  {
    id: "transform",
    labelKey: "d.transformation",
    kind: "transform",
    descriptionKey: "ls.transform",
    inputs: ["staging.staging_activities"],
    outputs: ["analytics.fct_daily_activity", "analytics.fct_weekly_progress"],
    processed: 12438, rejected: 13, completeness: 99.9, freshness: "6 Min.", duration: "48,2 s",
    lastRun: "08:02", airflowTask: "transform_dbt", dbtModel: "stg_activities → fct_daily_activity",
    table: "analytics.fct_daily_activity", apiEndpoint: "—",
    endStatus: "success", dataset: "analytics",
  },
  {
    id: "warehouse",
    labelKey: "d.warehouse",
    kind: "load",
    descriptionKey: "ls.warehouse",
    inputs: ["analytics.fct_daily_activity", "analytics.fct_weekly_progress"],
    outputs: ["serving.dashboard_summary"],
    processed: 12438, rejected: 0, completeness: 100, freshness: "6 Min.", duration: "1,2 s",
    lastRun: "08:02", airflowTask: "—", dbtModel: "dim_latest_weight",
    table: "serving.dashboard_summary", apiEndpoint: "—",
    endStatus: "success", dataset: "serving",
  },
  {
    id: "api",
    labelKey: "d.api",
    kind: "serve",
    descriptionKey: "ls.api",
    inputs: ["serving.dashboard_summary"],
    outputs: ["JSON-Response"],
    processed: 12438, rejected: 0, completeness: 100, freshness: "< 1 Min.", duration: "82 ms",
    lastRun: "08:03", airflowTask: "—", dbtModel: "—",
    table: "—", apiEndpoint: "GET /api/v1/dashboard/summary",
    endStatus: "success", dataset: "api",
  },
  {
    id: "dashboard",
    labelKey: "d.dashboard",
    kind: "present",
    descriptionKey: "ls.dashboard",
    inputs: ["GET /api/v1/dashboard/summary"],
    outputs: ["dashboard.summary"],
    processed: 12438, rejected: 0, completeness: 100, freshness: "< 1 Min.", duration: "—",
    lastRun: "08:03", airflowTask: "—", dbtModel: "—",
    table: "—", apiEndpoint: "GET /api/v1/dashboard/summary",
    endStatus: "success", dataset: "dashboard",
  },
];
