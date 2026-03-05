import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SampleReport = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.title = "Sample Report | Validifier";
    findSampleReport();
  }, []);

  const findSampleReport = async () => {
    try {
      // Find any public project with a completed report
      const { data } = await supabase
        .from("projects")
        .select("id")
        .eq("is_public", true)
        .eq("status", "complete")
        .limit(1)
        .maybeSingle();

      if (data) {
        navigate(`/projects/${data.id}/report`, { replace: true });
      } else {
        setChecking(false);
      }
    } catch {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading sample report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <BarChart3 className="h-12 w-12 text-primary mx-auto" />
        <h1 className="text-2xl font-bold">Sample Report Coming Soon</h1>
        <p className="text-muted-foreground">
          No sample report is available yet. Sign up free and generate your own full validation report in under 60 seconds!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/auth")} size="lg">
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} size="lg">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SampleReport;
