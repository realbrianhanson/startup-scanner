import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Plus, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  ai_credits_monthly: number;
  ai_credits_used: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [creditsToAdd, setCreditsToAdd] = useState<string>("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
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
      console.error("Admin check failed:", error);
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
      console.error("Failed to load profiles:", error);
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
      console.error("Failed to add credits:", error);
      toast.error("Failed to add credits");
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
            <p className="text-muted-foreground">Manage users and credits</p>
          </div>
        </div>

        <div className="grid gap-6">
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
                            ? "text-green-600"
                            : "text-orange-600"
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
        </div>
      </div>
    </div>
  );
};

export default Admin;
