import { MessageCircle, Heart, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { haptics } from "@/lib/native";
import { shareContent, canShare } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProfileActionsProps {
  userId: string;
  displayName: string;
}

export const ProfileActions = ({ userId, displayName }: ProfileActionsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const showShare = canShare();

  const handleMessage = () => {
    haptics.medium();
    navigate(`/chat/${userId}`);
  };

  const handleLike = () => {
    haptics.light();
    toast({
      title: "Liked!",
      description: `You liked ${displayName}'s profile`,
    });
  };

  const handleShare = async () => {
    try {
      haptics.light();
      await shareContent({
        title: `Check out ${displayName} on Koji`,
        text: `I found ${displayName}'s profile on Koji!`,
        url: `${window.location.origin}/profile/${userId}`,
        dialogTitle: "Share Profile",
      });
    } catch (error) {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${userId}`);
      toast({
        title: "Copied to clipboard",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const handleReport = () => {
    haptics.light();
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe",
    });
  };

  return (
    <div className={isMobile ? "grid grid-cols-4 gap-2" : "grid grid-cols-4 gap-4"}>
      {/* Primary Action - Message */}
      <Button
        size="lg"
        className={isMobile ? "col-span-2 h-12 text-base font-semibold shadow-md" : "col-span-2 h-14 text-lg font-semibold shadow-md"}
        onClick={handleMessage}
      >
        <MessageCircle className={isMobile ? "w-5 h-5 mr-2" : "w-6 h-6 mr-2"} />
        Message
      </Button>

      {/* Like Button */}
      <Button
        variant="outline"
        size="lg"
        className={isMobile ? "h-12 border-2" : "h-14 border-2"}
        onClick={handleLike}
      >
        <Heart className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
      </Button>

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="lg" className={isMobile ? "h-12 border-2" : "h-14 border-2"}>
            <MoreVertical className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          {showShare && (
            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
              <Share2 className="w-4 h-4 mr-2" />
              Share Profile
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-destructive">
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
