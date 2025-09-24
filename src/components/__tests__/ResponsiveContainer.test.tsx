import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ResponsiveContainer, { useViewport } from '../ResponsiveContainer';

// Mock ResizeObserver
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

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

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    maxTouchPoints: 0,
    userAgent: '',
    vibrate: vi.fn(),
  },
  writable: true,
});

// Test component that uses the useViewport hook
const TestComponent: React.FC = () => {
  const viewport = useViewport();
  return (
    <div data-testid="viewport-info">
      <span data-testid="width">{viewport.width}</span>
      <span data-testid="height">{viewport.height}</span>
      <span data-testid="is-mobile">{viewport.isMobile.toString()}</span>
      <span data-testid="is-tablet">{viewport.isTablet.toString()}</span>
      <span data-testid="is-desktop">{viewport.isDesktop.toString()}</span>
      <span data-testid="orientation">{viewport.orientation}</span>
    </div>
  );
};

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1,
    });

    // Mock ResizeObserver
    global.ResizeObserver = mockResizeObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <ResponsiveContainer>
        <div data-testid="child">Test content</div>
      </ResponsiveContainer>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Test content');
  });

  it('applies correct CSS classes based on viewport', () => {
    const { container } = render(
      <ResponsiveContainer className="custom-class">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const responsiveContainer = container.firstChild as HTMLElement;
    expect(responsiveContainer).toHaveClass('responsive-container');
    expect(responsiveContainer).toHaveClass('desktop');
    expect(responsiveContainer).toHaveClass('landscape');
    expect(responsiveContainer).toHaveClass('custom-class');
  });

  it('detects mobile viewport correctly', () => {
    // Set mobile dimensions
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });

    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );

    const responsiveContainer = container.firstChild as HTMLElement;
    expect(responsiveContainer).toHaveClass('mobile');
    expect(responsiveContainer).toHaveClass('portrait');
    expect(responsiveContainer).not.toHaveClass('tablet');
    expect(responsiveContainer).not.toHaveClass('desktop');
  });

  it('detects tablet viewport correctly', () => {
    // Set tablet dimensions
    Object.defineProperty(window, 'innerWidth', { value: 768 });
    Object.defineProperty(window, 'innerHeight', { value: 1024 });

    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );

    const responsiveContainer = container.firstChild as HTMLElement;
    expect(responsiveContainer).toHaveClass('tablet');
    expect(responsiveContainer).toHaveClass('portrait');
    expect(responsiveContainer).not.toHaveClass('mobile');
    expect(responsiveContainer).not.toHaveClass('desktop');
  });

  it('sets correct data attributes', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });

    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );

    const responsiveContainer = container.firstChild as HTMLElement;
    expect(responsiveContainer).toHaveAttribute('data-viewport-width', '375');
    expect(responsiveContainer).toHaveAttribute('data-viewport-height', '667');
    expect(responsiveContainer).toHaveAttribute('data-orientation', 'portrait');
    expect(responsiveContainer).toHaveAttribute('data-device-type', 'mobile');
  });

  it('calls onViewportChange when viewport changes', () => {
    const onViewportChange = vi.fn();
    
    render(
      <ResponsiveContainer onViewportChange={onViewportChange}>
        <div>Content</div>
      </ResponsiveContainer>
    );

    // Simulate viewport change
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(onViewportChange).toHaveBeenCalled();
  });

  it('disables viewport detection when enableViewportDetection is false', () => {
    const onViewportChange = vi.fn();
    
    render(
      <ResponsiveContainer 
        enableViewportDetection={false}
        onViewportChange={onViewportChange}
      >
        <div>Content</div>
      </ResponsiveContainer>
    );

    // Simulate viewport change
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(onViewportChange).not.toHaveBeenCalled();
  });
});

describe('useViewport hook', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
    Object.defineProperty(window, 'innerHeight', { value: 768 });
    Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
    global.ResizeObserver = mockResizeObserver;
  });

  it('returns correct viewport information', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('width')).toHaveTextContent('1024');
    expect(screen.getByTestId('height')).toHaveTextContent('768');
    expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
    expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
    expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
    expect(screen.getByTestId('orientation')).toHaveTextContent('landscape');
  });

  it('updates viewport information on resize', () => {
    render(<TestComponent />);

    // Initial state
    expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');

    // Change to mobile dimensions
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.getByTestId('width')).toHaveTextContent('375');
    expect(screen.getByTestId('height')).toHaveTextContent('667');
    expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
    expect(screen.getByTestId('orientation')).toHaveTextContent('portrait');
  });
});