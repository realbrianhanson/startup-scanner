import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Star, Send, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface ReportFeedbackProps {
  projectId: string;
  isOwner: boolean;
}

export const ReportFeedback = ({ projectId, isOwner }: ReportFeedbackProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);

  // Testimonial flow
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [testimonialName, setTestimonialName] = useState("");
  const [testimonialRole, setTestimonialRole] = useState("");
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    loadExistingFeedback();
  }, [projectId, isOwner]);

  const loadExistingFeedback = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("report_feedback" as any)
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setExistingFeedback(data);
      setRating((data as any).rating);
      setComment((data as any).comment || "");
      setSubmitted(true);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (existingFeedback) {
        await supabase
          .from("report_feedback" as any)
          .update({ rating, comment: comment.trim() || null } as any)
          .eq("id", (existingFeedback as any).id);
      } else {
        await supabase
          .from("report_feedback" as any)
          .insert({ user_id: user.id, project_id: projectId, rating, comment: comment.trim() || null } as any);
      }

      trackEvent("report_feedback_submitted", { rating, project_id: projectId });
      setSubmitted(true);
      toast.success("Thanks for your feedback!");

      if (rating >= 4) {
        setShowTestimonial(true);
      }
    } catch (error: any) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestimonialSubmit = async () => {
    if (!testimonialQuote.trim() || !testimonialName.trim()) {
      toast.error("Please fill in your name and testimonial");
      return;
    }
    setSubmittingTestimonial(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase
        .from("testimonials" as any)
        .insert({
          user_id: user.id,
          project_id: projectId,
          author_name: testimonialName.trim(),
          author_role: testimonialRole.trim() || null,
          quote: testimonialQuote.trim(),
        } as any);

      trackEvent("testimonial_submitted", { project_id: projectId });
      setTestimonialSubmitted(true);
      toast.success("Thank you! Your testimonial has been submitted for review.");
    } catch {
      toast.error("Failed to submit testimonial");
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4 border-primary/10">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">How useful was this report?</h3>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => { setRating(star); setSubmitted(false); }}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-1 transition-transform duration-150 hover:scale-110"
                disabled={submitting}
              >
                <Star
                  className={`h-8 w-8 transition-colors duration-150 ${
                    star <= (hoveredStar || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating <= 2 ? "We'll work to improve!" : rating <= 3 ? "Thanks — we'll keep improving." : rating === 4 ? "Great to hear!" : "Awesome! 🎉"}
            </p>
          )}
        </div>

        {rating > 0 && !submitted && (
          <div className="space-y-3 animate-fade-up">
            <Textarea
              placeholder="Any suggestions for improvement? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Feedback
            </Button>
          </div>
        )}

        {submitted && !showTestimonial && (
          <p className="text-center text-sm text-muted-foreground">
            ✓ Feedback submitted — thank you!
          </p>
        )}
      </Card>

      {/* Testimonial prompt for happy users */}
      {showTestimonial && !testimonialSubmitted && (
        <Card className="p-6 space-y-4 border-primary/20 bg-primary/[0.02] animate-fade-up">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Glad you found it helpful!</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Would you mind leaving a quick testimonial we can feature? It helps other founders discover Validifier.
          </p>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Your Name *</Label>
                <Input
                  placeholder="Jane Doe"
                  value={testimonialName}
                  onChange={(e) => setTestimonialName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role / Title</Label>
                <Input
                  placeholder="Founder, MyStartup"
                  value={testimonialRole}
                  onChange={(e) => setTestimonialRole(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Your Testimonial *</Label>
              <Textarea
                placeholder="Validifier helped me..."
                value={testimonialQuote}
                onChange={(e) => setTestimonialQuote(e.target.value)}
                rows={3}
                maxLength={300}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestimonialSubmit} disabled={submittingTestimonial} size="sm">
                {submittingTestimonial ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Testimonial
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowTestimonial(false)}>
                No thanks
              </Button>
            </div>
          </div>
        </Card>
      )}

      {testimonialSubmitted && (
        <p className="text-center text-sm text-muted-foreground animate-fade-up">
          💜 Your testimonial is under review — thank you for your support!
        </p>
      )}
    </div>
  );
};
