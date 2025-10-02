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
    <section className="py-16 md:py-24 px-4 bg-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" aria-label="Creator monetization features" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Empower Your Passions: Monetize & Support
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Koji is the creator monetization app that lets you turn your passion into income. 
            Support creators directly and get access to exclusive content you won't find anywhere else.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300">
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 text-center border border-primary/20">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
            Ready to Support Independent Creators?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
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
