import { PushNotifications } from "@capacitor/push-notifications";
import { isNativePlatform } from "./native";
import { logError, logInfo } from "./error-logger";

/**
 * Push notifications utilities
 */

export const initializePushNotifications = async () => {
  if (!isNativePlatform()) {
    logInfo("Push notifications only available on native platforms", "PushNotifications");
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
          logInfo(`Push registration success`, "PushNotifications");
          resolve(token.value);
        });
      });

      // Listen for registration errors
      PushNotifications.addListener("registrationError", (error) => {
        logError(error, "PushNotifications.registration");
      });

      // Listen for push notifications received
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        logInfo("Push notification received", "PushNotifications");
      });

      // Listen for push notifications actions (when user taps notification)
      PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
        logInfo("Push notification action performed", "PushNotifications");
      });

      return registration;
    }

    return null;
  } catch (error) {
    logError(error, "PushNotifications.initialize");
    return null;
  }
};

export const sendPushToken = async (token: string, userId: string) => {
  // TODO: Send token to your backend to store for sending notifications
  logInfo("Push token ready for backend", "PushNotifications");
  // You would implement this based on your backend setup
};

export const removePushNotificationListeners = async () => {
  if (!isNativePlatform()) return;

  try {
    await PushNotifications.removeAllListeners();
  } catch (error) {
    logError(error, "PushNotifications.removeListeners");
  }
};
