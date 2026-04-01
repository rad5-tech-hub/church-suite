import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

describe('ImageWithFallback', () => {
  it('renders an img with the provided src', () => {
    render(<ImageWithFallback src="https://example.com/photo.jpg" alt="Test photo" />);
    const img = screen.getByRole('img', { name: 'Test photo' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders with the provided className', () => {
    render(<ImageWithFallback src="photo.jpg" alt="photo" className="rounded-full" />);
    const img = screen.getByRole('img');
    expect(img).toHaveClass('rounded-full');
  });

  it('shows the fallback image when the src fails to load', () => {
    render(<ImageWithFallback src="broken-url.jpg" alt="broken" />);
    const img = screen.getByRole('img', { name: 'broken' });

    fireEvent.error(img);

    // After error, a wrapper div is shown and the fallback img has alt "Error loading image"
    const fallback = screen.getByRole('img', { name: /error loading image/i });
    expect(fallback).toBeInTheDocument();
  });

  it('preserves the original src as data-original-url on the fallback img', () => {
    render(<ImageWithFallback src="original.jpg" alt="img" />);
    const img = screen.getByRole('img', { name: 'img' });
    fireEvent.error(img);

    const fallback = screen.getByRole('img', { name: /error loading image/i });
    expect(fallback).toHaveAttribute('data-original-url', 'original.jpg');
  });

  it('does not show the fallback before an error occurs', () => {
    render(<ImageWithFallback src="good.jpg" alt="good" />);
    expect(screen.queryByRole('img', { name: /error loading image/i })).not.toBeInTheDocument();
  });

  it('forwards extra props to the img element', () => {
    render(<ImageWithFallback src="img.jpg" alt="img" data-testid="custom-img" />);
    expect(screen.getByTestId('custom-img')).toBeInTheDocument();
  });
});
