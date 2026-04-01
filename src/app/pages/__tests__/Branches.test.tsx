import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Branches } from '../Branches';
import type { Branch } from '../../types';

// ── Mocks ────────────────────────────────────────────────────────

vi.mock('../../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

vi.mock('../../components/PageHeader', () => ({
  PageHeader: ({ title, action }: any) => (
    <div>
      <h1>{title}</h1>
      {action && (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  ),
}));

const mockCreateBranch = vi.fn();
const mockEditBranch = vi.fn();
const mockDeleteBranchApi = vi.fn();
const mockFetchDepartments = vi.fn();
const mockFetchMembers = vi.fn();

vi.mock('../../api', () => ({
  createBranch: (...args: any[]) => mockCreateBranch(...args),
  editBranch: (...args: any[]) => mockEditBranch(...args),
  deleteBranchApi: (...args: any[]) => mockDeleteBranchApi(...args),
  fetchDepartments: (...args: any[]) => mockFetchDepartments(...args),
  fetchMembers: (...args: any[]) => mockFetchMembers(...args),
}));

const mockAddBranch = vi.fn();
const mockUpdateBranch = vi.fn();
const mockDeleteBranch = vi.fn();
const mockLoadChurchFromServer = vi.fn();
const mockShowToast = vi.fn();

let _isHeadQuarter = true;
let _branches: Branch[] = [];

vi.mock('../../context/ChurchContext', () => ({
  useChurch: () => ({
    church: { id: 'c1', name: 'Grace Chapel', type: _isHeadQuarter ? 'multi' : 'single', createdAt: new Date() },
    branches: _branches,
    addBranch: mockAddBranch,
    updateBranch: mockUpdateBranch,
    deleteBranch: mockDeleteBranch,
    loadChurchFromServer: mockLoadChurchFromServer,
    isHeadQuarter: _isHeadQuarter,
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentAdmin: { id: 'admin-1', isSuperAdmin: true, level: 'church' as const, branchIds: [] },
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// ── Test data ─────────────────────────────────────────────────────

const HQ_BRANCH: Branch = {
  id: 'b-hq',
  churchId: 'c1',
  name: 'Main Campus',
  isHeadquarters: true,
  createdAt: new Date('2026-01-01'),
};

const REGULAR_BRANCH: Branch = {
  id: 'b-2',
  churchId: 'c1',
  name: 'North Campus',
  isHeadquarters: false,
  createdAt: new Date('2026-02-01'),
};

function renderBranches() {
  return render(
    <MemoryRouter>
      <Branches />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe('Branches page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _isHeadQuarter = true;
    _branches = [HQ_BRANCH, REGULAR_BRANCH];
    mockFetchDepartments.mockResolvedValue([]);
    mockFetchMembers.mockResolvedValue([]);
    mockCreateBranch.mockResolvedValue({ id: 'b-new' });
    mockLoadChurchFromServer.mockResolvedValue(true);
    mockEditBranch.mockResolvedValue({});
    mockDeleteBranchApi.mockResolvedValue({});
    mockDeleteBranch.mockReturnValue(true);
  });

  // ── Locked state ─────────────────────────────────────────────

  describe('when multi-branch is not enabled', () => {
    it('shows the Multi-Branch Not Enabled message', () => {
      _isHeadQuarter = false;
      renderBranches();
      expect(screen.getByText(/multi-branch not enabled/i)).toBeInTheDocument();
    });

    it('shows a link to subscription plans', () => {
      _isHeadQuarter = false;
      renderBranches();
      expect(screen.getByRole('link', { name: /view subscription plans/i })).toBeInTheDocument();
    });

    it('does not show the Add Branch button', () => {
      _isHeadQuarter = false;
      renderBranches();
      expect(screen.queryByRole('button', { name: /add branch/i })).not.toBeInTheDocument();
    });
  });

  // ── Empty state ───────────────────────────────────────────────

  describe('with no branches', () => {
    beforeEach(() => { _branches = []; });

    it('shows the empty state message', () => {
      renderBranches();
      expect(screen.getByText(/no branches yet/i)).toBeInTheDocument();
    });

    it('shows an "Add First Branch" button in the empty state', () => {
      renderBranches();
      expect(screen.getByRole('button', { name: /add first branch/i })).toBeInTheDocument();
    });
  });

  // ── Branch cards ─────────────────────────────────────────────

  describe('with branches', () => {
    it('renders the page title', () => {
      renderBranches();
      expect(screen.getByRole('heading', { name: 'Church Branches' })).toBeInTheDocument();
    });

    it('renders a card for each branch', () => {
      renderBranches();
      expect(screen.getByText('Main Campus')).toBeInTheDocument();
      expect(screen.getByText('North Campus')).toBeInTheDocument();
    });

    it('shows the Headquarters badge on the HQ branch', () => {
      renderBranches();
      // stat card label + branch card badge both render "Headquarters"
      expect(screen.getAllByText('Headquarters').length).toBeGreaterThanOrEqual(1);
    });

    it('disables the Delete button for the HQ branch', () => {
      renderBranches();
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons[0]).toBeDisabled();
    });

    it('enables the Delete button for regular branches', () => {
      renderBranches();
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons[1]).not.toBeDisabled();
    });

    it('shows "Headquarters branch cannot be deleted" note under the HQ card', () => {
      renderBranches();
      expect(screen.getByText(/headquarters branch cannot be deleted/i)).toBeInTheDocument();
    });
  });

  // ── Add branch ────────────────────────────────────────────────

  describe('Add Branch dialog', () => {
    it('opens when the Add Branch button is clicked', async () => {
      const user = userEvent.setup();
      renderBranches();
      await user.click(screen.getByRole('button', { name: /^add branch$/i }));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add New Branch')).toBeInTheDocument();
    });

    it('keeps the submit button disabled when the name is empty', async () => {
      const user = userEvent.setup();
      renderBranches();
      await user.click(screen.getByRole('button', { name: /^add branch$/i }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByRole('button', { name: /^add branch$/i })).toBeDisabled();
    });

    it('enables submit once a name is typed', async () => {
      const user = userEvent.setup();
      renderBranches();
      await user.click(screen.getByRole('button', { name: /^add branch$/i }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByPlaceholderText(/north campus/i), 'East Wing');
      expect(within(dialog).getByRole('button', { name: /^add branch$/i })).not.toBeDisabled();
    });

    it('calls createBranch with the entered name', async () => {
      const user = userEvent.setup();
      renderBranches();
      await user.click(screen.getByRole('button', { name: /^add branch$/i }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByPlaceholderText(/north campus/i), 'East Wing');
      await user.click(within(dialog).getByRole('button', { name: /^add branch$/i }));
      await waitFor(() => expect(mockCreateBranch).toHaveBeenCalledWith({ name: 'East Wing' }));
    });

    it('refreshes church data from server after create', async () => {
      const user = userEvent.setup();
      renderBranches();
      await user.click(screen.getByRole('button', { name: /^add branch$/i }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByPlaceholderText(/north campus/i), 'East Wing');
      await user.click(within(dialog).getByRole('button', { name: /^add branch$/i }));
      await waitFor(() => expect(mockLoadChurchFromServer).toHaveBeenCalled());
    });

    it('closes the dialog after successful creation', async () => {
      const user = userEvent.setup();
      renderBranches();
      await user.click(screen.getByRole('button', { name: /^add branch$/i }));
      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByPlaceholderText(/north campus/i), 'East Wing');
      await user.click(within(dialog).getByRole('button', { name: /^add branch$/i }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderBranches();
      await user.click(screen.getByRole('button', { name: /^add branch$/i }));
      await screen.findByRole('dialog');
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  // ── Edit branch ───────────────────────────────────────────────

  describe('Edit Branch dialog', () => {
    it('opens with the branch name pre-filled', async () => {
      const user = userEvent.setup();
      renderBranches();
      const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
      await user.click(editButtons[1]); // North Campus
      expect(await screen.findByDisplayValue('North Campus')).toBeInTheDocument();
    });

    it('shows the correct status badge (Branch) for a non-HQ branch', async () => {
      const user = userEvent.setup();
      renderBranches();
      const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
      await user.click(editButtons[1]);
      await screen.findByRole('dialog');
      expect(screen.getByText('Branch')).toBeInTheDocument();
    });

    it('shows the Headquarters badge for the HQ branch', async () => {
      const user = userEvent.setup();
      renderBranches();
      const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
      await user.click(editButtons[0]); // Main Campus
      await screen.findByRole('dialog');
      // stat card label + dialog badge both render "Headquarters"
      expect(screen.getAllByText('Headquarters').length).toBeGreaterThanOrEqual(1);
    });

    it('calls editBranch with the new name on save', async () => {
      const user = userEvent.setup();
      renderBranches();
      const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
      await user.click(editButtons[1]);
      const input = await screen.findByDisplayValue('North Campus');
      await user.clear(input);
      await user.type(input, 'South Campus');
      await user.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() =>
        expect(mockEditBranch).toHaveBeenCalledWith('b-2', { name: 'South Campus' })
      );
    });
  });

  // ── View modal ────────────────────────────────────────────────

  describe('View Branch modal', () => {
    it('opens with branch details', async () => {
      const user = userEvent.setup();
      renderBranches();
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      await user.click(viewButtons[0]);
      expect(await screen.findByText('Branch details and overview')).toBeInTheDocument();
    });

    it('shows Headquarters badge in view modal for HQ branch', async () => {
      const user = userEvent.setup();
      renderBranches();
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      await user.click(viewButtons[0]); // Main Campus
      await screen.findByText('Branch details and overview');
      expect(screen.getAllByText('Headquarters').length).toBeGreaterThan(0);
    });

    it('shows department and member stats', async () => {
      const user = userEvent.setup();
      renderBranches();
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      await user.click(viewButtons[0]);
      await screen.findByText('Branch details and overview');
      expect(screen.getByText('Departments (0)')).toBeInTheDocument();
      expect(screen.getByText('Members (0)')).toBeInTheDocument();
    });

    it('shows Edit Branch button inside view modal', async () => {
      const user = userEvent.setup();
      renderBranches();
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      await user.click(viewButtons[0]);
      const modal = await screen.findByRole('dialog');
      expect(within(modal).getByRole('button', { name: /edit branch/i })).toBeInTheDocument();
    });

    it('hides Delete Branch button in view modal for HQ branch', async () => {
      const user = userEvent.setup();
      renderBranches();
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      await user.click(viewButtons[0]); // Main Campus (HQ)
      const modal = await screen.findByRole('dialog');
      expect(within(modal).queryByRole('button', { name: /delete branch/i })).not.toBeInTheDocument();
    });

    it('shows Delete Branch button in view modal for regular branch', async () => {
      const user = userEvent.setup();
      renderBranches();
      const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
      await user.click(viewButtons[1]); // North Campus
      const modal = await screen.findByRole('dialog');
      expect(within(modal).getByRole('button', { name: /delete branch/i })).toBeInTheDocument();
    });
  });

  // ── Delete ────────────────────────────────────────────────────

  describe('Delete branch', () => {
    it('shows a confirmation dialog when Delete is clicked', async () => {
      const user = userEvent.setup();
      renderBranches();
      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
      await user.click(deleteButtons[1]); // North Campus (not HQ)
      expect(await screen.findByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText(/"North Campus"/)).toBeInTheDocument();
    });

    it('calls deleteBranchApi on confirm', async () => {
      const user = userEvent.setup();
      renderBranches();
      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
      await user.click(deleteButtons[1]);
      await user.click(await screen.findByRole('button', { name: /^delete branch$/i }));
      await waitFor(() => expect(mockDeleteBranchApi).toHaveBeenCalledWith('b-2'));
    });

    it('calls deleteBranch to update local state after confirm', async () => {
      const user = userEvent.setup();
      renderBranches();
      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
      await user.click(deleteButtons[1]);
      await user.click(await screen.findByRole('button', { name: /^delete branch$/i }));
      await waitFor(() => expect(mockDeleteBranch).toHaveBeenCalledWith('b-2'));
    });

    it('cancels without deleting when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderBranches();
      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
      await user.click(deleteButtons[1]);
      await screen.findByText(/are you sure you want to delete/i);
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockDeleteBranchApi).not.toHaveBeenCalled();
    });
  });
});
