import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PhotoGrid from "./PhotoGrid";

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
}

export const ProfileTabs = ({ bio, intent, interests, photos, isCreator, userId }: ProfileTabsProps) => {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        {isCreator && <TabsTrigger value="posts">Posts</TabsTrigger>}
      </TabsList>

      <TabsContent value="about" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bio */}
          {bio && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-muted-foreground leading-relaxed">{bio}</p>
            </Card>
          )}

          {/* Looking For */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Looking For</h3>
            <p className="text-muted-foreground capitalize">
              {intent.replace(/_/g, " ")}
            </p>
          </Card>
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest.id} variant="secondary">
                  {interest.name}
                </Badge>
              ))}
            </div>
          </Card>
        )}
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
            <p className="text-muted-foreground">
              Subscribe to see exclusive content from this creator
            </p>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
};
