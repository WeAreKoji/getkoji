import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id?: string;
  photo_url: string;
  order_index: number;
  isNew?: boolean;
}

interface PhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

const PhotoUpload = ({ photos, onPhotosChange, maxPhotos = 9 }: PhotoUploadProps) => {
  const { toast } = useToast();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = maxPhotos - photos.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Too many photos",
        description: `You can only upload ${remainingSlots} more photo(s)`,
        variant: "destructive",
      });
      return;
    }

    const newPhotos: Photo[] = [];
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push({
          photo_url: reader.result as string,
          order_index: photos.length + index,
          isNew: true,
        });

        if (newPhotos.length === files.length) {
          onPhotosChange([...photos, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    const updatedPhotos = photos
      .filter((_, i) => i !== index)
      .map((photo, i) => ({ ...photo, order_index: i }));
    onPhotosChange(updatedPhotos);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedPhotos = [...photos];
    const draggedPhoto = updatedPhotos[draggedIndex];
    updatedPhotos.splice(draggedIndex, 1);
    updatedPhotos.splice(dropIndex, 0, draggedPhoto);

    const reorderedPhotos = updatedPhotos.map((photo, i) => ({
      ...photo,
      order_index: i,
    }));

    onPhotosChange(reorderedPhotos);
    setDraggedIndex(null);
  };

  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] || null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {slots.map((photo, index) => (
          <AspectRatio
            key={photo?.id || `slot-${index}`}
            ratio={1}
            className="bg-muted rounded-lg overflow-hidden"
            draggable={!!photo}
            onDragStart={() => photo && handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
          >
            {photo ? (
              <div className="relative w-full h-full group">
                <img
                  src={photo.photo_url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : index === photos.length ? (
              <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                <Camera className="w-8 h-8 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                <Camera className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
          </AspectRatio>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {photos.length}/{maxPhotos} photos • Drag to reorder
      </p>
    </div>
  );
};

export default PhotoUpload;
