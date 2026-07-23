import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, MoreVertical, Trash2, RefreshCw, ArrowRight, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppNav } from "@/components/AppNav";
import { CompareProjects } from "@/components/CompareProjects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Dashboard | Validifier"; }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles").select("*").eq("id", session.user.id).single();
      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
      }

      const { count } = await supabase
        .from("projects").select("id", { count: "exact", head: true }).eq("user_id", session.user.id);
      setTotalProjects(count || 0);

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects").select("*").eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (projectsError) throw projectsError;
      if (projectsData) {
        setProjects(projectsData);
        if (projectsData.length > 0 && profileData && !(profileData as any).onboarding_completed) {
          supabase
            .from("profiles")
            .update({ onboarding_completed: true } as any)
            .eq("id", session.user.id)
            .then(({ error }) => {
              if (!error) setProfile((p: any) => (p ? { ...p, onboarding_completed: true } : p));
            });
        }
      }
    } catch (error: any) {
      console.error("Dashboard load error:", error);
      setLoadError(true);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setTotalProjects((prev) => prev - 1);
      toast.success("Project deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeleteTarget(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "complete" || s === "scored") return "Ready";
    if (s === "analyzing" || s === "generating") return "Analyzing";
    if (s === "draft") return "Draft";
    if (s === "failed" || s === "error") return "Needs attention";
    if (!status) return "Draft";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const s = (status || "").toLowerCase();
    if (s === "complete" || s === "scored") return "default";
    if (s === "failed" || s === "error") return "destructive";
    return "secondary";
  };

  const creditsRemaining = Math.max(
    0,
    (profile?.ai_credits_monthly || 0) - (profile?.ai_credits_used || 0)
  );
  const readyCount = projects.filter((p) => {
    const s = (p.status || "").toLowerCase();
    return s === "complete" || s === "scored";
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-card border-b border-border h-14" />
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-semibold">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground">Check your connection and try again.</p>
          <Button onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav user={user} profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your decision workspace</h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Pressure-test ideas, compare the evidence, and decide what to do next.
            </p>
          </div>
          <Button
            onClick={() => navigate("/projects/new")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg self-start"
          >
            <Plus className="mr-2 h-4 w-4" />
            New report
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-2 grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: "Reports", value: totalProjects, icon: FileText },
            { label: "Ready", value: readyCount, icon: CheckCircle2 },
            { label: "Credits remaining", value: creditsRemaining, icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card px-3 py-3 md:px-4 md:py-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                <Icon className="h-3.5 w-3.5" />
                <span className="truncate">{label}</span>
              </div>
              <div className="mt-1 text-2xl font-semibold font-mono tabular-nums">{value}</div>
            </div>
          ))}
        </div>
        <p className="mb-8 text-xs text-muted-foreground">
          <span className="capitalize">{profile?.subscription_tier || "Free"}</span> plan
        </p>

        {/* Projects */}
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-16 md:py-20 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Turn your first idea into a decision brief
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Describe the idea in a few sentences. Validifier will score the evidence, surface the risks, and build a 15-section action plan.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Button
                onClick={() => navigate("/projects/new")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                Create my first report
              </Button>
              <button
                onClick={() => navigate("/sample-report")}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                See a finished sample
              </button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              One full report is included on the free plan. No credit card.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Reports</h2>
              <CompareProjects projects={projects} />
            </div>

            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_100px_80px_120px_40px] gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <span>Name</span>
              <span>Industry</span>
              <span>Date</span>
              <span>Score</span>
              <span>Status</span>
              <span></span>
            </div>

            {(showAll ? projects : projects.slice(0, 10)).map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}/report`)}
                className="group grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_100px_80px_120px_40px] gap-2 md:gap-4 items-center px-4 py-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{project.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:hidden">
                    {project.industry && <span className="truncate">{project.industry}</span>}
                    <span aria-hidden>·</span>
                    <span>
                      {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span aria-hidden>·</span>
                    <span className={project.validation_score ? getScoreColor(project.validation_score) : ""}>
                      Score {project.validation_score ?? "—"}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{getStatusLabel(project.status)}</span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground hidden md:block">
                  <Badge variant="outline" className="font-normal text-xs">{project.industry}</Badge>
                </span>
                <span className="text-sm text-muted-foreground hidden md:block">
                  {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className={`font-mono text-sm hidden md:block ${project.validation_score ? getScoreColor(project.validation_score) : "text-muted-foreground"}`}>
                  {project.validation_score ?? "—"}
                </span>
                <span className="hidden md:block">
                  <Badge
                    variant={getStatusVariant(project.status)}
                    className="text-xs"
                  >
                    {getStatusLabel(project.status)}
                  </Badge>
                </span>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Actions for ${project.name}`}
                        className="inline-flex h-11 w-11 md:h-8 md:w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ArrowRight className="h-4 w-4 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}

            {totalProjects > 10 && !showAll && (
              <div className="text-center pt-4">
                <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                  View all {totalProjects} reports
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTarget?.name}"? This removes the report and chat history permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteProject(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
