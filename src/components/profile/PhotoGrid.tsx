import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Camera } from "lucide-react";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
}

const PhotoGrid = ({ photos, onPhotoClick }: PhotoGridProps) => {
  // Fill empty slots to always show 9 slots
  const slots = Array.from({ length: 9 }, (_, i) => photos[i] || null);

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((photo, index) => (
        <AspectRatio
          key={photo?.id || `empty-${index}`}
          ratio={1}
          className="bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => photo && onPhotoClick?.(photo)}
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
  );
};

export default PhotoGrid;
