import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Close,
} from "@mui/icons-material";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";

interface Branch {
  id: number | string;
  name: string;
  address: string;
}

interface Department {
  id: string;
  name: string;
  type?: string;
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
}

interface Admin {
  id: number | string;
  name: string;
  email: string;
  title?: string;
  phone: string;
  isSuperAdmin: boolean;
  isSuspended?: boolean;
  scopeLevel: string;
  branchId?: number | string;
  departmentIds?: string[];
  unitIds?: string[];
  isDeleted?: boolean;
  departments?: Department[];
  units?: Unit[];
  branch?: Branch;
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
  selectedBranch: number | string;
  selectedDepartment: string;
  selectedUnit: string;
  isSuperAdmin: boolean;
  searchTerm: string;
  accessLevel: string;
  assignLevel: string;
  superAdminFilter: string;
  isSearching: boolean;
  isDrawerOpen: boolean;
  editName: string;
  editEmail: string;
  editPhone: string;
  isNameDropdownOpen: boolean;
  searchError: string | null;
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

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: 'next' | 'prev') => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading?: boolean;
}


const initialState: State = {
  admins: [],
  pagination: {
    hasNextPage: false,
    nextCursor: null,
    nextPage: null,
  },
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
  assignLevel: "",
  superAdminFilter: "",
  isSearching: false,
  isDrawerOpen: false,
  editName: "",
  editEmail: "",
  editPhone: "",
  isNameDropdownOpen: false,
  searchError: null,
};

const CustomPagination: React.FC<CustomPaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  onPageChange,
  currentPage,
  isLargeScreen,
  isLoading = false,
}) => {
  return (
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          sx={{
            fontSize: isLargeScreen ? "0.75rem" : "0.875rem",
            color: "#777280",
          }}
        >
          Page {currentPage}
        </Typography>
      </Box>
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
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
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
            color: (!hasNextPage || isLoading) ? "#777280" : "#160F38",
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
          }}
        >
          <ChevronRight />
        </Button>
      </Box>
    </Box>
  );
};

const ViewAdmins: React.FC = () => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [state, setState] = useState<State>(initialState);

  const handleStateChange = useCallback(<K extends keyof State>(key: K, value: State[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Add loading states to your state management
  const [loadingStates, setLoadingStates] = useState({
    branches: false,
    departments: false,
    units: false,
  });

  const columnWidths = useMemo(() => ({
    number: "2%",
    name: "21%",
    email: "15%",
    access: "14%",
    assign: "14%",
    phone: "14%",
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

  // Fetch admins function
  const fetchAdmins = useCallback(async (url: string | null = null): Promise<FetchAdminsResponse> => {
    const response = await (url ? Api.get(url) : Api.get("/church/view-admins"));
    return response.data;
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetchAdmins();
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            admins: data.admins || [],
            pagination: {
              hasNextPage: data.pagination?.hasNextPage || false,
              nextCursor: data.pagination?.nextCursor || null,
              nextPage: data.pagination?.nextPage || null,
            },
            currentPage: 1,
            pageHistory: [],
            loading: false,
          }));
        }
      } catch (error) {
        console.error("Error loading initial admins:", error);
        const errorMessage = "Failed to load admins";
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        toast.error(errorMessage);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchAdmins]);

  // Update your fetch functions to include loading states
  const fetchBranches = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, branches: true }));
      const response = await Api.get("/church/get-branches");
      setState((prev) => ({ ...prev, branches: response.data.branches || [] }));
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches");
    } finally {
      setLoadingStates(prev => ({ ...prev, branches: false }));
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, departments: true }));
      const response = await Api.get("/church/get-departments");
      setState((prev) => ({ ...prev, departments: response.data.departments || [] }));
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    } finally {
      setLoadingStates(prev => ({ ...prev, departments: false }));
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, units: true }));
      const response = await Api.get(`/church/all-units`);
      setState((prev) => ({ ...prev, units: response.data.units || [] }));
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to load units");
    } finally {
      setLoadingStates(prev => ({ ...prev, units: false }));
    }
  }, []);

  useEffect(() => {
    const loadDataForAccessLevel = async () => {
      switch (state.accessLevel) {
        case "branch":
          await fetchBranches();
          break;
        case "department":        
          await fetchDepartments();
          break;
        case "unit":          
          await fetchUnits();       
          break;
        default:
          break;
      }
    };

    loadDataForAccessLevel();
  }, [state.accessLevel,  fetchBranches, fetchDepartments, fetchUnits]);


  // Pagination handlers
  const handlePageChange = useCallback(async (direction: 'next' | 'prev') => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      if (direction === 'next') {
        const url = state.pagination.nextPage;
        if (!url) throw new Error("No next page available");
        const data = await fetchAdmins(url);
        setState((prev) => ({
          ...prev,
          admins: data.admins || [],
          pagination: {
            hasNextPage: data.pagination?.hasNextPage || false,
            nextCursor: data.pagination?.nextCursor || null,
            nextPage: data.pagination?.nextPage || null,
          },
          pageHistory: [...prev.pageHistory, url],
          currentPage: prev.currentPage + 1,
          loading: false,
        }));
      } else if (direction === 'prev') {
        if (state.pageHistory.length === 0) throw new Error("No previous page available");
        const prevIndex = state.pageHistory.length - 2;
        const url = prevIndex >= 0 ? state.pageHistory[prevIndex] : null;
        const data = await fetchAdmins(url);
        setState((prev) => ({
          ...prev,
          admins: data.admins || [],
          pagination: {
            hasNextPage: data.pagination?.hasNextPage || false,
            nextCursor: data.pagination?.nextCursor || null,
            nextPage: data.pagination?.nextPage || null,
          },
          pageHistory: prev.pageHistory.slice(0, -1),
          currentPage: prev.currentPage - 1,
          loading: false,
        }));
      }
    } catch (error) {
      console.error(`Error fetching ${direction} page:`, error);
      const errorMessage = "Failed to load page";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
    }
  }, [state.pagination.nextPage, state.pageHistory, fetchAdmins]);

  const handleSearch = useCallback(async () => {
    handleStateChange("isSearching", true);
    handleStateChange("searchError", null);
    try {
      const params: { [key: string]: string | boolean } = {};
      if (state.searchTerm) {
        params.search = state.searchTerm;
        params.searchField = 'name';
      }
      if (state.accessLevel) params.scopeLevel = state.accessLevel.toLowerCase();
      if (state.assignLevel) {
        if (state.accessLevel === "branch") params.branchId = state.assignLevel;
        if (state.accessLevel === "department") params.departmentId = state.assignLevel;
        if (state.accessLevel === "unit") params.unitId = state.assignLevel;
      }
      const response = await Api.get("/church/view-admins", { params });
      
      if (response.data.admins.length === 0) {
        // Client-side fallback filtering
        const filtered = state.admins.filter((admin) => {
          let match: boolean = true; // Explicitly typed as boolean
          if (state.searchTerm) {
            match && (
              admin.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              admin.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              admin.title?.toLowerCase().includes(state.searchTerm.toLowerCase())
            ) || false;
          }
          if (state.accessLevel) {
            match = match && (admin.scopeLevel === state.accessLevel.toLowerCase());
          }
          if (state.assignLevel) {
            if (state.accessLevel === "branch") match = match && (admin.branchId === state.assignLevel);
            if (state.accessLevel === "department") match = match && (admin.departmentIds?.includes(state.assignLevel) ?? false);
            if (state.accessLevel === "unit") match = match && (admin.unitIds?.includes(state.assignLevel) ?? false);
          }
          if (state.superAdminFilter) {
            match = match && (admin.isSuperAdmin === (state.superAdminFilter === 'Yes'));
          }
          return match;
        });

        if (filtered.length === 0) {
          throw new Error("No admins found matching the search criteria");
        }

        setState((prev) => ({
          ...prev,
          admins: filtered,
          pagination: { hasNextPage: false, nextCursor: null, nextPage: null },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          admins: response.data.admins || [],
          pagination: {
            hasNextPage: response.data.pagination?.hasNextPage || false,
            nextCursor: response.data.pagination?.nextCursor || null,
            nextPage: response.data.pagination?.nextPage || null,
          },
        }));
      }

      handleStateChange("currentPage", 1);
      handleStateChange("pageHistory", []);
      toast.success("Search completed successfully!");
    } catch (error: any) {
      console.error("Error searching admins:", error);
      const errorMessage = error.response?.data.error.message || "No admins found matching the search criteria";
      handleStateChange("searchError", errorMessage);    
    } finally {
      handleStateChange("isSearching", false);
      handleStateChange("isDrawerOpen", false);
    }
  }, [state.searchTerm, state.accessLevel, state.assignLevel, state.superAdminFilter, state.admins]);

  // Menu handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, admin: Admin) => {
    handleStateChange("anchorEl", event.currentTarget);
    handleStateChange("currentAdmin", admin);
    handleStateChange("editName", admin.name);
    handleStateChange("editEmail", admin.email);
    handleStateChange("editPhone", admin.phone);
    handleStateChange("isSuperAdmin", admin.isSuperAdmin);
    handleStateChange("selectedBranch", admin.branchId || "");
    handleStateChange("selectedDepartment", admin.departments?.[0]?.id || "");
    handleStateChange("selectedUnit", admin.units?.[0]?.id || "");
  }, []);

  const handleMenuClose = useCallback(() => {
    handleStateChange("anchorEl", null);
  }, []);

  // Edit handlers
  const handleEditOpen = useCallback(() => {
    if (state.currentAdmin) {
      handleStateChange("editModalOpen", true);
      if (state.currentAdmin.scopeLevel === "branch") fetchBranches();
      if (state.currentAdmin.scopeLevel === "department" || state.currentAdmin.scopeLevel === "unit") fetchDepartments();
    }
    handleMenuClose();
  }, [state.currentAdmin, fetchBranches, fetchDepartments, handleMenuClose]);

  const handleEditClose = useCallback(() => {
    handleStateChange("editModalOpen", false);
    handleStateChange("currentAdmin", null);
    handleStateChange("selectedBranch", "");
    handleStateChange("selectedDepartment", "");
    handleStateChange("selectedUnit", "");
    handleStateChange("isSuperAdmin", false);
    handleStateChange("editName", "");
    handleStateChange("editEmail", "");
    handleStateChange("editPhone", "");
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!state.currentAdmin?.id) {
      toast.error("Invalid admin data");
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const payload: any = {
        name: state.editName,
        email: state.editEmail,
        phone: state.editPhone,
        isSuperAdmin: state.isSuperAdmin,
      };

      if (state.currentAdmin.scopeLevel === "branch" && state.selectedBranch) {
        payload.branchId = state.selectedBranch.toString();
      }
      if (state.currentAdmin.scopeLevel === "department" && state.selectedDepartment) {
        payload.departmentIds = [state.selectedDepartment];
      }
      if (state.currentAdmin.scopeLevel === "unit" && state.selectedUnit) {
        payload.unitIds = [state.selectedUnit];
      }

      await Api.patch(`/church/edit-admin?id=${state.currentAdmin.id}`, payload);

      setState((prev) => ({
        ...prev,
        admins: prev.admins.map((admin) =>
          admin.id === state.currentAdmin?.id
            ? {
                ...admin,
                name: state.editName,
                email: state.editEmail,
                phone: state.editPhone,
                isSuperAdmin: state.isSuperAdmin,
                branchId: state.currentAdmin?.scopeLevel === "branch" ? state.selectedBranch : admin.branchId,
                departments: state.currentAdmin?.scopeLevel === "department" && state.selectedDepartment
                  ? state.departments.filter((d) => d.id === state.selectedDepartment)
                  : admin.departments,
                units: state.currentAdmin?.scopeLevel === "unit" && state.selectedUnit
                  ? state.units.filter((u) => u.id === state.selectedUnit)
                  : admin.units,
              }
            : admin
        ),
        loading: false,
      }));

      toast.success("Admin updated successfully!");
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update admin");
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.currentAdmin, state.editName, state.editEmail, state.editPhone, state.isSuperAdmin, state.selectedBranch, state.selectedDepartment, state.selectedUnit, state.departments, state.units, handleEditClose]);

  // Action confirmation handlers
  const showConfirmation = useCallback((action: string) => {
    handleStateChange("actionType", action);
    handleStateChange("confirmModalOpen", true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleConfirmedAction = useCallback(async () => {
    if (!state.currentAdmin || !state.actionType) return;

    setState((prev) => ({ ...prev, loading: true }));
    try {
      if (state.actionType === "delete") {
        await Api.delete(`/church/delete-admin/${state.currentAdmin.id}`);
        setState((prev) => ({
          ...prev,
          admins: prev.admins.filter((admin) => admin.id !== state.currentAdmin?.id),
        }));
        toast.success("Admin deleted successfully!");
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentAdmin.isSuspended;
        await Api.patch(`/church/${newStatus ? "suspend" : "activate"}-admin/${state.currentAdmin.id}`);
        setState((prev) => ({
          ...prev,
          admins: prev.admins.map((admin) =>
            admin.id === state.currentAdmin?.id ? { ...admin, isSuspended: newStatus } : admin
          ),
        }));
        toast.success(`Admin ${newStatus ? "suspended" : "activated"} successfully!`);
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${state.actionType} admin`);
    } finally {
      setState((prev) => ({ ...prev, loading: false, confirmModalOpen: false, actionType: null, currentAdmin: null }));
    }
  }, [state.currentAdmin, state.actionType]);

  // Modal handlers
  const handleCloseModal = useCallback(async () => {
    handleStateChange("openModal", false);
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdmins();
      setState((prev) => ({
        ...prev,
        admins: data.admins || [],
        pagination: {
          hasNextPage: data.pagination?.hasNextPage || false,
          nextCursor: data.pagination?.nextCursor || null,
          nextPage: data.pagination?.nextPage || null,
        },
        currentPage: 1,
        pageHistory: [],
        loading: false,
      }));
    } catch (error) {
      console.error("Error refreshing admins after modal close:", error);
      const errorMessage = "Failed to refresh admins";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
    }
  }, [fetchAdmins]);

  // Helper functions
  const truncateText = useCallback((text: string | null | undefined, maxLength = 30) => {
    if (!text) return "-";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  }, []);

  const getAssignLevelText = (admin: Admin) => {
    if (admin.scopeLevel === "branch") {
      const branch = state.branches.find((b) => b.id === admin.branchId);
      return branch ? branch.name : "-";
    } else if (admin.scopeLevel === "department") {
      const dept = state.departments.find((d) => admin.departmentIds?.includes(d.id));
      return dept ? dept.name : "-";
    } else if (admin.scopeLevel === "unit") {
      const unit = state.units.find((u) => admin.unitIds?.includes(u.id));
      return unit ? unit.name : "-";
    }
    return admin.scopeLevel || "-";
  };


  // Filter components (mobile)
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
        <Box sx={{ position: "relative" }}>
          <Typography
            variant="caption"
            sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px", display: "block", mb: 1 }}
          >
            Search by name
          </Typography>
          <TextField
            fullWidth
            value={state.searchTerm}
            onChange={(e) => handleStateChange("searchTerm", e.target.value)}
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
        </Box>
        
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px", display: "block", mb: 1 }}
          >
            Access level
          </Typography>
          <TextField
            select
            fullWidth
            value={state.accessLevel}
            onChange={(e) => {
              handleStateChange("accessLevel", e.target.value);
              handleStateChange("assignLevel", "");
              if (e.target.value === "branch") fetchBranches();
              if (e.target.value === "department" || e.target.value === "unit") fetchDepartments();
            }}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
            }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="branch">Branch</MenuItem>
            <MenuItem value="department">Department</MenuItem>
            <MenuItem value="unit">Unit</MenuItem>
          </TextField>
        </Box>

        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px", display: "block", mb: 1 }}
          >
            Assign Area
          </Typography>
          <TextField
            select
            fullWidth
            value={state.assignLevel}
            onChange={(e) => {
              handleStateChange("assignLevel", e.target.value);
            }}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
            }}
            disabled={!state.accessLevel}
          >
            
            {state.accessLevel === "branch" && loadingStates.branches && (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16}  />
                  <Typography variant="body2" >
                    Loading branches...
                  </Typography>
                </Box>
              </MenuItem>
            )}

            {state.accessLevel === "department" && loadingStates.departments && (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" >
                    Loading departments...
                  </Typography>
                </Box>
              </MenuItem>
            )}

            {state.accessLevel === "unit" && loadingStates.units && (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16}  />
                  <Typography variant="body2" >
                    Loading units...
                  </Typography>
                </Box>
              </MenuItem>
            )}
            
            {state.accessLevel === "branch" &&
              state.branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            {(state.accessLevel === "department") &&
              state.departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            {state.accessLevel === "unit" &&
              state.units.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))}
          </TextField>
        </Box>

        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "12px", display: "block", mb: 1 }}
          >
            Super Admin?
          </Typography>
          <TextField
            select
            fullWidth
            value={state.superAdminFilter}
            onChange={(e) => handleStateChange("superAdminFilter", e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
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
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "200px", padding: "4px 16px", position: "relative" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Who?
          </Typography>
          <TextField
            value={state.searchTerm}
            onChange={(e) => handleStateChange("searchTerm", e.target.value)}
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
                    borderBottom:
                      index < filteredNames.length - 1 ? "1px solid #777280" : "none",
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
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Access level
          </Typography>
          <MuiSelect
            value={state.accessLevel}
            onChange={(e) => {
              handleStateChange("accessLevel", e.target.value as string);
              handleStateChange("assignLevel", "");
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
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Assign Area
          </Typography>
          <MuiSelect
            value={state.assignLevel}
            onChange={(e) => {
              const newValue = e.target.value as string;
              handleStateChange("assignLevel", newValue);
              if (state.accessLevel === "unit" && state.departments.some((dept) => dept.id === newValue)) {
                // If a department is selected when accessLevel is "unit", update selectedDepartment and fetch units
                handleStateChange("selectedDepartment", newValue);
                handleStateChange("assignLevel", ""); // Reset assignLevel to force unit selection
                fetchUnits();
              }
            }}
            displayEmpty
            sx={{
              color: state.assignLevel ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Area";
              if (state.accessLevel === "branch") {
                const branch = state.branches.find((b) => b.id === selected);
                return branch ? branch.name : "Select Area";
              }
              if (state.accessLevel === "department") {
                const dept = state.departments.find((d) => d.id === selected);
                return dept ? dept.name : "Select Area";
              }
              if (state.accessLevel === "unit") {
                const unit = state.units.find((u) => u.id === selected);
                return unit ? unit.name : "Select Area";
              }
              return "Select Area";
            }}
            disabled={!state.accessLevel}
          >       

            {state.accessLevel === "branch" && loadingStates.branches && (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16}  />
                  <Typography variant="body2" >
                    Loading branches...
                  </Typography>
                </Box>
              </MenuItem>
            )}

            {state.accessLevel === "department" && loadingStates.departments && (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" >
                    Loading departments...
                  </Typography>
                </Box>
              </MenuItem>
            )}

            {state.accessLevel === "unit" && loadingStates.units && (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16}  />
                  <Typography variant="body2" >
                    Loading units...
                  </Typography>
                </Box>
              </MenuItem>
            )}

            {state.accessLevel === "branch" &&
              state.branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            {state.accessLevel === "department" &&
              state.departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            {state.accessLevel === "unit" &&
              state.units.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
                </MenuItem>
              ))}
          </MuiSelect>
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "140px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Super Admin?
          </Typography>
          <MuiSelect
            value={state.superAdminFilter}
            onChange={(e) => handleStateChange("superAdminFilter", e.target.value as string)}
            displayEmpty
            sx={{
              color: state.superAdminFilter ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => selected || "Select Option"}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
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


  // Empty state component
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
          "&:hover": {
            backgroundColor: "#363740",
            opacity: 0.9,
          },
        }}
      >
        Create New Admin
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 12, lg: 9 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
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
              <span className="text-[#F6F4FE]"> Admins</span>
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
                      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 16px", position: "relative" }}>
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
                                  borderBottom:
                                    index < filteredNames.length - 1 ? "1px solid #777280" : "none",
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
          <Grid size={{ xs: 12, md: 12, lg: 3 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
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
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.number,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      color: "#777280",
                      py: 2,
                    }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.name,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      color: "#777280",
                      py: 2,
                    }}
                  >
                    Full Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.email,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      color: "#777280",
                      py: 2,
                    }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.phone,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      color: "#777280",
                      py: 2,
                    }}
                  >
                    Phone Number
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.access,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      color: "#777280",
                      py: 2,
                    }}
                  >
                    Access Level
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.assign,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      color: "#777280",
                      py: 2,
                    }}
                  >
                    Assigned Area
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.superAdmin,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      color: "#777280",
                      py: 2,
                    }}
                  >
                    Super Admin
                  </TableCell>
                  {authData?.isSuperAdmin && (
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.actions,
                        textAlign: "center",
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        color: "#777280",
                        py: 2,
                      }}
                    >
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
                      "&:hover": {
                        backgroundColor: "#4d4d4e8e",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      },
                      transition: "all 0.2s ease",
                      mb: 2,
                    }}
                  >
                    <TableCell
                      sx={{
                        textDecoration: admin.isDeleted ? "line-through" : "none",
                        color: admin.isDeleted ? "gray" : "#F6F4FE",
                        width: columnWidths.number,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        py: 2,
                      }}
                    >
                      {(state.currentPage - 1) * 5 + index + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        textDecoration: admin.isDeleted ? "line-through" : "none",
                        color: admin.isDeleted ? "gray" : "#F6F4FE",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        py: 2,
                        flex: 1,
                      }}
                    >
                      <Box className="py-2 px-3 rounded-full bg-[#F6F4FE] text-[#160F38] font-bold text-lg mr-2">
                        {admin.name.split(" ").map((name) => name.charAt(0)).join("")}
                      </Box>
                      <Box>
                        {admin.name}
                        <br />
                        <span className="text-[13px] text-[#777280]">{admin.title || "-"}</span>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        textDecoration: admin.isDeleted ? "line-through" : "none",
                        color: admin.isDeleted ? "gray" : "#F6F4FE",
                        width: columnWidths.email,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        py: 2,
                      }}
                    >
                      <Tooltip title={admin.email || "-"} arrow>
                        <Box sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {truncateText(admin.email)}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      sx={{
                        textDecoration: admin.isDeleted ? "line-through" : "none",
                        color: admin.isDeleted ? "gray" : "#F6F4FE",
                        width: columnWidths.phone,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        py: 2,
                      }}
                    >
                      {admin.phone || "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        textDecoration: admin.isDeleted ? "line-through" : "none",
                        color: admin.isDeleted ? "gray" : "#F6F4FE",
                        width: columnWidths.access,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        py: 2,
                      }}
                    >
                      {admin.scopeLevel || "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        textDecoration: admin.isDeleted ? "line-through" : "none",
                        color: admin.isDeleted ? "gray" : "#F6F4FE",
                        width: columnWidths.assign,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        py: 2,
                      }}
                    >
                      {getAssignLevelText(admin)}
                    </TableCell>
                    <TableCell
                      sx={{
                        textDecoration: admin.isDeleted ? "line-through" : "none",
                        color: admin.isDeleted ? "gray" : "#F6F4FE",
                        width: columnWidths.superAdmin,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                        py: 2,
                      }}
                    >
                      {admin.isSuperAdmin ? "Yes" : "No"}
                    </TableCell>
                    {authData?.isSuperAdmin && (
                      <TableCell
                        sx={{
                          width: columnWidths.actions,
                          textAlign: "center",
                          fontSize: isLargeScreen ? "0.875rem" : undefined,
                          py: 2,
                          borderTopRightRadius: "8px",
                          borderBottomRightRadius: "8px",
                        }}
                      >
                        <IconButton
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
                        </IconButton>
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
          <MenuItem onClick={handleEditOpen} disabled={state.currentAdmin?.isDeleted}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => showConfirmation("suspend")}
            disabled={state.loading || state.currentAdmin?.isSuperAdmin}
          >
            {!state.currentAdmin?.isSuspended ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: "1rem" }} />
                {state.loading && state.actionType === "suspend" ? "Suspending..." : "Suspend"}
              </>
            ) : (
              <>
                <MdRefresh style={{ marginRight: 8, fontSize: "1rem" }} />
                {state.loading && state.actionType === "suspend" ? "Activating..." : "Activate"}
              </>
            )}
          </MenuItem>
          <MenuItem
            onClick={() => showConfirmation("delete")}
            disabled={state.loading || state.currentAdmin?.isSuperAdmin}
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        <Dialog open={state.editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 2,
              bgcolor: '#2C2C2C',
              color: "#F6F4FE",
            },
          }}
        >
          <ToastContainer />
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">      
              <Typography
                variant={isMobile ? "h5" : "h5"}
                component="h1"
                fontWeight={600}
                sx={{           
                  fontSize: isLargeScreen ? '1.5rem' : undefined,
                }}
              >
                Edit Admin
              </Typography>
              <IconButton onClick={handleEditClose}>
                <Close className="text-gray-300"/>
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {state.currentAdmin && (
              <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={state.editName}
                  onChange={(e) => handleStateChange("editName", e.target.value)}
                  variant="outlined"
                  sx={{
                    "& .MuiInputLabel-root": { color: "#F6F4FE", fontSize: isLargeScreen ? "0.875rem" : undefined },
                    "& .MuiOutlinedInput-root": {
                      color: "#F6F4FE",
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "#F6F4FE" },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={state.editEmail}
                  onChange={(e) => handleStateChange("editEmail", e.target.value)}
                  variant="outlined"
                  sx={{
                    "& .MuiInputLabel-root": { color: "#F6F4FE", fontSize: isLargeScreen ? "0.875rem" : undefined },
                    "& .MuiOutlinedInput-root": {
                      color: "#F6F4FE",
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "#F6F4FE" },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={state.editPhone}
                  onChange={(e) => handleStateChange("editPhone", e.target.value)}
                  variant="outlined"
                  sx={{
                    "& .MuiInputLabel-root": { color: "#F6F4FE", fontSize: isLargeScreen ? "0.875rem" : undefined },
                    "& .MuiOutlinedInput-root": {
                      color: "#F6F4FE",
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "#F6F4FE" },
                    },
                  }}
                />
                {state.currentAdmin.scopeLevel === "branch" && (
                  <FormControl fullWidth>
                    <InputLabel id="branch-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" }}>
                      Branch
                    </InputLabel>
                    <MuiSelect
                      labelId="branch-select-label"
                      id="branch-select"
                      value={state.selectedBranch}
                      label="Branch"
                      onChange={(e) => handleStateChange("selectedBranch", e.target.value as number | string)}
                      onOpen={fetchBranches}
                      sx={{
                        color: "#F6F4FE",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "& .MuiSelect-select": { color: "#F6F4FE" },
                      }}
                      renderValue={(selected) => {
                        const branch = state.branches.find((b) => b.id === selected);
                        return branch ? `${branch.name} - ${branch.address}` : "Select Branch";
                      }}
                    >
                      {state.branches.length === 0 ? (
                        <MenuItem disabled>
                          <Typography variant="body2">No branches available</Typography>
                        </MenuItem>
                      ) : (
                        state.branches.map((branch) => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {`${branch.name} - ${branch.address}`}
                          </MenuItem>
                        ))
                      )}
                    </MuiSelect>
                  </FormControl>
                )}
                {state.currentAdmin.scopeLevel === "department" && (
                  <FormControl fullWidth>
                    <InputLabel id="department-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" }}>
                      Department
                    </InputLabel>
                    <MuiSelect
                      labelId="department-select-label"
                      id="department-select"
                      value={state.selectedDepartment}
                      label="Department"
                      onChange={(e) => handleStateChange("selectedDepartment", e.target.value as string)}
                      onOpen={fetchDepartments}
                      sx={{
                        color: "#F6F4FE",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "& .MuiSelect-select": { color: "#F6F4FE" },
                      }}
                      renderValue={(selected) => {
                        const dept = state.departments.find((d) => d.id === selected);
                        return dept ? dept.name : "Select Department";
                      }}
                    >
                      {state.departments.length === 0 ? (
                        <MenuItem disabled>
                          <Typography variant="body2">No departments available</Typography>
                        </MenuItem>
                      ) : (
                        state.departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))
                      )}
                    </MuiSelect>
                  </FormControl>
                )}
                {state.currentAdmin.scopeLevel === "unit" && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel id="department-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" }}>
                        Department
                      </InputLabel>
                      <MuiSelect
                        labelId="department-select-label"
                        id="department-select"
                        value={state.selectedDepartment}
                        label="Department"
                        onChange={(e) => {
                          handleStateChange("selectedDepartment", e.target.value as string);
                          handleStateChange("selectedUnit", "");
                          fetchUnits();
                        }}
                        onOpen={fetchDepartments}
                        sx={{
                          color: "#F6F4FE",
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                          "& .MuiSelect-select": { color: "#F6F4FE" },
                        }}
                        renderValue={(selected) => {
                          const dept = state.departments.find((d) => d.id === selected);
                          return dept ? dept.name : "Select Department";
                        }}
                      >
                        {state.departments.length === 0 ? (
                          <MenuItem disabled>
                            <Typography variant="body2">No departments available</Typography>
                          </MenuItem>
                        ) : (
                          state.departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </MenuItem>
                          ))
                        )}
                      </MuiSelect>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="unit-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" }}>
                        Unit
                      </InputLabel>
                      <MuiSelect
                        labelId="unit-select-label"
                        id="unit-select"
                        value={state.selectedUnit}
                        label="Unit"
                        onChange={(e) => handleStateChange("selectedUnit", e.target.value as string)}
                        onOpen={fetchUnits}
                        sx={{
                          color: "#F6F4FE",
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                          "& .MuiSelect-select": { color: "#F6F4FE" },
                        }}
                        disabled={!state.selectedDepartment}
                      >
                        {state.units.length === 0 ? (
                          <MenuItem disabled>
                            <Typography variant="body2">No units available</Typography>
                          </MenuItem>
                        ) : (
                          state.units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </MenuItem>
                          ))
                        )}
                      </MuiSelect>
                    </FormControl>
                  </>
                )} 
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={state.isSuperAdmin}
                      onChange={(e) => handleStateChange("isSuperAdmin", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Super Admin?"
                  sx={{
                    "& .MuiTypography-root": {
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    },
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditSubmit}
              sx={{
                py: 1,
                backgroundColor: "#F6F4FE",
                px: { xs: 7, sm: 2 },
                borderRadius: 50,
                color: "#2C2C2C",
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "#F6F4FE",
                  opacity: 0.9,
                },
              }}
              variant="contained"
              disabled={state.loading}
            >
              {state.loading ? <span className="text-gray-600">Saving...</span> : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={state.confirmModalOpen}
          onClose={() => handleStateChange("confirmModalOpen", false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {state.actionType === "delete"
              ? "Delete Admin"
              : state.actionType === "suspend"
              ? state.currentAdmin?.isSuspended
                ? "Activate Admin"
                : "Suspend Admin"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {state.actionType === "delete"
                ? `Are you sure you want to delete "${state.currentAdmin?.name}"?`
                : `Are you sure you want to ${state.currentAdmin?.isSuspended ? "activate" : "suspend"} "${
                    state.currentAdmin?.name
                  }"?`}
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
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
              color={state.actionType === "delete" ? "error" : "primary"}
              variant="contained"
              disabled={state.loading || state.currentAdmin?.isSuperAdmin}
            >
              {state.loading ? "Processing..." : state.actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>

        <AdminModal open={state.openModal} onClose={handleCloseModal} />
      </Box>
    </DashboardManager>
  );
};

export default ViewAdmins;