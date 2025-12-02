import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TrendingUp, Eye, Heart, Users } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { logError } from "@/lib/error-logger";
import { useIsMobile } from "@/hooks/use-mobile";

interface EnhancedAnalyticsChartsProps {
  userId: string;
}

interface ViewsData {
  date: string;
  views: number;
}

interface EngagementData {
  name: string;
  value: number;
  color: string;
}

export const EnhancedAnalyticsCharts = ({ userId }: EnhancedAnalyticsChartsProps) => {
  const [loading, setLoading] = useState(true);
  const [viewsData, setViewsData] = useState<ViewsData[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchAnalyticsData();
  }, [userId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch last 30 days of profile views
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: views } = await supabase
        .from("profile_views")
        .select("viewed_at")
        .eq("profile_id", userId)
        .gte("viewed_at", thirtyDaysAgo.toISOString());

      // Group views by day
      const viewsByDay = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), "MMM dd");
        viewsByDay.set(date, 0);
      }

      views?.forEach((view) => {
        const date = format(new Date(view.viewed_at), "MMM dd");
        viewsByDay.set(date, (viewsByDay.get(date) || 0) + 1);
      });

      const viewsArray = Array.from(viewsByDay.entries())
        .map(([date, views]) => ({ date, views }))
        .reverse();

      setViewsData(viewsArray);

      // Fetch engagement metrics
      const [likesResult, matchesResult, messagesResult] = await Promise.all([
        supabase
          .from("profile_likes")
          .select("id", { count: "exact", head: true })
          .eq("liked_id", userId),
        supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_id", userId),
      ]);

      setEngagementData([
        {
          name: "Profile Likes",
          value: likesResult.count || 0,
          color: "hsl(var(--primary))",
        },
        {
          name: "Matches",
          value: matchesResult.count || 0,
          color: "hsl(var(--accent))",
        },
        {
          name: "Messages Sent",
          value: messagesResult.count || 0,
          color: "hsl(var(--secondary))",
        },
      ]);
    } catch (error) {
      logError(error, "EnhancedAnalyticsCharts.fetchAnalyticsData");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 md:p-6">
        <LoadingSpinner />
      </Card>
    );
  }

  const chartHeight = isMobile ? 200 : 320;

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-base md:text-lg">Analytics Dashboard</h3>
      </div>

      <Tabs defaultValue="views" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="views" className="text-xs md:text-sm">
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Profile Views
          </TabsTrigger>
          <TabsTrigger value="engagement" className="text-xs md:text-sm">
            <Heart className="w-3.5 h-3.5 mr-1.5" />
            Engagement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="space-y-3">
          <div style={{ height: chartHeight }} className="mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 12 }}
                  interval={isMobile ? 5 : 2}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 25 : 40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: isMobile ? 12 : 14,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: isMobile ? 2 : 4 }}
                  activeDot={{ r: isMobile ? 4 : 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Profile views over the last 30 days
          </p>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-3">
          <div className={isMobile ? "space-y-4" : "grid md:grid-cols-2 gap-6"} style={{ marginTop: 12 }}>
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={isMobile ? undefined : ({ name, value }) => `${name}: ${value}`}
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  {isMobile && <Legend />}
                </PieChart>
              </ResponsiveContainer>
            </div>
            {!isMobile && (
              <div style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Your engagement metrics
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
