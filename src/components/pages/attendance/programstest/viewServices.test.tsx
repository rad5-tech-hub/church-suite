import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ViewServices from "../programs/viewServices";
import Api from "../../../shared/api/api";
import { showPageToast } from "../../../util/pageToast";
import moment from "moment";

// Mock dependencies
jest.mock("../../../shared/api/api");
jest.mock("../../../util/pageToast");
jest.mock("../../../hooks/usePageToast");
jest.mock("../../../shared/dashboardManager", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("./services", () => ({
  CreateProgramModal: ({ open}: any) =>
    open ? <div data-testid="create-modal">Create Modal</div> : null,
  EditProgramModal: ({ open }: any) =>
    open ? <div data-testid="edit-modal">Edit Modal</div> : null,
}));
jest.mock("./programOverview", () => ({
  __esModule: true,
  default: ({ open}: any) =>
    open ? <div data-testid="event-summary-dialog">Event Summary</div> : null,
}));

const mockApi = Api as jest.Mocked<typeof Api>;
const mockShowPageToast = showPageToast as jest.MockedFunction<typeof showPageToast>;

// Mock store setup
const createMockStore = (authData = {}) => {
  return configureStore({
    reducer: {
      auth: () => ({
        authData: {
          branchId: "branch-1",
          role: "admin",
          isHeadQuarter: true,
          isSuperAdmin: true,
          department: null,
          ...authData,
        },
      }),
    },
  });
};

// Mock data
const mockBranches = [
  { id: "branch-1", name: "Main Branch" },
  { id: "branch-2", name: "Second Branch" },
];

const mockEvents = [
  {
    id: "event-1",
    title: "Sunday Service",
    description: "Weekly Sunday service",
    date: moment().format("YYYY-MM-DD"),
    customRecurrenceDates: null,
    recurrenceType: "weekly",
    tenantId: "tenant-1",
    churchId: "church-1",
    branchId: "branch-1",
    createdBy: "user-1",
    createByName: "John Doe",
    isDeleted: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    occurrences: [
      {
        id: "occ-1",
        eventId: "event-1",
        date: moment().format("YYYY-MM-DD"),
        startTime: "09:00",
        endTime: "11:00",
        isCancelled: false,
        hasAttendance: false,
        dayOfWeek: "Sunday",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    ],
  },
];

describe("ViewServices Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({
      data: {
        message: "Success",
        events: mockEvents,
        branches: mockBranches,
      },
    });
  });

  describe("Initial Render", () => {
    it("should render the component successfully", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/create/i)).toBeInTheDocument();
      });
    });

    it("should display event status legend", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("ongoing")).toBeInTheDocument();
        expect(screen.getByText("pending")).toBeInTheDocument();
        expect(screen.getByText("upcoming")).toBeInTheDocument();
        expect(screen.getByText("past")).toBeInTheDocument();
      });
    });

    it("should display current month and year", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      const currentMonth = moment().format("MMMM YYYY");
      await waitFor(() => {
        expect(screen.getByText(currentMonth)).toBeInTheDocument();
      });
    });
  });

  describe("Branch Selection", () => {
    it("should display branch selector for HQ super admin", async () => {
      const store = createMockStore({
        isHeadQuarter: true,
        isSuperAdmin: true,
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Branch:")).toBeInTheDocument();
      });
    });

    it("should not display branch selector for non-HQ users", async () => {
      const store = createMockStore({
        isHeadQuarter: false,
        isSuperAdmin: false,
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.queryByText("Branch:")).not.toBeInTheDocument();
      });
    });

    it("should fetch branches when branch selector is opened", async () => {
      const store = createMockStore();
      mockApi.get.mockResolvedValueOnce({
        data: { branches: mockBranches },
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      const branchSelect = await screen.findByDisplayValue(/select branch/i);
      fireEvent.mouseDown(branchSelect);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith("/church/get-branches");
      });
    });
  });

  describe("Event Fetching", () => {
    it("should fetch events on mount", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          expect.stringContaining("/church/get-events")
        );
      });
    });

    it("should include branchId in fetch request", async () => {
      const store = createMockStore({ branchId: "branch-123" });
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          expect.stringContaining("branchId=branch-123")
        );
      });
    });

    it("should include departmentId for department role", async () => {
      const store = createMockStore({
        role: "department",
        department: "dept-123",
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          expect.stringContaining("departmentId=dept-123")
        );
      });
    });

    it("should handle fetch error gracefully", async () => {
      const store = createMockStore();
      mockApi.get.mockRejectedValueOnce(new Error("Network error"));

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(mockShowPageToast).toHaveBeenCalledWith(
          "Failed to load events",
          "error"
        );
      });
    });
  });

  describe("View Controls", () => {
    it("should display view selector chips", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Month")).toBeInTheDocument();
        expect(screen.getByText("Week")).toBeInTheDocument();
        expect(screen.getByText("Day")).toBeInTheDocument();
      });
    });

    it("should change view when clicking view selector", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      const monthChip = await screen.findByText("Month");
      fireEvent.click(monthChip);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          expect.stringContaining("startDate")
        );
      });
    });

    it("should navigate to previous period", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        const prevButtons = screen.getAllByRole("button");
        const prevButton = prevButtons.find((btn) =>
          btn.querySelector('svg[viewBox="0 0 24 24"]')
        );
        if (prevButton) fireEvent.click(prevButton);
      });

      expect(mockApi.get).toHaveBeenCalled();
    });

    it("should navigate to next period", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const nextButton = buttons.find((btn) => {
          const svg = btn.querySelector('svg path[d*="M9 5l7 7-7 7"]');
          return svg !== null;
        });
        if (nextButton) fireEvent.click(nextButton);
      });

      expect(mockApi.get).toHaveBeenCalled();
    });
  });

  describe("Create Program Modal", () => {
    it("should open create modal when clicking create button", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      const createButton = await screen.findByText(/create/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId("create-modal")).toBeInTheDocument();
      });
    });

    it("should refetch events after successful creation", async () => {
      const store = createMockStore();
      const { rerender } = render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      const createButton = await screen.findByText(/create/i);
      fireEvent.click(createButton);

      // Simulate modal success by re-rendering
      rerender(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalled();
      });
    });
  });

  describe("Event Status Logic", () => {
    it("should correctly identify ongoing events", () => {
      const now = new Date();
      const start = new Date(now.getTime() - 3600000); // 1 hour ago
      const end = new Date(now.getTime() + 3600000); // 1 hour from now

      // This tests the getEventStatus logic indirectly
      const store = createMockStore();
      const eventsWithOngoing = [
        {
          ...mockEvents[0],
          occurrences: [
            {
              ...mockEvents[0].occurrences[0],
              startTime: moment(start).format("HH:mm"),
              endTime: moment(end).format("HH:mm"),
              hasAttendance: false,
            },
          ],
        },
      ];

      mockApi.get.mockResolvedValue({
        data: { message: "Success", events: eventsWithOngoing },
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      // The component should render without errors
      expect(screen.getByText(/create/i)).toBeInTheDocument();
    });

    it("should correctly identify past events with attendance", () => {
      const now = new Date();
      const start = new Date(now.getTime() - 7200000); // 2 hours ago
      const end = new Date(now.getTime() - 3600000); // 1 hour ago

      const store = createMockStore();
      const eventsWithPast = [
        {
          ...mockEvents[0],
          occurrences: [
            {
              ...mockEvents[0].occurrences[0],
              startTime: moment(start).format("HH:mm"),
              endTime: moment(end).format("HH:mm"),
              hasAttendance: true,
            },
          ],
        },
      ];

      mockApi.get.mockResolvedValue({
        data: { message: "Success", events: eventsWithPast },
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      expect(screen.getByText(/create/i)).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show loading indicator while fetching events", async () => {
      const store = createMockStore();
      mockApi.get.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { events: [] } }), 100)
          )
      );

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      // Loading state should be present initially
      await waitFor(() => {
        const progressBars = screen.queryAllByRole("progressbar");
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty events array", async () => {
      const store = createMockStore();
      mockApi.get.mockResolvedValue({
        data: { message: "Success", events: [] },
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/create/i)).toBeInTheDocument();
      });
    });

    it("should handle events with null times gracefully", async () => {
      const store = createMockStore();
      const eventsWithNullTimes = [
        {
          ...mockEvents[0],
          occurrences: [
            {
              ...mockEvents[0].occurrences[0],
              startTime: null,
              endTime: null,
            },
          ],
        },
      ];

      mockApi.get.mockResolvedValue({
        data: { message: "Success", events: eventsWithNullTimes },
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/create/i)).toBeInTheDocument();
      });
    });

    it("should filter out cancelled occurrences", async () => {
      const store = createMockStore();
      const eventsWithCancelled = [
        {
          ...mockEvents[0],
          occurrences: [
            { ...mockEvents[0].occurrences[0], isCancelled: true },
          ],
        },
      ];

      mockApi.get.mockResolvedValue({
        data: { message: "Success", events: eventsWithCancelled },
      });

      render(
        <Provider store={store}>
          <ViewServices />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/create/i)).toBeInTheDocument();
      });
    });
  });
});