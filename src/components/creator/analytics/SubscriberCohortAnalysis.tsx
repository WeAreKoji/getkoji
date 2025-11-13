import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Users, DollarSign } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface CohortData {
  cohort_month: string;
  subscribers_count: number;
  month_1_retention: number;
  month_2_retention: number;
  month_3_retention: number;
  total_revenue: number;
  avg_revenue_per_subscriber: number;
}

interface SubscriberCohortAnalysisProps {
  creatorId: string;
}

export const SubscriberCohortAnalysis = ({ creatorId }: SubscriberCohortAnalysisProps) => {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCohortData();
  }, [creatorId]);

  const fetchCohortData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_subscriber_cohorts', {
        creator_user_id: creatorId
      });

      if (error) throw error;
      setCohorts(data || []);
    } catch (error) {
      console.error('Error fetching cohort data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRetentionColor = (retention: number) => {
    if (retention >= 80) return "text-green-600";
    if (retention >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (cohorts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriber Cohort Analysis</CardTitle>
          <CardDescription>No cohort data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Subscriber Cohort Analysis
        </CardTitle>
        <CardDescription>
          Track subscriber retention and revenue by signup month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohort Month</TableHead>
                <TableHead className="text-center">Subscribers</TableHead>
                <TableHead className="text-center">Month 1</TableHead>
                <TableHead className="text-center">Month 2</TableHead>
                <TableHead className="text-center">Month 3</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg/Sub</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohorts.map((cohort) => (
                <TableRow key={cohort.cohort_month}>
                  <TableCell className="font-medium">{cohort.cohort_month}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {cohort.subscribers_count}
                    </div>
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getRetentionColor(cohort.month_1_retention)}`}>
                    {cohort.month_1_retention.toFixed(1)}%
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getRetentionColor(cohort.month_2_retention)}`}>
                    {cohort.month_2_retention.toFixed(1)}%
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getRetentionColor(cohort.month_3_retention)}`}>
                    {cohort.month_3_retention.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${cohort.total_revenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {cohort.avg_revenue_per_subscriber.toFixed(2)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Retention (Month 1)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">
                  {(cohorts.reduce((sum, c) => sum + c.month_1_retention, 0) / cohorts.length).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Cohorts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{cohorts.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">
                  ${cohorts.reduce((sum, c) => sum + Number(c.total_revenue), 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
