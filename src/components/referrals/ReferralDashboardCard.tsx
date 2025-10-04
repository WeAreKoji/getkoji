import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Gift, Users, DollarSign, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralDashboardCardProps {
  userId: string;
  compact?: boolean;
}

export const ReferralDashboardCard = ({ userId, compact = false }: ReferralDashboardCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    activeReferrals: 0,
    potentialEarnings: 0,
    loading: true,
  });

  useEffect(() => {
    fetchReferralStats();
  }, [userId]);

  const fetchReferralStats = async () => {
    try {
      // Get active creator referrals
      const { data: referrals } = await supabase
        .from("creator_referrals")
        .select("total_commission_earned")
        .eq("referrer_id", userId)
        .eq("status", "active");

      const activeCount = referrals?.length || 0;
      const totalEarned = referrals?.reduce((sum, r) => sum + Number(r.total_commission_earned), 0) || 0;

      // Calculate potential earnings (if each referral earned $100/month average)
      const potentialMonthly = activeCount * 100 * 0.075; // 7.5% commission

      setStats({
        activeReferrals: activeCount,
        potentialEarnings: potentialMonthly,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-base">Invite & Earn</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                7.5%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Earn commission by referring creators
            </p>
            <Button size="sm" onClick={() => navigate("/referrals")} className="w-full">
              Start Earning
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Koji Connect Referral Program</h3>
              <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Earn 7.5% for 9 Months
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
            <p className="text-sm text-muted-foreground mb-3">
              Turn your network into income! Refer creators and earn <strong className="text-primary">7.5% commission</strong> on their earnings for 9 months.
            </p>
            
            {!stats.loading && stats.activeReferrals > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="font-bold text-lg">{stats.activeReferrals}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Potential/mo</p>
                    <p className="font-bold text-lg text-green-600">${stats.potentialEarnings.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-card/30">
              <DollarSign className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold">Passive Income</p>
                <p className="text-xs text-muted-foreground">Earn while they create</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-card/30">
              <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold">Unlimited Referrals</p>
                <p className="text-xs text-muted-foreground">No cap on earnings</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-card/30">
              <TrendingUp className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold">Long-Term</p>
                <p className="text-xs text-muted-foreground">9 months per referral</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate("/referrals")} 
            size="lg"
            className="flex-1 group"
          >
            Start Referring & Earn
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            onClick={() => navigate("/referrals?tab=tips")} 
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Learn How
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          💰 Example: Refer 10 creators earning $200/mo = <strong className="text-primary">$150/mo</strong> for you
        </p>
      </div>
    </Card>
  );
};