import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNativePlatform } from "./native";

/**
 * Camera utilities for native photo capture
 */

export interface CameraOptions {
  source?: "camera" | "photos" | "prompt";
  quality?: number;
  allowEditing?: boolean;
  resultType?: "uri" | "base64" | "dataUrl";
}

export const takePhoto = async (options: CameraOptions = {}) => {
  if (!isNativePlatform()) {
    throw new Error("Camera is only available on native platforms");
  }

  try {
    const sourceMap = {
      camera: CameraSource.Camera,
      photos: CameraSource.Photos,
      prompt: CameraSource.Prompt,
    };

    const resultTypeMap = {
      uri: CameraResultType.Uri,
      base64: CameraResultType.Base64,
      dataUrl: CameraResultType.DataUrl,
    };

    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: resultTypeMap[options.resultType || "uri"],
      source: sourceMap[options.source || "prompt"],
    });

    return image;
  } catch (error) {
    console.error("Error taking photo:", error);
    throw error;
  }
};

export const requestCameraPermissions = async () => {
  if (!isNativePlatform()) return true;

  try {
    const permissions = await Camera.requestPermissions();
    return permissions.camera === "granted";
  } catch (error) {
    console.error("Error requesting camera permissions:", error);
    return false;
  }
};

export const checkCameraPermissions = async () => {
  if (!isNativePlatform()) return true;

  try {
    const permissions = await Camera.checkPermissions();
    return permissions.camera === "granted";
  } catch (error) {
    console.error("Error checking camera permissions:", error);
    return false;
  }
};
