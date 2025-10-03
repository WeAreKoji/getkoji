import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Flag, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logError, getUserFriendlyError } from "@/lib/error-logger";

interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  report_category: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  profiles: {
    display_name: string;
    email: string;
  };
}

interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  flag_type: string;
  confidence_score: number;
  ai_analysis: any;
  status: string;
  created_at: string;
}

const AdminReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate("/");
        return;
      }

      await Promise.all([fetchReports(), fetchFlags()]);
    } catch (error) {
      logError(error, 'AdminReports.checkAdminAndFetch');
      navigate("/");
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("content_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedData = await Promise.all(
        (data || []).map(async (report) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("id", report.reporter_id)
            .single();

          return {
            ...report,
            profiles: profileData || { display_name: "Unknown", email: "N/A" },
          };
        })
      );

      setReports(enrichedData);
    } catch (error) {
      logError(error, 'AdminReports.fetchReports');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    }
  };

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("content_flags")
        .select("*")
        .eq("status", "flagged")
        .order("confidence_score", { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      logError(error, 'AdminReports.fetchFlags');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: "resolved" | "dismissed") => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_reports")
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null,
        })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Report Updated",
        description: `Report marked as ${action}`,
      });

      setSelectedReport(null);
      setResolutionNotes("");
      await fetchReports();
    } catch (error) {
      logError(error, 'AdminReports.handleResolveReport');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleResolveFlag = async (flagId: string, status: "confirmed" | "false_positive") => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_flags")
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", flagId);

      if (error) throw error;

      toast({
        title: "Flag Updated",
        description: `Flag marked as ${status.replace("_", " ")}`,
      });

      await fetchFlags();
    } catch (error) {
      logError(error, 'AdminReports.handleResolveFlag');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      critical: "destructive",
      high: "destructive",
      medium: "secondary",
      low: "default",
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-6xl mx-auto p-4">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-4 -mx-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-semibold">Content Reports & Flags</h1>
          </div>
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="reports">
              <Flag className="w-4 h-4 mr-2" />
              User Reports ({reports.filter(r => r.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="flags">
              <AlertTriangle className="w-4 h-4 mr-2" />
              AI Flags ({flags.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No reports to review</p>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold capitalize">
                          {report.content_type} Report
                        </h3>
                        {getPriorityBadge(report.priority)}
                        <Badge>{report.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reported by: {report.profiles?.display_name} ({report.profiles?.email})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-sm font-medium">Category:</p>
                      <p className="text-sm capitalize">{report.report_category.replace("_", " ")}</p>
                    </div>
                    {report.description && (
                      <div>
                        <p className="text-sm font-medium">Description:</p>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    {new Date(report.created_at).toLocaleString()}
                  </p>

                  {report.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveReport(report.id, "dismissed")}
                        disabled={processing}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="flags" className="space-y-4">
            {flags.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No AI flags to review</p>
              </Card>
            ) : (
              flags.map((flag) => (
                <Card key={flag.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <h3 className="font-semibold capitalize">
                          {flag.flag_type.replace("_", " ")}
                        </h3>
                        <Badge variant={flag.confidence_score > 0.8 ? "destructive" : "secondary"}>
                          {(flag.confidence_score * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {flag.content_type} - ID: {flag.content_id}
                      </p>
                    </div>
                  </div>

                  {flag.ai_analysis && (
                    <div className="mb-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">AI Analysis:</p>
                      <p className="text-sm text-muted-foreground">
                        {flag.ai_analysis.reasoning || "No reasoning provided"}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mb-4">
                    Flagged: {new Date(flag.created_at).toLocaleString()}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleResolveFlag(flag.id, "confirmed")}
                      disabled={processing}
                    >
                      Confirm Violation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveFlag(flag.id, "false_positive")}
                      disabled={processing}
                    >
                      False Positive
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Add resolution notes and mark this report as resolved
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Resolution notes..."
            rows={4}
          />

          <div className="flex gap-2">
            <Button
              onClick={() => selectedReport && handleResolveReport(selectedReport.id, "resolved")}
              disabled={processing}
              className="flex-1"
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mark Resolved
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedReport(null)}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
