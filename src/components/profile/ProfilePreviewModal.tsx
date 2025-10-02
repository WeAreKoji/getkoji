import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileHero } from "./ProfileHero";
import { ProfileInfo } from "./ProfileInfo";
import { Eye } from "lucide-react";

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
    display_name: string;
    age: number;
    city: string | null;
    bio: string | null;
    intent: string;
  };
  photos: Photo[];
  interests: Interest[];
  isCreator: boolean;
}

export const ProfilePreviewModal = ({
  open,
  onOpenChange,
  profile,
  photos,
  interests,
  isCreator,
}: ProfilePreviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Public Profile Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ProfileHero
            photos={photos}
            displayName={profile.display_name}
            age={profile.age}
            city={profile.city}
            isCreator={isCreator}
          />

          <ProfileInfo
            bio={profile.bio}
            intent={profile.intent}
            interests={interests}
          />

          <p className="text-sm text-muted-foreground text-center">
            This is how other users see your profile
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
