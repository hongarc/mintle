import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTouchTarget,
  generateTouchTargetCSS,
  isTouchDevice,
  hasHoverCapability,
  getOptimalSpacing,
  getOptimalFontSize,
  triggerHapticFeedback,
  preventIOSZoom,
  addTouchOptimizedListeners,
  createTouchOptimizedClasses,
} from '../touchOptimization';

// Mock navigator
const mockNavigator = {
  maxTouchPoints: 0,
  userAgent: '',
  vibrate: vi.fn(),
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('touchOptimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigator.maxTouchPoints = 0;
    mockNavigator.userAgent = '';
  });

  describe('getTouchTarget', () => {
    it('returns correct touch target for mobile', () => {
      const target = getTouchTarget('mobile');
      expect(target).toEqual({
        minWidth: 44,
        minHeight: 44,
        padding: 12,
        margin: 4,
      });
    });

    it('returns correct touch target for tablet', () => {
      const target = getTouchTarget('tablet');
      expect(target).toEqual({
        minWidth: 48,
        minHeight: 48,
        padding: 14,
        margin: 6,
      });
    });

    it('returns correct touch target for desktop', () => {
      const target = getTouchTarget('desktop');
      expect(target).toEqual({
        minWidth: 32,
        minHeight: 32,
        padding: 8,
        margin: 4,
      });
    });
  });

  describe('generateTouchTargetCSS', () => {
    it('generates correct CSS custom properties for mobile', () => {
      const css = generateTouchTargetCSS('mobile');
      expect(css).toEqual({
        '--touch-target-min-width': '44px',
        '--touch-target-min-height': '44px',
        '--touch-target-padding': '12px',
        '--touch-target-margin': '4px',
      });
    });

    it('generates correct CSS custom properties for tablet', () => {
      const css = generateTouchTargetCSS('tablet');
      expect(css).toEqual({
        '--touch-target-min-width': '48px',
        '--touch-target-min-height': '48px',
        '--touch-target-padding': '14px',
        '--touch-target-margin': '6px',
      });
    });
  });

  describe('isTouchDevice', () => {
    it('returns false when no touch support', () => {
      // Ensure no touch properties exist
      delete (window as any).ontouchstart;
      mockNavigator.maxTouchPoints = 0;
      delete (mockNavigator as any).msMaxTouchPoints;
      expect(isTouchDevice()).toBe(false);
    });

    it('returns true when ontouchstart exists', () => {
      const originalOntouchstart = (window as any).ontouchstart;
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        writable: true,
        configurable: true,
      });
      expect(isTouchDevice()).toBe(true);
      
      // Restore original value
      if (originalOntouchstart !== undefined) {
        (window as any).ontouchstart = originalOntouchstart;
      } else {
        delete (window as any).ontouchstart;
      }
    });

    it('returns true when maxTouchPoints > 0', () => {
      mockNavigator.maxTouchPoints = 1;
      expect(isTouchDevice()).toBe(true);
    });
  });

  describe('hasHoverCapability', () => {
    it('returns false by default', () => {
      expect(hasHoverCapability()).toBe(false);
    });

    it('returns true when hover is supported', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(hover: hover)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      expect(hasHoverCapability()).toBe(true);
    });
  });

  describe('getOptimalSpacing', () => {
    it('returns correct spacing for mobile portrait', () => {
      const spacing = getOptimalSpacing('mobile', 'portrait');
      expect(spacing).toEqual({
        gap: 8,
        padding: 12,
        margin: 4,
      });
    });

    it('returns reduced spacing for mobile landscape', () => {
      const spacing = getOptimalSpacing('mobile', 'landscape');
      // Math.floor(8 * 0.6) = Math.floor(4.8) = 4, Math.max(4, 4) = 4
      // Math.floor(12 * 0.6) = Math.floor(7.2) = 7, Math.max(6, 7) = 7
      // Math.floor(4 * 0.6) = Math.floor(2.4) = 2, Math.max(2, 2) = 2
      expect(spacing).toEqual({
        gap: 4,
        padding: 7,
        margin: 2,
      });
    });

    it('returns correct spacing for tablet', () => {
      const spacing = getOptimalSpacing('tablet', 'portrait');
      expect(spacing).toEqual({
        gap: 12,
        padding: 16,
        margin: 6,
      });
    });

    it('returns correct spacing for desktop', () => {
      const spacing = getOptimalSpacing('desktop', 'portrait');
      expect(spacing).toEqual({
        gap: 16,
        padding: 20,
        margin: 8,
      });
    });
  });

  describe('getOptimalFontSize', () => {
    it('returns correct font sizes for mobile', () => {
      expect(getOptimalFontSize('mobile', 'button')).toBe(16);
      expect(getOptimalFontSize('mobile', 'input')).toBe(16);
      expect(getOptimalFontSize('mobile', 'text')).toBe(14);
    });

    it('returns correct font sizes for tablet', () => {
      expect(getOptimalFontSize('tablet', 'button')).toBe(18);
      expect(getOptimalFontSize('tablet', 'input')).toBe(18);
      expect(getOptimalFontSize('tablet', 'text')).toBe(16);
    });

    it('returns correct font sizes for desktop', () => {
      expect(getOptimalFontSize('desktop', 'button')).toBe(14);
      expect(getOptimalFontSize('desktop', 'input')).toBe(14);
      expect(getOptimalFontSize('desktop', 'text')).toBe(16);
    });
  });

  describe('triggerHapticFeedback', () => {
    it('calls navigator.vibrate with correct pattern for light feedback', () => {
      triggerHapticFeedback('light');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([10]);
    });

    it('calls navigator.vibrate with correct pattern for medium feedback', () => {
      triggerHapticFeedback('medium');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([20]);
    });

    it('calls navigator.vibrate with correct pattern for heavy feedback', () => {
      triggerHapticFeedback('heavy');
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([30]);
    });

    it('does not call vibrate when not supported', () => {
      delete (mockNavigator as any).vibrate;
      triggerHapticFeedback('light');
      // Should not throw error
    });
  });

  describe('preventIOSZoom', () => {
    it('sets font size to 16px for iOS inputs', () => {
      mockNavigator.userAgent = 'iPhone';
      
      const container = document.createElement('div');
      const input = document.createElement('input');
      input.style.fontSize = '14px';
      container.appendChild(input);
      
      preventIOSZoom(container);
      
      expect(input.style.fontSize).toBe('16px');
    });

    it('does not modify inputs on non-iOS devices', () => {
      mockNavigator.userAgent = 'Android';
      
      const container = document.createElement('div');
      const input = document.createElement('input');
      input.style.fontSize = '14px';
      container.appendChild(input);
      
      preventIOSZoom(container);
      
      expect(input.style.fontSize).toBe('14px');
    });
  });

  describe('addTouchOptimizedListeners', () => {
    let element: HTMLElement;
    let onClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      element = document.createElement('button');
      onClick = vi.fn();
    });

    it('adds event listeners and returns cleanup function', () => {
      const cleanup = addTouchOptimizedListeners(element, onClick);
      
      expect(typeof cleanup).toBe('function');
      
      // Simulate click
      element.click();
      expect(onClick).toHaveBeenCalledTimes(1);
      
      // Cleanup
      cleanup();
    });

    it('prevents double clicks when option is enabled', () => {
      const cleanup = addTouchOptimizedListeners(element, onClick, {
        preventDoubleClick: true,
      });
      
      // Simulate rapid clicks
      element.click();
      element.click();
      
      expect(onClick).toHaveBeenCalledTimes(1);
      
      cleanup();
    });

    it('allows clicks after delay when preventing double clicks', async () => {
      const cleanup = addTouchOptimizedListeners(element, onClick, {
        preventDoubleClick: true,
      });
      
      element.click();
      expect(onClick).toHaveBeenCalledTimes(1);
      
      await new Promise(resolve => setTimeout(resolve, 350));
      
      element.click();
      expect(onClick).toHaveBeenCalledTimes(2);
      cleanup();
    });
  });

  describe('createTouchOptimizedClasses', () => {
    it('creates correct classes for mobile', () => {
      const classes = createTouchOptimizedClasses('mobile');
      expect(classes).toContain('touch-optimized-mobile');
    });

    it('includes touch-device class when touch is supported', () => {
      mockNavigator.maxTouchPoints = 1;
      const classes = createTouchOptimizedClasses('mobile');
      expect(classes).toContain('touch-device');
    });

    it('includes hover-capable class when hover is supported', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(hover: hover)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      const classes = createTouchOptimizedClasses('desktop');
      expect(classes).toContain('hover-capable');
    });

    it('includes no-hover class when hover is not supported', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      const classes = createTouchOptimizedClasses('mobile');
      expect(classes).toContain('no-hover');
    });
  });
});