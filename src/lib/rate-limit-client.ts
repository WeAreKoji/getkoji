/**
 * Client-side rate limiting utility
 * Prevents spam by tracking action attempts in localStorage
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  key: string;
}

interface RateLimitRecord {
  attempts: number[];
  windowStart: number;
}

export class ClientRateLimiter {
  private static getRecord(key: string): RateLimitRecord {
    try {
      const stored = localStorage.getItem(`ratelimit_${key}`);
      return stored ? JSON.parse(stored) : { attempts: [], windowStart: Date.now() };
    } catch {
      return { attempts: [], windowStart: Date.now() };
    }
  }

  private static setRecord(key: string, record: RateLimitRecord): void {
    try {
      localStorage.setItem(`ratelimit_${key}`, JSON.stringify(record));
    } catch {
      // Storage full or unavailable
    }
  }

  static checkLimit(config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  } {
    const now = Date.now();
    const windowMs = config.windowMinutes * 60 * 1000;
    const record = this.getRecord(config.key);

    // Clean up old attempts outside the window
    const validAttempts = record.attempts.filter(
      (timestamp) => now - timestamp < windowMs
    );

    // Check if limit exceeded
    const allowed = validAttempts.length < config.maxAttempts;
    const remaining = Math.max(0, config.maxAttempts - validAttempts.length);

    // Calculate reset time
    const oldestAttempt = validAttempts[0] || now;
    const resetAt = new Date(oldestAttempt + windowMs);

    // If allowed, add this attempt
    if (allowed) {
      validAttempts.push(now);
      this.setRecord(config.key, {
        attempts: validAttempts,
        windowStart: record.windowStart,
      });
    }

    return { allowed, remaining, resetAt };
  }

  static getRemainingTime(key: string, windowMinutes: number): number {
    const record = this.getRecord(key);
    if (record.attempts.length === 0) return 0;

    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const oldestAttempt = record.attempts[0];
    const resetTime = oldestAttempt + windowMs;

    return Math.max(0, Math.ceil((resetTime - now) / 1000));
  }
}
