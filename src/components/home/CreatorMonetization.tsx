import { Sparkles, DollarSign, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const CreatorMonetization = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: DollarSign,
      title: "Monetize Your Passion Online",
      description: "Set your own subscription price and earn recurring revenue from subscribers who love your content."
    },
    {
      icon: Lock,
      title: "Exclusive Content App",
      description: "Share premium posts, photos, and updates exclusively with your paying subscribers."
    },
    {
      icon: TrendingUp,
      title: "Grow Your Community",
      description: "Build a loyal following of supporters who appreciate your work and want to see you succeed."
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" aria-label="Creator monetization features" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground">
            Empower Your Passions: Monetize & Support
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Koji is the creator monetization app that lets you turn your passion into income. 
            Support creators directly and get access to exclusive content you won't find anywhere else.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="p-4 sm:p-6 bg-card border-border hover:border-primary/50 transition-all duration-300">
              <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-3" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 text-center border border-primary/20">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-foreground">
            Ready to Support Independent Creators?
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-2 sm:px-4">
            Discover creators who share your interests and subscribe to their exclusive content. 
            Your support helps them monetize their passion and create even better content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => navigate("/creators")}
              className="text-base"
            >
              Find Creators to Support
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/creator-application")}
              className="text-base"
            >
              Become a Koji Creator
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
