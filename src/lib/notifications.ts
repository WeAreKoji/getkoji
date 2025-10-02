import { PushNotifications } from "@capacitor/push-notifications";
import { isNativePlatform } from "./native";

/**
 * Push notifications utilities
 */

export const initializePushNotifications = async () => {
  if (!isNativePlatform()) {
    console.log("Push notifications only available on native platforms");
    return null;
  }

  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === "granted") {
      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // Listen for registration
      const registration = await new Promise<string>((resolve) => {
        PushNotifications.addListener("registration", (token) => {
          console.log("Push registration success, token:", token.value);
          resolve(token.value);
        });
      });

      // Listen for registration errors
      PushNotifications.addListener("registrationError", (error) => {
        console.error("Push registration error:", error);
      });

      // Listen for push notifications received
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("Push notification received:", notification);
      });

      // Listen for push notifications actions (when user taps notification)
      PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
        console.log("Push notification action performed:", notification);
      });

      return registration;
    }

    return null;
  } catch (error) {
    console.error("Error initializing push notifications:", error);
    return null;
  }
};

export const sendPushToken = async (token: string, userId: string) => {
  // TODO: Send token to your backend to store for sending notifications
  console.log("Sending push token to backend:", token, userId);
  // You would implement this based on your backend setup
};

export const removePushNotificationListeners = async () => {
  if (!isNativePlatform()) return;

  try {
    await PushNotifications.removeAllListeners();
  } catch (error) {
    console.error("Error removing push notification listeners:", error);
  }
};
