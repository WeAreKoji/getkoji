import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, User } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageTransition } from "@/components/transitions/PageTransition";
import { SafeAreaView } from "@/components/layout/SafeAreaView";

interface SavedProfile {
  id: string;
  notes: string | null;
  created_at: string;
  saved_profile: {
    id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    age: number;
    city: string | null;
  };
}

export default function SavedProfiles() {
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedProfiles();
  }, []);

  const fetchSavedProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("saved_profiles")
        .select(`
          id,
          notes,
          created_at,
          saved_profile:profiles!saved_profiles_saved_profile_id_fkey (
            id,
            display_name,
            username,
            avatar_url,
            bio,
            age,
            city
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching saved profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load saved profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (savedId: string) => {
    try {
      const { error } = await supabase
        .from("saved_profiles")
        .delete()
        .eq("id", savedId);

      if (error) throw error;

      setSavedProfiles(prev => prev.filter(p => p.id !== savedId));
      toast({
        title: "Removed",
        description: "Profile removed from saved",
      });
    } catch (error: any) {
      console.error("Error removing saved profile:", error);
      toast({
        title: "Error",
        description: "Failed to remove profile",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (profile: SavedProfile) => {
    const identifier = profile.saved_profile.username || profile.saved_profile.id;
    navigate(`/profile/${identifier}`);
  };

  if (loading) {
    return (
      <SafeAreaView>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </SafeAreaView>
    );
  }

  return (
    <PageTransition>
      <SafeAreaView>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Bookmark className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Saved Profiles</h1>
          </div>

          {savedProfiles.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved profiles"
              description="Profiles you save will appear here"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedProfiles.map((saved) => (
                <Card key={saved.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                        onClick={() => handleViewProfile(saved)}
                      >
                        {saved.saved_profile.avatar_url ? (
                          <img
                            src={saved.saved_profile.avatar_url}
                            alt={saved.saved_profile.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
                          onClick={() => handleViewProfile(saved)}
                        >
                          {saved.saved_profile.display_name}
                        </h3>
                        {saved.saved_profile.username && (
                          <p className="text-sm text-muted-foreground">@{saved.saved_profile.username}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {saved.saved_profile.age} • {saved.saved_profile.city || "Location not set"}
                        </p>
                        {saved.saved_profile.bio && (
                          <p className="text-sm mt-2 line-clamp-2">{saved.saved_profile.bio}</p>
                        )}
                        {saved.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            Note: {saved.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnsave(saved.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SafeAreaView>
    </PageTransition>
  );
}
