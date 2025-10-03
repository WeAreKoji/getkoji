import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingToggle } from "@/components/settings/SettingToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const NotificationsSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    in_app_enabled: true,
    email_new_subscriber: true,
    email_subscription_renewal: true,
    email_post_moderation: true,
    email_failed_transfer: true,
    email_verification_update: true,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences({
          in_app_enabled: data.in_app_enabled,
          email_new_subscriber: data.email_new_subscriber,
          email_subscription_renewal: data.email_subscription_renewal,
          email_post_moderation: data.email_post_moderation,
          email_failed_transfer: data.email_failed_transfer,
          email_verification_update: data.email_verification_update,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: boolean) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user?.id,
          [key]: value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      setPreferences((prev) => ({ ...prev, [key]: value }));
      toast.success("Preference updated");
    } catch (error: any) {
      toast.error("Failed to update preference");
      setPreferences((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Notifications</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <Card className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ) : (
          <>
            {/* In-App Notifications */}
            <Card className="p-6 space-y-2">
              <h2 className="font-semibold text-lg mb-4">In-App Notifications</h2>
              <SettingToggle
                id="in-app"
                label="Enable In-App Notifications"
                description="Show notifications within the app"
                checked={preferences.in_app_enabled}
                onCheckedChange={(value) => updatePreference("in_app_enabled", value)}
                loading={saving === "in_app_enabled"}
              />
            </Card>

            {/* Email Notifications */}
            <Card className="p-6 space-y-2">
              <h2 className="font-semibold text-lg mb-4">Email Notifications</h2>
              
              <SettingToggle
                id="email-subscriber"
                label="New Subscriber"
                description="Get notified when someone subscribes to you"
                checked={preferences.email_new_subscriber}
                onCheckedChange={(value) => updatePreference("email_new_subscriber", value)}
                loading={saving === "email_new_subscriber"}
              />

              <SettingToggle
                id="email-renewal"
                label="Subscription Renewal"
                description="Notifications about subscription renewals"
                checked={preferences.email_subscription_renewal}
                onCheckedChange={(value) => updatePreference("email_subscription_renewal", value)}
                loading={saving === "email_subscription_renewal"}
              />

              <SettingToggle
                id="email-moderation"
                label="Post Moderation"
                description="Updates about your post moderation status"
                checked={preferences.email_post_moderation}
                onCheckedChange={(value) => updatePreference("email_post_moderation", value)}
                loading={saving === "email_post_moderation"}
              />

              <SettingToggle
                id="email-transfer"
                label="Failed Transfer"
                description="Alerts for failed payment transfers"
                checked={preferences.email_failed_transfer}
                onCheckedChange={(value) => updatePreference("email_failed_transfer", value)}
                loading={saving === "email_failed_transfer"}
              />

              <SettingToggle
                id="email-verification"
                label="Verification Updates"
                description="ID verification status changes"
                checked={preferences.email_verification_update}
                onCheckedChange={(value) => updatePreference("email_verification_update", value)}
                loading={saving === "email_verification_update"}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsSettings;
