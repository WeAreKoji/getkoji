import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  isOwnMessage: boolean;
  timestamp: string;
  messageType?: string;
  mediaUrl?: string | null;
  messageId: string;
  currentUserId: string;
  deliveryStatus?: string;
}

const MessageBubble = ({ 
  content, 
  isOwnMessage, 
  timestamp, 
  messageType = "text", 
  mediaUrl,
  deliveryStatus = "sent"
}: MessageBubbleProps) => {
  const [imageOpen, setImageOpen] = useState(false);
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderDeliveryStatus = () => {
    if (!isOwnMessage) return null;
    
    switch (deliveryStatus) {
      case 'sending':
        return <Check className="w-3.5 h-3.5 text-primary-foreground/50" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-primary-foreground/70" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/70" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-primary-foreground" />;
      default:
        return <Check className="w-3.5 h-3.5 text-primary-foreground/70" />;
    }
  };

  return (
    <>
      <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`max-w-[75%] ${
            messageType === "photo" ? "p-1" : "px-4 py-2.5"
          } ${
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-[20px] rounded-br-[4px]"
              : "bg-muted/80 text-foreground rounded-[20px] rounded-bl-[4px]"
          }`}
        >
          {messageType === "photo" && mediaUrl ? (
            <div>
              <img
                src={mediaUrl}
                alt="Shared photo"
                className="max-w-full max-h-72 rounded-[16px] cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setImageOpen(true)}
              />
              {content && (
                <p className="text-[15px] px-3 pt-2 pb-1 break-words leading-relaxed">{content}</p>
              )}
              <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
                <span className={`text-[11px] ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {formatTime(timestamp)}
                </span>
                {renderDeliveryStatus()}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[15px] break-words leading-relaxed whitespace-pre-wrap">{content}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={`text-[11px] ${isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatTime(timestamp)}
                </span>
                {renderDeliveryStatus()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-size image viewer */}
      {messageType === "photo" && mediaUrl && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur">
            <img
              src={mediaUrl}
              alt="Full size"
              className="w-full h-auto rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MessageBubble;