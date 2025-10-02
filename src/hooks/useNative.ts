import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { initializeNativeFeatures, haptics, statusBar, keyboard, isNativePlatform } from '@/lib/native';

/**
 * Hook to manage native features and integrate with app lifecycle
 */
export const useNative = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Initialize native features when app loads or theme changes
    const isDark = theme === 'dark';
    initializeNativeFeatures(isDark);
  }, [theme]);

  return {
    haptics,
    statusBar,
    keyboard,
    isNative: isNativePlatform()
  };
};
