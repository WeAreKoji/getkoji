import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EmailChangeDialog } from "@/components/settings/EmailChangeDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { DataExport } from "@/components/settings/DataExport";
import { ThemeCustomizer } from "@/components/settings/ThemeCustomizer";
import { ActivityInsights } from "@/components/settings/ActivityInsights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, User, Mail, AtSign, AlertTriangle, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AccountSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  const [profile, setProfile] = useState({
    display_name: "",
    username: "",
    email: "",
    username_updated_at: null as string | null,
  });

  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username, email, username_updated_at")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        display_name: data.display_name,
        username: data.username || "",
      });
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username === profile.username) {
      setUsernameAvailable(null);
      return;
    }

    if (username.length < 3) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data } = await supabase.rpc("check_username_available", {
        desired_username: username,
      });
      setUsernameAvailable(data);
    } catch (error) {
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setFormData((prev) => ({ ...prev, username: cleaned }));
    
    if (cleaned.length >= 3) {
      checkUsernameAvailability(cleaned);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }

    if (formData.username && formData.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (formData.username && usernameAvailable === false) {
      toast.error("Username is not available");
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        display_name: formData.display_name,
      };

      if (formData.username !== profile.username) {
        updates.username = formData.username;
        updates.username_updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user?.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        ...updates,
      }));

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = 
    formData.display_name !== profile.display_name ||
    formData.username !== profile.username;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <User className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Account Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Information */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Profile Information</h2>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={formData.display_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                className="pl-9"
              />
              {checkingUsername && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {!checkingUsername && usernameAvailable === true && formData.username !== profile.username && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
              {!checkingUsername && usernameAvailable === false && (
                <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              3-30 characters. Letters, numbers, and underscores only.
            </p>
            {profile.username_updated_at && (
              <p className="text-xs text-muted-foreground">
                Last changed: {new Date(profile.username_updated_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {hasChanges && (
            <Button 
              onClick={handleSave} 
              disabled={saving || (formData.username !== profile.username && usernameAvailable === false)}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </Card>

        {/* Email */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Email Address</h2>
          
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.email}</p>
              <p className="text-xs text-muted-foreground">Your email address</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailDialog(true)}
              size="sm"
            >
              Change
            </Button>
          </div>
        </Card>

        <Separator />

        {/* Activity Insights */}
        <ActivityInsights userId={user?.id || ""} />

        <Separator />

        {/* Theme Customization */}
        <ThemeCustomizer />

        <Separator />

        {/* Data Export */}
        <DataExport userId={user?.id || ""} />

        <Separator />

        {/* Danger Zone */}
        <Card className="p-6 space-y-4 border-destructive/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-lg text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Irreversible actions that permanently affect your account
              </p>
            </div>
          </div>

          <Alert className="border-destructive bg-destructive/5">
            <AlertDescription className="text-sm">
              Once you delete your account, there is no going back. All your data, 
              matches, and messages will be permanently deleted.
            </AlertDescription>
          </Alert>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full"
          >
            Delete Account
          </Button>
        </Card>
      </div>

      <EmailChangeDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        currentEmail={profile.email}
        userId={user?.id || ""}
      />

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        userId={user?.id || ""}
        userEmail={profile.email}
      />
    </div>
  );
};

export default AccountSettings;
