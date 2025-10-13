import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecordDialogue from "../programs/record";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Api from "../../../shared/api/api";
import { showPageToast } from "../../../util/pageToast";

// ✅ Mock dependencies
jest.mock("../../../shared/api/api");
jest.mock("../../../util/pageToast", () => ({
  showPageToast: jest.fn(),
}));
jest.mock("../../../hooks/usePageToast", () => ({
  usePageToast: jest.fn(),
}));

// ✅ Mock reducers (since you’re not using thunk middleware)
const mockReducer = (state = {}) => state;

const createMockStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      auth: mockReducer,
    },
    preloadedState,
  });

// ✅ Mock API response
const mockEventResponse = {
  data: {
    eventOccurrence: {
      id: "event-123",
      event: { id: "1", title: "Sunday Service" },
      collection: [
        { id: "col-1", amount: "100", collection: { id: "col-1", name: "Offering" } },
      ],
    },
  },
};

describe("RecordDialogue Component", () => {
  const onClose = jest.fn();

  const renderComponent = (storeOverrides = {}) => {
    const store = createMockStore({
      auth: { authData: { role: "branch" } },
      ...storeOverrides,
    });

    return render(
      <Provider store={store}>
        <RecordDialogue eventId="event-123" open={true} onClose={onClose} />
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

  it("renders error state if fetch fails", async () => {
    (Api.get as jest.Mock).mockRejectedValueOnce(new Error("Failed to fetch event"));
    renderComponent();

    expect(await screen.findByText(/Error/i)).toBeInTheDocument();
    expect(await screen.findByText(/Failed to fetch event/i)).toBeInTheDocument();
  });

  it("renders event title and input fields when fetch succeeds", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);

    renderComponent();

    expect(await screen.findByText("Sunday Service")).toBeInTheDocument();
    expect(await screen.findByText("Offering")).toBeInTheDocument();
  });

  it("updates attendance inputs and recalculates total automatically", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);
    renderComponent();

    const maleInput = await screen.findByDisplayValue("");
    fireEvent.change(maleInput, { target: { value: "10" } });

    const totalInput = screen.getAllByRole("textbox")[3];
    expect(totalInput).toHaveValue("10");
  });

  it("calls API when saving attendance and collections", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);
    (Api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    renderComponent();

    await screen.findByText("Sunday Service");

    const maleInput = screen.getAllByRole("textbox")[0];
    const collectionInput = screen.getAllByRole("textbox")[4];

    fireEvent.change(maleInput, { target: { value: "5" } });
    fireEvent.change(collectionInput, { target: { value: "200" } });

    const saveBtn = screen.getByRole("button", { name: /Save Information/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(Api.post).toHaveBeenCalledTimes(2);
      expect(showPageToast).toHaveBeenCalledWith(
        "Attendance and collections saved successfully!",
        "success"
      );
    });
  });

  it("shows error toast when API fails during save", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockEventResponse);
    (Api.post as jest.Mock).mockRejectedValueOnce({ message: "Save failed" });

    renderComponent();

    await screen.findByText("Sunday Service");

    const maleInput = screen.getAllByRole("textbox")[0];
    fireEvent.change(maleInput, { target: { value: "7" } });

    const saveBtn = screen.getByRole("button", { name: /Save Information/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith(expect.stringContaining("Error"), "error");
    });
  });
});
