import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Download,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownContent } from "@/components/MarkdownContent";

const ViewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadProjectAndReport();
  }, [id]);

  const loadProjectAndReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load report
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();

      if (reportData) {
        setReport(reportData);
        if (projectData.status === "complete") {
          setProgress(100);
        }
      } else {
        // No report yet, trigger generation
        startReportGeneration();
      }

      setLoading(false);

      // Subscribe to realtime updates
      const channel = supabase
        .channel(`report-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "reports",
            filter: `project_id=eq.${id}`,
          },
          (payload) => {
            console.log("Report updated:", payload);
            setReport(payload.new);
            updateProgress(payload.new.generation_status);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "projects",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            console.log("Project updated:", payload);
            setProject(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load project",
      });
      setLoading(false);
    }
  };

  const startReportGeneration = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-validation-report", {
        body: { project_id: id },
      });

      if (error) throw error;

      toast({
        title: "Report generation started",
        description: "Your validation report is being generated...",
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to start report generation",
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateProgress = (status: any) => {
    const sections = Object.values(status || {});
    const completed = sections.filter((s) => s === "complete").length;
    const total = sections.length;
    setProgress((completed / total) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 70) return "Strong Potential";
    if (score >= 40) return "Moderate Potential";
    return "Needs Work";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const validationScore = project?.validation_score || report?.report_data?.validation_score || 0;
  const reportData = report?.report_data || {};
  const isGenerating = project?.status === "analyzing" || generating;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Validifier
              </span>
            </div>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">{project?.name}</h1>
                <p className="text-muted-foreground">
                  {project?.industry} • Created {new Date(project?.created_at).toLocaleDateString()}
                </p>
              </div>
              {project?.status === "complete" && (
                <div className="text-right">
                  <div className={`text-6xl font-bold ${getScoreColor(validationScore)}`}>
                    {validationScore}
                  </div>
                  <Badge
                    variant={validationScore >= 70 ? "default" : validationScore >= 40 ? "secondary" : "destructive"}
                    className="mt-2"
                  >
                    {getScoreStatus(validationScore)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <Card className="p-6 border-2 border-primary">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <h3 className="font-semibold">Generating Validation Report...</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Our AI is analyzing your business idea using McKinsey-style frameworks. This typically takes 60-90 seconds.
                </p>
              </div>
            </Card>
          )}

          {/* Quick Score (if available) */}
          {reportData.executive_summary && (
            <Card className="p-8 bg-gradient-card border-2 shadow-large">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">Executive Summary</h2>
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-success flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Top Strengths
                    </h3>
                    <ul className="space-y-3">
                      {reportData.executive_summary.strengths?.map((strength: string, i: number) => (
                        <li key={i} className="flex items-start leading-relaxed">
                          <span className="text-success mr-3 mt-1">✓</span>
                          <span className="text-foreground/90">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-warning flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Key Concerns
                    </h3>
                    <ul className="space-y-3">
                      {reportData.executive_summary.concerns?.map((concern: string, i: number) => (
                        <li key={i} className="flex items-start leading-relaxed">
                          <span className="text-warning mr-3 mt-1">⚠</span>
                          <span className="text-foreground/90">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-lg mb-4">Recommendation</h3>
                  <MarkdownContent content={reportData.executive_summary.recommendation} />
                  {reportData.executive_summary.reasoning && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <MarkdownContent content={reportData.executive_summary.reasoning} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Report Sections */}
          {project?.status === "complete" && (
            <div className="space-y-6">
              {/* Market Analysis */}
              {reportData.market_analysis && (
                <Collapsible defaultOpen>
                  <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all">
                    <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">Market Analysis</h2>
                        </div>
                        <Badge variant="secondary">Expand</Badge>
                      </div>
                    </CollapsibleTrigger>
                     <CollapsibleContent className="p-6 pt-0">
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                          <Card className="p-5 bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Total Addressable Market</p>
                            <p className="text-xl font-bold text-primary">{reportData.market_analysis.tam}</p>
                          </Card>
                          <Card className="p-5 bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Available Market</p>
                            <p className="text-xl font-bold text-primary">{reportData.market_analysis.sam}</p>
                          </Card>
                          <Card className="p-5 bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Obtainable Market</p>
                            <p className="text-xl font-bold text-primary">{reportData.market_analysis.som}</p>
                          </Card>
                        </div>
                        
                        <div className="bg-muted/20 p-5 rounded-lg">
                          <h3 className="font-semibold text-lg mb-3">Market Trends</h3>
                          <ul className="space-y-3">
                            {reportData.market_analysis.trends?.map((trend: string, i: number) => (
                              <li key={i} className="flex items-start leading-relaxed">
                                <span className="text-primary mr-3 mt-1">→</span>
                                <span className="text-foreground/90">{trend}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-3">Timing Assessment</h3>
                          <MarkdownContent content={reportData.market_analysis.timing_assessment} />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Competitive Landscape */}
              {reportData.competitive_landscape && (
                <Collapsible>
                  <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all">
                    <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Target className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">Competitive Landscape</h2>
                        </div>
                        <Badge variant="secondary">Expand</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 pt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold text-lg mb-4">Direct Competitors</h3>
                          <div className="space-y-4">
                            {reportData.competitive_landscape.direct_competitors?.map((comp: any, i: number) => (
                              <Card key={i} className="p-5 bg-muted/30">
                                <p className="font-semibold text-lg mb-2">{comp.name}</p>
                                <p className="text-foreground/80 leading-relaxed">{comp.description}</p>
                              </Card>
                            ))}
                          </div>
                        </div>

                        <div className="bg-success/10 p-5 rounded-lg">
                          <h3 className="font-semibold text-lg mb-3">Your Competitive Advantages</h3>
                          <ul className="space-y-3">
                            {reportData.competitive_landscape.competitive_advantages?.map((adv: string, i: number) => (
                              <li key={i} className="flex items-start leading-relaxed">
                                <CheckCircle2 className="h-5 w-5 mr-3 text-success shrink-0 mt-0.5" />
                                <span className="text-foreground/90">{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg mb-3">Positioning Recommendation</h3>
                          <MarkdownContent content={reportData.competitive_landscape.positioning} />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Strategic Frameworks */}
              {reportData.strategic_frameworks && (
                <Collapsible>
                  <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all">
                    <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <BarChart3 className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">Strategic Frameworks</h2>
                        </div>
                        <Badge variant="secondary">Expand</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 pt-0">
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-3">SWOT Analysis</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <Card className="p-4 bg-success/5">
                              <h4 className="font-semibold mb-2 text-success">Strengths</h4>
                              <ul className="space-y-1 text-sm">
                                {reportData.strategic_frameworks.swot?.strengths?.map((s: string, i: number) => (
                                  <li key={i}>• {s}</li>
                                ))}
                              </ul>
                            </Card>
                            <Card className="p-4 bg-destructive/5">
                              <h4 className="font-semibold mb-2 text-destructive">Weaknesses</h4>
                              <ul className="space-y-1 text-sm">
                                {reportData.strategic_frameworks.swot?.weaknesses?.map((w: string, i: number) => (
                                  <li key={i}>• {w}</li>
                                ))}
                              </ul>
                            </Card>
                            <Card className="p-4 bg-primary/5">
                              <h4 className="font-semibold mb-2 text-primary">Opportunities</h4>
                              <ul className="space-y-1 text-sm">
                                {reportData.strategic_frameworks.swot?.opportunities?.map((o: string, i: number) => (
                                  <li key={i}>• {o}</li>
                                ))}
                              </ul>
                            </Card>
                            <Card className="p-4 bg-warning/5">
                              <h4 className="font-semibold mb-2 text-warning">Threats</h4>
                              <ul className="space-y-1 text-sm">
                                {reportData.strategic_frameworks.swot?.threats?.map((t: string, i: number) => (
                                  <li key={i}>• {t}</li>
                                ))}
                              </ul>
                            </Card>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Go-to-Market Strategy</h3>
                          <ul className="space-y-2">
                            {reportData.strategic_frameworks.gtm_strategy?.map((strategy: string, i: number) => (
                              <li key={i} className="text-sm flex items-start">
                                <span className="mr-2 font-bold text-primary">{i + 1}.</span>
                                <span>{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Financial Basics */}
              {reportData.financial_basics && (
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
                              <p className="text-lg font-semibold">{reportData.financial_basics.startup_costs?.conservative}</p>
                            </Card>
                            <Card className="p-4 border-primary">
                              <p className="text-sm text-muted-foreground mb-1">Moderate</p>
                              <p className="text-lg font-semibold">{reportData.financial_basics.startup_costs?.moderate}</p>
                            </Card>
                            <Card className="p-4">
                              <p className="text-sm text-muted-foreground mb-1">Aggressive</p>
                              <p className="text-lg font-semibold">{reportData.financial_basics.startup_costs?.aggressive}</p>
                            </Card>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">Revenue Model</h3>
                          <MarkdownContent content={reportData.financial_basics.revenue_model} className="text-sm" />
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">CAC Estimate</h3>
                          <MarkdownContent content={reportData.financial_basics.cac_estimate} className="text-sm" />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {project?.status === "complete" && (
            <div className="flex items-center justify-center space-x-4 pt-8">
              <Button 
                variant="default" 
                size="lg"
                onClick={() => navigate(`/projects/${id}/chat`)}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Chat with Cora
              </Button>
              <Button variant="outline" size="lg" disabled>
                <Download className="mr-2 h-5 w-5" />
                Export as PDF
                <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewReport;
