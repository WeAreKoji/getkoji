import { useState, useEffect } from "react";
import {
  getCurrentPosition,
  checkLocationPermission,
  Coordinates,
} from "@/lib/native-location";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseLocationReturn {
  coordinates: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  refreshLocation: () => Promise<void>;
  updateProfileLocation: () => Promise<void>;
}

export const useLocation = (): UseLocationReturn => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const checkPermission = async () => {
    const permission = await checkLocationPermission();
    setHasPermission(permission.granted);
    return permission.granted;
  };

  const refreshLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hasAccess = await checkPermission();
      
      if (!hasAccess) {
        setError("Location permission not granted");
        return;
      }

      const position = await getCurrentPosition();
      
      if (position) {
        setCoordinates(position);
      } else {
        setError("Failed to get location");
      }
    } catch (err) {
      setError("Failed to get location");
      console.error("Location error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileLocation = async () => {
    if (!coordinates) {
      toast.error("Location not available");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          location_updated_at: new Date().toISOString(),
          location_sharing_enabled: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Location updated");
    } catch (err) {
      console.error("Failed to update location:", err);
      toast.error("Failed to update location");
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  return {
    coordinates,
    isLoading,
    error,
    hasPermission,
    refreshLocation,
    updateProfileLocation,
  };
};
