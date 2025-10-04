import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { User, Heart, Image as ImageIcon, Sparkles } from "lucide-react";
import PhotoGrid from "./PhotoGrid";
import { CreatorPostsDisplay } from "./CreatorPostsDisplay";

interface Interest {
  id: string;
  name: string;
  category: string;
}

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface ProfileAccordionProps {
  bio: string | null;
  intent: string;
  interests: Interest[];
  photos: Photo[];
  isCreator: boolean;
  userId: string;
  gender?: string | null;
  interestedInGender?: string[] | null;
  isOwnProfile?: boolean;
  showcaseBio?: string | null;
}

export const ProfileAccordion = ({ bio, intent, interests, photos, isCreator, userId, gender, interestedInGender, isOwnProfile, showcaseBio }: ProfileAccordionProps) => {
  const formatGender = (g: string) => {
    return g.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Accordion type="multiple" defaultValue={["about"]} className="space-y-3">
      {/* About */}
      <AccordionItem value="about" className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="font-semibold">About</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            {bio && (
              <div>
                <h4 className="text-sm font-medium mb-2">Bio</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
              </div>
            )}
            {isCreator && showcaseBio && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Creator Showcase
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{showcaseBio}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium mb-2">Looking For</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {intent.replace(/_/g, " ")}
              </p>
            </div>
            {gender && (
              <div>
                <h4 className="text-sm font-medium mb-2">Gender</h4>
                <p className="text-sm text-muted-foreground">
                  {formatGender(gender)}
                </p>
              </div>
            )}
            {interestedInGender && interestedInGender.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Interested In</h4>
                <div className="flex flex-wrap gap-2">
                  {interestedInGender
                    .filter(g => g === 'male' || g === 'female')
                    .map((g) => (
                      <Badge key={g} variant="secondary" className="text-xs">
                        {formatGender(g)}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Interests */}
      {interests.length > 0 && (
        <AccordionItem value="interests" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <span className="font-semibold">Interests</span>
              <Badge variant="secondary" className="text-xs ml-auto mr-2">
                {interests.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest.id} variant="secondary">
                  {interest.name}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <AccordionItem value="photos" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="font-semibold">Photos</span>
              <Badge variant="secondary" className="text-xs ml-auto mr-2">
                {photos.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <PhotoGrid photos={photos} />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Creator Posts */}
      {isCreator && (
        <AccordionItem value="posts" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold">Creator Posts</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <CreatorPostsDisplay creatorId={userId} isOwnProfile={isOwnProfile} />
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
};
