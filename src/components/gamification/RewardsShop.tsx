import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Gift, Coins } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  reward_type: string;
  is_active: boolean;
}

export const RewardsShop = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRewards();
      fetchUserPoints();
    }
  }, [user]);

  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("is_active", true)
      .order("points_required");

    if (!error && data) {
      setRewards(data);
    }
    setLoading(false);
  };

  const fetchUserPoints = async () => {
    const { data } = await supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setUserPoints(data.total_points);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user) return;

    if (userPoints < reward.points_required) {
      toast({
        title: "Insufficient points",
        description: `You need ${reward.points_required - userPoints} more points`,
        variant: "destructive",
      });
      return;
    }

    setRedeeming(reward.id);

    const { error } = await supabase
      .from("user_rewards")
      .insert({
        user_id: user.id,
        reward_id: reward.id,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to redeem reward",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: `You've redeemed ${reward.name}`,
      });
      fetchUserPoints();
    }

    setRedeeming(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards Shop
          </span>
          <Badge variant="secondary" className="gap-1">
            <Coins className="h-4 w-4" />
            {userPoints} points
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rewards.map((reward) => {
            const canAfford = userPoints >= reward.points_required;
            return (
              <Card key={reward.id} className={!canAfford ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {reward.description}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {reward.points_required} points
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canAfford || redeeming === reward.id}
                      onClick={() => handleRedeem(reward)}
                    >
                      {redeeming === reward.id ? "Redeeming..." : "Redeem"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
