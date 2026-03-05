import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString, getPorterFiveForces } from "@/lib/reportHelpers";
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

const FORCES = [
  { key: "supplier_power", label: "Supplier Power" },
  { key: "buyer_power", label: "Buyer Power" },
  { key: "competitive_rivalry", label: "Competitive Rivalry" },
  { key: "threat_of_substitution", label: "Threat of Substitution" },
  { key: "threat_of_new_entry", label: "Threat of New Entry" },
] as const;

export const PorterFiveForcesSection = ({ reportData }: Props) => {
  if (!reportData.porter_five_forces) return null;

  const porterData = getPorterFiveForces(reportData.porter_five_forces);
  if (!porterData) return null;

  return (
    <ReportSectionCard id="porter-five-forces" title="Porter's Five Forces">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs h-8 w-[180px]">Force</TableHead>
            <TableHead className="text-xs h-8 w-[80px] text-center">Rating</TableHead>
            <TableHead className="text-xs h-8">Analysis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FORCES.map((f, i) => {
            const force = (porterData as any)[f.key];
            const rating = force?.rating || "Medium";
            return (
              <TableRow key={f.key} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <TableCell className="py-3 font-medium text-sm">{f.label}</TableCell>
                <TableCell className="py-3 text-center">
                  <Badge variant={rating === "High" ? "destructive" : rating === "Low" ? "default" : "secondary"} className="text-[10px]">
                    {rating}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">
                  {force?.analysis ? (
                    <MarkdownContent content={toMarkdownString(force.analysis)} />
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ReportSectionCard>
  );
};
