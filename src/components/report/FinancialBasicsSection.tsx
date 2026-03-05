import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

export const FinancialBasicsSection = ({ reportData }: Props) => {
  if (!reportData.financial_basics) return null;

  const fin = reportData.financial_basics;

  return (
    <Collapsible>
      <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <h2 className="text-2xl font-bold">Financial Basics</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Startup Cost Scenarios</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Conservative</p>
                  <p className="text-lg font-semibold">{fin.startup_costs?.conservative}</p>
                </Card>
                <Card className="p-4 border-primary">
                  <p className="text-sm text-muted-foreground mb-1">Moderate</p>
                  <p className="text-lg font-semibold">{fin.startup_costs?.moderate}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Aggressive</p>
                  <p className="text-lg font-semibold">{fin.startup_costs?.aggressive}</p>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Revenue Model</h3>
              <MarkdownContent content={toMarkdownString(fin.revenue_model)} className="text-sm" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">CAC Estimate</h3>
              <MarkdownContent content={toMarkdownString(fin.cac_estimate)} className="text-sm" />
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
