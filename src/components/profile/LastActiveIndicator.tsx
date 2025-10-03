import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LastActiveIndicatorProps {
  lastActive: string | null;
  isOnline?: boolean;
}

export const LastActiveIndicator = ({ lastActive, isOnline }: LastActiveIndicatorProps) => {
  if (!lastActive) return null;

  const getActivityStatus = () => {
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);

    if (diffInMinutes < 5) {
      return { text: "Active now", variant: "default" as const, showDot: true };
    } else if (diffInMinutes < 60) {
      return { 
        text: `Active ${Math.floor(diffInMinutes)} min ago`, 
        variant: "secondary" as const,
        showDot: false 
      };
    } else if (diffInMinutes < 1440) { // 24 hours
      return { 
        text: `Active ${Math.floor(diffInMinutes / 60)} hours ago`, 
        variant: "secondary" as const,
        showDot: false 
      };
    } else {
      return { 
        text: `Active ${formatDistanceToNow(lastActiveDate, { addSuffix: true })}`, 
        variant: "outline" as const,
        showDot: false 
      };
    }
  };

  const status = getActivityStatus();

  return (
    <Badge variant={status.variant} className="gap-1.5">
      {status.showDot && (
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
      <Clock className="w-3 h-3" />
      {status.text}
    </Badge>
  );
};
