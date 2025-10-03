import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { logError } from "@/lib/error-logger";

interface MutualConnection {
  id: string;
  display_name: string;
  avatar_url: string | null;
  username: string | null;
}

interface MutualConnectionsProps {
  userId: string;
  currentUserId: string;
}

export const MutualConnections = ({ userId, currentUserId }: MutualConnectionsProps) => {
  const [connections, setConnections] = useState<MutualConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMutualConnections();
  }, [userId, currentUserId]);

  const fetchMutualConnections = async () => {
    try {
      setLoading(true);

      // Get user's matches
      const { data: userMatches } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      // Get current user's matches
      const { data: currentUserMatches } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

      if (!userMatches || !currentUserMatches) {
        setConnections([]);
        return;
      }

      // Extract connected user IDs
      const userConnections = userMatches.map(m => 
        m.user1_id === userId ? m.user2_id : m.user1_id
      );

      const currentUserConnections = currentUserMatches.map(m => 
        m.user1_id === currentUserId ? m.user2_id : m.user1_id
      );

      // Find mutual connections (excluding the viewed user and current user)
      const mutualIds = userConnections
        .filter(id => currentUserConnections.includes(id))
        .filter(id => id !== userId && id !== currentUserId)
        .slice(0, 5); // Limit to 5 mutual connections

      if (mutualIds.length === 0) {
        setConnections([]);
        return;
      }

      // Fetch profiles of mutual connections
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", mutualIds);

      if (error) throw error;
      setConnections(profiles || []);
    } catch (error) {
      logError(error, "MutualConnections.fetchMutualConnections");
    } finally {
      setLoading(false);
    }
  };

  if (loading || connections.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">
          {connections.length} Mutual Connection{connections.length !== 1 ? 's' : ''}
        </h3>
      </div>
      <div className="flex gap-2">
        {connections.map((connection) => (
          <Avatar key={connection.id} className="w-10 h-10 border-2 border-background">
            <AvatarImage src={connection.avatar_url || undefined} />
            <AvatarFallback>
              {connection.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </Card>
  );
};
