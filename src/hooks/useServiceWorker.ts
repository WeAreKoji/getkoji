import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isUpdateAvailable: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isUpdateAvailable: false,
    isRegistered: false,
    registration: null,
  });

  const updateServiceWorker = useCallback(() => {
    if (state.registration?.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload once the new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
    } else {
      // No waiting worker - just reload to get the latest version
      // This handles the case where service worker auto-activates with skipWaiting()
      window.location.reload();
    }
  }, [state.registration]);

  const dismissUpdate = useCallback(() => {
    setState(prev => ({ ...prev, isUpdateAvailable: false }));
    // Store dismissal in session storage to avoid showing again this session
    sessionStorage.setItem('sw-update-dismissed', 'true');
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none', // Always check for updates
        });

        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates immediately
        registration.update();

        // Check if there's already a waiting worker
        if (registration.waiting) {
          const dismissed = sessionStorage.getItem('sw-update-dismissed');
          if (!dismissed) {
            setState(prev => ({ ...prev, isUpdateAvailable: true }));
          }
        }

        // Listen for new service workers
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                const dismissed = sessionStorage.getItem('sw-update-dismissed');
                if (!dismissed) {
                  console.log('[SW] New version available');
                  setState(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              }
            });
          }
        });

        // Check for updates every 5 minutes
        const interval = setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('[SW] Registration failed:', error);
      }
    };

    registerSW();
  }, []);

  return {
    ...state,
    updateServiceWorker,
    dismissUpdate,
  };
};
