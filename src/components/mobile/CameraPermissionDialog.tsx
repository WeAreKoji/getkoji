import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { requestCameraPermissions } from "@/lib/camera";
import { toast } from "sonner";

interface CameraPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted: () => void;
}

export const CameraPermissionDialog = ({
  open,
  onOpenChange,
  onPermissionGranted,
}: CameraPermissionDialogProps) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);

    try {
      const granted = await requestCameraPermissions();

      if (granted) {
        toast.success("Camera access granted");
        onPermissionGranted();
        onOpenChange(false);
      } else {
        toast.error(
          "Camera access denied. Please enable it in your device settings."
        );
      }
    } catch (error) {
      toast.error("Failed to request camera permission");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Enable Camera</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              Take photos directly from your camera to share with your matches and on your profile.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium">Capture moments</h4>
              <p className="text-sm text-muted-foreground">
                Take photos directly from the app
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium">Quick sharing</h4>
              <p className="text-sm text-muted-foreground">
                Share photos instantly in chat or on your profile
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium">You're in control</h4>
              <p className="text-sm text-muted-foreground">
                Choose what to share, nothing is automatic
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? "Requesting..." : "Enable Camera"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
