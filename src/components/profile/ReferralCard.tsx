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

    setReferralCount(referrals?.length || 0);
    setCredits(creditsData?.balance || 0);
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
        </div>
        <Link to="/referrals">
          <Button variant="outline" size="sm">
            View Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
