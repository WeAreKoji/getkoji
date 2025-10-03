import { useState, useEffect } from "react";
import { MessageCircle, Heart, Share2, MoreVertical, Bookmark, Ban } from "lucide-react";
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
import { BlockUserDialog } from "./BlockUserDialog";
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
  const [isSaved, setIsSaved] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  useEffect(() => {
    checkIfLiked();
    checkIfSaved();
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

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("saved_profile_id", userId)
        .maybeSingle();

      if (error) throw error;
      setIsSaved(!!data);
    } catch (error) {
      logError(error, "ProfileActions.checkIfSaved");
    }
  };

  const handleMessage = () => {
    haptics.medium();
    navigate(`/chat/${userId}`);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      haptics.light();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save profiles",
          variant: "destructive",
        });
        return;
      }

      if (isSaved) {
        const { error } = await supabase
          .from("saved_profiles")
          .delete()
          .eq("user_id", user.id)
          .eq("saved_profile_id", userId);

        if (error) throw error;
        setIsSaved(false);
        toast({
          title: "Removed",
          description: "Profile removed from saved",
        });
      } else {
        const { error } = await supabase
          .from("saved_profiles")
          .insert({
            user_id: user.id,
            saved_profile_id: userId,
          });

        if (error) throw error;
        setIsSaved(true);
        toast({
          title: "Saved",
          description: "Profile saved successfully",
        });
      }
    } catch (error: any) {
      logError(error, "ProfileActions.handleSave");
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      setLikeLoading(true);
      haptics.medium();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to like profiles",
          variant: "destructive",
        });
        return;
      }

      if (isLiked) {
        const { error } = await supabase
          .from("profile_likes")
          .delete()
          .eq("liker_id", user.id)
          .eq("liked_id", userId);

        if (error) throw error;
        setIsLiked(false);
        toast({
          title: "Unliked",
          description: "Profile unliked",
        });
      } else {
        const { error } = await supabase.from("profile_likes").insert({
          liker_id: user.id,
          liked_id: userId,
        });

        if (error) throw error;
        setIsLiked(true);
        toast({
          title: "Liked",
          description: "Profile liked successfully",
        });
      }
    } catch (error: any) {
      logError(error, "ProfileActions.handleLike");
      toast({
        title: "Error",
        description: error.message || "Failed to like profile",
        variant: "destructive",
      });
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    haptics.light();
    const url = window.location.href;
    const text = `Check out ${displayName}'s profile`;

    const shared = await shareContent({
      title: displayName,
      text,
      url,
    });

    if (!shared) {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const handleReport = () => {
    haptics.light();
    setReportDialogOpen(true);
  };

  const handleBlock = () => {
    haptics.light();
    setBlockDialogOpen(true);
  };

  return (
    <>
      <div className={isMobile ? "grid grid-cols-5 gap-2" : "grid grid-cols-5 gap-4"}>
        {/* Primary Action - Message */}
        <Button
          size="lg"
          className={isMobile ? "col-span-2 h-12 text-base font-semibold shadow-md" : "col-span-2 h-14 text-lg font-semibold shadow-md"}
          onClick={handleMessage}
        >
          <MessageCircle className={isMobile ? "w-5 h-5 mr-2" : "w-6 h-6 mr-2"} />
          Message
        </Button>

        {/* Save Button */}
        <Button
          variant="outline"
          size="lg"
          className={cn(
            isMobile ? "h-12 border-2" : "h-14 border-2",
            isSaved && "bg-primary/10 border-primary"
          )}
          onClick={handleSave}
          disabled={saveLoading}
        >
          <Bookmark 
            className={cn(
              isMobile ? "w-5 h-5" : "w-6 h-6",
              isSaved && "fill-primary text-primary"
            )} 
          />
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
            <DropdownMenuItem onClick={handleBlock} className="cursor-pointer text-destructive">
              <Ban className="w-4 h-4 mr-2" />
              Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-destructive">
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Report Dialog */}
      <ReportProfileDialog
        userId={userId}
        displayName={displayName}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
      />

      {/* Block Dialog */}
      <BlockUserDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        userId={userId}
        displayName={displayName}
        onBlockSuccess={() => {
          toast({
            title: "User blocked",
            description: "Redirecting to discover...",
          });
          setTimeout(() => navigate("/discover"), 1000);
        }}
      />
    </>
  );
};
