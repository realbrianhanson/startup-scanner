import { Flag, Calendar, Wrench, Users, DollarSign, Zap, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeArray } from "@/lib/reportHelpers";
import { ScrollReveal } from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

interface Props {
  reportData: any;
}

const WEEK_TOP_COLORS = [
  "from-primary to-primary/70",
  "from-primary/70 to-secondary",
  "from-secondary to-emerald-500/70",
  "from-emerald-500/70 to-emerald-500",
];

export const ActionPlanSection = ({ reportData }: Props) => {
  if (!reportData.action_plan) return null;

  const data = reportData.action_plan;
  const weeks = [
    { key: "week_1", data: data.week_1 },
    { key: "week_2", data: data.week_2 },
    { key: "week_3", data: data.week_3 },
    { key: "week_4", data: data.week_4 },
  ].filter(w => w.data);

  const milestones = safeArray(data.critical_milestones);
  const quickWins = safeArray(data.quick_wins);

  return (
    <ScrollReveal>
      <section id="action-plan" className="scroll-mt-28 mb-16 md:mb-20">
        <div className="h-px bg-border mb-8" />
        <h2 className="font-serif text-2xl tracking-tight mb-2">Your 30-Day Action Plan</h2>
        <p className="text-sm text-muted-foreground mb-8">A concrete roadmap based on your full analysis</p>

        {/* ── Quick Wins ── */}
        {quickWins.length > 0 && (
          <div className="mb-10 relative rounded-xl overflow-hidden bg-card border border-primary/20">
            {/* Shimmer left border */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 animate-shimmer"
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.3), hsl(var(--primary)))",
                backgroundSize: "200% 100%",
              }}
            />
            <div className="p-6 pl-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold">Start Here — Quick Wins</h3>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Do these today</p>
                </div>
              </div>
              <div className="space-y-3">
                {quickWins.map((win: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="font-mono text-lg font-bold text-primary/60 w-7 shrink-0 leading-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-semibold leading-relaxed">{win}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Horizontal Timeline Header ── */}
        {weeks.length > 0 && (
          <div className="mb-6">
            {/* Week labels + timeline line */}
            <div className="relative">
              {/* Horizontal line */}
              <div className="absolute top-4 left-0 right-0 h-[2px] bg-border" />
              {/* Gradient overlay on line */}
              <div
                className="absolute top-4 left-0 right-0 h-[2px]"
                style={{
                  background: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.3), hsl(142.1 76.2% 36.3%/0.5))",
                }}
              />

              {/* Milestone dots */}
              <div className="relative flex justify-between px-2">
                {weeks.map((_, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-[10px] h-[10px] rounded-full border-2 border-background z-10",
                        idx === 0 ? "bg-primary" : "bg-muted-foreground/40"
                      )}
                    />
                    <span className={cn(
                      "text-[10px] font-medium mt-2 uppercase tracking-wider",
                      idx === 0 ? "text-primary" : "text-muted-foreground"
                    )}>
                      Week {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Weekly Cards Grid ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {weeks.map((week, idx) => (
            <div key={week.key} className="bg-card rounded-lg border border-border/50 overflow-hidden">
              {/* Colored top bar */}
              <div className={`h-1 bg-gradient-to-r ${WEEK_TOP_COLORS[Math.min(idx, WEEK_TOP_COLORS.length - 1)]}`} />

              <div className="p-4">
                {/* Week number + theme */}
                <div className="flex items-start gap-3 mb-4">
                  <span className="font-mono text-2xl font-bold text-muted-foreground/30 leading-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-sans text-sm font-semibold leading-tight">{week.data.theme}</h3>
                  </div>
                </div>

                {/* Actions as checklist */}
                <div className="space-y-2.5">
                  {safeArray(week.data.actions).map((action: any, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{action.action}</p>
                        {action.deliverable && (
                          <Badge variant="secondary" className="text-[10px] mt-1.5 font-normal">
                            📦 {action.deliverable}
                          </Badge>
                        )}
                        {action.why && (
                          <p className="text-xs text-muted-foreground mt-1">{action.why}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Milestones ── */}
        {milestones.length > 0 && (
          <>
            <div className="border-t border-border/30 mt-4 pt-6 mb-4" />
            <h3 className="font-sans text-lg font-semibold mb-4 flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Critical Milestones
            </h3>
            <div className="relative">
              {/* Dashed connector line (desktop) */}
              <div className="hidden md:block absolute top-6 left-8 right-8 border-t border-dashed border-muted-foreground/30" />

              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {milestones.map((ms: any, i: number) => (
                  <div key={i} className="relative bg-card rounded-lg border border-border/50 p-4 text-center">
                    {/* Dot on the line */}
                    <div className="hidden md:block absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background z-10" />
                    <p className="text-sm font-semibold mb-2 mt-1">{ms.milestone}</p>
                    <Badge variant="outline" className="text-[10px] mb-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {ms.target_date}
                    </Badge>
                    {ms.success_metric && (
                      <p className="text-xs text-muted-foreground mt-1">{ms.success_metric}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Resources Needed (compact) ── */}
        {data.resources_needed && (
          <>
            <div className="border-t border-border/30 mt-6 pt-4" />
            <div className="grid grid-cols-3 gap-3">
              {data.resources_needed.budget_estimate && (
                <div className="bg-card/50 rounded-lg border border-border/30 p-3 text-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Budget</p>
                  <p className="text-sm font-semibold font-mono">{data.resources_needed.budget_estimate}</p>
                </div>
              )}
              {safeArray(data.resources_needed.tools).length > 0 && (
                <div className="bg-card/50 rounded-lg border border-border/30 p-3 text-center">
                  <Wrench className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Tools</p>
                  <p className="text-sm font-medium">{safeArray(data.resources_needed.tools).join(", ")}</p>
                </div>
              )}
              {data.resources_needed.people && (
                <div className="bg-card/50 rounded-lg border border-border/30 p-3 text-center">
                  <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">People</p>
                  <p className="text-sm font-medium">{data.resources_needed.people}</p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </ScrollReveal>
  );
};
