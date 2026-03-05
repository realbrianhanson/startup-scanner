import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CalendlyConfig {
  calendlyUrl: string;
  ctaEnabled: boolean;
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

export function useCalendly(): CalendlyConfig {
  const [config, setConfig] = useState<{ calendly_url: string; cta_enabled: string; cta_headline: string }>({
    calendly_url: "https://calendly.com/REPLACE_WITH_YOUR_LINK",
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
      const url = `${config.calendly_url}?utm_source=validifier&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}`;
      if (window.Calendly) {
        window.Calendly.initPopupWidget({ url });
      } else {
        window.open(url, "_blank");
      }
    },
    [config.calendly_url]
  );

  return {
    calendlyUrl: config.calendly_url,
    ctaEnabled: config.cta_enabled === "true",
    ctaHeadline: config.cta_headline,
    loading,
    openCalendly,
  };
}
