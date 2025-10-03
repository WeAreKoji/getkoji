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
import { MapPin, Navigation } from "lucide-react";
import { requestLocationPermission } from "@/lib/native-location";
import { toast } from "sonner";

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted: () => void;
}

export const LocationPermissionDialog = ({
  open,
  onOpenChange,
  onPermissionGranted,
}: LocationPermissionDialogProps) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);

    try {
      const permission = await requestLocationPermission();

      if (permission.granted) {
        toast.success("Location access granted");
        onPermissionGranted();
        onOpenChange(false);
      } else if (permission.denied) {
        toast.error(
          "Location access denied. Please enable it in your device settings."
        );
      }
    } catch (error) {
      toast.error("Failed to request location permission");
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
              <MapPin className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Enable Location</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              Discover people near you and see how far away potential matches are.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
              <Navigation className="w-4 h-4" />
              <span>Your location is never shared with others</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium">Find nearby matches</h4>
              <p className="text-sm text-muted-foreground">
                See profiles of people in your area
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium">Distance information</h4>
              <p className="text-sm text-muted-foreground">
                See how far away your matches are
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium">Privacy control</h4>
              <p className="text-sm text-muted-foreground">
                Control who can see your location in settings
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
            {isRequesting ? "Requesting..." : "Enable Location"}
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
