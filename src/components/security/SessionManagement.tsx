import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Smartphone, Monitor, Tablet, MapPin, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getLocationDisplay, type LocationInfo } from "@/lib/geolocation";

interface Session {
  id: string;
  user_agent: string;
  ip_address: unknown;
  location_info: LocationInfo | null;
  device_info: any;
  last_active: string;
  created_at: string;
  revoked: boolean;
}

export const SessionManagement = ({ userId }: { userId: string }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("revoked", false)
      .order("last_active", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } else {
      // Cast location_info to LocationInfo type
      const typedSessions = (data || []).map(session => ({
        ...session,
        location_info: session.location_info as unknown as LocationInfo | null,
      }));
      setSessions(typedSessions);
    }
    setLoading(false);
  };

  const revokeSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("user_sessions")
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoke_reason: "Revoked by user",
      })
      .eq("id", sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Session Revoked",
        description: "The session has been terminated",
      });
      loadSessions();
    }
  };

  const revokeAllOtherSessions = async () => {
    const currentSessionToken = localStorage.getItem("session_token");
    
    const { error } = await supabase
      .from("user_sessions")
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoke_reason: "Revoked all other sessions",
      })
      .eq("user_id", userId)
      .neq("session_token", currentSessionToken || "");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to revoke sessions",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sessions Revoked",
        description: "All other sessions have been terminated",
      });
      loadSessions();
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getDeviceName = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("edge")) return "Edge";
    return "Unknown Browser";
  };

  const isSessionOld = (lastActive: string) => {
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceActive > 30;
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading sessions...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Manage your active login sessions across different devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <Alert>
            <AlertDescription>No active sessions found</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={session.id} className={isSessionOld(session.last_active) ? "border-yellow-500" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.user_agent)}
                          <span className="font-medium">{getDeviceName(session.user_agent)}</span>
                          {isSessionOld(session.last_active) && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <MapPin className="w-4 h-4" />
                                  <span>{getLocationDisplay(session.location_info, String(session.ip_address || 'Unknown'))}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p>IP: {String(session.ip_address || 'Unknown')}</p>
                                  {session.location_info && (
                                    <>
                                      {session.location_info.city && <p>City: {session.location_info.city}</p>}
                                      {session.location_info.regionName && <p>Region: {session.location_info.regionName}</p>}
                                      {session.location_info.country && <p>Country: {session.location_info.country}</p>}
                                      {session.location_info.timezone && <p>Timezone: {session.location_info.timezone}</p>}
                                    </>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Last active: {format(new Date(session.last_active), "PPp")}
                            </span>
                          </div>
                          <div className="text-xs">
                            Created: {format(new Date(session.created_at), "PPp")}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sessions.length > 1 && (
              <Button
                variant="outline"
                onClick={revokeAllOtherSessions}
                className="w-full"
              >
                Revoke All Other Sessions
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
