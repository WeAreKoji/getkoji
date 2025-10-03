import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  Lock, 
  Unlock, 
  Key,
  Mail,
  Smartphone,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getLocationDisplay, type LocationInfo } from "@/lib/geolocation";

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  ip_address: unknown;
  location_info: LocationInfo | null;
  metadata: any;
  acknowledged: boolean;
  created_at: string;
}

export const SecurityEvents = ({ userId }: { userId: string }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [userId]);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("security_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load security events",
        variant: "destructive",
      });
    } else {
      // Cast location_info to LocationInfo type
      const typedEvents = (data || []).map(event => ({
        ...event,
        location_info: event.location_info as unknown as LocationInfo | null,
      }));
      setEvents(typedEvents);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Info className="w-4 h-4" />;
      case "low":
        return <Shield className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "login_success":
      case "login_failure":
        return <Unlock className="w-5 h-5" />;
      case "password_change":
        return <Key className="w-5 h-5" />;
      case "email_change":
        return <Mail className="w-5 h-5" />;
      case "2fa_enabled":
      case "2fa_disabled":
        return <Smartphone className="w-5 h-5" />;
      case "account_locked":
      case "account_unlocked":
        return <Lock className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading security events...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Activity</CardTitle>
        <CardDescription>
          Recent security events on your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <Alert>
            <AlertDescription>No security events recorded</AlertDescription>
          </Alert>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{getEventIcon(event.event_type)}</div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatEventType(event.event_type)}
                        </span>
                        <Badge variant={getSeverityColor(event.severity)} className="gap-1">
                          {getSeverityIcon(event.severity)}
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <div>
                          {format(new Date(event.created_at), "PPp")}
                        </div>
                        {(event.location_info || event.ip_address) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <MapPin className="w-3 h-3" />
                                  {getLocationDisplay(event.location_info, String(event.ip_address || ''))}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  {event.ip_address && <p>IP: {String(event.ip_address)}</p>}
                                  {event.location_info && (
                                    <>
                                      {event.location_info.city && <p>City: {event.location_info.city}</p>}
                                      {event.location_info.regionName && <p>Region: {event.location_info.regionName}</p>}
                                      {event.location_info.country && <p>Country: {event.location_info.country}</p>}
                                      {event.location_info.timezone && <p>Timezone: {event.location_info.timezone}</p>}
                                    </>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="text-xs">
                            {JSON.stringify(event.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};
