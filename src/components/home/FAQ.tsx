import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

export const FAQ = () => {
  const faqs = [
    {
      question: "What is Koji app?",
      answer: "Koji is a social discovery platform that combines interest-based matching with creator monetization. It's where you can find new friends, explore dating based on shared hobbies, and discover creators to support. Think of it as an interest-based social network that helps you build authentic connections while supporting independent creators."
    },
    {
      question: "How does Koji's creator monetization work?",
      answer: "Koji is a creator monetization app that lets creators set their own subscription prices and earn recurring revenue. Creators can share exclusive content with their subscribers, including posts, photos, and updates. Supporters can subscribe to their favorite creators and get access to premium content while helping creators monetize their passion online."
    },
    {
      question: "Is Koji available on iOS and Android?",
      answer: "Yes! Koji is available as both an iOS social app and Android social app. You can download Koji from the App Store for iPhone and iPad, or from Google Play for Android devices. The app works seamlessly on both platforms with the same great features."
    },
    {
      question: "How to find creators to support on Koji?",
      answer: "Finding creators to support is easy on Koji's exclusive content app. Browse the Creators section to discover creators who share your interests. You can view their profiles, see their subscription price, check out sample content, and subscribe with one tap. Our platform helps you find independent creators who align with your passions."
    },
    {
      question: "Is Koji a dating app or social network?",
      answer: "Koji is both! It's a versatile social discovery platform that works as a dating app for interests and a community building app. You choose your intent - whether you want to find new friends, explore dating, or simply connect with creators. It's the best app to make friends based on hobbies while also supporting the creator economy."
    },
    {
      question: "How does the swipe to connect feature work?",
      answer: "Our swipe to connect feature is simple: browse through profiles of like-minded people who share your interests, swipe right if you're interested in connecting, swipe left to pass. When both people swipe right, it's a match! You can then start chatting and building authentic connections on our online community platform."
    },
    {
      question: "What makes Koji different from other social apps?",
      answer: "Koji uniquely combines social discovery with creator support. Unlike traditional dating apps or social networks, we focus on interest-based connections and provide a platform to meet like-minded people while also enabling you to support creators directly. It's a community building app that benefits both users and creators."
    },
    {
      question: "Is Koji safe and secure?",
      answer: "Safety is our top priority. Koji includes ID verification, AI-powered content moderation, and human review processes. We're committed to creating a safe platform to meet like-minded people and support independent creators. All payments are secure, and we have robust privacy settings to protect your information."
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-secondary/5">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            Everything you need to know about Koji's social discovery and creator platform
          </p>
        </div>

        <Card className="p-4 sm:p-6 md:p-8 bg-card border-border">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base md:text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-sm sm:text-base text-muted-foreground">
            Still have questions?{" "}
            <a href="/support" className="text-primary hover:underline font-medium">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
