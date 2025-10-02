import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowDown, Shield, CheckCircle } from "lucide-react";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CreatorMonetization } from "@/components/home/CreatorMonetization";
import { PlatformAvailability } from "@/components/home/PlatformAvailability";
import { FAQ } from "@/components/home/FAQ";
import { SocialProof } from "@/components/home/SocialProof";
import { AppScreenshots } from "@/components/home/AppScreenshots";
import heroImage from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <header 
        className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-6">
            <img 
              src={logo} 
              alt="Koji app logo - Social discovery and creator monetization platform" 
              className="w-24 h-24 md:w-32 md:h-32 animate-in fade-in zoom-in duration-700"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Koji: Your Hub for Authentic Connections and Creator Support
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            The social discovery platform where interest-based connections meet creator monetization. 
            Find new friends, explore dating, and support creators. Available on iOS & Android.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate("/auth")}
              className="text-lg"
            >
              Download Koji App Now
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-lg border-white/20 hover:bg-white/10"
            >
              Explore Koji Features
            </Button>
          </div>

          <div className="pt-8 animate-in fade-in duration-700 delay-500">
            <p className="text-sm text-muted-foreground mb-2">Trusted by thousands worldwide</p>
            <div className="flex items-center justify-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xl">★</span>
              ))}
              <span className="ml-2 text-muted-foreground text-sm">4.8/5 rating</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-muted-foreground" aria-label="Scroll down to learn more" />
        </div>
      </header>

      {/* How It Works Section */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Features Section - Enhanced with Keywords */}
      <section className="py-16 md:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Why Choose Koji?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              More than just a social app - Koji is your gateway to meaningful connections and creative support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Discover Card */}
            <article className="group p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                💝
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                Find New Friends
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our <a href="/discover" className="text-primary hover:underline">interest-based social network</a> helps you discover like-minded people who share your passions. 
                Whether you're looking for friends or exploring dating based on interests, Koji's swipe to connect 
                feature makes it easy to build authentic connections.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Interest-based matching algorithm</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Best app to make friends based on hobbies</span>
                </li>
              </ul>
            </article>

            {/* Connect Card */}
            <article className="group p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                👥
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                Build Your Community
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Koji is the <a href="/community" className="text-primary hover:underline">community building app</a> that helps you create meaningful relationships. 
                Chat with matches, join conversations, and become part of our thriving online community platform 
                where everyone can find their place.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Real-time messaging and connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Platform to meet like-minded people safely</span>
                </li>
              </ul>
            </article>

            {/* Support Card */}
            <article className="group p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                ✨
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                Support Creators
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Discover the <a href="/creators" className="text-primary hover:underline">exclusive content app</a> where you can support independent creators directly. 
                Subscribe to creators who inspire you and get access to premium content. It's the easiest way to 
                find creators to support and help them monetize their passion.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Direct creator monetization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>Exclusive content and behind-the-scenes access</span>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Creator Monetization Section */}
      <CreatorMonetization />

      {/* App Screenshots */}
      <AppScreenshots />

      {/* Social Proof */}
      <SocialProof />

      {/* Platform Availability */}
      <PlatformAvailability />

      {/* Trust & Safety Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-secondary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Shield className="w-10 h-10 text-primary" aria-label="Koji app safety and security features" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Trust & Safety First
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your safety is our priority. Koji is a secure platform to meet like-minded people with robust 
            verification and moderation systems to ensure a safe, welcoming community building app experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-4">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">ID Verification</h3>
              <p className="text-sm text-muted-foreground">Verify your identity for added trust</p>
            </div>
            <div className="p-4">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">AI Moderation</h3>
              <p className="text-sm text-muted-foreground">24/7 automated content monitoring</p>
            </div>
            <div className="p-4">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Human Review</h3>
              <p className="text-sm text-muted-foreground">Expert team reviewing reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary/5 to-secondary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Start Your Koji Journey
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the social discovery platform trusted by thousands. Download Koji app now and discover 
            authentic connections while supporting creators who share your passions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate("/auth")}
              className="text-lg"
            >
              Download Koji App Now
            </Button>
            <Button 
              variant="secondary" 
              size="xl"
              onClick={() => navigate("/creators")}
              className="text-lg"
            >
              Find Creators to Support
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={logo}
                  alt="Koji - Social discovery and creator monetization" 
                  className="w-10 h-10"
                />
                <span className="text-xl font-bold text-foreground">Koji</span>
              </div>
              <p className="text-muted-foreground mb-4">
                The social discovery platform where authentic connections meet creator monetization. 
                Find new friends, explore dating, and support independent creators on iOS & Android.
              </p>
            </div>
            
            <nav className="space-y-2" aria-label="Platform links">
              <h3 className="font-semibold text-foreground mb-3">Platform</h3>
              <a href="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Koji
              </a>
              <a href="/creators" className="block text-muted-foreground hover:text-primary transition-colors">
                Explore Creators
              </a>
              <a href="/community" className="block text-muted-foreground hover:text-primary transition-colors">
                Community Guidelines
              </a>
              <a href="/creator-application" className="block text-muted-foreground hover:text-primary transition-colors">
                Become a Creator
              </a>
            </nav>
            
            <nav className="space-y-2" aria-label="Legal links">
              <h3 className="font-semibold text-foreground mb-3">Legal & Support</h3>
              <a href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="/support" className="block text-muted-foreground hover:text-primary transition-colors">
                Support Center
              </a>
            </nav>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Koji - Connect, Create & Support. All rights reserved.</p>
            <p className="mt-2">Social discovery platform | Creator monetization app | iOS & Android</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;