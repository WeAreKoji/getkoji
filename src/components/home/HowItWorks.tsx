import { Heart, Users, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Heart,
      title: "Create Your Profile",
      description: "Add your interests, photos, and what you're looking for - whether that's finding new friends, dating, or discovering creators to support.",
      alt: "Create interest-based profile on Koji app"
    },
    {
      icon: Users,
      title: "Swipe to Connect",
      description: "Browse through like-minded people and creators who share your passions. Our interest-based social network helps you find authentic connections.",
      alt: "Swipe to connect with users on Koji social discovery platform"
    },
    {
      icon: MessageCircle,
      title: "Chat & Support",
      description: "Start conversations with your matches or subscribe to exclusive content from creators. Build your online community platform experience.",
      alt: "Chat and support creators on Koji app"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground">
            Discover Your Community & Next Favorite Creator
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Koji is the social discovery platform where you can find new friends, explore dating based on interests, 
            and connect with creators who inspire you. Start using the web app now.
          </p>
        </div>

        <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-10 text-foreground px-4">
          How Koji Works: Swipe, Match, Connect
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="p-4 sm:p-6 md:p-8 text-center hover:shadow-lg transition-all duration-300 bg-card border-border">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-primary/10">
                <step.icon 
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" 
                  aria-label={step.alt}
                />
              </div>
              <div className="mb-2 text-primary font-semibold text-sm">
                Step {index + 1}
              </div>
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-foreground">
                {step.title}
              </h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                {step.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-6">
            Join thousands discovering authentic connections in our community building app
          </p>
        </div>
      </div>
    </section>
  );
};
