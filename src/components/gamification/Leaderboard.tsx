import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: number;
  streak_days: number;
  profile: {
    display_name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("user_points")
      .select(`
        user_id,
        total_points,
        level,
        streak_days,
        profile:profiles!inner(display_name, avatar_url, username)
      `)
      .order("total_points", { ascending: false })
      .limit(10);

    if (!error && data) {
      setLeaderboard(data as any);
    }
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-shrink-0 w-8">
                {getRankIcon(index)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.profile.avatar_url || ""} />
                <AvatarFallback>
                  {entry.profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.profile.display_name}</p>
                {entry.profile.username && (
                  <p className="text-sm text-muted-foreground">@{entry.profile.username}</p>
                )}
              </div>
              <div className="text-right">
                <Badge variant="secondary">Level {entry.level}</Badge>
                <p className="text-sm font-semibold mt-1">{entry.total_points} pts</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
