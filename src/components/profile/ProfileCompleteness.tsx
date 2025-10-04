import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ProfileCompletenessProps {
  profile: {
    username: string | null;
    bio: string | null;
    city: string | null;
  };
  photosCount: number;
  interestsCount: number;
  isCreator?: boolean;
  creatorData?: {
    tagline: string | null;
    showcase_bio: string | null;
    welcome_video_url: string | null;
  };
}

export const ProfileCompleteness = ({ 
  profile, 
  photosCount, 
  interestsCount,
  isCreator = false,
  creatorData
}: ProfileCompletenessProps) => {
  const baseChecks = [
    { label: "Add profile photo", completed: photosCount > 0 },
    { label: "Add at least 3 photos", completed: photosCount >= 3 },
    { label: "Write a bio", completed: !!profile.bio },
    { label: "Set username", completed: !!profile.username },
    { label: "Add city", completed: !!profile.city },
    { label: "Select 5+ interests", completed: interestsCount >= 5 },
  ];

  const creatorChecks = isCreator ? [
    { label: "Add welcome video", completed: !!creatorData?.welcome_video_url },
    { label: "Write creator tagline", completed: !!creatorData?.tagline },
    { label: "Write showcase bio", completed: !!creatorData?.showcase_bio },
  ] : [];

  const checks = [...baseChecks, ...creatorChecks];

  const completedCount = checks.filter(c => c.completed).length;
  const percentage = Math.round((completedCount / checks.length) * 100);

  if (percentage === 100) return null;

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base md:text-lg">Complete Your Profile</h3>
          <span className="text-sm md:text-base font-bold text-primary">{percentage}%</span>
        </div>

        <Progress value={percentage} className="h-2" />

        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-3">
              {check.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={check.completed ? "text-muted-foreground text-sm md:text-base" : "text-foreground text-sm md:text-base"}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        {percentage < 100 && (
          <Link to="/profile/edit" className="block mt-4">
            <Button variant="outline" className="w-full">
              Complete Profile
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};
