import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NotFound } from '../NotFound';

function renderPage() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
}

describe('NotFound page', () => {
  it('renders the 404 status code', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('renders the "Page not found" message', () => {
    renderPage();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('renders a "Go to Dashboard" link pointing to /dashboard', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /go to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders the church icon', () => {
    const { container } = renderPage();
    // Lucide renders an SVG; confirm at least one SVG is present
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
