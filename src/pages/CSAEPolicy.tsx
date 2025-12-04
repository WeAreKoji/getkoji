import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, AlertTriangle, Phone, Flag, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CSAEPolicy = () => {
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!reportType || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a report type and provide details.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("content_reports").insert({
        reporter_id: user?.id || "00000000-0000-0000-0000-000000000000",
        content_type: "child_safety",
        content_id: "00000000-0000-0000-0000-000000000000",
        report_category: reportType,
        description: description.trim(),
        priority: "critical",
        metadata: {
          report_source: "csae_policy_page",
          anonymous: !user,
        },
      });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for reporting. Our safety team will review this immediately.",
      });
      setReportOpen(false);
      setReportType("");
      setDescription("");
    } catch (error: any) {
      toast({
        title: "Error submitting report",
        description: "Please try again or contact safety@getkoji.com directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-3 flex items-center gap-3">
          <Link to="/settings/privacy" aria-label="Back to privacy settings">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
          </Link>
          <h1 className="font-semibold">Child Safety Policy</h1>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Hero Section */}
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <ShieldAlert className="w-8 h-8 text-destructive shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Zero Tolerance for CSAE
                  </h2>
                  <p className="text-muted-foreground">
                    Koji maintains a strict zero-tolerance policy against Child Sexual Abuse and Exploitation (CSAE). 
                    Any content, behavior, or activity that exploits or endangers minors is strictly prohibited and will result in immediate action.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Commitment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Koji is committed to creating a safe environment for all users. We actively work to prevent, detect, and remove any content related to child sexual abuse and exploitation.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>All users must be 18 years or older to use our platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Age verification is required during registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Creators undergo additional identity verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>We use AI-powered content moderation systems</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Prohibited Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Prohibited Content & Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                The following is strictly prohibited and will result in immediate account termination and reporting to law enforcement:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2 text-destructive/90">
                  <span className="font-bold">✕</span>
                  <span>Any sexual content involving minors</span>
                </li>
                <li className="flex items-start gap-2 text-destructive/90">
                  <span className="font-bold">✕</span>
                  <span>Grooming or solicitation of minors</span>
                </li>
                <li className="flex items-start gap-2 text-destructive/90">
                  <span className="font-bold">✕</span>
                  <span>Sharing, distributing, or requesting CSAM</span>
                </li>
                <li className="flex items-start gap-2 text-destructive/90">
                  <span className="font-bold">✕</span>
                  <span>Sexualized comments about minors</span>
                </li>
                <li className="flex items-start gap-2 text-destructive/90">
                  <span className="font-bold">✕</span>
                  <span>Links to external sites containing CSAM</span>
                </li>
                <li className="flex items-start gap-2 text-destructive/90">
                  <span className="font-bold">✕</span>
                  <span>Any attempt to circumvent age restrictions</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Report Now Section */}
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
                <h3 className="text-lg font-bold">Report Child Safety Concern</h3>
                <p className="text-sm text-muted-foreground">
                  If you have witnessed or suspect any form of child exploitation on our platform, 
                  please report it immediately. All reports are treated with the highest priority.
                </p>
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="destructive" className="w-full sm:w-auto">
                      <Flag className="w-4 h-4 mr-2" />
                      Report Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-destructive" />
                        Report Child Safety Concern
                      </DialogTitle>
                      <DialogDescription>
                        Your report will be reviewed immediately by our safety team. 
                        You may report anonymously.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="report-type">Type of Concern *</Label>
                        <Select value={reportType} onValueChange={setReportType}>
                          <SelectTrigger id="report-type">
                            <SelectValue placeholder="Select type of concern" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csam_content">CSAM / Illegal Content</SelectItem>
                            <SelectItem value="grooming">Grooming Behavior</SelectItem>
                            <SelectItem value="solicitation">Solicitation of Minor</SelectItem>
                            <SelectItem value="age_misrepresentation">User Misrepresenting Age</SelectItem>
                            <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                            <SelectItem value="other_child_safety">Other Child Safety Concern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Details *</Label>
                        <Textarea
                          id="description"
                          placeholder="Please provide as much detail as possible including usernames, timestamps, and description of the concern..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                          maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {description.length}/2000
                        </p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                        <p className="font-medium mb-1">What happens next:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Report reviewed within 24 hours (critical reports faster)</li>
                          <li>Evidence preserved for law enforcement if needed</li>
                          <li>Reported to NCMEC if CSAM is confirmed</li>
                        </ul>
                      </div>
                      <Button 
                        onClick={handleSubmitReport} 
                        disabled={submitting || !reportType || !description.trim()}
                        className="w-full"
                      >
                        {submitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Report
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* How to Report */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                Other Ways to Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                You can also report child safety concerns through these channels:
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-background rounded-lg border">
                  <p className="font-medium text-sm">In-App Reporting</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the report button on any profile, message, or post
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    safety@getkoji.com
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="font-medium text-sm">24/7 Safety Team</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Critical reports are reviewed immediately
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* External Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                External Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                If you suspect a child is in immediate danger, contact local law enforcement. Additional resources:
              </p>
              <div className="space-y-2 text-sm">
                <a 
                  href="https://www.missingkids.org/gethelpnow/cybertipline" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-primary">NCMEC CyberTipline</p>
                  <p className="text-xs text-muted-foreground">Report online child exploitation</p>
                </a>
                <a 
                  href="https://www.iwf.org.uk/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-primary">Internet Watch Foundation (IWF)</p>
                  <p className="text-xs text-muted-foreground">UK-based reporting</p>
                </a>
                <a 
                  href="https://inhope.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-primary">INHOPE</p>
                  <p className="text-xs text-muted-foreground">International hotline network</p>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Our Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Our Actions Against Violations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                When we identify or receive reports of CSAE-related content or behavior, we take immediate action:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Immediate removal of content and account suspension</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Report to NCMEC and relevant law enforcement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Preservation of evidence for authorities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>Permanent ban from the platform</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pb-6">
            <p>Last updated: December 2024</p>
            <p className="mt-2">
              Questions? Contact us at{" "}
              <a href="mailto:safety@getkoji.com" className="text-primary hover:underline">
                safety@getkoji.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSAEPolicy;
