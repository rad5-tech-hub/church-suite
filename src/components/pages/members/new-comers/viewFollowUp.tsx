import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
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
import RegistrationModal from "./followUp";
import { MdOutlineEdit, MdOutlineFileUpload } from "react-icons/md";
import EditRegistrationModal from "./editNewcomers";

// Types
interface FollowUp {
  id: string;
  name: string;
  sex: string;
  phoneNo: string;
  address: string;
  branch: {name: string};
  branchId: string;
  timer: number;
  birthMonth: string;
  birthDay: string;
  maritalStatus: string;
  isActive: boolean;
  isDeleted: boolean;
}

interface Branch {
  id: string;
  name: string;
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
  address: "25%",
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
          color: !hasNextPage || isLoading ? "#777280" : "#160F38",
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
      {followUp.address || "N/A"}
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

// Main Component
const ViewFollowUp: React.FC = () => {
  usePageToast('view-newcomers')
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // State
  const [state, setState] = useState({
    followUps: [] as FollowUp[],
    filteredFollowUps: [] as FollowUp[],
     branches: [] as Branch[],
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
    // Added missing state keys used elsewhere
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
    selectedBranchId: "",
    uploadBranchId: '' as string | null ,   
    isBranchLoading: false,
    searchAddress: "",
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

  const handleBranchOpen = useCallback(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleBranchChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const value = e.target.value;
        if (value !== state.selectedBranchId) {
          handleStateChange("selectedBranchId", value);
        } else {
          handleStateChange("selectedBranchId", value);
        }
      },
    [handleStateChange, state.selectedBranchId]
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
  }, [handleStateChange, isMobile]);

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
      if (state.searchAddress) {
        params.append("address", state.searchAddress);
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
        filteredFollowUps: [], // clear results if error
        pagination: { hasNextPage: false, nextPage: null },
        currentPage: 1,
        pageHistory: [],
        isDrawerOpen: false,
        isSearching: false,
      }));

      showPageToast(errorMessage, "error"); // 🔥 show error toast
    }
  }, [
    state.searchName,
    state.selectedBranchId,
    state.searchAddress,
    handleStateChange,
  ]);

  const searchFollowUpsWithPagination = useCallback(
    async (
      url: string,
      searchName: string,
      searchAddress: string,
      selectedBranchId: string
    ) => {
      try {
        const params = new URLSearchParams();
        if (searchName) {
          params.append("search", searchName);
          params.append("searchField", "name");
        }
        if (selectedBranchId) {
          params.append("branchId", selectedBranchId); // ✅ use function arg, not state
        }
        if (searchAddress) {
          params.append("address", searchAddress);
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
        
        const data = state.searchName || state.searchType || state.searchAddress
          ? await searchFollowUpsWithPagination(url, state.searchName, state.searchType, state.searchAddress)
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
      state.searchType,
      state.searchAddress,
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
  }, [isMobile]);

  // File Import Handlers
  const handleImportExcel = () => {
    setState((prev) => ({ ...prev, openExcelDialog: true }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setState((prev) => ({ ...prev, selectedFile: file }));
    } else {
      showPageToast("Please select a valid Excel file (.xlsx or .xls)",'error');
      setState((prev) => ({ ...prev, selectedFile: null }));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, isDragging: false }));
    const file = event.dataTransfer.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setState((prev) => ({ ...prev, selectedFile: file }));
    } else {
      showPageToast("Please drop a valid Excel file (.xlsx or .xls)",'error');
      setState((prev) => ({ ...prev, selectedFile: null }));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, isDragging: true }));
  };

  const handleDragLeave = () => {
    setState((prev) => ({ ...prev, isDragging: false }));
  };

  const handleUpload = async () => {
    if (!state.selectedFile) {
      showPageToast("Please select an Excel file to upload", "error");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", state.selectedFile);

      // ✅ prefer state.uploadBranchId if user selected one, otherwise fallback to authData?.branchId
      const branchId =
        state.uploadBranchId && state.uploadBranchId !== ""
          ? state.uploadBranchId
          : authData?.branchId;

      const branchIdParam = branchId ? `&branchId=${branchId}` : "";

      await Api.post(
        `/member/import-followup?churchId=${authData?.churchId}${branchIdParam}`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      showPageToast("Excel file uploaded successfully!", "success");

      setState((prev) => ({
        ...prev,
        openExcelDialog: false,
        selectedFile: null,
        uploadBranchId: null, // reset branch after upload
      }));

      setTimeout(() => {
        fetchFollowUps();
      }, 2500);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to upload Excel file. Please try again.";
      showPageToast(errorMessage, "error");
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCloseExcelDialog = () => {
    setState((prev) => ({ ...prev, openExcelDialog: false, selectedFile: null, isDragging: false }));
  };


  // Filter components
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
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
                  e.stopPropagation(); // prevent dropdown from opening
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
            Address
          </Typography>
          <Select
            value={state.searchAddress}
            onChange={(e) => handleStateChange("searchAddress", e.target.value as string)}
            displayEmpty
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: state.searchAddress ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => (selected ? selected : "Select Address")}
          >
            <MenuItem value="">None</MenuItem>
            {[...new Set(state.followUps.map((m) => m.address))].map((address) => (
              <MenuItem key={address} value={address}>
                {address}
              </MenuItem>
            ))}
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
            disabled={state.isSearching}
          >
            {state.isSearching ? <CircularProgress size={20} color="inherit" /> : "Search"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );

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
                  e.stopPropagation(); // prevent dropdown from opening
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
            Address
          </Typography>
          <MuiSelect
            value={state.searchAddress}
            onChange={(e: any) => handleStateChange("searchAddress", e.target.value as string)}
            displayEmpty
            sx={{
              color: state.searchAddress ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => (selected ? selected : "Select Address")}
          >
            <MenuItem value="">None</MenuItem>
            {[...new Set(state.followUps.map((m) => m.address))].map((address) => (
              <MenuItem key={address} value={address}>
                {address}
              </MenuItem>
            ))}
          </MuiSelect>
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
  );

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  function handleAddFollowUp(): void {
    // Open the registration modal for adding a new newcomer.
    // Ensure edit state is cleared and any action menu is closed.
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      editModalOpen: false,
      currentFollowUp: null,
      anchorEl: null,
    }));
  }

  return (
    <DashboardManager>
   
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
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
                        "&:hover": { backgroundColor: "transparent" },
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
          <Grid
            size={{ xs: 12, lg: 5 }}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              mt: { xs: 2, md: 0 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <Button
                variant="contained"
                onClick={handleImportExcel}
                disabled={state.isLoading}
                sx={{
                  py: 1,
                  backgroundColor: "#363740",
                  px: { xs: 3, sm: 3 },
                  borderRadius: 50,
                  fontWeight: "semibold",
                  textTransform: "none",
                  color: "var(--color-text-on-primary)",
                  fontSize: { xs: "1rem", sm: "1rem" },
                  "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
                  width: { xs: "100%", sm: "auto" },
                  minWidth: "max-content"
                }}
              >
                Upload Newcomers <MdOutlineFileUpload className="ml-1" />
              </Button>
              <Button
                variant="contained"
                onClick={() => setState((prev) => ({ ...prev, isModalOpen: true }))}
                size="medium"
                sx={{
                  backgroundColor: "#363740",
                  px: { xs: 2, sm: 2 },
                  py: 1,
                  borderRadius: 50,
                  fontWeight: 500,
                  textTransform: "none",
                  color: "var(--color-text-on-primary)",
                  fontSize: { xs: "1rem", sm: "1rem" },
                  "&:hover": {
                    backgroundColor: "#363740",
                    opacity: 0.9,
                  },
                  width: { xs: "100%", sm: "auto" },
                  minWidth: "max-content"
                }}
              >
                Add Newcomer +
              </Button>
            </Box>
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
            <TableContainer sx={{ boxShadow: 2, borderRadius: 1, overflowX: "auto", mb: 5 }}>
              <Table sx={{ minWidth: { xs: "auto", sm: 650 }, "& td, & th": { border: "none" } }}>
                <TableHead>
                  <TableRow>
                    {(["snumber", "name", "contact", 'branch', "address", "actions"] as const).map((key) => (
                      <TableCell
                        key={key}
                        sx={{
                          fontWeight: 600,
                          width: TABLE_COLUMN_WIDTHS[key],
                          fontSize: isLargeScreen ? "0.875rem" : undefined,
                          color: "#777280",
                          textAlign: key === "actions" ? "center" : "left",
                          ...(key === "address" && {
                            maxWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }),
                        }}
                      >
                        {key === "address" ? (
                          <Tooltip
                            title={(key.charAt(0).toUpperCase() + key.slice(1)).length > 30 ? key.charAt(0).toUpperCase() + key.slice(1) : ""}
                            placement="top"
                            arrow
                          >
                            <span>
                              {(key.charAt(0).toUpperCase() + key.slice(1)).length > 30
                                ? `${(key.charAt(0).toUpperCase() + key.slice(1)).slice(0, 30)}...`
                                : key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          </Tooltip>
                        ) : key === "snumber" ? (
                          "#"
                        ) : (
                          key.charAt(0).toUpperCase() + key.slice(1)
                        )}
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
                position: "fixed",       // keeps it fixed on screen
                bottom: 70,              // distance from bottom
                right: 24,               // distance from right
                zIndex: 1300,            // ensure it stays on top
                p: 0,
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
                      {/* Show text only on medium and above */}
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

        {/* Registration Modal */}
        <RegistrationModal
          open={state.isModalOpen}
          onClose={() => setState((prev) => ({ ...prev, isModalOpen: false }))}
          onSuccess={() => {
            refreshFollowUps();
            setState((prev) => ({ ...prev, isModalOpen: false }));
          }}
        />
      </Box>
      {/* Excel Import Dialog */}
      <Dialog open={state.openExcelDialog} onClose={handleCloseExcelDialog} maxWidth="sm" fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "#2C2C2C",
            color: "#F6F4FE",
          },
        }}
      >
        <DialogTitle sx={{display: 'flex', justifyContent: 'space-between'}}><h3>Import Newcomers Data</h3>
          <IconButton 
            onClick={handleCloseExcelDialog} 
            disabled={state.isLoading}
            sx={{ color: "#F6F4FE" }}
          >
            <Close sx={{ mr: 1 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={state.branches}
            getOptionLabel={(option) => option.name}
            value={state.branches.find((b) => b.id === state.uploadBranchId) || null} // ✅ use uploadBranchId
            onChange={(_, newValue) =>
              setState((prev) => ({
                ...prev,
                uploadBranchId: newValue ? newValue.id : null, // ✅ update same key
              }))
            }
            onOpen={() => {
              handleStateChange("isBranchSelectOpen", true);
              handleStateChange("isBranchLoading", true); // set loading true
              fetchBranches().finally(() => {
                handleStateChange("isBranchLoading", false); // stop loading
              });
            }}
            clearIcon={null}
            popupIcon={
              state.uploadBranchId ? ( // ✅ check uploadBranchId
                <Close
                  sx={{ color: "#F6F4FE", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState((prev) => ({ ...prev, uploadBranchId: null })); // ✅ clear it properly
                  }}
                />
              ) : null
            }
            loading={state.isBranchLoading}
            loadingText="Loading branches..."
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Branch (optional)"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {state.isBranchLoading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  my: 3,
                  "& .MuiInputBase-root": { color: "#F6F4FE" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "& .MuiInputLabel-root": { color: "#F6F4FE" },
                }}
              />
            )}
          />

          <Box
            sx={{
              border: `2px dashed ${state.isDragging ? theme.palette.primary.main : theme.palette.grey[400]}`,
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              bgcolor: state.isDragging ? theme.palette.grey[100] : "transparent",
              transition: "all 0.2s",
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Typography variant="body1" color="#F6F4FE" gutterBottom>
              Drag and drop your Excel file here or
            </Typography>
            <Button
              variant="contained"
              component="label"
                sx={{
                  mt: 2,
                  backgroundColor: "#F6F4FE",
                  color: "#2C2C2C",
                  "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
                }}
            >
              Select File
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </Button>
            {state.selectedFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Selected file: {state.selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={state.isLoading || !state.selectedFile}
            sx={{
              backgroundColor: "#777280",
              color: "#f6f4fe",
              "&:hover": {
                backgroundColor: "#777280",
                opacity: 0.9,
              },
            }}
          >
            {state.isLoading ? (
              <>
                <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogActions>
      </Dialog>
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