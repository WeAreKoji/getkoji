import { useState } from "react";
import { MapPin, BadgeCheck } from "lucide-react";
import { ImageViewer } from "@/components/media/ImageViewer";
import { haptics } from "@/lib/native";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface ProfileHeroProps {
  photos: Photo[];
  displayName: string;
  age: number;
  city: string | null;
  isCreator?: boolean;
}

export const ProfileHero = ({ photos, displayName, age, city, isCreator }: ProfileHeroProps) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

  const handlePhotoClick = (index: number) => {
    haptics.light();
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  const mainPhoto = photos[0] || null;

  return (
    <>
      <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-primary/20 to-secondary/20">
        {/* Main Photo */}
        {mainPhoto ? (
          <img
            src={mainPhoto.photo_url}
            alt={displayName}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handlePhotoClick(0)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No photos yet</p>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Photo Counter */}
        {photos.length > 0 && (
          <div className={cn(
            "absolute right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium",
            isMobile ? "top-2 text-xs px-2 py-0.5" : "top-4 text-sm"
          )}>
            {currentIndex + 1} / {photos.length}
          </div>
        )}

        {/* Photo Dots Indicator */}
        {photos.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 px-4">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => handlePhotoClick(index)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  index === currentIndex 
                    ? "bg-white w-8" 
                    : "bg-white/50 w-1 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}

        {/* Name and Location Overlay */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 text-white",
          isMobile ? "p-4" : "p-6"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <h1 className={cn(
              "font-bold drop-shadow-lg",
              isMobile ? "text-2xl" : "text-4xl"
            )}>
              {displayName}, {age}
            </h1>
            {isCreator && (
              <BadgeCheck className={cn(
                "text-accent drop-shadow-lg",
                isMobile ? "w-5 h-5" : "w-6 h-6"
              )} />
            )}
          </div>
          {city && (
            <div className={cn(
              "flex items-center gap-2 text-white/90 drop-shadow-lg",
              isMobile ? "text-sm" : "text-base"
            )}>
              <MapPin className={cn(isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
              <span>{city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      {photos.length > 0 && (
        <ImageViewer
          images={photos}
          initialIndex={currentIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}
    </>
  );
};
