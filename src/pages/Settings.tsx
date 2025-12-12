import { useAuth } from "@/hooks/useAuth";
import { SettingCard } from "@/components/settings/SettingCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { APP_VERSION, BUILD_TIMESTAMP } from "@/lib/version";
import {
  Bell,
  Lock,
  Shield,
  Target,
  User,
  UserX,
  HelpCircle,
  Info,
  Share2,
  Gift,
  ChevronLeft,
  LogOut,
} from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBlockedCount();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    setProfile(data);
  };

  const fetchBlockedCount = async () => {
    const { count } = await supabase
      .from("blocked_users")
      .select("*", { count: "exact", head: true })
      .eq("blocker_id", user?.id);
    setBlockedCount(count || 0);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to log out");
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
            onClick={() => navigate(-1)}
            className="flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {profile?.display_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">
                {profile?.display_name}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                @{profile?.username}
              </p>
            </div>
            <Button onClick={() => navigate("/profile/edit")} variant="outline">
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Settings Categories */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Preferences
          </h3>
          <SettingCard
            icon={<Bell className="w-5 h-5" />}
            title="Notifications"
            subtitle="Manage notification preferences"
            to="/settings/notifications"
          />
          <SettingCard
            icon={<Lock className="w-5 h-5" />}
            title="Security"
            subtitle="Password, 2FA, and sessions"
            to="/settings/security"
          />
          <SettingCard
            icon={<Shield className="w-5 h-5" />}
            title="Privacy"
            subtitle="Control your visibility"
            to="/settings/privacy"
          />
          <SettingCard
            icon={<Target className="w-5 h-5" />}
            title="Discovery"
            subtitle="Customize your discover feed"
            to="/discovery-settings"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Account
          </h3>
          <SettingCard
            icon={<User className="w-5 h-5" />}
            title="Account Settings"
            subtitle="Username, email, and more"
            to="/settings/account"
          />
          <SettingCard
            icon={<UserX className="w-5 h-5" />}
            title="Blocked Users"
            subtitle="Manage blocked accounts"
            to="/settings/blocked-users"
            badge={blockedCount > 0 ? blockedCount : undefined}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            More
          </h3>
          <SettingCard
            icon={<Share2 className="w-5 h-5" />}
            title="Share Profile"
            subtitle="Share your profile with others"
            to="/profile"
          />
          <SettingCard
            icon={<Gift className="w-5 h-5" />}
            title="Referrals"
            subtitle="Invite friends and earn rewards"
            to="/referrals"
          />
          <SettingCard
            icon={<HelpCircle className="w-5 h-5" />}
            title="Help & Support"
            subtitle="FAQs, contact us"
            to="/support"
          />
          <SettingCard
            icon={<Info className="w-5 h-5" />}
            title="About"
            subtitle="App info and policies"
            to="/about"
          />
        </div>

        {/* Logout */}
        <Card className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Log Out
          </Button>
        </Card>

        {/* Version Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
          <p>Version {APP_VERSION}</p>
          <p className="opacity-60">Build: {BUILD_TIMESTAMP}</p>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
        title="Log Out"
        description="Are you sure you want to log out?"
        confirmLabel="Log Out"
        variant="destructive"
      />
    </div>
  );
};

export default Settings;
