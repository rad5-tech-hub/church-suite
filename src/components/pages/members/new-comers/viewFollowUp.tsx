import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  TextField,
  Select as MuiSelect,
  Divider,
  FormControl,
  Autocomplete,
  InputAdornment,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  SentimentVeryDissatisfied as EmptyIcon,
  ChevronRight,
  ChevronLeft,
  Search,
  AttachFile,
  Close,
} from "@mui/icons-material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { AiOutlineDelete } from "react-icons/ai";
import { PiDownloadThin } from "react-icons/pi";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { IoMdClose } from "react-icons/io";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";
import { MdOutlineEdit } from "react-icons/md";
import EditRegistrationModal from "./editNewcomers";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';

// Types
interface FollowUp {
  id: string;
  name: string;
  sex: string;
  phoneNo: string;
  address: string;
  branch: { name: string };
  branchId: string;
  timer: number;
  birthMonth: string;
  birthDay: string;
  maritalStatus: string;
  isActive: boolean;
  isDeleted: boolean;
  eventAttended: { event: EventAttended };
}

interface Branch {
  id: string;
  name: string;
}

interface EventAttended {
  title: string;
}

interface Event {
  id: string;
  title: string;
  occurrenceDate?: string; // Optional, as it's not used in the new logic
  occurrences: {
    id: string;
    date: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

interface Pagination {
  hasNextPage: boolean;
  nextPage: string | null;
}

interface FetchFollowUpsResponse {
  message: string;
  pagination: Pagination;
  results: FollowUp[];
}

interface TableColumnWidths {
  snumber: string;
  name: string;
  branch: string;
  contact: string;
  address: string;
  actions: string;
}

// Constants
const TABLE_COLUMN_WIDTHS: TableColumnWidths = {
  snumber: "3%",
  name: "25%",
  branch: '13%',
  contact: "10%",
  address: "25%", // Used for event column width
  actions: "7%",
};

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading: boolean;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  onPageChange,
  currentPage,
  isLargeScreen,
  isLoading,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      py: 2,
      px: { xs: 2, sm: 3 },
      color: "#777280",
      gap: 2,
      flexWrap: "wrap",
    }}
  >
    <Typography sx={{ fontSize: isLargeScreen ? "0.75rem" : "0.875rem", color: "#777280" }}>
      Page {currentPage}
    </Typography>
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        onClick={() => onPageChange("prev")}
        disabled={!hasPrevPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: !hasPrevPage || isLoading ? "#4d4d4e8e" : "#F6F4FE",
          color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      <Button
        onClick={() => onPageChange("next")}
        disabled={!hasNextPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: !hasNextPage || isLoading ? "#4d4d4e8e" : "#F6F4FE",
          color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </Box>
  </Box>
);

// Components
interface EmptyStateProps {
  error: string | null;
  onAddFollowUp: () => void;
  isLargeScreen: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ error, onAddFollowUp, isLargeScreen }) => (
  <Box
    sx={{
      textAlign: "center",
      py: 8,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <EmptyIcon sx={{ fontSize: 60, color: "rgba(255, 255, 255, 0.1)", mb: 2 }} />
    <Typography variant="h6" color="gray" sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
      {error || "Newcomers Not Available"}
    </Typography>
    <Button
      variant="contained"
      onClick={onAddFollowUp}
      sx={{
        backgroundColor: "#363740",
        px: { xs: 2, sm: 2 },
        mt: 2,
        borderRadius: 50,
        py: 1,
        fontSize: isLargeScreen ? "0.875rem" : undefined,
        color: "var(--color-text-on-primary)",
        "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
      }}
    >
      Add Newcomer
    </Button>
  </Box>
);

interface FollowUpRowProps {
  followUp: FollowUp;
  index: number;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, followUp: FollowUp) => void;
  isLargeScreen: boolean;
  loading: boolean;
}

const FollowUpRow: React.FC<FollowUpRowProps> = React.memo(({ followUp, index, onMenuOpen, isLargeScreen, loading }) => (
  <TableRow
    sx={{
      backgroundColor: followUp.isDeleted ? "rgba(0, 0, 0, 0.04)" : "#4d4d4e8e",
      "&:hover": {
        backgroundColor: "#4d4d4e8e",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      },
      transition: "all 0.2s ease",
      mb: 1,
    }}
  >
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.snumber, fontSize: isLargeScreen ? "0.875rem" : undefined, color: followUp.isDeleted ? "gray" : "#F6F4FE", textDecoration: followUp.isDeleted ? "line-through" : "none" }}>
      {(index + 1).toString().padStart(2, "0")}
    </TableCell>
    <TableCell sx={{ color: followUp.isDeleted ? "gray" : "#F6F4FE", display: "flex", alignItems: "center", gap: 1, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2 }}>
      <Box className="py-2 px-3 rounded-full bg-[#F6F4FE] text-[#160F38] font-bold text-lg mr-2">
        {followUp.name.split(" ").map((name) => name.charAt(0)).join("")}
      </Box>
      <Box>
        {followUp.name}
        <Typography component="span" sx={{ display: "block", fontSize: "13px", color: "#777280" }}>
          {followUp.sex || "-"}
        </Typography>
      </Box>
    </TableCell>
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.contact, fontSize: isLargeScreen ? "0.875rem" : undefined, color: followUp.isDeleted ? "gray" : "#F6F4FE", textDecoration: followUp.isDeleted ? "line-through" : "none" }}>
      {followUp.phoneNo || "N/A"}
    </TableCell>
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.branch, fontSize: isLargeScreen ? "0.875rem" : undefined, color: followUp.isDeleted ? "gray" : "#F6F4FE", textDecoration: followUp.isDeleted ? "line-through" : "none" }}>
      {followUp.branch.name || "N/A"}
    </TableCell>
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.address, fontSize: isLargeScreen ? "0.875rem" : undefined, color: followUp.isDeleted ? "gray" : "#F6F4FE", textDecoration: followUp.isDeleted ? "line-through" : "none" }}>
      {followUp.eventAttended?.event?.title || "N/A"}
    </TableCell>
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined }}>
      <IconButton
        onClick={(e) => onMenuOpen(e, followUp)}
        disabled={loading || followUp.isDeleted}
        sx={{ borderRadius: 1, backgroundColor: "#e1e1e1", "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9, color: "#ffffff" } }}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </TableCell>
  </TableRow>
));

interface ActionMenuProps {
  anchorEl: HTMLElement | null;
  currentFollowUp: FollowUp | null;
  onClose: () => void;
  onAction: (action: string) => void;
  onView: () => void;
  isLargeScreen: boolean;
  loading: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ anchorEl, onClose, onAction, onView, isLargeScreen, loading }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    anchorOrigin={{ vertical: "top", horizontal: "right" }}
    transformOrigin={{ vertical: "top", horizontal: "right" }}
    PaperProps={{ sx: { "& .MuiMenuItem-root": { fontSize: isLargeScreen ? "0.875rem" : undefined } } }}
  >
    <MenuItem onClick={onView} disabled={loading}>
      <MdOutlineEdit className="mr-2 text-lg"/>
      Edit
    </MenuItem>
    <MenuItem onClick={() => onAction("delete")} disabled={loading}>
      <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
      Delete
    </MenuItem>
  </Menu>
);

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: string | null;
  followUpName: string | undefined;
  isLargeScreen: boolean;
  loading: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ open, onClose, onConfirm, followUpName, isLargeScreen, loading }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs">
    <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
      Delete Newcomer
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
        Are you sure you want to delete {followUpName}?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }} disabled={loading}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        disabled={loading}
        sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
      >
        {loading ? "Processing..." : "Delete"}
      </Button>
    </DialogActions>
  </Dialog>
);

interface DatePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onDateSelect: (date: Dayjs | null) => void;
  onDateApply: () => void;
}

const DatePickerDialog: React.FC<DatePickerDialogProps> = ({ open, onClose, onDateSelect, onDateApply }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs">
    <DialogTitle>Select Date</DialogTitle>
    <DialogContent>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          onChange={(newValue) => onDateSelect(newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: 'outlined',
            }
          }}
        />
      </LocalizationProvider>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        onClick={onDateApply}
        variant="contained"
      >
        Apply
      </Button>
    </DialogActions>
  </Dialog>
);

// Main Component
const ViewFollowUp: React.FC = () => {
  usePageToast('view-newcomers')
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const navigate = useNavigate();
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // State
  const [state, setState] = useState({
    followUps: [] as FollowUp[],
    filteredFollowUps: [] as FollowUp[],
    branches: [] as Branch[],
    events: [] as Event[],
    filteredNames: [] as FollowUp[],
    pagination: { hasNextPage: false, nextPage: null } as Pagination,
    pageHistory: [] as string[],
    currentPage: 1,
    loading: true,
    exportLoading: false,
    isLoading: false,
    isSearching: false,
    error: null as string | null,
    confirmModalOpen: false,
    isModalOpen: false,
    editModalOpen: false,
    currentFollowUp: null as FollowUp | null,
    isBranchSelectOpen: false,
    isDrawerOpen: false,
    isNameDropdownOpen: false,
    openExcelDialog: false,
    selectedFile: null as File | null,
    isDragging: false,
    actionType: null as string | null,
    anchorEl: null as HTMLElement | null,
    searchName: "",
    searchType: "",
    selectedBranchId: authData?.branchId || "",
    uploadBranchId: '' as string | null,
    selectedEventId: "",
    eventsLoading: false,
    dateDialogOpen: false,
    selectedDate: null as Dayjs | null,
    types: [] as { id: string; name: string }[],
  });

  // State Handlers
  const handleStateChange = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((prev) => {
        const newState = { ...prev, [key]: value };
        if (key === "searchName") {
          const searchTerm = (value as string).toLowerCase();
          newState.filteredNames = prev.followUps.filter((followUp) =>
            followUp.name.toLowerCase().includes(searchTerm)
          );
          newState.isNameDropdownOpen = !!searchTerm && newState.filteredNames.length > 0;
        }
        return newState;
      });
    },
    []
  );

  const fetchBranches = useCallback(async () => {
    if (branchesLoaded || branchesLoading) return;
    setBranchesLoading(true);
    try {
      const response = await Api.get<{ branches: Branch[] }>("/church/get-branches");
      handleStateChange("branches", response.data?.branches || []);
      setBranchesLoaded(true);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      showPageToast("Failed to load branches. Please try again.", "error");
    } finally {
      setBranchesLoading(false);
    }
  }, [handleStateChange, branchesLoaded, branchesLoading]);

  const fetchEvents = useCallback(async (date: Dayjs | null = null) => {
    if (!state.selectedBranchId) {
      handleStateChange("events", []);
      handleStateChange("selectedEventId", "");
      handleStateChange("eventsLoading", false);
      return;
    }
    handleStateChange("eventsLoading", true);
    try {
      const params = new URLSearchParams();
      const branchId = state.selectedBranchId;
      if (branchId) {
        params.append("branchId", branchId);
      }
      if (authData?.role === "department") {
        if (!authData.department) throw new Error("No department found");
        params.append("departmentId", authData.department);
      }
      if (date) {
        params.append("date", date.format('YYYY-MM-DD'));
      }
      const response = await Api.get<{ events: Event[] }>(`/church/get-events?${params.toString()}`);
      handleStateChange("events", response.data?.events || []);
      handleStateChange("selectedEventId", "");
    } catch (error) {
      console.error("Failed to fetch events:", error);
      showPageToast("Failed to load events. Please try again.", "error");
      handleStateChange("events", []);
      handleStateChange("selectedEventId", "");
    } finally {
      handleStateChange("eventsLoading", false);
    }
  }, [handleStateChange, state.selectedBranchId, authData]);

  const handleBranchOpen = useCallback(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleBranchChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const value = e.target.value;
      handleStateChange("selectedBranchId", value);
      handleStateChange("events", []);
      handleStateChange("selectedEventId", "");
      if (value) {
        fetchEvents(state.selectedDate);
      }
    },
    [handleStateChange, fetchEvents, state.selectedDate]
  );

  // Data fetching
  const fetchFollowUps = useCallback(async (url: string | null = "/member/get-follow-up") => {
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      const apiUrl = (() => {
        const base = url || "/member/get-follow-up";
        const separator = base.includes("?") ? "&" : "?";
        return `${base}${separator}branchId=${authData?.branchId || ""}`;
      })();

      const response = await Api.get<FetchFollowUpsResponse>(apiUrl);

      const data = {
        followUps: response.data.results || [],
        pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
      };

      setState((prev) => ({
        ...prev,
        followUps: data.followUps,
        filteredFollowUps: data.followUps,
        filteredNames: data.followUps,
        pagination: data.pagination,
        loading: false,
        types: [...new Set((data.followUps || []).map((m: FollowUp) => m.phoneNo))].map((type, index) => ({
          id: index.toString(),
          name: type,
        })),
      }));

      return data;
    } catch (error) {
      console.error("Failed to fetch Newcomers:", error);
      handleStateChange("followUps", []);
      handleStateChange("filteredFollowUps", []);
      handleStateChange("pagination", { hasNextPage: false, nextPage: null });
      handleStateChange("error", "Failed to load Newcomers. Please try again later.");
      handleStateChange("loading", false);
      showPageToast("Failed to load Newcomers", 'error');
      return { followUps: [], pagination: { hasNextPage: false, nextPage: null } };
    }
  }, [handleStateChange, authData]);

  const refreshFollowUps = useCallback(async () => {
    try {
      const data = await fetchFollowUps();
      setState((prev) => ({
        ...prev,
        followUps: data.followUps,
        filteredFollowUps: data.followUps,
        pagination: data.pagination,
        currentPage: 1,
        pageHistory: [],
        loading: false,
      }));
    } catch (error) {
      handleStateChange("loading", false);
    }
  }, [fetchFollowUps, handleStateChange]);

  // 🔍 Search handlers
  const searchFollowUps = useCallback(async () => {
    handleStateChange("isSearching", true);
    handleStateChange("currentPage", 1);
    handleStateChange("pageHistory", []);

    try {
      const params = new URLSearchParams();
      if (state.searchName) {
        params.append("search", state.searchName);
        params.append("searchField", "name");
      }
      if (state.selectedBranchId) {
        params.append("branchId", state.selectedBranchId);
      }
      if (state.selectedEventId) {
        params.append("eventOccurrenceId", state.selectedEventId);
      }

      const response = await Api.get<FetchFollowUpsResponse>(
        `/member/get-follow-up?${params.toString()}`
      );

      setState((prev) => ({
        ...prev,
        filteredFollowUps: response.data.results || [],
        pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
        isDrawerOpen: false,
        isSearching: false,
      }));

      showPageToast("Search completed successfully!", "success");
    } catch (error: any) {
      console.error("❌ Error searching follow-ups:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to search follow-ups. Please try again.";

      setState((prev) => ({
        ...prev,
        filteredFollowUps: [],
        pagination: { hasNextPage: false, nextPage: null },
        currentPage: 1,
        pageHistory: [],
        isDrawerOpen: false,
        isSearching: false,
      }));

      showPageToast(errorMessage, "error");
    }
  }, [
    state.searchName,
    state.selectedBranchId,
    state.selectedEventId,
    handleStateChange,
  ]);

  const searchFollowUpsWithPagination = useCallback(
    async (
      url: string,
      searchName: string,
      selectedBranchId: string,
      selectedEventId: string
    ) => {
      try {
        const params = new URLSearchParams();
        if (searchName) {
          params.append("search", searchName);
          params.append("searchField", "name");
        }
        if (selectedBranchId) {
          params.append("branchId", selectedBranchId);
        }
        if (selectedEventId) {
          params.append("eventOccurrenceId", selectedEventId);
        }

        const fullUrl = url.includes("?")
          ? `${url}&${params.toString()}`
          : `${url}?${params.toString()}`;

        const response = await Api.get<FetchFollowUpsResponse>(fullUrl);

        return {
          followUps: response.data.results || [],
          pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
        };
      } catch (error) {
        console.error("Error searching Newcomers with pagination:", error);
        throw error;
      }
    },
    []
  );

  // Pagination handlers
  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const url =
          direction === "next"
            ? state.pagination.nextPage
            : state.pageHistory.length > 0
            ? state.pageHistory[state.pageHistory.length - 2] || "/member/get-follow-up"
            : null;

        if (!url) throw new Error(direction === "next" ? "No next page available" : "No previous page available");

        const data = state.searchName || state.selectedBranchId || state.selectedEventId
          ? await searchFollowUpsWithPagination(
              url,
              state.searchName,
              state.selectedBranchId,
              state.selectedEventId
            )
          : await fetchFollowUps(url);

        setState((prev) => ({
          ...prev,
          filteredFollowUps: data.followUps,
          pagination: data.pagination,
          pageHistory: direction === "next" ? [...prev.pageHistory, url] : prev.pageHistory.slice(0, -1),
          currentPage: direction === "next" ? prev.currentPage + 1 : prev.currentPage - 1,
          loading: false,
        }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to load page";
        console.error(`Error fetching ${direction} page:`, error);
        setState((prev) => ({
          ...prev,
          filteredFollowUps: [],
          pagination: { hasNextPage: false, nextPage: null },
          currentPage: 1,
          pageHistory: [],
          error: errorMessage,
          loading: false,
        }));
        showPageToast(errorMessage, 'error');
      }
    },
    [
      state.pagination.nextPage,
      state.pageHistory,
      state.searchName,
      state.selectedBranchId,
      state.selectedEventId,
      fetchFollowUps,
      handleStateChange,
      isMobile,
    ]
  );

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, followUp: FollowUp) => {
    setState((prev) => ({ ...prev, anchorEl: event.currentTarget, currentFollowUp: followUp }));
  };

  const handleMenuClose = () => setState((prev) => ({ ...prev, anchorEl: null }));

  const showConfirmation = (action: string) => {
    setState((prev) => ({ ...prev, actionType: action, confirmModalOpen: true }));
    handleMenuClose();
  };

  const handleEditOpen = useCallback(() => {
    handleStateChange("editModalOpen", true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleEditClose = useCallback(() => {
    handleStateChange("editModalOpen", false);
    handleStateChange("currentFollowUp", null);
  }, [handleStateChange]);

  const handleConfirmedAction = async () => {
    if (!state.currentFollowUp || !state.actionType) return;

    try {
      setState((prev) => ({ ...prev, loading: true }));
      if (state.actionType === "delete") {
        await Api.delete(`/followUp/delete-followup/${state.currentFollowUp.id}`);
        setState((prev) => ({
          ...prev,
          followUps: prev.followUps.filter((followUp) => followUp.id !== state.currentFollowUp!.id),
          filteredFollowUps: prev.filteredFollowUps.filter(
            (followUp) => followUp.id !== state.currentFollowUp!.id
          ),
        }));
        showPageToast("Newcomer deleted successfully!", 'success');
      }
    } catch (error) {
      console.error("Action error:", error);
      showPageToast(`Failed to ${state.actionType} Newcomer`, 'error');
    } finally {
      setState((prev) => ({
        ...prev,
        loading: false,
        confirmModalOpen: false,
        actionType: null,
        currentFollowUp: null,
      }));
    }
  };

  // Export to Excel
  const handleExportExcel = useCallback(async () => {
    setState((prev) => ({ ...prev, exportLoading: true }));
    try {
      const response = await Api.get(`/member/export-followup${authData?.branchId ? `?branchId=${authData?.branchId}` : ''}`, { responseType: "blob" });
      const contentDisposition = response.headers["content-disposition"];
      let filename = "newcomers_export.xlsx";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showPageToast("Excel file exported successfully!", 'success');
    } catch (error: any) {
      console.error("Failed to export Newcomers:", error);
      showPageToast(error.response?.data?.message || "Failed to export Excel file. Please try again.", 'error');
    } finally {
      setState((prev) => ({ ...prev, exportLoading: false }));
    }
  }, [authData]);

  // Fetch branches and events on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches, authData?.branchId, state.selectedDate]);

  // Updated renderMobileFilters function
  const renderMobileFilters = () => (
    <Drawer
      anchor="top"
      open={state.isDrawerOpen}
      onClose={() => setState((prev) => ({ ...prev, isDrawerOpen: false }))}
      sx={{
        "& .MuiDrawer-paper": {
          backgroundColor: "#2C2C2C",
          color: "#F6F4FE",
          padding: 2,
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          variant="caption"
          sx={{ color: "#777280", fontWeight: 500, fontSize: "11px" }}
        >
          {state.selectedDate ? `Selected Date: ${state.selectedDate.format('MMMM D, YYYY')}` : "No Date Selected"}
        </Typography>
        <IconButton
          onClick={() => setState((prev) => ({ ...prev, isDrawerOpen: false }))}
          sx={{ color: "#F6F4FE" }}
        >
          <IoMdClose />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", px: 2, pb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}>
            Who?
          </Typography>
          <Autocomplete
            freeSolo
            options={state.filteredNames.map((n) => n.name)}
            value={state.searchName || ""}
            onInputChange={(_, newValue) => handleStateChange("searchName", newValue)}
            onChange={(_, newValue) => handleStateChange("searchName", newValue || "")}
            clearIcon={
              <Close
                sx={{ color: "#F6F4FE", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateChange("searchName", "");
                }}
              />
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name"
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: "#4d4d4e8e",
                  borderRadius: "8px",
                  "& .MuiInputLabel-root": { color: "#F6F4FE" },
                  "& .MuiOutlinedInput-root": {
                    color: "#F6F4FE",
                    "& fieldset": { borderColor: "transparent" },
                  },
                  "& .MuiAutocomplete-endAdornment": {
                    display: state.searchName ? "block" : "none",
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <InputAdornment position="end">
                      {state.searchName && (
                        <IconButton
                          onClick={() => handleStateChange("searchName", "")}
                          edge="end"
                          sx={{ color: "#F6F4FE" }}
                        >
                          <Close />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column"}}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px" }}>
            Branch
          </Typography>
          <Select
            value={state.selectedBranchId}
            onChange={(e) => handleBranchChange(e)}
            onOpen={handleBranchOpen}
            displayEmpty
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: "#F6F4FE",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) =>
              selected ? state.branches.find((branch) => branch.id === selected)?.name || "Select Branch" : "Select Branch"
            }
          >
            <MenuItem value=''>None</MenuItem>
            {branchesLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              state.branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
              ))
            )}
          </Select>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}>
            Program
          </Typography>
          <Select
            value={state.selectedEventId}
            onChange={(e) => handleStateChange("selectedEventId", e.target.value as string)}
            onOpen={() => fetchEvents(state.selectedDate)}
            displayEmpty
            disabled={!state.selectedBranchId}
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: state.selectedEventId ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
              "&.Mui-disabled": { backgroundColor: "#4d4d4e4d", color: "#777280" },
            }}
            renderValue={(selected) => {
              if (!state.selectedBranchId) return "Select Branch First";
              if (!selected) return "Select Program";

              const allOccurrences = state.events.flatMap(event =>
                event.occurrences.map(occ => ({ ...occ, eventTitle: event.title }))
              );
              const occurrence = allOccurrences.find(occ => occ.id === selected);

              if (occurrence) {
                const formatTime = (time: string) => {
                  const date = new Date(`1970-01-01T${time}`);
                  return date.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                };

                const formattedStart = formatTime(occurrence.startTime);
                const formattedEnd = formatTime(occurrence.endTime);

                return `${occurrence.eventTitle} - ${formattedStart} to ${formattedEnd}`;
              }

              return "Select Program";
            }}
          >
            <MenuItem value="">None</MenuItem>
            {state.eventsLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              state.events.flatMap((event) =>
                event.occurrences.map((occurrence) => {
                  const start = new Date(`1970-01-01T${occurrence.startTime}`);
                  const end = new Date(`1970-01-01T${occurrence.endTime}`);

                  const formattedStart = start.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });

                  const formattedEnd = end.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return (
                    <MenuItem key={occurrence.id} value={occurrence.id}>
                      {`${event.title} (${formattedStart} - ${formattedEnd})`}
                    </MenuItem>
                  );
                })
              )
            )}
            <Divider />
            <MenuItem onClick={() => handleStateChange("dateDialogOpen", true)}>
              {state.selectedDate ? `Selected Date: ${state.selectedDate.format('MMMM D, YYYY')}` : "Select Date"}
            </MenuItem>
          </Select>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            onClick={searchFollowUps}
            sx={{
              backgroundColor: "#F6F4FE",
              color: "#4d4d4e8e",
              borderRadius: "24px",
              py: 1,
              px: 3,
              minWidth: "auto",
              "&:hover": { backgroundColor: "#F6F4FE", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },
            }}
            startIcon={<Search />}
            disabled={state.isSearching || state.loading}
          >
            {state.isSearching ? <CircularProgress size={20} color="inherit" /> : "Search"}
          </Button>
        </Box>
      </Box>
      <DatePickerDialog
        open={state.dateDialogOpen}
        onClose={() => handleStateChange("dateDialogOpen", false)}
        onDateSelect={(date) => handleStateChange("selectedDate", date)}
        onDateApply={() => {
          fetchEvents(state.selectedDate);
          handleStateChange("dateDialogOpen", false);
        }}
      />
    </Drawer>
  );

  // Updated renderDesktopFilters function
  const renderDesktopFilters = () => (
    <Box sx={{ display: "flex", width: "100%", mb: 3}}>
      <Box
        sx={{
          border: "1px solid #4d4d4e8e",
          borderRadius: "32px",
          display: "flex",
          alignItems: "center",
          backgroundColor: "#4d4d4e8e",
          padding: "4px",
          width: "100%",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: { xs: "120px", sm: "160px" },
            padding: "4px 8px",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#F6F4FE",
              fontWeight: 500,
              fontSize: "11px",
              ml: "8px",
            }}
          >
            Who?
          </Typography>
          <Autocomplete
            freeSolo
            options={state.filteredNames.map((n) => n.name)}
            value={state.searchName || ""}
            onInputChange={(_, newValue) => handleStateChange("searchName", newValue)}
            onChange={(_, newValue) => handleStateChange("searchName", newValue || "")}
            clearIcon={
              <Close
                sx={{ color: "#F6F4FE", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateChange("searchName", "");
                }}
              />
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name"
                variant="standard"
                sx={{
                  "& .MuiInputBase-input": {
                    color: state.searchName ? "#F6F4FE" : "#777280",
                    fontWeight: 500,
                    fontSize: "14px",
                    padding: "4px 8px",
                  },
                  "& .MuiInput-underline:before": { borderBottom: "none" },
                  "& .MuiInput-underline:after": { borderBottom: "none" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                    borderBottom: "none",
                  },
                }}
              />
            )}
          />
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Branch
          </Typography>
          <FormControl fullWidth>
            <Select
              value={state.selectedBranchId}
              onChange={(e) => handleBranchChange(e)}
              onOpen={handleBranchOpen}
              displayEmpty
              sx={{
                color: state.selectedBranchId ? "#F6F4FE" : "#777280",
                fontWeight: 500,
                fontSize: "14px",
                ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                ".MuiOutlinedInput-notchedOutline": { border: "none" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                "& .MuiSelect-icon": { display: "none" },
              }}
              renderValue={(selected) =>
                selected ? state.branches.find((branch) => branch.id === selected)?.name || "Select Branch" : "Select Branch"
              }
            >
              <MenuItem value=''>None</MenuItem>
              {branchesLoading ? (
                <MenuItem disabled>Loading...</MenuItem>
              ) : (
                state.branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Program
          </Typography>
          <MuiSelect
            value={state.selectedEventId}
            onChange={(e) => handleStateChange("selectedEventId", e.target.value as string)}
            onOpen={() => fetchEvents(state.selectedDate)}
            displayEmpty
            disabled={!state.selectedBranchId}
            sx={{
              color: state.selectedEventId ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
              "&.Mui-disabled": { backgroundColor: "#4d4d4e4d", color: "#777280" },
            }}
            renderValue={(selected) => {
              if (!state.selectedBranchId) return "Select Branch First";
              if (!selected) return "Select Program";

              const allOccurrences = state.events.flatMap(event =>
                event.occurrences.map(occ => ({ ...occ, eventTitle: event.title }))
              );
              const occurrence = allOccurrences.find(occ => occ.id === selected);

              if (occurrence) {
                const formatTime = (time: string) => {
                  const date = new Date(`1970-01-01T${time}`);
                  return date.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                };

                const formattedStart = formatTime(occurrence.startTime);
                const formattedEnd = formatTime(occurrence.endTime);

                return `${occurrence.eventTitle} - ${formattedStart} to ${formattedEnd}`;
              }

              return "Select Program";
            }}
          >
            <MenuItem value="">None</MenuItem>
              {state.eventsLoading ? (
                <MenuItem disabled>Loading...</MenuItem>
              ) : (
                state.events.flatMap((event) =>
                  event.occurrences.map((occurrence) => {
                    const start = new Date(`1970-01-01T${occurrence.startTime}`);
                    const end = new Date(`1970-01-01T${occurrence.endTime}`);

                    const formattedStart = start.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    const formattedEnd = end.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <MenuItem key={occurrence.id} value={occurrence.id}>
                        {`${event.title} (${formattedStart} - ${formattedEnd})`}
                      </MenuItem>
                    );
                  })
                )
              )}
            <Divider />
            <MenuItem onClick={() => handleStateChange("dateDialogOpen", true)}>
              {state.selectedDate ? `${state.selectedDate.format('MMMM D, YYYY')}` : "Select Date"}
            </MenuItem>
          </MuiSelect>
        </Box>
        <Box>
          <Button
            onClick={searchFollowUps}
            sx={{
              backgroundColor: "transparent",
              border: "1px solid #777280",
              color: "white",
              borderRadius: "50%",
              minWidth: "48px",
              height: "48px",
              padding: 0,
              "&:hover": { backgroundColor: "#777280" },
            }}
            disabled={state.isSearching || state.loading}
          >
            {state.isSearching ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Search sx={{ fontSize: "20px" }} />
            )}
          </Button>
        </Box>
      </Box>
      <DatePickerDialog
        open={state.dateDialogOpen}
        onClose={() => handleStateChange("dateDialogOpen", false)}
        onDateSelect={(date) => handleStateChange("selectedDate", date)}
        onDateApply={() => {
          fetchEvents(state.selectedDate);
          handleStateChange("dateDialogOpen", false);
        }}
      />
    </Box>
  );

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  function handleAddFollowUp(): void {
    navigate('/programs');
  }

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Typography
              variant={isMobile ? "h5" : "h5"}
              component="h4"
              sx={{ fontWeight: 600, display: "flex", mb: 3, alignItems: "center", gap: 1, color: theme.palette.text.primary, fontSize: isLargeScreen ? "1.1rem" : undefined }}
            >
              <span className="text-[#777280]">Members</span>
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />
              <span className="text-[#F6F4FE]">Newcomers</span>
            </Typography>
            {isMobile ? (
              <Box sx={{ display: "flex", width: "100%", mt: 2 }}>
                <Box
                  sx={{
                    border: "1px solid #4d4d4e8e",
                    borderRadius: "32px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#4d4d4e8e",
                    padding: "4px",
                    width: "100%",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                    "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
                  }}
                >
                  <Box sx={{ flex: 1, padding: "4px 8px" }}>                
                    <TextField
                      value={state.searchName}
                      onChange={(e) => handleStateChange("searchName", e.target.value)}
                      placeholder="Search by name"
                      variant="standard"
                      sx={{
                        "& .MuiInputBase-input": {
                          color: state.searchName ? "#F6F4FE" : "#777280",
                          fontSize: "14px",
                          padding: "4px 8px",
                        },
                        "& .MuiInput-underline:before": { borderBottom: "none" },
                        "& .MuiInput-underline:after": { borderBottom: "none" },
                        "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                          borderBottom: "none",
                        },
                      }}
                      onFocus={() => state.searchName && handleStateChange("isNameDropdownOpen", true)}
                      onBlur={() => setTimeout(() => handleStateChange("isNameDropdownOpen", false), 200)}
                    />
                    {state.isNameDropdownOpen && state.filteredNames.length > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: "200px",
                          overflowY: "auto",
                          backgroundColor: "#2C2C2C",
                          borderRadius: "8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          zIndex: 1300,
                          mt: 1,
                        }}
                      >
                        {state.filteredNames.map((followUp, index) => (
                          <Box
                            key={followUp.id}
                            sx={{
                              padding: "8px 16px",
                              color: "#F6F4FE",
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "#4d4d4e8e" },
                              borderBottom:
                                index < state.filteredNames.length - 1 ? "1px solid #777280" : "none",
                            }}
                            onClick={() => {
                              handleStateChange("searchName", followUp.name);
                              handleStateChange("isNameDropdownOpen", false);
                            }}
                          >
                            {followUp.name}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                  <IconButton
                    onClick={() => setState((prev) => ({ ...prev, isDrawerOpen: true }))}
                    sx={{ color: "#777280", "&:hover": { color: "#F6F4FE" } }}
                  >
                    <AttachFile sx={{ color: "#F6F4FE", fontSize: "20px" }} />
                  </IconButton>
                  <Box sx={{ pr: "8px" }}>
                    <Button
                      onClick={searchFollowUps}
                      sx={{
                        backgroundColor: "transparent",
                        border: "1px solid #777280",
                        color: "white",
                        borderRadius: "50%",
                        minWidth: "48px",
                        height: "48px",
                        padding: 0,
                        "&:hover": { backgroundColor: "#777280" },
                      }}
                      disabled={state.isSearching}
                    >
                      {state.isSearching ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Search sx={{ fontSize: "20px" }} />
                      )}
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              renderDesktopFilters()
            )}
            {isMobile && renderMobileFilters()}
          </Grid>
        </Grid>

        {/* Loading State */}
        {state.loading && state.filteredFollowUps.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={40} sx={{ color: "#777280" }} />
          </Box>
        )}

        {/* Empty/Error State */}
        {state.error && !state.loading && state.filteredFollowUps.length === 0 && <EmptyState error={state.error} onAddFollowUp={handleAddFollowUp} isLargeScreen={isLargeScreen} />}
        {!state.loading && !state.error && state.filteredFollowUps.length === 0 && <EmptyState error={state.error} onAddFollowUp={handleAddFollowUp} isLargeScreen={isLargeScreen} />}
        {/* Table */}
        {state.filteredFollowUps.length > 0 && (
          <>
            <TableContainer sx={{ boxShadow: 2, borderRadius: 1, overflowX: "auto", mb: 4,                        
                maxHeight: '500px', // Set a fixed height for the table
                overflowY: 'auto', // Enable vertical scrolling
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#777280',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#4d4d4e8e',
                },
              }}>
                <Table sx={{ minWidth: { xs: "auto", sm: 650 }, "& td, & th": { border: "none" } }}>
                <TableHead>
                  <TableRow>
                    {(["snumber", "name", "contact", "branch", "event", "actions"] as const).map((key) => (
                      <TableCell
                        key={key}
                        sx={{
                          fontWeight: 600,
                          width: TABLE_COLUMN_WIDTHS[key === "event" ? "address" : key],
                          fontSize: isLargeScreen ? "0.875rem" : undefined,
                          color: "#777280",
                          textAlign: key === "actions" ? "center" : "left",
                        }}
                      >
                        {key === "snumber" ? "#" : key.charAt(0).toUpperCase() + key.slice(1)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.filteredFollowUps.map((followUp, index) => (
                    <FollowUpRow
                      key={followUp.id}
                      followUp={followUp}
                      index={index}
                      onMenuOpen={handleMenuOpen}
                      isLargeScreen={isLargeScreen}
                      loading={state.loading}
                    />
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                hasNextPage={state.pagination.hasNextPage}
                hasPrevPage={state.currentPage > 1}
                onPageChange={handlePageChange}
                currentPage={state.currentPage}
                isLargeScreen={isLargeScreen}
                isLoading={state.loading}
              />
            </TableContainer>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mb: 3,
              }}
            >
              <Tooltip title="Download Newcomers Data" placement="top" arrow>
                <Button
                  onClick={handleExportExcel}
                  disabled={state.exportLoading}
                  size="medium"
                  sx={{
                    backgroundColor: "#363740",
                    px: { xs: 2, sm: 2 },
                    py: 1,
                    borderRadius: 50,
                    fontWeight: 500,
                    textTransform: "none",
                    color: "#f6f4fe",
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
                  }}
                >
                  {state.exportLoading ? (
                    <span className="text-gray-500">
                      <CircularProgress size={18} sx={{ color: "var(--color-text-on-primary)", mr: 1 }} />
                      Downloading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="hidden lg:inline">Download Newcomers</span>
                      <PiDownloadThin className="text-lg" />
                    </span>
                  )}
                </Button>
              </Tooltip>
            </Box>
          </>
        )}

        {/* Action Menu */}
        <ActionMenu
          anchorEl={state.anchorEl}
          currentFollowUp={state.currentFollowUp}
          onClose={handleMenuClose}
          onAction={showConfirmation}
          onView={handleEditOpen}
          isLargeScreen={isLargeScreen}
          loading={state.loading}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={state.confirmModalOpen}
          onClose={() => setState((prev) => ({ ...prev, confirmModalOpen: false }))}
          onConfirm={handleConfirmedAction}
          actionType={state.actionType}
          followUpName={state.currentFollowUp?.name}
          isLargeScreen={isLargeScreen}
          loading={state.loading}
        />
      </Box>
      <EditRegistrationModal
          open={state.editModalOpen}
          onClose={handleEditClose}
          onSuccess={() => {
            refreshFollowUps();
            setState((prev) => ({ ...prev, editModalOpen: false, currentFollowUp: null }));
          }}
          memberId={state.currentFollowUp?.id || ""}
      />
    </DashboardManager>
  );
};

export default ViewFollowUp;