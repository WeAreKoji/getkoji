# Native Mobile Features Guide

This guide covers all implemented native mobile features for the Koji app.

## 📱 Phases Implemented

### ✅ Phase 1: Capacitor Setup & Native Foundation
- Capacitor core with iOS and Android support
- Status bar management (auto-adjusts to theme)
- Haptic feedback system
- Keyboard handling with auto-scroll
- Safe area support for notches/home indicators

### ✅ Phase 2: Swipe Gestures on Discovery
- Drag-to-swipe card interactions
- Visual feedback (rotation, opacity, indicators)
- Haptic feedback on swipe actions
- Button fallbacks for accessibility

### ✅ Phase 3: Native Page Transitions
- Smooth slide animations between pages
- Fade transitions for modals
- Spring-based physics for natural feel

### ✅ Phase 4: Gesture Navigation
- Swipe-from-left-edge to go back
- Visual feedback during gesture
- Works on Chat and other pages

### ✅ Phase 5: Haptic Feedback System
Integrated throughout the app:
- Light taps (buttons, selections)
- Medium impacts (swipes, toggles)
- Success notifications (matches)
- All navigation actions

### ✅ Phase 7: Native Image Viewer
- Full-screen image viewing
- Pinch-to-zoom support
- Swipe between images
- Photo counter display

### ✅ Phase 8: Enhanced Chat Experience
- Auto-focus message input
- Keyboard height tracking
- Scroll-to-bottom button
- Safe area padding for home indicator

### ✅ Phase 9: Safe Area & Status Bar
- Bottom nav respects home indicator
- Dialogs/sheets avoid notches
- Status bar adapts to theme
- Full safe area handling

### ✅ Phase 10: Performance Optimizations
- Lazy loading for images
- Infinite scroll support
- React.memo for optimization
- Service worker caching
- Proper loading states

### ✅ Phase 11: Offline Support
- Service worker for offline caching
- Online/offline detection
- Offline indicator UI
- Action queueing system
- Cache management utilities

### ✅ Phase 12: App Polish
- Splash screen configuration
- PWA manifest
- Service worker registration
- Share functionality
- Mobile-optimized viewport

### ✅ Phase 13: Native Features
- Push notifications setup
- Camera integration
- Share sheet support
- Native app capabilities

## 🚀 Running on Physical Devices

### Prerequisites
1. Export project to GitHub
2. Git pull locally
3. Run `npm install`

### iOS Setup
```bash
npx cap add ios
npx cap update ios
npm run build
npx cap sync
npx cap run ios
```

**Requirements:** Mac with Xcode installed

### Android Setup
```bash
npx cap add android
npx cap update android
npm run build
npx cap sync
npx cap run android
```

**Requirements:** Android Studio installed

## 📚 API Reference

### Haptics
```typescript
import { haptics } from "@/lib/native";

await haptics.light();    // Button taps
await haptics.medium();   // Swipe actions
await haptics.heavy();    // Important actions
await haptics.success();  // Successful matches
await haptics.warning();  // Warnings
await haptics.error();    // Errors
```

### Camera
```typescript
import { takePhoto, requestCameraPermissions } from "@/lib/camera";

const hasPermission = await requestCameraPermissions();
const photo = await takePhoto({
  source: "camera", // "camera" | "photos" | "prompt"
  quality: 90,
  allowEditing: false,
});
```

### Share
```typescript
import { shareContent } from "@/lib/share";

await shareContent({
  title: "Check out this profile!",
  text: "I found someone awesome on Koji",
  url: "https://koji.app/profile/123",
});
```

### Offline Status
```typescript
import { useOnlineStatus, offlineQueue } from "@/lib/offline";

const isOnline = useOnlineStatus();

// Queue actions when offline
if (!isOnline) {
  offlineQueue.add({
    type: "message",
    data: { content: "Hello!" },
  });
}
```

### Notifications
```typescript
import { initializePushNotifications } from "@/lib/notifications";

const token = await initializePushNotifications();
// Send token to your backend
```

## 🎨 Components

### OfflineIndicator
Automatically shows when offline:
```tsx
<OfflineIndicator />
```

### PageTransition
Wrap pages for animated transitions:
```tsx
<PageTransition type="slide">
  <YourPage />
</PageTransition>
```

### BackGesture
Add swipe-back navigation:
```tsx
<BackGesture>
  <YourContent />
</BackGesture>
```

### ImageViewer
Full-screen image viewing:
```tsx
<ImageViewer
  images={photos}
  initialIndex={0}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### ShareProfile
Share button component:
```tsx
<ShareProfile
  userId={user.id}
  displayName={user.name}
/>
```

## 🔧 Configuration

### Capacitor Config
Located in `capacitor.config.ts`:
- App ID and name
- Splash screen settings
- Status bar configuration
- Keyboard behavior
- Push notification settings

### Service Worker
Located in `public/sw.js`:
- Offline caching strategy
- Runtime cache
- Network-first approach for API calls

### PWA Manifest
Located in `public/manifest.json`:
- App name and description
- Theme colors
- Display mode
- Icons and screenshots

## 📱 Native vs Web

The app automatically detects the platform and provides appropriate experiences:

- **Native (iOS/Android)**: Full native features with Capacitor
- **Web**: Progressive Web App with service worker
- **Graceful Degradation**: Falls back to web APIs when native unavailable

## 🐛 Troubleshooting

### Common Issues

**1. Status bar not updating**
- Check theme provider integration
- Verify `initializeNativeFeatures` is called

**2. Haptics not working**
- Only works on native platforms
- Check device settings (silent mode on iOS)

**3. Camera not accessible**
- Request permissions first
- Check platform compatibility

**4. Offline indicator not showing**
- Verify `useOnlineStatus` hook is used
- Check browser support for online/offline events

**5. Push notifications not working**
- iOS: Configure APNs certificates
- Android: Set up Firebase Cloud Messaging
- Register device token with backend

## 📖 Further Reading

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)

## 🎯 Next Steps

To fully activate all native features:

1. **Configure Push Notifications**
   - Set up APNs for iOS
   - Configure FCM for Android
   - Implement backend to handle tokens

2. **Add App Icons**
   - Create icon assets for iOS and Android
   - Use adaptive icons for Android

3. **Implement Deep Links**
   - Configure URL schemes
   - Handle incoming deep links

4. **Add Biometric Auth**
   - Install `@capacitor/biometric-auth`
   - Implement fingerprint/face ID

5. **Production Build**
   - Update app version
   - Configure signing certificates
   - Submit to App Store/Play Store

## 💡 Tips

- Test on actual devices, not just emulators
- Use Chrome DevTools for PWA debugging
- Monitor service worker updates
- Keep Capacitor and plugins updated
- Follow platform-specific guidelines (iOS HIG, Material Design)
