import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Plus, ArrowLeft, BarChart3, Users, FolderOpen, TrendingUp, Star, MessageSquare, Settings, CalendarCheck, DollarSign, Rocket, AlertTriangle, CheckCircle2, RefreshCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  ai_credits_monthly: number;
  ai_credits_used: number;
}

interface EventCount {
  event_name: string;
  count: number;
}

type LaunchDashboard = {
  period_days: number;
  generated_at: string;
  cohort_funnel: {
    accounts_created: number;
    signups: number;
    created_project: number;
    completed_report: number;
    used_chat: number;
    trialing: number;
    paid: number;
  };
  acquisition: { landing_sessions: number; cta_sessions: number };
  totals: {
    users: number;
    active_subscriptions: number;
    trials: number;
    past_due: number;
    pro_tier: number;
    billing_profiles: number;
    projects: number;
    reports_complete: number;
  };
  report_health: { started: number; completed: number; failed: number; stuck: number };
  billing_health: { webhook_failed: number; webhook_processing_stale: number };
  unresolved: { info: number; warning: number; critical: number };
  recent_events: Array<{
    id: string; severity: "info" | "warning" | "critical"; category: string;
    event_name: string; function_name: string | null; error_code: string | null;
    metadata: Record<string, unknown>; created_at: string;
  }>;
  daily_14d: Array<{ day: string; signups: number; projects: number; reports_completed: number }>;
};

// Historical event aliases for the legacy Analytics tab. Verification-required
// events are NOT completed signups and are intentionally excluded here.
const SIGNUP_ALIASES = [
  "sign_up",
  "auth_signup_complete",
  "signup_completed",
];
const PROJECT_ALIASES = ["project_created"];

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [creditsToAdd, setCreditsToAdd] = useState<string>("");

  // Analytics state
  const [signupsWeek, setSignupsWeek] = useState(0);
  const [signupsMonth, setSignupsMonth] = useState(0);
  const [projectsWeek, setProjectsWeek] = useState(0);
  const [projectsMonth, setProjectsMonth] = useState(0);
  const [topEvents, setTopEvents] = useState<EventCount[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // CTA config state
  const [ctaCalendlyUrl, setCtaCalendlyUrl] = useState("");
  const [ctaHeadline, setCtaHeadline] = useState("");
  const [ctaEnabled, setCtaEnabled] = useState(true);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaSaving, setCtaSaving] = useState(false);

  // AI Cost tracking state
  const [costData, setCostData] = useState<{ totalSpend: number; avgPerReport: number; modelBreakdown: { model: string; count: number; cost: number }[] }>({ totalSpend: 0, avgPerReport: 0, modelBreakdown: [] });
  const [costLoading, setCostLoading] = useState(false);

  // Launch dashboard state
  const [launchDays, setLaunchDays] = useState<7 | 30 | 90>(30);
  const [launch, setLaunch] = useState<LaunchDashboard | null>(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast.error("Access denied. Admin only.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadProfiles();
      loadLaunch(30);
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadLaunch = async (days: 7 | 30 | 90) => {
    setLaunchLoading(true);
    setLaunchError(null);
    try {
      const { data, error } = await supabase.rpc("get_admin_launch_dashboard" as any, { p_days: days } as any);
      if (error) throw error;
      setLaunch(data as unknown as LaunchDashboard);
    } catch (e: any) {
      setLaunchError("Could not load launch dashboard");
    } finally {
      setLaunchLoading(false);
    }
  };

  const resolveEvent = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("operational_events" as any)
        .update({ resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Event resolved");
      loadLaunch(launchDays);
    } catch {
      toast.error("Could not resolve event");
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const addCredits = async () => {
    if (!selectedUserId || !creditsToAdd) {
      toast.error("Please select a user and enter credits amount");
      return;
    }

    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) {
      toast.error("Please enter a valid credits amount");
      return;
    }

    try {
      const profile = profiles.find(p => p.id === selectedUserId);
      if (!profile) {
        toast.error("User not found");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          ai_credits_monthly: profile.ai_credits_monthly + credits 
        })
        .eq("id", selectedUserId);

      if (error) throw error;

      toast.success(`Added ${credits} credits successfully`);
      setCreditsToAdd("");
      setSelectedUserId("");
      loadProfiles();
    } catch (error) {
      toast.error("Failed to add credits");
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Signups: union across historical aliases; count distinct users when possible.
      const countSignups = async (sinceIso: string) => {
        const { data } = await supabase
          .from("analytics_events")
          .select("user_id, id")
          .in("event_name", SIGNUP_ALIASES)
          .gte("created_at", sinceIso)
          .limit(5000);
        if (!data) return 0;
        const seen = new Set<string>();
        for (const row of data) {
          const key = (row.user_id as string) || `anon:${row.id}`;
          seen.add(key);
        }
        return seen.size;
      };
      setSignupsWeek(await countSignups(weekAgo));
      setSignupsMonth(await countSignups(monthAgo));

      // Projects this week
      const { count: pwCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .in("event_name", PROJECT_ALIASES)
        .gte("created_at", weekAgo);
      setProjectsWeek(pwCount || 0);

      // Projects this month
      const { count: pmCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .in("event_name", PROJECT_ALIASES)
        .gte("created_at", monthAgo);
      setProjectsMonth(pmCount || 0);

      // Top events (get all events from last 30 days and count client-side)
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_name")
        .gte("created_at", monthAgo)
        .limit(1000);

      if (events) {
        const counts: Record<string, number> = {};
        events.forEach(e => { counts[e.event_name] = (counts[e.event_name] || 0) + 1; });
        const sorted = Object.entries(counts)
          .map(([event_name, count]) => ({ event_name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopEvents(sorted);
      }
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const { data } = await supabase
        .from("report_feedback" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setFeedbackList(data || []);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const loadCtaConfig = async () => {
    setCtaLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_config" as any)
        .select("key, value")
        .in("key", ["calendly_url", "cta_headline", "cta_enabled"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
      setCtaCalendlyUrl(map.calendly_url || "");
      setCtaHeadline(map.cta_headline || "");
      setCtaEnabled(map.cta_enabled !== "false");
    } catch { toast.error("Failed to load CTA config"); }
    finally { setCtaLoading(false); }
  };

  const loadCostData = async () => {
    setCostLoading(true);
    try {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: logs } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .eq("operation_type", "report_generation")
        .gte("created_at", monthAgo)
        .limit(1000);

      if (logs && logs.length > 0) {
        const totalSpend = logs.reduce((sum: number, l: any) => sum + (Number(l.estimated_cost_usd) || l.cost_cents / 100), 0);
        const avgPerReport = totalSpend / logs.length;

        const modelMap: Record<string, { count: number; cost: number }> = {};
        logs.forEach((l: any) => {
          const model = l.model_used || "unknown";
          if (!modelMap[model]) modelMap[model] = { count: 0, cost: 0 };
          modelMap[model].count++;
          modelMap[model].cost += Number(l.estimated_cost_usd) || l.cost_cents / 100;
        });

        const modelBreakdown = Object.entries(modelMap)
          .map(([model, data]) => ({ model, ...data }))
          .sort((a, b) => b.count - a.count);

        setCostData({ totalSpend, avgPerReport, modelBreakdown });
      }
    } catch {
      toast.error("Failed to load cost data");
    } finally {
      setCostLoading(false);
    }
  };

  const saveCtaConfig = async () => {
    setCtaSaving(true);
    try {
      const updates = [
        { key: "calendly_url", value: ctaCalendlyUrl, updated_at: new Date().toISOString() },
        { key: "cta_headline", value: ctaHeadline, updated_at: new Date().toISOString() },
        { key: "cta_enabled", value: ctaEnabled ? "true" : "false", updated_at: new Date().toISOString() },
      ];
      for (const u of updates) {
        const { error } = await supabase.from("site_config" as any).update({ value: u.value, updated_at: u.updated_at } as any).eq("key", u.key);
        if (error) throw error;
      }
      // Clear cached config
      sessionStorage.removeItem("site_config_cache");
      toast.success("CTA settings saved!");
    } catch { toast.error("Failed to save CTA settings"); }
    finally { setCtaSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users, credits, and analytics</p>
          </div>
        </div>

        <Tabs defaultValue="launch" className="space-y-6">
          <TabsList className="w-full max-w-full overflow-x-auto justify-start no-scrollbar">
            <TabsTrigger value="launch" onClick={() => loadLaunch(launchDays)}>
              <Rocket className="h-4 w-4 mr-2" />
              Launch
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" onClick={loadAnalytics}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="feedback" onClick={loadFeedback}>
              <Star className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="costs" onClick={loadCostData}>
              <DollarSign className="h-4 w-4 mr-2" />
              AI Costs
            </TabsTrigger>
            <TabsTrigger value="cta" onClick={loadCtaConfig}>
              <CalendarCheck className="h-4 w-4 mr-2" />
              CTA Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="launch" className="space-y-6">
            <LaunchDashboardView
              data={launch}
              loading={launchLoading}
              error={launchError}
              days={launchDays}
              onDaysChange={(d) => { setLaunchDays(d); loadLaunch(d); }}
              onRetry={() => loadLaunch(launchDays)}
              onResolve={resolveEvent}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Credits
                </CardTitle>
                <CardDescription>
                  Grant additional AI credits to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="user-select">Select User</Label>
                    <select
                      id="user-select"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background"
                    >
                      <option value="">Choose a user...</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.email} ({profile.full_name || "No name"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="credits-input">Credits Amount</Label>
                    <Input
                      id="credits-input"
                      type="number"
                      value={creditsToAdd}
                      onChange={(e) => setCreditsToAdd(e.target.value)}
                      placeholder="e.g. 50"
                      min="1"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button onClick={addCredits} className="w-full">
                      Add Credits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {profiles.length} total users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.email}</TableCell>
                        <TableCell>{profile.full_name || "-"}</TableCell>
                        <TableCell>
                          <span className="capitalize">{profile.subscription_tier}</span>
                        </TableCell>
                        <TableCell>{profile.ai_credits_monthly}</TableCell>
                        <TableCell>{profile.ai_credits_used}</TableCell>
                        <TableCell>
                          <span className={
                            profile.ai_credits_monthly - profile.ai_credits_used > 5
                              ? "text-success"
                              : "text-warning"
                          }>
                            {profile.ai_credits_monthly - profile.ai_credits_used}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <p className="text-xs text-muted-foreground">
              Legacy app-event counts from the analytics stream. These reflect client-side event totals — not verified database signups. Use the Launch tab for the authoritative cohort funnel.
            </p>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{signupsWeek}</p>
                      <p className="text-xs text-muted-foreground">Signup events (7d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{signupsMonth}</p>
                      <p className="text-xs text-muted-foreground">Signup events (30d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{projectsWeek}</p>
                      <p className="text-xs text-muted-foreground">Project events (7d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{projectsMonth}</p>
                      <p className="text-xs text-muted-foreground">Project events (30d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Events (Last 30 Days)
                </CardTitle>
                <CardDescription>Most frequent analytics events</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading analytics...</p>
                ) : topEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No events recorded yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topEvents.map((event) => (
                        <TableRow key={event.event_name}>
                          <TableCell className="font-medium font-mono text-sm">{event.event_name}</TableCell>
                          <TableCell className="text-right font-bold">{event.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Recent Feedback
                </CardTitle>
                <CardDescription>Report feedback and ratings from users</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading feedback...</p>
                ) : feedbackList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No feedback yet</p>
                ) : (
                  <div className="space-y-3">
                    {feedbackList.map((fb: any) => (
                      <div key={fb.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-4 w-4 ${s <= fb.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {fb.comment && (
                          <p className="text-sm text-foreground/80">{fb.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Project: {fb.project_id?.slice(0, 8)}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CTA Settings Tab */}
          <TabsContent value="cta" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  CTA Settings
                </CardTitle>
                <CardDescription>
                  Configure the Calendly call-to-action across the app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {ctaLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading settings...</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Calendly CTAs</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Toggle all CTAs on/off across the app</p>
                      </div>
                      <Switch checked={ctaEnabled} onCheckedChange={setCtaEnabled} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calendly-url">Calendly URL</Label>
                      <Input
                        id="calendly-url"
                        value={ctaCalendlyUrl}
                        onChange={(e) => setCtaCalendlyUrl(e.target.value)}
                        placeholder="https://calendly.com/your-link"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cta-headline">End-of-Report CTA Headline</Label>
                      <Input
                        id="cta-headline"
                        value={ctaHeadline}
                        onChange={(e) => setCtaHeadline(e.target.value)}
                        placeholder="Ready to Turn This Report Into Reality?"
                      />
                    </div>
                    <Button onClick={saveCtaConfig} disabled={ctaSaving}>
                      {ctaSaving ? "Saving..." : "Save Settings"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* AI Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${costData.totalSpend.toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground">Total AI spend (30 days)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${costData.avgPerReport.toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground">Avg cost per report</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{costData.modelBreakdown.reduce((s, m) => s + m.count, 0)}</p>
                      <p className="text-xs text-muted-foreground">Reports generated (30 days)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Model Usage Breakdown
                </CardTitle>
                <CardDescription>Cost by model configuration (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {costLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading cost data...</p>
                ) : costData.modelBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No usage data yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model Config</TableHead>
                        <TableHead className="text-right">Reports</TableHead>
                        <TableHead className="text-right">Est. Cost</TableHead>
                        <TableHead className="text-right">Avg/Report</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData.modelBreakdown.map((m) => (
                        <TableRow key={m.model}>
                          <TableCell className="font-medium font-mono text-sm">{m.model}</TableCell>
                          <TableCell className="text-right">{m.count}</TableCell>
                          <TableCell className="text-right">${m.cost.toFixed(4)}</TableCell>
                          <TableCell className="text-right">${(m.cost / m.count).toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;

// ---------------- Launch dashboard view ----------------

function pct(n: number, d: number): string {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

function healthStatus(d: LaunchDashboard): { color: string; label: string } {
  if (d.unresolved.critical > 0 || d.billing_health.webhook_failed > 0) {
    return { color: "bg-red-500/10 text-red-500 border-red-500/40", label: "Red" };
  }
  if (d.unresolved.warning > 0 || d.report_health.failed > 0 || d.report_health.stuck > 0) {
    return { color: "bg-amber-500/10 text-amber-500 border-amber-500/40", label: "Amber" };
  }
  return { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/40", label: "Green" };
}

function severityBadge(sev: "info" | "warning" | "critical") {
  const map = {
    info: "bg-sky-500/10 text-sky-500 border-sky-500/40",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/40",
    critical: "bg-red-500/10 text-red-500 border-red-500/40",
  } as const;
  return <Badge variant="outline" className={map[sev]}>{sev}</Badge>;
}

function LaunchDashboardView(props: {
  data: LaunchDashboard | null;
  loading: boolean;
  error: string | null;
  days: 7 | 30 | 90;
  onDaysChange: (d: 7 | 30 | 90) => void;
  onRetry: () => void;
  onResolve: (id: string) => void;
}) {
  const { data, loading, error, days, onDaysChange, onRetry, onResolve } = props;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Period:</span>
        {[7, 30, 90].map((d) => (
          <Button
            key={d}
            size="sm"
            variant={days === d ? "default" : "outline"}
            onClick={() => onDaysChange(d as 7 | 30 | 90)}
            aria-pressed={days === d}
          >
            {d}d
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={onRetry} aria-label="Refresh">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading launch metrics…</CardContent></Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" onClick={onRetry}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {data && !loading && !error && (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5" /> Launch status</CardTitle>
                <CardDescription>Last {data.period_days} days · updated {new Date(data.generated_at).toLocaleTimeString()}</CardDescription>
              </div>
              <Badge variant="outline" className={healthStatus(data).color}>
                {healthStatus(data).label}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total users" value={data.totals.users} />
              <Stat label="Active subscriptions" value={data.totals.active_subscriptions} />
              <Stat label="Trials" value={data.totals.trials} />
              <Stat label="Past due" value={data.totals.past_due} />
              <Stat label="Pro-tier users" value={data.totals.pro_tier} />
              <Stat label="Billing profiles" value={data.totals.billing_profiles} />
              <Stat label="Projects" value={data.totals.projects} />
              <Stat label="Reports completed" value={data.totals.reports_complete} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signup cohort funnel</CardTitle>
              <CardDescription>
                Accounts created in the last {data.period_days} days. Post-verification steps use verified signups as the denominator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <FunnelRow label="Accounts created" value={data.cohort_funnel.accounts_created} base={data.cohort_funnel.accounts_created} />
              <FunnelRow label="Verified signup" value={data.cohort_funnel.signups} base={data.cohort_funnel.accounts_created} />
              <FunnelRow label="Created project" value={data.cohort_funnel.created_project} base={data.cohort_funnel.signups} />
              <FunnelRow label="Completed report" value={data.cohort_funnel.completed_report} base={data.cohort_funnel.signups} />
              <FunnelRow label="Used chat" value={data.cohort_funnel.used_chat} base={data.cohort_funnel.signups} />
              <FunnelRow label="Trialing" value={data.cohort_funnel.trialing} base={data.cohort_funnel.signups} />
              <FunnelRow label="Active subscription" value={data.cohort_funnel.paid} base={data.cohort_funnel.signups} />
              <div className="pt-3 border-t text-xs text-muted-foreground grid grid-cols-2 gap-2">
                <div>Landing sessions: <span className="font-semibold text-foreground">{data.acquisition.landing_sessions}</span></div>
                <div>CTA sessions: <span className="font-semibold text-foreground">{data.acquisition.cta_sessions}</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <HealthCard title="Report generation" items={[
              { label: "Started", value: data.report_health.started },
              { label: "Completed", value: data.report_health.completed },
              { label: "Failed", value: data.report_health.failed, warn: data.report_health.failed > 0 },
              { label: "Stuck (>15m)", value: data.report_health.stuck, warn: data.report_health.stuck > 0 },
            ]} />
            <HealthCard title="Billing" items={[
              { label: "Webhook failed", value: data.billing_health.webhook_failed, warn: data.billing_health.webhook_failed > 0 },
              { label: "Processing stale", value: data.billing_health.webhook_processing_stale, warn: data.billing_health.webhook_processing_stale > 0 },
            ]} />
            <HealthCard title="Unresolved incidents" items={[
              { label: "Critical", value: data.unresolved.critical, warn: data.unresolved.critical > 0 },
              { label: "Warning", value: data.unresolved.warning, warn: data.unresolved.warning > 0 },
              { label: "Info", value: data.unresolved.info },
            ]} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Last 14 days</CardTitle>
              <CardDescription>Signups, projects and completed reports per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Signups</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Reports</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.daily_14d.map((d) => (
                      <TableRow key={d.day}>
                        <TableCell className="font-mono text-xs">{d.day}</TableCell>
                        <TableCell className="text-right">{d.signups}</TableCell>
                        <TableCell className="text-right">{d.projects}</TableCell>
                        <TableCell className="text-right">{d.reports_completed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Recent unresolved events</CardTitle>
              <CardDescription>Latest operational incidents. No user data included.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recent_events.length === 0 ? (
                <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No unresolved events.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.recent_events.map((e) => (
                    <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                      {severityBadge(e.severity)}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-mono truncate">{e.category} · {e.event_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {e.function_name ?? "—"} {e.error_code ? `· ${e.error_code}` : ""} · {new Date(e.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => onResolve(e.id)}>Resolve</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FunnelRow({ label, value, base }: { label: string; value: number; base: number }) {
  const p = base > 0 ? Math.min(100, Math.round((value / base) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">{value} <span className="text-xs">({pct(value, base)})</span></span>
      </div>
      <div className="mt-1 h-1.5 rounded bg-muted overflow-hidden" aria-label={`${label} ${p}%`}>
        <div className="h-full bg-primary" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function HealthCard({ title, items }: { title: string; items: Array<{ label: string; value: number; warn?: boolean }> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{it.label}</span>
            <span className={`font-mono font-semibold ${it.warn ? "text-amber-500" : ""}`}>{it.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
