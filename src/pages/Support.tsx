import { ArrowLeft, Mail, HelpCircle, CreditCard, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContactSupportForm } from "@/components/support/ContactSupportForm";
import { SearchInput } from "@/components/shared/SearchInput";
import { useState } from "react";

const Support = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const faqItems = [
    {
      id: "account",
      icon: Users,
      title: "Account & Profile",
      items: [
        {
          q: "How do I edit my profile?",
          a: "Go to your Profile, tap the Edit button, update your information, and save changes."
        },
        {
          q: "Can I change my display name?",
          a: "Yes, you can update your display name anytime from the Profile Edit page."
        },
        {
          q: "How do I delete my account?",
          a: "Go to Settings > Account > Danger Zone and follow the account deletion process."
        },
      ]
    },
    {
      id: "subscriptions",
      icon: CreditCard,
      title: "Subscriptions & Payments",
      items: [
        {
          q: "How do I subscribe to a creator?",
          a: "Visit a creator's profile and tap \"Subscribe\" to start a monthly subscription."
        },
        {
          q: "Can I cancel my subscription?",
          a: "Yes, go to Subscriptions page, find the creator, and click \"Manage Subscription\" to cancel."
        },
        {
          q: "When will I be charged?",
          a: "Subscriptions are charged monthly on the date you first subscribed."
        },
        {
          q: "Are refunds available?",
          a: "Refunds are handled on a case-by-case basis. Contact support for assistance."
        },
      ]
    },
    {
      id: "creators",
      icon: Users,
      title: "For Creators",
      items: [
        {
          q: "How do I become a creator?",
          a: "Visit the Creators page and tap \"Become a Creator\" to apply."
        },
        {
          q: "How do I set my subscription price?",
          a: "From your Creator Dashboard, click \"Edit Subscription Price\" and choose from available tiers."
        },
        {
          q: "When do I get paid?",
          a: "Earnings are processed through Stripe and transferred according to your payout schedule."
        },
        {
          q: "What content can I post?",
          a: "You can post photos and text content. All content must follow our Community Guidelines."
        },
      ]
    },
    {
      id: "safety",
      icon: Shield,
      title: "Safety & Privacy",
      items: [
        {
          q: "How do I report someone?",
          a: "Currently, please email support@getkoji.net with details. In-app reporting is coming soon."
        },
        {
          q: "Is my payment information safe?",
          a: "Yes, all payments are processed securely through Stripe. We never store your payment details."
        },
        {
          q: "Can I block users?",
          a: "Yes! Go to Settings > Blocked Users to manage blocked accounts."
        },
      ]
    },
  ];

  const filteredFaqItems = searchQuery
    ? faqItems.map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.items.length > 0)
    : faqItems;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-6">Help & Support</h1>

        {/* Contact Form */}
        <ContactSupportForm />

        {/* Search FAQs */}
        <div className="mt-8 mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search FAQs..."
          />
        </div>

        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Frequently Asked Questions
        </h2>

        {filteredFaqItems.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              No FAQs found matching "{searchQuery}"
            </p>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqItems.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <category.icon className="w-4 h-4" />
                    {category.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-3">
                  {category.items.map((item, idx) => (
                    <div key={idx}>
                      <p className="font-medium text-foreground mb-1">{item.q}</p>
                      <p>{item.a}</p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default Support;