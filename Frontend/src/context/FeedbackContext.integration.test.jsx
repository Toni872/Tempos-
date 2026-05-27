import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { FeedbackProvider, useFeedback } from './FeedbackContext';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

function TestConsumer() {
  const { showFeedback } = useFeedback();
  return (
    <div>
      <button onClick={() => showFeedback('success', 'Todo ok!')}>
        Show Success
      </button>
      <button onClick={() => showFeedback('error', 'Algo salió mal')}>
        Show Error
      </button>
    </div>
  );
}

describe('FeedbackContext integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render success toast in the DOM', () => {
    render(
      <FeedbackProvider>
        <TestConsumer />
      </FeedbackProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Todo ok!')).toBeInTheDocument();
  });

  it('should render error toast in the DOM', () => {
    render(
      <FeedbackProvider>
        <TestConsumer />
      </FeedbackProvider>
    );

    act(() => {
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('should auto-dismiss toast after 3 seconds', () => {
    render(
      <FeedbackProvider>
        <TestConsumer />
      </FeedbackProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Todo ok!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Todo ok!')).not.toBeInTheDocument();
  });

  it('should dismiss toast when close button is clicked', () => {
    render(
      <FeedbackProvider>
        <TestConsumer />
      </FeedbackProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Todo ok!')).toBeInTheDocument();

    const allButtons = screen.getAllByRole('button');
    const xButton = allButtons.find(b => b.querySelector('svg'));

    if (xButton) {
      act(() => {
        xButton.click();
      });
    }

    expect(screen.queryByText('Todo ok!')).not.toBeInTheDocument();
  });

  it('should render multiple toasts simultaneously', () => {
    render(
      <FeedbackProvider>
        <TestConsumer />
      </FeedbackProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('Todo ok!')).toBeInTheDocument();
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });
});
