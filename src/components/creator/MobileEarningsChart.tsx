import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { format, subDays } from "date-fns";

interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

interface MobileEarningsChartProps {
  revenueData: Array<{ date: string; revenue: number; subscribers: number }>;
  period?: "7d" | "30d";
}

export const MobileEarningsChart = ({ revenueData, period = "7d" }: MobileEarningsChartProps) => {
  const days = period === "7d" ? 7 : 30;
  
  // Generate last N days data
  const generateChartData = (dataKey: "revenue" | "subscribers"): ChartDataPoint[] => {
    const now = new Date();
    const data: ChartDataPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const existingData = revenueData.find(d => d.date === dateStr);
      
      data.push({
        date: dateStr,
        value: existingData ? existingData[dataKey] : 0,
        label: format(date, "MMM dd"),
      });
    }
    
    return data;
  };

  const earningsData = generateChartData("revenue");
  const subscribersData = generateChartData("subscribers");

  const totalEarnings = earningsData.reduce((sum, d) => sum + d.value, 0);
  const totalNewSubs = subscribersData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-2 shadow-lg">
          <p className="text-xs font-medium">{payload[0].payload.label}</p>
          <p className="text-sm font-semibold text-primary">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart className="w-4 h-4" />
          Performance ({period === "7d" ? "7 Days" : "30 Days"})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="earnings" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Subscribers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            
            <div className="w-full overflow-x-auto -mx-2 px-2">
              <div style={{ minWidth: "300px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={earningsData}>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">New Subscribers</p>
                <p className="text-2xl font-bold">{totalNewSubs}</p>
              </div>
              <Users className="w-5 h-5 text-primary" />
            </div>
            
            <div className="w-full overflow-x-auto -mx-2 px-2">
              <div style={{ minWidth: "300px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={subscribersData}>
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      width={40}
                    />
                    <Tooltip 
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border rounded-lg p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.label}</p>
                              <p className="text-sm font-semibold text-primary">
                                {payload[0].value} new
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Missing import
import { BarChart } from "lucide-react";
