import { Users, Heart, Globe, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export const SocialProof = () => {
  const stats = [
    {
      icon: Users,
      value: "50,000+",
      label: "Users discovering authentic connections",
      description: "Active community members"
    },
    {
      icon: Sparkles,
      value: "5,000+",
      label: "Creators monetizing their passion",
      description: "Independent creators earning"
    },
    {
      icon: Heart,
      value: "1M+",
      label: "Meaningful connections made",
      description: "Matches and friendships"
    },
    {
      icon: Globe,
      value: "150+",
      label: "Countries worldwide",
      description: "Global community"
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Join Thousands in the Koji Community
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Koji is the online community platform where authentic connections meet creator support. 
            Join our growing community of users finding new friends and supporting independent creators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="p-6 text-center bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <stat.icon className="w-7 h-7 text-primary" aria-label={stat.label} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-base font-semibold text-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground mb-2">
            Trusted by users worldwide as the best app to make friends based on hobbies
          </p>
          <div className="flex items-center justify-center gap-1 text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-2xl">★</span>
            ))}
            <span className="ml-2 text-muted-foreground">4.8/5 average rating</span>
          </div>
        </div>
      </div>
    </section>
  );
};
