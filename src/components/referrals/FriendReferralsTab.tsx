import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareReferralLink } from "./ShareReferralLink";
import { useIsMobile } from "@/hooks/use-mobile";

interface FriendReferral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  referred_user: {
    display_name: string;
    username: string | null;
  };
  credits_earned: number;
}

interface FriendReferralsTabProps {
  userId: string;
}

export const FriendReferralsTab = ({ userId }: FriendReferralsTabProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<FriendReferral[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendReferrals();
  }, [userId]);

  const fetchFriendReferrals = async () => {
    try {
      // Get or create friend referral code
      let { data: codeData } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .eq("referral_type", "friend")
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
          code: newCode.data,
          referral_type: "friend"
        });

        setReferralCode(newCode.data);
      } else {
        setReferralCode(codeData.code);
      }

      // Get friend referrals
      const { data: referralsData } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      // Fetch referred user profiles
      const referralsWithProfiles = await Promise.all(
        (referralsData || []).map(async (ref) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("id", ref.referred_user_id)
            .single();

          // Get credits earned for this referral (sum of all rewards)
          const { data: rewardsData } = await supabase
            .from("referral_rewards")
            .select("amount")
            .eq("user_id", userId)
            .eq("referral_id", ref.id)
            .eq("status", "completed");

          const totalCredits = rewardsData?.reduce((sum, reward) => sum + Number(reward.amount), 0) || 0;

          return {
            ...ref,
            referred_user: profileData || { display_name: "Unknown", username: null },
            credits_earned: totalCredits
          };
        })
      );

      setReferrals(referralsWithProfiles as FriendReferral[]);
    } catch (error) {
      console.error("Error fetching friend referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFriendReferralLink = () => {
    return `${window.location.origin}/auth?ref=${referralCode}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFriendReferralLink());
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Friend referral link copied to clipboard",
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

  const filteredReferrals = referrals.filter(ref =>
    ref.referred_user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referred_user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCreditsEarned = referrals.reduce((sum, ref) => sum + ref.credits_earned, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Your Friend Referral Link</h2>
        <div className="flex gap-2 mb-4">
          <Input
            value={getFriendReferralLink()}
            readOnly
            className="font-mono text-sm"
          />
          <Button onClick={handleCopy} size="icon" className="shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <ShareReferralLink url={getFriendReferralLink()} title="Join me on Koji!" />
        <p className="text-sm text-muted-foreground mt-4">
          Share this link with friends. When they sign up and complete their profile, you'll both earn credits!
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Friend Referrals</h2>
          <Badge variant="secondary">{totalCreditsEarned} Credits Earned</Badge>
        </div>

        {referrals.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchTerm ? "No matching referrals found" : "No friend referrals yet. Share your link to get started!"}</p>
          </div>
        ) : (
          <>
            {/* Mobile: Card Layout */}
            {isMobile ? (
              <div className="space-y-3">
                {filteredReferrals.map((ref) => (
                  <Card key={ref.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{ref.referred_user.display_name}</p>
                        {ref.referred_user.username && (
                          <p className="text-xs text-muted-foreground">@{ref.referred_user.username}</p>
                        )}
                      </div>
                      <Badge variant={ref.status === "completed" ? "default" : "secondary"}>
                        {ref.status === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-medium">{ref.credits_earned} credits</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Desktop: Table Layout */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Friend</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Date Joined</th>
                      <th className="text-right py-3 px-2">Credits Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((ref) => (
                      <tr key={ref.id} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{ref.referred_user.display_name}</p>
                            {ref.referred_user.username && (
                              <p className="text-xs text-muted-foreground">
                                @{ref.referred_user.username}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={ref.status === "completed" ? "default" : "secondary"}>
                            {ref.status === "completed" ? "Completed" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {new Date(ref.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {ref.credits_earned} credits
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
