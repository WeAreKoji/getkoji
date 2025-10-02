import { Calendar, Users, FileText, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ProfileInfoBarProps {
  memberSince: string;
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
  isCreator, 
  stats, 
  loading,
  children 
}: ProfileInfoBarProps) => {
  return (
    <Card className="p-6 shadow-sm">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Member Since */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Member since {memberSince}</span>
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
