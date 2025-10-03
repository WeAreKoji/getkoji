import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CreatorCardCustomization } from "@/components/creator/CreatorCardCustomization";
import { logError } from "@/lib/error-logger";

const CreatorCustomizeCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<any>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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

      if (!roles) {
        toast({
          title: "Access denied",
          description: "You must be a creator to customize your card",
          variant: "destructive",
        });
        navigate("/discover");
        return;
      }

      // Fetch current customization data
      const { data: profile } = await supabase
        .from("creator_profiles")
        .select("welcome_video_url, cover_image_url, tagline, showcase_bio")
        .eq("user_id", user.id)
        .maybeSingle();

      setUserId(user.id);
      setCurrentData(profile || {});
    } catch (error) {
      logError(error, 'CreatorCustomizeCard.checkAccess');
      toast({
        title: "Error",
        description: "Failed to load customization data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    toast({
      title: "Success",
      description: "Your creator card has been updated!",
    });
    navigate(`/creator/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <Link to={`/creator/${userId}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>

        {userId && (
          <CreatorCardCustomization
            creatorId={userId}
            currentData={currentData}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};

export default CreatorCustomizeCard;
