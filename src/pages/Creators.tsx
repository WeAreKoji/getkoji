import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, Plus, MapPin, Calendar } from "lucide-react";
import { VerificationBadges } from "@/components/profile/VerificationBadges";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/navigation/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Creator {
  id: string;
  user_id: string;
  subscription_price: number;
  subscriber_count: number;
  id_verified: boolean;
  created_at: string;
  profile?: {
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    age: number | null;
    city: string | null;
    created_at: string;
  } | null;
}

const Creators = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(`
          *,
          profile:profiles!creator_profiles_user_id_fkey(
            display_name,
            avatar_url,
            bio
          )
        `)
        .order("subscriber_count", { ascending: false });

      if (error) throw error;

      const base = (data || []) as any[];

      // Enrich creators missing profile using secure function
      const enriched = await Promise.all(
        base.map(async (c) => {
          const creator: Creator = {
            id: c.id,
            user_id: c.user_id,
            subscription_price: c.subscription_price,
            subscriber_count: c.subscriber_count,
            id_verified: c.id_verified,
            created_at: c.created_at,
            profile: null
          };

          // Use existing profile data or fetch from get_safe_profile
          if (c.profile && c.profile.display_name) {
            creator.profile = {
              display_name: c.profile.display_name,
              avatar_url: c.profile.avatar_url || null,
              bio: c.profile.bio || null,
              age: null,
              city: null,
              created_at: c.created_at
            };
            return creator;
          }

          try {
            const { data: safe } = await supabase.rpc('get_safe_profile', { profile_id: c.user_id });
            const row = Array.isArray(safe) ? safe[0] : (safe as any)?.[0] || (safe as any);
            if (row) {
              creator.profile = {
                display_name: row.display_name || 'Creator',
                avatar_url: row.avatar_url || null,
                bio: row.bio || null,
                age: row.age || null,
                city: row.city || null,
                created_at: row.created_at || c.created_at,
              };
            } else {
              creator.profile = { 
                display_name: 'Creator', 
                avatar_url: null, 
                bio: null,
                age: null,
                city: null,
                created_at: c.created_at
              };
            }
          } catch {
            creator.profile = { 
              display_name: 'Creator', 
              avatar_url: null, 
              bio: null,
              age: null,
              city: null,
              created_at: c.created_at
            };
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

  if (loading) {
    return (
      <div className={isMobile ? "min-h-screen bg-background flex items-center justify-center pb-20" : "min-h-screen bg-background flex items-center justify-center"}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {isMobile && <BottomNav />}
      </div>
    );
  }

  return (
    <div className={isMobile ? "min-h-screen bg-background pb-20" : "min-h-screen bg-background"}>
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className={isMobile ? "max-w-lg mx-auto px-4 py-4" : "container max-w-4xl mx-auto px-6 py-4"}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={isMobile ? "text-2xl font-bold text-foreground" : "text-3xl font-bold text-foreground"}>Creators</h1>
              <p className={isMobile ? "text-sm text-muted-foreground" : "text-base text-muted-foreground"}>
                Discover exclusive content
              </p>
            </div>
            <Button onClick={() => navigate("/creator/apply")} size={isMobile ? "sm" : "default"}>
              <Plus className="w-4 h-4 mr-2" />
              Become a Creator
            </Button>
          </div>
        </div>
      </header>

      <main className={isMobile ? "max-w-7xl mx-auto px-4 py-6" : "container max-w-7xl mx-auto px-6 py-8"}>
        {creators.length === 0 ? (
          <Card className="w-full">
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No creators yet</p>
              <p className="text-sm text-muted-foreground mt-2">Be the first to become a creator!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {creators.map((creator) => (
              <Card
                key={creator.id}
                className="group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                onClick={() => navigate(`/creator/${creator.user_id}`)}
              >
                {/* Gradient header */}
                <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 relative">
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                    <Avatar className="w-16 h-16 border-4 border-background shadow-lg">
                      <AvatarImage src={creator.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-lg bg-gradient-to-br from-primary/30 to-primary/10">
                        {(creator.profile?.display_name?.charAt(0)) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <CardContent className="pt-12 pb-4 px-3 space-y-2">
                  {/* Name & verification */}
                  <div className="flex items-center justify-center gap-1">
                    <h3 className="font-semibold text-sm truncate text-center">
                      {creator.profile?.display_name || 'Creator'}
                    </h3>
                    <VerificationBadges 
                      userId={creator.user_id}
                      isCreator={true}
                      idVerified={creator.id_verified}
                      size="sm"
                    />
                  </div>

                  {/* Bio - only on larger screens */}
                  {creator.profile?.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 text-center hidden lg:block">
                      {creator.profile.bio}
                    </p>
                  )}

                  {/* Location - compact */}
                  {(creator.profile?.age || creator.profile?.city) && (
                    <p className="text-xs text-muted-foreground text-center truncate">
                      {creator.profile.age && `${creator.profile.age}`}
                      {creator.profile.age && creator.profile.city && " • "}
                      {creator.profile.city}
                    </p>
                  )}

                  {/* Stats & Price */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{creator.subscriber_count}</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-base text-primary">
                        ${creator.subscription_price}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
};

export default Creators;
