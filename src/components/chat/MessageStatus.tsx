import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  deliveryStatus: string;
  isOwnMessage: boolean;
}

export const MessageStatus = ({ deliveryStatus, isOwnMessage }: MessageStatusProps) => {
  if (!isOwnMessage) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {deliveryStatus === 'sent' && <Check className="h-3 w-3" />}
      {deliveryStatus === 'delivered' && <CheckCheck className="h-3 w-3" />}
      {deliveryStatus === 'read' && <CheckCheck className={cn("h-3 w-3", "text-primary")} />}
      <span className="capitalize">{deliveryStatus}</span>
    </div>
  );
};
