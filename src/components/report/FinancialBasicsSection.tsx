import { DollarSign } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

export const FinancialBasicsSection = ({ reportData }: Props) => {
  if (!reportData.financial_basics) return null;
  const fin = reportData.financial_basics;

  return (
    <ReportSectionCard
      icon={<DollarSign className="h-5 w-5 text-primary" />}
      title="Financial Basics"
    >
      {/* Startup costs */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Startup Cost Scenarios</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Conservative", value: fin.startup_costs?.conservative, style: "border" },
            { label: "Moderate", value: fin.startup_costs?.moderate, style: "border-primary/30 bg-primary/[0.04]" },
            { label: "Aggressive", value: fin.startup_costs?.aggressive, style: "border" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 border ${item.style}`}>
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Revenue Model */}
      <div>
        <h3 className="font-semibold text-lg mb-2">Revenue Model</h3>
        <MarkdownContent content={toMarkdownString(fin.revenue_model)} className="text-sm" />
      </div>

      <div className="border-t border-border/50" />

      {/* CAC */}
      <div>
        <h3 className="font-semibold text-lg mb-2">CAC Estimate</h3>
        <MarkdownContent content={toMarkdownString(fin.cac_estimate)} className="text-sm" />
      </div>
    </ReportSectionCard>
  );
};
