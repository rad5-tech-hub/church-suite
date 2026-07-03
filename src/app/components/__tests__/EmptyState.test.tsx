import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../EmptyState';

const TestIcon = () => <svg data-testid="test-icon" />;

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(
      <EmptyState
        icon={<TestIcon />}
        title="No members yet"
        description="Add your first member to get started."
      />
    );
    expect(screen.getByText('No members yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first member to get started.')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(
      <EmptyState
        icon={<TestIcon />}
        title="Empty"
        description="Nothing here."
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders the action button when action prop is provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={<TestIcon />}
        title="Empty"
        description="Nothing here."
        action={{ label: 'Add Member', onClick: handleClick }}
      />
    );
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
  });

  it('does not render a button when action prop is omitted', () => {
    render(
      <EmptyState
        icon={<TestIcon />}
        title="Empty"
        description="Nothing here."
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls action.onClick when the button is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        icon={<TestIcon />}
        title="Empty"
        description="Nothing here."
        action={{ label: 'Add Member', onClick: handleClick }}
      />
    );
    await user.click(screen.getByRole('button', { name: /add member/i }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders title as an h3', () => {
    render(
      <EmptyState
        icon={<TestIcon />}
        title="Section Title"
        description="desc"
      />
    );
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Section Title');
  });
});
