import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target } from "lucide-react";

interface ReferralAnalyticsProps {
  stats: {
    activeReferrals: number;
    totalCommission: number;
    pendingCommission: number;
    nextPayoutAmount: number;
  };
  referrals: Array<{
    status: string;
    total_commission_earned: number;
    created_at: string;
  }>;
}

export const ReferralAnalytics = ({ stats, referrals }: ReferralAnalyticsProps) => {
  const MINIMUM_PAYOUT = 25;
  const payoutProgress = Math.min((stats.pendingCommission / MINIMUM_PAYOUT) * 100, 100);
  
  // Calculate growth metrics
  const last30DaysReferrals = referrals.filter(ref => {
    const refDate = new Date(ref.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return refDate >= thirtyDaysAgo;
  }).length;

  const previous30DaysReferrals = referrals.filter(ref => {
    const refDate = new Date(ref.created_at);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return refDate >= sixtyDaysAgo && refDate < thirtyDaysAgo;
  }).length;

  const referralGrowth = previous30DaysReferrals > 0
    ? ((last30DaysReferrals - previous30DaysReferrals) / previous30DaysReferrals) * 100
    : last30DaysReferrals > 0 ? 100 : 0;

  const avgCommissionPerReferral = stats.activeReferrals > 0
    ? stats.totalCommission / stats.activeReferrals
    : 0;

  const conversionRate = referrals.length > 0
    ? (stats.activeReferrals / referrals.length) * 100
    : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Progress to Next Payout */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
          <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            Progress to Payout
          </h3>
          <Badge variant={payoutProgress >= 100 ? "default" : "secondary"} className="text-xs">
            ${stats.pendingCommission.toFixed(2)} / $25
          </Badge>
        </div>
        <Progress value={payoutProgress} className="h-2 md:h-3 mb-2" />
        <p className="text-xs md:text-sm text-muted-foreground">
          {payoutProgress >= 100 ? (
            "You've reached the minimum! 🎉"
          ) : (
            `$${(MINIMUM_PAYOUT - stats.pendingCommission).toFixed(2)} more to minimum`
          )}
        </p>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-xs md:text-sm text-muted-foreground">Avg. Commission</span>
            <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
          </div>
          <p className="text-lg md:text-2xl font-bold">${avgCommissionPerReferral.toFixed(2)}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            {stats.activeReferrals} active referrals
          </p>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-xs md:text-sm text-muted-foreground">Conversion</span>
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
          </div>
          <p className="text-lg md:text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            {stats.activeReferrals} of {referrals.length} total
          </p>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-xs md:text-sm text-muted-foreground">30-Day Growth</span>
            {referralGrowth >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
            )}
          </div>
          <p className={`text-lg md:text-2xl font-bold ${referralGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
            {referralGrowth >= 0 ? "+" : ""}{referralGrowth.toFixed(1)}%
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            {last30DaysReferrals} new last 30d
          </p>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-xs md:text-sm text-muted-foreground">Projected</span>
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-500" />
          </div>
          <p className="text-lg md:text-2xl font-bold">
            ${(avgCommissionPerReferral * stats.activeReferrals / 9).toFixed(2)}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            Monthly average
          </p>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="p-4 md:p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Performance Insights</h3>
        <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
          {stats.activeReferrals === 0 && (
            <p className="text-muted-foreground">
              • Share your referral link to start earning commissions
            </p>
          )}
          {stats.activeReferrals > 0 && stats.activeReferrals < 5 && (
            <p className="text-muted-foreground">
              • Great start! Aim for 5+ active referrals
            </p>
          )}
          {stats.activeReferrals >= 5 && (
            <p className="text-green-600">
              • Excellent! {stats.activeReferrals} active referrals earning
            </p>
          )}
          {conversionRate < 50 && referrals.length > 0 && (
            <p className="text-orange-600">
              • Refer creators ready to publish to improve conversion
            </p>
          )}
          {stats.pendingCommission >= 25 && (
            <p className="text-green-600">
              • Payout threshold reached! Paid end of quarter
            </p>
          )}
          {stats.pendingCommission < 25 && stats.pendingCommission > 10 && (
            <p className="text-muted-foreground">
              • Close to $25 threshold - keep sharing!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
