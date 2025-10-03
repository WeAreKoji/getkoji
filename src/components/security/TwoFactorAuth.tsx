import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Shield, ShieldCheck, Copy, Eye, EyeOff, Download, Printer, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { AuthenticatorAppRecommendations } from "./AuthenticatorAppRecommendations";

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

  const downloadBackupCodes = () => {
    if (!setupData) return;
    const content = `Backup Codes for Two-Factor Authentication\nGenerated: ${new Date().toLocaleString()}\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Backup codes saved to file",
    });
  };

  const printBackupCodes = () => {
    if (!setupData) return;
    const printWindow = window.open('', '', 'width=600,height=400');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Backup Codes</title></head>
          <body style="font-family: monospace; padding: 20px;">
            <h2>Two-Factor Authentication Backup Codes</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <ul>
              ${setupData.backupCodes.map(code => `<li>${code}</li>`).join('')}
            </ul>
            <p><strong>Keep these codes in a safe place. Each code can only be used once.</strong></p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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
          <div className="space-y-6">
            {/* Step 1: Authenticator Apps */}
            <AuthenticatorAppRecommendations />

            <Separator />

            {/* Step 2: Scan QR Code */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Step 2: Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Open your authenticator app and scan this QR code to link your account.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block border-2 border-primary/20">
                  <QRCode value={setupData.qrCodeUrl} size={200} />
                </div>
              </div>
            </div>

            {/* Can't Scan QR Code Section */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                📱 Can't scan the QR code? Click here for manual setup
              </summary>
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label>Enter this secret key manually:</Label>
                  <div className="flex gap-2">
                    <Input value={setupData.secret} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(setupData.secret)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>1. Open your authenticator app</p>
                  <p>2. Select "Enter a setup key" or "Manual entry"</p>
                  <p>3. Enter your email as the account name</p>
                  <p>4. Paste the secret key above</p>
                  <p>5. Make sure "Time based" is selected</p>
                </div>
              </div>
            </details>

            <Separator />

            {/* Step 3: Verify */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Step 3: Verify Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to confirm setup.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  The code refreshes every 30 seconds in your authenticator app
                </p>
              </div>

              <Button onClick={handleVerify2FA} disabled={isVerifying} className="w-full">
                {isVerifying ? "Verifying..." : "Verify and Enable 2FA"}
              </Button>
            </div>

            <Separator />

            {/* Step 4: Backup Codes */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Step 4: Save Backup Codes</h3>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Critical:</strong> Save these backup codes now. You'll need them if you lose access to your authenticator app.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="flex-1"
                >
                  {showBackupCodes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showBackupCodes ? "Hide" : "Show"} Codes
                </Button>
                <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={printBackupCodes}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>

              {showBackupCodes && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {setupData.backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-background rounded">
                          <span className="flex-1">{code}</span>
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
                  </CardContent>
                </Card>
              )}

              {/* Security Tips */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">🔒 Security Tips</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>✅ Use a different password for your authenticator app</li>
                    <li>✅ Never share your secret key or QR code with anyone</li>
                    <li>✅ Store backup codes in a password manager or safe place</li>
                    <li>✅ Each backup code can only be used once</li>
                    <li>⚠️ Losing your authenticator AND backup codes will lock you out</li>
                  </ul>
                </CardContent>
              </Card>
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
