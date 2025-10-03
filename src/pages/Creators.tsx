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
      const { data: creatorsData, error } = await supabase
        .from('creator_profiles')
        .select(`
          id,
          user_id,
          subscription_price,
          subscriber_count,
          id_verified,
          welcome_video_url,
          cover_image_url,
          tagline,
          showcase_bio
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const base = (creatorsData || []) as any[];

      // Enrich creators with profile data
      const enriched = await Promise.all(
        base.map(async (c) => {
          const creator: Creator = {
            id: c.id,
            user_id: c.user_id,
            subscription_price: c.subscription_price,
            subscriber_count: c.subscriber_count,
            id_verified: c.id_verified,
            created_at: c.created_at,
            welcome_video_url: c.welcome_video_url,
            cover_image_url: c.cover_image_url,
            tagline: c.tagline,
            showcase_bio: c.showcase_bio,
            display_name: 'Creator',
            username: undefined,
            avatar_url: undefined,
            bio: undefined,
            city: undefined,
            age: undefined,
          };

          try {
            const { data: safe } = await supabase.rpc('get_safe_profile', { profile_id: c.user_id });
            const row = Array.isArray(safe) ? safe[0] : (safe as any)?.[0] || (safe as any);
            
            if (row) {
              creator.display_name = row.display_name || 'Creator';
              creator.username = row.username;
              creator.avatar_url = row.avatar_url;
              creator.bio = row.bio;
              creator.city = row.city;
              creator.age = row.age;
              creator.created_at = row.created_at || c.created_at;
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }

          return creator;
        })
      );

      setCreators(enriched);
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
