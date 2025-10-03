import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TwoFactorAuth } from "@/components/security/TwoFactorAuth";
import { SessionManagement } from "@/components/security/SessionManagement";
import { SecurityEvents } from "@/components/security/SecurityEvents";
import { PasswordStrengthMeter } from "@/components/security/PasswordStrengthMeter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, ArrowLeft, Lock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/transitions/PageTransition";

const SecuritySettings = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lockoutStatus, setLockoutStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    if (user) {
      checkLockoutStatus();
    }
  }, [user]);

  const checkLockoutStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("account_lockouts")
      .select("*")
      .eq("user_id", user.id)
      .is("unlocked_at", null)
      .maybeSingle();

    setLockoutStatus(data);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Log security event
      await supabase.rpc("log_security_event", {
        _user_id: user?.id,
        _event_type: "password_change",
        _severity: "medium",
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-8 h-8" />
                  Security Settings
                </h1>
                <p className="text-muted-foreground">
                  Manage your account security and privacy
                </p>
              </div>
            </div>
          </div>

          {lockoutStatus && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Account Locked</AlertTitle>
              <AlertDescription>
                Your account is temporarily locked due to multiple failed login attempts.
                It will be automatically unlocked at{" "}
                {new Date(lockoutStatus.unlock_at).toLocaleString()}.
              </AlertDescription>
            </Alert>
          )}

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              {newPassword && <PasswordStrengthMeter password={newPassword} />}

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <TwoFactorAuth userId={user.id} />

          {/* Session Management */}
          <SessionManagement userId={user.id} />

          {/* Security Events */}
          <SecurityEvents userId={user.id} />
        </div>
      </div>
    </PageTransition>
  );
};

export default SecuritySettings;
