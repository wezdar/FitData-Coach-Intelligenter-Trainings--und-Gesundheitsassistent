"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE, LOCALE_STORAGE_KEY, locales, localeMeta, translate,
  type Locale, type TranslationKey,
} from "@/lib/i18n";
import { translatePage, type PageKey } from "@/lib/i18n-pages";
import { translateContent, type ContentKey } from "@/lib/i18n-content";
import { translateFeature, type FeatureKey } from "@/lib/i18n-features";
import { translateOption, type OptionKey } from "@/lib/i18n-options";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey) => string;
  /** Page-level copy (dashboard, lineage, page headers). */
  tp: (key: PageKey) => string;
  /** Content copy: demo-data labels, metric explanations, sign-in. */
  tc: (key: ContentKey) => string;
  /** Feature-page body copy. */
  tf: (key: FeatureKey) => string;
  /** Select options, small labels and demo exercise data. */
  to: (key: OptionKey) => string;
  dir: "ltr" | "rtl";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * The stored locale is external state, so it is read through
 * `useSyncExternalStore` rather than an effect: this keeps the server snapshot
 * (`DEFAULT_LOCALE`) and the hydrated client value consistent without a
 * setState-in-effect cascade, and syncs across browser tabs for free.
 */
const localeStore = {
  subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener("fitdata:locale", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("fitdata:locale", onChange);
    };
  },
  getSnapshot(): Locale {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      return isLocale(stored) ? stored : DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  },
  getServerSnapshot(): Locale {
    return DEFAULT_LOCALE;
  },
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    localeStore.subscribe, localeStore.getSnapshot, localeStore.getServerSnapshot,
  );

  useEffect(() => {
    const { dir, intl } = localeMeta[locale];
    document.documentElement.setAttribute("lang", intl.split("-")[0]);
    document.documentElement.setAttribute("dir", dir);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Private browsing / storage disabled — the choice simply won't persist.
    }
    window.dispatchEvent(new Event("fitdata:locale"));
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key: TranslationKey) => translate(locale, key),
    tp: (key: PageKey) => translatePage(locale, key),
    tc: (key: ContentKey) => translateContent(locale, key),
    tf: (key: FeatureKey) => translateFeature(locale, key),
    to: (key: OptionKey) => translateOption(locale, key),
    dir: localeMeta[locale].dir,
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside <LocaleProvider>");
  return context;
}
