import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Trophy, Target, TrendingUp } from "lucide-react";

export const UserProgress = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchUserProgress = async () => {
    const [pointsData, achievementsData] = await Promise.all([
      supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle(),
      supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user?.id),
    ]);

    if (pointsData.data) {
      setPoints(pointsData.data.total_points);
      setLevel(pointsData.data.level);
      setStreak(pointsData.data.streak_days);
    }

    if (achievementsData.data) {
      setAchievementsCount(achievementsData.data.length);
    }
  };

  const pointsToNextLevel = level * 1000;
  const progressToNextLevel = (points % 1000) / 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level {level}</span>
            <span className="text-sm text-muted-foreground">
              {points} / {pointsToNextLevel} XP
            </span>
          </div>
          <Progress value={progressToNextLevel} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{achievementsCount}</p>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{points}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
