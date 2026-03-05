import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ValidationScoreRing } from "@/components/report/ValidationScoreRing";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GitCompareArrows,
  Trophy,
  Loader2,
  Sparkles,
  ArrowLeft,
  Target,
  Users,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  Briefcase,
} from "lucide-react";

interface CompareProjectsProps {
  projects: any[];
}

interface ProjectMetrics {
  name: string;
  industry: string;
  score: number;
  tam: string;
  competitors: number;
  strengths: number;
  weaknesses: number;
  startup_cost: string;
  business_model: string;
  recommendation?: string;
}

interface ComparisonResult {
  projects: ProjectMetrics[];
  comparison_summary: string;
}

export const CompareProjects = ({ projects }: CompareProjectsProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "results">("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const completedProjects = projects.filter(
    (p) => p.status === "complete" && p.validation_score != null
  );

  if (completedProjects.length < 2) return null;

  const toggleProject = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 projects");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (selected.length < 2) {
      toast.error("Select at least 2 projects to compare");
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("compare-projects", {
        body: { project_ids: selected },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      setStep("results");
    } catch (err: any) {
      toast.error(err.message || "Failed to compare projects");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep("select");
      setSelected([]);
      setResult(null);
    }, 200);
  };

  // Find winner for each metric
  const getWinner = (metric: keyof ProjectMetrics, higher = true) => {
    if (!result) return -1;
    const values = result.projects.map((p) => {
      const val = p[metric];
      if (typeof val === "number") return val;
      // Parse dollar amounts
      if (typeof val === "string") {
        const num = parseFloat(val.replace(/[^0-9.]/g, ""));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    });
    if (values.every((v) => v === values[0])) return -1; // tie
    const extreme = higher ? Math.max(...values) : Math.min(...values);
    return values.indexOf(extreme);
  };

  const metricRows: {
    label: string;
    key: keyof ProjectMetrics;
    icon: React.ReactNode;
    higherIsBetter: boolean;
    format?: (v: any) => string;
  }[] = [
    { label: "Market Size (TAM)", key: "tam", icon: <Target className="h-4 w-4" />, higherIsBetter: true },
    { label: "Competitors", key: "competitors", icon: <Users className="h-4 w-4" />, higherIsBetter: false, format: (v: number) => `${v} identified` },
    { label: "SWOT Strengths", key: "strengths", icon: <ShieldCheck className="h-4 w-4" />, higherIsBetter: true },
    { label: "SWOT Weaknesses", key: "weaknesses", icon: <ShieldAlert className="h-4 w-4" />, higherIsBetter: false },
    { label: "Startup Cost", key: "startup_cost", icon: <DollarSign className="h-4 w-4" />, higherIsBetter: false },
    { label: "Business Model", key: "business_model", icon: <Briefcase className="h-4 w-4" />, higherIsBetter: true },
  ];

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <GitCompareArrows className="h-4 w-4" />
        Compare Projects
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {step === "select" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <GitCompareArrows className="h-6 w-6 text-primary" />
                  Compare Projects
                </DialogTitle>
                <DialogDescription>
                  Select 2-3 completed projects to compare side by side
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-4">
                {completedProjects.map((project) => (
                  <Card
                    key={project.id}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      selected.includes(project.id)
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selected.includes(project.id)}
                        onCheckedChange={() => toggleProject(project.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.industry} • Score: {project.validation_score}/100
                        </p>
                      </div>
                      <ValidationScoreRing score={project.validation_score} size="sm" showBadge={false} />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCompare}
                  disabled={selected.length < 2 || loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <GitCompareArrows className="h-4 w-4" />
                      Compare ({selected.length})
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === "results" && result && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setStep("select")} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <DialogTitle className="text-2xl">Comparison Results</DialogTitle>
                    <DialogDescription>
                      {result.projects.map((p) => p.name).join(" vs ")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Score Rings */}
              <div className={`grid gap-6 mt-6 ${result.projects.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {result.projects.map((p, i) => {
                  const isHighest = p.score === Math.max(...result.projects.map((x) => x.score));
                  const isTied = result.projects.filter((x) => x.score === p.score).length > 1;
                  return (
                    <Card key={i} className={`p-6 text-center space-y-3 relative ${isHighest && !isTied ? "border-primary/40 bg-primary/5" : ""}`}>
                      {isHighest && !isTied && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="gap-1 bg-primary text-primary-foreground">
                            <Trophy className="h-3 w-3" />
                            Highest
                          </Badge>
                        </div>
                      )}
                      <ValidationScoreRing score={p.score} size="md" />
                      <h3 className="font-bold text-lg truncate">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.industry}</p>
                    </Card>
                  );
                })}
              </div>

              {/* Comparison Table */}
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className={`grid ${result.projects.length === 2 ? "grid-cols-3" : "grid-cols-4"} bg-muted/50`}>
                  <div className="p-3 font-semibold text-sm">Metric</div>
                  {result.projects.map((p, i) => (
                    <div key={i} className="p-3 font-semibold text-sm text-center truncate">
                      {p.name}
                    </div>
                  ))}
                </div>
                {metricRows.map((row) => {
                  const winner = getWinner(row.key, row.higherIsBetter);
                  return (
                    <div
                      key={row.key}
                      className={`grid ${result.projects.length === 2 ? "grid-cols-3" : "grid-cols-4"} border-t`}
                    >
                      <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                        {row.icon}
                        {row.label}
                      </div>
                      {result.projects.map((p, i) => {
                        const val = p[row.key];
                        const display = row.format ? row.format(val) : String(val);
                        const isWinner = winner === i;
                        return (
                          <div
                            key={i}
                            className={`p-3 text-sm text-center flex items-center justify-center gap-1.5 ${
                              isWinner ? "text-primary font-semibold bg-primary/5" : ""
                            }`}
                          >
                            {display}
                            {isWinner && <Trophy className="h-3 w-3 text-primary shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* AI Summary */}
              <Card className="mt-6 p-5 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">AI Comparison Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.comparison_summary}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </>
          )}

          {/* Loading state for results */}
          {step === "results" && !result && (
            <div className="space-y-6 py-8">
              <div className="flex justify-center gap-8">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
