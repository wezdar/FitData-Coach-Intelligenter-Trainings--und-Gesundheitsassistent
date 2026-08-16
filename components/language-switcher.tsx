"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Languages } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { locales, localeMeta, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as globalThis.Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={wrapRef}>
      <button
        className="icon-button lang-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("shell.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Languages size={17} />
        <span className="lang-trigger-code">{locale.toUpperCase()}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="lang-menu"
            role="listbox"
            aria-label={t("shell.language")}
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {locales.map((item) => (
              <li key={item}>
                <button
                  role="option"
                  aria-selected={item === locale}
                  className={cn("lang-option", item === locale && "lang-option-active")}
                  onClick={() => choose(item)}
                  lang={localeMeta[item].intl}
                >
                  <span className="lang-flag" aria-hidden="true">{localeMeta[item].flag}</span>
                  <span className="lang-label">{localeMeta[item].label}</span>
                  {item === locale && <Check size={14} aria-hidden="true" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
