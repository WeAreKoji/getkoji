import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { shareContent, canShare } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";
import { haptics } from "@/lib/native";

interface ShareProfileProps {
  userId: string;
  displayName: string;
}

export const ShareProfile = ({ userId, displayName }: ShareProfileProps) => {
  const { toast } = useToast();
  const showShare = canShare();

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
      toast({
        title: "Copied to clipboard",
        description: "Profile link copied to clipboard",
      });
    }
  };

  if (!showShare) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="w-4 h-4" />
      Share Profile
    </Button>
  );
};
