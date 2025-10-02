import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FailedTransfer {
  id: string;
  amount: number;
  currency: string;
  error_message: string;
  created_at: string;
  retry_count: number;
  last_retry_at: string | null;
}

interface PayoutDisplayProps {
  creatorId: string;
}

export const EnhancedPayoutDisplay = ({ creatorId }: PayoutDisplayProps) => {
  const [failedTransfers, setFailedTransfers] = useState<FailedTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFailedTransfers();
  }, [creatorId]);

  const fetchFailedTransfers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("failed_transfers")
      .select("*")
      .eq("creator_id", creatorId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFailedTransfers(data);
    }
    setLoading(false);
  };

  const handleRetry = async (transferId: string) => {
    setRetrying(transferId);
    
    const { error } = await supabase.functions.invoke("retry-failed-transfers", {
      body: { transfer_id: transferId },
    });

    if (error) {
      toast({
        title: "Retry Failed",
        description: "Could not retry the transfer. Please try again later.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Retry Initiated",
        description: "The transfer retry has been initiated. Check back in a few minutes.",
      });
      setTimeout(() => fetchFailedTransfers(), 3000);
    }
    setRetrying(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (failedTransfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Payout Status
          </CardTitle>
          <CardDescription>All payouts are processing normally</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          Failed Transfers
        </CardTitle>
        <CardDescription>
          The following transfers failed and need attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {failedTransfers.map((transfer) => (
          <Alert key={transfer.id} variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>
                Failed Transfer: ${(transfer.amount / 100).toFixed(2)} {transfer.currency.toUpperCase()}
              </span>
              <Badge variant="outline">
                Retry #{transfer.retry_count}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p className="text-sm">{transfer.error_message}</p>
              <p className="text-xs text-muted-foreground">
                Failed on: {new Date(transfer.created_at).toLocaleString()}
              </p>
              {transfer.last_retry_at && (
                <p className="text-xs text-muted-foreground">
                  Last retry: {new Date(transfer.last_retry_at).toLocaleString()}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRetry(transfer.id)}
                disabled={retrying === transfer.id}
              >
                {retrying === transfer.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Transfer
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
