import { useState } from "react";
import { ChevronDown, AlertTriangle, Info, ArrowRight, Eye, Shield } from "lucide-react";
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

const severityConfig = {
  critical: { border: "border-l-red-500", badge: "bg-red-500/10 text-red-500 border-red-500/20", dot: "text-red-500" },
  moderate: { border: "border-l-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", dot: "text-amber-500" },
  low: { border: "border-l-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dot: "text-emerald-500" },
};

const RiskItem = ({ risk, severity }: { risk: Risk; severity: "critical" | "moderate" | "low" }) => {
  const [open, setOpen] = useState(false);
  const config = severityConfig[severity];

  return (
    <div className={`border-l-[3px] ${config.border} rounded-r-lg bg-card/50 mb-2`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 py-3 px-4 text-left hover:bg-muted/10 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge variant="outline" className={`text-[10px] ${config.badge}`}>
              {severity}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{risk.category}</span>
          </div>
          <p className="text-sm font-medium leading-snug">{risk.risk}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="pb-4 px-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mitigation</p>
            <p className="text-sm">{risk.mitigation_strategy}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-amber-500/[0.04] rounded-lg p-3 border border-amber-500/10">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Eye className="h-3 w-3" /> Early Warning
              </p>
              <p className="text-sm">{risk.early_warning_sign}</p>
            </div>
            <div className="bg-primary/[0.04] rounded-lg p-3 border border-primary/10">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Contingency
              </p>
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

  return (
    <ReportSectionCard id="risk-matrix" title="Risk Mitigation Matrix">
      {/* Risk Lists */}
      {rm.critical_risks?.length > 0 && (
        <div>
          <h3 className="font-sans text-sm font-semibold text-red-500 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            Critical Risks ({rm.critical_risks.length})
          </h3>
          <div>
            {rm.critical_risks.map((r: Risk, i: number) => (
              <RiskItem key={i} risk={r} severity="critical" />
            ))}
          </div>
        </div>
      )}

      {rm.moderate_risks?.length > 0 && (
        <>
          <div className="border-t border-border/30" />
          <div>
            <h3 className="font-sans text-sm font-semibold text-amber-500 flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" />
              Moderate Risks ({rm.moderate_risks.length})
            </h3>
            <div>
              {rm.moderate_risks.map((r: Risk, i: number) => (
                <RiskItem key={i} risk={r} severity="moderate" />
              ))}
            </div>
          </div>
        </>
      )}

      {rm.low_risks?.length > 0 && (
        <>
          <div className="border-t border-border/30" />
          <div>
            <h3 className="font-sans text-sm font-semibold text-emerald-500 flex items-center gap-2 mb-3">
              <ArrowRight className="h-4 w-4" />
              Low Risks ({rm.low_risks.length})
            </h3>
            <div>
              {rm.low_risks.map((r: Risk, i: number) => (
                <RiskItem key={i} risk={r} severity="low" />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-border/30" />

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {rm.overall_risk_assessment && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Overall Risk Assessment</p>
            <p className="text-sm">{rm.overall_risk_assessment}</p>
          </div>
        )}
        {rm.biggest_unknown && (
          <div>
            <p className="text-xs font-medium text-red-500 uppercase tracking-wider mb-1">Biggest Unknown</p>
            <p className="text-sm">{rm.biggest_unknown}</p>
          </div>
        )}
      </div>
    </ReportSectionCard>
  );
};
