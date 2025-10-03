import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Heart,
  MessageCircle,
  Eye,
  Users,
  Calendar,
  Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityStats {
  profileViews: number;
  matches: number;
  messagesSent: number;
  profileLikes: number;
  daysActive: number;
  completionScore: number;
}

export const ActivityInsights = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<ActivityStats>({
    profileViews: 0,
    matches: 0,
    messagesSent: 0,
    profileLikes: 0,
    daysActive: 0,
    completionScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Profile views (last 30 days)
      const { count: viewCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", userId)
        .gte("viewed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Matches
      const { count: matchCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      // Messages sent
      const { count: messageCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", userId);

      // Profile likes
      const { count: likeCount } = await supabase
        .from("profile_likes")
        .select("*", { count: "exact", head: true })
        .eq("liked_id", userId);

      // Days active (account age)
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", userId)
        .single();

      const daysActive = profile
        ? Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      // Profile completion score
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, profile_photos(id), user_interests(id)")
        .eq("id", userId)
        .single();

      let completionScore = 0;
      if (profileData) {
        if (profileData.display_name) completionScore += 15;
        if (profileData.bio) completionScore += 20;
        if (profileData.avatar_url) completionScore += 15;
        if (profileData.city) completionScore += 10;
        if (profileData.profile_photos?.length > 0) completionScore += 25;
        if (profileData.user_interests?.length >= 3) completionScore += 15;
      }

      setStats({
        profileViews: viewCount || 0,
        matches: matchCount || 0,
        messagesSent: messageCount || 0,
        profileLikes: likeCount || 0,
        daysActive,
        completionScore,
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionLabel = (score: number) => {
    if (score >= 90) return { text: "Excellent", color: "bg-green-500" };
    if (score >= 70) return { text: "Good", color: "bg-blue-500" };
    if (score >= 50) return { text: "Fair", color: "bg-yellow-500" };
    return { text: "Incomplete", color: "bg-red-500" };
  };

  const completion = getCompletionLabel(stats.completionScore);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading stats...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Activity Insights
        </CardTitle>
        <CardDescription>
          Your activity and profile performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Profile Completion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Profile Completion</span>
                </div>
                <Badge className={completion.color}>{completion.text}</Badge>
              </div>
              <Progress value={stats.completionScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.completionScore}% complete
              </p>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.daysActive}</p>
                  <p className="text-xs text-muted-foreground">Days Active</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.matches}</p>
                  <p className="text-xs text-muted-foreground">Matches</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Profile Views</span>
                </div>
                <span className="text-lg font-bold">{stats.profileViews}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Likes Received</span>
                </div>
                <span className="text-lg font-bold">{stats.profileLikes}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Messages Sent</span>
                </div>
                <span className="text-lg font-bold">{stats.messagesSent}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Stats from the last 30 days
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
