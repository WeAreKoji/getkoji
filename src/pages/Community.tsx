import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Community = () => {
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

        <h1 className="text-3xl font-bold mb-6">Community Guidelines</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Be Respectful</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Treat all members with kindness and respect. Harassment, hate speech, bullying, and discriminatory behavior are not tolerated.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keep It Safe</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Do not share personal information publicly</li>
                <li>Report suspicious or dangerous behavior</li>
                <li>Never engage in financial scams or fraud</li>
                <li>Protect your account credentials</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Standards</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>No explicit sexual content</li>
                <li>No violence or graphic imagery</li>
                <li>No spam or misleading information</li>
                <li>Respect copyright and intellectual property</li>
                <li>Keep content appropriate for all audiences</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Creators</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Deliver value to your subscribers</li>
                <li>Be transparent about what subscribers receive</li>
                <li>Respond to subscriber concerns promptly</li>
                <li>Follow all platform monetization rules</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reporting Violations</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                If you see content or behavior that violates these guidelines, please report it immediately. We review all reports and take appropriate action.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consequences</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Violations may result in warnings, content removal, temporary suspension, or permanent account termination, depending on severity.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Community;