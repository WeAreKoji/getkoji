import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, FileText, TrendingUp } from "lucide-react";
import { TrendIndicator } from "@/components/creator/TrendIndicator";
import { Skeleton } from "@/components/ui/skeleton";

interface CreatorStats {
  subscriberCount: number;
  totalEarnings: number;
  subscriptionPrice: number;
  postCount: number;
}

interface DashboardMetricsProps {
  stats: CreatorStats;
  previousStats: CreatorStats;
  isMobile: boolean;
  loading?: boolean;
}

export const DashboardMetrics = ({ stats, previousStats, isMobile, loading }: DashboardMetricsProps) => {
  const mrr = stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80;

  if (loading) {
    return (
      <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className={isMobile ? "pb-1 p-3" : "pb-2"}>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className={isMobile ? "p-3 pt-0" : ""}>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      icon: Users,
      label: "Subscribers",
      value: stats.subscriberCount,
      showTrend: true,
      previous: previousStats.subscriberCount,
    },
    {
      icon: DollarSign,
      label: "Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      showTrend: false,
    },
    {
      icon: TrendingUp,
      label: "Monthly Revenue",
      value: `$${mrr.toFixed(2)}`,
      showTrend: false,
      subtitle: "After fees",
    },
    {
      icon: FileText,
      label: "Posts",
      value: stats.postCount,
      showTrend: false,
    },
  ];

  return (
    <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"}>
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className={isMobile ? "pb-1 p-3" : "pb-2"}>
            <CardTitle className={isMobile ? "text-xs font-medium text-muted-foreground flex items-center gap-1.5" : "text-sm font-medium text-muted-foreground flex items-center gap-2"}>
              <metric.icon className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "p-3 pt-0" : ""}>
            <div className="flex items-center justify-between">
              <div>
                <div className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>
                  {metric.value}
                </div>
                {metric.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                )}
              </div>
              {metric.showTrend && metric.previous !== undefined && (
                <TrendIndicator 
                  current={typeof metric.value === 'number' ? metric.value : 0} 
                  previous={metric.previous} 
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
