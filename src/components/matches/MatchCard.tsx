import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  };
}

const MatchCard = ({ matchId, profile, lastMessage }: MatchCardProps) => {
  const isMobile = useIsMobile();
  
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

  return (
    <Link to={`/chat/${matchId}`}>
      <Card className={isMobile ? "p-3 hover:bg-accent transition-colors cursor-pointer" : "p-4 hover:bg-accent transition-colors cursor-pointer"}>
        <div className={isMobile ? "flex items-center gap-3" : "flex items-center gap-4"}>
          <Avatar className={isMobile ? "w-12 h-12" : "w-16 h-16"}>
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10">
              <User className={isMobile ? "w-6 h-6 text-primary" : "w-8 h-8 text-primary"} />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className={isMobile ? "font-semibold text-base" : "font-semibold text-lg"}>{profile.display_name}</h3>
            {lastMessage ? (
              <div className="flex items-center justify-between gap-2">
                <p className={isMobile ? "text-xs text-muted-foreground truncate" : "text-sm text-muted-foreground truncate"}>
                  {lastMessage.content}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(lastMessage.created_at)}
                </span>
              </div>
            ) : (
              <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                Start a conversation
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default MatchCard;
