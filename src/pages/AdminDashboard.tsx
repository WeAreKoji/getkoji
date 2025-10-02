import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, UserCheck, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalUsers: number;
  totalCreators: number;
  activeSubscriptions: number;
  pendingVerifications: number;
  pendingModeration: number;
  failedTransfers: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }

    fetchDashboardStats();
  }, [user, isAdmin, navigate]);

  const fetchDashboardStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: totalCreators },
        { count: activeSubscriptions },
        { data: verificationStats },
        { data: moderationStats },
        { count: failedTransfers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.rpc('get_verification_stats'),
        supabase.rpc('get_moderation_stats'),
        supabase.from('failed_transfers').select('*', { count: 'exact', head: true }).is('resolved_at', null)
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        totalCreators: totalCreators || 0,
        activeSubscriptions: activeSubscriptions || 0,
        pendingVerifications: verificationStats?.[0]?.pending_verifications || 0,
        pendingModeration: moderationStats?.[0]?.pending_posts || 0,
        failedTransfers: failedTransfers || 0,
        monthlyRevenue: 0, // TODO: Calculate from actual revenue data
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered users",
      color: "text-blue-500"
    },
    {
      title: "Total Creators",
      value: stats.totalCreators,
      icon: UserCheck,
      description: "Verified creators",
      color: "text-green-500"
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: TrendingUp,
      description: "Currently active",
      color: "text-purple-500"
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "This month",
      color: "text-yellow-500"
    }
  ];

  const alertCards = [
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      action: () => navigate('/admin/verifications'),
      actionLabel: "Review",
      show: stats.pendingVerifications > 0
    },
    {
      title: "Pending Moderation",
      value: stats.pendingModeration,
      action: () => navigate('/admin/content-moderation'),
      actionLabel: "Moderate",
      show: stats.pendingModeration > 0
    },
    {
      title: "Failed Transfers",
      value: stats.failedTransfers,
      action: () => navigate('/creator/dashboard'),
      actionLabel: "View",
      show: stats.failedTransfers > 0
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform metrics and pending actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Required Alerts */}
      {alertCards.some(card => card.show) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Action Required
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {alertCards.filter(card => card.show).map((alert) => (
              <Alert key={alert.title}>
                <FileText className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-2xl font-bold">{alert.value}</p>
                  </div>
                  <Button
                    onClick={alert.action}
                    variant="outline"
                    size="sm"
                  >
                    {alert.actionLabel}
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/admin/verifications')}>
            Review Verifications
          </Button>
          <Button onClick={() => navigate('/admin/content-moderation')} variant="outline">
            Moderate Content
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
