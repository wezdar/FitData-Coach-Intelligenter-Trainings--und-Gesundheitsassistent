"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity, BarChart3, Bell, CalendarDays, ChevronLeft, ChevronRight,
  CircleUserRound, Dumbbell, FileUp, HeartPulse, LayoutDashboard, Lightbulb,
  Menu, Search, Settings, ShieldCheck, Sparkles, Workflow, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CommandPalette } from "@/components/command-palette";
import type { TranslationKey } from "@/lib/i18n";

type NavItem = { href: string; labelKey: TranslationKey; icon: typeof LayoutDashboard };

const navigation: NavItem[] = [
  { href: "/", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/trainingsplan", labelKey: "nav.plan", icon: Dumbbell },
  { href: "/kalender", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/aktivitaeten", labelKey: "nav.activities", icon: Activity },
  { href: "/fortschritt", labelKey: "nav.progress", icon: HeartPulse },
  { href: "/datenanalyse", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/empfehlungen", labelKey: "nav.recommendations", icon: Lightbulb },
  { href: "/datenimport", labelKey: "nav.import", icon: FileUp },
  { href: "/datenpipeline", labelKey: "nav.pipeline", icon: Workflow },
  { href: "/datenqualitaet", labelKey: "nav.quality", icon: ShieldCheck },
];

const accountNavigation: NavItem[] = [
  { href: "/profil", labelKey: "nav.profile", icon: CircleUserRound },
  { href: "/einstellungen", labelKey: "nav.settings", icon: Settings },
];

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="FitData Coach Startseite">
      <span className="brand-mark"><Activity size={22} strokeWidth={2.5} /></span>
      {!collapsed && (
        <span className="brand-copy">
          <strong>FitData</strong><small>COACH</small>
        </span>
      )}
    </Link>
  );
}

function NavList({ collapsed, close }: { collapsed: boolean; close?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const renderItem = ({ href, labelKey, icon: Icon }: NavItem) => {
    const label = t(labelKey);
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={close}
        className={cn("nav-link", active && "nav-link-active")}
        title={collapsed ? label : undefined}
      >
        <Icon size={19} aria-hidden="true" />
        {!collapsed && <span>{label}</span>}
        {active && !collapsed && <motion.span layoutId="nav-active" className="nav-dot" />}
      </Link>
    );
  };

  return (
    <nav className="main-nav" aria-label={t("nav.section.analysis")}>
      <p className={cn("nav-label", collapsed && "sr-only")}>{t("nav.section.analysis")}</p>
      {navigation.map(renderItem)}
      <p className={cn("nav-label nav-label-account", collapsed && "sr-only")}>{t("nav.section.account")}</p>
      {accountNavigation.map(renderItem)}
    </nav>
  );
}

/** Opens the command palette; replaces the previously non-functional search box. */
function CommandTrigger() {
  const { t } = useLocale();
  const dispatch = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  return (
    <button className="search-box command-trigger" onClick={dispatch} aria-label={t("shell.searchHint")} aria-keyshortcuts="Meta+K">
      <Search size={17} aria-hidden="true" />
      <span className="command-trigger-label">{t("shell.search")}</span>
      <kbd className="command-trigger-kbd">⌘K</kbd>
    </button>
  );
}

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { t } = useLocale();

  return (
    <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
      <motion.aside
        className="sidebar desktop-sidebar"
        animate={{ width: collapsed ? 88 : 252 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.28 }}
      >
        <Logo collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        {!collapsed && (
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <div><strong>{t("shell.privacy.title")}</strong><span>{t("shell.privacy.subtitle")}</span></div>
          </div>
        )}
        <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={t("shell.toggleSidebar")}>
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="mobile-drawer-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label={t("shell.closeMenu")} />
            <motion.aside className="sidebar mobile-sidebar" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}>
              <div className="mobile-brand-row"><Logo /><button onClick={() => setMobileOpen(false)} aria-label={t("shell.closeMenu")}><X /></button></div>
              <NavList collapsed={false} close={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label={t("shell.openMenu")}><Menu /></button>
          <div className="topbar-title">
            <span className="title-icon"><Sparkles size={18} /></span>
            <div><h1>{title}</h1><p>{subtitle}</p></div>
          </div>
          <div className="topbar-actions">
            <CommandTrigger />
            <LanguageSwitcher />
            <button className="icon-button notification-button" aria-label={t("shell.notifications")}><Bell size={19} /><span>2</span></button>
            <Link className="user-chip" href="/profil">
              <span className="avatar">LM</span><span className="user-copy"><strong>Leonie M.</strong><small>Premium</small></span>
            </Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
