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
}

export const ProfileInfo = ({ bio, intent, interests }: ProfileInfoProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
      {/* Bio */}
      {bio && (
        <Card className={isMobile ? "p-6 shadow-sm" : "p-8 shadow-sm lg:col-span-2"}>
          <h3 className={isMobile ? "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2" : "text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2"}>
            <Heart className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
            About
          </h3>
          <p className={isMobile ? "text-base text-foreground leading-relaxed" : "text-lg text-foreground leading-relaxed"}>{bio}</p>
        </Card>
      )}

      {/* Intent */}
      <Card className={isMobile ? "p-6 shadow-sm" : "p-8 shadow-sm"}>
        <h3 className={isMobile ? "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2" : "text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2"}>
          <Target className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
          Looking For
        </h3>
        <Badge 
          variant="secondary" 
          className={isMobile ? "text-sm px-4 py-2 font-medium" : "text-base px-6 py-3 font-medium"}
        >
          {intent.replace(/_/g, " ")}
        </Badge>
      </Card>

      {/* Interests */}
      {interests.length > 0 && (
        <Card className={isMobile ? "p-6 shadow-sm" : "p-8 shadow-sm lg:col-span-2"}>
          <h3 className={isMobile ? "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3" : "text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4"}>
            Interests
          </h3>
          <div className={isMobile ? "flex flex-wrap gap-2" : "flex flex-wrap gap-3"}>
            {interests.map((interest) => (
              <Badge 
                key={interest.id} 
                variant="outline"
                className={isMobile ? "text-sm px-3 py-1.5 border-2 hover:bg-accent/10 hover:border-accent transition-colors" : "text-base px-4 py-2 border-2 hover:bg-accent/10 hover:border-accent transition-colors"}
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
