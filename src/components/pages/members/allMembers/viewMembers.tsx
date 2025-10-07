import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
  Tooltip,
  CircularProgress,
  TextField,
  Drawer,
  Divider,
  Select as MuiSelect,
  Autocomplete,
  InputAdornment,
  Button,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  AttachFile,
  PersonOutline,
  SentimentVeryDissatisfied as EmptyIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { MdOutlineEdit, MdOutlineFileUpload, MdRefresh } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { PiDownloadThin } from "react-icons/pi";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { RootState } from "../../../reduxstore/redux";
import MemberModal from "../../members/allMembers/members";
import EditMemberModal from "../singleMember/editmember";

// Type Definitions
interface Member {
  id: string;
  memberId: string;
  name: string;
  branchId: string;
  branch: { name: string };
  phoneNo: string;
  sex: string;
  whatappNo: string;
  isDeleted?: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Pagination {
  hasNextPage: boolean;
  nextPage: string | null;
  nextCursor?: string | null;
}

interface FetchMembersResponse {
  success: boolean;
  pagination: Pagination;
  data: Member[];
}

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading: boolean;
}

interface MemberRowProps {
  member: Member;
  index: number;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, member: Member) => void;
  isLargeScreen: boolean;
  loading: boolean;
}

// Column Widths
const columnWidths = {
  snumber: "3%",
  name: "25%",
  contact: "15%",
  branch: "25%",
  whatsapp: "15%",
  actions: "17%",
};

// Custom Components
const CustomPagination: React.FC<CustomPaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  onPageChange,
  currentPage,
  isLargeScreen,
  isLoading,
}) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", py: 2, px: { xs: 2, sm: 3 }, color: "#777280", gap: 2, flexWrap: "wrap" }}>
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

const MemberRow: React.FC<MemberRowProps> = memo(({ member, index, onMenuOpen, isLargeScreen, loading }) => (
  <TableRow
    sx={{
      "& td": { border: "none" },
      backgroundColor: member.isDeleted ? "rgba(0, 0, 0, 0.04)" : "#4d4d4e8e",
      borderRadius: "4px",
      "&:hover": { backgroundColor: "#4d4d4e8e", transform: "translateY(-2px)", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" },
      transition: "all 0.2s ease",
      mb: 2,
    }}
  >
    <TableCell sx={{ width: columnWidths.snumber, fontSize: isLargeScreen ? "0.875rem" : undefined, color: member.isDeleted ? "gray" : "#F6F4FE", textDecoration: member.isDeleted ? "line-through" : "none" }}>
      {(index + 1).toString().padStart(2, "0")}
    </TableCell>
    <TableCell sx={{ textDecoration: member.isDeleted ? "line-through" : "none", color: member.isDeleted ? "gray" : "#F6F4FE", display: "flex", alignItems: "center", gap: 1, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2, flex: 1 }}>
      <Box className="py-2 px-3 rounded-full bg-[#F6F4FE] text-[#160F38] font-bold text-lg mr-2">
        {member.name.split(" ").map((name) => name.charAt(0)).join("")}
      </Box>
      <Box>
        {member.name}
        <br />
        <span className="text-[13px] text-[#777280]">{member.sex || "-"}</span>
      </Box>
    </TableCell>
    <TableCell sx={{ width: columnWidths.contact, fontSize: isLargeScreen ? "0.875rem" : undefined, color: member.isDeleted ? "gray" : "#F6F4FE", textDecoration: member.isDeleted ? "line-through" : "none" }}>
      {member.phoneNo || "N/A"}
    </TableCell>
    <TableCell sx={{ width: columnWidths.branch, fontSize: isLargeScreen ? "0.875rem" : undefined, color: member.isDeleted ? "gray" : "#F6F4FE", textDecoration: member.isDeleted ? "line-through" : "none", maxWidth: 0, overflow: "hidden", whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "break-word" }}>
      <Box component="span" sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {member.branch?.name || "N/A"}
      </Box>
    </TableCell>
    <TableCell sx={{ width: columnWidths.whatsapp, fontSize: isLargeScreen ? "0.875rem" : undefined, color: member.isDeleted ? "gray" : "#F6F4FE", textDecoration: member.isDeleted ? "line-through" : "none" }}>
      {member.whatappNo}
    </TableCell>
    <TableCell sx={{ width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined }}>
      <IconButton
        aria-label="more"
        onClick={(e) => onMenuOpen(e, member)}
        disabled={loading}
        sx={{ borderRadius: 1, backgroundColor: "#e1e1e1", "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9, color: "#e1e1e1" } }}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </TableCell>
  </TableRow>
));

const EmptyState: React.FC<{ error: string | null; isLargeScreen: boolean; onAddMember: () => void }> = ({ error, isLargeScreen, onAddMember }) => (
  <Box sx={{ textAlign: "center", py: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <EmptyIcon sx={{ fontSize: 60, color: "rgba(255, 255, 255, 0.1)", mb: 2 }} />
    <Typography variant="h6" color="rgba(255, 255, 255, 0.1)" gutterBottom sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
      {error || "No Workers found"}
    </Typography>
    <Button
      variant="contained"
      onClick={onAddMember}
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
      Add New Worker
    </Button>
  </Box>
);

const ActionMenu: React.FC<{
  anchorEl: HTMLElement | null;
  currentMember: Member | null;
  onClose: () => void;
  onAction: (action: string) => void;
  onView: () => void;
  onProfile: () => void;
  isLargeScreen: boolean;
  loading: boolean;
}> = ({ anchorEl, currentMember, onClose, onAction, onView, onProfile, isLargeScreen, loading }) => (
  <Menu
    id="member-menu"
    anchorEl={anchorEl}
    keepMounted
    open={Boolean(anchorEl)}
    onClose={onClose}
    anchorOrigin={{ vertical: "top", horizontal: "right" }}
    transformOrigin={{ vertical: "top", horizontal: "right" }}
    PaperProps={{ sx: { "& .MuiMenuItem-root": { fontSize: isLargeScreen ? "0.875rem" : undefined } } }}
  >
    <MenuItem onClick={onProfile} disabled={currentMember?.isDeleted || loading}>
      <PersonOutline style={{ marginRight: 8, fontSize: "1rem" }} /> Profile
    </MenuItem>
    <MenuItem onClick={onView} disabled={currentMember?.isDeleted || loading}>
      <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} /> Edit
    </MenuItem>
    <MenuItem onClick={() => onAction("suspend")} disabled={loading}>
      {!currentMember?.isDeleted ? (
        <>
          <BlockIcon sx={{ mr: 1, fontSize: "1rem" }} />
          Suspend
        </>
      ) : (
        <>
          <MdRefresh style={{ marginRight: 8, fontSize: "1rem" }} />
          Activate
        </>
      )}
    </MenuItem>
    <MenuItem onClick={() => onAction("delete")} disabled={loading}>
      <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} /> Delete
    </MenuItem>
  </Menu>
);

const ConfirmationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: string | null;
  memberName: string | undefined;
  isLargeScreen: boolean;
  loading: boolean;
}> = ({ open, onClose, onConfirm, actionType, memberName, isLargeScreen, loading }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    sx={{ "& .MuiDialog-paper": { backgroundColor: "#2C2C2C", color: "#F6F4FE" } }}
  >
    <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
      {actionType === "delete" ? "Delete Worker" : "Suspend Worker"}
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
        Are you sure you want to {actionType} {memberName}?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }} disabled={loading}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
        color={actionType === "delete" ? "error" : "warning"}
        variant="contained"
        disabled={loading}
      >
        {actionType === "delete" ? "Delete" : "Suspend"}
      </Button>
    </DialogActions>
  </Dialog>
);

// Main Component
const ViewMembers: React.FC = () => {
  usePageToast("view-members");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  // State
  const [state, setState] = useState({
    members: [] as Member[],
    filteredMembers: [] as Member[],
    filteredNames: [] as Member[],
    departments: [] as Department[],
    branches: [] as Branch[],
    pagination: { hasNextPage: false, nextPage: null, nextCursor: null } as Pagination,
    pageHistory: [] as string[],
    currentPage: 1,
    page: 0,
    searchName: "",
    searchDepartment: authData?.role === "department" && authData?.department ? authData.department : "",
    searchBranch: authData?.branchId || "",
    loading: true,
    exportLoading: false,
    isLoading: false,
    isSearching: false,
    error: null as string | null,
    branchesError: null as string | null,
    departmentsError: null as string | null,
    confirmModalOpen: false,
    isModalOpen: false,
    isDrawerOpen: false,
    openDialog: false,
    selectedFile: null as File | null,
    isDragging: false,
    isBranchLoading: false,
    branchesLoaded: false,
    loadingDepartments: false,
    departmentsLoaded: false,
    currentMember: null as Member | null,
    actionType: null as string | null,
    anchorEl: null as HTMLElement | null,
    isBranchSelectOpen: false,
    isDepartmentSelectOpen: false,
    selectedBranchId: authData?.branchId || "",
    selectedDepartmentId: authData?.role === "department" && authData?.department ? authData.department : "",
    editModalOpen: false,
  });

  // State Handlers
  const handleStateChange = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((prev) => {
        const newState = { ...prev, [key]: value };
        if (key === "searchName") {
          const searchTerm = (value as string).toLowerCase();
          newState.filteredNames = prev.members.filter((member) =>
            member.name.toLowerCase().includes(searchTerm)
          );
        }
        if (key === "searchBranch") {
          newState.searchDepartment = authData?.role === "department" && authData?.department ? authData.department : "";
          newState.departments = [];
          newState.departmentsLoaded = false;
          newState.departmentsError = null;
        }
        return newState;
      });
    },
    [authData?.role, authData?.department]
  );

  // Data Fetching Handlers
  const fetchMembers = useCallback(
    async (url: string | null = null) => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const params = new URLSearchParams();
        if (authData?.branchId) params.append("branchId", authData.branchId);
        if (authData?.role === "department" && authData?.department) {
          params.append("departmentId", authData.department);
        }
        const apiUrl = url || `/member/all-members?${params.toString()}`;
        const response = await Api.get<FetchMembersResponse>(apiUrl);
        const data = {
          members: response.data.data || [],
          pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
        };
        setState((prev) => ({
          ...prev,
          members: data.members,
          filteredMembers: data.members,
          filteredNames: data.members,
          pagination: data.pagination,
          loading: false,
        }));
        return data;
      } catch (error: any) {
        console.error("Failed to fetch members:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        const errorMessage = error.response?.data?.message || "Failed to load members. Please try again later.";
        handleStateChange("error", errorMessage);
        handleStateChange("loading", false);
        showPageToast(errorMessage, "error");
        return {
          members: [],
          pagination: { hasNextPage: false, nextPage: null },
        };
      }
    },
    [authData?.branchId, authData?.department, authData?.role, handleStateChange]
  );

  const fetchDepartments = useCallback(async () => {
    if (state.loadingDepartments || state.departmentsLoaded || state.departmentsError) return;
    const branchId = state.searchBranch || authData?.branchId;
    if (!branchId) {
      handleStateChange("departments", []);
      handleStateChange("loadingDepartments", false);
      handleStateChange("departmentsError", "Please select a branch to load departments");
      showPageToast("Please select a branch to load departments", "warning");
      return;
    }
    handleStateChange("loadingDepartments", true);
    try {
      const response = await Api.get(`/church/get-departments?branchId=${branchId}`);
      handleStateChange("departments", response.data.departments || []);
      handleStateChange("departmentsLoaded", true);
      handleStateChange("departmentsError", null);
    } catch (error: any) {
      console.error("Error fetching departments:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || "Failed to load departments. Please try again.";
      handleStateChange("departmentsError", errorMessage);
      handleStateChange("departments", []);
      handleStateChange("loadingDepartments", false);
      handleStateChange("departmentsLoaded", false);
      showPageToast(errorMessage, "error");
    } finally {
      handleStateChange("loadingDepartments", false);
    }
  }, [authData?.branchId, state.searchBranch, state.loadingDepartments, state.departmentsLoaded, state.departmentsError, handleStateChange]);

  const fetchBranches = useCallback(async () => {
    if (state.isBranchLoading || state.branchesLoaded || state.branchesError) return;
    handleStateChange("isBranchLoading", true);
    try {
      const response = await Api.get("/church/get-branches");
      handleStateChange("branches", response.data.branches || []);
      handleStateChange("branchesLoaded", true);
      handleStateChange("branchesError", null);
    } catch (error: any) {
      console.error("Error fetching branches:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || "Failed to load branches. Please try again.";
      handleStateChange("branchesError", errorMessage);
      handleStateChange("branches", []);
      handleStateChange("isBranchLoading", false);
      handleStateChange("branchesLoaded", false);
      showPageToast(errorMessage, "error");
    } finally {
      handleStateChange("isBranchLoading", false);
    }
  }, [state.isBranchLoading, state.branchesLoaded, state.branchesError, handleStateChange]);

  const refreshMembers = useCallback(async () => {
    try {
      const data = await fetchMembers();
      setState((prev) => ({
        ...prev,
        members: data.members,
        filteredMembers: data.members,
        pagination: data.pagination,
        currentPage: 1,
        pageHistory: [],
        loading: false,
      }));
    } catch (error) {
      handleStateChange("loading", false);
    }
  }, [fetchMembers, handleStateChange]);

  // Search Handlers
  const searchMembers = useCallback(async () => {
    handleStateChange("isSearching", true);
    handleStateChange("currentPage", 1);
    handleStateChange("pageHistory", []);
    try {
      const params = new URLSearchParams();
      if (state.searchName) {
        params.append("search", state.searchName);
        params.append("searchField", "name");
      }
      if (state.searchDepartment) params.append("departmentId", state.searchDepartment);
      if (state.searchBranch) params.append("branchId", state.searchBranch);
      const response = await Api.get<FetchMembersResponse>(`/member/all-members?${params.toString()}`);
      setState((prev) => ({
        ...prev,
        filteredMembers: response.data.data || [],
        pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
        page: 0,
        isDrawerOpen: false,
        isSearching: false,
      }));
      showPageToast("Search completed successfully!", "success");
    } catch (error: any) {
      console.error("Error searching members:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || "Server search failed, applying local filter";
      showPageToast(errorMessage, "warning");
      let filtered = [...state.members];
      if (state.searchName) {
        filtered = filtered.filter((member) =>
          member.name.toLowerCase().includes(state.searchName.toLowerCase())
        );
      }
      if (state.searchDepartment) {
        filtered = filtered.filter((member) =>
          state.departments.some(
            (dept) => dept.id === state.searchDepartment && member.name.toLowerCase().includes(dept.name.toLowerCase())
          )
        );
      }
      if (state.searchBranch) {
        filtered = filtered.filter((member) => member.branchId === state.searchBranch);
      }
      setState((prev) => ({
        ...prev,
        filteredMembers: filtered,
        pagination: { hasNextPage: false, nextPage: null },
        currentPage: 1,
        pageHistory: [],
        isDrawerOpen: false,
        isSearching: false,
      }));
    }
  }, [state.members, state.searchName, state.searchDepartment, state.searchBranch, state.departments, handleStateChange]);

  const searchMembersWithPagination = useCallback(
    async (url: string, searchName: string, searchDepartment: string, searchBranch: string) => {
      try {
        const params = new URLSearchParams();
        if (searchName) {
          params.append("search", searchName);
          params.append("searchField", "name");
        }
        if (searchDepartment) params.append("departmentId", searchDepartment);
        if (searchBranch) params.append("branchId", searchBranch);
        const fullUrl = url.includes("?") ? `${url}&${params.toString()}` : `${url}?${params.toString()}`;
        const response = await Api.get<FetchMembersResponse>(fullUrl);
        return {
          members: response.data.data || [],
          pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
        };
      } catch (error) {
        console.error("Error searching members with pagination:", error);
        throw error;
      }
    },
    []
  );

  // Pagination Handlers
  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const url =
          direction === "next"
            ? state.pagination.nextPage
            : state.pageHistory.length > 0
            ? state.pageHistory[state.pageHistory.length - 2] || `/member/all-members${(authData?.role === "branch" && authData?.branchId) ? `?branchId=${authData.branchId}` : ""}${(authData?.role === "department" && authData?.department) ? `&departmentId=${authData.department}` : ""}`
            : null;
        if (!url) throw new Error(direction === "next" ? "No next page available" : "No previous page available");
        const data = state.searchName || state.searchDepartment || state.searchBranch
          ? await searchMembersWithPagination(url, state.searchName, state.searchDepartment, state.searchBranch)
          : await fetchMembers(url);
        setState((prev) => ({
          ...prev,
          filteredMembers: data.members,
          pagination: data.pagination,
          pageHistory: direction === "next" ? [...prev.pageHistory, url] : prev.pageHistory.slice(0, -1),
          currentPage: direction === "next" ? prev.currentPage + 1 : prev.currentPage - 1,
          loading: false,
        }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to load page";
        console.error(`Error fetching ${direction} page:`, {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        handleStateChange("error", errorMessage);
        handleStateChange("loading", false);
        showPageToast(errorMessage, "error");
      }
    },
    [authData?.branchId, authData?.department, authData?.role, state.pagination.nextPage, state.pageHistory, state.searchName, state.searchDepartment, state.searchBranch, fetchMembers, handleStateChange, searchMembersWithPagination]
  );

  // Action Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: Member) => {
    setState((prev) => ({ ...prev, anchorEl: event.currentTarget, currentMember: member }));
  };

  const handleMenuClose = () => setState((prev) => ({ ...prev, anchorEl: null }));

  const handleEditOpen = useCallback(() => {
    handleStateChange("editModalOpen", true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleEditClose = useCallback(() => {
    handleStateChange("editModalOpen", false);
    handleStateChange("currentMember", null);
  }, [handleStateChange]);

  const showConfirmation = (action: string) => {
    setState((prev) => ({ ...prev, actionType: action, confirmModalOpen: true }));
    handleMenuClose();
  };

  const handleConfirmedAction = async () => {
    if (!state.currentMember || !state.actionType) return;
    try {
      setState((prev) => ({ ...prev, loading: true }));
      if (state.actionType === "delete") {
        await Api.delete(`/member/delete-member/${state.currentMember.id}/branch/${authData?.branchId}`);
        setState((prev) => ({
          ...prev,
          members: prev.members.filter((member) => member.id !== state.currentMember!.id),
          filteredMembers: prev.filteredMembers.filter((member) => member.id !== state.currentMember!.id),
        }));
        showPageToast("Member deleted successfully!", "success");
      } else if (state.actionType === "suspend") {
        await Api.patch(`/member/suspend-member/${state.currentMember.id}/branch/${authData?.branchId}`);
        showPageToast("Member suspended successfully!", "success");
        fetchMembers();
      }
    } catch (error: any) {
      console.error("Action error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || `Failed to ${state.actionType} member`;
      showPageToast(errorMessage, "error");
    } finally {
      setState((prev) => ({
        ...prev,
        loading: false,
        confirmModalOpen: false,
        actionType: null,
        currentMember: null,
      }));
    }
  };

  const handleProfile = () => {
    if (state.currentMember) {
      navigate(`/members/view/${state.currentMember.id}`);
      handleMenuClose();
    }
  };

  // File Import/Export Handlers
  const handleExportExcel = useCallback(async () => {
    handleStateChange("exportLoading", true);
    try {
      const response = await Api.get(`/member/export?branchId=${authData?.branchId}`, { responseType: "blob" });
      const contentDisposition = response.headers["content-disposition"];
      let filename = "members_export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
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
      showPageToast("Excel file exported successfully!", "success");
    } catch (error: any) {
      console.error("Failed to export members:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || "Failed to export Excel file. Please try again.";
      showPageToast(errorMessage, "error");
    } finally {
      handleStateChange("exportLoading", false);
    }
  }, [authData?.branchId, handleStateChange]);

  const handleImportExcel = () => {
    handleStateChange("openDialog", true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      handleStateChange("selectedFile", file);
    } else {
      showPageToast("Please select a valid Excel file (.xlsx or .xls)", "error");
      handleStateChange("selectedFile", null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleStateChange("isDragging", false);
    const file = event.dataTransfer.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      handleStateChange("selectedFile", file);
    } else {
      showPageToast("Please drop a valid Excel file (.xlsx or .xls)", "error");
      handleStateChange("selectedFile", null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleStateChange("isDragging", true);
  };

  const handleDragLeave = () => {
    handleStateChange("isDragging", false);
  };

  const handleUpload = async () => {
    if (!state.selectedFile) {
      showPageToast("Please select an Excel file to upload", "error");
      return;
    }
    handleStateChange("isLoading", true);
    try {
      const formData = new FormData();
      formData.append("file", state.selectedFile);
      if (state.selectedBranchId) {
        formData.append("branchId", state.selectedBranchId);
      }
      await Api.post(
        `/member/import?branchId=${state.selectedBranchId || authData?.branchId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      showPageToast("Excel file uploaded successfully!", "success");
      handleStateChange("openDialog", false);
      handleStateChange("selectedFile", null);
      handleStateChange("selectedBranchId", "");
      setTimeout(() => fetchMembers(), 1500);
    } catch (error: any) {
      console.error("Error uploading file:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to upload Excel file. Please try again.";
      showPageToast(errorMessage, "error");
    } finally {
      handleStateChange("isLoading", false);
    }
  };

  const handleCloseDialog = () => {
    handleStateChange("openDialog", false);
    handleStateChange("selectedFile", null);
    handleStateChange("isDragging", false);
  };

  const handleAddMember = () => {
    handleStateChange("isModalOpen", true);
  };

  // UI Components
  const renderMobileFilters = () => (
    <Drawer
      anchor="top"
      open={state.isDrawerOpen}
      onClose={() => handleStateChange("isDrawerOpen", false)}
      sx={{ "& .MuiDrawer-paper": { backgroundColor: "#2C2C2C", color: "#F6F4FE", padding: 2, boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.25)" } }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton onClick={() => handleStateChange("isDrawerOpen", false)} sx={{ color: "#F6F4FE" }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", px: 2, pb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Who?
          </Typography>
          <Autocomplete
            options={state.members}
            getOptionLabel={(option) => option.name}
            value={state.members.find((m) => m.name === state.searchName) || null}
            onChange={(_event, newValue) => handleStateChange("searchName", newValue?.name || "")}
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
                  "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
                  "& .MuiAutocomplete-endAdornment": { display: state.searchName ? "block" : "none" },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <InputAdornment position="end">
                      {state.searchName && (
                        <IconButton onClick={() => handleStateChange("searchName", "")} edge="end" sx={{ color: "#F6F4FE" }}>
                          <CloseIcon />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Branch
          </Typography>
          <MuiSelect
            value={state.searchBranch}
            onChange={(e) => {
              handleStateChange("searchBranch", e.target.value as string);
              if (e.target.value) fetchDepartments();
            }}
            displayEmpty
            onOpen={() => {
              handleStateChange("isBranchSelectOpen", true);
              if (!state.branchesLoaded && !state.branchesError) fetchBranches();
            }}
            onClose={() => handleStateChange("isBranchSelectOpen", false)}
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: state.searchBranch ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Branch";
              const branch = state.branches.find((b) => b.id === selected);
              return branch ? branch.name : "Select Branch";
            }}
          >
            <MenuItem value="">None</MenuItem>
            {state.isBranchLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : state.branchesError ? (
              <MenuItem disabled>
                {state.branchesError}
                <Button onClick={() => { handleStateChange("branchesError", null); fetchBranches(); }} sx={{ ml: 1 }}>Retry</Button>
              </MenuItem>
            ) : state.branches.length === 0 ? (
              <MenuItem disabled>No branches available</MenuItem>
            ) : (
              state.branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
              ))
            )}
          </MuiSelect>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Department
          </Typography>
          <MuiSelect
            value={state.searchDepartment}
            onChange={(e) => {
              handleStateChange("searchDepartment", e.target.value as string);
            }}
            displayEmpty
            onOpen={() => {
              handleStateChange("isDepartmentSelectOpen", true);
              if ((state.searchBranch || authData?.branchId) && !state.departmentsLoaded && !state.departmentsError) fetchDepartments();
            }}
            onClose={() => handleStateChange("isDepartmentSelectOpen", false)}
            disabled={!state.searchBranch && !authData?.branchId}
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: state.searchDepartment ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Department";
              const dept = state.departments.find((d) => d.id === selected);
              return dept ? dept.name : "Select Department";
            }}
          >
            <MenuItem value="">None</MenuItem>
            {state.loadingDepartments ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : state.departmentsError ? (
              <MenuItem disabled>
                {state.departmentsError}
                <Button onClick={() => { handleStateChange("departmentsError", null); fetchDepartments(); }} sx={{ ml: 1 }}>Retry</Button>
              </MenuItem>
            ) : state.departments.length === 0 ? (
              <MenuItem disabled>No departments available</MenuItem>
            ) : (
              state.departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))
            )}
          </MuiSelect>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            onClick={searchMembers}
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
    <Box sx={{ display: "flex", width: "100%", mb: 3 }}>
      <Box sx={{ border: "1px solid #4d4d4e8e", borderRadius: "32px", display: "flex", alignItems: "center", backgroundColor: "#4d4d4e8e", padding: "4px", width: "100%", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" } }}>
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: "200px", padding: "4px 16px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Who?
          </Typography>
          <Autocomplete
            options={state.members}
            getOptionLabel={(option) => option.name}
            value={state.members.find((m) => m.name === state.searchName) || null}
            onChange={(_event, newValue) => handleStateChange("searchName", newValue?.name || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder="Search by name"
                sx={{
                  "& .MuiInputBase-input": { color: state.searchName ? "#F6F4FE" : "#777280", fontWeight: 500, fontSize: "14px", padding: "4px 8px" },
                  "& .MuiInput-underline:before": { borderBottom: "none" },
                  "& .MuiInput-underline:after": { borderBottom: "none" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <InputAdornment position="end">
                      {state.searchName && (
                        <IconButton onClick={() => handleStateChange("searchName", "")} edge="end" sx={{ color: "#F6F4FE" }}>
                          <CloseIcon />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Branch
          </Typography>
          <MuiSelect
            value={state.searchBranch}
            onChange={(e) => {
              handleStateChange("searchBranch", e.target.value as string);
              if (e.target.value) fetchDepartments();
            }}
            displayEmpty
            onOpen={() => {
              handleStateChange("isBranchSelectOpen", true);
              if (!state.branchesLoaded && !state.branchesError) fetchBranches();
            }}
            onClose={() => handleStateChange("isBranchSelectOpen", false)}
            sx={{
              color: state.searchBranch ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Branch";
              const branch = state.branches.find((b) => b.id === selected);
              return branch ? branch.name : "Select Branch";
            }}
          >
            <MenuItem value="">None</MenuItem>
            {state.isBranchLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : state.branchesError ? (
              <MenuItem disabled>
                {state.branchesError}
                <Button onClick={() => { handleStateChange("branchesError", null); fetchBranches(); }} sx={{ ml: 1 }}>Retry</Button>
              </MenuItem>
            ) : state.branches.length === 0 ? (
              <MenuItem disabled>No branches available</MenuItem>
            ) : (
              state.branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
              ))
            )}
          </MuiSelect>
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Department
          </Typography>
          <MuiSelect
            value={state.searchDepartment}
            onChange={(e) => {
              handleStateChange("searchDepartment", e.target.value as string);
            }}
            displayEmpty
            onOpen={() => {
              handleStateChange("isDepartmentSelectOpen", true);
              if ((state.searchBranch || authData?.branchId) && !state.departmentsLoaded && !state.departmentsError) fetchDepartments();
            }}
            onClose={() => handleStateChange("isDepartmentSelectOpen", false)}
            disabled={!state.searchBranch && !authData?.branchId}
            sx={{
              color: state.searchDepartment ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Department";
              const dept = state.departments.find((d) => d.id === selected);
              return dept ? dept.name : "Select Department";
            }}
          >
            <MenuItem value="">None</MenuItem>
            {state.loadingDepartments ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : state.departmentsError ? (
              <MenuItem disabled>
                {state.departmentsError}
                <Button onClick={() => { handleStateChange("departmentsError", null); fetchDepartments(); }} sx={{ ml: 1 }}>Retry</Button>
              </MenuItem>
            ) : state.departments.length === 0 ? (
              <MenuItem disabled>No departments available</MenuItem>
            ) : (
              state.departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))
            )}
          </MuiSelect>
        </Box>
        <Box sx={{ ml: "auto", pr: "8px" }}>
          <Button
            onClick={searchMembers}
            sx={{
              backgroundColor: "transparent",
              border: "1px solid #777280",
              color: "white",
              borderRadius: "50%",
              minWidth: "48px",
              height: "48px",
              padding: 0,
              "&:hover": { backgroundColor: "#E61E4D" },
            }}
            disabled={state.isSearching}
          >
            {state.isSearching ? <CircularProgress size={20} color="inherit" /> : <Search sx={{ fontSize: "20px" }} />}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // Effects
  useEffect(() => {
    fetchMembers();
    if (!state.branchesLoaded && !state.branchesError) {
      fetchBranches();
    }
  }, [fetchMembers, fetchBranches, state.branchesLoaded, state.branchesError]);

  useEffect(() => {
    if (
      authData?.role === "department" &&
      authData?.department &&
      (state.searchBranch || authData?.branchId) &&
      !state.departmentsLoaded &&
      !state.departmentsError &&
      !state.loadingDepartments
    ) {
      fetchDepartments();
    }
  }, [authData?.role, authData?.department, authData?.branchId, state.searchBranch, state.departmentsLoaded, state.departmentsError, state.loadingDepartments, fetchDepartments]);

  // Main Render
  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{ color: theme.palette.text.primary, fontSize: isLargeScreen ? "1.1rem" : undefined, display: "flex", alignItems: "center", gap: 1 }}
            >
              <span className="text-[#777280]">Members</span>
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />
              <span className="text-[#F6F4FE]">Worker</span>
            </Typography>
            <Box sx={{ mt: 2 }}>
              {isMobile ? (
                <Box sx={{ display: "flex", width: "100%" }}>
                  <Box sx={{ border: "1px solid #4d4d4e8e", borderRadius: "32px", display: "flex", alignItems: "center", backgroundColor: "#4d4d4e8e", padding: "4px", width: "100%", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" } }}>
                    <Box sx={{ flex: 1, padding: "4px 8px" }}>
                      <Autocomplete
                        options={state.members}
                        getOptionLabel={(option) => option.name}
                        value={state.members.find((m) => m.name === state.searchName) || null}
                        onChange={(_event, newValue) => handleStateChange("searchName", newValue?.name || "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            placeholder="Search by name"
                            sx={{
                              "& .MuiInputBase-input": { color: state.searchName ? "#F6F4FE" : "#777280", fontSize: "14px", padding: "4px 8px" },
                              "& .MuiInput-underline:before": { borderBottom: "none" },
                              "& .MuiInput-underline:after": { borderBottom: "none" },
                              "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                              "& .MuiAutocomplete-endAdornment": { display: state.searchName ? "block" : "none" },
                            }}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <InputAdornment position="end">
                                  {state.searchName && (
                                    <IconButton onClick={() => handleStateChange("searchName", "")} edge="end" sx={{ color: "#F6F4FE" }}>
                                      <CloseIcon />
                                    </IconButton>
                                  )}
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Box>
                    <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                    <IconButton onClick={() => handleStateChange("isDrawerOpen", true)} sx={{ color: "#777280", "&:hover": { color: "#F6F4FE" } }}>
                      <AttachFile sx={{ color: "#F6F4FE", fontSize: "20px" }} />
                    </IconButton>
                    <Box sx={{ pr: "8px" }}>
                      <Button
                        onClick={searchMembers}
                        sx={{
                          backgroundColor: "transparent",
                          border: "1px solid #777280",
                          color: "white",
                          borderRadius: "50%",
                          minWidth: "48px",
                          height: "48px",
                          padding: 0,
                          "&:hover": { backgroundColor: "#E61E4D" },
                        }}
                        disabled={state.isSearching}
                      >
                        {state.isSearching ? <CircularProgress size={20} color="inherit" /> : <Search sx={{ fontSize: "20px" }} />}
                      </Button>
                    </Box>
                  </Box>
                  {renderMobileFilters()}
                </Box>
              ) : (
                renderDesktopFilters()
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: { xs: 2, md: 0 } }}>
            <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, width: { xs: "100%", sm: "auto" } }}>
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
                  minWidth: "max-content",
                }}
              >
                Upload Workers <MdOutlineFileUpload className="ml-1" />
              </Button>
              <Button
                variant="contained"
                onClick={handleAddMember}
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
                  "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
                  width: { xs: "100%", sm: "auto" },
                  minWidth: "max-content",
                }}
              >
                Add Worker +
              </Button>
            </Box>
          </Grid>
        </Grid>

        {state.loading && state.filteredMembers.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {(state.error || state.branchesError || state.departmentsError) && !state.loading && state.filteredMembers.length === 0 && (
          <EmptyState error={state.error || state.branchesError || state.departmentsError} isLargeScreen={isLargeScreen} onAddMember={handleAddMember} />
        )}
        {!state.loading && !state.error && !state.branchesError && !state.departmentsError && state.filteredMembers.length === 0 && (
          <EmptyState error={null} isLargeScreen={isLargeScreen} onAddMember={handleAddMember} />
        )}

        {state.filteredMembers.length > 0 && (
          <>
            <TableContainer sx={{
              boxShadow: 2,
              borderRadius: 1,
              overflowX: "auto",
              mb: 4,
              maxHeight: "500px",
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: "8px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#777280", borderRadius: "4px" },
              "&::-webkit-scrollbar-track": { backgroundColor: "#4d4d4e8e" },
            }}>
              <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
                <TableHead>
                  <TableRow sx={{ "& th": { border: "none", backgroundColor: "transparent" } }}>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.snumber, color: "#777280", fontSize: isLargeScreen ? "0.875rem" : undefined }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.name, color: "#777280", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#777280", width: columnWidths.contact, fontSize: isLargeScreen ? "0.875rem" : undefined }}>Phone Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#777280", width: columnWidths.branch, fontSize: isLargeScreen ? "0.875rem" : undefined }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#777280", width: columnWidths.whatsapp, fontSize: isLargeScreen ? "0.875rem" : undefined }}>Whatsapp Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#777280", width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.filteredMembers.map((member, index) => (
                    <MemberRow
                      key={member.id}
                      member={member}
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
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <Tooltip title="Download Workers Data" placement="top" arrow>
                <Button
                  onClick={handleExportExcel}
                  disabled={state.exportLoading}
                  size="medium"
                  sx={{
                    backgroundColor: "#363740",
                    px: { xs: 2, sm: 2 },
                    py: 1,
                    borderRadius: 1.5,
                    fontWeight: 500,
                    textTransform: "none",
                    color: "#f6f4fe",
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
                    "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
                  }}
                >
                  {state.exportLoading ? (
                    <>
                      <CircularProgress size={18} sx={{ color: "var(--color-text-on-primary)", mr: 1 }} />
                      Downloading...
                    </>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="hidden lg:inline">Download Workers</span>
                      <PiDownloadThin className="text-lg" />
                    </span>
                  )}
                </Button>
              </Tooltip>
            </Box>
          </>
        )}

        <ActionMenu
          anchorEl={state.anchorEl}
          currentMember={state.currentMember}
          onClose={handleMenuClose}
          onAction={showConfirmation}
          onView={handleEditOpen}
          onProfile={handleProfile}
          isLargeScreen={isLargeScreen}
          loading={state.loading}
        />

        <ConfirmationDialog
          open={state.confirmModalOpen}
          onClose={() => handleStateChange("confirmModalOpen", false)}
          onConfirm={handleConfirmedAction}
          actionType={state.actionType}
          memberName={state.currentMember?.name}
          isLargeScreen={isLargeScreen}
          loading={state.loading}
        />

        <Dialog
          open={state.openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          sx={{ "& .MuiDialog-paper": { backgroundColor: "#2C2C2C", color: "#F6F4FE" } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
            <h3>Import Workers Data</h3>
            <IconButton onClick={handleCloseDialog} disabled={state.isLoading} sx={{ color: "#F6F4FE" }}>
              <CloseIcon sx={{ mr: 1 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Autocomplete
              options={state.branches}
              getOptionLabel={(option) => option.name}
              value={state.branches.find((b) => b.id === state.selectedBranchId) || null}
              onChange={(_, newValue) => handleStateChange("selectedBranchId", newValue ? newValue.id : "")}
              onOpen={() => {
                handleStateChange("isBranchSelectOpen", true);
                if (!state.branchesLoaded && !state.branchesError) fetchBranches();
              }}
              clearIcon={null}
              popupIcon={state.selectedBranchId ? (
                <CloseIcon sx={{ color: "#F6F4FE", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); handleStateChange("selectedBranchId", ""); }} />
              ) : null}
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
                        {state.isBranchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={{ mb: 3, "& .MuiInputBase-root": { color: "#F6F4FE" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" }, "& .MuiInputLabel-root": { color: "#F6F4FE" } }}
                />
              )}
            />
            <Box
              sx={{
                border: `2px dashed ${state.isDragging ? theme.palette.primary.main : "#777280"}`,
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                bgcolor: state.isDragging ? "#4d4d4e8e" : "transparent",
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
                sx={{ mt: 2, backgroundColor: "#F6F4FE", color: "#2C2C2C", "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 } }}
              >
                Select File
                <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileChange} ref={fileInputRef} />
              </Button>
              {state.selectedFile && (
                <Typography variant="body2" sx={{ mt: 2, color: "#F6F4FE" }}>
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
                py: 1,
                backgroundColor: "#F6F4FE",
                px: { xs: 3, sm: 3 },
                fontWeight: 500,
                textTransform: "none",
                color: "#2C2C2C",
                borderRadius: 50,
                fontSize: isLargeScreen ? "0.875rem" : { xs: "1rem", sm: "1rem" },
                "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
                mt: 2,
              }}
            >
              {state.isLoading ? (
                <span className="text-gray-400">
                  <CircularProgress size={18} sx={{ color: "#F6F4FE", mr: 1 }} />
                  Uploading...
                </span>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <MemberModal
          open={state.isModalOpen}
          onClose={() => { handleStateChange("isModalOpen", false); refreshMembers(); }}
          onSuccess={fetchMembers}
        />
        <EditMemberModal
          open={state.editModalOpen}
          onClose={handleEditClose}
          onSuccess={() => { handleStateChange("editModalOpen", false); refreshMembers(); }}
          memberId={state.currentMember?.id || ""}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewMembers;