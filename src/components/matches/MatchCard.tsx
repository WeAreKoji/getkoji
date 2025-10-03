import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MoreVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeable } from "react-swipeable";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import UnmatchDialog from "./UnmatchDialog";

interface MatchCardProps {
  matchId: string;
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
  currentUserId: string;
  onUnmatch: () => void;
}

const MatchCard = ({ matchId, profile, lastMessage, unreadCount, currentUserId, onUnmatch }: MatchCardProps) => {
  const isMobile = useIsMobile();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      if (eventData.dir === "Left" && isMobile) {
        setSwipeOffset(Math.max(-80, eventData.deltaX));
      }
    },
    onSwipedLeft: () => {
      if (isMobile && swipeOffset < -40) {
        setShowUnmatchDialog(true);
      }
      setSwipeOffset(0);
    },
    onSwiped: () => setSwipeOffset(0),
    trackMouse: false,
  });
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isUnread = unreadCount > 0;
  const isOwnMessage = lastMessage?.sender_id === currentUserId;

  const cardContent = (
    <Card 
      className={`${isMobile ? "p-3" : "p-4"} hover:bg-accent transition-all cursor-pointer relative overflow-hidden ${
        isUnread ? "border-primary/50 bg-accent/50" : ""
      }`}
      style={isMobile ? { transform: `translateX(${swipeOffset}px)` } : undefined}
    >
      <div className={isMobile ? "flex items-center gap-3" : "flex items-center gap-4"}>
        <div className="relative">
          <Avatar className={isMobile ? "w-12 h-12" : "w-16 h-16"}>
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10">
              <User className={isMobile ? "w-6 h-6 text-primary" : "w-8 h-8 text-primary"} />
            </AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-1 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold ${isUnread ? "font-bold" : ""}`}>
            {profile.display_name}
          </h3>
          {lastMessage ? (
            <div className="flex items-center justify-between gap-2">
              <p className={`${isMobile ? "text-xs" : "text-sm"} truncate ${
                isUnread ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>
                {isOwnMessage ? "You: " : ""}{lastMessage.content}
              </p>
              <span className={`text-xs whitespace-nowrap ${
                isUnread ? "text-primary font-medium" : "text-muted-foreground"
              }`}>
                {formatTime(lastMessage.created_at)}
              </span>
            </div>
          ) : (
            <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
              Start a conversation
            </p>
          )}
        </div>

        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  setShowUnmatchDialog(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                Unmatch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );

  return (
    <>
      {isMobile ? (
        <div {...swipeHandlers} className="relative">
          <Link to={`/chat/${matchId}`}>
            {cardContent}
          </Link>
          {swipeOffset < -40 && (
            <div 
              className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center text-destructive-foreground font-medium text-sm"
              style={{ transform: `translateX(${80 + swipeOffset}px)` }}
            >
              Delete
            </div>
          )}
        </div>
      ) : (
        <ContextMenu>
          <ContextMenuTrigger>
            <Link to={`/chat/${matchId}`}>
              {cardContent}
            </Link>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem 
              onClick={() => setShowUnmatchDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              Unmatch
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}

      <UnmatchDialog
        open={showUnmatchDialog}
        onOpenChange={setShowUnmatchDialog}
        onConfirm={onUnmatch}
        userName={profile.display_name}
      />
    </>
  );
};

export default MatchCard;
