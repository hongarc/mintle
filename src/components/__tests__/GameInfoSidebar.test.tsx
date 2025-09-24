import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GameInfoSidebar from '../GameInfoSidebar';

// Mock the useViewport hook
vi.mock('../ResponsiveContainer', () => ({
  useViewport: vi.fn(),
}));

import { useViewport } from '../ResponsiveContainer';

describe('GameInfoSidebar', () => {
  const mockUseViewport = useViewport as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Default to desktop viewport
    mockUseViewport.mockReturnValue({
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      orientation: 'landscape',
      devicePixelRatio: 1,
    });
  });

  it('renders sidebar content on desktop', () => {
    render(
      <GameInfoSidebar
        timeToNextHour={3600000} // 1 hour in ms
        currentAttempt={2}
        maxAttempts={6}
        gameStatus="playing"
      />
    );

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('i')).toBeInTheDocument();
    expect(screen.getByText('n')).toBeInTheDocument();
    expect(screen.getByText('t')).toBeInTheDocument();
    expect(screen.getByText('l')).toBeInTheDocument();
    expect(screen.getByText('e')).toBeInTheDocument();
    expect(screen.getByText('Next Word')).toBeInTheDocument();
    expect(screen.getByText('Attempts')).toBeInTheDocument();
    expect(screen.getByText('2/6')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('displays correct time remaining', () => {
    render(
      <GameInfoSidebar
        timeToNextHour={1800000} // 30 minutes in ms
        currentAttempt={1}
        maxAttempts={6}
        gameStatus="playing"
      />
    );

    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('shows game status when game is over', () => {
    render(
      <GameInfoSidebar
        timeToNextHour={3600000}
        currentAttempt={3}
        maxAttempts={6}
        gameStatus="won"
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('🎉 Won!')).toBeInTheDocument();
  });

  it('shows lost status correctly', () => {
    render(
      <GameInfoSidebar
        timeToNextHour={3600000}
        currentAttempt={6}
        maxAttempts={6}
        gameStatus="lost"
      />
    );

    expect(screen.getByText('😔 Lost')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    render(
      <GameInfoSidebar
        timeToNextHour={3600000}
        currentAttempt={3}
        maxAttempts={6}
        gameStatus="playing"
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows new game button when available', () => {
    const onNewGame = vi.fn();
    
    render(
      <GameInfoSidebar
        timeToNextHour={0}
        currentAttempt={3}
        maxAttempts={6}
        gameStatus="won"
        onNewGame={onNewGame}
        showNewGameButton={true}
      />
    );

    expect(screen.getByTestId('new-game-button')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  it('does not render on mobile', () => {
    mockUseViewport.mockReturnValue({
      width: 375,
      height: 667,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      orientation: 'portrait',
      devicePixelRatio: 2,
    });

    const { container } = render(
      <GameInfoSidebar
        timeToNextHour={3600000}
        currentAttempt={2}
        maxAttempts={6}
        gameStatus="playing"
      />
    );

    expect(container.firstChild).toBeNull();
  });
});