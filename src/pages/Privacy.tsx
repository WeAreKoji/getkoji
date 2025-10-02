import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
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

        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-2">We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Profile information (name, age, photos, bio)</li>
                <li>Account credentials</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Messages and interactions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Provide and improve our services</li>
                <li>Process payments and subscriptions</li>
                <li>Send important notifications</li>
                <li>Ensure platform safety and security</li>
                <li>Personalize your experience</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We implement industry-standard security measures to protect your data. All sensitive information is encrypted, and we never store payment details on our servers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access your personal data</li>
                <li>Request data deletion</li>
                <li>Opt-out of marketing communications</li>
                <li>Update your information anytime</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                If you have questions about this Privacy Policy, please contact us at privacy@koji.app
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

export default Privacy;