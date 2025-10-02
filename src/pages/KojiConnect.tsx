import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, Check, DollarSign, Users, TrendingUp, Calendar, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/navigation/BottomNav";

interface CreatorReferral {
  id: string;
  referrer_id: string;
  referred_creator_id: string;
  status: string;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  total_earnings_tracked: number;
  total_commission_earned: number;
  commission_percentage: number;
  referred_creator: {
    username: string | null;
    display_name: string;
  };
}

const KojiConnect = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<CreatorReferral[]>([]);
  const [stats, setStats] = useState({
    activeReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
    nextPayout: 0,
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
    await fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    try {
      // Get or create referral code
      let { data: codeData } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .eq("referral_type", "creator")
        .maybeSingle();

      if (!codeData) {
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
          code: `CREATOR-${newCode.data}`,
          referral_type: "creator"
        });

        setReferralCode(`CREATOR-${newCode.data}`);
      } else {
        setReferralCode(codeData.code);
      }

      // Get creator referrals with creator profiles
      const { data: referralsData } = await supabase
        .from("creator_referrals")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      // Fetch creator profiles separately
      const referralsWithProfiles = await Promise.all(
        (referralsData || []).map(async (ref) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", ref.referred_creator_id)
            .single();

          return {
            ...ref,
            referred_creator: profile || { username: null, display_name: "Unknown" }
          };
        })
      );

      setReferrals(referralsWithProfiles);

      // Calculate stats
      const active = referralsWithProfiles?.filter(r => r.status === "active").length || 0;
      const totalCommission = referralsWithProfiles?.reduce((sum, r) => sum + Number(r.total_commission_earned), 0) || 0;

      // Get pending commissions
      const { data: pendingCommissions } = await supabase
        .from("creator_referral_commissions")
        .select("commission_amount, creator_referral_id")
        .is("included_in_payout_id", null)
        .in("creator_referral_id", referralsWithProfiles?.map(r => r.id) || []);

      const pendingAmount = pendingCommissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      setStats({
        activeReferrals: active,
        totalCommission,
        pendingCommission: pendingAmount,
        nextPayout: pendingAmount >= 25 ? pendingAmount : 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCreatorReferralLink = () => {
    return `${window.location.origin}/creator/apply?ref=${referralCode}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCreatorReferralLink());
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Creator referral link copied to clipboard",
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

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const calculateMonthlyEarnings = (referral: CreatorReferral) => {
    if (!referral.activated_at) return 0;
    const monthsActive = Math.max(1, Math.floor((Date.now() - new Date(referral.activated_at).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    return referral.total_earnings_tracked / monthsActive;
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
        <div className="container max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Koji Connect</h1>
            <p className="text-muted-foreground mt-2">
              Earn 7.5% on creator referrals for 9 months
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <p className="text-2xl font-bold">{stats.activeReferrals}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Earned</span>
              </div>
              <p className="text-2xl font-bold">${stats.totalCommission.toFixed(2)}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold">${stats.pendingCommission.toFixed(2)}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Next Payout</span>
              </div>
              <p className="text-2xl font-bold">${stats.nextPayout.toFixed(2)}</p>
              {stats.pendingCommission < 25 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ${(25 - stats.pendingCommission).toFixed(2)} until payout
                </p>
              )}
            </Card>
          </div>

          <Tabs defaultValue="referrals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="referrals">My Referrals</TabsTrigger>
              <TabsTrigger value="link">Referral Link</TabsTrigger>
              <TabsTrigger value="how">How It Works</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Creator Referrals</h2>
                {referrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No creator referrals yet. Share your link to get started!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Creator</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Joined</th>
                          <th className="text-left py-2">Expires</th>
                          <th className="text-right py-2">Monthly Earnings</th>
                          <th className="text-right py-2">Your Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((ref) => (
                          <tr key={ref.id} className="border-b">
                            <td className="py-3">
                              <div>
                                <p className="font-medium">{ref.referred_creator.display_name}</p>
                                {ref.referred_creator.username && (
                                  <p className="text-xs text-muted-foreground">
                                    @{ref.referred_creator.username}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                ref.status === "active" ? "bg-green-500/10 text-green-500" :
                                ref.status === "pending" ? "bg-orange-500/10 text-orange-500" :
                                "bg-gray-500/10 text-gray-500"
                              }`}>
                                {ref.status}
                              </span>
                            </td>
                            <td className="py-3 text-sm">{formatDate(ref.created_at)}</td>
                            <td className="py-3 text-sm">{formatDate(ref.expires_at)}</td>
                            <td className="py-3 text-right text-sm">
                              ${calculateMonthlyEarnings(ref).toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-medium">
                              ${ref.total_commission_earned.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="link" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Your Creator Referral Link</h2>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={getCreatorReferralLink()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleCopy} size="icon" className="shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Share this link with creators you know. When they publish their first post, you'll start earning 7.5% of their earnings for 9 months!
                </p>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">Commission Calculator</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    See what you could earn:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>If creator earns $500/month:</span>
                      <span className="font-bold">You earn $37.50/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>If creator earns $1,000/month:</span>
                      <span className="font-bold">You earn $75/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>If creator earns $2,000/month:</span>
                      <span className="font-bold">You earn $150/month</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="how" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">How Koji Connect Works</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Share Your Creator Link</h3>
                      <p className="text-sm text-muted-foreground">
                        Send your unique creator referral link to content creators you know who might be interested in monetizing their content on Koji.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">They Become a Creator</h3>
                      <p className="text-sm text-muted-foreground">
                        When they sign up and apply to be a creator using your link, the referral is tracked. They need to publish their first exclusive post to activate the referral.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Earn 7.5% Commission</h3>
                      <p className="text-sm text-muted-foreground">
                        For the next 9 months, you'll automatically earn 7.5% of their gross earnings. Commissions are calculated monthly and paid out when you reach the $25 minimum.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg mt-6">
                    <h3 className="font-semibold mb-2">Program Details</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Commission Rate: 7.5% of creator's gross earnings</li>
                      <li>• Duration: 9 months from first post publication</li>
                      <li>• Minimum Payout: $25</li>
                      <li>• Payout Schedule: Monthly (when threshold met)</li>
                      <li>• No limit on number of referrals</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {isMobile && <BottomNav />}
      </div>
    </SafeAreaView>
  );
};

export default KojiConnect;
