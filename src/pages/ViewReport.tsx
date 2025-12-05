import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
  Users,
  Copy,
  MapPin,
  DollarSign,
  Heart,
  XCircle,
  Lightbulb,
  Globe,
  FileText,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ReportNavigation } from "@/components/ReportNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const ViewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Helper to safely convert content to string for MarkdownContent
  const toMarkdownString = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') {
      // Remove "Go:" or "No-Go:" prefix if present
      return content.replace(/^(Go|No-Go):\s*/i, '').trim();
    }
    if (typeof content === 'object') {
      // If it has a 'text' or 'content' property, use that
      if (content.text) return String(content.text).replace(/^(Go|No-Go):\s*/i, '').trim();
      if (content.content) return String(content.content).replace(/^(Go|No-Go):\s*/i, '').trim();
      // Otherwise stringify it
      return JSON.stringify(content, null, 2);
    }
    return String(content).replace(/^(Go|No-Go):\s*/i, '').trim();
  };

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
      console.log("Loading project and report for ID:", id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found, redirecting to auth");
        navigate("/auth");
        return;
      }

      console.log("User authenticated:", user.id);

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (projectError) {
        console.error("Project error:", projectError);
        throw projectError;
      }
      
      console.log("Project loaded:", projectData);
      setProject(projectData);

      // Load report
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();

      if (reportError) {
        console.error("Report error:", reportError);
        // Don't throw here, just log - report might not exist yet
      }

      console.log("Report data:", reportData);

      if (reportData) {
        setReport(reportData);
        console.log("Customer personas data:", (reportData.report_data as any)?.customer_personas);
        if (projectData.status === "complete") {
          setProgress(100);
        } else {
          updateProgress(reportData.generation_status);
        }
      } else {
        // No report yet, trigger generation
        console.log("No report found, triggering generation");
        startReportGeneration();
      }

      setLoading(false);

      // Subscribe to realtime updates
      console.log("Setting up realtime subscriptions");
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
        console.log("Cleaning up realtime subscriptions");
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast.error(error.message || "Failed to load project");
      setLoading(false);
      // Don't navigate away - stay on page so user can see error
    }
  };

  const startReportGeneration = async () => {
    console.log("Starting report generation for project:", id);
    setGenerating(true);
    setProgress(0); // Initialize progress to 0
    try {
      const { data, error } = await supabase.functions.invoke("generate-validation-report", {
        body: { project_id: id },
      });

      if (error) {
        console.error("Report generation error:", error);
        throw error;
      }

      console.log("Report generation response:", data);
      toast.success("Report generation started!");
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Failed to start report generation");
      setGenerating(false);
    }
    // Don't set generating to false here - let realtime updates handle it
  };

  const updateProgress = (status: any) => {
    console.log("Updating progress with status:", status);
    const sections = Object.values(status || {});
    const completed = sections.filter((s) => s === "complete").length;
    const total = sections.length;
    const newProgress = total > 0 ? (completed / total) * 100 : 0;
    console.log(`Progress: ${completed}/${total} sections = ${newProgress}%`);
    setProgress(newProgress);
    
    // If all sections are complete, stop showing generating state
    if (completed === total && total > 0) {
      console.log("All sections complete!");
      setGenerating(false);
    }
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
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // If project failed to load, show error
  if (!project && !loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
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
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Section Navigation */}
          {project?.status === "complete" && Object.keys(reportData).length > 0 && (
            <div className="hidden lg:block w-56 shrink-0">
              <ReportNavigation reportData={reportData} />
            </div>
          )}
          
          <div className="flex-1 max-w-4xl space-y-8">
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
            <Card id="executive-summary" className="p-8 bg-gradient-card border-2 shadow-large scroll-mt-28">
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
                  <MarkdownContent content={toMarkdownString(reportData.executive_summary.recommendation)} />
                  {reportData.executive_summary.reasoning && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <MarkdownContent content={toMarkdownString(reportData.executive_summary.reasoning)} />
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
                  <Card id="market-analysis" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
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
                            <div className="text-xl font-bold text-primary">
                              {typeof reportData.market_analysis.tam === 'object' 
                                ? reportData.market_analysis.tam.estimate || JSON.stringify(reportData.market_analysis.tam)
                                : reportData.market_analysis.tam}
                            </div>
                          </Card>
                          <Card className="p-5 bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Available Market</p>
                            <div className="text-xl font-bold text-primary">
                              {typeof reportData.market_analysis.sam === 'object' 
                                ? reportData.market_analysis.sam.estimate || JSON.stringify(reportData.market_analysis.sam)
                                : reportData.market_analysis.sam}
                            </div>
                          </Card>
                          <Card className="p-5 bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Obtainable Market</p>
                            <div className="text-xl font-bold text-primary">
                              {typeof reportData.market_analysis.som === 'object' 
                                ? reportData.market_analysis.som.estimate || JSON.stringify(reportData.market_analysis.som)
                                : reportData.market_analysis.som}
                            </div>
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
                          <MarkdownContent content={toMarkdownString(reportData.market_analysis.timing_assessment)} />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Customer Personas */}
              {reportData.customer_personas && Array.isArray(reportData.customer_personas) && reportData.customer_personas.length > 0 && (
                <Collapsible>
                  <Card id="customer-personas" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
                    <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Users className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">Your Target Customers</h2>
                        </div>
                        <Badge variant="secondary">Expand</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 pt-0">
                      <p className="text-muted-foreground mb-8">
                        Meet the 3-4 people most likely to buy from you
                      </p>

                      {/* Start With Callout */}
                      {reportData.customer_personas[0] && (
                        <Card className="p-6 bg-primary/10 border-primary/30 mb-8">
                          <div className="flex items-start gap-4">
                            <div className="shrink-0">
                              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                🎯
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-2">START WITH {reportData.customer_personas[0].name?.toUpperCase()}</h3>
                              <p className="text-foreground/90 mb-2">
                                <strong>Why:</strong> {reportData.customer_personas[0].priority_reason}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Persona Cards */}
                      <div className="space-y-8">
                        {reportData.customer_personas.map((persona: any, idx: number) => (
                          <Card key={idx} className="p-6 bg-muted/30">
                            <div className="space-y-6">
                              {/* Header */}
                              <div className="flex items-center justify-between pb-4 border-b">
                                <h3 className="text-2xl font-bold">{persona.name}</h3>
                                {idx === 0 && (
                                  <Badge variant="default" className="text-sm">START HERE</Badge>
                                )}
                                {idx > 0 && (
                                  <Badge variant="secondary" className="text-sm">{persona.priority} PRIORITY</Badge>
                                )}
                              </div>

                              {/* Who They Are */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Users className="h-5 w-5 text-primary" />
                                  Who They Are
                                </h4>
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Age:</span> <strong>{persona.age}</strong>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Job:</span> <strong>{persona.job}</strong>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Income:</span> <strong>{persona.income}</strong>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Location:</span> <strong>{persona.location}</strong>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-sm">Values:</p>
                                  <p className="font-medium">{Array.isArray(persona.values) ? persona.values.join(', ') : persona.values}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-sm">Personality:</p>
                                  <p className="font-medium">{Array.isArray(persona.personality) ? persona.personality.join(', ') : persona.personality}</p>
                                </div>
                              </div>

                              {/* Pain Points */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-warning" />
                                  3 Big Pain Points
                                </h4>
                                <div className="space-y-3">
                                  {persona.pain_points?.map((pp: any, i: number) => (
                                    <div key={i} className="bg-warning/10 p-4 rounded-lg">
                                      <p className="font-semibold text-warning">
                                        {i === 0 ? 'PRIMARY' : i === 1 ? 'SECONDARY' : 'TERTIARY'}: {pp.pain}
                                      </p>
                                      <p className="text-sm text-foreground/80 mt-1">
                                        <strong>Impact:</strong> {pp.impact}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                  <p className="text-sm"><strong>Current broken solution:</strong> {persona.current_solution}</p>
                                  <p className="text-sm mt-2"><strong>Dream outcome:</strong> {persona.dream_outcome}</p>
                                </div>
                              </div>

                              {/* Objections */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <XCircle className="h-5 w-5 text-destructive" />
                                  Objections (What stops them from buying)
                                </h4>
                                <div className="space-y-2">
                                  {persona.objections?.map((obj: any, i: number) => (
                                    <div key={i} className="bg-destructive/10 p-3 rounded-lg text-sm">
                                      <p><strong>"{obj.objection}"</strong></p>
                                      <p className="text-foreground/70 mt-1">→ Root cause: {obj.root_cause}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Closing Angles */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Lightbulb className="h-5 w-5 text-success" />
                                  Closing Angles (How to convert them)
                                </h4>
                                <div className="space-y-2">
                                  {persona.closing_angles?.map((angle: any, i: number) => (
                                    <div key={i} className="bg-success/10 p-3 rounded-lg text-sm">
                                      <p className="font-semibold">{angle.angle}</p>
                                      <p className="text-foreground/70 text-xs mt-1">Addresses: {angle.addresses}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                                  <p><strong>Proof they need:</strong> {persona.proof_needed}</p>
                                  <p><strong>Urgency trigger:</strong> {persona.urgency_trigger}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Competitive Landscape */}
              {reportData.competitive_landscape && (
                <Collapsible>
                  <Card id="competitive-landscape" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
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
                          <MarkdownContent content={toMarkdownString(reportData.competitive_landscape.positioning)} />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Strategic Frameworks */}
              {reportData.strategic_frameworks && (
                <Collapsible>
                  <Card id="strategic-frameworks" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
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

              {/* Porter's Five Forces */}
              {reportData.porter_five_forces && (
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
                        {/* Supplier Power */}
                        {reportData.porter_five_forces.supplier_power && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">Supplier Power</h3>
                              <Badge variant={
                                reportData.porter_five_forces.supplier_power.rating === "High" ? "destructive" :
                                reportData.porter_five_forces.supplier_power.rating === "Low" ? "default" : "secondary"
                              }>
                                {reportData.porter_five_forces.supplier_power.rating}
                              </Badge>
                            </div>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.porter_five_forces.supplier_power.analysis)} />
                            </Card>
                          </div>
                        )}

                        {/* Buyer Power */}
                        {reportData.porter_five_forces.buyer_power && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">Buyer Power</h3>
                              <Badge variant={
                                reportData.porter_five_forces.buyer_power.rating === "High" ? "destructive" :
                                reportData.porter_five_forces.buyer_power.rating === "Low" ? "default" : "secondary"
                              }>
                                {reportData.porter_five_forces.buyer_power.rating}
                              </Badge>
                            </div>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.porter_five_forces.buyer_power.analysis)} />
                            </Card>
                          </div>
                        )}

                        {/* Competitive Rivalry */}
                        {reportData.porter_five_forces.competitive_rivalry && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">Competitive Rivalry</h3>
                              <Badge variant={
                                reportData.porter_five_forces.competitive_rivalry.rating === "High" ? "destructive" :
                                reportData.porter_five_forces.competitive_rivalry.rating === "Low" ? "default" : "secondary"
                              }>
                                {reportData.porter_five_forces.competitive_rivalry.rating}
                              </Badge>
                            </div>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.porter_five_forces.competitive_rivalry.analysis)} />
                            </Card>
                          </div>
                        )}

                        {/* Threat of Substitution */}
                        {reportData.porter_five_forces.threat_of_substitution && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">Threat of Substitution</h3>
                              <Badge variant={
                                reportData.porter_five_forces.threat_of_substitution.rating === "High" ? "destructive" :
                                reportData.porter_five_forces.threat_of_substitution.rating === "Low" ? "default" : "secondary"
                              }>
                                {reportData.porter_five_forces.threat_of_substitution.rating}
                              </Badge>
                            </div>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.porter_five_forces.threat_of_substitution.analysis)} />
                            </Card>
                          </div>
                        )}

                        {/* Threat of New Entry */}
                        {reportData.porter_five_forces.threat_of_new_entry && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">Threat of New Entry</h3>
                              <Badge variant={
                                reportData.porter_five_forces.threat_of_new_entry.rating === "High" ? "destructive" :
                                reportData.porter_five_forces.threat_of_new_entry.rating === "Low" ? "default" : "secondary"
                              }>
                                {reportData.porter_five_forces.threat_of_new_entry.rating}
                              </Badge>
                            </div>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.porter_five_forces.threat_of_new_entry.analysis)} />
                            </Card>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* PESTEL Analysis */}
              {reportData.pestel_analysis && (
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
                        {/* Political */}
                        {reportData.pestel_analysis.political && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <span className="text-xl">🏛️</span>
                              Political Factors
                            </h3>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.pestel_analysis.political)} />
                            </Card>
                          </div>
                        )}

                        {/* Economic */}
                        {reportData.pestel_analysis.economic && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-primary" />
                              Economic Factors
                            </h3>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.pestel_analysis.economic)} />
                            </Card>
                          </div>
                        )}

                        {/* Social */}
                        {reportData.pestel_analysis.social && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <Users className="h-5 w-5 text-primary" />
                              Social Factors
                            </h3>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.pestel_analysis.social)} />
                            </Card>
                          </div>
                        )}

                        {/* Technological */}
                        {reportData.pestel_analysis.technological && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <Zap className="h-5 w-5 text-primary" />
                              Technological Factors
                            </h3>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.pestel_analysis.technological)} />
                            </Card>
                          </div>
                        )}

                        {/* Environmental */}
                        {reportData.pestel_analysis.environmental && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <span className="text-xl">🌱</span>
                              Environmental Factors
                            </h3>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.pestel_analysis.environmental)} />
                            </Card>
                          </div>
                        )}

                        {/* Legal */}
                        {reportData.pestel_analysis.legal && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              Legal Factors
                            </h3>
                            <Card className="p-4 bg-muted/30">
                              <MarkdownContent content={toMarkdownString(reportData.pestel_analysis.legal)} />
                            </Card>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

        {/* CATWOE Analysis */}
        {reportData.catwoe_analysis && (
          <Card id="catwoe-analysis" className="scroll-mt-28">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                CATWOE Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="customers">
                  <AccordionTrigger>Customers</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-2">{reportData.catwoe_analysis.customers.description}</p>
                    <ul className="list-disc pl-6 space-y-1">
                      {reportData.catwoe_analysis.customers.key_points.map((point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="actors">
                  <AccordionTrigger>Actors</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-2">{reportData.catwoe_analysis.actors.description}</p>
                    <ul className="list-disc pl-6 space-y-1">
                      {reportData.catwoe_analysis.actors.key_points.map((point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="transformation">
                  <AccordionTrigger>Transformation Process</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-3">{reportData.catwoe_analysis.transformation.description}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Inputs:</h4>
                        <ul className="list-disc pl-6">
                          {reportData.catwoe_analysis.transformation.inputs.map((input: string, idx: number) => (
                            <li key={idx}>{input}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Outputs:</h4>
                        <ul className="list-disc pl-6">
                          {reportData.catwoe_analysis.transformation.outputs.map((output: string, idx: number) => (
                            <li key={idx}>{output}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="worldview">
                  <AccordionTrigger>World View</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-2">{reportData.catwoe_analysis.world_view.description}</p>
                    <h4 className="font-semibold mt-3 mb-2">Key Assumptions:</h4>
                    <ul className="list-disc pl-6 space-y-1">
                      {reportData.catwoe_analysis.world_view.assumptions.map((assumption: string, idx: number) => (
                        <li key={idx}>{assumption}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="owners">
                  <AccordionTrigger>Owners</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-2">{reportData.catwoe_analysis.owners.description}</p>
                    <h4 className="font-semibold mt-3 mb-2">Key Stakeholders:</h4>
                    <ul className="list-disc pl-6 space-y-1">
                      {reportData.catwoe_analysis.owners.stakeholders.map((stakeholder: string, idx: number) => (
                        <li key={idx}>{stakeholder}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="environmental">
                  <AccordionTrigger>Environmental Constraints</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-2">{reportData.catwoe_analysis.environmental_constraints.description}</p>
                    <ul className="list-disc pl-6 space-y-1">
                      {reportData.catwoe_analysis.environmental_constraints.constraints.map((constraint: string, idx: number) => (
                        <li key={idx}>{constraint}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Path to MVP */}
        {reportData.path_to_mvp && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Path to MVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="mvp-definition">
                  <AccordionTrigger>MVP Definition</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-2">{reportData.path_to_mvp.mvp_definition.description}</p>
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-1">Core Value:</h4>
                      <p className="text-sm">{reportData.path_to_mvp.mvp_definition.core_value}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="core-features">
                  <AccordionTrigger>Core Features</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {reportData.path_to_mvp.core_features.map((feature: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{feature.feature}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              feature.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                              feature.priority === 'medium' ? 'bg-primary/20 text-primary' :
                              'bg-muted-foreground/20 text-muted-foreground'
                            }`}>
                              {feature.priority}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Effort:</span> {feature.effort}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Value:</span> {feature.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="development-phases">
                  <AccordionTrigger>Development Phases</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {reportData.path_to_mvp.development_phases.map((phase: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{phase.phase}</h4>
                            <span className="text-sm text-muted-foreground">{phase.duration}</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-sm font-semibold mb-1">Deliverables:</h5>
                              <ul className="list-disc pl-5 text-sm space-y-1">
                                {phase.deliverables.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold mb-1">Milestones:</h5>
                              <ul className="list-disc pl-5 text-sm space-y-1">
                                {phase.milestones.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="resources">
                  <AccordionTrigger>Resource Requirements</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Team:</h4>
                        <div className="flex flex-wrap gap-2">
                          {reportData.path_to_mvp.resource_requirements.team.map((role: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Tools & Technologies:</h4>
                        <div className="flex flex-wrap gap-2">
                          {reportData.path_to_mvp.resource_requirements.tools.map((tool: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-muted rounded-full text-sm">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-1">Estimated Budget:</h4>
                          <p className="text-sm">{reportData.path_to_mvp.resource_requirements.estimated_budget}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-1">Timeline:</h4>
                          <p className="text-sm">{reportData.path_to_mvp.resource_requirements.timeline}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="launch">
                  <AccordionTrigger>Launch Strategy</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1">Target Audience:</h4>
                        <p className="text-sm text-muted-foreground">{reportData.path_to_mvp.launch_strategy.target_audience}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Launch Channels:</h4>
                        <div className="flex flex-wrap gap-2">
                          {reportData.path_to_mvp.launch_strategy.channels.map((channel: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Approach:</h4>
                        <p className="text-sm text-muted-foreground">{reportData.path_to_mvp.launch_strategy.approach}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Timeline:</h4>
                        <p className="text-sm text-muted-foreground">{reportData.path_to_mvp.launch_strategy.timeline}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="metrics">
                  <AccordionTrigger>Success Metrics</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {reportData.path_to_mvp.success_metrics.map((metric: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">{metric.metric}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Target:</span> {metric.target}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Measurement:</span> {metric.measurement}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="iteration">
                  <AccordionTrigger>Iteration Plan</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Feedback Channels:</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {reportData.path_to_mvp.iteration_plan.feedback_channels.map((channel: string, idx: number) => (
                            <li key={idx}>{channel}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Review Frequency:</h4>
                        <p className="text-sm text-muted-foreground">{reportData.path_to_mvp.iteration_plan.review_frequency}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Improvement Process:</h4>
                        <p className="text-sm text-muted-foreground">{reportData.path_to_mvp.iteration_plan.improvement_process}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Go-To-Market Strategy */}
        {reportData.go_to_market_strategy && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Go-To-Market Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="target-segments">
                  <AccordionTrigger>Target Market Segments</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {reportData.go_to_market_strategy.target_segments.map((segment: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">{segment.segment}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-muted-foreground">Market Size:</span> {segment.size}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold mb-1">Key Characteristics:</h5>
                            <ul className="list-disc pl-5 text-sm">
                              {segment.characteristics.map((char: string, i: number) => (
                                <li key={i}>{char}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="value-prop">
                  <AccordionTrigger>Value Proposition</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <h4 className="font-semibold mb-2">Primary Value Proposition:</h4>
                        <p className="text-sm">{reportData.go_to_market_strategy.value_proposition.primary}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Key Differentiators:</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {reportData.go_to_market_strategy.value_proposition.differentiators.map((diff: string, idx: number) => (
                            <li key={idx}>{diff}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="marketing-channels">
                  <AccordionTrigger>Marketing Channels</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {reportData.go_to_market_strategy.marketing_channels.map((channel: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">{channel.channel}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{channel.strategy}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Budget:</span> {channel.budget_allocation}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected ROI:</span> {channel.expected_roi}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sales-strategy">
                  <AccordionTrigger>Sales Strategy</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Sales Process:</h4>
                        <p className="text-sm text-muted-foreground">{reportData.go_to_market_strategy.sales_strategy.process}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Team Structure:</h4>
                        <div className="flex flex-wrap gap-2">
                          {reportData.go_to_market_strategy.sales_strategy.team_structure.map((role: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Conversion Tactics:</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {reportData.go_to_market_strategy.sales_strategy.conversion_tactics.map((tactic: string, idx: number) => (
                            <li key={idx}>{tactic}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pricing">
                  <AccordionTrigger>Pricing Strategy</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-1">Pricing Model:</h4>
                        <p className="text-sm">{reportData.go_to_market_strategy.pricing_strategy.model}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Pricing Tiers:</h4>
                        <div className="space-y-2">
                          {reportData.go_to_market_strategy.pricing_strategy.tiers.map((tier: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold">{tier.name}</h5>
                                <span className="text-lg font-bold text-primary">{tier.price}</span>
                              </div>
                              <ul className="list-disc pl-5 text-sm space-y-1">
                                {tier.features.map((feature: string, i: number) => (
                                  <li key={i}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <h4 className="font-semibold mb-1">Competitive Position:</h4>
                        <p className="text-sm">{reportData.go_to_market_strategy.pricing_strategy.competitive_position}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="launch-phases">
                  <AccordionTrigger>Launch Phases</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {reportData.go_to_market_strategy.launch_phases.map((phase: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{phase.phase}</h4>
                            <span className="text-sm text-muted-foreground">{phase.duration}</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-sm font-semibold mb-1">Activities:</h5>
                              <ul className="list-disc pl-5 text-sm space-y-1">
                                {phase.activities.map((activity: string, i: number) => (
                                  <li key={i}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold mb-1">Goals:</h5>
                              <ul className="list-disc pl-5 text-sm space-y-1">
                                {phase.goals.map((goal: string, i: number) => (
                                  <li key={i}>{goal}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="growth-tactics">
                  <AccordionTrigger>Growth Tactics</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {reportData.go_to_market_strategy.growth_tactics.map((tactic: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">{tactic.tactic}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{tactic.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Implementation:</span>
                              <p className="text-xs mt-1">{tactic.implementation}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected Impact:</span>
                              <p className="text-xs mt-1">{tactic.expected_impact}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="key-metrics">
                  <AccordionTrigger>Key Metrics</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {reportData.go_to_market_strategy.key_metrics.map((metric: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">{metric.metric}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Target:</span> {metric.target}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Frequency:</span> {metric.measurement_frequency}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* USP Analysis */}
        {reportData.usp_analysis && (
          <Card>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="usp">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-6 w-6" />
                      Unique Selling Proposition (USP)
                    </CardTitle>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6">
                    {/* Recommended USP */}
                    <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-2">Recommended USP</h4>
                      <p className="text-lg font-medium">{reportData.usp_analysis.recommended_usp}</p>
                    </div>

                    {/* Current Positioning */}
                    {reportData.usp_analysis.current_positioning && (
                      <div>
                        <h4 className="font-semibold mb-2">Current Positioning</h4>
                        <p className="mb-3">{reportData.usp_analysis.current_positioning.summary}</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Strengths:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {reportData.usp_analysis.current_positioning.strengths?.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Gaps:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {reportData.usp_analysis.current_positioning.gaps?.map((gap: string, i: number) => (
                                <li key={i}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key Differentiators */}
                    {reportData.usp_analysis.key_differentiators && (
                      <div>
                        <h4 className="font-semibold mb-3">Key Differentiators</h4>
                        <div className="space-y-3">
                          {reportData.usp_analysis.key_differentiators.map((diff: any, i: number) => (
                            <div key={i} className="border-l-2 border-primary pl-4">
                              <p className="font-medium">{diff.differentiator}</p>
                              <p className="text-sm text-muted-foreground">{diff.description}</p>
                              <p className="text-sm mt-1"><span className="font-medium">Impact:</span> {diff.impact}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competitive Advantages */}
                    {reportData.usp_analysis.competitive_advantages && (
                      <div>
                        <h4 className="font-semibold mb-3">Competitive Advantages</h4>
                        <div className="grid gap-3">
                          {reportData.usp_analysis.competitive_advantages.map((adv: any, i: number) => (
                            <div key={i} className="p-3 bg-muted/50 rounded-lg">
                              <p className="font-medium">{adv.advantage}</p>
                              <p className="text-sm text-muted-foreground mt-1">{adv.description}</p>
                              <p className="text-sm mt-2 text-primary">📊 {adv.quantifiable_benefit}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Value Proposition */}
                    {reportData.usp_analysis.value_proposition && (
                      <div>
                        <h4 className="font-semibold mb-3">Value Proposition Components</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-500/10 rounded">
                            <p className="font-medium text-blue-700 dark:text-blue-300">What</p>
                            <p className="text-sm">{reportData.usp_analysis.value_proposition.what}</p>
                          </div>
                          <div className="p-3 bg-green-500/10 rounded">
                            <p className="font-medium text-green-700 dark:text-green-300">How</p>
                            <p className="text-sm">{reportData.usp_analysis.value_proposition.how}</p>
                          </div>
                          <div className="p-3 bg-purple-500/10 rounded">
                            <p className="font-medium text-purple-700 dark:text-purple-300">Why</p>
                            <p className="text-sm">{reportData.usp_analysis.value_proposition.why}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Target Alignment */}
                    {reportData.usp_analysis.target_alignment && (
                      <div>
                        <h4 className="font-semibold mb-3">Target Audience Alignment</h4>
                        <p className="mb-3"><span className="font-medium">Primary Audience:</span> {reportData.usp_analysis.target_alignment.primary_audience}</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Emotional Triggers:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {reportData.usp_analysis.target_alignment.emotional_triggers?.map((trigger: string, i: number) => (
                                <li key={i}>{trigger}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Rational Benefits:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {reportData.usp_analysis.target_alignment.rational_benefits?.map((benefit: string, i: number) => (
                                <li key={i}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proof Points */}
                    {reportData.usp_analysis.proof_points && (
                      <div>
                        <h4 className="font-semibold mb-3">Proof Points</h4>
                        <div className="space-y-3">
                          {reportData.usp_analysis.proof_points.map((point: any, i: number) => (
                            <div key={i} className="border rounded-lg p-3">
                              <p className="font-medium">{point.claim}</p>
                              <p className="text-sm text-muted-foreground mt-1"><span className="font-medium">Evidence:</span> {point.evidence}</p>
                              <p className="text-sm mt-1"><span className="font-medium">Credibility:</span> {point.credibility}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Communication Guidelines */}
                    {reportData.usp_analysis.communication_guidelines && (
                      <div>
                        <h4 className="font-semibold mb-3">Communication Guidelines</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Elevator Pitch (30 seconds):</p>
                            <p className="p-3 bg-muted/50 rounded">{reportData.usp_analysis.communication_guidelines.elevator_pitch}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Tagline Options:</p>
                            <div className="space-y-2">
                              {reportData.usp_analysis.communication_guidelines.tagline_options?.map((tagline: string, i: number) => (
                                <p key={i} className="p-2 bg-primary/5 rounded text-center font-medium">{tagline}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Key Messages:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {reportData.usp_analysis.communication_guidelines.key_messages?.map((message: string, i: number) => (
                                <li key={i}>{message}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Tone:</p>
                            <p>{reportData.usp_analysis.communication_guidelines.tone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
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
                          <MarkdownContent content={toMarkdownString(reportData.financial_basics.revenue_model)} className="text-sm" />
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2">CAC Estimate</h3>
                          <MarkdownContent content={toMarkdownString(reportData.financial_basics.cac_estimate)} className="text-sm" />
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
              <Button 
                variant="outline" 
                size="lg"
                onClick={async () => {
                  toast.info("Generating PDF... This may take 10 seconds");
                  try {
                    const { data, error } = await supabase.functions.invoke('generate-pdf', {
                      body: { project_id: id }
                    });
                    if (error) throw error;
                    toast.success("PDF generated! Check your downloads");
                  } catch (error) {
                    console.error('PDF generation error:', error);
                    toast.error("Failed to generate PDF");
                  }
                }}
              >
                <Download className="mr-2 h-5 w-5" />
                Export as PDF
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReport;
