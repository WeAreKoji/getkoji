import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, X } from "lucide-react";

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
}

interface PostEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
  post: Post | null;
}

const PostEditDialog = ({
  open,
  onOpenChange,
  onPostUpdated,
  post,
}: PostEditDialogProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setMediaUrl(post.media_url || "");
      setMediaType(post.media_type);
      setRemoveExistingMedia(false);
    }
  }, [post]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    setRemoveExistingMedia(true);
  };

  const handleRemoveMedia = () => {
    if (mediaUrl && mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl("");
    setMediaType(null);
    setSelectedFile(null);
    setRemoveExistingMedia(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add a caption for your post",
        variant: "destructive",
      });
      return;
    }

    if (!post) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let uploadedMediaUrl = post.media_url;
      let updatedMediaType = post.media_type;

      // Upload new file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("creator-content")
          .upload(fileName, selectedFile, {
            contentType: selectedFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("creator-content")
          .getPublicUrl(uploadData.path);

        uploadedMediaUrl = publicUrl;
        updatedMediaType = mediaType;
      } else if (removeExistingMedia) {
        uploadedMediaUrl = null;
        updatedMediaType = null;
      }

      const { error } = await supabase
        .from("creator_posts")
        .update({
          content,
          media_url: uploadedMediaUrl,
          media_type: updatedMediaType,
        })
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Post updated!",
        description: "Your changes have been saved",
      });

      if (mediaUrl && mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }

      onOpenChange(false);
      onPostUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Photo/Video (Optional)</Label>
            {mediaUrl ? (
              <div className="relative mt-2">
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Upload preview"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveMedia}
                  aria-label="Remove media"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <div className="text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload photo or video
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 10MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </div>

          <div>
            <Label htmlFor="content">Caption *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something with your subscribers..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {content.length}/2000
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;
