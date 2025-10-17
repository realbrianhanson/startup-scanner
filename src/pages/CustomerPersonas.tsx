import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Loader2,
  Users,
  AlertTriangle,
  XCircle,
  Lightbulb,
  MapPin,
  FileText,
  Copy,
} from "lucide-react";

const CustomerPersonas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectAndReport();
  }, [id]);

  const loadProjectAndReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();

      if (reportData) {
        setReport(reportData);
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Failed to load data");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const reportData = report?.report_data || {};
  const customerPersonas = reportData.customer_personas || [];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Validifier
              </span>
            </div>
            <Button variant="ghost" onClick={() => navigate(`/projects/${id}/report`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Report
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Users className="h-10 w-10 text-primary" />
              Your Target Customers
            </h1>
            <p className="text-xl text-muted-foreground">
              Meet the 3-4 people most likely to buy from you
            </p>
          </div>

          {/* Start With Callout */}
          {customerPersonas[0] && (
            <Card className="p-6 bg-primary/10 border-primary/30">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    🎯
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">START WITH {customerPersonas[0].name?.toUpperCase()}</h3>
                  <p className="text-foreground/90 mb-2">
                    <strong>Why:</strong> {customerPersonas[0].priority_reason}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Persona Cards */}
          <div className="space-y-8">
            {customerPersonas.map((persona: any, idx: number) => (
              <Card key={idx} className="p-6 bg-muted/30">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="text-2xl font-bold">{persona.name}</h3>
                    {idx === 0 && (
                      <Badge variant="default" className="text-sm">START HERE</Badge>
                    )}
                    {idx > 0 && (
                      <Badge variant="secondary" className="text-sm">{persona.priority} PRIORITY</Badge>
                    )}
                  </div>

                  {/* Who They Are */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Who They Are
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age:</span> <strong>{persona.age}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Job:</span> <strong>{persona.job}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Income:</span> <strong>{persona.income}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span> <strong>{persona.location}</strong>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Values:</p>
                      <p className="font-medium">{Array.isArray(persona.values) ? persona.values.join(', ') : persona.values}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Personality:</p>
                      <p className="font-medium">{Array.isArray(persona.personality) ? persona.personality.join(', ') : persona.personality}</p>
                    </div>
                  </div>

                  {/* Pain Points */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      3 Big Pain Points
                    </h4>
                    <div className="space-y-3">
                      {persona.pain_points?.map((pp: any, i: number) => (
                        <div key={i} className="bg-warning/10 p-4 rounded-lg">
                          <p className="font-semibold text-warning">
                            {i === 0 ? 'PRIMARY' : i === 1 ? 'SECONDARY' : 'TERTIARY'}: {pp.pain}
                          </p>
                          <p className="text-sm text-foreground/80 mt-1">
                            <strong>Impact:</strong> {pp.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm"><strong>Current broken solution:</strong> {persona.current_solution}</p>
                      <p className="text-sm mt-2"><strong>Dream outcome:</strong> {persona.dream_outcome}</p>
                    </div>
                  </div>

                  {/* Objections */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      Objections (What stops them from buying)
                    </h4>
                    <div className="space-y-2">
                      {persona.objections?.map((obj: any, i: number) => (
                        <div key={i} className="bg-destructive/10 p-3 rounded-lg text-sm">
                          <p><strong>"{obj.objection}"</strong></p>
                          <p className="text-foreground/70 mt-1">→ Root cause: {obj.root_cause}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Closing Angles */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-success" />
                      Closing Angles (How to convert them)
                    </h4>
                    <div className="space-y-2">
                      {persona.closing_angles?.map((angle: any, i: number) => (
                        <div key={i} className="bg-success/10 p-3 rounded-lg text-sm">
                          <p className="font-semibold">{angle.angle}</p>
                          <p className="text-foreground/70 text-xs mt-1">Addresses: {angle.addresses}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                      <p><strong>Proof they need:</strong> {persona.proof_needed}</p>
                      <p><strong>Urgency trigger:</strong> {persona.urgency_trigger}</p>
                    </div>
                  </div>

                  {/* Where to Find Them */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Where to Find Them
                    </h4>
                    {persona.channels?.map((channel: any, i: number) => (
                      <div key={i} className="bg-primary/10 p-4 rounded-lg space-y-3">
                        <p className="font-semibold">{i === 0 ? 'Primary' : 'Secondary'} Channel: {channel.platform}</p>
                        {channel.communities && channel.communities.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Specific communities:</p>
                            <p className="text-sm text-foreground/80">{channel.communities.join(', ')}</p>
                          </div>
                        )}
                        {channel.influencers && channel.influencers.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Influencers they follow:</p>
                            <p className="text-sm text-foreground/80">{channel.influencers.join(', ')}</p>
                          </div>
                        )}
                        {channel.outreach_template && (
                          <div className="mt-3 pt-3 border-t border-primary/20">
                            <p className="text-sm font-medium mb-2">How to reach out:</p>
                            <div className="bg-background p-3 rounded relative">
                              <p className="text-sm italic text-foreground/90">"{channel.outreach_template}"</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(channel.outreach_template);
                                  toast.success("Copied to clipboard!");
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Content That Converts */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Content That Converts
                    </h4>
                    <div className="space-y-3">
                      {persona.content_ideas?.map((idea: any, i: number) => (
                        <div key={i} className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-semibold mb-1">"{idea.title}"</p>
                              <p className="text-sm text-foreground/70">{idea.why_it_works}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(idea.title);
                                toast.success("Title copied!");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 border-t">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate(`/projects/${id}/report`)}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Main Report
            </Button>
            <Button 
              variant="default" 
              size="lg"
              onClick={() => navigate(`/projects/${id}/chat`)}
            >
              Discuss with Cora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPersonas;
