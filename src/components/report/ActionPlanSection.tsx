import { Rocket, Zap, CheckCircle2, Flag, Calendar, Wrench, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeArray } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

const weekColors = [
  { bg: "from-primary/[0.08] to-primary/[0.03]", border: "border-primary/20", accent: "bg-primary", text: "text-primary" },
  { bg: "from-secondary/[0.08] to-secondary/[0.03]", border: "border-secondary/20", accent: "bg-secondary", text: "text-secondary" },
  { bg: "from-success/[0.08] to-success/[0.03]", border: "border-success/20", accent: "bg-success", text: "text-success" },
  { bg: "from-warning/[0.08] to-warning/[0.03]", border: "border-warning/20", accent: "bg-warning", text: "text-warning" },
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
    <div id="action-plan" className="relative rounded-2xl scroll-mt-28 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-success to-warning rounded-t-2xl" />
      <div className="absolute inset-0 rounded-2xl border-2 border-primary/15" />

      <div className="relative p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-success/20 border border-primary/20 shadow-lg shadow-primary/5">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your 30-Day Action Plan</h2>
              <p className="text-xs text-muted-foreground mt-0.5">A concrete roadmap based on your full analysis</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-primary to-success text-primary-foreground border-0 px-3 py-1 text-xs font-semibold shadow-md">
            Personalized Roadmap
          </Badge>
        </div>

        {/* Quick Wins — "Start Here" callout */}
        {safeArray(data.quick_wins).length > 0 && (
          <div className="p-5 rounded-xl bg-gradient-to-r from-success/[0.08] to-success/[0.03] border-2 border-success/20 relative">
            <div className="absolute -top-3 left-4">
              <Badge className="bg-success text-success-foreground border-0 px-3 py-1 text-xs font-bold shadow-md">
                <Zap className="h-3 w-3 mr-1" />
                START HERE — Quick Wins
              </Badge>
            </div>
            <div className="mt-2 space-y-2">
              {safeArray(data.quick_wins).map((win: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-1" />
                  <p className="text-sm text-foreground/90 font-medium">{win}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Timeline */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-success/30 to-warning/30 hidden md:block" />

          <div className="space-y-6">
            {weeks.map((week, idx) => {
              const color = weekColors[idx] || weekColors[0];
              return (
                <div key={week.key} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-3 top-5 w-3 h-3 rounded-full ${color.accent} border-2 border-background shadow-md z-10 hidden md:block`} />

                  <div className={`md:ml-10 rounded-xl bg-gradient-to-r ${color.bg} border ${color.border} p-5`}>
                    {/* Week header */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className={`${color.text} border-current text-xs font-bold`}>
                        Week {idx + 1}
                      </Badge>
                      <h3 className="font-bold text-lg">{week.data.theme}</h3>
                    </div>

                    {/* Actions checklist */}
                    <div className="space-y-3">
                      {safeArray(week.data.actions).map((action: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/40">
                          <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-muted-foreground/30 shrink-0 mt-0.5">
                            {/* Decorative unchecked checkbox */}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{action.day}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground mt-1">{action.action}</p>
                            {action.why && (
                              <p className="text-xs text-muted-foreground mt-1">↳ Based on: {action.why}</p>
                            )}
                            {action.deliverable && (
                              <p className="text-xs text-primary/80 mt-1 font-medium">✓ Deliverable: {action.deliverable}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Milestones */}
        {safeArray(data.critical_milestones).length > 0 && (
          <>
            <div className="border-t border-border/50" />
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                Critical Milestones
              </h3>
              <div className="relative">
                {/* Horizontal timeline */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/30 to-success/30 hidden md:block" />
                <div className="grid md:grid-cols-3 gap-4">
                  {safeArray(data.critical_milestones).map((ms: any, i: number) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 mx-auto mb-3 relative z-10">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 border text-center">
                        <p className="text-xs font-bold text-primary mb-1 flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {ms.target_date}
                        </p>
                        <p className="text-sm font-semibold text-foreground">{ms.milestone}</p>
                        {ms.success_metric && (
                          <p className="text-xs text-muted-foreground mt-1">📊 {ms.success_metric}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Resources Needed */}
        {data.resources_needed && (
          <>
            <div className="border-t border-border/50" />
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                Resources Needed
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {data.resources_needed.budget_estimate && (
                  <div className="p-4 rounded-xl bg-muted/20 border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      Budget Estimate
                    </h4>
                    <p className="text-sm font-medium text-foreground">{data.resources_needed.budget_estimate}</p>
                  </div>
                )}
                {safeArray(data.resources_needed.tools).length > 0 && (
                  <div className="p-4 rounded-xl bg-muted/20 border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <Wrench className="h-3.5 w-3.5" />
                      Tools
                    </h4>
                    <ul className="space-y-1">
                      {safeArray(data.resources_needed.tools).map((tool: string, i: number) => (
                        <li key={i} className="text-sm text-foreground/90 flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          {tool}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.resources_needed.people && (
                  <div className="p-4 rounded-xl bg-muted/20 border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <Users className="h-3.5 w-3.5" />
                      People
                    </h4>
                    <p className="text-sm text-foreground/90">{data.resources_needed.people}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
