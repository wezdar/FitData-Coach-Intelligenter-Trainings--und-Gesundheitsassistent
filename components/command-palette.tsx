"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, BarChart3, CalendarDays, CircleUserRound, CornerDownLeft, Dumbbell,
  FileUp, HeartPulse, LayoutDashboard, Languages, Lightbulb, Play, Search, Settings, ShieldCheck, Workflow,
} from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { locales, localeMeta } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Command = {
  id: string;
  label: string;
  group: string;
  icon: typeof Search;
  keywords: string;
  run: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mounted only while open, so query/selection reset without a sync effect.
  return <AnimatePresence>{open && <PaletteBody onClose={() => setOpen(false)} />}</AnimatePresence>;
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { t, setLocale, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const go = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const commands = useMemo<Command[]>(() => {
    const nav: { key: TranslationKey; href: string; icon: typeof Search }[] = [
      { key: "nav.overview", href: "/", icon: LayoutDashboard },
      { key: "nav.plan", href: "/trainingsplan", icon: Dumbbell },
      { key: "nav.calendar", href: "/kalender", icon: CalendarDays },
      { key: "nav.activities", href: "/aktivitaeten", icon: Activity },
      { key: "nav.progress", href: "/fortschritt", icon: HeartPulse },
      { key: "nav.analytics", href: "/datenanalyse", icon: BarChart3 },
      { key: "nav.recommendations", href: "/empfehlungen", icon: Lightbulb },
      { key: "nav.import", href: "/datenimport", icon: FileUp },
      { key: "nav.pipeline", href: "/datenpipeline", icon: Workflow },
      { key: "nav.quality", href: "/datenqualitaet", icon: ShieldCheck },
      { key: "nav.profile", href: "/profil", icon: CircleUserRound },
      { key: "nav.settings", href: "/einstellungen", icon: Settings },
    ];

    const navCommands: Command[] = nav.map((item) => ({
      id: `nav:${item.href}`,
      label: t(item.key),
      group: t("cmd.group.navigation"),
      icon: item.icon,
      keywords: `${t(item.key)} ${item.href}`,
      run: () => go(item.href),
    }));

    const actionCommands: Command[] = [
      {
        id: "action:pipeline",
        label: t("cmd.action.runPipeline"),
        group: t("cmd.group.actions"),
        icon: Play,
        keywords: `${t("cmd.action.runPipeline")} pipeline etl run`,
        run: () => go("/datenpipeline?run=1"),
      },
      {
        id: "action:import",
        label: t("cmd.action.import"),
        group: t("cmd.group.actions"),
        icon: FileUp,
        keywords: `${t("cmd.action.import")} csv json upload`,
        run: () => go("/datenimport"),
      },
      {
        id: "action:plan",
        label: t("cmd.action.generatePlan"),
        group: t("cmd.group.actions"),
        icon: Dumbbell,
        keywords: `${t("cmd.action.generatePlan")} workout plan`,
        run: () => go("/trainingsplan"),
      },
    ];

    const languageCommands: Command[] = locales
      .filter((item) => item !== locale)
      .map((item) => ({
        id: `lang:${item}`,
        label: `${localeMeta[item].flag}  ${localeMeta[item].label}`,
        group: t("cmd.group.language"),
        icon: Languages,
        keywords: `${localeMeta[item].label} ${item} language sprache langue idioma lingua язык لغة`,
        run: () => {
          setLocale(item);
          onClose();
        },
      }));

    return [...navCommands, ...actionCommands, ...languageCommands];
  }, [t, go, setLocale, locale, onClose]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) => command.keywords.toLowerCase().includes(needle));
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach((command) => {
      const bucket = map.get(command.group) ?? [];
      bucket.push(command);
      map.set(command.group, bucket);
    });
    return [...map.entries()];
  }, [filtered]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(filtered.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      filtered[active]?.run();
    }
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let flatIndex = -1;

  return (
    <motion.div
          className="cmdk-backdrop"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="cmdk-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("cmd.title")}
            initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cmdk-input-row">
              <Search size={17} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder={t("cmd.placeholder")}
                aria-label={t("cmd.placeholder")}
                aria-controls="cmdk-list"
              />
              <kbd className="cmdk-kbd">Esc</kbd>
            </div>
            <div className="cmdk-list" id="cmdk-list" ref={listRef} role="listbox" aria-label={t("cmd.title")}>
              {filtered.length === 0 && <p className="cmdk-empty">{t("cmd.empty")}</p>}
              {grouped.map(([group, items]) => (
                <div className="cmdk-group" key={group}>
                  <p className="cmdk-group-label">{group}</p>
                  {items.map((command) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        role="option"
                        aria-selected={index === active}
                        data-active={index === active}
                        className={cn("cmdk-item", index === active && "cmdk-item-active")}
                        onMouseEnter={() => setActive(index)}
                        onClick={command.run}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span>{command.label}</span>
                        {index === active && <CornerDownLeft size={14} className="cmdk-enter" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
      </motion.div>
    </motion.div>
  );
}
