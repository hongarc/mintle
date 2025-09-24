/**
 * Touch optimization utilities for mobile devices
 */

export interface TouchTarget {
  minWidth: number;
  minHeight: number;
  padding: number;
  margin: number;
}

export interface TouchOptimizationConfig {
  mobile: TouchTarget;
  tablet: TouchTarget;
  desktop: TouchTarget;
}

// WCAG 2.1 AA compliant touch target sizes
export const TOUCH_TARGETS: TouchOptimizationConfig = {
  mobile: {
    minWidth: 44,
    minHeight: 44,
    padding: 12,
    margin: 4,
  },
  tablet: {
    minWidth: 48,
    minHeight: 48,
    padding: 14,
    margin: 6,
  },
  desktop: {
    minWidth: 32,
    minHeight: 32,
    padding: 8,
    margin: 4,
  },
};

/**
 * Get touch target configuration based on device type
 */
export function getTouchTarget(deviceType: 'mobile' | 'tablet' | 'desktop'): TouchTarget {
  return TOUCH_TARGETS[deviceType];
}

/**
 * Generate CSS custom properties for touch targets
 */
export function generateTouchTargetCSS(deviceType: 'mobile' | 'tablet' | 'desktop'): Record<string, string> {
  const target = getTouchTarget(deviceType);
  
  return {
    '--touch-target-min-width': `${target.minWidth}px`,
    '--touch-target-min-height': `${target.minHeight}px`,
    '--touch-target-padding': `${target.padding}px`,
    '--touch-target-margin': `${target.margin}px`,
  };
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    // @ts-ignore - for older browsers
    ((navigator as any).msMaxTouchPoints > 0)
  );
}

/**
 * Check if device has hover capability
 */
export function hasHoverCapability(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Get optimal spacing for touch interfaces
 */
export function getOptimalSpacing(deviceType: 'mobile' | 'tablet' | 'desktop', orientation: 'portrait' | 'landscape'): {
  gap: number;
  padding: number;
  margin: number;
} {
  const baseSpacing = {
    mobile: { gap: 8, padding: 12, margin: 4 },
    tablet: { gap: 12, padding: 16, margin: 6 },
    desktop: { gap: 16, padding: 20, margin: 8 },
  };

  const spacing = baseSpacing[deviceType];

  // Reduce spacing in landscape mode for mobile
  if (deviceType === 'mobile' && orientation === 'landscape') {
    return {
      gap: Math.max(4, Math.floor(spacing.gap * 0.6)),
      padding: Math.max(6, Math.floor(spacing.padding * 0.6)),
      margin: Math.max(2, Math.floor(spacing.margin * 0.6)),
    };
  }

  return spacing;
}

/**
 * Calculate optimal font size for touch interfaces
 */
export function getOptimalFontSize(deviceType: 'mobile' | 'tablet' | 'desktop', elementType: 'button' | 'input' | 'text'): number {
  const baseSizes = {
    mobile: { button: 16, input: 16, text: 14 },
    tablet: { button: 18, input: 18, text: 16 },
    desktop: { button: 14, input: 14, text: 16 },
  };

  return baseSizes[deviceType][elementType];
}

/**
 * Apply haptic feedback if supported
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Prevent zoom on iOS when focusing inputs
 */
export function preventIOSZoom(element: HTMLElement): void {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      if (htmlInput.style.fontSize === '' || parseInt(htmlInput.style.fontSize) < 16) {
        htmlInput.style.fontSize = '16px';
      }
    });
  }
}

/**
 * Add touch-optimized event listeners
 */
export function addTouchOptimizedListeners(
  element: HTMLElement,
  onClick: () => void,
  options: {
    hapticFeedback?: boolean;
    preventDoubleClick?: boolean;
  } = {}
): () => void {
  let lastClickTime = 0;

  const handleTouchStart = () => {
    if (options.hapticFeedback) {
      triggerHapticFeedback('light');
    }
  };

  const handleClick = (event: Event) => {
    const now = Date.now();
    
    // Prevent double clicks if requested
    if (options.preventDoubleClick && now - lastClickTime < 300) {
      event.preventDefault();
      return;
    }
    
    lastClickTime = now;
    onClick();
  };

  // Use passive listeners for better performance
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('click', handleClick);

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('click', handleClick);
  };
}

/**
 * Create touch-optimized CSS classes
 */
export function createTouchOptimizedClasses(deviceType: 'mobile' | 'tablet' | 'desktop'): string {
  const isTouch = isTouchDevice();
  const hasHover = hasHoverCapability();
  
  const classes = [
    `touch-optimized-${deviceType}`,
    isTouch && 'touch-device',
    hasHover && 'hover-capable',
    !hasHover && 'no-hover',
  ].filter(Boolean);

  return classes.join(' ');
}