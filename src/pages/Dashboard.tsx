import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BarChart3,
  Plus,
  FolderOpen,
  Settings,
  LogOut,
  Zap,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get total count
      const { count } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      setTotalProjects(count || 0);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (projectsData) {
        setProjects(projectsData);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("You've been successfully signed out.");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        {/* Nav skeleton */}
        <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-7 w-28" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-9 rounded" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome header skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-6 w-64" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 border-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                </Card>
              ))}
            </div>

            {/* CTA card skeleton */}
            <Card className="p-12 border-2">
              <div className="flex flex-col items-center space-y-6">
                <Skeleton className="h-20 w-20 rounded-3xl" />
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-5 w-96 max-w-full" />
                <Skeleton className="h-12 w-40 rounded-md" />
              </div>
            </Card>

            {/* Projects list skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-44" />
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 border-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="h-12 w-12 ml-4" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Top Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 md:space-x-8">
              <MobileNav user={user} profile={profile} />
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Validifier
                </span>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <Button variant="ghost" className="font-medium bg-muted/50">
                  Dashboard
                </Button>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.user_metadata?.full_name || "Entrepreneur"}!
            </h1>
            <p className="text-xl text-muted-foreground">
              Ready to validate your next big idea?
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-2 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">AI Credits Used</p>
                  <p className="text-3xl font-bold">
                    {profile?.ai_credits_used || 0} / {profile?.ai_credits_monthly || 10}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {profile?.subscription_tier || "Free"} Tier
                  </Badge>
                </div>
                <div className="p-3 bg-gradient-hero rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Projects Created</p>
                  <p className="text-3xl font-bold">{totalProjects}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalProjects === 0 ? "Create your first project" : "Keep validating!"}
                  </p>
                </div>
                <div className="p-3 bg-gradient-card rounded-xl">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-3xl font-bold">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short" })
                      : "Today"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "Just getting started"}
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </Card>
          </div>

          {/* Create Project CTA */}
          <Card className="p-12 text-center space-y-6 bg-gradient-card border-2 shadow-large">
            <div className="mx-auto w-20 h-20 bg-gradient-hero rounded-3xl flex items-center justify-center shadow-glow">
              <Plus className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Create Your First Project</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started by creating a new project and receive a comprehensive validation
                report in just 60 seconds.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/projects/new")}
              className="text-lg px-8 py-6 shadow-medium"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Card>

          {/* Empty State - Recent Projects */}
          {projects.length === 0 ? (
            <Card className="p-12 text-center space-y-4 border-2 border-dashed">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-muted-foreground">
                  No projects yet
                </h3>
                <p className="text-muted-foreground">
                  Your validated projects will appear here
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Projects</h2>
                {totalProjects > 5 && !showAll && (
                  <p className="text-sm text-muted-foreground">
                    Showing 5 of {totalProjects}
                  </p>
                )}
              </div>
              <div className="grid gap-4">
                {(showAll ? projects : projects.slice(0, 5)).map((project) => (
                  <Card
                    key={project.id}
                    className="p-6 border-2 hover:border-primary/20 transition-all cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}/report`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold">{project.name}</h3>
                          <Badge
                            variant={
                              project.status === "complete"
                                ? "default"
                                : project.status === "analyzing"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{project.industry}</span>
                          <span>•</span>
                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {project.validation_score && (
                        <div className="text-right ml-4">
                          <div
                            className={`text-4xl font-bold ${
                              project.validation_score >= 70
                                ? "text-success"
                                : project.validation_score >= 40
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          >
                            {project.validation_score}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Score</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              {totalProjects > 5 && !showAll && (
                <div className="text-center pt-2">
                  <Button variant="outline" onClick={() => setShowAll(true)}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    View All Projects ({totalProjects})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
