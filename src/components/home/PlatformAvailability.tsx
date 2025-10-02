import { Smartphone, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const PlatformAvailability = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            Join the Koji Community on iOS & Android
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Download Koji social discovery platform today and start connecting with like-minded people. 
            Available as a free iOS social app and Android social app.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto p-8 md:p-12 bg-card border-border">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-xl md:text-2xl font-semibold mb-4 text-foreground">
                Download Koji App Now
              </h4>
              <p className="text-muted-foreground mb-6">
                Get started in minutes. Create your profile, set your interests, and begin discovering 
                authentic connections on the best app to make friends based on hobbies.
              </p>
              <ul className="space-y-3 text-muted-foreground mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Free to download and use</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Works on iPhone, iPad, and Android devices</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Regular updates with new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Safe and secure platform</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="flex items-center gap-2"
                  asChild
                >
                  <a 
                    href="https://apps.apple.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="Download Koji on the App Store"
                  >
                    <Apple className="w-5 h-5" />
                    App Store
                  </a>
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="flex items-center gap-2"
                  asChild
                >
                  <a 
                    href="https://play.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="Download Koji on Google Play"
                  >
                    <Smartphone className="w-5 h-5" />
                    Google Play
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Download Koji social discovery platform on App Store and Google Play" 
                  className="w-48 h-48 md:w-64 md:h-64 object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-full blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Available worldwide on iOS 14+ and Android 8+
          </p>
        </div>
      </div>
    </section>
  );
};
