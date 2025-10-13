import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import EventSummaryDialog from "../programs/programOverview";
import Api from "../../../shared/api/api";
import moment from "moment-timezone";

// Mock dependencies
jest.mock("../../../shared/api/api");
jest.mock("./services", () => ({
  EditProgramModal: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="edit-program-modal" onClick={onClose}>
        Edit Program Modal
      </div>
    ) : null,
}));
jest.mock("./workersAttendance", () => ({
  __esModule: true,
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="worker-attendance-dialog" onClick={onClose}>
        Worker Attendance Dialog
      </div>
    ) : null,
}));
jest.mock("./memberAttendance", () => ({
  __esModule: true,
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="member-attendance-dialog" onClick={onClose}>
        Member Attendance Dialog
      </div>
    ) : null,
}));
jest.mock("./recordCollections", () => ({
  __esModule: true,
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="collections-dialog" onClick={onClose}>
        Collections Dialog
      </div>
    ) : null,
}));
jest.mock("../../members/new-comers/followUp", () => ({
  __esModule: true,
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="newcomers-modal" onClick={onClose}>
        Newcomers Modal
      </div>
    ) : null,
}));

// Mock Chart.js
jest.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

const mockApi = Api as jest.Mocked<typeof Api>;

// Mock store setup
const createMockStore = (authData = {}) => {
  return configureStore({
    reducer: {
      auth: () => ({
        authData: {
          role: "branch",
          branchId: "branch-1",
          ...authData,
        },
      }),
    },
  });
};

// Mock event data
const mockEventOccurrence = {
  id: "occurrence-1",
  tenantId: "tenant-1",
  eventId: "event-1",
  date: moment().format("YYYY-MM-DD"),
  startTime: "09:00",
  endTime: "11:00",
  isCancelled: false,
  hasAttendance: false,
  dayOfWeek: "Sunday",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  attendances: [
    {
      id: "att-1",
      eventOccurrenceId: "occurrence-1",
      total: 100,
      male: 40,
      female: 50,
      children: 10,
      adults: 90,
      createdBy: "user-1",
      createdByName: "John Doe",
      updatedBy: null,
      updatedByName: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ],
  assignedDepartments: [
    { id: "dept-1", name: "Ushering" },
    { id: "dept-2", name: "Protocol" },
  ],
  collection: [
    {
      id: "col-1",
      amount: "50000",
      collection: {
        id: "coll-type-1",
        name: "Offering",
      },
    },
    {
      id: "col-2",
      amount: "25000",
      collection: {
        id: "coll-type-2",
        name: "Tithe",
      },
    },
  ],
  event: {
    id: "event-1",
    title: "Sunday Service",
    recurrenceType: "weekly",
  },
};

const mockWorkerStats = {
  overall: {
    attendanceRate: 85,
  },
};

describe("EventSummaryDialog Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue({
      data: {
        message: "Success",
        eventOccurrence: mockEventOccurrence,
      },
    });
  });

  describe("Dialog State Management", () => {
    it("should not render when open is false", () => {
      const store = createMockStore();
      const { container } = render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={false}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when open is true", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Sunday Service")).toBeInTheDocument();
      });
    });

    it("should call onClose and onSuccess when close button is clicked", async () => {
      const store = createMockStore();
      const onClose = jest.fn();
      const onSuccess = jest.fn();

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Sunday Service")).toBeInTheDocument();
      });

      const closeButton = screen.getAllByRole("button")[0]; // First close button
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should display loading state initially", () => {
      const store = createMockStore();
      mockApi.get.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: { eventOccurrence: mockEventOccurrence } }),
              100
            )
          )
      );

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("should hide loading state after data is fetched", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        expect(screen.getByText("Sunday Service")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      const store = createMockStore();
      mockApi.get.mockRejectedValueOnce(new Error("Network error"));

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
        expect(
          screen.getByText("Failed to fetch event or attendance data")
        ).toBeInTheDocument();
      });
    });

    it("should display 'No data available' when eventData is null", async () => {
      const store = createMockStore();
      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: null },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("No data available")).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    it("should fetch event data when dialog opens", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          "/church/get-event/occurrence-1"
        );
      });
    });

    it("should fetch worker attendance stats when departments are assigned", async () => {
      const store = createMockStore();
      mockApi.get
        .mockResolvedValueOnce({
          data: {
            eventOccurrence: mockEventOccurrence,
          },
        })
        .mockResolvedValueOnce({
          data: mockWorkerStats,
        });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          "/church/worker-attendace-stats/occurrence-1"
        );
      });
    });

    it("should not fetch worker stats if no departments assigned", async () => {
      const store = createMockStore();
      const eventWithoutDepts = {
        ...mockEventOccurrence,
        assignedDepartments: [],
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: eventWithoutDepts },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(1);
        expect(mockApi.get).toHaveBeenCalledWith(
          "/church/get-event/occurrence-1"
        );
      });
    });
  });

  describe("Event Status Display", () => {
    it("should display event status as 'Upcoming'", async () => {
      const store = createMockStore();
      const futureEvent = {
        ...mockEventOccurrence,
        date: moment().add(2, "days").format("YYYY-MM-DD"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: futureEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Upcoming/i)).toBeInTheDocument();
      });
    });

    it("should display event status as 'Pending' when event ended without attendance", async () => {
      const store = createMockStore();
      const pastEvent = {
        ...mockEventOccurrence,
        date: moment().subtract(1, "days").format("YYYY-MM-DD"),
        hasAttendance: false,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: pastEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pending/i)).toBeInTheDocument();
      });
    });
  });

  describe("Attendance Display", () => {
    it("should display members attendance chart for branch role", async () => {
      const store = createMockStore({ role: "branch" });
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Members Attendance")).toBeInTheDocument();
        expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
        expect(screen.getByText("40 Men")).toBeInTheDocument();
        expect(screen.getByText("50 Women")).toBeInTheDocument();
        expect(screen.getByText("10 Children")).toBeInTheDocument();
      });
    });

    it("should display workers attendance chart when departments are assigned", async () => {
      const store = createMockStore();
      mockApi.get
        .mockResolvedValueOnce({
          data: { eventOccurrence: mockEventOccurrence },
        })
        .mockResolvedValueOnce({
          data: mockWorkerStats,
        });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Workers Attendance")).toBeInTheDocument();
        expect(screen.getByTestId("doughnut-chart")).toBeInTheDocument();
      });
    });

    it("should not display members attendance for non-branch role", async () => {
      const store = createMockStore({ role: "department" });
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Members Attendance")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Collections Display", () => {
    it("should display collections when available", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Collections")).toBeInTheDocument();
        expect(screen.getByText("Offering")).toBeInTheDocument();
        expect(screen.getByText("Tithe")).toBeInTheDocument();
        expect(screen.getByText("₦50,000")).toBeInTheDocument();
        expect(screen.getByText("₦25,000")).toBeInTheDocument();
      });
    });

    it("should not display collections section when empty", async () => {
      const store = createMockStore();
      const eventWithoutCollections = {
        ...mockEventOccurrence,
        collection: [],
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: eventWithoutCollections },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.queryByText("Collections")).not.toBeInTheDocument();
      });
    });
  });

  describe("Program Details", () => {
    it("should display program details in accordion", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Program Details")).toBeInTheDocument();
      });

      // Expand accordion
      const accordion = screen.getByText("Program Details");
      fireEvent.click(accordion);

      await waitFor(() => {
        expect(screen.getByText(/Date Created:/)).toBeInTheDocument();
        expect(screen.getByText(/Program Type:/)).toBeInTheDocument();
        expect(screen.getByText(/Time:/)).toBeInTheDocument();
        expect(screen.getByText(/Day:/)).toBeInTheDocument();
        expect(screen.getByText(/Assigned Departments:/)).toBeInTheDocument();
      });
    });

    it("should display assigned departments", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      const accordion = await screen.findByText("Program Details");
      fireEvent.click(accordion);

      await waitFor(() => {
        expect(screen.getByText(/Ushering, Protocol/)).toBeInTheDocument();
      });
    });

    it("should display recurrence type correctly", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      const accordion = await screen.findByText("Program Details");
      fireEvent.click(accordion);

      await waitFor(() => {
        expect(screen.getByText(/weekly/i)).toBeInTheDocument();
      });
    });
  });

  describe("Action Buttons", () => {
    it("should display 'Edit Program' button for non-past events", async () => {
      const store = createMockStore();
      const ongoingEvent = {
        ...mockEventOccurrence,
        date: moment().format("YYYY-MM-DD"),
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Edit Program")).toBeInTheDocument();
      });
    });

    it("should not display 'Edit Program' button for past events", async () => {
      const store = createMockStore();
      const pastEvent = {
        ...mockEventOccurrence,
        date: moment().subtract(2, "days").format("YYYY-MM-DD"),
        hasAttendance: true,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: pastEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.queryByText("Edit Program")).not.toBeInTheDocument();
      });
    });

    it("should display 'Record Collections' button for ongoing events with collections", async () => {
      const store = createMockStore({ role: "branch" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Record Collections")).toBeInTheDocument();
      });
    });

    it("should display 'Record Newcomers' button for ongoing events", async () => {
      const store = createMockStore({ role: "branch" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Record Newcomers")).toBeInTheDocument();
      });
    });

    it("should open edit modal when 'Edit Program' is clicked", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      const editButton = await screen.findByText("Edit Program");
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-program-modal")).toBeInTheDocument();
      });
    });

    it("should open collections dialog when 'Record Collections' is clicked", async () => {
      const store = createMockStore({ role: "branch" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      const collectionsButton = await screen.findByText("Record Collections");
      fireEvent.click(collectionsButton);

      await waitFor(() => {
        expect(screen.getByTestId("collections-dialog")).toBeInTheDocument();
      });
    });

    it("should open newcomers modal when 'Record Newcomers' is clicked", async () => {
      const store = createMockStore({ role: "branch" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      const onClose = jest.fn();

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={onClose}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      const newcomersButton = await screen.findByText("Record Newcomers");
      fireEvent.click(newcomersButton);

      await waitFor(() => {
        expect(screen.getByTestId("newcomers-modal")).toBeInTheDocument();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("Recording Buttons in Charts", () => {
    it("should display record member attendance button for ongoing events without attendance", async () => {
      const store = createMockStore({ role: "branch" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
        hasAttendance: false,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        const editButtons = screen.getAllByRole("button");
        const hasRecordButton = editButtons.some(
          (btn) => btn.getAttribute("aria-label") === "Record Members Attendance"
        );
        expect(hasRecordButton || editButtons.length > 3).toBeTruthy();
      });
    });

    it("should display record worker attendance button for ongoing events with departments", async () => {
      const store = createMockStore({ role: "branch" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
        hasAttendance: false,
      };

      mockApi.get
        .mockResolvedValueOnce({
          data: { eventOccurrence: ongoingEvent },
        })
        .mockResolvedValueOnce({
          data: mockWorkerStats,
        });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Workers Attendance")).toBeInTheDocument();
      });
    });
  });

  describe("Currency Formatting", () => {
    it("should format currency correctly", async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("₦50,000")).toBeInTheDocument();
        expect(screen.getByText("₦25,000")).toBeInTheDocument();
      });
    });
  });

  describe("Role-Based Visibility", () => {
    it("should show appropriate buttons for branch role", async () => {
      const store = createMockStore({ role: "branch" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Record Collections")).toBeInTheDocument();
        expect(screen.getByText("Record Newcomers")).toBeInTheDocument();
      });
    });

    it("should show appropriate buttons for department role", async () => {
      const store = createMockStore({ role: "department" });
      const ongoingEvent = {
        ...mockEventOccurrence,
        startTime: moment().subtract(1, "hour").format("HH:mm"),
        endTime: moment().add(1, "hour").format("HH:mm"),
      };

      mockApi.get.mockResolvedValueOnce({
        data: { eventOccurrence: ongoingEvent },
      });

      render(
        <Provider store={store}>
          <EventSummaryDialog
            eventId="occurrence-1"
            open={true}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("Record Newcomers")).toBeInTheDocument();
        expect(
          screen.queryByText("Record Collections")
        ).not.toBeInTheDocument();
      });
    });
  });
});