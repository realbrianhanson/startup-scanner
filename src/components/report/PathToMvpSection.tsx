import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

export const PathToMvpSection = ({ reportData }: Props) => {
  if (!reportData.path_to_mvp) return null;
  const mvp = reportData.path_to_mvp;

  return (
    <ReportSectionCard id="path-to-mvp" title="Path to MVP">
      {/* MVP Definition */}
      <div className="border-l-2 border-l-primary pl-5 py-2">
        <h3 className="font-sans text-lg font-semibold mb-2">MVP Definition</h3>
        <p className="text-sm text-muted-foreground mb-2">{mvp.mvp_definition?.description}</p>
        <p className="text-sm"><span className="font-medium text-primary">Core Value:</span> {mvp.mvp_definition?.core_value}</p>
      </div>

      <div className="border-t border-border/50" />

      {/* Core Features */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3">Core Features</h3>
        <div className="space-y-0">
          {mvp.core_features?.map((feature: any, idx: number) => (
            <div key={idx} className="flex items-start justify-between py-3 border-b border-border/30 last:border-0">
              <div>
                <h4 className="text-sm font-medium">{feature.feature}</h4>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Effort: <span className="font-medium text-foreground">{feature.effort}</span></span>
                  <span>Value: <span className="font-medium text-foreground">{feature.value}</span></span>
                </div>
              </div>
              <Badge
                variant={feature.priority === "high" ? "destructive" : feature.priority === "medium" ? "secondary" : "outline"}
                className="text-[10px] shrink-0"
              >
                {feature.priority}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Development Phases — timeline */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3">Development Phases</h3>
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-6">
            {mvp.development_phases?.map((phase: any, idx: number) => (
              <div key={idx} className="relative pl-8">
                <div className="absolute left-0 top-1 w-[11px] h-[11px] rounded-full bg-primary border-2 border-background" />
                <div className="flex items-baseline gap-2 mb-1">
                  <h4 className="font-sans text-sm font-semibold">{phase.phase}</h4>
                  <span className="text-xs text-muted-foreground">{phase.duration}</span>
                </div>
                <ul className="text-sm space-y-1">
                  {phase.deliverables?.map((d: string, i: number) => (
                    <li key={i} className="text-muted-foreground">· {d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Resources & Launch */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resources</h3>
          <div className="space-y-3 text-sm">
            {mvp.resource_requirements?.team && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Team:</p>
                <p>{mvp.resource_requirements.team.join(", ")}</p>
              </div>
            )}
            {mvp.resource_requirements?.tools && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tools:</p>
                <p>{mvp.resource_requirements.tools.join(", ")}</p>
              </div>
            )}
            <div className="flex gap-4 text-xs">
              <span><span className="text-muted-foreground">Budget:</span> {mvp.resource_requirements?.estimated_budget}</span>
              <span><span className="text-muted-foreground">Timeline:</span> {mvp.resource_requirements?.timeline}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Launch Strategy</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Target:</span> {mvp.launch_strategy?.target_audience}</p>
            {mvp.launch_strategy?.channels && (
              <p><span className="text-muted-foreground">Channels:</span> {mvp.launch_strategy.channels.join(", ")}</p>
            )}
            <p><span className="text-muted-foreground">Approach:</span> {mvp.launch_strategy?.approach}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Success Metrics */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3">Success Metrics</h3>
        <div className="space-y-0">
          {mvp.success_metrics?.map((metric: any, idx: number) => (
            <div key={idx} className="py-3 border-b border-border/30 last:border-0">
              <h4 className="text-sm font-medium">{metric.metric}</h4>
              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                <span>Target: <span className="font-mono font-medium text-foreground">{metric.target}</span></span>
                <span>How: {metric.measurement}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Iteration plan */}
      {mvp.iteration_plan && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3">Iteration Plan</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Feedback Channels:</p>
                <ul className="space-y-1">
                  {mvp.iteration_plan.feedback_channels?.map((ch: string, i: number) => (
                    <li key={i}>· {ch}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Review:</p>
                <p>{mvp.iteration_plan.review_frequency}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Process:</p>
                <p>{mvp.iteration_plan.improvement_process}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
