import { SplashScreen } from "@capacitor/splash-screen";
import { isNativePlatform } from "./native";

/**
 * Splash screen utilities
 */

export const hideSplash = async () => {
  if (!isNativePlatform()) return;

  try {
    await SplashScreen.hide({
      fadeOutDuration: 300,
    });
  } catch (error) {
    console.error("Error hiding splash screen:", error);
  }
};

export const showSplash = async () => {
  if (!isNativePlatform()) return;

  try {
    await SplashScreen.show({
      showDuration: 2000,
      fadeInDuration: 300,
      fadeOutDuration: 300,
      autoHide: true,
    });
  } catch (error) {
    console.error("Error showing splash screen:", error);
  }
};
