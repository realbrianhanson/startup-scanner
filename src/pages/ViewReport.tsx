import { useEffect, useState } from "react";
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
} from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
import { FinancialBasicsSection } from "@/components/report/FinancialBasicsSection";

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
            <ExecutiveSummarySection reportData={reportData} />

            {/* Report Sections */}
            {project?.status === "complete" && (
              <div className="space-y-6">
                <MarketAnalysisSection reportData={reportData} />
                <CustomerPersonasSection reportData={reportData} />
                <CompetitiveLandscapeSection reportData={reportData} />
                <StrategicFrameworksSection reportData={reportData} />
                <PorterFiveForcesSection reportData={reportData} />
                <PestelAnalysisSection reportData={reportData} />
                <CatwoeAnalysisSection reportData={reportData} />
                <PathToMvpSection reportData={reportData} />
                <GoToMarketSection reportData={reportData} />
                <UspAnalysisSection reportData={reportData} />
                <FinancialBasicsSection reportData={reportData} />
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
                          Are you sure? This will regenerate your entire validation report and use ~12 AI credits.
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
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem onClick={async () => {
                      if (isOwner && !isPublic) await togglePublic(true);
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
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
