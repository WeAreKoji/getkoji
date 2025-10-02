import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Check, Gift, Users, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/navigation/BottomNav";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  availableCredits: number;
}

const Referrals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalRewards: 0,
    availableCredits: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await fetchReferralData(user.id);
  };

  const fetchReferralData = async (userId: string) => {
    try {
      // Get or create referral code
      let { data: codeData } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .maybeSingle();

      if (!codeData) {
        // Generate new code
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();

        const newCode = await supabase.rpc("generate_referral_code", {
          user_username: profileData?.username || null
        });

        await supabase.from("referral_codes").insert({
          user_id: userId,
          code: newCode.data
        });

        setReferralCode(newCode.data);
      } else {
        setReferralCode(codeData.code);
      }

      // Get referral stats
      const { data: referrals } = await supabase
        .from("referrals")
        .select("status")
        .eq("referrer_id", userId);

      const { data: rewards } = await supabase
        .from("referral_rewards")
        .select("amount, status")
        .eq("user_id", userId);

      const { data: credits } = await supabase
        .from("user_credits")
        .select("balance, total_earned")
        .eq("user_id", userId)
        .maybeSingle();

      setStats({
        totalReferrals: referrals?.length || 0,
        completedReferrals: referrals?.filter(r => r.status === "completed").length || 0,
        pendingReferrals: referrals?.filter(r => r.status === "pending").length || 0,
        totalRewards: rewards?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
        availableCredits: credits?.balance || 0,
      });
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/?ref=${referralCode}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not copy link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SafeAreaView bottom={isMobile}>
      <div className={isMobile ? "min-h-screen bg-background pb-20" : "min-h-screen bg-background"}>
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Referral Program</h1>
            <p className="text-muted-foreground mt-2">
              Invite friends and earn rewards together
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <p className="text-2xl font-bold">{stats.completedReferrals}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Credits</span>
              </div>
              <p className="text-2xl font-bold">{stats.availableCredits}</p>
            </Card>
          </div>

          {/* Referral Link Card */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
            <div className="flex gap-2">
              <Input
                value={getReferralLink()}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopy} size="icon" className="shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Share this link with friends to earn rewards when they sign up!
            </p>
          </Card>

          {/* How It Works */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Share Your Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Send your unique referral link to friends
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Friend Signs Up</h3>
                  <p className="text-sm text-muted-foreground">
                    They create an account using your link
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Earn Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Both of you receive credits and bonuses!
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {isMobile && <BottomNav />}
      </div>
    </SafeAreaView>
  );
};

export default Referrals;
