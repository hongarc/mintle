import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MobileInfoBar from '../MobileInfoBar';

// Mock the useViewport hook
vi.mock('../ResponsiveContainer', () => ({
  useViewport: vi.fn(),
}));

import { useViewport } from '../ResponsiveContainer';

describe('MobileInfoBar', () => {
  const mockUseViewport = useViewport as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Default to mobile viewport
    mockUseViewport.mockReturnValue({
      width: 375,
      height: 667,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      orientation: 'portrait',
      devicePixelRatio: 2,
    });
  });

  it('renders info bar content on mobile', () => {
    render(
      <MobileInfoBar
        timeToNextHour={3600000} // 1 hour in ms
        currentAttempt={2}
        maxAttempts={6}
        gameStatus="playing"
      />
    );

    expect(screen.getByText('60:00')).toBeInTheDocument();
    expect(screen.getByText('2/6')).toBeInTheDocument();
  });

  it('shows game status when game is over', () => {
    render(
      <MobileInfoBar
        timeToNextHour={3600000}
        currentAttempt={3}
        maxAttempts={6}
        gameStatus="won"
      />
    );

    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('shows lost status correctly', () => {
    render(
      <MobileInfoBar
        timeToNextHour={3600000}
        currentAttempt={6}
        maxAttempts={6}
        gameStatus="lost"
      />
    );

    expect(screen.getByText('😔')).toBeInTheDocument();
  });

  it('does not render on desktop', () => {
    mockUseViewport.mockReturnValue({
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: 'landscape',
      devicePixelRatio: 1,
    });

    const { container } = render(
      <MobileInfoBar
        timeToNextHour={3600000}
        currentAttempt={2}
        maxAttempts={6}
        gameStatus="playing"
      />
    );

    expect(container.firstChild).toBeNull();
  });
});