import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Camera } from "lucide-react";
import { ImageViewer } from "@/components/media/ImageViewer";
import { haptics } from "@/lib/native";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
  enableViewer?: boolean;
}

const PhotoGrid = ({ photos, onPhotoClick, enableViewer = true }: PhotoGridProps) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Fill empty slots to always show 9 slots
  const slots = Array.from({ length: 9 }, (_, i) => photos[i] || null);

  const handlePhotoClick = (photo: Photo, index: number) => {
    haptics.light();
    
    if (onPhotoClick) {
      onPhotoClick(photo);
    } else if (enableViewer) {
      setViewerIndex(index);
      setViewerOpen(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((photo, index) => (
          <AspectRatio
            key={photo?.id || `empty-${index}`}
            ratio={1}
            className="bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => photo && handlePhotoClick(photo, index)}
          >
          {photo ? (
            <img
              src={photo.photo_url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </AspectRatio>
        ))}
      </div>

      {enableViewer && photos.length > 0 && (
        <ImageViewer
          images={photos}
          initialIndex={viewerIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}
    </>
  );
};

export default PhotoGrid;
