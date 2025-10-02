import { Card } from "@/components/ui/card";

export const AppScreenshots = () => {
  const screenshots = [
    {
      title: "Discover",
      description: "Browse profiles and find people who share your interests",
      alt: "Koji app screenshot showing interest-based profile matching"
    },
    {
      title: "Connect",
      description: "Chat with your matches and build authentic connections",
      alt: "Koji app user chat interface for authentic connections"
    },
    {
      title: "Creator Feed",
      description: "Subscribe to exclusive content from your favorite creators",
      alt: "Koji app exclusive creator content feed"
    },
    {
      title: "Your Profile",
      description: "Showcase your interests and what makes you unique",
      alt: "Koji app user profile with interests and photos"
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            See Koji in Action
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the social discovery platform that's changing how people connect and support creators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {screenshots.map((screenshot, index) => (
            <Card key={index} className="p-6 bg-card border-border h-full">
              <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt={screenshot.alt}
                  className="w-24 h-24 object-contain opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {screenshot.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {screenshot.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Available on iPhone, iPad, and Android devices
          </p>
        </div>
      </div>
    </section>
  );
};
