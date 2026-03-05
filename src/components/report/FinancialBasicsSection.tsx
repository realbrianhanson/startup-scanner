import { DollarSign, TrendingUp, Target, Wallet, BarChart3, Landmark, ArrowUpRight, ArrowUp } from "lucide-react";
import { ReportSectionCard } from "./ReportSectionCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  reportData: any;
}

const parseNumericValue = (val: any): number | null => {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return null;
  const cleaned = val.replace(/[^0-9.\-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const isNegative = (val: any): boolean => {
  const num = parseNumericValue(val);
  return num !== null && num < 0;
};

const ScenarioCard = ({ label, data, highlight }: { label: string; data: any; highlight?: boolean }) => {
  const isStructured = typeof data === "object" && data?.total;
  const total = isStructured ? data.total : data;
  const breakdown = isStructured ? data.breakdown || [] : [];

  return (
    <div className={`py-4 ${highlight ? "border-l-2 border-l-primary pl-4 bg-primary/[0.03] rounded-r-lg pr-4" : ""}`}>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-mono text-lg font-semibold">{total}</p>
      </div>
      {breakdown.length > 0 && (
        <div className="space-y-1">
          {breakdown.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{item.item}</span>
              <span className="font-mono">{item.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LtvCacDisplay = ({ ratio }: { ratio: any }) => {
  const numRatio = parseNumericValue(ratio);
  const isHealthy = numRatio !== null && numRatio >= 3;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">LTV:CAC</p>
      <p className={`font-mono text-2xl font-bold ${isHealthy ? "text-emerald-500" : "text-amber-500"}`}>
        {ratio || "—"}
      </p>
      {numRatio !== null && !isHealthy && (
        <p className="text-xs text-amber-500 mt-0.5">Target: 3:1 minimum</p>
      )}
    </div>
  );
};

export const FinancialBasicsSection = ({ reportData }: Props) => {
  if (!reportData.financial_basics) return null;
  const fin = reportData.financial_basics;

  const projections = fin.projections;
  const isStructuredProjections = typeof projections?.year1 === "object";

  const revenueModel = fin.revenue_model;
  const isStructuredRevenue = typeof revenueModel === "object" && revenueModel?.primary_model;
  const unitEcon = fin.unit_economics;

  return (
    <ReportSectionCard title="Financial Basics">
      {/* Startup Cost Scenarios */}
      <div>
        <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">Startup Cost Scenarios</h3>
        <div className="grid md:grid-cols-3 gap-0 divide-x divide-border/50">
          <ScenarioCard label="Conservative" data={fin.startup_costs?.conservative} />
          <ScenarioCard label="Moderate" data={fin.startup_costs?.moderate} highlight />
          <ScenarioCard label="Aggressive" data={fin.startup_costs?.aggressive} />
        </div>
      </div>

      <div className="border-t border-border/30" />

      {/* Revenue Model */}
      <div>
        <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">Revenue Model</h3>
        {isStructuredRevenue ? (
          <div className="space-y-4">
            <p className="text-sm"><span className="font-medium">Model:</span> {revenueModel.primary_model}</p>
            {revenueModel.pricing_recommendation && (
              <p className="text-sm text-muted-foreground">{revenueModel.pricing_recommendation}</p>
            )}
            {revenueModel.revenue_streams?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Stream</TableHead>
                    <TableHead className="text-xs h-8 text-center">Share</TableHead>
                    <TableHead className="text-xs h-8">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueModel.revenue_streams.map((s: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="py-2 text-sm font-medium">{s.stream}</TableCell>
                      <TableCell className="py-2 text-sm text-center font-mono">{s.percentage}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{s.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-line">{typeof revenueModel === "string" ? revenueModel : JSON.stringify(revenueModel)}</p>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* Unit Economics */}
      {unitEcon && (
        <>
          <div>
            <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">Unit Economics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Revenue / Customer", value: unitEcon.average_revenue_per_customer },
                { label: "CAC", value: unitEcon.estimated_cac },
                { label: "LTV", value: unitEcon.estimated_ltv },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="font-mono text-lg font-semibold">{m.value || "—"}</p>
                </div>
              ))}
              <LtvCacDisplay ratio={unitEcon.ltv_to_cac_ratio} />
            </div>

            {unitEcon.cac_breakdown?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Channel</TableHead>
                    <TableHead className="text-xs h-8 text-right">Cost / Acquisition</TableHead>
                    <TableHead className="text-xs h-8 text-right">Expected Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitEcon.cac_breakdown.map((ch: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="py-2 text-sm font-medium">{ch.channel}</TableCell>
                      <TableCell className="py-2 text-sm text-right font-mono">{ch.cost_per_acquisition}</TableCell>
                      <TableCell className="py-2 text-sm text-right">{ch.expected_volume}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {(unitEcon.payback_period || unitEcon.viability_assessment) && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {unitEcon.payback_period && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Payback Period</p>
                    <p className="text-sm font-medium">{unitEcon.payback_period}</p>
                  </div>
                )}
                {unitEcon.viability_assessment && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Viability Assessment</p>
                    <p className="text-sm">{unitEcon.viability_assessment}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border-t border-border/30" />
        </>
      )}

      {/* 3-Year Projections */}
      <div>
        <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">3-Year Projections</h3>
        {isStructuredProjections ? (
          <div className="grid md:grid-cols-3 gap-0 divide-x divide-border/50">
            {[
              { label: "Year 1", data: projections.year1, prev: null },
              { label: "Year 2", data: projections.year2, prev: projections.year1 },
              { label: "Year 3", data: projections.year3, prev: projections.year2 },
            ].map((yr) => {
              const prevRevenue = parseNumericValue(yr.prev?.revenue);
              const currRevenue = parseNumericValue(yr.data?.revenue);
              const showGrowth = prevRevenue !== null && currRevenue !== null && currRevenue > prevRevenue;
              const netNegative = isNegative(yr.data?.net);

              return (
                <div key={yr.label} className="py-3 px-4 first:pl-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{yr.label}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-mono font-semibold text-primary flex items-center gap-1">
                        {yr.data?.revenue}
                        {showGrowth && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customers</span>
                      <span className="font-mono">{yr.data?.customers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-mono">{yr.data?.expenses}</span>
                    </div>
                    <div className="border-t border-border/30 pt-2 flex justify-between text-sm">
                      <span className="font-medium">Net</span>
                      <span className={`font-mono font-semibold ${netNegative ? "text-red-500" : ""}`}>{yr.data?.net}</span>
                    </div>
                  </div>
                  {yr.data?.assumptions && (
                    <p className="text-[11px] text-muted-foreground italic mt-3">{yr.data.assumptions}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {["year1", "year2", "year3"].map((key, i) => (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Year {i + 1}</p>
                <p className="font-mono text-lg font-semibold">{projections?.[key] || "TBD"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* Funding & Break-Even */}
      <div className="grid md:grid-cols-2 gap-6">
        {fin.funding_recommendation && (
          <div>
            <h4 className="font-sans text-sm font-semibold mb-2 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Funding Recommendation
            </h4>
            <p className="text-sm text-muted-foreground">{fin.funding_recommendation}</p>
          </div>
        )}
        {fin.break_even_estimate && (
          <div>
            <h4 className="font-sans text-sm font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Break-Even Estimate
            </h4>
            <p className="text-sm text-muted-foreground">{fin.break_even_estimate}</p>
          </div>
        )}
      </div>
    </ReportSectionCard>
  );
};
