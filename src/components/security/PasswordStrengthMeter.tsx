import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const strength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    Object.values(checks).forEach((check) => {
      if (check) score++;
    });

    return {
      score,
      percentage: (score / 5) * 100,
      label:
        score === 0
          ? "No password"
          : score <= 2
          ? "Weak"
          : score <= 3
          ? "Fair"
          : score <= 4
          ? "Good"
          : "Strong",
      color:
        score === 0
          ? "bg-muted"
          : score <= 2
          ? "bg-destructive"
          : score <= 3
          ? "bg-yellow-500"
          : score <= 4
          ? "bg-blue-500"
          : "bg-green-500",
      checks,
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength:</span>
        <span className="text-sm font-medium">{strength.label}</span>
      </div>
      <Progress value={strength.percentage} className={strength.color} />
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          {strength.checks.length ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={strength.checks.length ? "text-foreground" : "text-muted-foreground"}>
            At least 8 characters
          </span>
        </div>
        <div className="flex items-center gap-2">
          {strength.checks.uppercase ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground" />
          )}
          <span
            className={strength.checks.uppercase ? "text-foreground" : "text-muted-foreground"}
          >
            At least one uppercase letter
          </span>
        </div>
        <div className="flex items-center gap-2">
          {strength.checks.lowercase ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground" />
          )}
          <span
            className={strength.checks.lowercase ? "text-foreground" : "text-muted-foreground"}
          >
            At least one lowercase letter
          </span>
        </div>
        <div className="flex items-center gap-2">
          {strength.checks.numbers ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={strength.checks.numbers ? "text-foreground" : "text-muted-foreground"}>
            At least one number
          </span>
        </div>
        <div className="flex items-center gap-2">
          {strength.checks.special ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={strength.checks.special ? "text-foreground" : "text-muted-foreground"}>
            At least one special character
          </span>
        </div>
      </div>
    </div>
  );
};
