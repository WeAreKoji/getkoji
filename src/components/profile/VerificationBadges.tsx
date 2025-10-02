import { useState, useEffect } from "react";
import { BadgeCheck, Mail, Phone, Camera, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VerificationBadgesProps {
  userId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  photoVerified?: boolean;
  isCreator?: boolean;
  idVerified?: boolean; // Allow manual override
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const VerificationBadges = ({
  userId,
  emailVerified = false,
  phoneVerified = false,
  photoVerified = false,
  isCreator = false,
  idVerified,
  size = "md",
  className
}: VerificationBadgesProps) => {
  const [actualIdVerified, setActualIdVerified] = useState(idVerified);

  useEffect(() => {
    // If idVerified prop is provided, use it
    if (idVerified !== undefined) {
      setActualIdVerified(idVerified);
      return;
    }

    // If userId is provided and isCreator, fetch id_verified status
    if (userId && isCreator) {
      const fetchVerificationStatus = async () => {
        const { data, error } = await supabase
          .from("creator_profiles")
          .select("id_verified")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) {
          setActualIdVerified(data.id_verified);
        }
      };

      fetchVerificationStatus();
    }
  }, [userId, isCreator, idVerified]);

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
      verified: actualIdVerified && isCreator, 
      icon: ShieldCheck, 
      label: "ID Verified",
      color: "text-green-500"
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
      color: "text-orange-500"
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
