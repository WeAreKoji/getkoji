import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { Link } from "react-router-dom";

const CreatorApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [application, setApplication] = useState("");
  const [isAlreadyCreator, setIsAlreadyCreator] = useState(false);

  useEffect(() => {
    checkCreatorStatus();
  }, []);

  const checkCreatorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "creator")
        .maybeSingle();

      if (roles) {
        setIsAlreadyCreator(true);
        toast({
          title: "Already a creator",
          description: "You're already registered as a creator!",
        });
      }
    } catch (error) {
      console.error("Error checking creator status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (application.length < 50) {
      toast({
        title: "Application too short",
        description: "Please provide more details (minimum 50 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For MVP: Automatically approve and create creator role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "creator",
          verified_at: new Date().toISOString(),
        });

      if (roleError) throw roleError;

      toast({
        title: "Application approved! 🎉",
        description: "You're now a creator. Set up your profile!",
      });

      navigate("/creator/setup");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAlreadyCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Star className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">You're already a creator!</h2>
          <p className="text-muted-foreground mb-6">
            Visit your creator profile to manage your content.
          </p>
          <Button onClick={() => navigate("/discover")} className="w-full">
            Back to Discover
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Link to="/discover">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="p-8">
          <div className="text-center mb-8">
            <Star className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Become a Creator</h1>
            <p className="text-muted-foreground">
              Share exclusive content and earn from your subscribers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Why become a creator?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Monetize your content with monthly subscriptions</li>
                  <li>• Build a dedicated community of supporters</li>
                  <li>• Share exclusive photos, videos, and updates</li>
                  <li>• Set your own subscription price</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application">
                  Tell us about yourself and what content you'll create *
                </Label>
                <Textarea
                  id="application"
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  placeholder="Describe what kind of content you plan to create, your experience, and why you want to be a creator on Koji..."
                  rows={8}
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {application.length}/1000 characters (minimum 50)
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              For MVP: Applications are auto-approved. You'll be redirected to set up
              your creator profile.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreatorApplication;
