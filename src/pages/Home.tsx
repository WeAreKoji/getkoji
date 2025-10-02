import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Users, Sparkles, Shield, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/90" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-white">
              Welcome to <span className="text-gradient-secondary">Koji</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              Where authentic connections meet creator economy. 
              Discover, connect, and support the people who inspire you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                variant="hero" 
                size="xl"
                className="group"
              >
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="xl"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              >
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full p-1">
            <div className="w-1 h-3 bg-white/70 rounded-full mx-auto animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            The Platform for <span className="text-gradient-hero">Authentic Connection</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-gradient-border p-8 hover:shadow-[0_0_30px_hsl(265_85%_45%/0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Discover</h3>
              <p className="text-muted-foreground">
                Swipe through profiles matched to your interests. 
                Find friends, dates, or creators who align with your passions.
              </p>
            </div>

            <div className="card-gradient-border p-8 hover:shadow-[0_0_30px_hsl(12_92%_65%/0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-accent flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Connect</h3>
              <p className="text-muted-foreground">
                Match with people who share your vibe. 
                Chat, build relationships, and grow your community.
              </p>
            </div>

            <div className="card-gradient-border p-8 hover:shadow-[0_0_30px_hsl(186_94%_55%/0.2)] transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Support</h3>
              <p className="text-muted-foreground">
                Subscribe to creators you love. 
                Get exclusive content while directly supporting their passion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-6">Your Safety is Our Priority</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Every creator is ID-verified. AI-powered content moderation. 
              24/7 human review team. Zero-tolerance policy for harassment.
              We're building a platform where everyone feels safe to be themselves.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-secondary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Find Your Tribe?
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands discovering meaningful connections on Koji today.
          </p>
          <Button 
            asChild 
            size="xl"
            className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl"
          >
            <Link to="/auth">
              Join Koji Now
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Koji</h3>
          <p className="text-background/70 mb-6">
            Authentic connections. Real value.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
            <Link to="/privacy" className="hover:text-background/70 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-background/70 transition-colors">Terms</Link>
            <Link to="/community" className="hover:text-background/70 transition-colors">Community Guidelines</Link>
            <Link to="/support" className="hover:text-background/70 transition-colors">Support</Link>
          </div>
          <p className="text-background/50 text-sm mt-6">
            © 2025 Koji. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;