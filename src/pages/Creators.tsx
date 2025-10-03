import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import BottomNav from "@/components/navigation/BottomNav";
import { CreatorShowcaseCard } from "@/components/creator/CreatorShowcaseCard";

interface Creator {
  id: string;
  user_id: string;
  subscription_price: number;
  subscriber_count: number;
  id_verified?: boolean;
  display_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  age?: number;
  created_at: string;
  welcome_video_url?: string;
  cover_image_url?: string;
  tagline?: string;
  showcase_bio?: string;
}

const Creators = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const { data, error } = await supabase.rpc('get_creators_with_profiles');

      if (error) throw error;

      // Map RPC results directly to Creator interface
      const creators: Creator[] = (data || []).map((row: any) => ({
        id: row.creator_id,
        user_id: row.user_id,
        subscription_price: row.subscription_price,
        subscriber_count: row.subscriber_count,
        id_verified: row.id_verified,
        welcome_video_url: row.welcome_video_url,
        cover_image_url: row.cover_image_url,
        tagline: row.tagline,
        showcase_bio: row.showcase_bio,
        display_name: row.display_name || 'Creator',
        username: row.username,
        avatar_url: row.avatar_url,
        bio: row.bio,
        city: row.city,
        age: row.age,
        created_at: row.creator_created_at || row.profile_created_at,
      }));

      setCreators(creators);
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

  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Discover Creators</h1>
                <p className="text-muted-foreground">
                  Support amazing creators and get exclusive content
                </p>
              </div>
              <Button
                onClick={() => navigate('/creator-application')}
                size="lg"
                className="hidden md:flex"
              >
                Become a Creator
              </Button>
            </div>

            {creators.length === 0 ? (
              <div className="text-center py-12 max-w-6xl mx-auto">
                <p className="text-lg text-muted-foreground">No creators found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to join as a creator!
                </p>
                <Button
                  onClick={() => navigate('/creator-application')}
                  size="lg"
                  className="mt-6"
                >
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {creators.map((creator) => (
                  <CreatorShowcaseCard key={creator.id} creator={creator} />
                ))}
              </div>
            )}
          </div>
          <BottomNav />
        </div>
      )}
    </>
  );
};

export default Creators;
