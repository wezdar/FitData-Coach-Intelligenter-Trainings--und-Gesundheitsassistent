/**
 * Typed client for the FastAPI serving layer.
 *
 * The demo account is signed in automatically when no token is stored, so the
 * dashboard can show real database-backed values without a login wall. A real
 * deployment would drop `ensureSession` and require an explicit sign-in.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000/api/v1";

const TOKEN_KEY = "fitdata.token";
const DEMO_EMAIL = "demo@fitdata-coach.de";
const DEMO_PASSWORD = "FitData-Demo-2026!";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable — the token stays in memory for this page only.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* no-op */
  }
}

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new ApiError("Anmeldung fehlgeschlagen", response.status);
  }
  const data = (await response.json()) as { access_token: string };
  setToken(data.access_token);
  return data.access_token;
}

/** Returns a usable token, signing into the demo account if needed. */
export async function ensureSession(): Promise<string> {
  const existing = getToken();
  if (existing) return existing;
  return login(DEMO_EMAIL, DEMO_PASSWORD);
}

export async function apiGet<T>(path: string): Promise<T> {
  let token = await ensureSession();
  let response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });

  // A stored token can outlive its 30-minute expiry; retry once with a fresh one.
  if (response.status === 401) {
    clearToken();
    token = await ensureSession();
    response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  }
  if (!response.ok) {
    throw new ApiError(`GET ${path} fehlgeschlagen`, response.status);
  }
  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const token = await ensureSession();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError(`POST ${path} fehlgeschlagen`, response.status);
  return (await response.json()) as T;
}

/* ---------- Response shapes ---------- */

export type DashboardSummary = {
  as_of: string;
  synthetic: boolean;
  has_data: boolean;
  kpis: {
    weight_kg: number | null;
    bmi: number | null;
    healthy_weight_range_kg: [number, number] | null;
    steps_today: number;
    distance_km: number;
    active_calories_kcal: number;
    workouts_completed: number;
    workouts_planned: number;
    streak_days: number;
    week_steps: number;
    steps_change_percent: number | null;
  };
  weekly_activity: {
    date: string; steps: number; distance_km: number;
    active_calories_kcal: number; workout_minutes: number;
  }[];
  weight_series: { date: string; weight_kg: number }[];
  disclaimer: string;
};

export type PipelineStatus = {
  last_run: string; status: string; processed_records: number; rejected_records: number;
  completeness_percent: number; duplicate_count: number; invalid_measurement_count: number;
  freshness_minutes: number; duration_seconds: number;
};

export type QualityIncident = {
  id: string; run_id: string | null; detected_at: string;
  severity: "kritisch" | "warnung" | "info";
  rule: string; dataset: string; column: string | null; affected_rows: number;
  message: string; code: string; status: string; sample_rows: Record<string, unknown>[];
};

export type PipelineRunSummary = {
  id: string; trigger: string; status: string; started_at: string; finished_at: string | null;
  processed_records: number; rejected_records: number; completeness_percent: number;
  duration_seconds: number; stages: { id: string; label: string; status: string; processed: number; rejected: number }[];
};

export const getDashboardSummary = () => apiGet<DashboardSummary>("/dashboard/summary");
export const getPipelineStatus = () => apiGet<PipelineStatus>("/pipeline/status");
export const getQualityIncidents = () => apiGet<QualityIncident[]>("/pipeline/incidents");
export const getPipelineRuns = () => apiGet<PipelineRunSummary[]>("/pipeline/runs");
export const runPipeline = () => apiPost<Record<string, unknown>>("/pipeline/run");

/** URL for the Server-Sent Events stream (EventSource cannot set headers). */
export function pipelineStreamUrl(token: string, delayMs = 700): string {
  return `${API_BASE}/pipeline/run/stream?token=${encodeURIComponent(token)}&delay_ms=${delayMs}`;
}
