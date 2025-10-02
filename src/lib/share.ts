import { Share } from "@capacitor/share";
import { isNativePlatform } from "./native";

/**
 * Share utilities for native share sheet
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

export const shareContent = async (options: ShareOptions) => {
  try {
    // Use native share if available
    if (isNativePlatform()) {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle || "Share",
      });
      return true;
    }

    // Fallback to Web Share API
    if (navigator.share) {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    }

    // Fallback to clipboard
    const shareText = `${options.title || ""}\n${options.text || ""}\n${options.url || ""}`.trim();
    await navigator.clipboard.writeText(shareText);
    return true;
  } catch (error) {
    console.error("Error sharing:", error);
    throw error;
  }
};

export const canShare = () => {
  return isNativePlatform() || !!navigator.share;
};
