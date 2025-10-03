import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCcw,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import BottomNav from "@/components/navigation/BottomNav";
import { logError, getUserFriendlyError } from "@/lib/error-logger";
import { format } from "date-fns";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_invoice_id: string | null;
  failure_reason: string | null;
  metadata: any;
  user_id: string;
  subscription_id: string | null;
  creator_id: string | null;
}

interface Subscription {
  id: string;
  creator_profiles: {
    user_id: string;
    profiles: {
      display_name: string;
      username: string;
    };
  };
}

const TransactionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (id) {
      fetchTransactionDetails();
    }
  }, [id]);

  const fetchTransactionDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: txData, error: txError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (txError) throw txError;

      // Verify user owns this transaction
      if (txData.user_id !== user.id && txData.creator_id !== user.id) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this transaction",
          variant: "destructive",
        });
        navigate("/profile");
        return;
      }

      setTransaction(txData);

      // Fetch subscription details if available
      if (txData.subscription_id) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select(`
            id,
            creator_profiles!subscriptions_creator_id_fkey (
              user_id,
              profiles!creator_profiles_user_id_fkey (
                display_name,
                username
              )
            )
          `)
          .eq("id", txData.subscription_id)
          .single();

        if (subData) {
          setSubscription(subData as any);
        }
      }
    } catch (error) {
      logError(error, 'TransactionDetails.fetchTransactionDetails');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "failed":
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This transaction doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate("/profile")}>
              Go to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto p-4 space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Transaction Details</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.status)}
                  <Badge variant={getStatusColor(transaction.status)}>
                    {transaction.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {transaction.transaction_type === "refund" ? "-" : ""}
                  ${transaction.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground uppercase">
                  {transaction.currency}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {transaction.failure_reason && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Failure Reason:</strong> {transaction.failure_reason}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{getTypeLabel(transaction.transaction_type)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(transaction.created_at), "PPP 'at' p")}
                  </p>
                </div>
              </div>

              {subscription && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <RefreshCcw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subscription</p>
                      <p className="font-medium">
                        {subscription.creator_profiles.profiles.display_name}
                        {subscription.creator_profiles.profiles.username && 
                          ` (@${subscription.creator_profiles.profiles.username})`
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}

              {transaction.stripe_payment_intent_id && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Payment Intent ID</p>
                      <p className="font-mono text-xs break-all">
                        {transaction.stripe_payment_intent_id}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {transaction.stripe_invoice_id && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Invoice ID</p>
                      <p className="font-mono text-xs break-all">
                        {transaction.stripe_invoice_id}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Additional Information</p>
                    <div className="bg-muted rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(transaction.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Transaction ID: {transaction.id}</span>
              <span>
                Updated: {format(new Date(transaction.updated_at), "PP")}
              </span>
            </div>

            {transaction.status === "failed" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If you believe this is an error, please contact support with your transaction ID.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default TransactionDetails;
