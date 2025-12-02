import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Sparkles, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface LikesYouCardProps {
  profile: {
    id: string;
    display_name: string;
    username: string | null;
    age: number | null;
    city: string | null;
    bio: string | null;
    avatar_url: string | null;
    is_creator: boolean;
    id_verified: boolean;
    photos?: Photo[];
    interests?: string[];
  };
  likedAt: string;
  onLikeBack: () => void;
  onPass: () => void;
  onViewProfile?: () => void;
  loading?: boolean;
}

const LikesYouCard = ({ profile, likedAt, onLikeBack, onPass, onViewProfile, loading }: LikesYouCardProps) => {
  const [actionLoading, setActionLoading] = useState<'like' | 'pass' | null>(null);

  const handleLikeBack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading('like');
    await onLikeBack();
    setActionLoading(null);
  };

  const handlePass = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading('pass');
    await onPass();
    setActionLoading(null);
  };

  const handleCardClick = () => {
    if (onViewProfile) {
      onViewProfile();
    }
  };

  return (
    <Card 
      className="p-3 flex items-center gap-3 transition-all hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <Avatar className="w-14 h-14 border-2 border-primary/20">
        <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground truncate">
            {profile.display_name}
          </span>
          {profile.id_verified && (
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
          )}
          {profile.is_creator && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              Creator
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {profile.age && <span>{profile.age} years</span>}
          {profile.city && <span>• {profile.city}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Liked you {formatDistanceToNow(new Date(likedAt), { addSuffix: true })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 rounded-full border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
          onClick={handlePass}
          disabled={loading || actionLoading !== null}
        >
          <X className={`w-4 h-4 text-destructive ${actionLoading === 'pass' ? 'animate-pulse' : ''}`} />
        </Button>
        <Button
          size="icon"
          className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
          onClick={handleLikeBack}
          disabled={loading || actionLoading !== null}
        >
          <Heart className={`w-4 h-4 ${actionLoading === 'like' ? 'animate-pulse' : ''}`} fill="currentColor" />
        </Button>
      </div>
    </Card>
  );
};

export default LikesYouCard;
