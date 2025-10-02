import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { ClientRateLimiter } from "@/lib/rate-limit-client";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  matchId?: string;
}

const MessageInput = ({ onSend, disabled, matchId = 'default' }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-focus input when component mounts
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

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

    onSend(message.trim());
    setMessage("");
    // Keep focus on input after sending
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className="resize-none min-h-[44px] max-h-[120px]"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || disabled}
        className="shrink-0"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};

export default MessageInput;
