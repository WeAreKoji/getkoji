import { BadgeCheck, Mail, Phone, Camera } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerificationBadgesProps {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  photoVerified?: boolean;
  isCreator?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const VerificationBadges = ({
  emailVerified = false,
  phoneVerified = false,
  photoVerified = false,
  isCreator = false,
  size = "md",
  className
}: VerificationBadgesProps) => {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const iconSize = sizeClasses[size];

  const badges = [
    { 
      verified: isCreator, 
      icon: BadgeCheck, 
      label: "Verified Creator",
      color: "text-primary"
    },
    { 
      verified: emailVerified, 
      icon: Mail, 
      label: "Email Verified",
      color: "text-blue-500"
    },
    { 
      verified: phoneVerified, 
      icon: Phone, 
      label: "Phone Verified",
      color: "text-green-500"
    },
    { 
      verified: photoVerified, 
      icon: Camera, 
      label: "Photo Verified",
      color: "text-purple-500"
    },
  ].filter(badge => badge.verified);

  if (badges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {badges.map((badge, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <badge.icon className={cn(iconSize, badge.color, "flex-shrink-0")} />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{badge.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
