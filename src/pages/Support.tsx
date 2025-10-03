import { ArrowLeft, Mail, HelpCircle, CreditCard, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Support = () => {
  const navigate = useNavigate();

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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p className="mb-2">Need help? We're here for you!</p>
            <p>Email us at: <a href="mailto:support@getkoji.net" className="text-primary hover:underline">support@getkoji.net</a></p>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="account">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Account & Profile
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">How do I edit my profile?</p>
                <p>Go to your Profile, tap the Edit button, update your information, and save changes.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Can I change my display name?</p>
                <p>Yes, you can update your display name anytime from the Profile Edit page.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">How do I delete my account?</p>
                <p>Contact support at support@getkoji.net to request account deletion.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="subscriptions">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscriptions & Payments
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">How do I subscribe to a creator?</p>
                <p>Visit a creator's profile and tap "Subscribe" to start a monthly subscription.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Can I cancel my subscription?</p>
                <p>Yes, go to Subscriptions page, find the creator, and click "Manage Subscription" to cancel.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">When will I be charged?</p>
                <p>Subscriptions are charged monthly on the date you first subscribed.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Are refunds available?</p>
                <p>Refunds are handled on a case-by-case basis. Contact support for assistance.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="creators">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                For Creators
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">How do I become a creator?</p>
                <p>Visit the Creators page and tap "Become a Creator" to apply.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">How do I set my subscription price?</p>
                <p>From your Creator Dashboard, click "Edit Subscription Price" and choose from available tiers.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">When do I get paid?</p>
                <p>Earnings are processed through Stripe and transferred according to your payout schedule.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">What content can I post?</p>
                <p>You can post photos and text content. All content must follow our Community Guidelines.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="safety">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Safety & Privacy
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">How do I report someone?</p>
                <p>Currently, please email support@getkoji.net with details. In-app reporting is coming soon.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Is my payment information safe?</p>
                <p>Yes, all payments are processed securely through Stripe. We never store your payment details.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Can I block users?</p>
                <p>Blocking functionality is coming soon. For now, please report problematic users to support.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Support;