import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  reportData: any;
}

export const PathToMvpSection = ({ reportData }: Props) => {
  if (!reportData.path_to_mvp) return null;

  const mvp = reportData.path_to_mvp;

  return (
    <Collapsible>
      <Card id="path-to-mvp" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lightbulb className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Path to MVP</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">MVP Definition</h3>
              <Card className="p-4 bg-primary/5">
                <p className="text-muted-foreground mb-3">{mvp.mvp_definition?.description}</p>
                <div className="p-3 bg-background rounded-lg border">
                  <span className="font-semibold text-primary">Core Value:</span>
                  <p className="text-sm mt-1">{mvp.mvp_definition?.core_value}</p>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Core Features</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {mvp.core_features?.map((feature: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{feature.feature}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        feature.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                        feature.priority === 'medium' ? 'bg-primary/20 text-primary' :
                        'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        {feature.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Effort:</span> {feature.effort}</div>
                      <div><span className="text-muted-foreground">Value:</span> {feature.value}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Development Phases</h3>
              <div className="space-y-3">
                {mvp.development_phases?.map((phase: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-muted/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold">{phase.phase}</h4>
                        <span className="text-xs text-muted-foreground">{phase.duration}</span>
                      </div>
                    </div>
                    <ul className="text-sm space-y-1 ml-11">
                      {phase.deliverables?.map((d: string, i: number) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-success/5">
                <h3 className="font-semibold text-lg mb-3 text-success">Resources</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Team:</h4>
                    <div className="flex flex-wrap gap-2">
                      {mvp.resource_requirements?.team?.map((member: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-success/10 rounded text-xs">{member}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Tools:</h4>
                    <div className="flex flex-wrap gap-2">
                      {mvp.resource_requirements?.tools?.map((tool: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-muted rounded text-xs">{tool}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                    <div><span className="text-muted-foreground">Budget:</span> {mvp.resource_requirements?.estimated_budget}</div>
                    <div><span className="text-muted-foreground">Timeline:</span> {mvp.resource_requirements?.timeline}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-primary/5">
                <h3 className="font-semibold text-lg mb-3 text-primary">Launch Strategy</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">Target:</span>
                    <p className="text-muted-foreground">{mvp.launch_strategy?.target_audience}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Channels:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mvp.launch_strategy?.channels?.map((channel: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{channel}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Approach:</span>
                    <p className="text-muted-foreground">{mvp.launch_strategy?.approach}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Success Metrics</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {mvp.success_metrics?.map((metric: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-muted/30">
                    <h4 className="font-semibold text-sm mb-2">{metric.metric}</h4>
                    <div className="text-xs space-y-1">
                      <div><span className="text-muted-foreground">Target:</span> {metric.target}</div>
                      <div><span className="text-muted-foreground">How:</span> {metric.measurement}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Iteration Plan</h3>
              <Card className="p-4 bg-muted/30">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Feedback Channels:</span>
                    <ul className="mt-1">
                      {mvp.iteration_plan?.feedback_channels?.map((channel: string, i: number) => (
                        <li key={i}>• {channel}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold">Review Frequency:</span>
                    <p className="text-muted-foreground mt-1">{mvp.iteration_plan?.review_frequency}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Process:</span>
                    <p className="text-muted-foreground mt-1">{mvp.iteration_plan?.improvement_process}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
