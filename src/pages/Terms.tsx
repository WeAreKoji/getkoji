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