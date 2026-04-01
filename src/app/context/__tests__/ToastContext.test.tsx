import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

// ─── Helper component ─────────────────────────────────────────────
function ToastTrigger({ message = 'Hello!', type, id }: { message?: string; type?: 'success' | 'error'; id?: string }) {
  const { showToast } = useToast();
  return (
    <button data-testid={id ?? 'trigger'} onClick={() => showToast(message, type)}>
      Show Toast
    </button>
  );
}

function renderWithProvider(message?: string, type?: 'success' | 'error') {
  return render(
    <ToastProvider>
      <ToastTrigger message={message} type={type} />
    </ToastProvider>
  );
}

describe('ToastContext', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show a toast before showToast is called', () => {
    renderWithProvider('Hello!');
    expect(screen.queryByText('Hello!')).not.toBeInTheDocument();
  });

  it('shows the toast message after showToast is called', () => {
    renderWithProvider('Saved successfully!');
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByText('Saved successfully!')).toBeInTheDocument();
  });

  it('auto-dismisses the toast after 4 seconds', () => {
    vi.useFakeTimers();
    renderWithProvider('Auto dismiss');

    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(4001); });
    expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
  });

  it('dismisses the toast when the X button is clicked', () => {
    renderWithProvider('Dismiss me');
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByText('Dismiss me')).toBeInTheDocument();

    // The dismiss button is a button that is NOT the trigger
    const allButtons = screen.getAllByRole('button');
    const dismissBtn = allButtons.find((b) => b !== screen.getByTestId('trigger'))!;
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('replaces a previous toast when showToast is called again', () => {
    render(
      <ToastProvider>
        <ToastTrigger id="t1" message="First" />
        <ToastTrigger id="t2" message="Second" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('t1'));
    expect(screen.getByText('First')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('t2'));
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('defaults to success type (green border)', () => {
    const { container } = renderWithProvider('Success toast');
    fireEvent.click(screen.getByTestId('trigger'));
    expect(container.querySelector('[class*="border-green"]')).not.toBeNull();
  });

  it('applies error styling (red border) for error type', () => {
    const { container } = renderWithProvider('Error toast', 'error');
    fireEvent.click(screen.getByTestId('trigger'));
    expect(container.querySelector('[class*="border-red"]')).not.toBeNull();
  });

  it('useToast throws when used outside ToastProvider', () => {
    const BadConsumer = () => { useToast(); return null; };
    expect(() => render(<BadConsumer />)).toThrow(/ToastProvider/);
  });
});
