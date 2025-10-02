import { Calendar, Users, FileText, DollarSign, Link as LinkIcon, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { haptics } from "@/lib/native";

interface ProfileInfoBarProps {
  memberSince: string;
  username: string | null;
  userId: string;
  isCreator: boolean;
  stats?: {
    subscribers?: number;
    posts?: number;
    earnings?: number;
  };
  loading?: boolean;
  children?: React.ReactNode; // For action buttons
}

export const ProfileInfoBar = ({ 
  memberSince,
  username,
  userId,
  isCreator, 
  stats, 
  loading,
  children 
}: ProfileInfoBarProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    haptics.light();
    const profileUrl = username 
      ? `${window.location.origin}/@${username}`
      : `${window.location.origin}/profile/${userId}`;
    
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Profile link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 shadow-sm">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Member Since + Username */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Member since {memberSince}</span>
          </div>
          
          {username && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">@{username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-7 px-2"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <LinkIcon className="w-3 h-3" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Center: Stats (if creator) */}
        {isCreator && (
          <div className="flex items-center gap-6">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-20" />
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{stats?.subscribers || 0}</span>
                  <span className="text-xs text-muted-foreground">Subscribers</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-semibold">{stats?.posts || 0}</span>
                  <span className="text-xs text-muted-foreground">Posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold">${stats?.earnings || 0}</span>
                  <span className="text-xs text-muted-foreground">Earnings</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: Action Button */}
        <div className="ml-auto">
          {children}
        </div>
      </div>
    </Card>
  );
};
