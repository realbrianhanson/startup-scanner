import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CalendlyConfig {
  calendlyUrl: string;
  ctaEnabled: boolean;
  ctaConfigured: boolean;
  ctaHeadline: string;
  loading: boolean;
  openCalendly: (utm_medium: string, utm_campaign: string) => void;
}

const CACHE_KEY = "site_config_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedConfig {
  calendly_url: string;
  cta_enabled: string;
  cta_headline: string;
  ts: number;
}

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

// Placeholder URL shipped with the template. When the stored URL still matches
// this (or is empty) we treat Calendly as "not configured" and hide all CTAs
// instead of opening a broken link. Remixers change it in Admin → CTA Settings.
export const CALENDLY_PLACEHOLDER_URL = "https://calendly.com/REPLACE_WITH_YOUR_LINK";

const CALENDLY_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
let calendlyScriptPromise: Promise<boolean> | null = null;

function loadCalendlyScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Calendly) return Promise.resolve(true);
  if (calendlyScriptPromise) return calendlyScriptPromise;

  calendlyScriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CALENDLY_SCRIPT_SRC}"]`
    );
    const handleLoad = () => resolve(!!window.Calendly);
    const handleError = () => {
      calendlyScriptPromise = null;
      resolve(false);
    };
    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });
      if (window.Calendly) resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = CALENDLY_SCRIPT_SRC;
    s.async = true;
    s.addEventListener("load", handleLoad, { once: true });
    s.addEventListener("error", handleError, { once: true });
    document.head.appendChild(s);
  });
  return calendlyScriptPromise;
}

function isSafeCalendlyUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

export function useCalendly(): CalendlyConfig {
  const [config, setConfig] = useState<{ calendly_url: string; cta_enabled: string; cta_headline: string }>({
    calendly_url: CALENDLY_PLACEHOLDER_URL,
    cta_enabled: "true",
    cta_headline: "Ready to Turn This Report Into Reality?",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache first
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedConfig = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) {
          setConfig({ calendly_url: parsed.calendly_url, cta_enabled: parsed.cta_enabled, cta_headline: parsed.cta_headline });
          setLoading(false);
          return;
        }
      } catch {}
    }

    // Fetch from DB
    supabase
      .from("site_config" as any)
      .select("key, value")
      .in("key", ["calendly_url", "cta_enabled", "cta_headline"])
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, string> = {};
          (data as any[]).forEach((row: { key: string; value: string }) => {
            map[row.key] = row.value;
          });
          const newConfig = {
            calendly_url: map.calendly_url || config.calendly_url,
            cta_enabled: map.cta_enabled || config.cta_enabled,
            cta_headline: map.cta_headline || config.cta_headline,
          };
          setConfig(newConfig);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...newConfig, ts: Date.now() }));
        }
        setLoading(false);
      });
  }, []);

  const openCalendly = useCallback(
    (utm_medium: string, utm_campaign: string) => {
      // Never open the placeholder link
      if (!config.calendly_url || config.calendly_url === CALENDLY_PLACEHOLDER_URL) {
        console.warn("Calendly URL is not configured — CTA click ignored.");
        return;
      }
      const base = isSafeCalendlyUrl(config.calendly_url);
      if (!base) {
        console.warn("Calendly URL failed validation — CTA click ignored.");
        return;
      }
      base.searchParams.set("utm_source", "validifier");
      base.searchParams.set("utm_medium", utm_medium);
      base.searchParams.set("utm_campaign", utm_campaign);
      const url = base.toString();

      loadCalendlyScript().then((ok) => {
        if (ok && window.Calendly) {
          window.Calendly.initPopupWidget({ url });
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      });
    },
    [config.calendly_url]
  );

  const ctaConfigured =
    !!config.calendly_url && config.calendly_url !== CALENDLY_PLACEHOLDER_URL;

  return {
    calendlyUrl: config.calendly_url,
    ctaEnabled: config.cta_enabled === "true" && ctaConfigured,
    ctaConfigured,
    ctaHeadline: config.cta_headline,
    loading,
    openCalendly,
  };
}
