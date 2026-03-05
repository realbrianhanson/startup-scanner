import { useEffect, useState, useRef, useCallback } from "react";
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
  Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";
import { ValidationScoreRing } from "@/components/report/ValidationScoreRing";

/* ── Micro-sparkline SVG (decorative) ── */
const Sparkline = ({ variant = "up" }: { variant?: "up" | "wave" | "flat" }) => {
  const paths: Record<string, string> = {
    up: "M0 28 Q8 26 16 22 T32 16 T48 10 T64 6 T80 2",
    wave: "M0 16 Q10 8 20 16 T40 16 T60 16 T80 16",
    flat: "M0 20 Q10 14 20 18 T40 12 T60 16 T80 14",
  };
  return (
    <svg viewBox="0 0 80 30" className="w-20 h-8 opacity-40" fill="none">
      <path
        d={paths[variant]}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ── Animated counter hook ── */
const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 40;
          const inc = target / steps;
          let cur = 0;
          const t = setInterval(() => {
            cur += inc;
            if (cur >= target) {
              setValue(target);
              clearInterval(t);
            } else {
              setValue(Math.floor(cur));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
};

/* ── Decorative rocket SVG for empty state ── */
const RocketIllustration = () => (
  <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto" fill="none" strokeWidth="1.5" stroke="hsl(var(--primary))">
    <path d="M40 16 C40 16 28 28 28 48 C28 56 34 64 40 68 C46 64 52 56 52 48 C52 28 40 16 40 16Z" />
    <circle cx="40" cy="42" r="5" />
    <path d="M28 48 L20 56 L28 54" />
    <path d="M52 48 L60 56 L52 54" />
    <path d="M36 68 L36 76" strokeLinecap="round" />
    <path d="M40 68 L40 78" strokeLinecap="round" />
    <path d="M44 68 L44 76" strokeLinecap="round" />
  </svg>
);

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard | Validifier";
  }, []);

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

      if (profileData) setProfile(profileData);

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

      if (projectsData) setProjects(projectsData);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("You've been successfully signed out.");
    navigate("/");
  };

  /* ── Counter refs ── */
  const credits = useCountUp(profile?.ai_credits_used || 0);
  const projectCount = useCountUp(totalProjects);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
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
            <div className="space-y-2">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-6 w-64" />
            </div>
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
            <Card className="p-12 border-2">
              <div className="flex flex-col items-center space-y-6">
                <Skeleton className="h-20 w-20 rounded-3xl" />
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-5 w-96 max-w-full" />
                <Skeleton className="h-12 w-40 rounded-md" />
              </div>
            </Card>
            <div className="space-y-4">
              <Skeleton className="h-8 w-44" />
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 border-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-6 w-48" />
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
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden animate-fade-in" style={{ opacity: 1 }}>
      {/* ── Background floating orbs ── */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] overflow-hidden -z-10">
        <div className="absolute -top-20 -right-20 w-[350px] h-[350px] rounded-full bg-primary opacity-[0.04] dark:opacity-[0.08] blur-[120px] animate-float float-slower will-change-transform" />
        <div className="absolute top-40 right-10 w-[200px] h-[200px] rounded-full bg-secondary opacity-[0.03] dark:opacity-[0.06] blur-[100px] animate-float float-slowest will-change-transform" style={{ animationDelay: "3s" }} />
      </div>

      {/* Top Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 md:space-x-8">
              <MobileNav user={user} profile={profile} />
              <div
                className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                onClick={() => navigate("/dashboard")}
              >
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold gradient-text">Validifier</span>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <Button variant="ghost" className="font-medium nav-active">Dashboard</Button>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="animate-fade-down delay-100">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={handleSignOut} className="animate-fade-down delay-200">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="space-y-2 animate-fade-up">
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.user_metadata?.full_name || "Entrepreneur"}!
            </h1>
            <p className="text-xl text-muted-foreground">
              Ready to validate your next big idea?
            </p>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Credits Card */}
            <Card
              ref={credits.ref}
              className="group relative p-6 border border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden animate-fade-up delay-100"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">AI Credits Used</p>
                  <p className="text-3xl font-bold tabular-nums">
                    {credits.value} / {profile?.ai_credits_monthly || 10}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {profile?.subscription_tier || "Free"} Tier
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 rounded-2xl bg-primary/[0.08] border border-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <Sparkline variant="up" />
                </div>
              </div>
            </Card>

            {/* Projects Card */}
            <Card
              ref={projectCount.ref}
              className="group relative p-6 border border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden animate-fade-up delay-200"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Projects Created</p>
                  <p className="text-3xl font-bold tabular-nums">{projectCount.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalProjects === 0 ? "Create your first project" : "Keep validating!"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 rounded-2xl bg-secondary/[0.08] border border-secondary/10">
                    <FolderOpen className="h-6 w-6 text-secondary" />
                  </div>
                  <Sparkline variant="wave" />
                </div>
              </div>
            </Card>

            {/* Member Since Card */}
            <Card className="group relative p-6 border border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden animate-fade-up delay-300">
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
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 rounded-2xl bg-muted border border-border/50">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Sparkline variant="flat" />
                </div>
              </div>
            </Card>
          </div>

          {/* ── Create Project CTA ── */}
          <div className="relative rounded-xl p-[2px] animate-fade-up delay-300">
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-shimmer opacity-60" />
            <Card className="relative p-12 text-center space-y-6 rounded-[10px] overflow-hidden">
              {/* Dot pattern background */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div className="relative z-10 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center bg-primary/10 border border-primary/20 animate-pulse-glow">
                  <Plus className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Start a New Validation</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Get a comprehensive AI-powered validation report for your startup idea in just 60 seconds.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate("/projects/new")}
                  className="text-lg px-8 py-6 shadow-medium animate-pulse-glow"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  New Project
                </Button>
              </div>
            </Card>
          </div>

          {/* ── Project List / Empty State ── */}
          {projects.length === 0 ? (
            <Card className="p-16 text-center space-y-6 border border-border/50 animate-fade-up delay-400">
              <RocketIllustration />
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">
                  Your launchpad is ready
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Every great company started with an idea. Create your first project and let AI validate whether yours has what it takes.
                </p>
              </div>
              <Button variant="outline" size="lg" onClick={() => navigate("/projects/new")}>
                <Rocket className="mr-2 h-4 w-4" />
                Create First Project
              </Button>
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
                {(showAll ? projects : projects.slice(0, 5)).map((project, idx) => (
                  <Card
                    key={project.id}
                    className="relative p-6 border border-border/60 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-medium transition-all duration-300 cursor-pointer overflow-hidden animate-fade-up"
                    style={{ animationDelay: `${(idx + 1) * 80}ms` }}
                    onClick={() => navigate(`/projects/${project.id}/report`)}
                  >
                    {/* Left gradient accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-secondary rounded-l-lg" />
                    <div className="flex items-start justify-between pl-3">
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
                        <div className="ml-4 shrink-0">
                          <ValidationScoreRing score={project.validation_score} size="sm" showBadge={false} />
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
