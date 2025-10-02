import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
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

        <h1 className="text-3xl font-bold mb-6">About Koji</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Koji is a next-generation social platform that connects people through shared interests and meaningful interactions. We combine dating, creator monetization, and community building into one seamless experience.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Makes Us Different</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Discover people who share your interests</li>
                <li>Support your favorite creators through subscriptions</li>
                <li>Build genuine connections in a safe environment</li>
                <li>Express yourself through photos and posts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Koji empowers creators to monetize their content and build a loyal subscriber base. Share exclusive content, connect with your audience, and earn from your passion.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;