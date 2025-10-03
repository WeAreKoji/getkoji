import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, RefreshCcw, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logError, getUserFriendlyError } from "@/lib/error-logger";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string | null;
  failure_reason: string | null;
  metadata: any;
}

export const TransactionHistory = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      logError(error, 'TransactionHistory.fetchTransactions');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      succeeded: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "subscription_payment":
        return <CreditCard className="w-4 h-4" />;
      case "refund":
        return <RefreshCcw className="w-4 h-4" />;
      case "chargeback":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No transactions yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Transaction History</h2>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1">{getTypeIcon(transaction.transaction_type)}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium capitalize">
                      {transaction.transaction_type.replace("_", " ")}
                    </h3>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                    {new Date(transaction.created_at).toLocaleTimeString()}
                  </p>
                  {transaction.failure_reason && (
                    <p className="text-sm text-destructive mt-1">
                      {transaction.failure_reason}
                    </p>
                  )}
                  {transaction.stripe_payment_intent_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {transaction.stripe_payment_intent_id}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {transaction.transaction_type === "refund" ? "-" : ""}$
                  {transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground uppercase">
                  {transaction.currency}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
