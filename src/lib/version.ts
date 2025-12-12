// Build version - updated with each significant change
export const APP_VERSION = '1.0.1';
export const BUILD_TIMESTAMP = '2024-12-12T08:35:00Z';

// Log version on app startup
export const logVersion = () => {
  console.log(`🚀 Koji App v${APP_VERSION} | Built: ${BUILD_TIMESTAMP}`);
  console.log('✅ SWIPE FIX VERSION - thresholds: 50px / 0.2 velocity');
};
