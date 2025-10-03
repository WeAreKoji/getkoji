import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/error-logger";
import { ReportProfileDialog } from "./ReportProfileDialog";
import { cn } from "@/lib/utils";

interface ProfileActionsProps {
  userId: string;
  displayName: string;
}

export const ProfileActions = ({ userId, displayName }: ProfileActionsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const showShare = canShare();
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [userId]);

  const checkIfLiked = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profile_likes")
        .select("id")
        .eq("liker_id", user.id)
        .eq("liked_id", userId)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error) {
      logError(error, "ProfileActions.checkIfLiked");
    }
  };

  const handleMessage = () => {
    haptics.medium();
    navigate(`/chat/${userId}`);
  };

  const handleLike = async () => {
    if (likeLoading) return;
    
    try {
      haptics.light();
      setLikeLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to like profiles",
          variant: "destructive",
        });
        return;
      }

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("profile_likes")
          .delete()
          .eq("liker_id", user.id)
          .eq("liked_id", userId);

        if (error) throw error;

        setIsLiked(false);
        toast({
          title: "Unliked",
          description: `You unliked ${displayName}'s profile`,
        });
      } else {
        // Like
        const { error } = await supabase
          .from("profile_likes")
          .insert({
            liker_id: user.id,
            liked_id: userId,
          });

        if (error) throw error;

        setIsLiked(true);
        toast({
          title: "Liked!",
          description: `You liked ${displayName}'s profile`,
        });
      }
    } catch (error) {
      logError(error, "ProfileActions.handleLike");
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLikeLoading(false);
    }
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
    setReportDialogOpen(true);
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
        className={cn(
          isMobile ? "h-12 border-2" : "h-14 border-2",
          isLiked && "bg-primary/10 border-primary"
        )}
        onClick={handleLike}
        disabled={likeLoading}
      >
        <Heart 
          className={cn(
            isMobile ? "w-5 h-5" : "w-6 h-6",
            isLiked && "fill-primary text-primary"
          )} 
        />
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

      {/* Report Dialog */}
      <ReportProfileDialog
        userId={userId}
        displayName={displayName}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
      />
    </div>
  );
};
