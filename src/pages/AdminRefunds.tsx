import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logError, getUserFriendlyError } from "@/lib/error-logger";

interface RefundRequest {
  id: string;
  user_id: string;
  amount_requested: number;
  currency: string;
  reason: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
  profiles: {
    display_name: string;
    email: string;
  };
}

const AdminRefunds = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

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

      await fetchRefunds();
    } catch (error) {
      logError(error, 'AdminRefunds.checkAdminAndFetch');
      navigate("/");
    }
  };

  const fetchRefunds = async () => {
    try {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with profile data
      const enrichedData = await Promise.all(
        (data || []).map(async (refund) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("id", refund.user_id)
            .single();

          return {
            ...refund,
            profiles: profileData || { display_name: "Unknown", email: "N/A" },
          };
        })
      );

      setRefunds(enrichedData as RefundRequest[]);
    } catch (error) {
      logError(error, 'AdminRefunds.fetchRefunds');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (refundId: string, action: "approve" | "reject") => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("process-refund", {
        body: {
          refundRequestId: refundId,
          action,
          adminNotes: action === "reject" ? adminNotes : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Refund request ${action === "approve" ? "approved" : "rejected"}`,
      });

      setSelectedRefund(null);
      setAdminNotes("");
      await fetchRefunds();
    } catch (error) {
      logError(error, 'AdminRefunds.handleProcess');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      processed: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
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
      <div className="container max-w-4xl mx-auto p-4">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-4 -mx-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-semibold">Refund Management</h1>
          </div>
        </div>

        <div className="space-y-4">
          {refunds.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No refund requests</p>
            </Card>
          ) : (
            refunds.map((refund) => (
              <Card key={refund.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{refund.profiles?.display_name}</h3>
                      {getStatusBadge(refund.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{refund.profiles?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${refund.amount_requested.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground uppercase">{refund.currency}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Reason:</p>
                  <p className="text-sm text-muted-foreground">{refund.reason}</p>
                </div>

                {refund.admin_notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">{refund.admin_notes}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mb-4">
                  Submitted: {new Date(refund.created_at).toLocaleString()}
                </p>

                {refund.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleProcess(refund.id, "approve")}
                      disabled={processing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setSelectedRefund(refund)}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
          />

          <div className="flex gap-2">
            <Button
              onClick={() => selectedRefund && handleProcess(selectedRefund.id, "reject")}
              disabled={processing || !adminNotes.trim()}
              variant="destructive"
              className="flex-1"
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Rejection
            </Button>
            <Button variant="outline" onClick={() => setSelectedRefund(null)} disabled={processing}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRefunds;
