import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageReactions } from "./MessageReactions";
import { MessageStatus } from "./MessageStatus";
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
  messageId,
  currentUserId,
  deliveryStatus = "sent"
}: MessageBubbleProps) => {
  const [imageOpen, setImageOpen] = useState(false);
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}
      >
        <div
          className={`max-w-[80%] sm:max-w-[70%] ${
            messageType === "photo" ? "p-1.5" : "px-4 py-3"
          } ${
            isOwnMessage
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md shadow-md"
              : "bg-card border border-border text-foreground rounded-2xl rounded-bl-md shadow-sm"
          }`}
        >
          {messageType === "photo" && mediaUrl ? (
            <div className="space-y-2">
              <img
                src={mediaUrl}
                alt="Shared photo"
                className="max-w-full max-h-80 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageOpen(true)}
              />
              {content && (
                <p className="text-sm px-2 pb-1 break-words leading-relaxed">{content}</p>
              )}
              <div className="flex items-center justify-end gap-1.5 px-2 pb-1">
                <span
                  className={`text-[11px] ${
                    isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatTime(timestamp)}
                </span>
                {isOwnMessage && (
                  <MessageStatus deliveryStatus={deliveryStatus} isOwnMessage={isOwnMessage} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-[15px] break-words leading-relaxed whitespace-pre-wrap">{content}</p>
              <div className="flex items-center justify-between gap-3">
                <MessageReactions messageId={messageId} currentUserId={currentUserId} />
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] ${
                      isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(timestamp)}
                  </span>
                  {isOwnMessage && (
                    <MessageStatus deliveryStatus={deliveryStatus} isOwnMessage={isOwnMessage} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-size image viewer */}
      {messageType === "photo" && mediaUrl && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="max-w-4xl p-2">
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