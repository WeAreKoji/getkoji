import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Utility functions for native mobile features
 */

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Status Bar utilities
 */
export const statusBar = {
  setStyleDark: async () => {
    if (!isNativePlatform()) return;
    await StatusBar.setStyle({ style: Style.Dark });
  },

  setStyleLight: async () => {
    if (!isNativePlatform()) return;
    await StatusBar.setStyle({ style: Style.Light });
  },

  hide: async () => {
    if (!isNativePlatform()) return;
    await StatusBar.hide();
  },

  show: async () => {
    if (!isNativePlatform()) return;
    await StatusBar.show();
  },

  setBackgroundColor: async (color: string) => {
    if (!isNativePlatform() || getPlatform() !== 'android') return;
    await StatusBar.setBackgroundColor({ color });
  }
};

/**
 * Haptic Feedback utilities
 */
export const haptics = {
  // Light tap feedback (for button taps, selections)
  light: async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  },

  // Medium impact (for swipe actions, toggles)
  medium: async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  },

  // Heavy impact (for important actions, errors)
  heavy: async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  },

  // Selection feedback (for scrolling through items)
  selection: async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  },

  // Success notification (for matches, successful actions)
  success: async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  },

  // Warning notification
  warning: async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  },

  // Error notification
  error: async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  }
};

/**
 * Keyboard utilities
 */
export const keyboard = {
  hide: async () => {
    if (!isNativePlatform()) return;
    await Keyboard.hide();
  },

  show: async () => {
    if (!isNativePlatform()) return;
    await Keyboard.show();
  },

  addListener: (callback: (info: { keyboardHeight: number }) => void) => {
    if (!isNativePlatform()) return;
    
    Keyboard.addListener('keyboardWillShow', (info) => {
      callback({ keyboardHeight: info.keyboardHeight });
    });

    Keyboard.addListener('keyboardWillHide', () => {
      callback({ keyboardHeight: 0 });
    });
  },

  removeAllListeners: async () => {
    if (!isNativePlatform()) return;
    await Keyboard.removeAllListeners();
  }
};

/**
 * Initialize native features based on app theme
 */
export const initializeNativeFeatures = async (isDark: boolean) => {
  if (!isNativePlatform()) return;

  // Hide splash screen with animation
  try {
    await SplashScreen.hide({
      fadeOutDuration: 300,
    });
  } catch (error) {
    console.error("Error hiding splash screen:", error);
  }

  // Set status bar style based on theme
  if (isDark) {
    await statusBar.setStyleLight();
    await statusBar.setBackgroundColor('#1a0f28'); // Dark theme background
  } else {
    await statusBar.setStyleDark();
    await statusBar.setBackgroundColor('#ffffff'); // Light theme background
  }
};
