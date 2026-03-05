import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, MoreVertical, Trash2, RefreshCw, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppNav } from "@/components/AppNav";
import OnboardingOverlay from "@/components/OnboardingOverlay";
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
  const [showOnboarding, setShowOnboarding] = useState(false);
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
        if (!(profileData as any).onboarding_completed) setShowOnboarding(true);
      }

      const { count } = await supabase
        .from("projects").select("id", { count: "exact", head: true }).eq("user_id", session.user.id);
      setTotalProjects(count || 0);

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects").select("*").eq("user_id", session.user.id)
        .order("created_at", { ascending: false }).limit(20);
      if (projectsError) throw projectsError;
      if (projectsData) setProjects(projectsData);
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
      {showOnboarding && user && profile && (
        <OnboardingOverlay
          userName={user.user_metadata?.full_name || "there"}
          credits={profile.ai_credits_monthly - profile.ai_credits_used}
          userId={user.id}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <AppNav user={user} profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Inline stats bar */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 flex-wrap">
          <span className="font-mono">{totalProjects} report{totalProjects !== 1 ? "s" : ""}</span>
          <span className="text-border">|</span>
          <span className="font-mono">
            {profile?.ai_credits_used}/{profile?.ai_credits_monthly} credits used
          </span>
          <span className="text-border">|</span>
          <span className="capitalize">{profile?.subscription_tier || "Free"} plan</span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => navigate("/projects/new")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>

        {/* Projects */}
        {projects.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground mb-4">You haven't analyzed any ideas yet.</p>
            <Button
              onClick={() => navigate("/projects/new")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              Analyze Your First Idea
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Reports</h2>
              <CompareProjects projects={projects} />
            </div>

            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_100px_80px_80px_40px] gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
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
                className="group grid grid-cols-1 md:grid-cols-[1fr_120px_100px_80px_80px_40px] gap-2 md:gap-4 items-center px-4 py-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
              >
                <span className="font-medium text-foreground truncate">{project.name}</span>
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
                    variant={project.status === "complete" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {project.status}
                  </Badge>
                </span>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}

            {totalProjects > 10 && !showAll && (
              <div className="text-center pt-4">
                <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                  View all {totalProjects} projects
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
