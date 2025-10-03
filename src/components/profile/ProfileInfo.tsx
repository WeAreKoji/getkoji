import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Target, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Interest {
  id: string;
  name: string;
  category: string;
}

interface ProfileInfoProps {
  bio: string | null;
  intent: string;
  interests: Interest[];
  gender?: string | null;
  interestedInGender?: string[] | null;
}

export const ProfileInfo = ({ bio, intent, interests, gender, interestedInGender }: ProfileInfoProps) => {
  const isMobile = useIsMobile();
  
  const formatGender = (g: string) => {
    return g.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <div className={isMobile ? "space-y-4" : "space-y-4"}>
      {/* Bio and Intent - Side by Side on Desktop */}
      <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
        {/* Bio */}
        {bio && (
          <Card className="p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              About
            </h3>
            <p className="text-base text-foreground leading-relaxed">{bio}</p>
          </Card>
        )}

        {/* Intent */}
        <Card className="p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Looking For
          </h3>
          <Badge 
            variant="secondary" 
            className="text-sm px-4 py-2 font-medium"
          >
            {intent.replace(/_/g, " ")}
          </Badge>
        </Card>
      </div>

      {/* Gender Info */}
      {(gender || (interestedInGender && interestedInGender.length > 0)) && (
        <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
          {gender && (
            <Card className="p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Gender
              </h3>
              <Badge variant="secondary" className="text-sm px-4 py-2 font-medium">
                {formatGender(gender)}
              </Badge>
            </Card>
          )}
          
          {interestedInGender && interestedInGender.length > 0 && (
            <Card className="p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Interested In
              </h3>
              <div className="flex flex-wrap gap-2">
                {interestedInGender
                  .filter(g => g === 'male' || g === 'female')
                  .map((g) => (
                    <Badge key={g} variant="secondary" className="text-sm px-3 py-1.5">
                      {formatGender(g)}
                    </Badge>
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Interests - Full Width */}
      {interests.length > 0 && (
        <Card className="p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge 
                key={interest.id} 
                variant="outline"
                className="text-sm px-3 py-1.5 border-2 hover:bg-accent/10 hover:border-accent transition-colors"
              >
                {interest.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
