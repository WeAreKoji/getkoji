import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ProfileHero } from "./ProfileHero";
import { ProfileTabs } from "./ProfileTabs";
import { ProfileInfoBar } from "./ProfileInfoBar";
import { ProfileAccordion } from "./ProfileAccordion";
import { CreatorSubscriptionCard } from "./CreatorSubscriptionCard";
import { VerificationBadges } from "./VerificationBadges";
import { Eye, Lock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface Interest {
  id: string;
  name: string;
  category: string;
}

interface ProfilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    display_name: string;
    username: string | null;
    age: number;
    city: string | null;
    bio: string | null;
    intent: string;
    created_at?: string;
    privacy_settings?: any;
  };
  photos: Photo[];
  interests: Interest[];
  isCreator: boolean;
  showcaseBio?: string | null;
}

export const ProfilePreviewModal = ({
  open,
  onOpenChange,
  profile,
  photos,
  interests,
  isCreator,
  showcaseBio,
}: ProfilePreviewModalProps) => {
  const isMobile = useIsMobile();
  const memberSince = profile.created_at 
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : "";

  const privacySettings = profile.privacy_settings || {};
  const showAge = privacySettings.show_age !== false;
  const showLocation = privacySettings.show_location !== false;
  const showInterests = privacySettings.show_interests !== false;
  const showPhotos = privacySettings.show_photos !== false;

  const content = (
    <div className="space-y-4">
      {/* Hero Section */}
      <ProfileHero
        photos={showPhotos ? photos : []}
        displayName={profile.display_name}
        age={showAge ? profile.age : 0}
        city={showLocation ? profile.city : null}
        isCreator={isCreator}
      />

      {/* Username & Verification */}
      {profile.username && (
        <div className="flex items-center justify-between px-4 md:px-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">@{profile.username}</span>
            <VerificationBadges 
              isCreator={isCreator}
              emailVerified={true}
              size="sm"
            />
          </div>
          {memberSince && (
            <span className="text-xs text-muted-foreground">Member since {memberSince}</span>
          )}
        </div>
      )}

      {/* Creator Subscription Card */}
      {isCreator && (
        <div className="px-4 md:px-0">
          <CreatorSubscriptionCard creatorId={profile.id} isOwnProfile={false} />
        </div>
      )}

      {/* Privacy Notice */}
      {(!showAge || !showLocation || !showInterests || !showPhotos) && (
        <div className="px-4 md:px-0">
          <Badge variant="secondary" className="w-full justify-center py-2 text-xs">
            <Lock className="w-3 h-3 mr-2" />
            Some information is hidden based on your privacy settings
          </Badge>
        </div>
      )}

      {/* Content - Accordion on Mobile, Tabs on Desktop */}
      <div className="px-4 md:px-0">
        {isMobile ? (
          <ProfileAccordion
            bio={profile.bio}
            intent={profile.intent}
            interests={showInterests ? interests : []}
            photos={showPhotos ? photos : []}
            isCreator={isCreator}
            userId={profile.id}
            showcaseBio={showcaseBio}
          />
        ) : (
          <ProfileTabs
            bio={profile.bio}
            intent={profile.intent}
            interests={showInterests ? interests : []}
            photos={showPhotos ? photos : []}
            isCreator={isCreator}
            userId={profile.id}
          />
        )}
      </div>

      {/* Footer Note */}
      <p className="text-sm text-muted-foreground text-center px-4 md:px-0 pb-4">
        This is how other users see your profile
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 justify-center">
              <Eye className="w-5 h-5" />
              Public Profile Preview
            </DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Public Profile Preview
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
