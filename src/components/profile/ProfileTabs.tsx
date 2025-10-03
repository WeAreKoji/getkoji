import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import PhotoGrid from "./PhotoGrid";
import { ProfileInfo } from "./ProfileInfo";
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

interface ProfileTabsProps {
  bio: string | null;
  intent: string;
  interests: Interest[];
  photos: Photo[];
  isCreator: boolean;
  userId: string;
  gender?: string | null;
  interestedInGender?: string[] | null;
  isOwnProfile?: boolean;
}

export const ProfileTabs = ({ bio, intent, interests, photos, isCreator, userId, gender, interestedInGender, isOwnProfile }: ProfileTabsProps) => {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        {isCreator && <TabsTrigger value="posts">Posts</TabsTrigger>}
      </TabsList>

      <TabsContent value="about" className="space-y-4">
        <ProfileInfo 
          bio={bio} 
          intent={intent} 
          interests={interests}
          gender={gender}
          interestedInGender={interestedInGender}
        />
      </TabsContent>

      <TabsContent value="photos">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">All Photos</h3>
          <PhotoGrid photos={photos} />
        </Card>
      </TabsContent>

      {isCreator && (
        <TabsContent value="posts">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Creator Posts</h3>
            <CreatorPostsDisplay creatorId={userId} isOwnProfile={isOwnProfile} />
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
};
