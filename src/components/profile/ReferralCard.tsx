import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ReferralCardProps {
  userId: string;
}

export const ReferralCard = ({ userId }: ReferralCardProps) => {
  const [referralCount, setReferralCount] = useState(0);
  const [credits, setCredits] = useState(0);
  const [creatorReferrals, setCreatorReferrals] = useState(0);
  const [commissionEarned, setCommissionEarned] = useState(0);

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    const { data: referrals } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", userId)
      .eq("status", "completed");

    const { data: creditsData } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: creatorRefs } = await supabase
      .from("creator_referrals")
      .select("total_commission_earned")
      .eq("referrer_id", userId);

    setReferralCount(referrals?.length || 0);
    setCredits(creditsData?.balance || 0);
    setCreatorReferrals(creatorRefs?.length || 0);
    setCommissionEarned(creatorRefs?.reduce((sum, r) => sum + Number(r.total_commission_earned), 0) || 0);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Referral Program</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            You've referred <span className="font-bold text-foreground">{referralCount}</span> friends
          </p>
          <p className="text-sm text-muted-foreground">
            Available credits: <span className="font-bold text-foreground">{credits}</span>
          </p>
          {creatorReferrals > 0 && (
            <>
              <p className="text-sm text-muted-foreground mt-2">
                Creator referrals: <span className="font-bold text-foreground">{creatorReferrals}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Commission earned: <span className="font-bold text-foreground">${commissionEarned.toFixed(2)}</span>
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/referrals">
            <Button variant="outline" size="sm" className="w-full">
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          {creatorReferrals > 0 && (
            <Link to="/koji-connect">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Koji Connect
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};
