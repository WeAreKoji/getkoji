import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import MatchCard from "@/components/matches/MatchCard";
import BottomNav from "@/components/navigation/BottomNav";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SafeAreaView } from "@/components/layout/SafeAreaView";

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface LastMessage {
  content: string;
  created_at: string;
}

interface MatchWithProfile {
  match: Match;
  profile: Profile;
  lastMessage?: LastMessage;
}

const Matches = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);
    fetchMatches(user.id);
  };

  const fetchMatches = async (userId: string) => {
    try {
      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("matched_at", { ascending: false });

      if (matchesError) throw matchesError;

      // Fetch profiles and last messages for each match
      const matchesWithProfiles = await Promise.all(
        (matchesData || []).map(async (match) => {
          const otherUserId =
            match.user1_id === userId ? match.user2_id : match.user1_id;

          // Fetch other user's profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, bio")
            .eq("id", otherUserId)
            .single();

          // Fetch last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("match_id", match.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            match,
            profile: profile!,
            lastMessage: lastMessage || undefined,
          };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SafeAreaView bottom={isMobile}>
      <div className={isMobile ? "min-h-screen bg-background pb-20" : "min-h-screen bg-background"}>
        <div className={isMobile ? "px-4 py-4" : "container max-w-4xl mx-auto px-6 py-8"}>
          <h1 className={isMobile ? "text-2xl font-bold mb-4" : "text-3xl font-bold mb-6"}>Matches</h1>

          {matches.length === 0 ? (
            <div className={isMobile ? "text-center py-8" : "text-center py-12"}>
              <p className={isMobile ? "text-muted-foreground mb-2 text-sm" : "text-muted-foreground mb-4"}>No matches yet</p>
              <p className="text-sm text-muted-foreground">
                Keep swiping to find your matches!
              </p>
            </div>
          ) : (
            <div className={isMobile ? "space-y-2" : "space-y-3"}>
              {matches.map(({ match, profile, lastMessage }) => (
                <MatchCard
                  key={match.id}
                  matchId={match.id}
                  profile={profile}
                  lastMessage={lastMessage}
                />
              ))}
            </div>
          )}
        </div>

        {isMobile && <BottomNav />}
      </div>
    </SafeAreaView>
  );
};

export default Matches;
