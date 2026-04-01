import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders the title and description', () => {
    render(<PageHeader title="Members" description="Manage your church members." />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Members');
    expect(screen.getByText('Manage your church members.')).toBeInTheDocument();
  });

  it('renders the action button when action prop is provided', () => {
    const handleClick = vi.fn();
    render(
      <PageHeader
        title="Members"
        description="Manage members."
        action={{ label: 'Add Member', onClick: handleClick }}
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls action.onClick when button is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <PageHeader
        title="Members"
        description="desc"
        action={{ label: 'Add Member', onClick: handleClick }}
      />
    );
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not render a button when action prop is omitted', () => {
    render(<PageHeader title="Members" description="desc" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <PageHeader
        title="Page Title"
        description="desc"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Departments', href: '/departments' },
          { label: 'Current Section' },
        ]}
      />
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Current Section')).toBeInTheDocument();
  });

  it('renders breadcrumb links with href as anchor tags', () => {
    render(
      <PageHeader
        title="Units"
        description="desc"
        breadcrumbs={[{ label: 'Home', href: '/' }]}
      />
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders breadcrumbs without href as plain text (no anchor)', () => {
    render(
      <PageHeader
        title="Units"
        description="desc"
        breadcrumbs={[{ label: 'Current Page' }]}
      />
    );
    expect(screen.queryByRole('link', { name: 'Current Page' })).not.toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('does not render breadcrumb container when breadcrumbs is empty', () => {
    const { container } = render(
      <PageHeader title="Members" description="desc" breadcrumbs={[]} />
    );
    // No separator slashes should be rendered
    expect(container.querySelector('[class*="gap-2 text-sm"]')).toBeNull();
  });

  it('renders separator slashes between breadcrumb items', () => {
    render(
      <PageHeader
        title="Units"
        description="desc"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Units' }]}
      />
    );
    // There should be exactly one "/" separator for two items
    const slashes = screen.getAllByText('/');
    expect(slashes.length).toBe(1);
  });

  it('renders action icon when provided', () => {
    const TestIcon = () => <svg data-testid="action-icon" />;
    render(
      <PageHeader
        title="Members"
        description="desc"
        action={{ label: 'Add', onClick: vi.fn(), icon: <TestIcon /> }}
      />
    );
    expect(screen.getByTestId('action-icon')).toBeInTheDocument();
  });
});
