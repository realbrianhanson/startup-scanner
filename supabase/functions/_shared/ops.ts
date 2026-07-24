// Shared operational-event helper for edge functions.
// Callers pass only allowlisted category/event_name/error_code plus bounded
// safe metadata. Never include emails, names, prompts, user prose, URLs,
// Stripe ids, or raw error messages.

type SupabaseAdminClient = {
  from: (t: string) => any;
};

export type OpsSeverity = "info" | "warning" | "critical";

const ID_RE = /^[a-z0-9_]{1,64}$/;
const NAME_RE = /^[a-z0-9_]{1,80}$/;
const CODE_RE = /^[A-Za-z0-9_.-]{1,80}$/;
const FN_RE = /^[a-z0-9_-]{1,80}$/;

function boundedMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta) return out;
  let count = 0;
  for (const k of Object.keys(meta)) {
    if (count >= 20) break;
    if (!/^[a-z0-9_]{1,40}$/.test(k)) continue;
    const v = meta[k];
    if (v == null) { out[k] = null; count++; continue; }
    if (typeof v === "boolean" || typeof v === "number") {
      if (typeof v === "number" && !Number.isFinite(v)) continue;
      out[k] = v; count++; continue;
    }
    if (typeof v === "string") {
      out[k] = v.slice(0, 200); count++; continue;
    }
  }
  try {
    if (JSON.stringify(out).length > 3500) return {};
  } catch { return {}; }
  return out;
}

export async function logOpsEvent(
  supabase: SupabaseAdminClient,
  args: {
    severity: OpsSeverity;
    category: string;
    event_name: string;
    function_name?: string;
    error_code?: string;
    user_id?: string | null;
    project_id?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    if (!["info", "warning", "critical"].includes(args.severity)) return;
    if (!ID_RE.test(args.category)) return;
    if (!NAME_RE.test(args.event_name)) return;
    if (args.function_name && !FN_RE.test(args.function_name)) return;
    if (args.error_code && !CODE_RE.test(args.error_code)) return;
    await supabase.from("operational_events").insert({
      severity: args.severity,
      category: args.category,
      event_name: args.event_name,
      function_name: args.function_name ?? null,
      error_code: args.error_code ?? null,
      user_id: args.user_id ?? null,
      project_id: args.project_id ?? null,
      metadata: boundedMeta(args.metadata),
    });
  } catch (_e) {
    // never throw from ops logging
  }
}

/**
 * Record a server-side authoritative analytics event. Only include safe
 * property keys; no PII, no user text, no ids from third parties.
 */
export async function logAnalyticsEvent(
  supabase: SupabaseAdminClient,
  args: {
    event_name: string;
    user_id?: string | null;
    properties?: Record<string, unknown>;
    page_url?: string;
  },
): Promise<void> {
  try {
    if (!NAME_RE.test(args.event_name)) return;
    await supabase.from("analytics_events").insert({
      event_name: args.event_name,
      event_properties: boundedMeta(args.properties),
      page_url: (args.page_url ?? "server").slice(0, 200),
      user_id: args.user_id ?? null,
    });
  } catch (_e) {
    // never throw
  }
}

export function durationBucket(ms: number): "under_60s" | "under_2m" | "under_5m" | "over_5m" {
  if (ms < 60_000) return "under_60s";
  if (ms < 120_000) return "under_2m";
  if (ms < 300_000) return "under_5m";
  return "over_5m";
}