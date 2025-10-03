import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, ShieldCheck, Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

export const TwoFactorAuth = ({ userId }: { userId: string }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    check2FAStatus();
  }, [userId]);

  const check2FAStatus = async () => {
    const { data, error } = await supabase
      .from("user_2fa")
      .select("enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setIs2FAEnabled(data.enabled);
    }
    setLoading(false);
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("enable-2fa");

      if (error) throw error;

      setSetupData(data);
      toast({
        title: "2FA Setup Started",
        description: "Scan the QR code with your authenticator app.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup 2FA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-2fa", {
        body: { code: verificationCode },
      });

      if (error) throw error;

      if (data.verified) {
        setIs2FAEnabled(true);
        setSetupData(null);
        setVerificationCode("");
        toast({
          title: "Success!",
          description: "Two-factor authentication is now enabled.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password to disable 2FA.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("disable-2fa", {
        body: { password },
      });

      if (error) throw error;

      setIs2FAEnabled(false);
      setPassword("");
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  if (loading && !setupData) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {is2FAEnabled ? <ShieldCheck className="w-5 h-5 text-primary" /> : <Shield className="w-5 h-5" />}
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!is2FAEnabled && !setupData && (
          <>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Enhance Your Security</AlertTitle>
              <AlertDescription>
                Enable two-factor authentication to protect your account from unauthorized access.
              </AlertDescription>
            </Alert>
            <Button onClick={handleEnable2FA} disabled={loading}>
              Enable 2FA
            </Button>
          </>
        )}

        {setupData && !is2FAEnabled && (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <h3 className="font-semibold">Scan QR Code</h3>
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCode value={setupData.qrCodeUrl} size={200} />
              </div>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Or enter this secret key manually:</Label>
              <div className="flex gap-2">
                <Input value={setupData.secret} readOnly />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(setupData.secret)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
              />
            </div>

            <Button onClick={handleVerify2FA} disabled={isVerifying} className="w-full">
              {isVerifying ? "Verifying..." : "Verify and Enable"}
            </Button>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Backup Codes</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                >
                  {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {showBackupCodes && (
                <Alert>
                  <AlertDescription>
                    <p className="mb-2 font-semibold">Save these backup codes in a safe place:</p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {setupData.backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span>{code}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {is2FAEnabled && (
          <div className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>2FA is Enabled</AlertTitle>
              <AlertDescription>
                Your account is protected with two-factor authentication.
              </AlertDescription>
            </Alert>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Disable 2FA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Enter your password to disable 2FA. This will make your account less secure.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={loading}
                    className="w-full"
                  >
                    Confirm Disable 2FA
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
