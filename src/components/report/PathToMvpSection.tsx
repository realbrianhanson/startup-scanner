import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

export const PathToMvpSection = ({ reportData }: Props) => {
  if (!reportData.path_to_mvp) return null;
  const mvp = reportData.path_to_mvp;

  return (
    <ReportSectionCard
      id="path-to-mvp"
      icon={<Lightbulb className="h-5 w-5 text-primary" />}
      title="Path to MVP"
    >
      {/* MVP Definition */}
      <div className="rounded-xl bg-primary/[0.06] border border-primary/20 p-5">
        <h3 className="font-semibold text-lg mb-2">MVP Definition</h3>
        <p className="text-muted-foreground mb-3">{mvp.mvp_definition?.description}</p>
        <div className="p-3 bg-card rounded-lg border">
          <span className="font-semibold text-primary text-sm">Core Value:</span>
          <p className="text-sm mt-1">{mvp.mvp_definition?.core_value}</p>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Core Features */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Core Features</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {mvp.core_features?.map((feature: any, idx: number) => (
            <div key={idx} className="rounded-xl border p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{feature.feature}</h4>
                <Badge
                  variant={feature.priority === "high" ? "destructive" : feature.priority === "medium" ? "secondary" : "outline"}
                  className="text-[10px] shrink-0"
                >
                  {feature.priority}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Effort: <span className="font-medium text-foreground">{feature.effort}</span></div>
                <div>Value: <span className="font-medium text-foreground">{feature.value}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Development Phases - timeline */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Development Phases</h3>
        <div className="space-y-0">
          {mvp.development_phases?.map((phase: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/30">
                  {idx + 1}
                </div>
                {idx < (mvp.development_phases?.length || 0) - 1 && (
                  <div className="w-[2px] flex-1 bg-border my-1" />
                )}
              </div>
              <div className="pb-6 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{phase.phase}</h4>
                  <span className="text-xs text-muted-foreground">{phase.duration}</span>
                </div>
                <ul className="text-sm space-y-1">
                  {phase.deliverables?.map((d: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Resources & Launch */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-success/[0.06] border border-success/20 p-5">
          <h3 className="font-semibold text-lg mb-3 text-success">Resources</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-xs mb-1.5">Team:</p>
              <div className="flex flex-wrap gap-1.5">
                {mvp.resource_requirements?.team?.map((m: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-success/[0.08]">{m}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-xs mb-1.5">Tools:</p>
              <div className="flex flex-wrap gap-1.5">
                {mvp.resource_requirements?.tools?.map((t: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
              <div><span className="text-muted-foreground">Budget:</span> {mvp.resource_requirements?.estimated_budget}</div>
              <div><span className="text-muted-foreground">Timeline:</span> {mvp.resource_requirements?.timeline}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-primary/[0.06] border border-primary/20 p-5">
          <h3 className="font-semibold text-lg mb-3 text-primary">Launch Strategy</h3>
          <div className="space-y-3 text-sm">
            <div><span className="font-semibold text-xs">Target:</span> <p className="text-muted-foreground">{mvp.launch_strategy?.target_audience}</p></div>
            <div>
              <span className="font-semibold text-xs">Channels:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {mvp.launch_strategy?.channels?.map((ch: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-primary/[0.08]">{ch}</Badge>
                ))}
              </div>
            </div>
            <div><span className="font-semibold text-xs">Approach:</span> <p className="text-muted-foreground">{mvp.launch_strategy?.approach}</p></div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Success Metrics */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Success Metrics</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {mvp.success_metrics?.map((metric: any, idx: number) => (
            <div key={idx} className="rounded-xl border p-4">
              <h4 className="font-semibold text-sm mb-2">{metric.metric}</h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>Target: <span className="font-medium text-foreground">{metric.target}</span></div>
                <div>How: <span className="font-medium text-foreground">{metric.measurement}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Iteration plan */}
      {mvp.iteration_plan && (
        <>
          <div className="border-t border-border/50" />
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold text-lg mb-3">Iteration Plan</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-xs">Feedback Channels:</span>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {mvp.iteration_plan.feedback_channels?.map((ch: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-primary">•</span> {ch}</li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold text-xs">Review:</span> <p className="text-muted-foreground mt-1">{mvp.iteration_plan.review_frequency}</p></div>
              <div><span className="font-semibold text-xs">Process:</span> <p className="text-muted-foreground mt-1">{mvp.iteration_plan.improvement_process}</p></div>
            </div>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
