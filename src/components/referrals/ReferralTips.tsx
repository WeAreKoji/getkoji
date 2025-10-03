import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, MessageCircle, Share2, TrendingUp, CheckCircle } from "lucide-react";

export const ReferralTips = () => {
  const tips = [
    {
      icon: Target,
      title: "Target the Right Creators",
      description: "Focus on content creators who are already monetizing or have engaged audiences. They're more likely to activate and earn.",
      category: "Strategy",
    },
    {
      icon: MessageCircle,
      title: "Personal Outreach Works Best",
      description: "Personal messages explaining the benefits convert better than generic links. Share your own experience with Koji.",
      category: "Communication",
    },
    {
      icon: Share2,
      title: "Share on Multiple Platforms",
      description: "Don't limit yourself to one platform. Share on Twitter, Instagram, TikTok, Discord, and creator communities.",
      category: "Distribution",
    },
    {
      icon: TrendingUp,
      title: "Follow Up with Referrals",
      description: "Check in with your referrals to help them get started. Creators who publish their first post quickly earn you more.",
      category: "Support",
    },
    {
      icon: CheckCircle,
      title: "Qualify Your Referrals",
      description: "Make sure potential referrals understand they need to verify their identity and create content to activate commissions.",
      category: "Qualification",
    },
    {
      icon: Lightbulb,
      title: "Share Success Stories",
      description: "Highlight how much creators earn on Koji. Real earnings examples make your referral pitch more compelling.",
      category: "Content",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/20">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Best Practices for Referrals</h2>
            <p className="text-sm text-muted-foreground">
              Maximize your earnings with these proven strategies
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <Card key={index} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{tip.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {tip.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Wins</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Create a Landing Page</p>
              <p className="text-sm text-muted-foreground">
                Build a simple page explaining why creators should join Koji using your link
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Join Creator Communities</p>
              <p className="text-sm text-muted-foreground">
                Participate in Discord servers, Reddit threads, and Facebook groups where creators hang out
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Create Video Content</p>
              <p className="text-sm text-muted-foreground">
                Make a quick video showing how to sign up and start earning on Koji
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Track Your Results</p>
              <p className="text-sm text-muted-foreground">
                Monitor which platforms and messages work best, then double down on what works
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
