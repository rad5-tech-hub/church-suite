import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import WorkerAttendanceDialogue from "../programs/workersAttendance";
import Api from "../../../shared/api/api";
import { showPageToast } from "../../../util/pageToast";

jest.mock("../../../shared/api/api");
jest.mock("../../../util/pageToast", () => ({
  showPageToast: jest.fn(),
}));

const mockStore = configureStore([]);

const mockAuthData = {
  role: "branch",
  branchId: "branch-001",
  department: "dept-001",
};

const assignedDepartments = [
  { id: "dept-001", name: "Ushering" },
  { id: "dept-002", name: "Choir" },
];

const mockStatsResponse = {
  data: {
    eventOccurrenceId: "occ-001",
    eventId: "event-123",
    overall: {
      totalMembers: 5,
      presentCount: 3,
      absentCount: 2,
      attendanceRate: 60,
    },
    departments: [
      {
        departmentId: "dept-001",
        departmentName: "Ushering",
        totalMembers: 3,
        presentCount: 2,
        absentCount: 1,
        attendanceRate: 66.7,
        members: [
          { memberId: "w1", memberName: "John", status: "present" },
          { memberId: "w2", memberName: "Jane", status: "absent" },
        ],
      },
    ],
  },
};

const mockMembersResponse = {
  data: {
    message: "Fetched successfully",
    members: [
      { member: { id: "w1", name: "John" } },
      { member: { id: "w2", name: "Jane" } },
    ],
  },
};

describe("WorkerAttendanceDialogue Component", () => {
  const onClose = jest.fn();
  const onSuccess = jest.fn();

  const renderComponent = (storeOverrides = {}, propsOverrides = {}) => {
    const store = mockStore({
      auth: { authData: mockAuthData },
      ...storeOverrides,
    });

    return render(
      <Provider store={store}>
        <WorkerAttendanceDialogue
          open={true}
          eventId="event-123"
          onClose={onClose}
          onSuccess={onSuccess}
          assignedDepartments={assignedDepartments}
          {...propsOverrides}
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

    expect(
      await screen.findByText(/Loading Worker Attendance/i)
    ).toBeInTheDocument();
  });

  it("renders error state when fetching stats fails", async () => {
    (Api.get as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(showPageToast).toHaveBeenCalledWith("Network Error", "error");
    });
  });

  it("renders departments and workers correctly on success", async () => {
    (Api.get as jest.Mock)
      .mockResolvedValueOnce(mockStatsResponse) // stats fetch
      .mockResolvedValueOnce(mockMembersResponse); // members fetch

    renderComponent();

    expect(await screen.findByText("Worker Attendance")).toBeInTheDocument();
    expect(await screen.findByLabelText("Select Department")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Jane")).toBeInTheDocument();
    });
  });

  it("toggles worker attendance and updates status correctly", async () => {
    (Api.get as jest.Mock)
      .mockResolvedValueOnce(mockStatsResponse)
      .mockResolvedValueOnce(mockMembersResponse);

    renderComponent();

    await screen.findByText("John");

    const janeCheckbox = screen.getAllByRole("checkbox")[1];
    expect(janeCheckbox).not.toBeChecked();

    fireEvent.click(janeCheckbox);

    await waitFor(() => {
      expect(janeCheckbox).toBeChecked();
    });
  });

  it("checks all workers when 'Check All' is clicked", async () => {
    (Api.get as jest.Mock)
      .mockResolvedValueOnce(mockStatsResponse)
      .mockResolvedValueOnce(mockMembersResponse);

    renderComponent();

    await screen.findByText("John");
    const checkAll = screen.getByLabelText(/Check All/i);
    fireEvent.click(checkAll);

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
  });

  it("calls API and shows success toast on submit", async () => {
    (Api.get as jest.Mock)
      .mockResolvedValueOnce(mockStatsResponse)
      .mockResolvedValueOnce(mockMembersResponse);
    (Api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    renderComponent();

    await screen.findByText("John");

    const saveButton = screen.getByRole("button", { name: /Save Attendance/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(Api.post).toHaveBeenCalledTimes(1);
      expect(showPageToast).toHaveBeenCalledWith(
        "Attendance for Ushering submitted successfully!",
        "success"
      );
    });
  });

  it("shows error toast when submit fails", async () => {
    (Api.get as jest.Mock)
      .mockResolvedValueOnce(mockStatsResponse)
      .mockResolvedValueOnce(mockMembersResponse);
    (Api.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: "Submit failed" } },
    });

    renderComponent();

    await screen.findByText("John");

    const saveButton = screen.getByRole("button", { name: /Save Attendance/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith("Submit failed", "error");
    });
  });

  it("renders no department message if user has no assigned departments", async () => {
    (Api.get as jest.Mock).mockResolvedValueOnce(mockStatsResponse);
    renderComponent({}, { assignedDepartments: [] });

    await waitFor(() => {
      expect(
        screen.getByText(/No assigned department found/i)
      ).toBeInTheDocument();
    });
  });
});
