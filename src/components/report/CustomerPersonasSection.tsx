import { Users, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const AVATAR_COLORS = [
  "bg-primary/20 text-primary",
  "bg-secondary/20 text-secondary",
  "bg-success/20 text-success",
  "bg-warning/20 text-warning",
];

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
    <ReportSectionCard
      id="customer-personas"
      icon={<Users className="h-5 w-5 text-primary" />}
      title="Your Target Customers"
    >
      <p className="text-muted-foreground">Meet the people most likely to buy from you</p>

      {/* Priority callout */}
      {reportData.customer_personas[0] && (
        <div className="rounded-xl bg-primary/[0.06] border border-primary/20 p-5 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full ${AVATAR_COLORS[0]} flex items-center justify-center font-bold text-lg shrink-0`}>
            {getInitials(reportData.customer_personas[0].name || "P1")}
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Start with {reportData.customer_personas[0].name}</h3>
            <p className="text-sm text-muted-foreground">{reportData.customer_personas[0].priority_reason}</p>
          </div>
        </div>
      )}

      {/* Persona cards */}
      <div className="space-y-6">
        {reportData.customer_personas.map((persona: any, idx: number) => (
          <div
            key={idx}
            className="rounded-xl border overflow-hidden animate-fade-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Persona header with avatar */}
            <div className="p-5 flex items-center gap-4 border-b bg-muted/20">
              <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-xl shrink-0`}>
                {getInitials(persona.name || `P${idx + 1}`)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{persona.name}</h3>
                  {idx === 0 && <Badge>Start Here</Badge>}
                  {idx > 0 && <Badge variant="secondary">{persona.priority} Priority</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{persona.job}</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Demographics info-grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Age", value: persona.age },
                  { label: "Income", value: persona.income },
                  { label: "Location", value: persona.location },
                  { label: "Job", value: persona.job },
                ].map((item) => (
                  <div key={item.label} className="text-sm">
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Values & personality as pills */}
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(persona.values) ? persona.values : [persona.values]).filter(Boolean).map((v: string, i: number) => (
                  <Badge key={`v-${i}`} variant="outline" className="text-xs bg-primary/[0.05]">{v}</Badge>
                ))}
                {(Array.isArray(persona.personality) ? persona.personality : [persona.personality]).filter(Boolean).map((p: string, i: number) => (
                  <Badge key={`p-${i}`} variant="outline" className="text-xs bg-secondary/[0.05]">{p}</Badge>
                ))}
              </div>

              <div className="border-t border-border/50" />

              {/* Pain points */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Pain Points
                </h4>
                <div className="space-y-2">
                  {persona.pain_points?.map((pp: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="shrink-0 text-[10px] bg-warning/[0.08] text-warning border-warning/20">
                        {i === 0 ? "Primary" : i === 1 ? "Secondary" : "Tertiary"}
                      </Badge>
                      <div>
                        <span className="font-medium">{pp.pain}</span>
                        {pp.impact && <span className="text-muted-foreground"> — {pp.impact}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm space-y-1">
                  <p><strong>Current solution:</strong> {persona.current_solution}</p>
                  <p><strong>Dream outcome:</strong> {persona.dream_outcome}</p>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Objections */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <XCircle className="h-4 w-4 text-destructive" /> Objections
                </h4>
                <div className="space-y-2">
                  {persona.objections?.map((obj: any, i: number) => (
                    <div key={i} className="rounded-lg bg-destructive/[0.05] border border-destructive/10 p-3 text-sm">
                      <p className="font-medium">"{obj.objection}"</p>
                      <p className="text-muted-foreground text-xs mt-1">Root cause: {obj.root_cause}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Closing angles */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-success" /> Closing Angles
                </h4>
                <div className="space-y-2">
                  {persona.closing_angles?.map((angle: any, i: number) => (
                    <div key={i} className="rounded-lg bg-success/[0.05] border border-success/10 p-3 text-sm">
                      <p className="font-semibold">{angle.angle}</p>
                      <p className="text-muted-foreground text-xs mt-1">Addresses: {angle.addresses}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm space-y-1">
                  <p><strong>Proof needed:</strong> {persona.proof_needed}</p>
                  <p><strong>Urgency trigger:</strong> {persona.urgency_trigger}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ReportSectionCard>
  );
};
