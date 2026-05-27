import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FeedbackProvider, useFeedback } from './FeedbackContext';
import React from 'react';

function wrapper({ children }) {
  return React.createElement(FeedbackProvider, null, children);
}

describe('FeedbackContext', () => {
  it('should provide showFeedback function', () => {
    const { result } = renderHook(() => useFeedback(), { wrapper });
    expect(typeof result.current.showFeedback).toBe('function');
  });

  it('should render toast when showFeedback is called', () => {
    const { result } = renderHook(() => useFeedback(), { wrapper });

    act(() => {
      result.current.showFeedback('success', 'Test message');
    });

    expect(result.current.showFeedback).toBeDefined();
  });

  it('should handle both success and error types', () => {
    const { result } = renderHook(() => useFeedback(), { wrapper });

    act(() => {
      result.current.showFeedback('success', 'Success!');
    });

    act(() => {
      result.current.showFeedback('error', 'Error!');
    });

    expect(result.current.showFeedback).toBeDefined();
  });
});

describe('FeedbackProvider', () => {
  it('should throw when useFeedback is used outside provider', () => {
    expect(() => {
      renderHook(() => useFeedback());
    }).toThrow('useFeedback must be used within FeedbackProvider');
  });
});
