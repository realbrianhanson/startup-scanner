import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_FACTS } from "@/lib/productFacts";
import { trackEvent } from "@/lib/analytics";

const SAMPLE_PROJECT_ID = "20d84011-f5e5-441f-a8d8-cf72a13cac21";

const CANONICAL_SECTIONS = [
  "executive_summary","market_analysis","customer_personas","competitive_landscape",
  "strategic_frameworks","porter_five_forces","pestel_analysis","catwoe_analysis",
  "path_to_mvp","go_to_market_strategy","usp_analysis","game_changing_idea",
  "financial_basics","risk_matrix","action_plan",
] as const;

const SampleReport = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    verifyAndRedirect();
  }, []);

  const verifyAndRedirect = async () => {
    try {
      const { data: project } = await supabase
        .from("projects")
        .select("id, is_public, status, validation_score")
        .eq("id", SAMPLE_PROJECT_ID)
        .maybeSingle();

      if (
        !project ||
        !project.is_public ||
        project.status !== "complete" ||
        !project.validation_score ||
        project.validation_score <= 0
      ) {
        setChecking(false);
        return;
      }

      const { data: report } = await supabase
        .from("reports")
        .select("report_data, generation_status")
        .eq("project_id", SAMPLE_PROJECT_ID)
        .maybeSingle();

      const reportData: any = report?.report_data || {};
      const status: Record<string, string> =
        (report?.generation_status as Record<string, string>) || {};

      const allComplete =
        Object.keys(reportData).length > 0 &&
        CANONICAL_SECTIONS.every((k) => status[k] === "complete");

      if (!allComplete) {
        setChecking(false);
        return;
      }

      trackEvent("sample_report_redirect", { project_id: SAMPLE_PROJECT_ID });
      navigate(`/projects/${SAMPLE_PROJECT_ID}/report?sample=1`, { replace: true });
    } catch {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4" role="status" aria-live="polite">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading sample report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <BarChart3 className="h-12 w-12 text-primary mx-auto" />
        <h1 className="font-serif text-3xl tracking-tight">Sample report unavailable</h1>
        <p className="text-muted-foreground">
          The curated sample is temporarily unavailable. Create your own free
          validation report {PRODUCT_FACTS.reportTimeCopy}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => {
              trackEvent("sample_report_unavailable_cta", { action: "create_free_report" });
              navigate("/auth?mode=signup&next=%2Fprojects%2Fnew");
            }}
          >
            Create my free report
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              trackEvent("sample_report_unavailable_cta", { action: "back_home" });
              navigate("/");
            }}
          >
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SampleReport;
