import { AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

      {/* Persona entries */}
      <div className="space-y-10">
        {reportData.customer_personas.map((persona: any, idx: number) => (
          <div key={idx} className="border-t border-border/50 pt-6 first:border-0 first:pt-0">
            {/* Persona header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono text-sm font-semibold shrink-0">
                {getInitials(persona.name || `P${idx + 1}`)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans text-lg font-semibold">{persona.name}</h3>
                  {idx === 0 && <Badge variant="default" className="text-[10px]">Primary</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{persona.job}</p>
              </div>
            </div>

            {/* Demographics */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-sm">
              {[
                { label: "Age", value: persona.age },
                { label: "Income", value: persona.income },
                { label: "Location", value: persona.location },
              ].map((item) => item.value && (
                <div key={item.label}>
                  <span className="text-muted-foreground">{item.label}:</span>{" "}
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Values & personality */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(Array.isArray(persona.values) ? persona.values : [persona.values]).filter(Boolean).map((v: string, i: number) => (
                <span key={`v-${i}`} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{v}</span>
              ))}
              {(Array.isArray(persona.personality) ? persona.personality : [persona.personality]).filter(Boolean).map((p: string, i: number) => (
                <span key={`p-${i}`} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
              ))}
            </div>

            {/* Pain points */}
            <div className="mb-4">
              <h4 className="font-sans text-sm font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Pain Points
              </h4>
              <div className="space-y-2">
                {persona.pain_points?.map((pp: any, i: number) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{pp.pain}</span>
                    {pp.impact && <span className="text-muted-foreground"> — {pp.impact}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">Current solution:</span> {persona.current_solution}</p>
                <p><span className="font-medium text-foreground">Dream outcome:</span> {persona.dream_outcome}</p>
              </div>
            </div>

            {/* Objections */}
            <div className="mb-4">
              <h4 className="font-sans text-sm font-semibold flex items-center gap-2 mb-2">
                <XCircle className="h-3.5 w-3.5 text-red-500" /> Objections
              </h4>
              <div className="space-y-2">
                {persona.objections?.map((obj: any, i: number) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">"{obj.objection}"</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Root cause: {obj.root_cause}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing angles */}
            <div>
              <h4 className="font-sans text-sm font-semibold flex items-center gap-2 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-emerald-500" /> Closing Angles
              </h4>
              <div className="space-y-2">
                {persona.closing_angles?.map((angle: any, i: number) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">{angle.angle}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Addresses: {angle.addresses}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">Proof needed:</span> {persona.proof_needed}</p>
                <p><span className="font-medium text-foreground">Urgency trigger:</span> {persona.urgency_trigger}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ReportSectionCard>
  );
};
