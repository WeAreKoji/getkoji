import { useState, useEffect } from "react";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AchievementCard } from "@/components/gamification/AchievementCard";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { RewardsShop } from "@/components/gamification/RewardsShop";
import { UserProgress } from "@/components/gamification/UserProgress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
  progress: number;
}

const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    const [achievementsData, userAchievementsData] = await Promise.all([
      supabase.from("achievements").select("*").eq("is_active", true),
      supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user?.id),
    ]);

    if (achievementsData.data) {
      setAchievements(achievementsData.data);
    }

    if (userAchievementsData.data) {
      setUserAchievements(userAchievementsData.data);
    }

    setLoading(false);
  };

  const enrichedAchievements = achievements.map((achievement) => {
    const userAchievement = userAchievements.find(
      (ua) => ua.achievement_id === achievement.id
    );
    return {
      ...achievement,
      earned: !!userAchievement,
      progress: userAchievement?.progress || 0,
    };
  });

  const earnedAchievements = enrichedAchievements.filter((a) => a.earned);
  const lockedAchievements = enrichedAchievements.filter((a) => !a.earned);

  return (
    <SafeAreaView className="pb-20">
      <div className="container max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Achievements & Rewards</h1>
        </div>

        <UserProgress />

        <Tabs defaultValue="achievements" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-4">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {earnedAchievements.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Earned ({earnedAchievements.length})</h2>
                    <div className="grid gap-3">
                      {earnedAchievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </div>
                )}

                {lockedAchievements.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Locked ({lockedAchievements.length})</h2>
                    <div className="grid gap-3">
                      {lockedAchievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardsShop />
          </TabsContent>
        </Tabs>
      </div>
    </SafeAreaView>
  );
};

export default Achievements;
