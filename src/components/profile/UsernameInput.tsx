import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  currentUsername?: string;
}

export const UsernameInput = ({ value, onChange, currentUsername }: UsernameInputProps) => {
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const checkAvailability = async () => {
      if (!value || value === currentUsername) {
        setIsAvailable(null);
        setError("");
        return;
      }

      // Validate format
      if (value.length < 3) {
        setError("Username must be at least 3 characters");
        setIsAvailable(false);
        return;
      }

      if (value.length > 30) {
        setError("Username must be less than 30 characters");
        setIsAvailable(false);
        return;
      }

      if (!/^[a-z0-9_]+$/.test(value)) {
        setError("Only lowercase letters, numbers, and underscores");
        setIsAvailable(false);
        return;
      }

      setChecking(true);
      setError("");

      try {
        const { data, error } = await supabase.rpc('check_username_available', {
          desired_username: value
        });

        if (error) throw error;
        setIsAvailable(data);
        if (!data) {
          setError("Username is already taken");
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setError("Could not verify username");
        setIsAvailable(false);
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [value, currentUsername]);

  return (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <div className="relative">
        <Input
          id="username"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          placeholder="your_username"
          className={error && value ? "border-destructive" : isAvailable ? "border-green-500" : ""}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {!checking && isAvailable && value && value !== currentUsername && (
            <Check className="w-4 h-4 text-green-500" />
          )}
          {!checking && isAvailable === false && value && (
            <X className="w-4 h-4 text-destructive" />
          )}
        </div>
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : isAvailable && value !== currentUsername ? (
            <span className="text-green-600">Username is available!</span>
          ) : value === currentUsername ? (
            <span>Current username</span>
          ) : null}
        </p>
      )}
    </div>
  );
};
