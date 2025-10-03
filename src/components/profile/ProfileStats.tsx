import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, FileText, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { logError } from "@/lib/error-logger";

interface ProfileStatsProps {
  userId: string;
  isCreator: boolean;
}

interface Stats {
  subscribers?: number;
  posts?: number;
  earnings?: number;
}

export const ProfileStats = ({ userId, isCreator }: ProfileStatsProps) => {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      if (isCreator) {
        // Fetch creator stats
        const [subsResult, postsResult] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", userId)
            .eq("status", "active"),
          supabase
            .from("creator_posts")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", userId),
        ]);

        // Get actual earnings from creator profile
        const { data: profileData } = await supabase
          .from("creator_profiles")
          .select("total_earnings")
          .eq("user_id", userId)
          .single();

        setStats({
          subscribers: subsResult.count || 0,
          posts: postsResult.count || 0,
          earnings: profileData?.total_earnings || 0,
        });
      }
    } catch (error) {
      logError(error, 'ProfileStats.fetchStats');
    } finally {
      setLoading(false);
    }
  };

  if (!isCreator) return null;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const statItems = [
    { icon: Users, label: "Subscribers", value: stats.subscribers || 0, color: "text-primary" },
    { icon: FileText, label: "Posts", value: stats.posts || 0, color: "text-secondary" },
    { icon: DollarSign, label: "Earnings", value: `$${stats.earnings || 0}`, color: "text-accent" },
  ];

  return (
    <Card className={isMobile ? "p-3 shadow-sm" : "p-4 shadow-sm"}>
      <div className={isMobile ? "grid grid-cols-3 gap-2" : "grid grid-cols-3 gap-4"}>
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <item.icon className={isMobile ? `w-4 h-4 mx-auto mb-1 ${item.color}` : `w-5 h-5 mx-auto mb-1 ${item.color}`} />
            <div className={isMobile ? "text-lg font-bold text-foreground" : "text-2xl font-bold text-foreground"}>{item.value}</div>
            <div className={isMobile ? "text-[10px] text-muted-foreground" : "text-xs text-muted-foreground"}>{item.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};
