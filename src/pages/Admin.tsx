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
import { Shield, Plus, ArrowLeft, BarChart3, Users, FolderOpen, TrendingUp } from "lucide-react";

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
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setLoading(false);
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

      // Signups this week
      const { count: swCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "sign_up")
        .gte("created_at", weekAgo);
      setSignupsWeek(swCount || 0);

      // Signups this month
      const { count: smCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "sign_up")
        .gte("created_at", monthAgo);
      setSignupsMonth(smCount || 0);

      // Projects this week
      const { count: pwCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "project_created")
        .gte("created_at", weekAgo);
      setProjectsWeek(pwCount || 0);

      // Projects this month
      const { count: pmCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "project_created")
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" onClick={loadAnalytics}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

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
                      <p className="text-xs text-muted-foreground">Sign-ups this week</p>
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
                      <p className="text-xs text-muted-foreground">Sign-ups this month</p>
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
                      <p className="text-xs text-muted-foreground">Projects this week</p>
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
                      <p className="text-xs text-muted-foreground">Projects this month</p>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
