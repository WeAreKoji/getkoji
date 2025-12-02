import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreVertical, Star, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/error-logger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface EnhancedPhotoManagementProps {
  photos: Photo[];
  userId: string;
  onPhotosUpdated: () => void;
}

interface SortablePhotoProps {
  photo: Photo;
  onSetAvatar: (photoUrl: string) => void;
  onDelete: (photoId: string) => void;
  isFirst: boolean;
}

const SortablePhoto = ({ photo, onSetAvatar, onDelete, isFirst }: SortablePhotoProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
        <img
          src={photo.photo_url}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      {/* First photo badge */}
      {isFirst && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
          Main
        </div>
      )}

      {/* Actions Menu */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSetAvatar(photo.photo_url)}>
              <Star className="w-4 h-4 mr-2" />
              Set as Avatar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(photo.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Photo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const EnhancedPhotoManagement = ({
  photos: initialPhotos,
  userId,
  onPhotosUpdated,
}: EnhancedPhotoManagementProps) => {
  const [photos, setPhotos] = useState(initialPhotos);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);

      const newPhotos = arrayMove(photos, oldIndex, newIndex).map((photo, index) => ({
        ...photo,
        order_index: index,
      }));

      setPhotos(newPhotos);

      // Update order in database
      try {
        const updates = newPhotos.map((photo) =>
          supabase
            .from("profile_photos")
            .update({ order_index: photo.order_index })
            .eq("id", photo.id)
        );

        await Promise.all(updates);
        
        toast({
          title: "Photos reordered",
          description: "Your photo order has been saved",
        });
        
        onPhotosUpdated();
      } catch (error) {
        logError(error, "EnhancedPhotoManagement.handleDragEnd");
        toast({
          title: "Error",
          description: "Failed to reorder photos",
          variant: "destructive",
        });
      }
    }
  };

  const handleSetAvatar = async (photoUrl: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: photoUrl })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      });
      
      onPhotosUpdated();
    } catch (error) {
      logError(error, "EnhancedPhotoManagement.handleSetAvatar");
      toast({
        title: "Error",
        description: "Failed to update avatar",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return;

    try {
      const { error } = await supabase
        .from("profile_photos")
        .delete()
        .eq("id", photoToDelete);

      if (error) throw error;

      setPhotos(photos.filter((p) => p.id !== photoToDelete));
      
      toast({
        title: "Photo deleted",
        description: "Your photo has been removed",
      });
      
      onPhotosUpdated();
    } catch (error) {
      logError(error, "EnhancedPhotoManagement.handleDelete");
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    }
  };

  const handleDelete = (photoId: string) => {
    setPhotoToDelete(photoId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card className="p-4 md:p-6">
        <h3 className="font-semibold text-base mb-2">Manage Photos</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Drag to reorder • First photo appears on your profile
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  onSetAvatar={handleSetAvatar}
                  onDelete={handleDelete}
                  isFirst={index === 0}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
