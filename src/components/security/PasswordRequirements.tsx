import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface PasswordRequirementsProps {
  password?: string;
}

export const PasswordRequirements = ({ password = "" }: PasswordRequirementsProps) => {
  const requirements = [
    {
      label: "At least 8 characters long",
      met: password.length >= 8,
    },
    {
      label: "Contains uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contains special character (!@#$%^&*)",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const allMet = requirements.every((req) => req.met);

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Password Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
              {req.label}
            </span>
          </div>
        ))}
        {password && (
          <div className="mt-3 pt-3 border-t">
            <p className={`text-xs font-medium ${allMet ? "text-green-500" : "text-muted-foreground"}`}>
              {allMet ? "✓ All requirements met" : `${requirements.filter(r => r.met).length}/${requirements.length} requirements met`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
