import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  created_at: string;
  profiles: {
    display_name: string;
    email: string;
  };
}

export default function AdminAuditLogs() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchLogs();
  }, [isAdmin, navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        profiles!audit_logs_user_id_fkey (
          display_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data as any);
    }
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    if (action.includes("approve")) return "default";
    if (action.includes("reject")) return "destructive";
    if (action.includes("delete")) return "destructive";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              Track all admin actions and system events
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 100 admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionColor(log.action)}>
                            {log.action.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            on {log.resource_type}
                          </span>
                        </div>

                        <div className="text-sm">
                          <span className="font-medium">
                            {log.profiles?.display_name || "Unknown User"}
                          </span>
                          <span className="text-muted-foreground">
                            {" • "}
                            {log.profiles?.email}
                          </span>
                        </div>

                        {log.details && (
                          <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>

                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
