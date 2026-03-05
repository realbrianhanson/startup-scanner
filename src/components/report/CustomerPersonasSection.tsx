import { XCircle, Sparkles, ArrowRight, MessageCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";
import { cn } from "@/lib/utils";

interface Props {
  reportData: any;
}

const AVATAR_BG = ["bg-primary", "bg-emerald-500", "bg-amber-500"];
const PRIORITY_LABELS = [
  { text: "1st Target", variant: "default" as const },
  { text: "2nd Target", variant: "secondary" as const },
  { text: "3rd Target", variant: "outline" as const },
];

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

export const CustomerPersonasSection = ({ reportData }: Props) => {
  if (!reportData.customer_personas || !Array.isArray(reportData.customer_personas) || reportData.customer_personas.length === 0) return null;

  return (
    <ReportSectionCard id="customer-personas" title="Your Target Customers">
      <p className="text-sm text-muted-foreground">Meet the people most likely to buy from you</p>

      {/* Priority callout */}
      {reportData.customer_personas[0] && (
        <div className="border-l-2 border-l-primary pl-5 py-3">
          <h3 className="font-sans text-base font-semibold mb-1">Start with {reportData.customer_personas[0].name}</h3>
          <p className="text-sm text-muted-foreground">{reportData.customer_personas[0].priority_reason}</p>
        </div>
      )}

      {/* Persona cards */}
      <div className="space-y-8">
        {reportData.customer_personas.map((persona: any, idx: number) => (
          <div key={idx} className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* ── Card Header ── */}
            <div className="p-5 pb-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-white font-mono text-lg font-bold shrink-0",
                  AVATAR_BG[Math.min(idx, AVATAR_BG.length - 1)]
                )}>
                  {getInitials(persona.name || `P${idx + 1}`)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-lg font-semibold">{persona.name}</h3>
                    <Badge variant={PRIORITY_LABELS[Math.min(idx, PRIORITY_LABELS.length - 1)].variant} className="text-[10px] shrink-0">
                      {PRIORITY_LABELS[Math.min(idx, PRIORITY_LABELS.length - 1)].text}
                    </Badge>
                  </div>
                  {persona.job && <p className="text-sm text-muted-foreground mt-0.5">{persona.job}</p>}

                  {/* Demographic pills */}
                  <div className="flex flex-wrap items-center gap-1 mt-2 text-xs text-muted-foreground">
                    {[persona.age, persona.job, persona.income, persona.location].filter(Boolean).map((item: string, i: number, arr: string[]) => (
                      <span key={i} className="flex items-center gap-1">
                        <span>{item}</span>
                        {i < arr.length - 1 && <span className="text-muted-foreground/40">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Values & personality tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(Array.isArray(persona.values) ? persona.values : [persona.values]).filter(Boolean).map((v: string, i: number) => (
                  <span key={`v-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{v}</span>
                ))}
                {(Array.isArray(persona.personality) ? persona.personality : [persona.personality]).filter(Boolean).map((p: string, i: number) => (
                  <span key={`p-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-border/30" />

            {/* ── Pain Points as sticky-note cards ── */}
            {persona.pain_points?.length > 0 && (
              <div className="p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pain Points</h4>
                <div className="grid md:grid-cols-3 gap-2.5">
                  {persona.pain_points.map((pp: any, i: number) => (
                    <div key={i} className="bg-red-500/[0.04] border border-red-500/10 rounded-lg p-3 relative">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold leading-snug">{pp.pain}</p>
                          {pp.impact && <p className="text-xs text-muted-foreground mt-1">{pp.impact}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Current vs Dream ── */}
            {(persona.current_solution || persona.dream_outcome) && (
              <>
                <div className="border-t border-border/30" />
                <div className="p-5">
                  <div className="grid md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
                    {/* Current */}
                    <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-1">Current Solution</p>
                          <p className="text-sm">{persona.current_solution}</p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex flex-col items-center gap-1">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="text-[9px] font-medium text-primary uppercase tracking-wider whitespace-nowrap">Your Opportunity</span>
                    </div>
                    <div className="flex md:hidden items-center justify-center gap-2 text-primary">
                      <ArrowRight className="h-3 w-3 rotate-90" />
                      <span className="text-[9px] font-medium uppercase tracking-wider">Your Opportunity</span>
                    </div>

                    {/* Dream */}
                    <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider mb-1">Dream Outcome</p>
                          <p className="text-sm">{persona.dream_outcome}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Objections as conversation ── */}
            {persona.objections?.length > 0 && (
              <>
                <div className="border-t border-border/30" />
                <div className="p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3" /> Objections & Responses
                  </h4>
                  <div className="space-y-4">
                    {persona.objections.map((obj: any, i: number) => {
                      const matchingAngle = persona.closing_angles?.find(
                        (a: any) => a.addresses?.toLowerCase() === obj.objection?.toLowerCase() || 
                                    a.addresses?.toLowerCase().includes(obj.objection?.slice(0, 20)?.toLowerCase())
                      );
                      return (
                        <div key={i} className="space-y-2">
                          {/* Objection bubble (left) */}
                          <div className="flex items-start gap-2 max-w-[85%]">
                            <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
                              <p className="text-sm font-medium">"{obj.objection}"</p>
                            </div>
                          </div>
                          {/* Root cause */}
                          <p className="text-xs text-muted-foreground italic pl-4">Root cause: {obj.root_cause}</p>
                          {/* Response bubble (right) — from closing angles */}
                          {matchingAngle && (
                            <div className="flex justify-end">
                              <div className="bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                  {matchingAngle.angle}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── Remaining closing angles (not matched above) ── */}
            {persona.closing_angles?.length > 0 && (
              <>
                <div className="border-t border-border/30" />
                <div className="p-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Closing Angles</h4>
                  <div className="space-y-2">
                    {persona.closing_angles.map((angle: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">{angle.angle}</p>
                          {angle.addresses && <p className="text-xs text-muted-foreground mt-0.5">Addresses: {angle.addresses}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Proof & urgency footer ── */}
            {(persona.proof_needed || persona.urgency_trigger) && (
              <>
                <div className="border-t border-border/30" />
                <div className="px-5 py-3 bg-muted/30 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  {persona.proof_needed && (
                    <span><span className="font-semibold text-foreground">Proof needed:</span> <span className="text-muted-foreground">{persona.proof_needed}</span></span>
                  )}
                  {persona.urgency_trigger && (
                    <span><span className="font-semibold text-foreground">Urgency trigger:</span> <span className="text-muted-foreground">{persona.urgency_trigger}</span></span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </ReportSectionCard>
  );
};
