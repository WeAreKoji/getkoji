import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, DollarSign, Users, TrendingUp, Calendar, Gift, ShieldAlert, AlertCircle, CheckCircle, Clock, Search, BarChart3, UserPlus, History, Lightbulb, Info, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/navigation/BottomNav";
import { logError } from "@/lib/error-logger";
import { FriendReferralsTab } from "@/components/referrals/FriendReferralsTab";
import { PayoutHistoryTab } from "@/components/referrals/PayoutHistoryTab";
import { ShareReferralLink } from "@/components/referrals/ShareReferralLink";
import { ReferralAnalytics } from "@/components/referrals/ReferralAnalytics";
import { ReferralTips } from "@/components/referrals/ReferralTips";
import { EnhancedEmptyState } from "@/components/referrals/EnhancedEmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";

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
    id_verified?: boolean;
  };
}

const Referrals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<CreatorReferral[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [stats, setStats] = useState({
    activeReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
    nextPayoutDate: "",
    nextPayoutAmount: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await fetchData(user.id);
  };

  const getNextPayoutDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const payoutDates = [
      new Date(currentYear, 2, 31), // End of March
      new Date(currentYear, 5, 30), // End of June
      new Date(currentYear, 8, 30), // End of September
      new Date(currentYear, 11, 31), // End of December
    ];

    for (const date of payoutDates) {
      if (now < date) {
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      }
    }
    
    // If we're past December, return next March
    return new Date(currentYear + 1, 2, 31).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const fetchData = async (userId: string) => {
    try {
      // Check if user is a creator
      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      
      const userIsCreator = !!creatorProfile;
      setIsCreator(userIsCreator);

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

      // Get creator referrals with creator profiles and verification status
      const { data: referralsData } = await supabase
        .from("creator_referrals")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      // Fetch creator profiles and verification status
      const referralsWithProfiles = await Promise.all(
        (referralsData || []).map(async (ref) => {
          const [profileResult, creatorProfileResult] = await Promise.all([
            supabase.from("profiles").select("username, display_name").eq("id", ref.referred_creator_id).single(),
            supabase.from("creator_profiles").select("id_verified").eq("user_id", ref.referred_creator_id).maybeSingle()
          ]);

          return {
            ...ref,
            referred_creator: profileResult.data ? {
              ...profileResult.data,
              id_verified: creatorProfileResult.data?.id_verified || false,
            } : { username: null, display_name: "Unknown", id_verified: false }
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
        nextPayoutDate: getNextPayoutDate(),
        nextPayoutAmount: pendingAmount >= 25 ? pendingAmount : 0,
      });
    } catch (error) {
      logError(error, 'Referrals.fetchData');
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

  const getStatusBadge = (referral: CreatorReferral) => {
    if (referral.status === "active") {
      return { label: "Active - Earning", variant: "default" as const, icon: CheckCircle };
    } else if (referral.status === "expired") {
      return { label: "Expired", variant: "secondary" as const, icon: Clock };
    } else if (referral.referred_creator.id_verified) {
      return { label: "Pending First Post", variant: "outline" as const, icon: AlertCircle };
    } else {
      return { label: "Pending Verification", variant: "outline" as const, icon: Clock };
    }
  };

  // Filter referrals based on search and status
  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = !debouncedSearch || 
      ref.referred_creator.display_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      ref.referred_creator.username?.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesStatus = !filterStatus || ref.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRefresh = async () => {
    if (userId) {
      await fetchData(userId);
    }
  };

  return (
    <SafeAreaView bottom={isMobile}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className={isMobile ? "min-h-screen bg-background pb-20" : "min-h-screen bg-background"}>
          <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">
                {isMobile ? "Creator Referrals" : "Koji Connect - Creator Referral Program"}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
                {isMobile ? "Earn 7.5% for 9 months" : "Earn 7.5% commission on creator referrals for 9 months"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <Card className="p-5 md:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 md:w-4 md:h-4 text-green-500" />
                  <span className="text-sm md:text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-3xl md:text-2xl font-bold">{stats.activeReferrals}</p>
              </Card>

              <Card className="p-5 md:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 md:w-4 md:h-4 text-primary" />
                  <span className="text-sm md:text-xs text-muted-foreground">Earned</span>
                </div>
                <p className="text-3xl md:text-2xl font-bold">${stats.totalCommission.toFixed(2)}</p>
              </Card>

              <Card className="p-5 md:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 md:w-4 md:h-4 text-orange-500" />
                  <span className="text-sm md:text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-3xl md:text-2xl font-bold">${stats.pendingCommission.toFixed(2)}</p>
              </Card>

              <Card className="p-5 md:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 md:w-4 md:h-4 text-purple-500" />
                  <span className="text-sm md:text-xs text-muted-foreground">Next Payout</span>
                </div>
                <p className="text-2xl md:text-lg font-bold">${stats.nextPayoutAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingCommission < 25 ? `$${(25 - stats.pendingCommission).toFixed(2)} to minimum` : stats.nextPayoutDate}
                </p>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <div className="relative -mx-4 px-4 mb-2">
                <TabsList className="w-full overflow-x-auto flex gap-1 justify-start no-scrollbar">
                  <TabsTrigger value="overview" className="flex-shrink-0 gap-1.5 px-3">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex-shrink-0 gap-1.5 px-3">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="creator-referrals" className="flex-shrink-0 gap-1.5 px-3">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Creators</span>
                  </TabsTrigger>
                  <TabsTrigger value="friend-referrals" className="flex-shrink-0 gap-1.5 px-3">
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Friends</span>
                  </TabsTrigger>
                  <TabsTrigger value="payout-history" className="flex-shrink-0 gap-1.5 px-3">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Payouts</span>
                  </TabsTrigger>
                  <TabsTrigger value="tips" className="flex-shrink-0 gap-1.5 px-3">
                    <Lightbulb className="w-4 h-4" />
                    <span className="hidden sm:inline">Tips</span>
                  </TabsTrigger>
                  <TabsTrigger value="payouts" className="flex-shrink-0 gap-1.5 px-3">
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="how" className="flex-shrink-0 gap-1.5 px-3">
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">How</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card className="p-5 md:p-6">
                  <h2 className="text-lg md:text-xl font-semibold mb-4">Your Creator Referral Link</h2>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Input
                      value={getCreatorReferralLink()}
                      readOnly
                      className="font-mono text-xs md:text-sm"
                    />
                    <Button onClick={handleCopy} className="shrink-0 h-11 md:h-10 w-full sm:w-auto">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  <ShareReferralLink 
                    url={getCreatorReferralLink()} 
                    title="Become a Creator on Koji!" 
                    text="Join Koji and start earning from your content. Use my referral link to get started!"
                  />
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    Share this link with creators. When they complete verification and publish their first exclusive post, you'll earn 7.5% of their earnings for 9 months!
                  </p>
                </Card>

                <Card className="p-5 md:p-6">
                  <h2 className="text-lg md:text-xl font-semibold mb-4">Quick Summary</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 md:p-3 bg-muted rounded-lg">
                      <span className="text-sm md:text-sm">Active Referrals:</span>
                      <span className="text-lg md:text-base font-bold">{stats.activeReferrals}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 md:p-3 bg-muted rounded-lg">
                      <span className="text-sm md:text-sm">Lifetime Earnings:</span>
                      <span className="text-lg md:text-base font-bold text-green-600">${stats.totalCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 md:p-3 bg-muted rounded-lg">
                      <span className="text-sm md:text-sm">Pending Payout:</span>
                      <span className="text-lg md:text-base font-bold text-orange-600">${stats.pendingCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 md:p-3 bg-muted rounded-lg">
                      <span className="text-sm md:text-sm">Next Payout Date:</span>
                      <span className="text-lg md:text-base font-bold">{stats.nextPayoutDate}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 md:p-6 bg-primary/5 border-primary/20">
                  <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Commission Calculator
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Potential monthly earnings based on creator performance:
                  </p>
                  <div className="space-y-3 md:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-sm">Creator earns $500/month:</span>
                      <span className="font-bold text-primary">You earn $37.50/month</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-sm">Creator earns $1,000/month:</span>
                      <span className="font-bold text-primary">You earn $75/month</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-sm">Creator earns $2,000/month:</span>
                      <span className="font-bold text-primary">You earn $150/month</span>
                    </div>
                  </div>
                </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <ReferralAnalytics stats={stats} referrals={referrals} />
            </TabsContent>

              {/* Creator Referrals Tab */}
              <TabsContent value="creator-referrals" className="mt-6">
                <Card className="p-5 md:p-6">
                  <h2 className="text-lg md:text-xl font-semibold mb-4">Your Creator Referrals</h2>
                  
                  {/* Search and Filter */}
                  {referrals.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-3 md:gap-2 mb-4">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by creator name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-11 md:h-10"
                        />
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        <Button
                          variant={filterStatus === null ? "default" : "outline"}
                          size={isMobile ? "default" : "sm"}
                          onClick={() => setFilterStatus(null)}
                          className="h-11 md:h-10 px-6 md:px-4"
                        >
                          All
                        </Button>
                        <Button
                          variant={filterStatus === "active" ? "default" : "outline"}
                          size={isMobile ? "default" : "sm"}
                          onClick={() => setFilterStatus("active")}
                          className="h-11 md:h-10 px-6 md:px-4"
                        >
                        Active
                      </Button>
                      <Button
                        variant={filterStatus === "pending" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("pending")}
                      >
                        Pending
                      </Button>
                      <Button
                        variant={filterStatus === "expired" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("expired")}
                      >
                        Expired
                      </Button>
                    </div>
                  </div>
                )}

                {filteredReferrals.length === 0 ? (
                  searchTerm || filterStatus ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No matching referrals found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterStatus(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <EnhancedEmptyState
                      icon={Users}
                      title="No Creator Referrals Yet"
                      description="Start earning commissions by sharing your referral link with content creators!"
                      primaryAction={{
                        label: "Copy Referral Link",
                        onClick: handleCopy,
                      }}
                      tips={[
                        "Share on social media platforms where creators are active",
                        "Join creator communities and Discord servers",
                        "Reach out personally to creators you know",
                        "Explain the benefits: easy monetization, no upfront costs",
                      ]}
                    />
                  )
                ) : (
                  <>
                    {/* Mobile: Card Layout */}
                    {isMobile ? (
                      <div className="space-y-3">
                        {filteredReferrals.map((ref) => {
                          const statusInfo = getStatusBadge(ref);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <Card key={ref.id} className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium">{ref.referred_creator.display_name}</p>
                                  {ref.referred_creator.username && (
                                    <p className="text-xs text-muted-foreground">
                                      @{ref.referred_creator.username}
                                    </p>
                                  )}
                                </div>
                                <Badge variant={statusInfo.variant} className="gap-1">
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Joined:</span>
                                  <span>{formatDate(ref.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Expires:</span>
                                  <span>{formatDate(ref.expires_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Avg Monthly:</span>
                                  <span>${calculateMonthlyEarnings(ref).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-medium pt-2 border-t">
                                  <span>Your Commission:</span>
                                  <span className="text-green-600">${ref.total_commission_earned.toFixed(2)}</span>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      /* Desktop: Table Layout */
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Creator</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Joined</th>
                          <th className="text-left py-3 px-2">Expires</th>
                          <th className="text-right py-3 px-2">Avg Monthly</th>
                          <th className="text-right py-3 px-2">Your Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReferrals.map((ref) => {
                          const statusInfo = getStatusBadge(ref);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <tr key={ref.id} className="border-b last:border-0">
                              <td className="py-3 px-2">
                                <div>
                                  <p className="font-medium">{ref.referred_creator.display_name}</p>
                                  {ref.referred_creator.username && (
                                    <p className="text-xs text-muted-foreground">
                                      @{ref.referred_creator.username}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant={statusInfo.variant} className="gap-1">
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm">{formatDate(ref.created_at)}</td>
                              <td className="py-3 px-2 text-sm">{formatDate(ref.expires_at)}</td>
                              <td className="py-3 px-2 text-right text-sm">
                                ${calculateMonthlyEarnings(ref).toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-right font-medium">
                                ${ref.total_commission_earned.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </TabsContent>

            {/* Friend Referrals Tab */}
            <TabsContent value="friend-referrals" className="mt-6">
              <FriendReferralsTab userId={userId} />
            </TabsContent>

            {/* Payout History Tab */}
            <TabsContent value="payout-history" className="mt-6">
              <PayoutHistoryTab userId={userId} />
            </TabsContent>

            {/* Tips & Best Practices Tab */}
            <TabsContent value="tips" className="mt-6">
              <ReferralTips />
            </TabsContent>

            {/* Payout Details Tab */}
            <TabsContent value="payouts" className="mt-6 space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Payout Schedule</h2>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Quarterly Payout Dates</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Q1: End of March (March 31)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Q2: End of June (June 30)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Q3: End of September (September 30)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Q4: End of December (December 31)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold">Next Payout: {stats.nextPayoutDate}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Estimated amount: ${stats.nextPayoutAmount.toFixed(2)}
                      {stats.pendingCommission < 25 && " (Minimum $25 required)"}
                    </p>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">Minimum Payout Threshold</p>
                    <p className="text-xs text-muted-foreground">
                      You must have at least $25 in pending commissions to receive a payout. If you don't meet the threshold, your balance carries over to the next quarter.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Payout Methods</h2>
                <div className="space-y-4">
                  {isCreator ? (
                    <div className="border p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">Stripe Connect (Recommended)</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Since you're a creator, your commissions will be paid directly to your connected Stripe account along with your creator earnings.
                          </p>
                          <Button size="sm" variant="outline" onClick={() => navigate('/creator/dashboard')}>View Stripe Settings</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border p-4 rounded-lg">
                        <h3 className="font-semibold mb-1">PayPal</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Receive your commissions via PayPal. Fast and secure payments to your PayPal account.
                        </p>
                        <Button size="sm" variant="outline" onClick={() => {
                          toast({
                            title: "Coming Soon",
                            description: "PayPal integration is currently in development. For now, you can become a creator to use Stripe Connect.",
                          });
                        }}>Connect PayPal Account</Button>
                      </div>
                      
                      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                        <h3 className="font-semibold mb-1">Become a Creator</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Creators can receive payouts directly through Stripe Connect along with their creator earnings.
                        </p>
                        <Button size="sm" onClick={() => navigate('/creator/apply')}>Apply to Become a Creator</Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Activation Requirements</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Creator Must Complete ID Verification</p>
                      <p className="text-sm text-muted-foreground">
                        All referred creators must verify their identity before commissions can begin.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Creator Must Publish First Exclusive Post</p>
                      <p className="text-sm text-muted-foreground">
                        The 9-month commission period begins when they publish their first monetized content.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* How It Works Tab */}
            <TabsContent value="how" className="mt-6 space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">How Koji Connect Works</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Share Your Creator Link</h3>
                      <p className="text-sm text-muted-foreground">
                        Send your unique creator referral link to content creators who might be interested in monetizing their content on Koji.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Creator Signs Up & Verifies</h3>
                      <p className="text-sm text-muted-foreground">
                        When they sign up using your link, the referral is tracked. They need to complete ID verification and publish their first exclusive post to activate.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Earn 7.5% for 9 Months</h3>
                      <p className="text-sm text-muted-foreground">
                        Once activated, you automatically earn 7.5% of their gross earnings for the next 9 months. Commissions are calculated on each payment they receive.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Receive Quarterly Payouts</h3>
                      <p className="text-sm text-muted-foreground">
                        When you reach the $25 minimum, you'll receive your payout at the end of the quarter through your chosen payment method.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-muted">
                <h3 className="font-semibold mb-3">Key Program Details</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Commission Rate:</strong> 7.5% of creator's gross earnings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Duration:</strong> 9 months from first post</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Minimum Payout:</strong> $25 per quarter</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Payout Schedule:</strong> Quarterly (End of Mar, Jun, Sep, Dec)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Referral Limit:</strong> Unlimited referrals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Cookie Duration:</strong> 90 days tracking</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Terms & Conditions
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Eligibility</h4>
                    <p className="text-muted-foreground">
                      Any Koji user can refer creators. Referred creators must be new to the platform and complete verification and publish their first post to activate commissions.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Anti-Fraud Policy</h4>
                    <p className="text-muted-foreground">
                      Self-referrals are strictly prohibited. Using bots, fake accounts, or spam tactics will result in immediate disqualification and account suspension. We monitor referral patterns to ensure program integrity.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Commission Clawbacks</h4>
                    <p className="text-muted-foreground">
                      If a referred creator requests a refund or disputes charges, the corresponding commission will be deducted from your pending balance. If your balance is insufficient, future commissions may be withheld.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Referral Link Cookie Duration</h4>
                    <p className="text-muted-foreground">
                      When someone clicks your referral link, a 90-day tracking cookie is set. If they sign up and become a creator within 90 days, you'll receive credit for the referral.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Program Modifications</h4>
                    <p className="text-muted-foreground">
                      Koji reserves the right to modify or terminate the referral program at any time. Existing active referrals will be honored through their 9-month period. Changes will be communicated with 30 days notice.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Dispute Resolution</h4>
                    <p className="text-muted-foreground">
                      For any questions or disputes regarding commissions, contact support@getkoji.net. We'll review your case within 14 business days and provide a resolution. All decisions are final.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </PullToRefresh>
      {isMobile && <BottomNav />}
    </SafeAreaView>
  );
};

export default Referrals;
