import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Heart, MessageCircle, DollarSign, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    totalMessages: 0,
    totalRevenue: 0,
    activeUsers: 0,
    newUsersToday: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const [usersData, matchesData, messagesData, revenueData] = await Promise.all([
      supabase.from("profiles").select("id, created_at", { count: "exact" }),
      supabase.from("matches").select("id", { count: "exact" }),
      supabase.from("messages").select("id", { count: "exact" }),
      supabase.from("payment_transactions").select("amount").eq("status", "succeeded"),
    ]);

    const totalRevenue = revenueData.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const newUsersToday = usersData.data?.filter(
      u => new Date(u.created_at) >= todayStart
    ).length || 0;

    setStats({
      totalUsers: usersData.count || 0,
      totalMatches: matchesData.count || 0,
      totalMessages: messagesData.count || 0,
      totalRevenue: totalRevenue,
      activeUsers: 0, // Would need last_active tracking
      newUsersToday,
    });

    // Generate mock chart data (replace with real data in production)
    const mockData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      users: Math.floor(Math.random() * 100) + 50,
      matches: Math.floor(Math.random() * 50) + 20,
    }));
    setChartData(mockData);
  };

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Total Matches", value: stats.totalMatches, icon: Heart, color: "text-pink-500" },
    { title: "Messages", value: stats.totalMessages, icon: MessageCircle, color: "text-green-500" },
    { title: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-yellow-500" },
    { title: "New Users Today", value: stats.newUsersToday, icon: TrendingUp, color: "text-purple-500" },
    { title: "Active Users", value: stats.activeUsers, icon: Activity, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matches Per Day</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="matches" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
