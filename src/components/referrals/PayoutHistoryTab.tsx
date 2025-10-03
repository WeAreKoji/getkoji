import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Payout {
  id: string;
  referrer_id: string;
  amount: number;
  status: string;
  currency: string;
  payout_method: string | null;
  stripe_transfer_id: string | null;
  processed_at: string | null;
  created_at: string;
}

interface PayoutHistoryTabProps {
  userId: string;
}

export const PayoutHistoryTab = ({ userId }: PayoutHistoryTabProps) => {
  const isMobile = useIsMobile();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, [userId]);

  const fetchPayouts = async () => {
    try {
      const { data } = await supabase
        .from("creator_referral_payouts")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      setPayouts(data || []);
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const totalEarnings = payouts
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">Loading payout history...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold">Total Paid Out</h2>
        </div>
        <p className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Across {payouts.filter(p => p.status === "completed").length} successful payouts
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payout History</h2>

        {payouts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No payouts yet. Keep referring creators to earn commissions!</p>
          </div>
        ) : (
          <>
            {/* Mobile: Card Layout */}
            {isMobile ? (
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <Card key={payout.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-lg">${Number(payout.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(payout.status)}
                    </div>
                    {payout.payout_method && (
                      <p className="text-sm text-muted-foreground mt-2">
                        via {payout.payout_method}
                      </p>
                    )}
                    {payout.processed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Processed: {new Date(payout.processed_at).toLocaleDateString()}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              /* Desktop: Table Layout */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-left py-3 px-2">Amount</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Method</th>
                      <th className="text-left py-3 px-2">Processed</th>
                      <th className="text-left py-3 px-2">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="border-b last:border-0">
                        <td className="py-3 px-2 text-sm">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 font-semibold">
                          ${Number(payout.amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-2">{getStatusBadge(payout.status)}</td>
                        <td className="py-3 px-2 text-sm">
                          {payout.payout_method || "—"}
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {payout.processed_at
                            ? new Date(payout.processed_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3 px-2 text-sm font-mono">
                          {payout.stripe_transfer_id
                            ? payout.stripe_transfer_id.substring(0, 16) + "..."
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
