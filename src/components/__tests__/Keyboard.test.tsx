import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Keyboard from '../Keyboard';

// Mock the useViewport hook
vi.mock('../ResponsiveContainer', () => ({
  useViewport: vi.fn(),
}));

// Mock touch optimization
vi.mock('../../lib/touchOptimization', () => ({
  addTouchOptimizedListeners: vi.fn(() => vi.fn()),
  triggerHapticFeedback: vi.fn(),
}));

import { useViewport } from '../ResponsiveContainer';

describe('Keyboard', () => {
  const mockUseViewport = useViewport as ReturnType<typeof vi.fn>;
  const mockOnKeyPress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('renders keyboard with all keys', () => {
    render(
      <Keyboard
        onKeyPress={mockOnKeyPress}
        disabled={false}
        allFeedback={[]}
        currentGuess=""
        maxGuessLength={5}
      />
    );

    // Check for some letter keys
    expect(screen.getByTestId('keyboard-key-Q')).toBeInTheDocument();
    expect(screen.getByTestId('keyboard-key-A')).toBeInTheDocument();
    expect(screen.getByTestId('keyboard-key-Z')).toBeInTheDocument();
    
    // Check for action keys
    expect(screen.getByTestId('keyboard-key-ENTER')).toBeInTheDocument();
    expect(screen.getByTestId('keyboard-key-⌫')).toBeInTheDocument();
  });

  it('calls onKeyPress when letter key is clicked', () => {
    render(
      <Keyboard
        onKeyPress={mockOnKeyPress}
        disabled={false}
        allFeedback={[]}
        currentGuess=""
        maxGuessLength={5}
      />
    );

    fireEvent.click(screen.getByTestId('keyboard-key-A'));
    expect(mockOnKeyPress).toHaveBeenCalledWith('A');
  });

  it('calls onKeyPress when ENTER key is clicked', () => {
    render(
      <Keyboard
        onKeyPress={mockOnKeyPress}
        disabled={false}
        allFeedback={[]}
        currentGuess="HELLO"
        maxGuessLength={5}
      />
    );

    fireEvent.click(screen.getByTestId('keyboard-key-ENTER'));
    expect(mockOnKeyPress).toHaveBeenCalledWith('ENTER');
  });

  it('disables ENTER key when guess is not complete', () => {
    render(
      <Keyboard
        onKeyPress={mockOnKeyPress}
        disabled={false}
        allFeedback={[]}
        currentGuess="HEL"
        maxGuessLength={5}
      />
    );

    const enterKey = screen.getByTestId('keyboard-key-ENTER');
    expect(enterKey).toBeDisabled();
  });

  it('disables BACKSPACE key when guess is empty', () => {
    render(
      <Keyboard
        onKeyPress={mockOnKeyPress}
        disabled={false}
        allFeedback={[]}
        currentGuess=""
        maxGuessLength={5}
      />
    );

    const backspaceKey = screen.getByTestId('keyboard-key-⌫');
    expect(backspaceKey).toBeDisabled();
  });

  it('applies mobile class on mobile viewport', () => {
    mockUseViewport.mockReturnValue({
      width: 375,
      height: 667,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      orientation: 'portrait',
      devicePixelRatio: 2,
    });

    render(
      <Keyboard
        onKeyPress={mockOnKeyPress}
        disabled={false}
        allFeedback={[]}
        currentGuess=""
        maxGuessLength={5}
      />
    );

    const keyboard = screen.getByTestId('keyboard');
    expect(keyboard).toHaveClass('mobile');
  });

  it('shows ready indicator when guess is complete', () => {
    render(
      <Keyboard
        onKeyPress={mockOnKeyPress}
        disabled={false}
        allFeedback={[]}
        currentGuess="HELLO"
        maxGuessLength={5}
      />
    );

    expect(screen.getByText('Ready to submit!')).toBeInTheDocument();
  });
});