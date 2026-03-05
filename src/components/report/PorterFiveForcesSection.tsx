import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString, getPorterFiveForces } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

const ForceBlock = ({ label, force }: { label: string; force: any }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-lg">{label}</h3>
      <Badge variant={
        force?.rating === "High" ? "destructive" :
        force?.rating === "Low" ? "default" : "secondary"
      }>
        {force?.rating || "Medium"}
      </Badge>
    </div>
    <Card className="p-4 bg-muted/30">
      <MarkdownContent content={toMarkdownString(force?.analysis)} />
    </Card>
  </div>
);

export const PorterFiveForcesSection = ({ reportData }: Props) => {
  if (!reportData.porter_five_forces) return null;

  const porterData = getPorterFiveForces(reportData.porter_five_forces);
  if (!porterData) return null;

  return (
    <Collapsible>
      <Card id="porter-five-forces" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Porter's Five Forces Analysis</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-6">
            <ForceBlock label="Supplier Power" force={porterData.supplier_power} />
            <ForceBlock label="Buyer Power" force={porterData.buyer_power} />
            <ForceBlock label="Competitive Rivalry" force={porterData.competitive_rivalry} />
            <ForceBlock label="Threat of Substitution" force={porterData.threat_of_substitution} />
            <ForceBlock label="Threat of New Entry" force={porterData.threat_of_new_entry} />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
