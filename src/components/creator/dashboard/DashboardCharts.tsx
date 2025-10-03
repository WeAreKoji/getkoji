import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { MobileEarningsChart } from "@/components/creator/MobileEarningsChart";
import { DesktopRevenueChart } from "./DesktopRevenueChart";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  date: string;
  subscribers: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  subscribers: number;
}

interface CreatorStats {
  subscriberCount: number;
  totalEarnings: number;
  subscriptionPrice: number;
  postCount: number;
}

interface DashboardChartsProps {
  chartData: ChartData[];
  revenueData: RevenueData[];
  stats: CreatorStats;
  isMobile: boolean;
  loading?: boolean;
}

export const DashboardCharts = ({ 
  chartData, 
  revenueData, 
  stats, 
  isMobile,
  loading 
}: DashboardChartsProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revenue Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Stripe Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">
              -${(stats.subscriptionPrice * stats.subscriberCount * 0.03).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">~3% of gross</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Platform Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">
              -${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.20).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">20% of net revenue</p>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Your Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">
              ${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">80% of net revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Revenue Chart */}
      {!isMobile && revenueData.length > 0 && (
        <DesktopRevenueChart data={revenueData} loading={loading} />
      )}

      {/* Revenue Distribution Pie Chart - Desktop Only */}
      {!isMobile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { 
                      name: "Your Earnings", 
                      value: parseFloat((stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80).toFixed(2)),
                      color: "hsl(var(--primary))"
                    },
                    { 
                      name: "Platform Fee", 
                      value: parseFloat((stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.20).toFixed(2)),
                      color: "hsl(var(--muted-foreground))"
                    },
                    { 
                      name: "Stripe Fees", 
                      value: parseFloat((stats.subscriptionPrice * stats.subscriberCount * 0.03).toFixed(2)),
                      color: "hsl(var(--destructive))"
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                >
                  {[0, 1, 2].map((index) => (
                    <Cell key={`cell-${index}`} fill={
                      index === 0 ? "hsl(var(--primary))" :
                      index === 1 ? "hsl(var(--muted-foreground))" :
                      "hsl(var(--destructive))"
                    } />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconSize={10}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Mobile-Optimized Performance Charts */}
      {isMobile && revenueData.length > 0 && (
        <MobileEarningsChart revenueData={revenueData} period="7d" />
      )}

      {/* Monthly Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Subscription Price</span>
            <span className="font-semibold">${stats.subscriptionPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">× Active Subscribers</span>
            <span className="font-semibold">× {stats.subscriberCount}</span>
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Gross Revenue (100%)</span>
              <span className="font-medium">${(stats.subscriptionPrice * stats.subscriberCount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Stripe Fees (~3%)</span>
              <span className="text-destructive font-medium">-${(stats.subscriptionPrice * stats.subscriberCount * 0.03).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Net After Stripe</span>
              <span className="font-medium">${(stats.subscriptionPrice * stats.subscriberCount * 0.97).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Platform Commission (20%)</span>
              <span className="text-destructive font-medium">-${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.20).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-primary border-t pt-2 mt-2">
              <span>Your Monthly Earnings (80%)</span>
              <span>${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriber Growth Chart - Desktop */}
      {chartData.length > 0 && !isMobile && (
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="subscribers"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubscribers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
