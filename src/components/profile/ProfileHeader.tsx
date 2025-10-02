import { Link } from "react-router-dom";
import { ArrowLeft, MoreVertical, Edit, CreditCard, LayoutDashboard, Settings, Share2, Gift, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { haptics } from "@/lib/native";
import { shareContent, canShare } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";

interface ProfileHeaderProps {
  isOwnProfile: boolean;
  isCreator: boolean;
  userId: string;
  username: string | null;
  displayName: string;
}

export const ProfileHeader = ({ isOwnProfile, isCreator, userId, username, displayName }: ProfileHeaderProps) => {
  const { toast } = useToast();
  const showShare = canShare();

  const handleShare = async () => {
    const profileUrl = username 
      ? `${window.location.origin}/@${username}`
      : `${window.location.origin}/profile/${userId}`;
    
    try {
      haptics.light();
      await shareContent({
        title: `Check out ${displayName} on Koji`,
        text: `I found ${displayName}'s profile on Koji!`,
        url: profileUrl,
        dialogTitle: "Share Profile",
      });
    } catch (error) {
      navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Copied to clipboard",
        description: "Profile link copied to clipboard",
      });
    }
  };

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-50 px-4 h-14 flex items-center justify-between">
      <Link to="/discover" aria-label="Back to discover" onClick={() => haptics.light()}>
        <Button variant="ghost" size="icon" className="hover:bg-accent/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Link>

      {isOwnProfile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-accent/10">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover">
            <DropdownMenuItem asChild>
              <Link to="/profile/edit" className="flex items-center cursor-pointer" onClick={() => haptics.light()}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/subscriptions" className="flex items-center cursor-pointer" onClick={() => haptics.light()}>
                <CreditCard className="w-4 h-4 mr-2" />
                Subscriptions
              </Link>
            </DropdownMenuItem>
            {isCreator && (
              <DropdownMenuItem asChild>
                <Link to="/creator/dashboard" className="flex items-center cursor-pointer" onClick={() => haptics.light()}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
            )}
            {showShare && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/referrals" className="flex items-center cursor-pointer" onClick={() => haptics.light()}>
                <Gift className="w-4 h-4 mr-2" />
                Referrals
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/privacy" className="flex items-center cursor-pointer" onClick={() => haptics.light()}>
                <Shield className="w-4 h-4 mr-2" />
                Privacy
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/support" className="flex items-center cursor-pointer" onClick={() => haptics.light()}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
};
