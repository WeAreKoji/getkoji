import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  otherUserName: string;
  isTyping: boolean;
}

export const TypingIndicator = ({ otherUserName, isTyping }: TypingIndicatorProps) => {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (!isTyping) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{otherUserName} is typing{dots}</span>
    </div>
  );
};
