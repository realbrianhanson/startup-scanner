import { supabase } from '@/integrations/supabase/client';
import { hasAnalyticsConsent } from '@/components/CookieConsent';

/**
 * First-party analytics. See docs/TRACKING_PLAN.md for the canonical event
 * contract. Rules:
 *   - Never send emails, names, user prose, project ids, URLs users typed,
 *     raw error messages, Stripe ids, or secrets.
 *   - First-party events are essential for the service and always logged.
 *   - External gtag is consent-gated.
 */

const MAX_KEY_LEN = 40;
const MAX_STRING_LEN = 200;
const MAX_ARRAY_LEN = 20;
const MAX_KEYS = 25;
const MAX_PAYLOAD_BYTES = 4000;
const KEY_RE = /^[a-z0-9_]{1,40}$/;
const SESSION_KEY = 'validifier.session.v1';
const CACHED_USER_TTL_MS = 5 * 60 * 1000;

type SessionCtx = {
  session_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer_host?: string;
  viewport?: 'mobile' | 'tablet' | 'desktop';
};

let cachedUserId: string | null = null;
let cachedUserAt = 0;
let authWired = false;

function sanitizeUtm(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const clean = raw.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 60);
  return clean || undefined;
}

function viewportCategory(w: number): 'mobile' | 'tablet' | 'desktop' {
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function initSessionCtx(): SessionCtx {
  if (typeof window === 'undefined') {
    return { session_id: 'ssr' };
  }
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return JSON.parse(existing) as SessionCtx;
  } catch { /* ignore */ }

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const ctx: SessionCtx = {
    session_id: crypto.randomUUID(),
    utm_source: sanitizeUtm(params.get('utm_source')),
    utm_medium: sanitizeUtm(params.get('utm_medium')),
    utm_campaign: sanitizeUtm(params.get('utm_campaign')),
    utm_content: sanitizeUtm(params.get('utm_content')),
    utm_term: sanitizeUtm(params.get('utm_term')),
    viewport: viewportCategory(window.innerWidth || 1024),
  };
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.hostname && ref.hostname !== window.location.hostname) {
        ctx.referrer_host = ref.hostname.slice(0, 100);
      }
    }
  } catch { /* ignore */ }

  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(ctx)); } catch { /* ignore */ }
  return ctx;
}

function wireAuth() {
  if (authWired) return;
  authWired = true;
  supabase.auth.getSession().then(({ data }) => {
    cachedUserId = data.session?.user?.id ?? null;
    cachedUserAt = Date.now();
  }).catch(() => {});
  supabase.auth.onAuthStateChange((_evt, session) => {
    cachedUserId = session?.user?.id ?? null;
    cachedUserAt = Date.now();
  });
}

function getUserId(): string | null {
  wireAuth();
  if (Date.now() - cachedUserAt < CACHED_USER_TTL_MS) return cachedUserId;
  return cachedUserId;
}

function sanitizeValue(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === 'boolean' || typeof v === 'number') {
    return Number.isFinite(v as number) || typeof v === 'boolean' ? v : null;
  }
  if (typeof v === 'string') {
    return v.length > MAX_STRING_LEN ? v.slice(0, MAX_STRING_LEN) : v;
  }
  if (Array.isArray(v)) {
    return v.slice(0, MAX_ARRAY_LEN).map((x) => {
      if (x == null) return null;
      if (typeof x === 'string') return x.slice(0, MAX_STRING_LEN);
      if (typeof x === 'number' || typeof x === 'boolean') return x;
      return null;
    }).filter((x) => x !== null);
  }
  return null;
}

function sanitizeProps(input?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!input) return out;
  let count = 0;
  for (const rawKey of Object.keys(input)) {
    if (count >= MAX_KEYS) break;
    const key = rawKey.toLowerCase().slice(0, MAX_KEY_LEN);
    if (!KEY_RE.test(key)) continue;
    const val = sanitizeValue(input[rawKey]);
    if (val === null && input[rawKey] !== null) continue;
    out[key] = val;
    count++;
  }
  return out;
}

function withContext(props: Record<string, unknown>): Record<string, unknown> {
  const ctx = initSessionCtx();
  const merged: Record<string, unknown> = { ...props };
  merged.session_id = ctx.session_id;
  if (ctx.viewport) merged.viewport = ctx.viewport;
  if (ctx.utm_source) merged.utm_source = ctx.utm_source;
  if (ctx.utm_medium) merged.utm_medium = ctx.utm_medium;
  if (ctx.utm_campaign) merged.utm_campaign = ctx.utm_campaign;
  if (ctx.utm_content) merged.utm_content = ctx.utm_content;
  if (ctx.utm_term) merged.utm_term = ctx.utm_term;
  if (ctx.referrer_host) merged.referrer_host = ctx.referrer_host;
  return merged;
}

function boundedPayload(props: Record<string, unknown>): Record<string, unknown> {
  try {
    const s = JSON.stringify(props);
    if (s.length <= MAX_PAYLOAD_BYTES) return props;
  } catch { return {}; }
  // Drop optional fields until under cap.
  const clone: Record<string, unknown> = { ...props };
  for (const k of Object.keys(clone)) {
    if (k === 'session_id') continue;
    delete clone[k];
    try {
      if (JSON.stringify(clone).length <= MAX_PAYLOAD_BYTES) return clone;
    } catch { return {}; }
  }
  return { session_id: props.session_id ?? 'unknown' };
}

export const trackEvent = (eventName: string, properties?: Record<string, unknown>): void => {
  if (typeof window === 'undefined') return;
  const name = String(eventName || '').toLowerCase().slice(0, 80);
  if (!/^[a-z0-9_]{1,80}$/.test(name)) return;

  // Consent-gated external analytics — payload is safe by construction.
  try {
    if (hasAnalyticsConsent() && (window as any).gtag) {
      (window as any).gtag('event', name, properties || {});
    }
  } catch { /* ignore */ }

  try {
    const clean = sanitizeProps(properties);
    const withCtx = withContext(clean);
    const payload = boundedPayload(withCtx);

    const path = (window.location.pathname || '/').slice(0, 200);
    const userId = getUserId();

    supabase
      .from('analytics_events')
      .insert({
        event_name: name,
        event_properties: payload,
        page_url: path,
        user_id: userId,
      } as any)
      .then(() => {}, () => {});
  } catch {
    // Analytics must never break the app.
  }
};

/** Track a route change. Called by the top-level page tracker. */
export const trackPageView = (pathname: string) => {
  trackEvent('page_viewed', { path: pathname.slice(0, 200) });
};
