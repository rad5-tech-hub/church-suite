import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CollectionsDialogue from "../programs/recordCollections";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Api from "../../../shared/api/api";
import { showPageToast } from "../../../util/pageToast";

jest.mock("../../../shared/api/api");
jest.mock("../../../util/pageToast", () => ({
  showPageToast: jest.fn(),
}));
jest.mock("../../../hooks/usePageToast", () => ({
  usePageToast: jest.fn(),
}));

// Mock reducer
const mockReducer = (state = {}) => state;

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: { auth: mockReducer },
    preloadedState,
  });

const mockEventResponse = {
  data: {
    eventOccurrence: {
      id: "event-123",
      eventId: "1",
      date: "2025-10-10",
      startTime: "09:00",
      endTime: "11:00",
      isCancelled: false,
      hasAttendance: true,
      dayOfWeek: "Sunday",
      createdAt: "",
      updatedAt: "",
      attendances: [],
      assignedDepartments: [],
      event: { id: "1", title: "Sunday Service" },
      collection: [
        { id: "col-1", amount: "100", collection: { id: "col-1", name: "Offering" } },
        { id: "col-2", amount: "50", collection: { id: "col-2", name: "Tithe" } },
      ],
    },
  },
};

describe("CollectionsDialogue Component", () => {
  const onClose = jest.fn();
  const onSuccess = jest.fn();

  const renderComponent = (authRole = "branch") => {
    const store = createStore({ auth: { authData: { role: authRole } } });

    return render(
      <Provider store={store}>
        <CollectionsDialogue
          eventId="event-123"
          open={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", async () => {
    (Api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderComponent();

    expect(await screen.findByText(/Loading/i)).toBeInTheDocument();
  });

  it("renders error state if API fails", async () => {
    (Api.get as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch event"));

    renderComponent();

    expect(await screen.findByText(/Error/i)).toBeInTheDocument();
    expect(await screen.findByText(/Failed to fetch event/i)).toBeInTheDocument();
    expect(showPageToast).toHaveBeenCalledWith("Failed to fetch event", "error");
  });

  it("renders role-restricted message for department users", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);

    renderComponent("department");

    await waitFor(() => {
      expect(
        screen.getByText(/Collection recording is not available for department role/i)
      ).toBeInTheDocument();
    });
  });

  it("renders empty collection message if event has no collections", async () => {
    const noCollections = {
      data: {
        eventOccurrence: {
          ...mockEventResponse.data.eventOccurrence,
          collection: [],
        },
      },
    };
    (Api.get as jest.Mock).mockResolvedValueOnce(noCollections);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No collections available/i)).toBeInTheDocument();
    });
  });

  it("renders event title and collection inputs on success", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);

    renderComponent();

    expect(await screen.findByText("Sunday Service")).toBeInTheDocument();
    expect(screen.getByText("Offering")).toBeInTheDocument();
    expect(screen.getByText("Tithe")).toBeInTheDocument();
  });

  it("updates collection input value correctly", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);
    renderComponent();

    const input = await screen.findByDisplayValue("100");
    fireEvent.change(input, { target: { value: "250" } });

    expect(input).toHaveValue("250");
  });

  it("shows error toast if trying to save with empty fields", async () => {
    const modifiedData = JSON.parse(JSON.stringify(mockEventResponse));
    modifiedData.data.eventOccurrence.collection[0].amount = "";
    modifiedData.data.eventOccurrence.collection[1].amount = "";
    (Api.get as jest.Mock).mockResolvedValueOnce(modifiedData);

    renderComponent();

    await screen.findByText("Sunday Service");
    const saveBtn = screen.getByRole("button", { name: /Save Information/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith(
        "Please enter at least one collection value",
        "error"
      );
    });
  });

  it("calls API and shows success toast on valid save", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);
    (Api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    renderComponent();

    await screen.findByText("Sunday Service");

    const input = screen.getByDisplayValue("100");
    fireEvent.change(input, { target: { value: "200" } });

    const saveBtn = screen.getByRole("button", { name: /Save Information/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(Api.post).toHaveBeenCalledWith(
        "/church/event-collections/event-123",
        expect.objectContaining({
          updates: expect.any(Array),
        })
      );
      expect(showPageToast).toHaveBeenCalledWith(
        "Collections updated successfully!",
        "success"
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("handles API error gracefully during save", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);
    (Api.post as jest.Mock).mockRejectedValueOnce({
      message: "Save failed",
    });

    renderComponent();

    await screen.findByText("Sunday Service");
    const saveBtn = screen.getByRole("button", { name: /Save Information/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith(
        expect.stringContaining("Collections Error"),
        "error"
      );
    });
  });
});
