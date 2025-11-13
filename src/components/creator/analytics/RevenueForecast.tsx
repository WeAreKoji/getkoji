import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Users, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

interface ForecastData {
  forecast_month: string;
  forecasted_revenue: number;
  confidence_level: string;
  current_mrr: number;
  projected_subscribers: number;
  estimated_churn_rate: number;
}

interface RevenueForecastProps {
  creatorId: string;
}

export const RevenueForecast = ({ creatorId }: RevenueForecastProps) => {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, [creatorId]);

  const fetchForecast = async () => {
    try {
      const { data, error } = await supabase.rpc('get_revenue_forecast', {
        creator_user_id: creatorId,
        months_ahead: 6
      });

      if (error) throw error;
      setForecast(data || []);
    } catch (error) {
      console.error('Error fetching revenue forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      high: "default",
      medium: "secondary",
      low: "outline"
    };
    return <Badge variant={variants[level] || "outline"}>{level} confidence</Badge>;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (forecast.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
          <CardDescription>Not enough data to generate forecast</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentMrr = forecast[0]?.current_mrr || 0;
  const avgChurn = forecast[0]?.estimated_churn_rate || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Revenue Forecast
        </CardTitle>
        <CardDescription>
          Projected revenue based on current trends and historical data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current MRR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">
                  ${currentMrr.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Estimated Churn Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-2xl font-bold">
                  {avgChurn.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>6-Month Projection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">
                  ${forecast[forecast.length - 1]?.forecasted_revenue.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="forecast_month" 
                className="text-sm"
              />
              <YAxis 
                className="text-sm"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))' 
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="forecasted_revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Forecasted Revenue"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="font-semibold">Month-by-Month Breakdown</h4>
          <div className="grid gap-3">
            {forecast.map((month) => (
              <div key={month.forecast_month} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{month.forecast_month}</div>
                  {getConfidenceBadge(month.confidence_level)}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${month.forecasted_revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{month.projected_subscribers} subs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
