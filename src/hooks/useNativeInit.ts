import { useEffect } from "react";
import { useTheme } from "next-themes";
import { initializeNativeFeatures } from "@/lib/native";
import { initializePushNotifications } from "@/lib/notifications";

/**
 * Hook to initialize all native features on app start
 */
export const useNativeInit = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const init = async () => {
      const isDark = theme === "dark";
      
      // Initialize status bar, splash screen, etc.
      await initializeNativeFeatures(isDark);
      
      // Initialize push notifications (optional)
      // Uncomment when ready to use push notifications
      // const token = await initializePushNotifications();
      // if (token) {
      //   console.log("Push notification token:", token);
      //   // Send token to your backend
      // }
    };

    init();
  }, [theme]);
};
