import { useState, useEffect } from "react";

/**
 * Offline support utilities
 */

// Hook to detect online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

// Queue for offline actions
interface QueuedAction {
  id: string;
  type: "message" | "swipe" | "like";
  data: any;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedAction[] = [];
  private readonly STORAGE_KEY = "offline_queue";

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }

  add(action: Omit<QueuedAction, "id" | "timestamp">) {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    this.queue.push(queuedAction);
    this.saveQueue();
  }

  getAll(): QueuedAction[] {
    return [...this.queue];
  }

  remove(id: string) {
    this.queue = this.queue.filter((action) => action.id !== id);
    this.saveQueue();
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();

// Cache utilities
export const cacheData = async (key: string, data: any) => {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
};

export const getCachedData = <T>(key: string, maxAge: number = 3600000): T | null => {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to get cached data:", error);
    return null;
  }
};
