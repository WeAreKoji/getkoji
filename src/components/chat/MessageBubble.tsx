import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MessageBubbleProps {
  content: string;
  isOwnMessage: boolean;
  timestamp: string;
  messageType?: string;
  mediaUrl?: string | null;
}

const MessageBubble = ({ content, isOwnMessage, timestamp, messageType = "text", mediaUrl }: MessageBubbleProps) => {
  const [imageOpen, setImageOpen] = useState(false);
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[75%] rounded-2xl ${
            messageType === "photo" ? "p-1" : "px-4 py-2"
          } ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {messageType === "photo" && mediaUrl ? (
            <div className="space-y-1">
              <img
                src={mediaUrl}
                alt="Shared photo"
                className="max-w-full max-h-80 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageOpen(true)}
              />
              {content && <p className="text-sm px-3 pb-2 break-words">{content}</p>}
              <p
                className={`text-xs px-3 pb-2 ${
                  isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {formatTime(timestamp)}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm break-words">{content}</p>
              <p
                className={`text-xs mt-1 ${
                  isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {formatTime(timestamp)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Full-size image viewer */}
      {messageType === "photo" && mediaUrl && (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent className="max-w-4xl">
            <img
              src={mediaUrl}
              alt="Full size"
              className="w-full h-auto"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MessageBubble;
