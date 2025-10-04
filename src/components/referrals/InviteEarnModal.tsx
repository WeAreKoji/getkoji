import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Gift, Copy, Check, Users, DollarSign, TrendingUp, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareReferralLink } from "./ShareReferralLink";

interface InviteEarnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralLink: string;
  onNavigateToReferrals?: () => void;
}

export const InviteEarnModal = ({
  open,
  onOpenChange,
  referralLink,
  onNavigateToReferrals,
}: InviteEarnModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Your referral link is ready to share",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl">Invite Friends & Earn Together!</DialogTitle>
                <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Koji Connect Referral Program
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Hero Message */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/20">
            <h3 className="font-bold text-lg mb-2">🎉 Start Earning Passive Income Today!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Refer creators to Koji and earn <strong className="text-primary">7.5% commission</strong> on their earnings for 9 months. The more they earn, the more you earn!
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-card/70 text-center">
                <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs font-semibold">7.5%</p>
                <p className="text-xs text-muted-foreground">Commission</p>
              </div>
              <div className="p-3 rounded-lg bg-card/70 text-center">
                <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xs font-semibold">9 Months</p>
                <p className="text-xs text-muted-foreground">Per Referral</p>
              </div>
              <div className="p-3 rounded-lg bg-card/70 text-center">
                <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-semibold">Unlimited</p>
                <p className="text-xs text-muted-foreground">Referrals</p>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Your Unique Referral Link</h4>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopy} className="shrink-0">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            
            {/* Social Sharing */}
            <ShareReferralLink
              url={referralLink}
              title="Join Koji as a Creator!"
              text="I'm loving Koji! Join me as a creator and start earning from your content. Use my link to get started! 🚀"
            />
          </div>

          {/* How It Works */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">How It Works</h4>
            <div className="space-y-2">
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Share Your Link</p>
                  <p className="text-xs text-muted-foreground">Send to creators you know via social media, email, or messaging</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">They Join & Create</p>
                  <p className="text-xs text-muted-foreground">Your referrals sign up, get verified, and start creating content</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">You Earn Commission</p>
                  <p className="text-xs text-muted-foreground">Get 7.5% of their earnings for 9 months, paid quarterly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Example */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Earnings Example
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              If you refer <strong>5 creators</strong> who each earn <strong>$500/month</strong>:
            </p>
            <div className="flex items-center justify-between p-2 bg-card/70 rounded">
              <span className="text-sm">Your monthly commission:</span>
              <span className="text-xl font-bold text-green-600">$187.50</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💰 That's <strong>$1,687.50</strong> over 9 months per referral batch!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onNavigateToReferrals && (
              <Button 
                onClick={onNavigateToReferrals} 
                size="lg"
                className="flex-1"
              >
                View Referral Dashboard
              </Button>
            )}
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
              size="lg"
              className="flex-1"
            >
              I'll Do This Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};