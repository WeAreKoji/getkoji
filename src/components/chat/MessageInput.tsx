import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTyping?.(false);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-focus input when component mounts
    textareaRef.current?.focus();
  }, []);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (e.target.value.length > 0 && onTyping) {
      onTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator after 3 seconds
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

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.(false);

    // Rate limit: 20 messages per minute
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
    // Keep focus on input after sending
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handlePhotoSelect = (url: string) => {
    setSelectedPhoto(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
            className="max-h-32 rounded-lg"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <PhotoUploadButton onPhotoSelect={handlePhotoSelect} disabled={disabled} />
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="resize-none min-h-[44px] max-h-[120px]"
        />
        <Button
          type="submit"
          size="icon"
          disabled={(!message.trim() && !selectedPhoto) || disabled}
          className="shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
