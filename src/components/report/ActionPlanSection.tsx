import { Flag, Calendar, Wrench, Users, DollarSign, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeArray } from "@/lib/reportHelpers";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Props {
  reportData: any;
}

const WEEK_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-muted text-muted-foreground",
  "bg-accent text-accent-foreground",
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

  return (
    <ScrollReveal>
      <section id="action-plan" className="scroll-mt-28 mb-16 md:mb-20">
        <div className="h-px bg-border mb-8" />
        <h2 className="font-serif text-2xl tracking-tight mb-2">Your 30-Day Action Plan</h2>
        <p className="text-sm text-muted-foreground mb-8">A concrete roadmap based on your full analysis</p>

        {/* Quick Wins — prominent card */}
        {safeArray(data.quick_wins).length > 0 && (
          <div className="mb-8 rounded-lg p-5 bg-card border border-emerald-500/20"
            style={{ borderImage: "linear-gradient(to right, hsl(var(--primary)), hsl(142.1 76.2% 36.3%)) 1", borderWidth: "1px", borderStyle: "solid" }}
          >
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Wins — Start Here
            </h3>
            <div className="space-y-2">
              {safeArray(data.quick_wins).map((win: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{win}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Timeline — vertical line on the left */}
        <div className="relative">
          {/* Continuous vertical line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-primary/30 rounded-full" />

          <div className="space-y-8">
            {weeks.map((week, idx) => (
              <div key={week.key} className="relative pl-8">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-[11px] h-[11px] rounded-full bg-primary border-2 border-background" />

                {/* Week header */}
                <div className="mb-4 flex items-center gap-2">
                  <Badge className={`text-[10px] ${WEEK_COLORS[Math.min(idx, WEEK_COLORS.length - 1)]}`}>
                    Week {idx + 1}
                  </Badge>
                  <h3 className="font-sans text-lg font-semibold">{week.data.theme}</h3>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {safeArray(week.data.actions).map((action: any, i: number) => (
                    <div key={i} className="flex gap-4 py-2 border-b border-border/30 last:border-0 relative">
                      {/* Small circle on timeline */}
                      <div className="absolute -left-[23px] top-3.5 w-[5px] h-[5px] rounded-full bg-primary/50" />
                      <span className="font-mono text-xs text-muted-foreground w-16 shrink-0 mt-0.5">{action.day}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.action}</p>
                        {action.deliverable && (
                          <p className="text-xs text-primary mt-1">Deliverable: {action.deliverable}</p>
                        )}
                        {action.why && (
                          <p className="text-xs text-muted-foreground mt-0.5">Based on: {action.why}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Milestones */}
        {safeArray(data.critical_milestones).length > 0 && (
          <>
            <div className="border-t border-border/30 mt-8 pt-6" />
            <div>
              <h3 className="font-sans text-lg font-semibold mb-4 flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" />
                Critical Milestones
              </h3>
              <div className="space-y-3">
                {safeArray(data.critical_milestones).map((ms: any, i: number) => (
                  <div key={i} className="flex gap-4 py-2 border-b border-border/30 last:border-0">
                    <span className="font-mono text-xs text-muted-foreground w-20 shrink-0 mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {ms.target_date}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{ms.milestone}</p>
                      {ms.success_metric && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ms.success_metric}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Resources Needed */}
        {data.resources_needed && (
          <>
            <div className="border-t border-border/30 mt-6 pt-6" />
            <div>
              <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-4">Resources Needed</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {data.resources_needed.budget_estimate && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Budget
                    </p>
                    <p className="text-sm font-medium">{data.resources_needed.budget_estimate}</p>
                  </div>
                )}
                {safeArray(data.resources_needed.tools).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> Tools
                    </p>
                    <ul className="space-y-1">
                      {safeArray(data.resources_needed.tools).map((tool: string, i: number) => (
                        <li key={i} className="text-sm">{tool}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.resources_needed.people && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" /> People
                    </p>
                    <p className="text-sm">{data.resources_needed.people}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </ScrollReveal>
  );
};
