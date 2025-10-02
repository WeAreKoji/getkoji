interface MessageBubbleProps {
  content: string;
  isOwnMessage: boolean;
  timestamp: string;
}

const MessageBubble = ({ content, isOwnMessage, timestamp }: MessageBubbleProps) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm break-words">{content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
