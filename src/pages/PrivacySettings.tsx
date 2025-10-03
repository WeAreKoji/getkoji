import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/error-logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrivacySettings {
  show_in_discover: boolean;
  show_interests: boolean;
  show_photos: boolean;
  show_location: "exact" | "region" | "hidden";
  show_age: "exact" | "range" | "hidden";
  profile_visibility: "everyone" | "matches_only" | "hidden";
  message_permissions: "everyone" | "matches_only" | "none";
  online_status_visibility: "everyone" | "matches_only" | "hidden";
  searchable_by_username: boolean;
}

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrivacySettings>({
    show_in_discover: true,
    show_interests: true,
    show_photos: true,
    show_location: "exact",
    show_age: "exact",
    profile_visibility: "everyone",
    message_permissions: "everyone",
    online_status_visibility: "everyone",
    searchable_by_username: true,
  });
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await fetchSettings(user.id);
  };

  const fetchSettings = async (userId: string) => {
    try {
      const [settingsData, blockedData] = await Promise.all([
        supabase
          .from("profiles")
          .select("privacy_settings")
          .eq("id", userId)
          .single(),
        supabase
          .from("blocked_users")
          .select("*", { count: "exact", head: true })
          .eq("blocker_id", userId)
      ]);

      if (settingsData.data?.privacy_settings) {
        const parsed = settingsData.data.privacy_settings as any;
        setSettings({
          show_in_discover: parsed.show_in_discover ?? true,
          show_interests: parsed.show_interests ?? true,
          show_photos: parsed.show_photos ?? true,
          show_location: parsed.show_location ?? "exact",
          show_age: parsed.show_age ?? "exact",
          profile_visibility: parsed.profile_visibility ?? "everyone",
          message_permissions: parsed.message_permissions ?? "everyone",
          online_status_visibility: parsed.online_status_visibility ?? "everyone",
          searchable_by_username: parsed.searchable_by_username ?? true,
        });
      }

      setBlockedCount(blockedData.count || 0);
    } catch (error) {
      logError(error, 'PrivacySettings.fetchSettings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ privacy_settings: settings as any })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your privacy settings have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-3 flex items-center justify-between">
          <Link to="/settings" aria-label="Back to settings">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
          </Link>
          <h1 className="font-semibold">Privacy Settings</h1>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Blocked Users Quick Access */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <Link to="/settings/blocked-users" className="flex items-center justify-between group">
              <div className="space-y-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                  Blocked Users
                  {blockedCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {blockedCount}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your blocked accounts
                </p>
              </div>
              <ArrowLeft className="w-5 h-5 rotate-180 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </Card>

          {/* Profile Visibility */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Profile Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Control how your profile appears to others
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="discover">Show in Discover</Label>
                <p className="text-sm text-muted-foreground">
                  Appear in discovery feed
                </p>
              </div>
              <Switch
                id="discover"
                checked={settings.show_in_discover}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_in_discover: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="interests">Show Interests</Label>
                <p className="text-sm text-muted-foreground">
                  Display your interests publicly
                </p>
              </div>
              <Switch
                id="interests"
                checked={settings.show_interests}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_interests: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="photos">Show Photos</Label>
                <p className="text-sm text-muted-foreground">
                  Display your photos publicly
                </p>
              </div>
              <Switch
                id="photos"
                checked={settings.show_photos}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_photos: checked })
                }
              />
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Personal Information</h3>
              <p className="text-sm text-muted-foreground">
                Choose what personal details to share
              </p>
            </div>

            <div className="space-y-2">
              <Label>Location Visibility</Label>
              <Select
                value={settings.show_location}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, show_location: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact City</SelectItem>
                  <SelectItem value="region">Region Only</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Age Visibility</Label>
              <Select
                value={settings.show_age}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, show_age: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact Age</SelectItem>
                  <SelectItem value="range">Age Range (e.g., 25-30)</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Data Visibility & Access */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Data Visibility & Access</h3>
              <p className="text-sm text-muted-foreground">
                Control who can see your profile and interact with you
              </p>
            </div>

            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select
                value={settings.profile_visibility}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, profile_visibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="matches_only">Only Matches</SelectItem>
                  <SelectItem value="hidden">Hidden (Discovery Off)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose who can view your full profile
              </p>
            </div>

            <div className="space-y-2">
              <Label>Message Permissions</Label>
              <Select
                value={settings.message_permissions}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, message_permissions: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="matches_only">Only Matches</SelectItem>
                  <SelectItem value="none">No One</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Who can send you messages
              </p>
            </div>

            <div className="space-y-2">
              <Label>Online Status</Label>
              <Select
                value={settings.online_status_visibility}
                onValueChange={(value: any) =>
                  setSettings({ ...settings, online_status_visibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="matches_only">Only Matches</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Who can see when you're online
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="searchable">Searchable by Username</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to find you by username
                </p>
              </div>
              <Switch
                id="searchable"
                checked={settings.searchable_by_username}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, searchable_by_username: checked })
                }
              />
            </div>
          </Card>

          {/* Info Box */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex gap-3">
              <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Privacy Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your profile is more likely to receive matches when you share more information.
                  Balance privacy with discoverability based on your preferences.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
