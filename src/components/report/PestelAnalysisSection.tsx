import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, DollarSign, Users, Zap, FileText } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

const PestelFactor = ({ icon, label, content }: { icon: React.ReactNode; label: string; content: any }) => {
  if (!content) return null;
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        {icon}
        {label}
      </h3>
      <Card className="p-4 bg-muted/30">
        <MarkdownContent content={toMarkdownString(content)} />
      </Card>
    </div>
  );
};

export const PestelAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.pestel_analysis) return null;

  const p = reportData.pestel_analysis;

  return (
    <Collapsible>
      <Card id="pestel-analysis" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">PESTEL Analysis</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-6">
            <PestelFactor icon={<span className="text-xl">🏛️</span>} label="Political Factors" content={p.political} />
            <PestelFactor icon={<DollarSign className="h-5 w-5 text-primary" />} label="Economic Factors" content={p.economic} />
            <PestelFactor icon={<Users className="h-5 w-5 text-primary" />} label="Social Factors" content={p.social} />
            <PestelFactor icon={<Zap className="h-5 w-5 text-primary" />} label="Technological Factors" content={p.technological} />
            <PestelFactor icon={<span className="text-xl">🌱</span>} label="Environmental Factors" content={p.environmental} />
            <PestelFactor icon={<FileText className="h-5 w-5 text-primary" />} label="Legal Factors" content={p.legal} />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
