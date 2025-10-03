import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, Plus } from "lucide-react";
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

      const base = (data || []) as Creator[];

      // Enrich creators missing profile using secure function
      const enriched = await Promise.all(
        base.map(async (c) => {
          if (c.profile && c.profile.display_name) return c;
          try {
            const { data: safe } = await supabase.rpc('get_safe_profile', { profile_id: c.user_id });
            const row = Array.isArray(safe) ? safe[0] : (safe as any)?.[0] || (safe as any);
            if (row) {
              c.profile = {
                display_name: row.display_name || 'Creator',
                avatar_url: row.avatar_url || null,
                bio: row.bio || null,
              };
            } else {
              c.profile = { display_name: 'Creator', avatar_url: null, bio: null };
            }
          } catch {
            c.profile = c.profile ?? { display_name: 'Creator', avatar_url: null, bio: null };
          }
          return c;
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

      <main className={isMobile ? "max-w-lg mx-auto px-4 py-6 space-y-4" : "container max-w-4xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {creators.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No creators yet</p>
            </CardContent>
          </Card>
        ) : (
          creators.map((creator) => (
            <Card
              key={creator.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/creator/${creator.user_id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className={isMobile ? "w-16 h-16" : "w-20 h-20"}>
                    <AvatarImage src={creator.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(creator.profile?.display_name?.charAt(0)) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className={isMobile ? "font-semibold text-lg text-foreground" : "font-semibold text-xl text-foreground"}>
                      {creator.profile?.display_name || 'Creator'}
                    </h3>
                    {creator.profile?.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {creator.profile.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{creator.subscriber_count} subscribers</span>
                      <span className="font-semibold text-primary">
                        ${creator.subscription_price}/month
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
};

export default Creators;
