import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, MapPin, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { logError } from "@/lib/error-logger";

interface DemographicData {
  ageDistribution: { range: string; count: number }[];
  locationDistribution: { city: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  totalSubscribers: number;
  avgAge: number;
}

interface SubscriberDemographicsProps {
  creatorId: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
];

export const SubscriberDemographics = ({ creatorId }: SubscriberDemographicsProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DemographicData | null>(null);

  useEffect(() => {
    fetchDemographics();
  }, [creatorId]);

  const fetchDemographics = async () => {
    try {
      // Fetch active subscribers with their profile data
      const { data: subscribers, error } = await supabase
        .from("subscriptions")
        .select(`
          subscriber_id,
          profiles!subscriptions_subscriber_id_fkey (
            age,
            city,
            gender
          )
        `)
        .eq("creator_id", creatorId)
        .eq("status", "active");

      if (error) throw error;

      const subscriberProfiles = subscribers
        ?.map(sub => (Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles))
        .filter(Boolean) || [];

      // Calculate age distribution
      const ageRanges = {
        "18-24": 0,
        "25-34": 0,
        "35-44": 0,
        "45-54": 0,
        "55+": 0,
      };

      let totalAge = 0;
      let ageCount = 0;

      subscriberProfiles.forEach((profile: any) => {
        if (profile.age) {
          totalAge += profile.age;
          ageCount++;
          
          if (profile.age >= 18 && profile.age <= 24) ageRanges["18-24"]++;
          else if (profile.age >= 25 && profile.age <= 34) ageRanges["25-34"]++;
          else if (profile.age >= 35 && profile.age <= 44) ageRanges["35-44"]++;
          else if (profile.age >= 45 && profile.age <= 54) ageRanges["45-54"]++;
          else if (profile.age >= 55) ageRanges["55+"]++;
        }
      });

      const ageDistribution = Object.entries(ageRanges)
        .map(([range, count]) => ({ range, count }))
        .filter(item => item.count > 0);

      // Calculate location distribution (top 5 cities)
      const locationMap = new Map<string, number>();
      subscriberProfiles.forEach((profile: any) => {
        if (profile.city) {
          locationMap.set(profile.city, (locationMap.get(profile.city) || 0) + 1);
        }
      });

      const locationDistribution = Array.from(locationMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate gender distribution
      const genderMap = new Map<string, number>();
      subscriberProfiles.forEach((profile: any) => {
        if (profile.gender) {
          const gender = profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1);
          genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
        }
      });

      const genderDistribution = Array.from(genderMap.entries())
        .map(([gender, count]) => ({ gender, count }));

      setData({
        ageDistribution,
        locationDistribution,
        genderDistribution,
        totalSubscribers: subscriberProfiles.length,
        avgAge: ageCount > 0 ? Math.round(totalAge / ageCount) : 0,
      });
    } catch (error) {
      logError(error, "SubscriberDemographics.fetchDemographics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalSubscribers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Subscriber Demographics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No demographic data available yet. Data will appear as subscribers join.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSubscribers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Average Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgAge} years</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Top Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.locationDistribution[0]?.city || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age Distribution */}
        {data.ageDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gender Distribution */}
        {data.genderDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ gender, percent }) => `${gender} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {data.genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
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

        {/* Location Distribution */}
        {data.locationDistribution.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Top Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.locationDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="city" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
