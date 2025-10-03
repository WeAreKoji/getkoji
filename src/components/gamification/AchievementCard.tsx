import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned?: boolean;
  progress?: number;
  requirement_value?: number;
}

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const progressPercent = achievement.earned 
    ? 100 
    : achievement.progress && achievement.requirement_value
    ? (achievement.progress / achievement.requirement_value) * 100
    : 0;

  return (
    <Card className={`p-4 transition-all ${achievement.earned ? 'border-primary' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className="text-4xl">{achievement.icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold">{achievement.name}</h3>
            {!achievement.earned && <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
          
          {!achievement.earned && (
            <Progress value={progressPercent} className="h-2 mb-2" />
          )}
          
          <div className="flex items-center justify-between">
            <Badge variant={achievement.earned ? "default" : "secondary"}>
              {achievement.points} points
            </Badge>
            {!achievement.earned && achievement.progress !== undefined && (
              <span className="text-xs text-muted-foreground">
                {achievement.progress} / {achievement.requirement_value}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
