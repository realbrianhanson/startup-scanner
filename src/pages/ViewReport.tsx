import { useEffect, useState, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  MessageSquare,
  Download,
  AlertTriangle,
  RefreshCw,
  Copy,
  Share2,
  MoreVertical,
  Trash2,
  FileText,
  Twitter,
  ClipboardCheck,
  CalendarCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  formatExecutiveSummaryText,
  generateReportMarkdown,
  generateSocialShareText,
  downloadAsFile,
} from "@/lib/exportHelpers";
import { ReportNavigation } from "@/components/ReportNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { ValidationScoreRing } from "@/components/report/ValidationScoreRing";
import { GenerationExperience } from "@/components/report/GenerationExperience";
import { ExecutiveSummarySection } from "@/components/report/ExecutiveSummarySection";
import { MarketAnalysisSection } from "@/components/report/MarketAnalysisSection";
import { CustomerPersonasSection } from "@/components/report/CustomerPersonasSection";
import { CompetitiveLandscapeSection } from "@/components/report/CompetitiveLandscapeSection";
import { StrategicFrameworksSection } from "@/components/report/StrategicFrameworksSection";
import { PorterFiveForcesSection } from "@/components/report/PorterFiveForcesSection";
import { PestelAnalysisSection } from "@/components/report/PestelAnalysisSection";
import { CatwoeAnalysisSection } from "@/components/report/CatwoeAnalysisSection";
import { PathToMvpSection } from "@/components/report/PathToMvpSection";
import { GoToMarketSection } from "@/components/report/GoToMarketSection";
import { UspAnalysisSection } from "@/components/report/UspAnalysisSection";
import { GameChangingIdeaSection } from "@/components/report/GameChangingIdeaSection";
import { FinancialBasicsSection } from "@/components/report/FinancialBasicsSection";
import { RiskMatrixSection } from "@/components/report/RiskMatrixSection";
import { ActionPlanSection } from "@/components/report/ActionPlanSection";
import { InlineReportCTA, StickyReportCTA, EndOfReportCTA } from "@/components/report/ReportCTAs";
import { ReportSectionErrorBoundary } from "@/components/ReportSectionErrorBoundary";
import { ReportFeedback } from "@/components/ReportFeedback";

const CALENDLY_URL = "https://calendly.com/REPLACE_WITH_YOUR_LINK";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

function openCompletionCalendly() {
  const url = `${CALENDLY_URL}?utm_source=validifier&utm_medium=report&utm_campaign=completion_cta`;
  if (window.Calendly) {
    window.Calendly.initPopupWidget({ url });
  } else {
    window.open(url, "_blank");
  }
}

function getScoreMessage(score: number) {
  if (score >= 70) return "Great potential! Want to discuss how to capitalize on your strengths?";
  if (score >= 40) return "Solid foundation with room to improve. Want expert guidance on your next steps?";
  return "Every great business started somewhere. Want help pivoting this into something stronger?";
}

const ViewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompletionCTA, setShowCompletionCTA] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState(false);
  const wasGeneratingRef = useRef(false);

  const handleDeleteProject = async () => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      toast.success("Project deleted");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  useEffect(() => {
    if (project) {
      document.title = `${project.name} - Validation Report | Validifier`;
    } else {
      document.title = "Validation Report | Validifier";
    }
  }, [project]);

  useEffect(() => {
    loadProjectAndReport();

    const channel = supabase
      .channel(`report-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reports", filter: `project_id=eq.${id}` },
        (payload) => { setReport(payload.new); updateProgress(payload.new.generation_status); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${id}` },
        (payload) => { setProject(payload.new); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const loadProjectAndReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: projectData, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single();
      if (projectError) throw projectError;

      setProject(projectData);
      setIsPublic(projectData.is_public || false);
      const ownerCheck = !!user && projectData.user_id === user.id;
      setIsOwner(ownerCheck);

      const { data: reportData } = await supabase.from("reports").select("*").eq("project_id", id).maybeSingle();

      if (reportData) {
        setReport(reportData);
        if (projectData.status === "complete") setProgress(100);
        else updateProgress(reportData.generation_status);
      } else if (ownerCheck) {
        startReportGeneration();
      }
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to load project");
      setLoading(false);
    }
  };

  const startReportGeneration = async (regenerate = false) => {
    setGenerating(true);
    setProgress(0);
    try {
      const { error } = await supabase.functions.invoke("generate-validation-report", { body: { project_id: id, regenerate } });
      if (error) throw error;
      trackEvent('report_generation_started', { project_id: id, regenerate });
      toast.success(regenerate ? "Regenerating report..." : "Report generation started!");
    } catch (error: any) {
      toast.error(error.message || "Failed to start report generation");
      setGenerating(false);
    }
  };

  const updateProgress = (status: any) => {
    const sections = Object.values(status || {});
    const completed = sections.filter((s) => s === "complete").length;
    const total = sections.length;
    const newProgress = total > 0 ? (completed / total) * 100 : 0;
    setProgress(newProgress);
    if (completed === total && total > 0) setGenerating(false);
  };

  const togglePublic = async (newValue: boolean) => {
    try {
      const { error } = await supabase.from("projects").update({ is_public: newValue } as any).eq("id", id);
      if (error) throw error;
      setIsPublic(newValue);
      toast.success(newValue ? "Report is now publicly shareable!" : "Report is now private.");
    } catch { toast.error("Failed to update sharing settings"); }
  };

  // Track generating→complete transition for first-time completion CTA
  useEffect(() => {
    const currentlyGenerating = project?.status === "analyzing" || generating;
    if (currentlyGenerating) {
      wasGeneratingRef.current = true;
    } else if (wasGeneratingRef.current && project?.status === "complete") {
      wasGeneratingRef.current = false;
      const ctaKey = `cta_shown_${id}`;
      if (!sessionStorage.getItem(ctaKey)) {
        sessionStorage.setItem(ctaKey, "true");
        setCelebrationPhase(true);
        setTimeout(() => {
          setCelebrationPhase(false);
          setShowCompletionCTA(true);
        }, 1500);
      }
    }
  }, [generating, project?.status, id]);




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

  if (!project) {
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
    <div className="min-h-screen bg-gradient-subtle animate-fade-in" style={{ opacity: 1 }}>
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              onClick={() => navigate("/dashboard")}
            >
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Validifier</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/projects/${id}/chat`)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with Cora
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="animate-fade-down">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
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
                  <ValidationScoreRing score={validationScore} size="lg" />
                )}
              </div>
            </div>

            {/* Generation Experience */}
            {isGenerating && (
              <GenerationExperience
                generationStatus={report?.generation_status as Record<string, string> | null}
                isComplete={false}
                validationScore={validationScore}
              />
            )}

            {/* Completion celebration (brief) */}
            {!isGenerating && project?.status === "complete" && progress === 100 && !report?.report_data?.executive_summary && (
              <GenerationExperience
                generationStatus={report?.generation_status as Record<string, string> | null}
                isComplete={true}
                validationScore={validationScore}
              />
            )}

            {/* Executive Summary (always visible when available) */}
            <ReportSectionErrorBoundary sectionName="Executive Summary">
              <ExecutiveSummarySection reportData={reportData} />
            </ReportSectionErrorBoundary>

            {/* Game-Changing Idea — right after executive summary for maximum impact */}
            <ReportSectionErrorBoundary sectionName="Game-Changing Idea">
              <GameChangingIdeaSection reportData={reportData} />
            </ReportSectionErrorBoundary>

            {/* Inline CTA — after game-changing idea for peak excitement */}
            {project?.status === "complete" && reportData.game_changing_idea && (
              <InlineReportCTA />
            )}

            {/* Report Sections */}
            {project?.status === "complete" && (
              <div className="space-y-6">
                <ReportSectionErrorBoundary sectionName="Market Analysis">
                  <MarketAnalysisSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Customer Personas">
                  <CustomerPersonasSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Competitive Landscape">
                  <CompetitiveLandscapeSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Strategic Frameworks">
                  <StrategicFrameworksSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Porter's Five Forces">
                  <PorterFiveForcesSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="PESTEL Analysis">
                  <PestelAnalysisSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="CATWOE Analysis">
                  <CatwoeAnalysisSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Path to MVP">
                  <PathToMvpSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Go-to-Market">
                  <GoToMarketSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="USP Analysis">
                  <UspAnalysisSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Financial Basics">
                  <FinancialBasicsSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Risk Matrix">
                  <RiskMatrixSection reportData={reportData} />
                </ReportSectionErrorBoundary>
                <ReportSectionErrorBoundary sectionName="Action Plan">
                  <ActionPlanSection reportData={reportData} />
                </ReportSectionErrorBoundary>

                {/* End-of-Report CTA */}
                <EndOfReportCTA />
              </div>
            )}

            {/* Action Buttons */}
            {project?.status === "complete" && (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
                <Button variant="default" size="lg" onClick={() => navigate(`/projects/${id}/chat`)}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Chat with Cora
                </Button>

                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="lg" disabled={isGenerating}>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Regenerate Report
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate Report?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure? This will regenerate your entire validation report and use ~15 AI credits.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => startReportGeneration(true)}>
                          Regenerate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {isOwner && (
                  <div className="flex items-center space-x-2">
                    <Switch id="public-toggle" checked={isPublic} onCheckedChange={togglePublic} />
                    <Label htmlFor="public-toggle" className="text-sm">{isPublic ? "Public" : "Private"}</Label>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg">
                      <Share2 className="mr-2 h-5 w-5" />
                      Share & Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    <DropdownMenuItem onClick={async () => {
                      if (isOwner && !isPublic) await togglePublic(true);
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const text = formatExecutiveSummaryText(reportData, project?.name, validationScore);
                      navigator.clipboard.writeText(text);
                      toast.success("Executive summary copied to clipboard!");
                    }}>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Copy Executive Summary
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                      toast.info("Generating print preview...");
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-pdf', { body: { project_id: id } });
                        if (error) throw error;
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(data.html);
                          printWindow.document.close();
                          printWindow.onload = () => printWindow.print();
                        }
                        toast.success("Print preview opened in new tab");
                      } catch { toast.error("Failed to generate PDF"); }
                    }}>
                      <Download className="mr-2 h-4 w-4" />
                      Print / Save PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const md = generateReportMarkdown(reportData, project);
                      const slug = project?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'report';
                      downloadAsFile(md, `${slug}-report.md`);
                      toast.success("Markdown report downloaded!");
                    }}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                      const shareText = generateSocialShareText(project?.name, validationScore);
                      await navigator.clipboard.writeText(shareText);
                      toast.success("Social share message copied! Paste it on X/LinkedIn/anywhere 🚀");
                    }}>
                      <Twitter className="mr-2 h-4 w-4" />
                      Share to Social
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* AI Disclaimer */}
            {project?.status === "complete" && (
              <>
                <div className="text-center pt-6 pb-2">
                  <p className="text-xs text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
                    This report was generated by AI and is intended for informational purposes only. It should not replace professional business, financial, or legal advice.
                  </p>
                </div>
                <ReportFeedback projectId={id!} isOwner={isOwner} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &apos;{project?.name}&apos;? This will permanently delete the project, its validation report, and all chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteProject}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sticky bottom CTA bar — only when report is complete */}
      {project?.status === "complete" && <StickyReportCTA />}

      {/* Celebration overlay */}
      {celebrationPhase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-4 animate-scale-in">
            <Trophy className="h-16 w-16 text-primary mx-auto animate-bounce" />
            <p className="text-4xl font-bold">Your idea scored {validationScore}/100!</p>
            <Sparkles className="h-6 w-6 text-secondary mx-auto" />
          </div>
        </div>
      )}

      {/* Completion CTA modal */}
      <Dialog open={showCompletionCTA} onOpenChange={setShowCompletionCTA}>
        <DialogContent className="sm:max-w-md text-center space-y-6">
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <p className="text-3xl font-bold">
              {validationScore}/100
            </p>
            <p className="text-muted-foreground">
              {getScoreMessage(validationScore)}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full animate-pulse-glow"
              onClick={() => { openCompletionCalendly(); setShowCompletionCTA(false); }}
            >
              <CalendarCheck className="mr-2 h-5 w-5" />
              Book a Free Strategy Call
            </Button>
            <button
              onClick={() => setShowCompletionCTA(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View Full Report →
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewReport;
