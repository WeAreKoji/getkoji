import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "error" | "info" | "default";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  icon?: LucideIcon;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  default: "bg-muted text-muted-foreground border-border",
};

export const StatusBadge = ({
  status,
  variant = "default",
  icon: Icon,
  pulse = false,
  className,
}: StatusBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        variantStyles[variant],
        pulse && "animate-pulse",
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {status}
    </Badge>
  );
};
