import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, Check, Gift, Users, TrendingUp, DollarSign, Calendar, HelpCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/navigation/BottomNav";
import { KojiConnectCard } from "@/components/referrals/KojiConnectCard";
import { logError } from "@/lib/error-logger";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  availableCredits: number;
  totalEarned: number;
  creditsUsed: number;
}

interface CreatorStats {
  activeReferrals: number;
  totalCommission: number;
  pendingCommission: number;
}

interface ReferralRecord {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  referred_user: {
    display_name: string;
    username: string | null;
  } | null;
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
    totalEarned: 0,
    creditsUsed: 0,
  });
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    activeReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
  });
  const [referralsList, setReferralsList] = useState<ReferralRecord[]>([]);

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
    setLoading(true);
    try {
      // Batch 1: Fetch core data in parallel
      const [
        { data: referralCodeData },
        { data: referrals },
        { data: rewards },
        { data: credits },
        { data: creatorReferrals }
      ] = await Promise.all([
        supabase.from("referral_codes").select("code").eq("user_id", userId).maybeSingle(),
        supabase.from("referrals").select("id, status, created_at, completed_at, referred_user_id").eq("referrer_id", userId).order("created_at", { ascending: false }),
        supabase.from("referral_rewards").select("amount, status").eq("user_id", userId),
        supabase.from("user_credits").select("balance, total_earned").eq("user_id", userId).maybeSingle(),
        supabase.from("creator_referrals").select("*").eq("referrer_id", userId)
      ]);

      // Generate referral code if doesn't exist
      if (!referralCodeData) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();

        const newCode = await supabase.rpc("generate_referral_code", {
          user_username: profile?.username || null,
        });

        if (newCode.data) {
          await supabase.from("referral_codes").insert({
            user_id: userId,
            code: newCode.data,
          });
          setReferralCode(newCode.data);
        }
      } else {
        setReferralCode(referralCodeData.code);
      }

      // Batch 2: Fetch referred user profiles if referrals exist
      let referralsWithProfiles: ReferralRecord[] = [];
      if (referrals && referrals.length > 0) {
        const referredIds = [...new Set(referrals.map(r => r.referred_user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", referredIds);

        referralsWithProfiles = referrals.map(ref => ({
          id: ref.id,
          status: ref.status,
          created_at: ref.created_at,
          completed_at: ref.completed_at,
          referred_user: profilesData?.find(p => p.id === ref.referred_user_id) || null
        }));
      }

      // Batch 3: Fetch creator commissions only if creator referrals exist
      let pendingCommissions: any[] = [];
      if (creatorReferrals && creatorReferrals.length > 0) {
        const creatorRefIds = creatorReferrals.map(r => r.id);
        const { data } = await supabase
          .from("creator_referral_commissions")
          .select("commission_amount")
          .is("included_in_payout_id", null)
          .in("creator_referral_id", creatorRefIds);
        pendingCommissions = data || [];
      }

      // Calculate stats
      const totalEarned = credits?.total_earned || 0;
      const balance = credits?.balance || 0;

      setStats({
        totalReferrals: referrals?.length || 0,
        completedReferrals: referrals?.filter(r => r.status === "completed").length || 0,
        pendingReferrals: referrals?.filter(r => r.status === "pending").length || 0,
        totalRewards: rewards?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
        availableCredits: balance,
        totalEarned,
        creditsUsed: totalEarned - balance,
      });

      setReferralsList(referralsWithProfiles);

      setCreatorStats({
        activeReferrals: creatorReferrals?.filter(r => r.status === "active").length || 0,
        totalCommission: creatorReferrals?.reduce((sum, r) => sum + Number(r.total_commission_earned), 0) || 0,
        pendingCommission: pendingCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
      });
    } catch (error) {
      logError(error, 'Referrals.fetchReferralData');
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

  const formatDate = (date: string | null) => {
    if (!date) return "Pending";
    return new Date(date).toLocaleDateString();
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
              Share Koji with friends and earn credits together
            </p>
          </div>

          {/* Koji Connect Card */}
          {creatorStats.activeReferrals > 0 && (
            <div className="mb-6">
              <KojiConnectCard 
                activeReferrals={creatorStats.activeReferrals}
                totalCommission={creatorStats.totalCommission}
                pendingCommission={creatorStats.pendingCommission}
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="info">How It Works</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Referral Link Card */}
              <Card className="p-6">
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

              {/* Quick Stats */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Rewards Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalEarned}</p>
                    <p className="text-xs text-muted-foreground mt-1">credits</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available</p>
                    <p className="text-2xl font-bold text-primary">{stats.availableCredits}</p>
                    <p className="text-xs text-muted-foreground mt-1">credits</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Used</p>
                    <p className="text-2xl font-bold">{stats.creditsUsed}</p>
                    <p className="text-xs text-muted-foreground mt-1">credits</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Credit Value</p>
                    <p className="text-2xl font-bold">$1</p>
                    <p className="text-xs text-muted-foreground mt-1">per credit</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Referral History</h2>
                {referralsList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals yet. Share your link to get started!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-sm">Friend</th>
                          <th className="text-left py-3 px-2 font-medium text-sm">Status</th>
                          <th className="text-left py-3 px-2 font-medium text-sm">Joined</th>
                          <th className="text-left py-3 px-2 font-medium text-sm">Completed</th>
                          <th className="text-right py-3 px-2 font-medium text-sm">Reward</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralsList.map((referral) => (
                          <tr key={referral.id} className="border-b last:border-0">
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium">
                                  {referral.referred_user?.display_name || "Unknown User"}
                                </p>
                                {referral.referred_user?.username && (
                                  <p className="text-xs text-muted-foreground">
                                    @{referral.referred_user.username}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                referral.status === "completed" 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}>
                                {referral.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-sm">{formatDate(referral.created_at)}</td>
                            <td className="py-3 px-2 text-sm">{formatDate(referral.completed_at)}</td>
                            <td className="py-3 px-2 text-right font-medium">
                              {referral.status === "completed" ? "100 credits" : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Credits & Rewards</h2>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <Gift className="w-8 h-8 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Referral Bonus</p>
                      <p className="text-2xl font-bold mt-1">100</p>
                      <p className="text-xs text-muted-foreground mt-1">credits per referral</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Credit Value</p>
                      <p className="text-2xl font-bold mt-1">$1</p>
                      <p className="text-xs text-muted-foreground mt-1">per credit</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Your Balance</p>
                      <p className="text-2xl font-bold mt-1">{stats.availableCredits}</p>
                      <p className="text-xs text-muted-foreground mt-1">available credits</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">How to Use Credits</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Credits can be used for premium features and subscriptions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>1 credit = $1 USD discount on any purchase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Credits are automatically applied at checkout</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>No expiration date on credits</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* How It Works Tab */}
            <TabsContent value="info">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Share Your Link</h3>
                        <p className="text-sm text-muted-foreground">
                          Copy your unique referral link and share it with friends via social media, email, or messaging apps.
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
                          When your friend clicks your link and creates a Koji account, they'll be tracked as your referral.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Complete Requirements</h3>
                        <p className="text-sm text-muted-foreground">
                          Once your friend completes their profile and is active for 7 days, the referral is marked as completed.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold">4</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Earn Rewards</h3>
                        <p className="text-sm text-muted-foreground">
                          Both you and your friend receive 100 credits! Use them for premium features, subscriptions, and more.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      Program Details
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium">Referral Bonus:</dt>
                        <dd className="text-muted-foreground">100 credits per completed referral</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Friend Bonus:</dt>
                        <dd className="text-muted-foreground">Your friend also gets 100 credits</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Completion Time:</dt>
                        <dd className="text-muted-foreground">7 days of active account required</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Referral Limit:</dt>
                        <dd className="text-muted-foreground">Unlimited referrals allowed</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Important Information</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Referrals must be genuine accounts - fraud detection is active</li>
                        <li>• Self-referrals and fake accounts will be removed</li>
                        <li>• Credits are non-transferable and have no cash value</li>
                        <li>• Program terms may change with notice</li>
                      </ul>
                    </div>
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

export default Referrals;
