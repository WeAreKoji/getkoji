/**
 * Accessibility utilities for improving app usability
 */

/**
 * Announces a message to screen readers
 * Useful for dynamic content changes that should be announced
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Manages focus for keyboard navigation
 * Traps focus within a modal or dialog
 */
export class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.focusableElements = this.getFocusableElements();
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }
  
  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    
    return Array.from(this.element.querySelectorAll<HTMLElement>(selector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }
  
  activate(): void {
    this.previouslyFocused = document.activeElement as HTMLElement;
    this.element.addEventListener('keydown', this.handleKeyDown);
    
    // Focus first element
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }
  }
  
  deactivate(): void {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    
    // Restore focus
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }
  
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;
    
    // Refresh focusable elements (they might have changed)
    this.focusableElements = this.getFocusableElements();
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * Generates a unique ID for ARIA attributes
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Checks if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Ensures minimum touch target size for mobile (48x48px recommended)
 */
export function validateTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const MIN_SIZE = 44; // 44px is Apple's minimum, 48px is Android's
  
  return rect.width >= MIN_SIZE && rect.height >= MIN_SIZE;
}

/**
 * Checks color contrast ratio
 * Note: This is a simplified check. Use a proper tool for production
 */
export function checkColorContrast(foreground: string, background: string): { ratio: number; wcagAA: boolean; wcagAAA: boolean } {
  // This is a placeholder - implement full contrast checking if needed
  // For now, return a warning to use proper tools
  console.warn('Use a proper color contrast checker tool for production');
  return { ratio: 0, wcagAA: false, wcagAAA: false };
}
