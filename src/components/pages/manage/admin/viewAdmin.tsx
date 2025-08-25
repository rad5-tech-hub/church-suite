import React, { useEffect, useState, useCallback } from "react";
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
  FormControl,
  InputLabel,
  Select as MuiSelect,
  FormControlLabel,
  Checkbox,
  TextField,
  Drawer,
  CircularProgress,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Search,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
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
}

// Custom Pagination Component
interface CustomPaginationProps {
  count: number;
  rowsPerPage: number;
  page: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLargeScreen: boolean;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  count,
  rowsPerPage,
  page,
  onPageChange,
  isLargeScreen,
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

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
          {`${page * rowsPerPage + 1}–${Math.min(
            (page + 1) * rowsPerPage,
            count
          )} of ${count}`}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          onClick={() => onPageChange(null, page - 1)}
          disabled={isFirstPage}
          sx={{
            minWidth: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: isFirstPage ? "#4d4d4e8e" : "#F6F4FE",
            color: isFirstPage ? "#777280" : "#160F38",
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
          onClick={() => onPageChange(null, page + 1)}
          disabled={isLastPage}
          sx={{
            minWidth: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: isLastPage ? "#4d4d4e8e" : "#F6F4FE",
            color: isLastPage ? "#777280" : "#160F38",
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

  const [state, setState] = useState({
    openModal: false,
    admins: [] as Admin[],
    loading: false,
    error: null as string | null,
    editModalOpen: false,
    confirmModalOpen: false,
    currentAdmin: null as Admin | null,
    actionType: null as string | null,
    anchorEl: null as HTMLElement | null,
    branches: [] as Branch[],
    departments: [] as Department[],
    units: [] as Unit[],
    isSuperAdmin: false,
    selectedBranch: "" as number | string,
    selectedDepartment: "" as string,
    selectedUnit: "" as string,
    page: 0,
    rowsPerPage: 5,
    isDrawerOpen: false,
    searchTerm: "",
    accessLevel: "",
    assignLevel: "",
    superAdminFilter: "",
    isSearching: false,
    searchError: null as string | null,
  });

  const columnWidths = {
    number: "2%",
    name: "21%",
    email: "15%",
    access: "14%",
    assign: "14%",
    phone: "14%",
    superAdmin: "10%",
    actions: "10%",
  };

  // Fetch branches, departments, and units for assignLevel dropdown
  const fetchBranches = useCallback(async () => {
    try {
      const response = await Api.get("/church/get-branches");
      setState((prev) => ({ ...prev, branches: response.data.branches || [] }));
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches");
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await Api.get("/church/get-departments");
      setState((prev) => ({ ...prev, departments: response.data.departments || [] }));
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    if (!state.selectedDepartment) return;
    try {
      const response = await Api.get(`/church/a-department/${state.selectedDepartment}`);
      setState((prev) => ({ ...prev, units: response.data.department.units || [] }));
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to load units");
    }
  }, [state.selectedDepartment]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [adminsRes, branchesRes, departmentsRes] = await Promise.all([
        Api.get("/church/view-admins"),
        Api.get("/church/get-branches"),
        Api.get("/church/get-departments"),
      ]);
      setState((prev) => ({
        ...prev,
        admins: adminsRes.data.admins || [],
        branches: branchesRes.data.branches || [],
        departments: departmentsRes.data.departments || [],
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      setState((prev) => ({ ...prev, error: "Failed to load admins. Please try again later." }));
      toast.error("Failed to load admins");
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle search
  const handleSearch = async () => {
    setState((prev) => ({ ...prev, isSearching: true, searchError: null }));
    try {
      const params: { [key: string]: string } = {};
      if (state.searchTerm) params.name = state.searchTerm;
      if (state.accessLevel) params.scopeLevel = state.accessLevel.toLowerCase();
      if (state.assignLevel && state.accessLevel === "branch") params.branchId = state.assignLevel;
      if (state.assignLevel && state.accessLevel === "department") params.departmentIds = state.assignLevel;
      if (state.assignLevel && state.accessLevel === "unit") params.unitIds = state.assignLevel;
      if (state.superAdminFilter) params.isSuperAdmin = state.superAdminFilter === "Yes" ? "true" : "false";

      const response = await Api.get("/church/view-admins", { params });
      setState((prev) => ({
        ...prev,
        admins: response.data.admins || [],
      }));
      toast.success("Search completed successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error: any) {
      console.error("Error searching admins:", error);
      setState((prev) => ({
        ...prev,
        searchError: error.response?.data.error.message || "Failed to search admins",
      }));
      toast.error(error.response?.data.error.message || "Failed to search admins", {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setState((prev) => ({ ...prev, isSearching: false, isDrawerOpen: false }));
    }
  };

  // Handlers
  const handleStateChange = (key: keyof typeof state, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, admin: Admin) => {
    handleStateChange("anchorEl", event.currentTarget);
    handleStateChange("currentAdmin", admin);
    handleStateChange("isSuperAdmin", admin.isSuperAdmin);
    handleStateChange("selectedBranch", admin.branchId || "");
    handleStateChange("selectedDepartment", admin.departmentIds?.[0] || "");
    handleStateChange("selectedUnit", admin.unitIds?.[0] || "");
  };

  const handleMenuClose = () => handleStateChange("anchorEl", null);

  const handleEditOpen = () => {
    if (state.currentAdmin) {
      handleStateChange("editModalOpen", true);
    }
    handleMenuClose();
  };

  const handleEditClose = () => {
    handleStateChange("editModalOpen", false);
    handleStateChange("currentAdmin", null);
    handleStateChange("selectedBranch", "");
    handleStateChange("selectedDepartment", "");
    handleStateChange("selectedUnit", "");
    handleStateChange("isSuperAdmin", false);
  };

  const handleCloseModal = () => {
    handleStateChange("openModal", false);
    fetchData();
  };

  const showConfirmation = (action: string) => {
    handleStateChange("actionType", action);
    handleStateChange("confirmModalOpen", true);
    handleMenuClose();
  };

  const handleEditSubmit = async () => {
    if (!state.currentAdmin?.id) {
      console.error("Admin ID is undefined");
      toast.error("Invalid admin data");
      return;
    }

    try {
      handleStateChange("loading", true);
      const payload: { isSuperAdmin: boolean; branchId?: string; departmentIds?: string[]; unitIds?: string[] } = {
        isSuperAdmin: state.isSuperAdmin,
      };
      if (state.currentAdmin.scopeLevel === "branch" && state.selectedBranch) {
        payload.branchId = state.selectedBranch.toString();
      }
      if (state.currentAdmin.scopeLevel === "department") payload.departmentIds = state.selectedDepartment ? [state.selectedDepartment] : [];
      if (state.currentAdmin.scopeLevel === "unit") payload.unitIds = state.selectedUnit ? [state.selectedUnit] : [];

      await Api.patch(`/church/edit-admin?id=${state.currentAdmin.id}`, payload);

      setState((prev) => ({
        ...prev,
        admins: prev.admins.map((admin) =>
          admin.id === state.currentAdmin?.id
            ? {
                ...admin,
                isSuperAdmin: state.isSuperAdmin,
                branchId: state.currentAdmin.scopeLevel === "branch" ? state.selectedBranch : admin.branchId,
                departmentIds:
                  state.currentAdmin.scopeLevel === "department"
                    ? state.selectedDepartment
                      ? [state.selectedDepartment]
                      : []
                    : admin.departmentIds,
                unitIds:
                  state.currentAdmin.scopeLevel === "unit"
                    ? state.selectedUnit
                      ? [state.selectedUnit]
                      : []
                    : admin.unitIds,
              }
            : admin
        ),
      }));

      toast.success("Admin updated successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update admin", {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      handleStateChange("loading", false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!state.currentAdmin || !state.actionType) return;

    try {
      handleStateChange("loading", true);
      if (state.actionType === "delete") {
        await Api.delete(`/church/delete-admin/${state.currentAdmin.id}`);
        setState((prev) => ({
          ...prev,
          admins: prev.admins.filter((admin) => admin.id !== state.currentAdmin?.id),
        }));
        toast.success("Admin deleted successfully!", {
          position: isMobile ? "top-center" : "top-right",
        });
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentAdmin.isSuspended;
        await Api.patch(`/church/${newStatus ? "suspend" : "activate"}-admin/${state.currentAdmin.id}`);
        setState((prev) => ({
          ...prev,
          admins: prev.admins.map((admin) =>
            admin.id === state.currentAdmin?.id ? { ...admin, isSuspended: newStatus } : admin
          ),
        }));
        toast.success(`Admin ${newStatus ? "suspended" : "activated"} successfully!`, {
          position: isMobile ? "top-center" : "top-right",
        });
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${state.actionType} admin`, {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      handleStateChange("loading", false);
      handleStateChange("confirmModalOpen", false);
      handleStateChange("actionType", null);
      handleStateChange("currentAdmin", null);
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => handleStateChange("page", newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleStateChange("rowsPerPage", parseInt(event.target.value, 10));
    handleStateChange("page", 0);
  };

  // Helper functions
  const truncateText = (text: string | null | undefined, maxLength = 30) => {
    if (!text) return "-";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

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
    return "-";
  };

  // Filter admins based on search criteria
  const filteredAdmins = state.admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      admin.title?.toLowerCase().includes(state.searchTerm.toLowerCase());
    const matchesAccess = !state.accessLevel || admin.scopeLevel === state.accessLevel.toLowerCase();
    const matchesAssign =
      !state.assignLevel ||
      (state.accessLevel === "branch" && admin.branchId === state.assignLevel) ||
      (state.accessLevel === "department" && admin.departmentIds?.includes(state.assignLevel)) ||
      (state.accessLevel === "unit" && admin.unitIds?.includes(state.assignLevel));
    const matchesSuperAdmin =
      !state.superAdminFilter ||
      (state.superAdminFilter === "Yes" && admin.isSuperAdmin) ||
      (state.superAdminFilter === "No" && !admin.isSuperAdmin);

    return matchesSearch && matchesAccess && matchesAssign && matchesSuperAdmin;
  });

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

  // Filter components
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
          <TextField
            fullWidth
            placeholder="Enter name to search"
            value={state.searchTerm}
            onChange={(e) => handleStateChange("searchTerm", e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": {
                color: "#F6F4FE",
                "& fieldset": { borderColor: "transparent" },
                "& input::placeholder": { color: "#777280", opacity: 1 },
              },
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
              if (e.target.value === "department") fetchDepartments();
              if (e.target.value === "unit") fetchDepartments();
            }}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiOutlinedInput-root": { color: "#F6F4FE", "& fieldset": { borderColor: "transparent" } },
            }}
          >
            <MenuItem value="">All</MenuItem>
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
            Assign level
          </Typography>
          <TextField
            select
            fullWidth
            value={state.assignLevel}
            onChange={(e) => {
              handleStateChange("assignLevel", e.target.value);
              if (state.accessLevel === "unit") {
                handleStateChange("selectedDepartment", e.target.value);
                fetchUnits();
              }
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
            <MenuItem value="">All</MenuItem>
            {state.accessLevel === "branch" &&
              state.branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.name}>
                  {branch.name}
                </MenuItem>
              ))}
            {(state.accessLevel === "department" || state.accessLevel === "unit") &&
              state.departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.name}>
                  {dept.name}
                </MenuItem>
              ))}
            {state.accessLevel === "unit" &&
              state.units.map((unit) => (
                <MenuItem key={unit.id} value={unit.name}>
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
          // gap: "8px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "200px", padding: "4px 16px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Who?
          </Typography>
          <TextField
            variant="standard"
            placeholder="Search by name or title"
            value={state.searchTerm}
            onChange={(e) => handleStateChange("searchTerm", e.target.value)}
            sx={{
              color: "#F6F4FE",
              "& .MuiInputBase-input": { color: "#F6F4FE", fontWeight: 500, fontSize: "14px", py: "4px" },
              flex: 1,
            }}
            InputProps={{ disableUnderline: true }}
          />
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Access level
          </Typography>
          <MuiSelect
            value={state.accessLevel}
            onChange={(e) => {
              handleStateChange("accessLevel", e.target.value);
              handleStateChange("assignLevel", "");
              if (e.target.value === "branch") fetchBranches();
              if (e.target.value === "department") fetchDepartments();
              if (e.target.value === "unit") fetchDepartments();
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
            <MenuItem value="">All</MenuItem>
            <MenuItem value="branch">Branch</MenuItem>
            <MenuItem value="department">Department</MenuItem>
            <MenuItem value="unit">Unit</MenuItem>
          </MuiSelect>
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Assign level
          </Typography>
          <MuiSelect
            value={state.assignLevel}
            onChange={(e) => {
              handleStateChange("assignLevel", e.target.value);
              if (state.accessLevel === "unit") {
                handleStateChange("selectedDepartment", e.target.value);
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
            renderValue={(selected) => selected || "Select Area"}
            disabled={!state.accessLevel}
          >
            <MenuItem value="">All</MenuItem>
            {state.accessLevel === "branch" &&
              state.branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            {(state.accessLevel === "department" || state.accessLevel === "unit") &&
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
            onChange={(e) => handleStateChange("superAdminFilter", e.target.value)}
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
                      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 16px" }}>
                        <TextField
                          variant="standard"
                          placeholder="Search by name"
                          value={state.searchTerm}
                          onChange={(e) => handleStateChange("searchTerm", e.target.value)}
                          sx={{
                            border: "none",
                            color: "#F6F4FE",
                            "& .MuiInputBase-input": {
                              color: "#F6F4FE",
                              fontWeight: 500,
                              fontSize: "14px",
                              py: "4px",
                            },
                            width: "100%",
                          }}
                          InputProps={{ disableUnderline: true }}
                        />
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

        {!state.loading && !state.error && filteredAdmins.length === 0 && <EmptyState />}

        {filteredAdmins.length > 0 && (
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
                {filteredAdmins
                  .slice(state.page * state.rowsPerPage, state.page * state.rowsPerPage + state.rowsPerPage)
                  .map((admin, index) => (
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
                        {(index + 1).toString().padStart(2, "0")}
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
              count={filteredAdmins.length}
              rowsPerPage={state.rowsPerPage}
              page={state.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              isLargeScreen={isLargeScreen}
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

        <Dialog open={state.editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>Edit Admin</DialogTitle>
          <DialogContent>
            {state.currentAdmin && (
              <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {state.currentAdmin.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {state.currentAdmin.email}
                </Typography>
                {state.currentAdmin.scopeLevel === "branch" && (
                  <FormControl fullWidth>
                    <InputLabel id="branch-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Branch
                    </InputLabel>
                    <MuiSelect
                      labelId="branch-select-label"
                      id="branch-select"
                      value={state.selectedBranch}
                      label="Branch"
                      onChange={(e) => handleStateChange("selectedBranch", e.target.value)}
                      onOpen={fetchBranches}
                      sx={{
                        "& .MuiSelect-select": {
                          fontSize: isLargeScreen ? "0.875rem" : undefined,
                        },
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
                    <InputLabel id="department-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Department
                    </InputLabel>
                    <MuiSelect
                      labelId="department-select-label"
                      id="department-select"
                      value={state.selectedDepartment}
                      label="Department"
                      onChange={(e) => handleStateChange("selectedDepartment", e.target.value)}
                      onOpen={fetchDepartments}
                      sx={{
                        "& .MuiSelect-select": {
                          fontSize: isLargeScreen ? "0.875rem" : undefined,
                        },
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
                      <InputLabel id="department-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                        Department
                      </InputLabel>
                      <MuiSelect
                        labelId="department-select-label"
                        id="department-select"
                        value={state.selectedDepartment}
                        label="Department"
                        onChange={(e) => {
                          handleStateChange("selectedDepartment", e.target.value);
                          handleStateChange("selectedUnit", "");
                          fetchUnits();
                        }}
                        onOpen={fetchDepartments}
                        sx={{
                          "& .MuiSelect-select": {
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                          },
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
                      <InputLabel id="unit-select-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                        Unit
                      </InputLabel>
                      <MuiSelect
                        labelId="unit-select-label"
                        id="unit-select"
                        value={state.selectedUnit}
                        label="Unit"
                        onChange={(e) => handleStateChange("selectedUnit", e.target.value)}
                        onOpen={fetchUnits}
                        sx={{
                          "& .MuiSelect-select": {
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                          },
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
              onClick={handleEditClose}
              sx={{
                border: 1,
                color: "var(--color-primary)",
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              sx={{
                backgroundColor: "#777280",
                color: "#F6F4FE",
                "&:hover": {
                  backgroundColor: "#777280",
                  opacity: 0.9,
                },
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
              variant="contained"
              disabled={state.loading}
            >
              {state.loading ? "Saving..." : "Save Changes"}
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