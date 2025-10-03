import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import MatchCard from "@/components/matches/MatchCard";
import BottomNav from "@/components/navigation/BottomNav";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { logError } from "@/lib/error-logger";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface MatchData {
  match_id: string;
  matched_at: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_bio: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
}

const Matches = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to matches changes
    const matchesChannel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${currentUserId},user2_id=eq.${currentUserId}`,
        },
        () => {
          fetchMatches(currentUserId, false);
        }
      )
      .subscribe();

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchMatches(currentUserId, false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Update unread count when messages are marked as read
          if (payload.new.read_at) {
            fetchMatches(currentUserId, false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);
    fetchMatches(user.id);
  };

  const fetchMatches = async (userId: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const { data, error } = await supabase.rpc('get_matches_with_details', {
        p_user_id: userId
      });

      if (error) throw error;

      setMatches(data || []);
    } catch (error) {
      logError(error, 'Matches.fetchMatches');
      toast({
        title: "Error loading matches",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnmatch = async (matchId: string, otherUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          deleted_by_user1: currentUserId < otherUserId ? true : undefined,
          deleted_by_user2: currentUserId > otherUserId ? true : undefined,
        })
        .eq('id', matchId);

      if (error) throw error;

      // Optimistically remove from UI
      setMatches(prev => prev.filter(m => m.match_id !== matchId));

      toast({
        title: "Unmatched successfully",
        description: "This match has been removed",
      });
    } catch (error) {
      logError(error, 'Matches.handleUnmatch');
      toast({
        title: "Error unmatching",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    if (currentUserId && !refreshing) {
      fetchMatches(currentUserId, true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView bottom={isMobile}>
        <div className={isMobile ? "min-h-screen bg-background pb-20" : "min-h-screen bg-background"}>
          <div className={isMobile ? "px-4 py-4" : "container max-w-4xl mx-auto px-6 py-8"}>
            <h1 className={isMobile ? "text-2xl font-bold mb-4" : "text-3xl font-bold mb-6"}>Matches</h1>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {isMobile && <BottomNav />}
        </div>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView bottom={isMobile}>
      <div className={isMobile ? "min-h-screen bg-background pb-20" : "min-h-screen bg-background"}>
        <div className={isMobile ? "px-4 py-4" : "container max-w-4xl mx-auto px-6 py-8"}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={isMobile ? "text-2xl font-bold" : "text-3xl font-bold"}>Matches</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh matches"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {matches.length === 0 ? (
            <div className={isMobile ? "text-center py-8" : "text-center py-12"}>
              <p className={isMobile ? "text-muted-foreground mb-2 text-sm" : "text-muted-foreground mb-4"}>No matches yet</p>
              <p className="text-sm text-muted-foreground">
                Keep swiping to find your matches!
              </p>
            </div>
          ) : (
            <div className={isMobile ? "space-y-2" : "space-y-3"}>
              {matches.map((match) => (
                <MatchCard
                  key={match.match_id}
                  matchId={match.match_id}
                  profile={{
                    id: match.other_user_id,
                    display_name: match.other_user_name,
                    avatar_url: match.other_user_avatar,
                    bio: match.other_user_bio,
                  }}
                  lastMessage={match.last_message_content ? {
                    content: match.last_message_content,
                    created_at: match.last_message_created_at!,
                    sender_id: match.last_message_sender_id!,
                  } : undefined}
                  unreadCount={match.unread_count}
                  currentUserId={currentUserId!}
                  onUnmatch={() => handleUnmatch(match.match_id, match.other_user_id)}
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
