import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
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

        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                By accessing and using Koji, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>You must be at least 18 years old to use Koji. By creating an account, you confirm that you meet this requirement.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Conduct</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Post inappropriate, offensive, or illegal content</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Impersonate others or create fake accounts</li>
                <li>Violate intellectual property rights</li>
                <li>Attempt to exploit or hack the platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creator Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Subscriptions are processed through Stripe</li>
                <li>Subscriptions auto-renew monthly unless canceled</li>
                <li>Creators set their own subscription prices</li>
                <li>Refunds are subject to our refund policy</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Ownership</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                You retain ownership of content you post on Koji. However, by posting, you grant us a license to display, distribute, and promote your content on the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms of Service or engage in harmful behavior.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creator Referral Program (Koji Connect)</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p className="font-semibold">Program Overview:</p>
              <p>
                The Koji Connect creator referral program allows users to earn commissions by referring new creators to the platform.
              </p>
              
              <p className="font-semibold mt-4">Commission Structure:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>7.5% commission on referred creator's gross earnings</li>
                <li>9-month commission period from first post publication</li>
                <li>$25 minimum payout threshold</li>
                <li>Monthly payout schedule</li>
              </ul>

              <p className="font-semibold mt-4">Eligibility & Requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Must be an active Koji user in good standing</li>
                <li>Can refer both creators and regular users</li>
                <li>Referred creator must use your unique referral link during signup</li>
                <li>Referral activates when referred creator publishes their first exclusive post</li>
                <li>Commission calculated from creator's net earnings after Stripe fees</li>
              </ul>

              <p className="font-semibold mt-4">Prohibited Activities:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Self-referrals or attempts to circumvent the system</li>
                <li>Creating fake accounts to generate referrals</li>
                <li>Spamming referral links</li>
                <li>Misleading potential creators about platform features</li>
                <li>Using referral program for fraudulent purposes</li>
              </ul>

              <p className="font-semibold mt-4">Fraud Prevention:</p>
              <p>
                We employ automated systems to detect suspicious referral activity including IP tracking, device fingerprinting, and pattern analysis. Fraudulent referrals will be flagged and reviewed manually.
              </p>

              <p className="font-semibold mt-4">Commission Clawbacks:</p>
              <p>
                Commissions may be revoked or adjusted if:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Referred creator violates Terms of Service and is banned</li>
                <li>Fraudulent activity is detected</li>
                <li>Subscriptions are refunded</li>
                <li>Referred creator requests account deletion within 30 days</li>
              </ul>

              <p className="font-semibold mt-4">Payouts:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Processed monthly when minimum threshold is met</li>
                <li>Paid via Stripe Connect or platform credits</li>
                <li>Referrer must have valid payment method on file</li>
                <li>Failed payouts will be retried the following month</li>
              </ul>

              <p className="font-semibold mt-4">Program Modifications:</p>
              <p>
                Koji reserves the right to modify commission rates, duration, terms, or terminate the program at any time with 30 days notice. Existing active referrals will continue under original terms until their 9-month period expires.
              </p>

              <p className="font-semibold mt-4">Dispute Resolution:</p>
              <p>
                Disputes regarding referral attribution, commission calculations, or payouts must be submitted within 30 days of the disputed event. Contact support@getkoji.net with referral details for review.
              </p>

              <p className="font-semibold mt-4">Cookies & Attribution:</p>
              <p>
                Referral links have a 90-day cookie lifetime. If a creator clicks your link and signs up within 90 days, you'll receive credit even if they don't complete signup immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Koji is provided "as is" without warranties. We are not responsible for user-generated content or interactions between users.
              </p>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;