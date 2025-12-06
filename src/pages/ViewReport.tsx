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
  Share2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ReportNavigation } from "@/components/ReportNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { safeString, safeArray, isPlaceholder } from "@/lib/reportHelpers";

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

  // Helper to safely parse JSON strings that might be embedded in data
  const tryParseJson = (value: any): any => {
    if (typeof value !== 'string') return value;
    try {
      // Try direct parsing first
      return JSON.parse(value);
    } catch (e) {
      // Try to clean up common JSON issues
      try {
        // Remove leading/trailing whitespace
        let cleaned = value.trim();
        // Fix trailing commas
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(cleaned);
      } catch {
        console.log('Failed to parse JSON string:', value.substring(0, 200));
        return value;
      }
    }
  };

  // Helper to check if value is placeholder/pending content
  const isPendingContent = (value: any): boolean => {
    if (!value) return true;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      // Check if it's a short placeholder string (not a long paragraph)
      if (lower.length > 100) return false; // Long strings are likely real content
      return lower === 'tbd' || 
             lower === 'analysis pending' ||
             lower === 'pending' ||
             lower.includes('in progress') ||
             lower === 'not available' ||
             lower === 'n/a' ||
             lower === 'review analysis';
    }
    return false;
  };

  // Helper to extract market data from potentially nested structures
  const getMarketData = (marketAnalysis: any) => {
    if (!marketAnalysis) return {};
    
    console.log('getMarketData input:', JSON.stringify(marketAnalysis).substring(0, 500));
    
    // First, try to find data nested inside trends[0] (common malformed response)
    const trendsFirstItem = marketAnalysis?.trends?.[0];
    console.log('trends[0] type:', typeof trendsFirstItem);
    
    let nestedData = tryParseJson(trendsFirstItem);
    console.log('nestedData type:', typeof nestedData, 'hasTam:', nestedData?.tam ? 'yes' : 'no');
    
    // Check if the entire market_analysis is a JSON string
    if (typeof marketAnalysis === 'string') {
      marketAnalysis = tryParseJson(marketAnalysis);
    }
    
    // If nested data has actual market values (not placeholder), use them
    if (nestedData && typeof nestedData === 'object') {
      const hasTam = nestedData.tam && !isPendingContent(nestedData.tam);
      const hasTrends = Array.isArray(nestedData.trends) && nestedData.trends.length > 0;
      
      console.log('hasTam:', hasTam, 'hasTrends:', hasTrends);
      
      if (hasTam || hasTrends) {
        const result = {
          tam: !isPendingContent(nestedData.tam) ? nestedData.tam : marketAnalysis.tam,
          sam: !isPendingContent(nestedData.sam) ? nestedData.sam : marketAnalysis.sam,
          som: !isPendingContent(nestedData.som) ? nestedData.som : marketAnalysis.som,
          growth_rate: !isPendingContent(nestedData.growth_rate) ? nestedData.growth_rate : marketAnalysis.growth_rate,
          trends: hasTrends ? nestedData.trends.map((t: any) => typeof t === 'string' ? t : (t.trend || t.name || t.description || String(t))) : [],
          barriers: Array.isArray(nestedData.barriers) ? nestedData.barriers : (marketAnalysis.barriers || []),
          timing_assessment: !isPendingContent(nestedData.timing_assessment) ? nestedData.timing_assessment : marketAnalysis.timing_assessment
        };
        console.log('Returning extracted data with tam:', result.tam?.substring(0, 100));
        return result;
      }
    }
    
    // Normalize trends array to strings
    let trends = marketAnalysis.trends || [];
    if (Array.isArray(trends)) {
      trends = trends
        .filter((t: any) => t && typeof t !== 'object' || (typeof t === 'object' && !t.tam)) // Filter out nested market data objects
        .map((t: any) => typeof t === 'string' ? t : (t?.trend || t?.name || t?.description || ''))
        .filter(Boolean);
    }
    
    console.log('Returning fallback marketAnalysis');
    return {
      ...marketAnalysis,
      trends,
      barriers: Array.isArray(marketAnalysis.barriers) ? marketAnalysis.barriers : []
    };
  };

  // Helper to extract competitive landscape data from potentially nested structures
  const getCompetitiveLandscape = (competitiveLandscape: any) => {
    if (!competitiveLandscape) return {};
    
    console.log('getCompetitiveLandscape input:', JSON.stringify(competitiveLandscape).substring(0, 500));
    
    // Check if the entire thing is a JSON string
    competitiveLandscape = tryParseJson(competitiveLandscape);
    
    // Check if positioning contains the actual data (malformed response)
    let positioning = tryParseJson(competitiveLandscape.positioning);
    console.log('positioning type:', typeof positioning, 'isObject:', positioning && typeof positioning === 'object');
    
    // If positioning is an object with nested competitor data, extract it
    if (positioning && typeof positioning === 'object') {
      const hasDirectComp = Array.isArray(positioning.direct_competitors) && positioning.direct_competitors.length > 0;
      const hasAdvantages = Array.isArray(positioning.competitive_advantages) && positioning.competitive_advantages.length > 0;
      
      console.log('hasDirectComp:', hasDirectComp, 'hasAdvantages:', hasAdvantages);
      
      if (hasDirectComp || hasAdvantages) {
        const result = {
          direct_competitors: positioning.direct_competitors || [],
          indirect_competitors: positioning.indirect_competitors || [],
          competitive_advantages: positioning.competitive_advantages || [],
          positioning: typeof positioning.positioning === 'string' ? positioning.positioning : 
                       typeof positioning.market_positioning === 'string' ? positioning.market_positioning : ''
        };
        console.log('Returning extracted competitive data with', result.direct_competitors?.length, 'competitors');
        return result;
      }
    }
    
    // Check if direct_competitors is nested inside an array item
    const directComp = competitiveLandscape.direct_competitors;
    if (Array.isArray(directComp) && directComp.length === 1 && typeof directComp[0] === 'object') {
      const nested = directComp[0];
      if (nested.direct_competitors || nested.competitive_advantages) {
        return {
          direct_competitors: Array.isArray(nested.direct_competitors) ? nested.direct_competitors : [],
          indirect_competitors: Array.isArray(nested.indirect_competitors) ? nested.indirect_competitors : [],
          competitive_advantages: Array.isArray(nested.competitive_advantages) ? nested.competitive_advantages : [],
          positioning: nested.positioning || competitiveLandscape.positioning || ''
        };
      }
    }
    
    // Return with safe defaults, handling positioning string properly
    const positioningStr = typeof positioning === 'string' ? positioning : 
                          typeof competitiveLandscape.positioning === 'string' ? competitiveLandscape.positioning : '';
    
    console.log('Returning fallback competitive data');
    return {
      direct_competitors: Array.isArray(competitiveLandscape.direct_competitors) ? competitiveLandscape.direct_competitors : [],
      indirect_competitors: Array.isArray(competitiveLandscape.indirect_competitors) ? competitiveLandscape.indirect_competitors : [],
      competitive_advantages: Array.isArray(competitiveLandscape.competitive_advantages) ? competitiveLandscape.competitive_advantages : [],
      positioning: positioningStr
    };
  };

  // Helper to extract Porter's Five Forces data
  const getPorterFiveForces = (porterData: any) => {
    if (!porterData) return null;
    
    porterData = tryParseJson(porterData);
    
    const defaultForce = { rating: "Medium", analysis: "Analysis in progress..." };
    
    return {
      supplier_power: porterData.supplier_power || defaultForce,
      buyer_power: porterData.buyer_power || defaultForce,
      competitive_rivalry: porterData.competitive_rivalry || defaultForce,
      threat_of_substitution: porterData.threat_of_substitution || defaultForce,
      threat_of_new_entry: porterData.threat_of_new_entry || defaultForce
    };
  };

  // Helper to extract Go-To-Market data
  const getGoToMarketData = (gtmData: any) => {
    if (!gtmData) return null;
    
    gtmData = tryParseJson(gtmData);
    
    return {
      target_segments: Array.isArray(gtmData.target_segments) ? gtmData.target_segments : [],
      value_proposition: gtmData.value_proposition || {},
      marketing_channels: Array.isArray(gtmData.marketing_channels) ? gtmData.marketing_channels : [],
      sales_strategy: gtmData.sales_strategy || {},
      pricing_strategy: gtmData.pricing_strategy || {},
      launch_phases: Array.isArray(gtmData.launch_phases) ? gtmData.launch_phases : [],
      growth_tactics: Array.isArray(gtmData.growth_tactics) ? gtmData.growth_tactics : [],
      key_metrics: Array.isArray(gtmData.key_metrics) ? gtmData.key_metrics : []
    };
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
      
      // Check if user is the owner (for showing owner-specific features)
      const isOwner = !!user;
      console.log("User authenticated:", user?.id, "isOwner:", isOwner);

      // Load project (public access via RLS)
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projectError) {
        console.error("Project error:", projectError);
        throw projectError;
      }
      
      console.log("Project loaded:", projectData);
      setProject(projectData);

      // Load report (public access via RLS)
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
      } else if (isOwner && projectData.user_id === user?.id) {
        // Only trigger generation if user is the owner
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

  const startReportGeneration = async (regenerate = false) => {
    console.log("Starting report generation for project:", id, "regenerate:", regenerate);
    setGenerating(true);
    setProgress(0); // Initialize progress to 0
    try {
      const { data, error } = await supabase.functions.invoke("generate-validation-report", {
        body: { project_id: id, regenerate },
      });

      if (error) {
        console.error("Report generation error:", error);
        throw error;
      }

      console.log("Report generation response:", data);
      toast.success(regenerate ? "Regenerating report..." : "Report generation started!");
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
                <div className="text-right space-y-2">
                  <div className={`text-6xl font-bold ${getScoreColor(validationScore)}`}>
                    {validationScore}
                  </div>
                  <Badge
                    variant={validationScore >= 70 ? "default" : validationScore >= 40 ? "secondary" : "destructive"}
                  >
                    {getScoreStatus(validationScore)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => startReportGeneration(true)}
                    disabled={isGenerating}
                    className="mt-2 block"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
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
                      {(() => {
                        const marketData = getMarketData(reportData.market_analysis) as {
                          tam?: string;
                          sam?: string;
                          som?: string;
                          growth_rate?: string;
                          trends?: string[];
                          barriers?: string[];
                          timing_assessment?: string;
                        };
                        return (
                          <div className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-4">
                              <Card className="p-5 bg-muted/30">
                                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Total Addressable Market</p>
                                <div className="text-xl font-bold text-primary">
                                  {safeString(marketData.tam, 'Analysis in progress')}
                                </div>
                              </Card>
                              <Card className="p-5 bg-muted/30">
                                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Available Market</p>
                                <div className="text-xl font-bold text-primary">
                                  {safeString(marketData.sam, 'Analysis in progress')}
                                </div>
                              </Card>
                              <Card className="p-5 bg-muted/30">
                                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Obtainable Market</p>
                                <div className="text-xl font-bold text-primary">
                                  {safeString(marketData.som, 'Analysis in progress')}
                                </div>
                              </Card>
                            </div>
                            
                            <div className="bg-muted/20 p-5 rounded-lg">
                              <h3 className="font-semibold text-lg mb-3">Market Trends</h3>
                              {safeArray(marketData.trends).length > 0 ? (
                                <ul className="space-y-3">
                                  {safeArray(marketData.trends).map((trend: string, i: number) => (
                                    <li key={i} className="flex items-start leading-relaxed">
                                      <span className="text-primary mr-3 mt-1">→</span>
                                      <span className="text-foreground/90">{trend}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted-foreground italic">Trend analysis in progress...</p>
                              )}
                            </div>

                            <div>
                              <h3 className="font-semibold text-lg mb-3">Timing Assessment</h3>
                              <MarkdownContent content={toMarkdownString(marketData.timing_assessment)} />
                            </div>
                          </div>
                        );
                      })()}
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
                      {(() => {
                        const compData = getCompetitiveLandscape(reportData.competitive_landscape) as {
                          direct_competitors?: any[];
                          indirect_competitors?: any[];
                          competitive_advantages?: string[];
                          positioning?: string;
                        };
                        return (
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-semibold text-lg mb-4">Direct Competitors</h3>
                              <div className="space-y-4">
                                {compData.direct_competitors && compData.direct_competitors.length > 0 ? (
                                  compData.direct_competitors.map((comp: any, i: number) => (
                                    <Card key={i} className="p-5 bg-muted/30">
                                      <p className="font-semibold text-lg mb-2">{comp.name}</p>
                                      <p className="text-foreground/80 leading-relaxed">{comp.description}</p>
                                    </Card>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground italic">Competitor analysis in progress...</p>
                                )}
                              </div>
                            </div>

                            <div className="bg-success/10 p-5 rounded-lg">
                              <h3 className="font-semibold text-lg mb-3">Your Competitive Advantages</h3>
                              {compData.competitive_advantages && compData.competitive_advantages.length > 0 ? (
                                <ul className="space-y-3">
                                  {compData.competitive_advantages.map((adv: string, i: number) => (
                                    <li key={i} className="flex items-start leading-relaxed">
                                      <CheckCircle2 className="h-5 w-5 mr-3 text-success shrink-0 mt-0.5" />
                                      <span className="text-foreground/90">{adv}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted-foreground italic">Advantage analysis in progress...</p>
                              )}
                            </div>

                            <div>
                              <h3 className="font-semibold text-lg mb-3">Positioning Recommendation</h3>
                              <MarkdownContent content={safeString(compData.positioning || '', 'Positioning analysis in progress...')} />
                            </div>
                          </div>
                        );
                      })()}
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
                      {(() => {
                        const porterData = getPorterFiveForces(reportData.porter_five_forces);
                        if (!porterData) return <p className="text-muted-foreground italic">Analysis in progress...</p>;
                        return (
                          <div className="space-y-6">
                            {/* Supplier Power */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">Supplier Power</h3>
                                <Badge variant={
                                  porterData.supplier_power?.rating === "High" ? "destructive" :
                                  porterData.supplier_power?.rating === "Low" ? "default" : "secondary"
                                }>
                                  {porterData.supplier_power?.rating || "Medium"}
                                </Badge>
                              </div>
                              <Card className="p-4 bg-muted/30">
                                <MarkdownContent content={toMarkdownString(porterData.supplier_power?.analysis)} />
                              </Card>
                            </div>

                            {/* Buyer Power */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">Buyer Power</h3>
                                <Badge variant={
                                  porterData.buyer_power?.rating === "High" ? "destructive" :
                                  porterData.buyer_power?.rating === "Low" ? "default" : "secondary"
                                }>
                                  {porterData.buyer_power?.rating || "Medium"}
                                </Badge>
                              </div>
                              <Card className="p-4 bg-muted/30">
                                <MarkdownContent content={toMarkdownString(porterData.buyer_power?.analysis)} />
                              </Card>
                            </div>

                            {/* Competitive Rivalry */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">Competitive Rivalry</h3>
                                <Badge variant={
                                  porterData.competitive_rivalry?.rating === "High" ? "destructive" :
                                  porterData.competitive_rivalry?.rating === "Low" ? "default" : "secondary"
                                }>
                                  {porterData.competitive_rivalry?.rating || "Medium"}
                                </Badge>
                              </div>
                              <Card className="p-4 bg-muted/30">
                                <MarkdownContent content={toMarkdownString(porterData.competitive_rivalry?.analysis)} />
                              </Card>
                            </div>

                            {/* Threat of Substitution */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">Threat of Substitution</h3>
                                <Badge variant={
                                  porterData.threat_of_substitution?.rating === "High" ? "destructive" :
                                  porterData.threat_of_substitution?.rating === "Low" ? "default" : "secondary"
                                }>
                                  {porterData.threat_of_substitution?.rating || "Medium"}
                                </Badge>
                              </div>
                              <Card className="p-4 bg-muted/30">
                                <MarkdownContent content={toMarkdownString(porterData.threat_of_substitution?.analysis)} />
                              </Card>
                            </div>

                            {/* Threat of New Entry */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">Threat of New Entry</h3>
                                <Badge variant={
                                  porterData.threat_of_new_entry?.rating === "High" ? "destructive" :
                                  porterData.threat_of_new_entry?.rating === "Low" ? "default" : "secondary"
                                }>
                                  {porterData.threat_of_new_entry?.rating || "Medium"}
                                </Badge>
                              </div>
                              <Card className="p-4 bg-muted/30">
                                <MarkdownContent content={toMarkdownString(porterData.threat_of_new_entry?.analysis)} />
                              </Card>
                            </div>
                          </div>
                        );
                      })()}
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
                <Collapsible>
                  <Card id="catwoe-analysis" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
                    <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Users className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">CATWOE Analysis</h2>
                        </div>
                        <Badge variant="secondary">Expand</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 pt-0">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Customers */}
                        <Card className="p-4 bg-primary/5">
                          <h4 className="font-semibold mb-2 text-primary flex items-center gap-2">
                            <span className="text-lg font-bold">C</span> Customers
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">{reportData.catwoe_analysis.customers?.description}</p>
                          <ul className="space-y-1 text-sm">
                            {reportData.catwoe_analysis.customers?.key_points?.map((point: string, i: number) => (
                              <li key={i}>• {point}</li>
                            ))}
                          </ul>
                        </Card>
                        
                        {/* Actors */}
                        <Card className="p-4 bg-success/5">
                          <h4 className="font-semibold mb-2 text-success flex items-center gap-2">
                            <span className="text-lg font-bold">A</span> Actors
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">{reportData.catwoe_analysis.actors?.description}</p>
                          <ul className="space-y-1 text-sm">
                            {reportData.catwoe_analysis.actors?.key_points?.map((point: string, i: number) => (
                              <li key={i}>• {point}</li>
                            ))}
                          </ul>
                        </Card>
                        
                        {/* Transformation */}
                        <Card className="p-4 bg-warning/5">
                          <h4 className="font-semibold mb-2 text-warning flex items-center gap-2">
                            <span className="text-lg font-bold">T</span> Transformation
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">{reportData.catwoe_analysis.transformation?.description}</p>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Inputs:</span>
                              <ul className="ml-2">
                                {reportData.catwoe_analysis.transformation?.inputs?.map((input: string, i: number) => (
                                  <li key={i}>• {input}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium">Outputs:</span>
                              <ul className="ml-2">
                                {reportData.catwoe_analysis.transformation?.outputs?.map((output: string, i: number) => (
                                  <li key={i}>• {output}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </Card>
                        
                        {/* World View */}
                        <Card className="p-4 bg-secondary/50">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="text-lg font-bold">W</span> World View
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">{reportData.catwoe_analysis.world_view?.description}</p>
                          <div className="text-sm">
                            <span className="font-medium">Assumptions:</span>
                            <ul className="ml-2 mt-1">
                              {reportData.catwoe_analysis.world_view?.assumptions?.map((assumption: string, i: number) => (
                                <li key={i}>• {assumption}</li>
                              ))}
                            </ul>
                          </div>
                        </Card>
                        
                        {/* Owners */}
                        <Card className="p-4 bg-destructive/5">
                          <h4 className="font-semibold mb-2 text-destructive flex items-center gap-2">
                            <span className="text-lg font-bold">O</span> Owners
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">{reportData.catwoe_analysis.owners?.description}</p>
                          <div className="text-sm">
                            <span className="font-medium">Stakeholders:</span>
                            <ul className="ml-2 mt-1">
                              {reportData.catwoe_analysis.owners?.stakeholders?.map((stakeholder: string, i: number) => (
                                <li key={i}>• {stakeholder}</li>
                              ))}
                            </ul>
                          </div>
                        </Card>
                        
                        {/* Environmental Constraints */}
                        <Card className="p-4 bg-muted/50">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="text-lg font-bold">E</span> Environment
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">{reportData.catwoe_analysis.environmental_constraints?.description}</p>
                          <div className="text-sm">
                            <span className="font-medium">Constraints:</span>
                            <ul className="ml-2 mt-1">
                              {reportData.catwoe_analysis.environmental_constraints?.constraints?.map((constraint: string, i: number) => (
                                <li key={i}>• {constraint}</li>
                              ))}
                            </ul>
                          </div>
                        </Card>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Path to MVP */}
              {reportData.path_to_mvp && (
                <Collapsible>
                  <Card id="path-to-mvp" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
                    <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Lightbulb className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">Path to MVP</h2>
                        </div>
                        <Badge variant="secondary">Expand</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 pt-0">
                      <div className="space-y-6">
                        {/* MVP Definition */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">MVP Definition</h3>
                          <Card className="p-4 bg-primary/5">
                            <p className="text-muted-foreground mb-3">{reportData.path_to_mvp.mvp_definition?.description}</p>
                            <div className="p-3 bg-background rounded-lg border">
                              <span className="font-semibold text-primary">Core Value:</span>
                              <p className="text-sm mt-1">{reportData.path_to_mvp.mvp_definition?.core_value}</p>
                            </div>
                          </Card>
                        </div>

                        {/* Core Features */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Core Features</h3>
                          <div className="grid md:grid-cols-2 gap-3">
                            {reportData.path_to_mvp.core_features?.map((feature: any, idx: number) => (
                              <Card key={idx} className="p-4 bg-muted/30">
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
                                  <div><span className="text-muted-foreground">Effort:</span> {feature.effort}</div>
                                  <div><span className="text-muted-foreground">Value:</span> {feature.value}</div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Development Phases */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Development Phases</h3>
                          <div className="space-y-3">
                            {reportData.path_to_mvp.development_phases?.map((phase: any, idx: number) => (
                              <Card key={idx} className="p-4 bg-muted/30">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{phase.phase}</h4>
                                    <span className="text-xs text-muted-foreground">{phase.duration}</span>
                                  </div>
                                </div>
                                <ul className="text-sm space-y-1 ml-11">
                                  {phase.deliverables?.map((d: string, i: number) => (
                                    <li key={i}>• {d}</li>
                                  ))}
                                </ul>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Resources & Launch */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Resource Requirements */}
                          <Card className="p-4 bg-success/5">
                            <h3 className="font-semibold text-lg mb-3 text-success">Resources</h3>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Team:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {reportData.path_to_mvp.resource_requirements?.team?.map((member: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-success/10 rounded text-xs">{member}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Tools:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {reportData.path_to_mvp.resource_requirements?.tools?.map((tool: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-muted rounded text-xs">{tool}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                                <div><span className="text-muted-foreground">Budget:</span> {reportData.path_to_mvp.resource_requirements?.estimated_budget}</div>
                                <div><span className="text-muted-foreground">Timeline:</span> {reportData.path_to_mvp.resource_requirements?.timeline}</div>
                              </div>
                            </div>
                          </Card>

                          {/* Launch Strategy */}
                          <Card className="p-4 bg-primary/5">
                            <h3 className="font-semibold text-lg mb-3 text-primary">Launch Strategy</h3>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-semibold">Target:</span>
                                <p className="text-muted-foreground">{reportData.path_to_mvp.launch_strategy?.target_audience}</p>
                              </div>
                              <div>
                                <span className="font-semibold">Channels:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {reportData.path_to_mvp.launch_strategy?.channels?.map((channel: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">{channel}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="font-semibold">Approach:</span>
                                <p className="text-muted-foreground">{reportData.path_to_mvp.launch_strategy?.approach}</p>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Success Metrics */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Success Metrics</h3>
                          <div className="grid md:grid-cols-3 gap-3">
                            {reportData.path_to_mvp.success_metrics?.map((metric: any, idx: number) => (
                              <Card key={idx} className="p-4 bg-muted/30">
                                <h4 className="font-semibold text-sm mb-2">{metric.metric}</h4>
                                <div className="text-xs space-y-1">
                                  <div><span className="text-muted-foreground">Target:</span> {metric.target}</div>
                                  <div><span className="text-muted-foreground">How:</span> {metric.measurement}</div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Iteration Plan */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Iteration Plan</h3>
                          <Card className="p-4 bg-muted/30">
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-semibold">Feedback Channels:</span>
                                <ul className="mt-1">
                                  {reportData.path_to_mvp.iteration_plan?.feedback_channels?.map((channel: string, i: number) => (
                                    <li key={i}>• {channel}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <span className="font-semibold">Review Frequency:</span>
                                <p className="text-muted-foreground mt-1">{reportData.path_to_mvp.iteration_plan?.review_frequency}</p>
                              </div>
                              <div>
                                <span className="font-semibold">Process:</span>
                                <p className="text-muted-foreground mt-1">{reportData.path_to_mvp.iteration_plan?.improvement_process}</p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Go-To-Market Strategy */}
              {reportData.go_to_market_strategy && (
                <Collapsible>
                  <Card id="go-to-market" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
                    <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Target className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">Go-To-Market Strategy</h2>
                        </div>
                        <Badge variant="secondary">Expand</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 pt-0">
                      {(() => {
                        const gtmData = getGoToMarketData(reportData.go_to_market_strategy);
                        if (!gtmData) return <p className="text-muted-foreground italic">Analysis in progress...</p>;
                        return (
                      <div className="space-y-6">
                        {/* Value Proposition */}
                        <Card className="p-4 bg-primary/5 border-primary/20">
                          <h3 className="font-semibold text-lg mb-3 text-primary">Value Proposition</h3>
                          <p className="mb-3">{gtmData.value_proposition?.primary || 'Analysis in progress...'}</p>
                          <div>
                            <span className="font-semibold text-sm">Differentiators:</span>
                            <ul className="mt-2 space-y-1">
                              {gtmData.value_proposition?.differentiators?.map((diff: string, i: number) => (
                                <li key={i} className="flex items-start text-sm">
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-success shrink-0 mt-0.5" />
                                  {diff}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </Card>

                        {/* Target Segments */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Target Market Segments</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {gtmData.target_segments?.map((segment: any, idx: number) => (
                              <Card key={idx} className="p-4 bg-muted/30">
                                <h4 className="font-semibold mb-2">{segment.segment}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                                <div className="text-xs mb-2"><span className="text-muted-foreground">Size:</span> {segment.size}</div>
                                <ul className="text-sm space-y-1">
                                  {segment.characteristics?.map((char: string, i: number) => (
                                    <li key={i}>• {char}</li>
                                  ))}
                                </ul>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Marketing Channels & Pricing */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Marketing Channels */}
                          <div>
                            <h3 className="font-semibold text-lg mb-3">Marketing Channels</h3>
                            <div className="space-y-3">
                              {gtmData.marketing_channels?.map((channel: any, idx: number) => (
                                <Card key={idx} className="p-3 bg-success/5">
                                  <h4 className="font-semibold text-sm mb-1">{channel.channel}</h4>
                                  <p className="text-xs text-muted-foreground mb-2">{channel.strategy}</p>
                                  <div className="flex gap-4 text-xs">
                                    <span><span className="text-muted-foreground">Budget:</span> {channel.budget_allocation}</span>
                                    <span><span className="text-muted-foreground">ROI:</span> {channel.expected_roi}</span>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Pricing Strategy */}
                          <div>
                            <h3 className="font-semibold text-lg mb-3">Pricing Strategy</h3>
                            <Card className="p-4 bg-warning/5">
                              <div className="mb-3">
                                <span className="font-semibold text-sm">Model:</span>
                                <p className="text-sm">{gtmData.pricing_strategy?.model}</p>
                              </div>
                              <div className="space-y-2">
                                {gtmData.pricing_strategy?.tiers?.map((tier: any, idx: number) => (
                                  <div key={idx} className="p-2 bg-background rounded border">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-semibold text-sm">{tier.name}</span>
                                      <span className="text-primary font-bold">{tier.price}</span>
                                    </div>
                                    <ul className="text-xs space-y-0.5">
                                      {tier.features?.slice(0, 3).map((f: string, i: number) => (
                                        <li key={i}>• {f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">{gtmData.pricing_strategy?.competitive_position}</p>
                            </Card>
                          </div>
                        </div>

                        {/* Sales Strategy */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Sales Strategy</h3>
                          <Card className="p-4 bg-muted/30">
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-semibold">Process:</span>
                                <p className="text-muted-foreground mt-1">{safeString(gtmData.sales_strategy?.process, 'TBD')}</p>
                              </div>
                              <div>
                                <span className="font-semibold">Team:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {safeArray(gtmData.sales_strategy?.team_structure).map((role: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                                      {typeof role === 'object' ? (role as any).role || (role as any).name || JSON.stringify(role) : role}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="font-semibold">Tactics:</span>
                                <ul className="mt-1">
                                  {safeArray(gtmData.sales_strategy?.conversion_tactics).slice(0, 3).map((t: string, i: number) => (
                                    <li key={i}>• {t}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Launch Phases */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Launch Phases</h3>
                          <div className="space-y-3">
                            {gtmData.launch_phases?.map((phase: any, idx: number) => (
                              <Card key={idx} className="p-4 bg-muted/30">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{phase.phase}</h4>
                                    <span className="text-xs text-muted-foreground">{phase.duration}</span>
                                  </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 ml-11 text-sm">
                                  <div>
                                    <span className="font-semibold">Activities:</span>
                                    <ul className="mt-1">
                                      {phase.activities?.map((a: string, i: number) => (
                                        <li key={i}>• {a}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Goals:</span>
                                    <ul className="mt-1">
                                      {phase.goals?.map((g: string, i: number) => (
                                        <li key={i}>• {g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Growth Tactics & Metrics */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-3">Growth Tactics</h3>
                            <div className="space-y-2">
                              {gtmData.growth_tactics?.map((tactic: any, idx: number) => (
                                <Card key={idx} className="p-3 bg-success/5">
                                  <h4 className="font-semibold text-sm mb-1">{tactic.tactic}</h4>
                                  <p className="text-xs text-muted-foreground">{tactic.description}</p>
                                  <p className="text-xs mt-1"><span className="text-muted-foreground">Impact:</span> {tactic.expected_impact}</p>
                                </Card>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-3">Key Metrics</h3>
                            <div className="space-y-2">
                              {gtmData.key_metrics?.map((metric: any, idx: number) => (
                                <Card key={idx} className="p-3 bg-primary/5">
                                  <h4 className="font-semibold text-sm mb-1">{metric.metric}</h4>
                                  <div className="flex gap-4 text-xs">
                                    <span><span className="text-muted-foreground">Target:</span> {metric.target}</span>
                                    <span><span className="text-muted-foreground">Frequency:</span> {metric.measurement_frequency}</span>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                        );
                      })()}
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
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
                      <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Target className="w-4 h-4 text-primary" />
                          </div>
                          <h4 className="font-semibold text-lg">Current Positioning</h4>
                        </div>
                        <p className="mb-5 text-muted-foreground leading-relaxed">{reportData.usp_analysis.current_positioning.summary}</p>
                        <div className="grid md:grid-cols-2 gap-5">
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <p className="font-medium text-emerald-600 dark:text-emerald-400">Strengths</p>
                            </div>
                            <ul className="space-y-2">
                              {reportData.usp_analysis.current_positioning.strengths?.map((strength: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <p className="font-medium text-amber-600 dark:text-amber-400">Gaps to Address</p>
                            </div>
                            <ul className="space-y-2">
                              {reportData.usp_analysis.current_positioning.gaps?.map((gap: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                  <span>{gap}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key Differentiators */}
                    {reportData.usp_analysis.key_differentiators && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <h4 className="font-semibold text-lg">Key Differentiators</h4>
                        </div>
                        <div className="grid gap-4">
                          {reportData.usp_analysis.key_differentiators.map((diff: any, i: number) => (
                            <div key={i} className="group relative bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-xl p-5 border border-primary/10 hover:border-primary/30 transition-all duration-300">
                              <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {i + 1}
                              </div>
                              <div className="ml-12">
                                <p className="font-semibold text-foreground mb-1">{diff.differentiator}</p>
                                <p className="text-sm text-muted-foreground mb-3">{diff.description}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                                  <Zap className="w-3 h-3" />
                                  Impact: {diff.impact}
                                </div>
                              </div>
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
            <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
              <Button 
                variant="default" 
                size="lg"
                onClick={() => navigate(`/projects/${id}/chat`)}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Chat with Cora
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
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
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReport;
