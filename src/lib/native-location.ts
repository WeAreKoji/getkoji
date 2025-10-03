import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "./native";
import { logError } from "./error-logger";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface LocationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

/**
 * Request location permission
 */
export const requestLocationPermission = async (): Promise<LocationPermissionState> => {
  if (!isNativePlatform()) {
    return { granted: true, denied: false, prompt: false };
  }

  try {
    const permissions = await Geolocation.requestPermissions();
    return {
      granted: permissions.location === "granted",
      denied: permissions.location === "denied",
      prompt: permissions.location === "prompt",
    };
  } catch (error) {
    logError(error, 'Geolocation.requestPermissions');
    return { granted: false, denied: true, prompt: false };
  }
};

/**
 * Check current location permission status
 */
export const checkLocationPermission = async (): Promise<LocationPermissionState> => {
  if (!isNativePlatform()) {
    return { granted: true, denied: false, prompt: false };
  }

  try {
    const permissions = await Geolocation.checkPermissions();
    return {
      granted: permissions.location === "granted",
      denied: permissions.location === "denied",
      prompt: permissions.location === "prompt",
    };
  } catch (error) {
    logError(error, 'Geolocation.checkPermissions');
    return { granted: false, denied: false, prompt: true };
  }
};

/**
 * Get current GPS position
 */
export const getCurrentPosition = async (options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<Coordinates | null> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 0,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
    };
  } catch (error) {
    logError(error, 'Geolocation.getCurrentPosition');
    return null;
  }
};

/**
 * Watch position changes
 */
export const watchPosition = async (
  callback: (position: Coordinates | null) => void,
  options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
): Promise<string | null> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 5000,
      },
      (position, error) => {
        if (error) {
          logError(error, 'Geolocation.watchPosition');
          callback(null);
          return;
        }

        if (position) {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          });
        }
      }
    );

    return watchId;
  } catch (error) {
    logError(error, 'Geolocation.watchPosition');
    return null;
  }
};

/**
 * Clear position watch
 */
export const clearWatch = async (watchId: string) => {
  if (!isNativePlatform() || !watchId) return;

  try {
    await Geolocation.clearWatch({ id: watchId });
  } catch (error) {
    logError(error, 'Geolocation.clearWatch');
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number | null | undefined): string => {
  if (distanceKm === null || distanceKm === undefined) {
    return "";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }

  return `${Math.round(distanceKm)} km away`;
};
