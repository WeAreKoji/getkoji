import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, AlertTriangle, CheckCircle2 } from "lucide-react";

interface EmailChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  userId: string;
}

export const EmailChangeDialog = ({ open, onOpenChange, currentEmail, userId }: EmailChangeDialogProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'verification'>('input');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify password by attempting sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password,
      });

      if (signInError) {
        toast.error("Invalid password");
        setLoading(false);
        return;
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) throw updateError;

      // Log security event
      await supabase.rpc('log_security_event', {
        _user_id: userId,
        _event_type: 'email_change',
        _severity: 'high',
        _metadata: { old_email: currentEmail, new_email: newEmail }
      });

      setStep('verification');
      toast.success("Verification email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to change email");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail("");
    setPassword("");
    setStep('input');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Change Email Address
          </DialogTitle>
          <DialogDescription>
            {step === 'input' 
              ? "Enter your new email and password to confirm the change."
              : "Check your new email for a verification link."}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input value={currentEmail} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">New Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Confirm Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Alert className="border-warning bg-warning/5">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <AlertDescription className="text-sm">
                You'll need to verify your new email address before the change takes effect.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !newEmail || !password}>
                {loading ? "Changing..." : "Change Email"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert className="border-primary bg-primary/5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <AlertDescription>
                We've sent a verification link to <strong>{newEmail}</strong>. 
                Please check your inbox and click the link to complete the email change.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Check your spam folder if you don't see the email</p>
              <p>• The verification link expires in 1 hour</p>
              <p>• Your current email will remain active until verification</p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Got it
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
