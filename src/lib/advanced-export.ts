import { supabase } from "@/integrations/supabase/client";
import { generateCSV, ExportColumn } from "./export-utils";

export interface AdvancedExportOptions {
  includeRelated?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

export const exportUserActivity = async (
  userId: string,
  options: AdvancedExportOptions = {}
) => {
  const { data: activities } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!activities) return;

  const columns: ExportColumn<any>[] = [
    { header: "Date", accessor: "created_at", format: (val) => new Date(val).toLocaleString() },
    { header: "Activity Type", accessor: "activity_type" },
    { header: "Points Earned", accessor: "points_earned" },
  ];

  generateCSV(activities, columns, `user-activity-${userId}.csv`);
};

export const exportAdminReport = async (reportType: string) => {
  let data: any[] = [];
  let columns: ExportColumn<any>[] = [];

  switch (reportType) {
    case "users":
      const { data: users } = await supabase
        .from("profiles")
        .select("id, display_name, email, created_at, last_active")
        .order("created_at", { ascending: false });
      
      data = users || [];
      columns = [
        { header: "ID", accessor: "id" },
        { header: "Name", accessor: "display_name" },
        { header: "Email", accessor: "email" },
        { header: "Joined", accessor: "created_at", format: (val) => new Date(val).toLocaleDateString() },
        { header: "Last Active", accessor: "last_active", format: (val) => val ? new Date(val).toLocaleDateString() : "Never" },
      ];
      break;

    case "revenue":
      const { data: transactions } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("status", "succeeded")
        .order("created_at", { ascending: false });
      
      data = transactions || [];
      columns = [
        { header: "Date", accessor: "created_at", format: (val) => new Date(val).toLocaleDateString() },
        { header: "Type", accessor: "transaction_type" },
        { header: "Amount", accessor: "amount", format: (val) => `$${Number(val).toFixed(2)}` },
        { header: "Currency", accessor: "currency" },
      ];
      break;

    case "engagement":
      const { data: matches } = await supabase
        .from("matches")
        .select("id, matched_at")
        .order("matched_at", { ascending: false });
      
      data = matches || [];
      columns = [
        { header: "Match ID", accessor: "id" },
        { header: "Date", accessor: "matched_at", format: (val) => new Date(val).toLocaleString() },
      ];
      break;
  }

  if (data.length > 0) {
    generateCSV(data, columns, `admin-${reportType}-report.csv`);
  }
};

export const exportCreatorStats = async (creatorId: string) => {
  const [subscribers, posts, earnings] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("status", "active"),
    supabase
      .from("creator_posts")
      .select("*")
      .eq("creator_id", creatorId),
    supabase
      .from("payment_transactions")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("status", "succeeded"),
  ]);

  const statsData = [
    {
      metric: "Total Subscribers",
      value: subscribers.data?.length || 0,
    },
    {
      metric: "Total Posts",
      value: posts.data?.length || 0,
    },
    {
      metric: "Total Earnings",
      value: `$${(earnings.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0).toFixed(2)}`,
    },
  ];

  const columns: ExportColumn<any>[] = [
    { header: "Metric", accessor: "metric" },
    { header: "Value", accessor: "value" },
  ];

  generateCSV(statsData, columns, `creator-stats-${creatorId}.csv`);
};
