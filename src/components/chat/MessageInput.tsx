import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Image } from "lucide-react";
import { ClientRateLimiter } from "@/lib/rate-limit-client";
import { useToast } from "@/hooks/use-toast";
import { PhotoUploadButton } from "./PhotoUploadButton";

interface MessageInputProps {
  onSend: (message: string, mediaUrl?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  matchId?: string;
}

const MessageInput = ({ onSend, onTyping, disabled, matchId = 'default' }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTyping?.(false);
      }
    };
  }, []);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (e.target.value.length > 0 && onTyping) {
      onTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    } else if (e.target.value.length === 0 && onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedPhoto) || disabled) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.(false);

    const rateLimit = ClientRateLimiter.checkLimit({
      key: `message_send_${matchId}`,
      maxAttempts: 20,
      windowMinutes: 1,
    });

    if (!rateLimit.allowed) {
      toast({
        title: "Slow down!",
        description: "You're sending messages too quickly. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    onSend(message.trim(), selectedPhoto || undefined);
    setMessage("");
    setSelectedPhoto(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePhotoSelect = (url: string) => {
    setSelectedPhoto(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-2">
      {selectedPhoto && (
        <div className="relative inline-block">
          <img
            src={selectedPhoto}
            alt="Selected"
            className="max-h-24 rounded-xl border border-border"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-xs"
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <PhotoUploadButton onPhotoSelect={handlePhotoSelect} disabled={disabled} />
        
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full h-11 px-4 rounded-full bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
        
        <Button
          type="submit"
          size="icon"
          disabled={(!message.trim() && !selectedPhoto) || disabled}
          className="shrink-0 h-11 w-11 rounded-full"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;