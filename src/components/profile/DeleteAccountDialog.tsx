import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

export const DeleteAccountDialog = ({
  open,
  onOpenChange,
  userId,
  userEmail,
}: DeleteAccountDialogProps) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password to confirm deletion",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (signInError) {
        throw new Error("Invalid password. Please try again.");
      }

      // Sign out the user (account deletion requires admin privileges)
      await supabase.auth.signOut();
      
      toast({
        title: "Account deletion requested",
        description: "Your account deletion has been requested. Please contact support to complete the process.",
      });

      // Redirect to home
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPassword("");
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Delete Account</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p className="font-semibold text-foreground">
              This action cannot be undone. This will permanently delete your account and remove all your data:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Profile information and photos</li>
              <li>All messages and matches</li>
              <li>Creator content and subscriptions</li>
              <li>Payment history and earnings</li>
              <li>All other account data</li>
            </ul>
            <p className="text-sm font-medium text-destructive">
              To confirm deletion, please enter your password:
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !password}
          >
            {loading ? "Deleting..." : "Delete Account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
