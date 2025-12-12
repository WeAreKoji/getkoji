// Build version - updated automatically with each deployment
export const APP_VERSION = '1.0.0';
export const BUILD_TIMESTAMP = new Date().toISOString();

// Log version on app startup
export const logVersion = () => {
  console.log(`🚀 Koji App v${APP_VERSION} | Built: ${BUILD_TIMESTAMP}`);
};
