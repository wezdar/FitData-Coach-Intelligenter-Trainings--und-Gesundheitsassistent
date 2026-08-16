"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls,
  Handle, Position, MarkerType, useReactFlow, useNodesState, useEdgesState, getBezierPath,
  type Node, type Edge, type NodeProps, type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowLeftRight, Database, Layers,
  LayoutDashboard, Moon, Pause, Play, RotateCcw, Server, ShieldCheck, Sun,
  Waypoints, Workflow, X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { lineageStages, type LineageKind, type LineageStage } from "@/lib/data";
import { ensureSession, pipelineStreamUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import type { TranslationKey } from "@/lib/i18n";

type RunStatus = "idle" | "active" | "success" | "warning" | "failure";

/** One stage event emitted by the backend SSE stream. */
type LiveStage = {
  id: string; label: string; status: "success" | "warning" | "failure";
  processed: number; rejected: number; duration_ms: number; detail: string;
  incidents: { severity: string; rule: string; message: string; affected_rows: number }[];
};

type LiveSummary = {
  run_id: string; status: string; processed_records: number; rejected_records: number;
  duplicate_count: number; completeness_percent: number; duration_seconds: number; incident_count: number;
};

const kindIcon: Record<LineageKind, typeof Database> = {
  ingest: Database,
  validate: ShieldCheck,
  transform: Waypoints,
  load: Layers,
  serve: Server,
  present: LayoutDashboard,
};

const statusLabelKey: Record<RunStatus, TranslationKey> = {
  idle: "pipeline.status.idle",
  active: "pipeline.status.active",
  success: "pipeline.status.success",
  warning: "pipeline.status.warning",
  failure: "pipeline.status.failure",
};

// The purple swatch marks the transformation stage, so it reads from the
// content dictionary rather than the status vocabulary.
const legendItems: { tone: string; key: TranslationKey | "d.transformation" }[] = [
  { tone: "cyan", key: "pipeline.status.active" },
  { tone: "lime", key: "pipeline.status.success" },
  { tone: "purple", key: "d.transformation" },
  { tone: "orange", key: "pipeline.status.warning" },
  { tone: "red", key: "pipeline.status.failure" },
];

// Layer names are product terminology and stay untranslated by design.
const datasetOptions = ["all", "raw", "staging", "analytics", "serving", "api", "dashboard"] as const;

const statusFilterOptions: ("all" | RunStatus)[] = ["all", "active", "success", "warning", "failure"];

const STAGE_X_GAP = 248;
const STAGE_DURATION_MS = 1500;
// Declared explicitly so React Flow never has to measure the DOM to reveal a
// node; measurement does not propagate reliably under this project's RSC dev server.
const NODE_WIDTH = 176;
const NODE_HEIGHT = 112;

type StageNodeData = {
  stage: LineageStage;
  status: RunStatus;
  dimmed: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
};

function toneForStatus(kind: LineageKind, status: RunStatus): string {
  if (status === "active") return kind === "transform" ? "purple" : "cyan";
  if (status === "success") return "lime";
  if (status === "warning") return "orange";
  if (status === "failure") return "red";
  return "idle";
}

function StageNode({ data }: NodeProps) {
  const { t, tp, tc } = useLocale();
  const { stage, status, dimmed, selected, onSelect } = data as StageNodeData;
  const Icon = kindIcon[stage.kind];
  const tone = toneForStatus(stage.kind, status);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(stage.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${tc(stage.labelKey as never)} – ${t(statusLabelKey[status])}`}
      aria-pressed={selected}
      title={`${tc(stage.labelKey as never)} – ${t(statusLabelKey[status])}`}
      className={cn("lineage-node", `lineage-node-${tone}`, dimmed && "lineage-node-dimmed", selected && "lineage-node-selected")}
      onClick={() => onSelect(stage.id)}
      onKeyDown={handleKeyDown}
    >
      <Handle type="target" position={Position.Left} className="lineage-handle" />
      <div className="lineage-node-top">
        <span className="lineage-node-icon"><Icon size={16} /></span>
        <span className={cn("lineage-status-dot", `lineage-status-dot-${tone}`)} aria-hidden="true" />
      </div>
      <strong>{tc(stage.labelKey as never)}</strong>
      <span className="lineage-node-metric">{stage.processed.toLocaleString("de-DE")}<small> {tp("lin.processed")}</small></span>
      {stage.rejected > 0 && <span className="lineage-node-rejected">{stage.rejected} {tp("lin.rejected")}</span>}
      <Handle type="source" position={Position.Right} className="lineage-handle" />
    </div>
  );
}

function FlowEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data } = props;
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const active = Boolean((data as { active?: boolean } | undefined)?.active);
  const reduceMotion = Boolean((data as { reduceMotion?: boolean } | undefined)?.reduceMotion);

  return (
    <>
      <path id={id} d={path} className={cn("lineage-edge", active && "lineage-edge-active")} markerEnd={markerEnd} fill="none" />
      {active && !reduceMotion && (
        <circle r="4.5" className="lineage-edge-dot">
          <animateMotion dur="1.1s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  );
}

const nodeTypes = { stage: StageNode };
const edgeTypes = { flow: FlowEdge };

function DiagramCanvas({
  activeIndex, statusFilter, datasetFilter, selectedId, onSelect, reduceMotion, liveStages,
}: {
  activeIndex: number; statusFilter: "all" | RunStatus; datasetFilter: string;
  selectedId: string | null; onSelect: (id: string) => void; reduceMotion: boolean;
  liveStages: Record<string, LiveStage>;
}) {
  const { tp } = useLocale();
  const { fitView } = useReactFlow();

  useEffect(() => {
    const frame = requestAnimationFrame(() => fitView({ padding: 0.28, duration: reduceMotion ? 0 : 500 }));
    return () => cancelAnimationFrame(frame);
  }, [fitView, reduceMotion]);

  const initialNodes: Node[] = useMemo(() => lineageStages.map((stage, index) => ({
    id: stage.id,
    type: "stage",
    position: { x: index * STAGE_X_GAP, y: 0 },
    data: { stage, status: "idle" as RunStatus, dimmed: false, selected: false, onSelect } satisfies StageNodeData,
    draggable: false,
    selectable: false,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    measured: { width: NODE_WIDTH, height: NODE_HEIGHT },
  })), [onSelect]);

  const initialEdges: Edge[] = useMemo(() => lineageStages.slice(0, -1).map((stage, index) => ({
    id: `${stage.id}-${lineageStages[index + 1].id}`,
    source: stage.id,
    target: lineageStages[index + 1].id,
    type: "flow",
    data: { active: false, reduceMotion },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8fa2b4" },
  })), [reduceMotion]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Merge only `data`; replacing whole node objects would drop React Flow's
  // internal `measured` field and leave every node permanently hidden.
  useEffect(() => {
    setNodes((current) => current.map((node, index) => {
      const stage = lineageStages[index];
      const status: RunStatus = activeIndex === -1 ? "idle" : index < activeIndex ? stage.endStatus : index === activeIndex ? "active" : "idle";
      const datasetMismatch = datasetFilter !== "all" && stage.dataset !== datasetFilter;
      const statusMismatch = statusFilter !== "all" && status !== statusFilter;
      // A live event overrides the demo figures for this stage.
      const live = liveStages[stage.id];
      const merged = live
        ? { ...stage, processed: live.processed, rejected: live.rejected }
        : stage;
      const effectiveStatus: RunStatus = live && index !== activeIndex ? live.status : status;
      return { ...node, data: { stage: merged, status: effectiveStatus, dimmed: datasetMismatch || statusMismatch, selected: selectedId === stage.id, onSelect } satisfies StageNodeData };
    }));
  }, [activeIndex, statusFilter, datasetFilter, selectedId, onSelect, setNodes, liveStages]);

  useEffect(() => {
    setEdges((current) => current.map((edge, index) => ({ ...edge, data: { active: index === activeIndex - 1, reduceMotion } })));
  }, [activeIndex, reduceMotion, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      minZoom={0.4}
      maxZoom={1.6}
      aria-label={tp("lin.title")}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} className="lineage-dots" />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}

function DetailPanel({ stage, status, onClose }: { stage: LineageStage; status: RunStatus; onClose: () => void }) {
  const { t, tp, tc, to } = useLocale();
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const tone = toneForStatus(stage.kind, status);

  return (
    <motion.aside
      className="lineage-drawer"
      role="dialog"
      aria-label={`Details zu ${tc(stage.labelKey as never)}`}
      initial={reduceMotion ? false : { x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={reduceMotion ? undefined : { x: 24, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="lineage-drawer-head">
        <div>
          <Badge tone={tone === "idle" ? "neutral" : tone}>{t(statusLabelKey[status])}</Badge>
          <h3>{tc(stage.labelKey as never)}</h3>
        </div>
        <button ref={closeRef} className="icon-button" onClick={onClose} aria-label={t("common.close")}><X size={17} /></button>
      </div>
      <p className="lineage-drawer-desc">{to(stage.descriptionKey as never)}</p>
      <div className="lineage-drawer-metrics">
        <div><span>{tp("lin.processed")}</span><strong>{stage.processed.toLocaleString("de-DE")}</strong></div>
        <div><span>{tp("lin.rejected")}</span><strong>{stage.rejected.toLocaleString("de-DE")}</strong></div>
        <div><span>{tp("lin.completeness")}</span><strong>{stage.completeness}%</strong></div>
        <div><span>{tp("lin.freshness")}</span><strong>{stage.freshness}</strong></div>
        <div><span>{tp("lin.runtime")}</span><strong>{stage.duration}</strong></div>
        <div><span>{tp("lin.lastRun")}</span><strong>{stage.lastRun}</strong></div>
      </div>
      <dl className="lineage-drawer-lineage">
        <div><dt>{tp("lin.inputs")}</dt><dd>{stage.inputs.map((item) => <code key={item}>{item}</code>)}</dd></div>
        <div><dt>{tp("lin.outputs")}</dt><dd>{stage.outputs.map((item) => <code key={item}>{item}</code>)}</dd></div>
        <div><dt>{tp("lin.airflowTask")}</dt><dd><code>{stage.airflowTask}</code></dd></div>
        <div><dt>{tp("lin.dbtModel")}</dt><dd><code>{stage.dbtModel}</code></dd></div>
        <div><dt>{tp("lin.table")}</dt><dd><code>{stage.table}</code></dd></div>
        <div><dt>{tp("lin.apiEndpoint")}</dt><dd><code>{stage.apiEndpoint}</code></dd></div>
      </dl>
    </motion.aside>
  );
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function LineageBoard() {
  const { t, tp, tc } = useLocale();
  const reduceMotion = Boolean(useReducedMotion());
  const [viewState, setViewState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | RunStatus>("all");
  const [datasetFilter, setDatasetFilter] = useState("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [liveStages, setLiveStages] = useState<Record<string, LiveStage>>({});
  const [liveSummary, setLiveSummary] = useState<LiveSummary | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const stepTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setViewState("ready"), 650);
    return () => window.clearTimeout(t);
  }, []);

  const finished = activeIndex >= lineageStages.length;
  const isRunning = playing && !finished && viewState === "ready";

  useEffect(() => {
    if (!isRunning) return undefined;
    const duration = reduceMotion ? 250 : STAGE_DURATION_MS / speed;
    stepTimer.current = window.setTimeout(() => setActiveIndex((index) => index + 1), duration);
    return () => { if (stepTimer.current) window.clearTimeout(stepTimer.current); };
  }, [isRunning, activeIndex, speed, reduceMotion]);

  useEffect(() => {
    if (!isRunning) return undefined;
    tickTimer.current = window.setInterval(() => setElapsedMs((ms) => ms + 100), 100);
    return () => { if (tickTimer.current) window.clearInterval(tickTimer.current); };
  }, [isRunning]);

  // Close any open stream when the component unmounts.
  useEffect(() => () => sourceRef.current?.close(), []);

  /** Execute the real pipeline and follow it over Server-Sent Events. */
  const startLiveRun = async () => {
    setLiveError(null);
    setLiveStages({});
    setLiveSummary(null);
    setActiveIndex(-1);
    setElapsedMs(0);
    setPlaying(true);
    try {
      const token = await ensureSession();
      sourceRef.current?.close();
      const source = new EventSource(pipelineStreamUrl(token, reduceMotion ? 120 : 700));
      sourceRef.current = source;

      source.onmessage = (message) => {
        const payload = JSON.parse(message.data) as Record<string, unknown>;
        const kind = payload.event as string;
        if (kind === "stage") {
          const stage = payload as unknown as LiveStage;
          setLiveStages((current) => ({ ...current, [stage.id]: stage }));
          setActiveIndex(lineageStages.findIndex((item) => item.id === stage.id));
        } else if (kind === "run_finished") {
          setLiveSummary(payload as unknown as LiveSummary);
          setActiveIndex(lineageStages.length);
          setPlaying(false);
          source.close();
        } else if (kind === "error") {
          setLiveError(String(payload.message ?? tp("lin.streamError")));
          setPlaying(false);
          source.close();
        }
      };
      source.onerror = () => {
        setLiveError(tp("lin.streamError"));
        setPlaying(false);
        source.close();
      };
    } catch {
      setLiveError(tp("lin.startError"));
      setPlaying(false);
    }
  };

  const handlePlay = () => {
    if (mode === "live") { void startLiveRun(); return; }
    if (viewState !== "ready") return;
    if (finished) { setActiveIndex(0); setElapsedMs(0); }
    else if (activeIndex === -1) setActiveIndex(0);
    setPlaying(true);
  };
  const handlePause = () => { sourceRef.current?.close(); setPlaying(false); };
  const handleRestart = () => {
    sourceRef.current?.close();
    setPlaying(false); setActiveIndex(-1); setElapsedMs(0); setSelectedId(null);
    setLiveStages({}); setLiveSummary(null); setLiveError(null);
  };

  const selectedStage = selectedId ? lineageStages.find((stage) => stage.id === selectedId) ?? null : null;
  const selectedStatus: RunStatus = useMemo(() => {
    if (!selectedStage) return "idle";
    const index = lineageStages.findIndex((stage) => stage.id === selectedStage.id);
    return activeIndex === -1 ? "idle" : index < activeIndex ? selectedStage.endStatus : index === activeIndex ? "active" : "idle";
  }, [selectedStage, activeIndex]);

  const activeStageLabel = activeIndex === -1
    ? tp("lin.ready")
    : activeIndex >= lineageStages.length
      ? tp("lin.finished")
      : tc(lineageStages[activeIndex].labelKey as never);

  return (
    <Card className="lineage-card">
      <div className="lineage-toolbar">
        <div className="lineage-toolbar-left">
          <SectionHeader eyebrow={lineageStages.map((item) => tc(item.labelKey as never)).join(" → ")} title={tp("lin.execution")} />
          <div className="lineage-toolbar-badges">
            <div className="lineage-mode" role="group" aria-label={tp("lin.execution")}>
              <button className={mode === "demo" ? "active" : ""} onClick={() => { handleRestart(); setMode("demo"); }}>Demo</button>
              <button className={mode === "live" ? "active" : ""} onClick={() => { handleRestart(); setMode("live"); }}>Live</button>
            </div>
            {mode === "live"
              ? <Badge tone="cyan"><i className="lineage-live-dot" aria-hidden="true" /> {tp("lin.liveMode")}</Badge>
              : <Badge tone="neutral">{tp("lin.demoMode")}</Badge>}
          </div>
        </div>
        <div className="lineage-toolbar-right">
          <div className="lineage-devtoggle" role="group" aria-label={tp("lin.viewState")}>
            <button className={viewState === "ready" || viewState === "loading" ? "active" : ""} onClick={() => setViewState("loading")}>{tp("lin.ready")}</button>
            <button className={viewState === "empty" ? "active" : ""} onClick={() => { setViewState("empty"); setPlaying(false); }}>{t("common.empty").split(" ")[0]}</button>
            <button className={viewState === "error" ? "active" : ""} onClick={() => { setViewState("error"); setPlaying(false); }}>{tp("lin.failure")}</button>
          </div>
          <button className="icon-button" onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))} aria-label={theme === "dark" ? tp("lin.lightDiagram") : tp("lin.darkDiagram")}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      <div className="lineage-controls">
        <div className="lineage-transport">
          <button className="icon-button" onClick={isRunning ? handlePause : handlePlay} aria-label={isRunning ? t("pipeline.pause") : t("pipeline.run")} disabled={viewState !== "ready"}>
            {isRunning ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button className="icon-button" onClick={handleRestart} aria-label={t("pipeline.restart")} disabled={viewState !== "ready"}>
            <RotateCcw size={16} />
          </button>
          <div className="segmented lineage-speed" role="group" aria-label={tp("lin.speed")}>
            {[0.5, 1, 2].map((value) => (
              <button key={value} className={speed === value ? "active" : ""} onClick={() => setSpeed(value)}>{value}×</button>
            ))}
          </div>
        </div>
        <div className="lineage-status-line">
          <span className="lineage-active-label"><Activity size={13} /> {activeStageLabel}</span>
          <span className="lineage-timestamp">{tp("lin.runtime")} {formatElapsed(elapsedMs)}</span>
        </div>
        <div className="lineage-filters">
          <label className="field compact"><span className="sr-only">{t("common.details")}</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | RunStatus)}>
              {statusFilterOptions.map((option) => <option key={option} value={option}>{option === "all" ? tp("lin.allStatus") : t(statusLabelKey[option])}</option>)}
            </select>
          </label>
          <label className="field compact"><span className="sr-only">{t("common.details")}</span>
            <select value={datasetFilter} onChange={(event) => setDatasetFilter(event.target.value)}>
              {datasetOptions.map((option) => <option key={option} value={option}>{option === "all" ? tp("lin.allDatasets") : option.charAt(0).toUpperCase() + option.slice(1)}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className={cn("lineage-canvas-wrap", `lineage-theme-${theme}`)}>
        {viewState === "loading" && (
          <div className="lineage-skeleton" aria-live="polite" aria-busy="true">
            {lineageStages.map((stage) => <div className="lineage-skeleton-node" key={stage.id} />)}
          </div>
        )}
        {viewState === "empty" && (
          <div className="lineage-empty">
            <Workflow size={30} />
            <strong>{tp("lin.noData")}</strong>
            <p>{tp("lin.noDataHint")}</p>
          </div>
        )}
        {viewState === "error" && (
          <div className="lineage-empty lineage-error">
            <AlertTriangle size={30} />
            <strong>{tp("lin.loadError")}</strong>
            <p>{tp("lin.loadErrorHint")}</p>
            <button className="secondary-button" onClick={() => setViewState("loading")}>{tp("lin.reload")}</button>
          </div>
        )}
        {viewState === "ready" && (
          <div className="lineage-canvas" style={{ height: 300 }}>
            <ReactFlowProvider>
              <DiagramCanvas
                activeIndex={activeIndex}
                statusFilter={statusFilter}
                datasetFilter={datasetFilter}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
                reduceMotion={reduceMotion}
                liveStages={liveStages}
              />
            </ReactFlowProvider>
            <AnimatePresence>
              {selectedStage && <DetailPanel stage={selectedStage} status={selectedStatus} onClose={() => setSelectedId(null)} />}
            </AnimatePresence>
          </div>
        )}
      </div>

      {liveError && (
        <div className="form-error" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} /> {liveError}
        </div>
      )}

      {liveSummary && (
        <div className="pipeline-metrics" style={{ marginTop: 12 }}>
          <div><span>{tp("recent.status")}</span><strong className={liveSummary.rejected_records ? "warning-text" : "success-text"}>{liveSummary.status}</strong></div>
          <div><span>{tp("lin.processed")}</span><strong>{liveSummary.processed_records.toLocaleString("de-DE")}</strong></div>
          <div><span>{tp("lin.rejected")}</span><strong>{liveSummary.rejected_records.toLocaleString("de-DE")}</strong></div>
          <div><span>{tp("lin.completeness")}</span><strong>{liveSummary.completeness_percent}%</strong></div>
          <div><span>{tp("lin.runtime")}</span><strong>{liveSummary.duration_seconds}s</strong></div>
        </div>
      )}

      <div className="legend-row lineage-legend">
        {legendItems.map((item) => <span key={item.key}><i className={`dot ${item.tone}`} />{item.key === "d.transformation" ? tc(item.key) : t(item.key)}</span>)}
      </div>
    </Card>
  );
}

export function PipelineLineagePage() {
  const { tp } = useLocale();
  return (
    <AppShell title={tp("lin.title")} subtitle={tp("lin.subtitle")}>
      <div className="feature-page">
        <div className="page-intro">
          <div>
            <Badge tone="lime">{tp("lin.badge")}</Badge>
            <h2>{tp("lin.heading")}</h2>
            <p>{tp("lin.intro")}</p>
          </div>
        </div>
        <LineageBoard />
        <div className="lineage-a11y-note"><ArrowLeftRight size={14} /> {tp("lin.a11yNote")}</div>
      </div>
    </AppShell>
  );
}
