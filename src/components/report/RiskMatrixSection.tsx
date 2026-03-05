import { useState } from "react";
import { ShieldAlert, ChevronDown, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { ReportSectionCard } from "./ReportSectionCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Risk {
  risk: string;
  category: string;
  probability: string;
  impact: string;
  source_section: string;
  mitigation_strategy: string;
  early_warning_sign: string;
  contingency_plan: string;
}

interface Props {
  reportData: any;
}

const probabilityOrder: Record<string, number> = { High: 2, Medium: 1, Low: 0 };
const impactOrder: Record<string, number> = { High: 2, Medium: 1, Low: 0 };

const cellColor = (p: number, i: number) => {
  const score = p + i;
  if (score >= 3) return "bg-destructive/15 border-destructive/30";
  if (score >= 2) return "bg-amber-500/15 border-amber-500/30";
  return "bg-emerald-500/10 border-emerald-500/20";
};

const severityBadge = (level: "critical" | "moderate" | "low") => {
  const map = {
    critical: "bg-destructive/15 text-destructive border-destructive/30",
    moderate: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };
  return map[level];
};

const RiskItem = ({ risk, severity }: { risk: Risk; severity: "critical" | "moderate" | "low" }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", severityBadge(severity))}>
              {severity}
            </span>
            <Badge variant="outline" className="text-[10px]">{risk.category}</Badge>
            <span className="text-[10px] text-muted-foreground">
              P: {risk.probability} · I: {risk.impact}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug">{risk.risk}</p>
          <p className="text-[11px] text-muted-foreground">Source: {risk.source_section}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
          <div className="rounded-lg bg-primary/[0.04] border border-primary/10 p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mitigation Strategy</p>
            <p className="text-sm">{risk.mitigation_strategy}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Early Warning Sign</p>
              <p className="text-sm">{risk.early_warning_sign}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contingency Plan</p>
              <p className="text-sm">{risk.contingency_plan}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const RiskMatrixSection = ({ reportData }: Props) => {
  if (!reportData.risk_matrix) return null;
  const rm = reportData.risk_matrix;

  const allRisks: { risk: Risk; severity: "critical" | "moderate" | "low" }[] = [
    ...(rm.critical_risks || []).map((r: Risk) => ({ risk: r, severity: "critical" as const })),
    ...(rm.moderate_risks || []).map((r: Risk) => ({ risk: r, severity: "moderate" as const })),
    ...(rm.low_risks || []).map((r: Risk) => ({ risk: r, severity: "low" as const })),
  ];

  // Build grid data: rows = probability (High→Low), cols = impact (Low→High)
  const probLabels = ["High", "Medium", "Low"];
  const impactLabels = ["Low", "Medium", "High"];

  const grid = probLabels.map((p) =>
    impactLabels.map((i) =>
      allRisks.filter(
        (r) =>
          (r.risk.probability || "").toLowerCase() === p.toLowerCase() &&
          (r.risk.impact || "").toLowerCase() === i.toLowerCase()
      )
    )
  );

  return (
    <ReportSectionCard
      id="risk-matrix"
      icon={<ShieldAlert className="h-5 w-5 text-primary" />}
      title="Risk Mitigation Matrix"
      accentFrom="hsl(var(--destructive))"
      accentTo="hsl(var(--primary))"
    >
      {/* Visual Grid */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Probability vs. Impact Grid</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            {/* Header row */}
            <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-1.5 mb-1.5">
              <div />
              {impactLabels.map((il) => (
                <div key={il} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {il} Impact
                </div>
              ))}
            </div>
            {/* Grid rows */}
            {probLabels.map((pl, pi) => (
              <div key={pl} className="grid grid-cols-[80px_1fr_1fr_1fr] gap-1.5 mb-1.5">
                <div className="flex items-center justify-end pr-2 text-xs font-semibold text-muted-foreground">
                  {pl}
                </div>
                {grid[pi].map((risks, ii) => (
                  <div
                    key={`${pi}-${ii}`}
                    className={cn(
                      "rounded-lg border p-2 min-h-[56px] flex flex-wrap gap-1 items-start",
                      cellColor(probabilityOrder[pl], impactOrder[impactLabels[ii]])
                    )}
                  >
                    {risks.map((r, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "inline-block w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border",
                          r.severity === "critical"
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : r.severity === "moderate"
                            ? "bg-amber-500 text-white border-amber-600"
                            : "bg-emerald-500 text-white border-emerald-600"
                        )}
                        title={r.risk.risk}
                      >
                        {allRisks.indexOf(r) + 1}
                      </span>
                    ))}
                    {risks.length === 0 && <span className="text-[10px] text-muted-foreground/50">—</span>}
                  </div>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-[80px_1fr] gap-1.5">
              <div />
              <p className="text-[10px] text-muted-foreground text-center col-span-1">← Impact →</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Risk Lists */}
      {(rm.critical_risks?.length > 0) && (
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Critical Risks ({rm.critical_risks.length})
          </h3>
          <div className="space-y-2">
            {rm.critical_risks.map((r: Risk, i: number) => (
              <RiskItem key={i} risk={r} severity="critical" />
            ))}
          </div>
        </div>
      )}

      {(rm.moderate_risks?.length > 0) && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Info className="h-4 w-4" />
              Moderate Risks ({rm.moderate_risks.length})
            </h3>
            <div className="space-y-2">
              {rm.moderate_risks.map((r: Risk, i: number) => (
                <RiskItem key={i} risk={r} severity="moderate" />
              ))}
            </div>
          </div>
        </>
      )}

      {(rm.low_risks?.length > 0) && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ArrowRight className="h-4 w-4" />
              Low Risks ({rm.low_risks.length})
            </h3>
            <div className="space-y-2">
              {rm.low_risks.map((r: Risk, i: number) => (
                <RiskItem key={i} risk={r} severity="low" />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-border/50" />

      {/* Summary boxes */}
      <div className="grid md:grid-cols-2 gap-4">
        {rm.overall_risk_assessment && (
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overall Risk Assessment</p>
            <p className="text-sm">{rm.overall_risk_assessment}</p>
          </div>
        )}
        {rm.biggest_unknown && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] p-5">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Biggest Unknown</p>
            <p className="text-sm">{rm.biggest_unknown}</p>
          </div>
        )}
      </div>
    </ReportSectionCard>
  );
};
