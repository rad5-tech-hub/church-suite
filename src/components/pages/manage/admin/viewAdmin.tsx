import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { IoMdAttach, IoMdClose } from "react-icons/io";
import AdminModal from "./admin";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  MenuItem,
  useTheme,
  Divider,
  useMediaQuery,
  Grid,
  Select as MuiSelect,
  TextField,
  Drawer,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Close,
} from "@mui/icons-material";
import { MdOutlineEdit, MdRefresh } from "react-icons/md";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import EditAdminModal from "./editAdmin";

// Interfaces
interface Branch {
  id: string | number;
  name: string;
  address: string;
}

interface Department {
  id: string;
  name: string;
  type?: string;
  branchId?: string | number;
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
}

interface Admin {
  id: string | number;
  name: string;
  email: string;
  title?: string;
  phone: string;
  isSuperAdmin: boolean;
  isSuspended?: boolean;
  scopeLevel: string;
  branchId?: string | number;
  departmentIds?: string[];
  unitIds?: string[];
  isDeleted?: boolean;
  branches?: Branch[];
  departments?: Department[];
  units?: Unit[];
}

interface Pagination {
  hasNextPage: boolean;
  nextCursor: string | null;
  nextPage: string | null;
}

interface FetchAdminsResponse {
  message: string;
  pagination: Pagination;
  admins: Admin[];
}

interface State {
  admins: Admin[];
  pagination: Pagination;
  currentPage: number;
  pageHistory: string[];
  loading: boolean;
  error: string | null;
  openModal: boolean;
  editModalOpen: boolean;
  confirmModalOpen: boolean;
  currentAdmin: Admin | null;
  actionType: string | null;
  anchorEl: HTMLElement | null;
  branches: Branch[];
  departments: Department[];
  units: Unit[];
  selectedBranch: string | number;
  selectedDepartment: string;
  selectedUnit: string;
  isSuperAdmin: boolean;
  searchTerm: string;
  accessLevel: string;
  superAdminFilter: boolean | null;
  isSearching: boolean;
  isDrawerOpen: boolean;
  isNameDropdownOpen: boolean;
  searchError: string | null;
}

interface LoadingStates {
  branches: boolean;
  departments: boolean;
  units: boolean;
}

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: 'next' | 'prev') => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading?: boolean;
}

// Initial State
const initialState: State = {
  admins: [],
  pagination: { hasNextPage: false, nextCursor: null, nextPage: null },
  currentPage: 1,
  pageHistory: [],
  loading: false,
  error: null,
  openModal: false,
  editModalOpen: false,
  confirmModalOpen: false,
  currentAdmin: null,
  actionType: null,
  anchorEl: null,
  branches: [],
  departments: [],
  units: [],
  selectedBranch: "",
  selectedDepartment: "",
  selectedUnit: "",
  isSuperAdmin: false,
  searchTerm: "",
  accessLevel: "",
  superAdminFilter: null,
  isSearching: false,
  isDrawerOpen: false,
  isNameDropdownOpen: false,
  searchError: null,
};

// Custom Pagination Component
const CustomPagination: React.FC<CustomPaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  onPageChange,
  currentPage,
  isLargeScreen,
  isLoading = false,
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
    <Typography
      sx={{
        fontSize: isLargeScreen ? "0.75rem" : "0.875rem",
        color: "#777280",
      }}
    >
      Page {currentPage}
    </Typography>
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        onClick={() => onPageChange('prev')}
        disabled={!hasPrevPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: (!hasPrevPage || isLoading) ? "#4d4d4e8e" : "#F6F4FE",
          color: (!hasPrevPage || isLoading) ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
      >
        <ChevronLeft />
      </Button>
      <Button
        onClick={() => onPageChange('next')}
        disabled={!hasNextPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: (!hasNextPage || isLoading) ? "#4d4d4e8e" : "#F6F4FE",
          color: (!hasPrevPage || isLoading) ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
      >
        <ChevronRight />
      </Button>
    </Box>
  </Box>
);

// Main Component
const ViewAdmins: React.FC = () => {
  usePageToast('view-admin');
  const authData = useSelector((state) => (state as RootState)?.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));

  const [state, setState] = useState<State>(initialState);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    branches: false,
    departments: false,
    units: false,
  });
  const roleHierarchy: Record<string, number> = {
    superadmin: 3,
    admin: 2,
    branch: 1,
    unit: 0,
  };

  // Resolve numeric levels
  const authRoleLevel = roleHierarchy[(authData?.role ?? "").toLowerCase()] ?? -1;
  const targetRoleLevel = roleHierarchy[(state.currentAdmin?.scopeLevel ?? "").toLowerCase()] ?? -1;

  // Permission checks
  const canSuspend =
    authData?.isSuperAdmin || authRoleLevel > targetRoleLevel;
  const canDelete = authData?.isSuperAdmin;

  // Debounce Ref to Prevent Rapid Fetch Calls
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State Update Helper
  const handleStateChange = useCallback(<K extends keyof State>(key: K, value: State[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fetch Utilities with Debouncing
  const fetchBranches = useCallback(async () => {
    if (loadingStates.branches) return [];
    setLoadingStates((prev) => ({ ...prev, branches: true }));
    try {
      const response = await Api.get("/church/get-branches");
      const branches = response?.data?.branches || [];
      setState((prev) => ({ ...prev, branches }));
      return branches;
    } catch (error) {
      console.error("Error fetching branches:", error);
      showPageToast("Failed to load branches", 'error');
      return [];
    } finally {
      setLoadingStates((prev) => ({ ...prev, branches: false }));
    }
  }, [loadingStates.branches]);

  const fetchDepartments = useCallback(async (branchId?: string | number) => {
    if (loadingStates.departments || !branchId) return [];
    setLoadingStates((prev) => ({ ...prev, departments: true }));
    try {
      const response = await Api.get("/church/get-departments", {
        params: { branchId },
      });
      const departments = response?.data?.departments?.map((dept: Department) => ({
        ...dept,
        branchId,
      })) || [];
      setState((prev) => ({ ...prev, departments }));
      return departments;
    } catch (error) {
      console.error("Error fetching departments:", error);
      showPageToast("Failed to load departments", 'error');
      return [];
    } finally {
      setLoadingStates((prev) => ({ ...prev, departments: false }));
    }
  }, [loadingStates.departments]);

  const fetchUnits = useCallback(async (departmentId?: string) => {
    if (loadingStates.units || !departmentId) return [];
    setLoadingStates((prev) => ({ ...prev, units: true }));
    try {
      const response = await Api.get("/church/all-units", {
        params: { departmentId },
      });
      const units = response?.data?.units?.map((unit: Unit) => ({
        ...unit,
        departmentId,
      })) || [];
      setState((prev) => ({ ...prev, units }));
      return units;
    } catch (error) {
      console.error("Error fetching units:", error);
      showPageToast("Failed to load units", 'error');
      return [];
    } finally {
      setLoadingStates((prev) => ({ ...prev, units: false }));
    }
  }, [loadingStates.units]);

  // Debounced Hierarchical Data Load
  const loadHierarchicalData = useCallback(async () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      if (!state.accessLevel) return;

      if (state.accessLevel === "branch" || state.accessLevel === "department" || state.accessLevel === "unit") {
        if (state.branches.length === 0 && !loadingStates.branches) {
          await fetchBranches();
        }
      }

      if (state.accessLevel === "department" && state.selectedBranch && !loadingStates.departments) {
        if (state.departments.length === 0 || !state.departments.some((dept) => dept.branchId === state.selectedBranch)) {
          await fetchDepartments(state.selectedBranch);
        }
      }

      if (state.accessLevel === "unit" && state.selectedDepartment && !loadingStates.units) {
        if (state.units.length === 0 || !state.units.some((unit) => unit.departmentId === state.selectedDepartment)) {
          await fetchUnits(state.selectedDepartment);
        }
      }
    }, 300); // Debounce for 300ms
  }, [
    state.accessLevel,
    state.selectedBranch,
    state.selectedDepartment,
    state.branches,
    state.departments,
    state.units,
    loadingStates.branches,
    loadingStates.departments,
    loadingStates.units,
    fetchBranches,
    fetchDepartments,
    fetchUnits,
  ]);

  // Initial Data Load
  const fetchAdmins = useCallback(async (url: string | null = null): Promise<FetchAdminsResponse> => {
    const baseUrl = authData?.branchId
      ? `/church/view-admins?branchId=${authData.branchId}`
      : "/church/view-admins";
    const response = await Api.get(url || baseUrl);
    return response.data;
  }, [authData?.branchId]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const data = await fetchAdmins();
        if (isMounted) {
          handleStateChange("admins", data.admins || []);
          handleStateChange("pagination", {
            hasNextPage: data.pagination?.hasNextPage || false,
            nextCursor: data.pagination?.nextCursor || null,
            nextPage: data.pagination?.nextPage || null,
          });
          handleStateChange("currentPage", 1);
          handleStateChange("pageHistory", []);
        }
      } catch (error) {
        console.error("Error loading initial admins:", error);
        handleStateChange("error", "Failed to load admins");
      } finally {
        if (isMounted) handleStateChange("loading", false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchAdmins]);

  // Load Hierarchical Data
  useEffect(() => {
    loadHierarchicalData();
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [loadHierarchicalData]);

  // Search and Filter Logic
  const handleSearch = useCallback(async () => {
    handleStateChange("isSearching", true);
    handleStateChange("searchError", null);

    try {
      const params: { [key: string]: string | boolean } = {};

      if (state.searchTerm) {
        params.search = state.searchTerm;
        params.searchField = "name";
      }
      if (state.accessLevel) {
        params.scopeLevel = state.accessLevel.toLowerCase();
        if (state.accessLevel === "branch" && state.selectedBranch) {
          params.branchId = state.selectedBranch.toString();
        }
        if (state.accessLevel === "department" && state.selectedDepartment) {
          params.branchId = state.selectedBranch.toString();
          params.departmentId = state.selectedDepartment;
        }
        if (state.accessLevel === "unit" && state.selectedUnit) {
          params.branchId = state.selectedBranch.toString();
          params.departmentId = state.selectedDepartment;
          params.unitId = state.selectedUnit;
        }
      }
      if (state.superAdminFilter !== null) {
        params.isSuperAdmin = state.superAdminFilter;
      }

      const response = await Api.get("/church/view-admins", { params });

      if (response.data.admins.length === 0) {
        handleStateChange("searchError", "No admins found matching the search criteria");
        handleStateChange("admins", []);
        handleStateChange("pagination", { hasNextPage: false, nextCursor: null, nextPage: null });
      } else {
        handleStateChange("admins", response.data.admins || []);
        handleStateChange("pagination", {
          hasNextPage: response.data.pagination?.hasNextPage || false,
          nextCursor: response.data.pagination?.nextCursor || null,
          nextPage: response.data.pagination?.nextPage || null,
        });
      }

      handleStateChange("currentPage", 1);
      handleStateChange("pageHistory", []);
      showPageToast("Search completed successfully!", "success");
    } catch (error: any) {
      console.error("Error searching admins:", error);
      const errorMessage = error.response?.data?.error?.message || "No admins found matching the search criteria";
      handleStateChange("searchError", errorMessage);
      handleStateChange("admins", []);
      handleStateChange("pagination", { hasNextPage: false, nextCursor: null, nextPage: null });
    } finally {
      handleStateChange("isSearching", false);
      handleStateChange("isDrawerOpen", false);
    }
  }, [state.searchTerm, state.accessLevel, state.selectedBranch, state.selectedDepartment, state.selectedUnit, state.superAdminFilter]);

  // Pagination Handler
  const handlePageChange = useCallback(async (direction: 'next' | 'prev') => {
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      if (direction === 'next') {
        const url = state.pagination.nextPage;
        if (!url) throw new Error("No next page available");
        const data = await fetchAdmins(url);
        handleStateChange("admins", data.admins || []);
        handleStateChange("pagination", {
          hasNextPage: data.pagination?.hasNextPage || false,
          nextCursor: data.pagination?.nextCursor || null,
          nextPage: data.pagination?.nextPage || null,
        });
        handleStateChange("pageHistory", [...state.pageHistory, url]);
        handleStateChange("currentPage", state.currentPage + 1);
      } else if (direction === 'prev') {
        if (state.pageHistory.length === 0) throw new Error("No previous page available");
        const prevIndex = state.pageHistory.length - 2;
        const url = prevIndex >= 0 ? state.pageHistory[prevIndex] : null;
        const data = await fetchAdmins(url);
        handleStateChange("admins", data.admins || []);
        handleStateChange("pagination", {
          hasNextPage: data.pagination?.hasNextPage || false,
          nextCursor: data.pagination?.nextCursor || null,
          nextPage: data.pagination?.nextPage || null,
        });
        handleStateChange("pageHistory", state.pageHistory.slice(0, -1));
        handleStateChange("currentPage", state.currentPage - 1);
      }
    } catch (error) {
      console.error(`Error fetching ${direction} page:`, error);
      handleStateChange("error", "Failed to load page");
      showPageToast("Failed to load page", 'error');
    } finally {
      handleStateChange("loading", false);
    }
  }, [state.pagination.nextPage, state.pageHistory, fetchAdmins]);

  // Menu and Action Handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, admin: Admin) => {
    handleStateChange("anchorEl", event.currentTarget);
    handleStateChange("currentAdmin", admin);
    handleStateChange("isSuperAdmin", admin.isSuperAdmin);
    handleStateChange("selectedBranch", admin.branchId || "");
    handleStateChange("selectedDepartment", admin.departments?.[0]?.id || "");
    handleStateChange("selectedUnit", admin.units?.[0]?.id || "");
  }, []);

  const handleMenuClose = useCallback(() => {
    handleStateChange("anchorEl", null);
  }, []);

  const showConfirmation = useCallback((action: string) => {
    handleStateChange("actionType", action);
    handleStateChange("confirmModalOpen", true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleConfirmedAction = useCallback(async () => {
    if (!state.currentAdmin || !state.actionType) return;
    handleStateChange("loading", true);
    try {
      if (state.actionType === "delete") {
        await Api.delete(`/church/delete-admin/${state.currentAdmin.id}`);
        handleStateChange("admins", state.admins.filter((admin) => admin.id !== state.currentAdmin?.id));
        showPageToast("Admin deleted successfully!", 'success');
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentAdmin.isSuspended;
        await Api.patch(`/church/${newStatus ? "suspend" : "activate"}-admin/${state.currentAdmin.id}`);
        handleStateChange("admins", state.admins.map((admin) =>
          admin.id === state.currentAdmin?.id ? { ...admin, isSuspended: newStatus } : admin
        ));
        showPageToast(`Admin ${newStatus ? "suspended" : "activated"} successfully!`, 'success');
      }
    } catch (error) {
      console.error(`Error performing ${state.actionType}:`, error);
      showPageToast(`Failed to ${state.actionType} admin`, 'error');
    } finally {
      handleStateChange("loading", false);
      handleStateChange("confirmModalOpen", false);
      handleStateChange("actionType", null);
      handleStateChange("currentAdmin", null);
    }
  }, [state.currentAdmin, state.actionType, state.admins]);

  // Modal Handlers
  const handleCloseModal = useCallback(async () => {
    handleStateChange("openModal", false);
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      const data = await fetchAdmins();
      handleStateChange("admins", data.admins || []);
      handleStateChange("pagination", {
        hasNextPage: data.pagination?.hasNextPage || false,
        nextCursor: data.pagination?.nextCursor || null,
        nextPage: data.pagination?.nextPage || null,
      });
      handleStateChange("currentPage", 1);
      handleStateChange("pageHistory", []);
    } catch (error) {
      console.error("Error refreshing admins:", error);
      handleStateChange("error", "Failed to refresh admins");
      showPageToast("Failed to refresh admins", 'error');
    } finally {
      handleStateChange("loading", false);
    }
  }, [fetchAdmins]);

  const handleEditOpen = useCallback(() => {
    handleStateChange("editModalOpen", true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleEditClose = useCallback(async () => {
    handleStateChange("editModalOpen", false);
    handleStateChange("currentAdmin", null);
        handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      const data = await fetchAdmins();
      handleStateChange("admins", data.admins || []);
      handleStateChange("pagination", {
        hasNextPage: data.pagination?.hasNextPage || false,
        nextCursor: data.pagination?.nextCursor || null,
        nextPage: data.pagination?.nextPage || null,
      });
      handleStateChange("currentPage", 1);
      handleStateChange("pageHistory", []);
    } catch (error) {
      console.error("Error refreshing admins:", error);
      handleStateChange("error", "Failed to refresh admins");
      showPageToast("Failed to refresh admins", 'error');
    } finally {
      handleStateChange("loading", false);
    }
    handleMenuClose();

  }, [handleMenuClose, fetchAdmins]);

  // Helper Functions
  const truncateText = useCallback((text: string | null | undefined, maxLength = 30) => {
    if (!text) return "-";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  }, []);

  const getAssignLevelText = useCallback((admin: Admin) => {
    if (admin.scopeLevel === "branch") {
      return admin.branches?.map((b) => b.name).join(", ") || "-";
    }
    if (admin.scopeLevel === "department") {
      return admin.departments?.map((d) => d.name).join(", ") || "-";
    }
    if (admin.scopeLevel === "unit") {
      return admin.units?.map((u) => u.name).join(", ") || "-";
    }
    return admin.scopeLevel || "-";
  }, []);

  const columnWidths = useMemo(() => ({
    number: "2%",
    name: "21%",
    email: "15%",
    phone: "14%",
    access: "14%",
    assign: "14%",
    superAdmin: "10%",
    actions: "10%",
  }), []);

  const filteredNames = useMemo(() => {
    if (!state.searchTerm) return [];
    return state.admins.filter((admin) =>
      admin.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      admin.title?.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
  }, [state.searchTerm, state.admins]);

  // Filter Components
  const renderMobileFilters = () => (
    <Drawer
      anchor="top"
      open={state.isDrawerOpen}
      onClose={() => handleStateChange("isDrawerOpen", false)}
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
        <IconButton onClick={() => handleStateChange("isDrawerOpen", false)} sx={{ color: "#F6F4FE" }}>
          <IoMdClose />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 2, pb: 2 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px", display: "block", mb: 1 }}
          >
            Search by name
          </Typography>
          <Autocomplete
            freeSolo
            options={filteredNames.map((admin) => admin.name)}
            value={state.searchTerm || ""}
            onInputChange={(_, newValue) => handleStateChange("searchTerm", newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Enter name to search"
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: "#4d4d4e8e",
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-root": {
                    color: "#F6F4FE",
                    "& fieldset": { borderColor: "transparent" },
                  },
                  "& .MuiInputBase-input": { py: 1 },
                }}
              />
            )}
            componentsProps={{
              clearIndicator: { sx: { color: "#F6F4FE" } },
            }}
            clearIcon={<Close sx={{ color: "#F6F4FE" }} />}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px" }}
            >
              Access Level
            </Typography>
            {state.isSearching && (
              <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
            )}
          </Box>
          <TextField
            select
            fullWidth
            value={state.accessLevel}
            onChange={(e) => {
              const value = e.target.value;
              handleStateChange("accessLevel", value);
              handleStateChange("selectedBranch", "");
              handleStateChange("selectedDepartment", "");
              handleStateChange("selectedUnit", "");
              if (value === "branch" || value === "department" || value === "unit") {
                fetchBranches();
              }
            }}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
            }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="branch">Branch</MenuItem>
            <MenuItem value="department">Department</MenuItem>
            <MenuItem value="unit">Unit</MenuItem>
          </TextField>
        </Box>
        {(state.accessLevel === "branch" || state.accessLevel === "department" || state.accessLevel === "unit") && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px" }}
              >
                Select Branch
              </Typography>
              {loadingStates.branches && (
                <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
              )}
            </Box>
            <TextField
              select
              fullWidth
              value={state.selectedBranch}
              onChange={(e) => {
                const branchId = e.target.value;
                handleStateChange("selectedBranch", branchId);
                handleStateChange("selectedDepartment", "");
                handleStateChange("selectedUnit", "");
                if (state.accessLevel === "department" || state.accessLevel === "unit") {
                  fetchDepartments(branchId);
                }
              }}
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: "#4d4d4e8e",
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
              }}
            >
              <MenuItem value="">Select Branch</MenuItem>
              {loadingStates.branches ? (
                <MenuItem value="" disabled>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Loading branches...</Typography>
                  </Box>
                </MenuItem>
              ) : state.branches.length === 0 ? (
                <MenuItem value="" disabled>
                  <Typography variant="body2">No branches available</Typography>
                </MenuItem>
              ) : (
                state.branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>
        )}
        {(state.accessLevel === "department" || state.accessLevel === "unit") && state.selectedBranch && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px" }}
              >
                Select Department
              </Typography>
              {loadingStates.departments && (
                <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
              )}
            </Box>
            <TextField
              select
              fullWidth
              value={state.selectedDepartment}
              onChange={(e) => {
                const deptId = e.target.value;
                handleStateChange("selectedDepartment", deptId);
                handleStateChange("selectedUnit", "");
                if (state.accessLevel === "unit") {
                  fetchUnits(deptId);
                }
              }}
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: "#4d4d4e8e",
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
              }}
            >
              <MenuItem value="">Select Department</MenuItem>
              {loadingStates.departments ? (
                <MenuItem value="" disabled>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Loading departments...</Typography>
                  </Box>
                </MenuItem>
              ) : state.departments.length === 0 ? (
                <MenuItem value="" disabled>
                  <Typography variant="body2">No departments available</Typography>
                </MenuItem>
              ) : (
                state.departments.filter((dept) => dept.branchId === state.selectedBranch).map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>
        )}
        {state.accessLevel === "unit" && state.selectedDepartment && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px" }}
              >
                Select Unit
              </Typography>
              {loadingStates.units && (
                <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
              )}
            </Box>
            <TextField
              select
              fullWidth
              value={state.selectedUnit}
              onChange={(e) => {
                handleStateChange("selectedUnit", e.target.value);
              }}
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: "#4d4d4e8e",
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
              }}
            >
              <MenuItem value="">Select Unit</MenuItem>
              {loadingStates.units ? (
                <MenuItem value="" disabled>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Loading units...</Typography>
                  </Box>
                </MenuItem>
              ) : state.units.length === 0 ? (
                <MenuItem value="" disabled>
                  <Typography variant="body2">No units available</Typography>
                </MenuItem>
              ) : (
                state.units.filter((unit) => unit.departmentId === state.selectedDepartment).map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>
        )}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px" }}
            >
              Super Admin?
            </Typography>
            {state.isSearching && (
              <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
            )}
          </Box>
          <TextField
            select
            fullWidth
            value={state.superAdminFilter === null ? "" : String(state.superAdminFilter)}
            onChange={(e) => {
              const value = e.target.value;
              handleStateChange("superAdminFilter", value === "" ? null : value === "true");
            }}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
            }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </TextField>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSearch}
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
    <Box sx={{ display: "flex", width: "100%" }}>
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
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: "200px", padding: "4px 16px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Who?
          </Typography>
          <Autocomplete
            freeSolo
            options={filteredNames.map((admin) => admin.name)}
            value={state.searchTerm}
            onChange={(_, newValue) => handleStateChange("searchTerm", newValue || "")}
            onInputChange={(_, newInput) => handleStateChange("searchTerm", newInput)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name or title"
                variant="standard"
                sx={{
                  "& .MuiInputBase-input": {
                    color: state.searchTerm ? "#F6F4FE" : "#777280",
                    fontWeight: 500,
                    fontSize: "14px",
                    padding: "4px 8px",
                  },
                  "& .MuiInput-underline:before": { borderBottom: "none" },
                  "& .MuiInput-underline:after": { borderBottom: "none" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                }}
              />
            )}
            componentsProps={{
              clearIndicator: { sx: { color: "#F6F4FE" } },
            }}
            clearIcon={<Close sx={{ color: "#F6F4FE" }} />}
          />
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: "160px", padding: "4px 8px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px" }}>
              Access Level
            </Typography>
            {state.isSearching && (
              <CircularProgress size={12} sx={{ color: "#F6F4FE" }} />
            )}
          </Box>
          <MuiSelect
            value={state.accessLevel}
            onChange={(e) => {
              const value = e.target.value as string;
              handleStateChange("accessLevel", value);
              handleStateChange("selectedBranch", "");
              handleStateChange("selectedDepartment", "");
              handleStateChange("selectedUnit", "");
              if (value === "branch" || value === "department" || value === "unit") {
                fetchBranches();
              }
            }}
            displayEmpty
            sx={{
              color: state.accessLevel ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => selected || "Select Level"}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="branch">Branch</MenuItem>
            <MenuItem value="department">Department</MenuItem>
            <MenuItem value="unit">Unit</MenuItem>
          </MuiSelect>
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        {(state.accessLevel === "branch" || state.accessLevel === "department" || state.accessLevel === "unit") && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column",flex: 1, minWidth: "160px", padding: "4px 8px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px" }}>
                  Branch
                </Typography>
                {loadingStates.branches && (
                  <CircularProgress size={12} sx={{ color: "#F6F4FE" }} />
                )}
              </Box>
              <MuiSelect
                value={state.selectedBranch}
                onChange={(e) => {
                  const branchId = e.target.value as string;
                  handleStateChange("selectedBranch", branchId);
                  handleStateChange("selectedDepartment", "");
                  handleStateChange("selectedUnit", "");
                  if (state.accessLevel === "department" || state.accessLevel === "unit") {
                    fetchDepartments(branchId);
                  }
                }}
                displayEmpty
                sx={{
                  color: state.selectedBranch ? "#F6F4FE" : "#777280",
                  fontWeight: 500,
                  fontSize: "14px",
                  ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                  ".MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-icon": { display: "none", },
                }}
                renderValue={(selected) => selected ? state.branches.find((b) => b.id === selected)?.name || "Select Branch" : "Select Branch"}
              >
                <MenuItem value="">Select Branch</MenuItem>
                {loadingStates.branches ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Loading branches...</Typography>
                    </Box>
                  </MenuItem>
                ) : state.branches.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2">No branches available</Typography>
                  </MenuItem>
                ) : (
                  state.branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))
                )}
              </MuiSelect>
            </Box>
            <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
          </>
        )}
        {(state.accessLevel === "department" || state.accessLevel === "unit") && state.selectedBranch && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column",flex: 1, minWidth: "160px", padding: "4px 8px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px" }}>
                  Department
                </Typography>
                {loadingStates.departments && (
                  <CircularProgress size={12} sx={{ color: "#F6F4FE" }} />
                )}
              </Box>
              <MuiSelect
                value={state.selectedDepartment}
                onChange={(e) => {
                  const deptId = e.target.value as string;
                  handleStateChange("selectedDepartment", deptId);
                  handleStateChange("selectedUnit", "");
                  if (state.accessLevel === "unit") {
                    fetchUnits(deptId);
                  }
                }}
                displayEmpty
                sx={{
                  color: state.selectedDepartment ? "#F6F4FE" : "#777280",
                  fontWeight: 500,
                  fontSize: "14px",
                  ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                  ".MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-icon": { display: "none" },
                }}
                renderValue={(selected) => selected ? state.departments.find((d) => d.id === selected)?.name || "Select Department" : "Select Department"}
              >
                <MenuItem value="">Select Department</MenuItem>
                {loadingStates.departments ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Loading departments...</Typography>
                    </Box>
                  </MenuItem>
                ) : state.departments.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2">No departments available</Typography>
                  </MenuItem>
                ) : (
                  state.departments.filter((dept) => dept.branchId === state.selectedBranch).map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))
                )}
              </MuiSelect>
            </Box>
            <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
          </>
        )}
        {state.accessLevel === "unit" && state.selectedDepartment && (
          <>
            <Box sx={{ display: "flex", flexDirection: "column",flex: 1, minWidth: "160px", padding: "4px 8px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px" }}>
                  Unit
                </Typography>
                {loadingStates.units && (
                  <CircularProgress size={12} sx={{ color: "#F6F4FE" }} />
                )}
              </Box>
              <MuiSelect
                value={state.selectedUnit}
                onChange={(e) => {
                  handleStateChange("selectedUnit", e.target.value as string);
                }}
                displayEmpty
                sx={{
                  color: state.selectedUnit ? "#F6F4FE" : "#777280",
                  fontWeight: 500,
                  fontSize: "14px",
                  ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                  ".MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-icon": { display: "none" },
                }}
                renderValue={(selected) => selected ? state.units.find((u) => u.id === selected)?.name || "Select Unit" : "Select Unit"}
              >
                <MenuItem value="">Select Unit</MenuItem>
                {loadingStates.units ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">Loading units...</Typography>
                    </Box>
                  </MenuItem>
                ) : state.units.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2">No units available</Typography>
                  </MenuItem>
                ) : (
                  state.units.filter((unit) => unit.departmentId === state.selectedDepartment).map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))
                )}
              </MuiSelect>
            </Box>
            <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
          </>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: "140px", padding: "4px 8px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px" }}>
              Super Admin?
            </Typography>
            {state.isSearching && (
              <CircularProgress size={12} sx={{ color: "#F6F4FE" }} />
            )}
          </Box>
          <MuiSelect
            value={state.superAdminFilter === null ? "" : String(state.superAdminFilter)}
            onChange={(e) => {
              const value = e.target.value;
              handleStateChange("superAdminFilter", value === "" ? null : value === "true");
            }}
            displayEmpty
            sx={{
              color: state.superAdminFilter !== null ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => selected ? selected === "true" ? "True" : "False" : "Select Option"}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </MuiSelect>
        </Box>
        <Box sx={{ ml: "auto", pr: "8px" }}>
          <Button
            onClick={handleSearch}
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
            {state.isSearching ? <CircularProgress size={20} color="inherit" /> : <Search sx={{ fontSize: "20px" }} />}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // Empty State Component
  const EmptyState = () => (
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
      <Typography
        variant="h6"
        color="rgba(255, 255, 255, 0.1)"
        gutterBottom
        sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}
      >
        No admins found
      </Typography>
      {state.error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {state.error}
        </Typography>
      ) : null}
      <Button
        variant="contained"
        onClick={() => handleStateChange("openModal", true)}
        sx={{
          backgroundColor: "#363740",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
        }}
      >
        Create New Admin
      </Button>
    </Box>
  );

  // Render
  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 12, lg: 12 }}>
            <Typography
              variant={isMobile ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.1rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Admins</span>
            </Typography>
            <Box sx={{ mt: 2 }}>
              {isMobile ? (
                <>
                  <Box sx={{ display: "flex", width: "100%" }}>
                    <Box
                      sx={{
                        border: "1px solid #DDDDDD",
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
                      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 16px" }}>
                        <TextField
                          value={state.searchTerm}
                          onChange={(e) => handleStateChange("searchTerm", e.target.value)}
                          placeholder="Search by name"
                          variant="standard"
                          sx={{
                            "& .MuiInputBase-input": {
                              color: state.searchTerm ? "#F6F4FE" : "#777280",
                              fontWeight: 500,
                              fontSize: "14px",
                              padding: "4px 8px",
                            },
                            "& .MuiInput-underline:before": { borderBottom: "none" },
                            "& .MuiInput-underline:after": { borderBottom: "none" },
                            "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                          }}
                          onFocus={() => state.searchTerm && handleStateChange("isNameDropdownOpen", true)}
                          onBlur={() => setTimeout(() => handleStateChange("isNameDropdownOpen", false), 200)}
                        />
                        {state.isNameDropdownOpen && filteredNames.length > 0 && (
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
                            {filteredNames.map((admin, index) => (
                              <Box
                                key={admin.id}
                                sx={{
                                  padding: "8px 16px",
                                  color: "#F6F4FE",
                                  cursor: "pointer",
                                  "&:hover": { backgroundColor: "#4d4d4e8e" },
                                  borderBottom: index < filteredNames.length - 1 ? "1px solid #777280" : "none",
                                }}
                                onClick={() => {
                                  handleStateChange("searchTerm", admin.name);
                                  handleStateChange("isNameDropdownOpen", false);
                                }}
                              >
                                {admin.name}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                      <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                      <IconButton
                        onClick={() => handleStateChange("isDrawerOpen", true)}
                        sx={{ color: "#777280", "&:hover": { color: "#F6F4FE" } }}
                      >
                        <IoMdAttach />
                      </IconButton>
                      <Box sx={{ pr: "8px" }}>
                        <Button
                          onClick={handleSearch}
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
                          {state.isSearching ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <Search sx={{ fontSize: "20px" }} />
                          )}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                  {renderMobileFilters()}
                </>
              ) : (
                renderDesktopFilters()
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 12, lg: 12 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <Button
              variant="contained"
              onClick={() => handleStateChange("openModal", true)}
              size="medium"
              sx={{
                backgroundColor: "#363740",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 50,
                color: "#F6F4FE",
                fontWeight: 500,
                textTransform: "none",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": { backgroundColor: "#777280", opacity: 0.9 },
              }}
            >
              Create Admin +
            </Button>
          </Grid>
        </Grid>

        {state.searchError && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, display: "flex", alignItems: "center" }}
          >
            <Box component="span" sx={{ mr: 1 }}>⚠️</Box>
            {state.searchError}
          </Typography>
        )}

        {state.loading && state.admins.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {state.error && !state.loading && state.admins.length === 0 && <EmptyState />}

        {!state.loading && !state.error && state.admins.length === 0 && <EmptyState />}

        {state.admins.length > 0 && (
          <TableContainer sx={{ boxShadow: 9, overflowX: "auto", backgroundColor: "transparent" }}>
            <Table sx={{ minWidth: { xs: "auto", sm: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ "& th": { border: "none", backgroundColor: "transparent" } }}>
                  <TableCell sx={{ fontWeight: 600, width: columnWidths.number, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                    #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: columnWidths.name, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                    Full Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: columnWidths.email, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: columnWidths.phone, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                    Phone Number
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: columnWidths.access, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                    Access Level
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: columnWidths.assign, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                    Assigned Area
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: columnWidths.superAdmin, fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                    Super Admin
                  </TableCell>
                  {authData?.isSuperAdmin && (
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#777280", py: 2 }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {state.admins.map((admin, index) => (
                  <TableRow
                    key={admin.id}
                    sx={{
                      "& td": { border: "none" },
                      backgroundColor: admin.isDeleted ? "rgba(0, 0, 0, 0.04)" : "#4d4d4e8e",
                      borderRadius: "4px",
                      "&:hover": { backgroundColor: "#4d4d4e8e", transform: "translateY(-2px)", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" },
                      transition: "all 0.2s ease",
                      mb: 2,
                    }}
                  >
                    <TableCell sx={{ textDecoration: admin.isDeleted ? "line-through" : "none", color: admin.isDeleted ? "gray" : "#F6F4FE", width: columnWidths.number, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2 }}>
                      {(index + 1).toString().padStart(2, "0")}
                    </TableCell>
                    <TableCell sx={{ textDecoration: admin.isDeleted ? "line-through" : "none", color: admin.isDeleted ? "gray" : "#F6F4FE", display: "flex", alignItems: "center", gap: 1, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2, flex: 1 }}>
                      <Box className="py-2 px-3 rounded-full bg-[#F6F4FE] text-[#160F38] font-bold text-lg mr-2">
                        {admin.name.split(" ").map((name) => name.charAt(0)).join("")}
                      </Box>
                      <Box>
                        {admin.name}
                        <br />
                        <span className="text-[13px] text-[#777280]">{admin.title || "-"}</span>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textDecoration: admin.isDeleted ? "line-through" : "none", color: admin.isDeleted ? "gray" : "#F6F4FE", width: columnWidths.email, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2 }}>
                      <Tooltip title={admin.email || "-"} arrow>
                        <Box sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {truncateText(admin.email)}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ textDecoration: admin.isDeleted ? "line-through" : "none", color: admin.isDeleted ? "gray" : "#F6F4FE", width: columnWidths.phone, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2 }}>
                      {admin.phone || "-"}
                    </TableCell>
                    <TableCell sx={{ textDecoration: admin.isDeleted ? "line-through" : "none", color: admin.isDeleted ? "gray" : "#F6F4FE", width: columnWidths.access, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2 }}>
                      {admin.scopeLevel || "-"}
                    </TableCell>
                    <TableCell sx={{ textDecoration: admin.isDeleted ? "line-through" : "none", color: admin.isDeleted ? "gray" : "#F6F4FE", width: columnWidths.assign, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2 }}>
                      {getAssignLevelText(admin)}
                    </TableCell>
                    <TableCell sx={{ textDecoration: admin.isDeleted ? "line-through" : "none", color: admin.isDeleted ? "gray" : "#F6F4FE", width: columnWidths.superAdmin, fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2 }}>
                      {admin.isSuperAdmin ? "Yes" : "No"}
                    </TableCell>
                    {authData?.isSuperAdmin && (
                      <TableCell sx={{ width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined, py: 2, borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }}>
                        { admin.scopeLevel !== 'branch' && <IconButton
                          aria-label="more"
                          onClick={(e) => handleMenuOpen(e, admin)}
                          disabled={state.loading}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            bgcolor: "#E1E1E1",
                            "&:hover": { backgroundColor: "var(--color-primary)", color: "#f0f0f0" },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <CustomPagination
              hasNextPage={state.pagination.hasNextPage}
              hasPrevPage={state.pageHistory.length > 0}
              onPageChange={handlePageChange}
              currentPage={state.currentPage}
              isLargeScreen={isLargeScreen}
              isLoading={state.loading}
            />
          </TableContainer>
        )}

        <Menu
          id="admin-menu"
          anchorEl={state.anchorEl}
          keepMounted
          open={Boolean(state.anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: { "& .MuiMenuItem-root": { fontSize: isLargeScreen ? "0.875rem" : undefined } },
          }}
        >
        {state.currentAdmin && state.currentAdmin.scopeLevel !== 'branch' && (
          <MenuItem onClick={handleEditOpen} disabled={state.currentAdmin?.isDeleted}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
        )}
          <MenuItem
            onClick={() => showConfirmation("suspend")}
            disabled={state.loading || !canSuspend}
          >
            {!state.currentAdmin?.isSuspended ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: "1rem" }} />
                {state.loading && state.actionType === "suspend"
                  ? "Suspending..."
                  : "Suspend"}
              </>
            ) : (
              <>
                <MdRefresh style={{ marginRight: 8, fontSize: "1rem" }} />
                {state.loading && state.actionType === "suspend"
                  ? "Activating..."
                  : "Activate"}
              </>
            )}
          </MenuItem>

          <MenuItem
            onClick={() => showConfirmation("delete")}
            disabled={state.loading || !canDelete}
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        <Dialog
          open={state.confirmModalOpen}
          onClose={() => handleStateChange("confirmModalOpen", false)}
          maxWidth="xs"
          sx={{ "& .MuiPaper-root": { bgcolor: "#2C2C2C", color: "#F6F4FE" } }}
          fullWidth
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {state.actionType === "delete"
              ? "Delete Admin"
              : state.currentAdmin?.isSuspended
              ? "Activate Admin"
              : "Suspend Admin"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {state.actionType === "delete"
                ? `Are you sure you want to delete "${state.currentAdmin?.name}"?`
                : `Are you sure you want to ${state.currentAdmin?.isSuspended ? "activate" : "suspend"} "${state.currentAdmin?.name}"?`}
              {state.currentAdmin?.isSuperAdmin && " Super admin cannot be modified."}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleStateChange("confirmModalOpen", false)}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedAction}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined,color: state.actionType === 'delete' ? '#f6f4fe' : '#2c2c2c' , backgroundColor: state.actionType === "delete" ? "#E61E4D" : "#f6f4fe", "&:hover": { backgroundColor: state.actionType === "delete" ? "#b91535" : "#f6f4fe" } }}
              variant="contained"
              disabled={state.loading || !canDelete || !canSuspend}
            >
              {state.loading ? "Processing..." : state.actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>

        <AdminModal open={state.openModal} onClose={handleCloseModal} />
        <EditAdminModal
          open={state.editModalOpen}
          onClose={handleEditClose}
          adminData={{
            id: String(state.currentAdmin?.id ?? ""),
            name: state.currentAdmin?.name ?? "",
            title: state.currentAdmin?.title ?? "",
            email: state.currentAdmin?.email ?? "",
            phone: state.currentAdmin?.phone ?? "",
            isSuperAdmin: !!state.currentAdmin?.isSuperAdmin,
            scopeLevel: state.currentAdmin?.scopeLevel ?? "branch",
            branches: state.currentAdmin?.branches?.map((b) => ({
              id: String(b.id),
              name: b.name,
            })) || [],
            departments: state.currentAdmin?.departments?.map((d) => ({
              id: String(d.id),
              name: d.name,
            })) || [],
            units: state.currentAdmin?.units?.map((u) => ({
              id: String(u.id),
              name: u.name,
            })) || [],
          }}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewAdmins;

export async function fetchBranches(): Promise<Branch[]> {
  try {
    const response = await Api.get("/church/get-branches");
    return response?.data?.branches ?? [];
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
}