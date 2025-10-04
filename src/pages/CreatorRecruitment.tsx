import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Shield, 
  Star,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Award
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

const CreatorRecruitment = () => {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<number>(5000);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(9.99);
  
  // Calculate potential earnings
  const conversionRate = 0.05; // 5% of followers typically convert
  const potentialSubscribers = Math.floor(followers * conversionRate);
  const monthlyEarnings = potentialSubscribers * subscriptionPrice * 0.85; // 85% after platform fee
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Founding Creator Program
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Turn Your Passion Into Income on Koji
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Join hundreds of creators already monetizing their content. Get exclusive founding creator benefits, 
              no platform fees for your first 3 months, and direct support from our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/creator/apply")}
                className="text-lg"
              >
                Apply Now - Free to Start
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/creators")}
                className="text-lg"
              >
                Browse Creators
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$150K+</div>
              <div className="text-sm text-muted-foreground">Paid to Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">15%</div>
              <div className="text-sm text-muted-foreground">Platform Fee</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Creator Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="px-4 py-16 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Calculate Your Potential Earnings</CardTitle>
              <CardDescription className="text-base">
                See how much you could earn on Koji based on your following
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <Label className="text-lg mb-4 block">Your Social Media Followers</Label>
                <div className="space-y-4">
                  <Slider
                    value={[followers]}
                    onValueChange={(value) => setFollowers(value[0])}
                    min={100}
                    max={50000}
                    step={100}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={followers}
                    onChange={(e) => setFollowers(Math.max(100, parseInt(e.target.value) || 100))}
                    className="text-center text-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <Label className="text-lg mb-4 block">Subscription Price ($/month)</Label>
                <div className="space-y-4">
                  <Slider
                    value={[subscriptionPrice]}
                    onValueChange={(value) => setSubscriptionPrice(value[0])}
                    min={4.99}
                    max={49.99}
                    step={0.50}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(Math.max(4.99, parseFloat(e.target.value) || 4.99))}
                    className="text-center text-xl font-semibold"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-xl space-y-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Estimated Subscribers</div>
                  <div className="text-3xl font-bold text-primary">{potentialSubscribers}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    (Based on 5% conversion rate)
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-background/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-2">Monthly Income</div>
                    <div className="text-2xl font-bold text-foreground">
                      ${monthlyEarnings.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      After 15% platform fee
                    </div>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-2">Yearly Income</div>
                    <div className="text-2xl font-bold text-foreground">
                      ${yearlyEarnings.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Potential annual earnings
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Founding Creator Benefits */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Founding Creator Benefits</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Apply now and get exclusive perks as one of our founding creators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <Award className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Zero Fees for 3 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep 100% of your earnings (minus Stripe processing) for your first 3 months
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <Star className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Featured Placement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get featured on our homepage and creator directory for maximum visibility
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Early Supporter Bonus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  $100 bonus when you reach your first 10 paying subscribers
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Dedicated Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Direct access to our creator success team via Discord and email
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Verified Badge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Priority ID verification and exclusive verified creator badge
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <DollarSign className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Refer & Earn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn 7.5% commission for 9 months on creators you refer to Koji
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Koji */}
      <section className="px-4 py-16 bg-secondary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Koji?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by creators, for creators
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Instant Payouts</h3>
                  <p className="text-muted-foreground">
                    Get paid daily directly to your bank account via Stripe Connect
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Own Your Audience</h3>
                  <p className="text-muted-foreground">
                    Build direct relationships with your supporters without platform lock-in
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Multiple Revenue Streams</h3>
                  <p className="text-muted-foreground">
                    Subscriptions, exclusive content, and more monetization options coming soon
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Simple Setup</h3>
                  <p className="text-muted-foreground">
                    Get started in under 10 minutes with our streamlined onboarding
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Growth Tools</h3>
                  <p className="text-muted-foreground">
                    Analytics, insights, and promotional tools to grow your subscriber base
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Creator Community</h3>
                  <p className="text-muted-foreground">
                    Join a supportive community of creators sharing tips and success stories
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started in 3 Easy Steps</h2>
          </div>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <CardTitle>Apply & Get Approved</CardTitle>
                    <CardDescription className="mt-2">
                      Fill out our simple application form. Most applications are reviewed within 24 hours.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <CardTitle>Set Up Your Profile</CardTitle>
                    <CardDescription className="mt-2">
                      Add your bio, photos, set your subscription price, and connect your Stripe account for payouts.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <CardTitle>Start Earning</CardTitle>
                    <CardDescription className="mt-2">
                      Share your Koji profile with your followers and start building your subscriber base. Get paid daily!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Monetize Your Passion?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Koji today and start earning from your content. No upfront costs, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/creator/apply")}
              className="text-lg"
            >
              Apply Now - It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/creators")}
              className="text-lg"
            >
              See Creator Examples
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Questions? <a href="/support" className="text-primary hover:underline">Contact our creator support team</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default CreatorRecruitment;
