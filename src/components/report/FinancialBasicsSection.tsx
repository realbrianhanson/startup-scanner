import { DollarSign, TrendingUp, Target, Wallet, BarChart3, Landmark, ArrowUpRight } from "lucide-react";
import { ReportSectionCard } from "./ReportSectionCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

interface Props {
  reportData: any;
}

const ScenarioCard = ({ label, data, accent }: { label: string; data: any; accent: string }) => {
  const isStructured = typeof data === "object" && data?.total;
  const total = isStructured ? data.total : data;
  const breakdown = isStructured ? data.breakdown || [] : [];

  return (
    <div className={`rounded-xl border ${accent} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold">{total}</p>
      </div>
      {breakdown.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs h-8">Item</TableHead>
              <TableHead className="text-xs h-8 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((item: any, i: number) => (
              <TableRow key={i} className="border-border/30">
                <TableCell className="py-1.5 text-xs">
                  <span className="font-medium">{item.item}</span>
                  {item.notes && (
                    <span className="block text-muted-foreground text-[11px] mt-0.5">{item.notes}</span>
                  )}
                </TableCell>
                <TableCell className="py-1.5 text-xs text-right font-mono">{item.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

export const FinancialBasicsSection = ({ reportData }: Props) => {
  if (!reportData.financial_basics) return null;
  const fin = reportData.financial_basics;

  // Build projections chart data
  const projections = fin.projections;
  const isStructuredProjections = typeof projections?.year1 === "object";
  const chartData = isStructuredProjections
    ? [
        { year: "Year 1", revenue: projections.year1?.revenue, expenses: projections.year1?.expenses, net: projections.year1?.net },
        { year: "Year 2", revenue: projections.year2?.revenue, expenses: projections.year2?.expenses, net: projections.year2?.net },
        { year: "Year 3", revenue: projections.year3?.revenue, expenses: projections.year3?.expenses, net: projections.year3?.net },
      ]
    : null;

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    expenses: { label: "Expenses", color: "hsl(var(--destructive))" },
  };

  const revenueModel = fin.revenue_model;
  const isStructuredRevenue = typeof revenueModel === "object" && revenueModel?.primary_model;

  const unitEcon = fin.unit_economics;

  return (
    <ReportSectionCard
      icon={<DollarSign className="h-5 w-5 text-primary" />}
      title="Financial Basics"
    >
      {/* Startup Cost Scenarios */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Startup Cost Scenarios
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <ScenarioCard label="Conservative" data={fin.startup_costs?.conservative} accent="border-border" />
          <ScenarioCard label="Moderate" data={fin.startup_costs?.moderate} accent="border-primary/30 bg-primary/[0.04]" />
          <ScenarioCard label="Aggressive" data={fin.startup_costs?.aggressive} accent="border-border" />
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Revenue Model */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Revenue Model
        </h3>
        {isStructuredRevenue ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2">
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="font-semibold">{revenueModel.primary_model}</p>
              </div>
            </div>
            {revenueModel.pricing_recommendation && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pricing Recommendation</p>
                <p className="text-sm">{revenueModel.pricing_recommendation}</p>
              </div>
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

      <div className="border-t border-border/50" />

      {/* Unit Economics Dashboard */}
      {unitEcon && (
        <>
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Unit Economics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard label="Revenue / Customer" value={unitEcon.average_revenue_per_customer || "—"} icon={<DollarSign className="h-3.5 w-3.5" />} />
              <MetricCard label="CAC" value={unitEcon.estimated_cac || "—"} icon={<Target className="h-3.5 w-3.5" />} />
              <MetricCard label="LTV" value={unitEcon.estimated_ltv || "—"} icon={<TrendingUp className="h-3.5 w-3.5" />} />
              <MetricCard
                label="LTV:CAC"
                value={unitEcon.ltv_to_cac_ratio || "—"}
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              />
            </div>

            {/* CAC Breakdown */}
            {unitEcon.cac_breakdown?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Acquisition Channel Breakdown</p>
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
              </div>
            )}

            {/* Payback & Viability */}
            <div className="grid md:grid-cols-2 gap-3">
              {unitEcon.payback_period && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Payback Period</p>
                  <p className="text-sm font-semibold">{unitEcon.payback_period}</p>
                </div>
              )}
              {unitEcon.viability_assessment && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Viability Assessment</p>
                  <p className="text-sm">{unitEcon.viability_assessment}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/50" />
        </>
      )}

      {/* 3-Year Projections */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          3-Year Projections
        </h3>
        {isStructuredProjections ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Year 1", data: projections.year1 },
                { label: "Year 2", data: projections.year2 },
                { label: "Year 3", data: projections.year3 },
              ].map((yr) => (
                <div key={yr.label} className="rounded-xl border p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{yr.label}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-mono font-semibold text-primary">{yr.data?.revenue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customers</span>
                      <span className="font-mono font-medium">{yr.data?.customers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-mono font-medium">{yr.data?.expenses}</span>
                    </div>
                    <div className="border-t border-border/50 pt-1.5 flex justify-between text-sm">
                      <span className="font-medium">Net</span>
                      <span className="font-mono font-bold">{yr.data?.net}</span>
                    </div>
                  </div>
                  {yr.data?.assumptions && (
                    <p className="text-[11px] text-muted-foreground italic mt-2">{yr.data.assumptions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {["year1", "year2", "year3"].map((key, i) => (
              <div key={key} className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground mb-1">Year {i + 1}</p>
                <p className="text-lg font-bold">{projections?.[key] || "TBD"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/50" />

      {/* Funding & Break-Even */}
      <div className="grid md:grid-cols-2 gap-4">
        {fin.funding_recommendation && (
          <div className="rounded-xl border bg-primary/[0.04] border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Funding Recommendation</p>
            </div>
            <p className="text-sm text-muted-foreground">{fin.funding_recommendation}</p>
          </div>
        )}
        {fin.break_even_estimate && (
          <div className="rounded-xl border bg-muted/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Break-Even Estimate</p>
            </div>
            <p className="text-sm text-muted-foreground">{fin.break_even_estimate}</p>
          </div>
        )}
      </div>
    </ReportSectionCard>
  );
};
