import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Menu,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
  CircularProgress,
  Autocomplete,
  Drawer,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Close,
  AttachFileOutlined,
} from "@mui/icons-material";
import { PiChurch } from "react-icons/pi";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import DashboardManager from "../../../shared/dashboardManager";
import DepartmentModal from "./department";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

interface Department {
  id: string;
  name: string;
  description: string | null;
  type: "Department" | "Outreach";
  isActive: boolean;
  isDeleted?: boolean;
  branch?: { name: string; id: string };
}

interface Pagination {
  hasNextPage: boolean;
  nextCursor: string | null;
  nextPage: string | null;
}

interface FetchDepartmentsResponse {
  message?: string;
  pagination: Pagination;
  departments: Department[];
}

interface AuthData {
  isHeadquarter?: boolean;
  isSuperAdmin?: boolean;
}

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading: boolean;
}

interface Branch {
  id: string;
  name: string;
}

interface State {
  departments: Department[];
  filteredDepartments: Department[];
  pagination: Pagination;
  currentPage: number;
  pageHistory: string[];
  loading: boolean;
  error: string | null;
  isSearching: boolean;
  editModalOpen: boolean;
  confirmModalOpen: boolean;
  isModalOpen: boolean;
  currentDepartment: Department | null;
  actionType: "delete" | "suspend" | null;
  anchorEl: HTMLElement | null;
  editFormData: Omit<Department, "id">;
  searchTerm: string;
  nameError: string | null;
  typeFilter: "" | "Department" | "Outreach";
  branches: Branch[];
  selectedBranchId: string;
  searchDrawerOpen: boolean;
}

// Type guard for FetchDepartmentsResponse
const isFetchDepartmentsResponse = (data: unknown): data is FetchDepartmentsResponse => {
  if (!data || typeof data !== "object") {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if ("message" in obj && typeof obj.message !== "string") {
    return false;
  }
  if (!("departments" in obj) || !Array.isArray(obj.departments)) {
    return false;
  }
  if (!("pagination" in obj) || typeof obj.pagination !== "object" || obj.pagination === null) {
    return false;
  }
  const pagination = obj.pagination as Record<string, unknown>;
  return (
    "hasNextPage" in pagination &&
    typeof pagination.hasNextPage === "boolean" &&
    "nextCursor" in pagination &&
    (typeof pagination.nextCursor === "string" || pagination.nextCursor === null) &&
    "nextPage" in pagination &&
    (typeof pagination.nextPage === "string" || pagination.nextPage === null)
  );
};

// Custom Pagination Component
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

// Empty State Component
const EmptyState: React.FC<{ error: string | null; openModal: () => void; isLargeScreen: boolean }> = ({
  openModal,
  isLargeScreen,
}) => (
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
      No departments Yet
    </Typography>
    <Button
      variant="contained"
      onClick={openModal}
      sx={{
        backgroundColor: "#363740",
        px: { xs: 2, sm: 2 },
        py: 1,
        mt: 2,
        fontWeight: 500,
        textTransform: "none",
        color: "var(--color-text-on-primary)",
        fontSize: isLargeScreen ? "1rem" : undefined,
        "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
      }}
      aria-label="Create new department"
    >
      Create New Department
    </Button>
  </Box>
);

const ViewDepartment: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData as AuthData | undefined);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [state, setState] = useState<State>({
    departments: [],
    filteredDepartments: [],
    pagination: { hasNextPage: false, nextCursor: null, nextPage: null },
    currentPage: 1,
    pageHistory: [],
    loading: false,
    error: null,
    isSearching: false,
    editModalOpen: false,
    confirmModalOpen: false,
    isModalOpen: false,
    currentDepartment: null,
    actionType: null,
    anchorEl: null,
    editFormData: { name: "", description: "", type: "Department", isActive: true },
    searchTerm: "",
    nameError: null,
    typeFilter: "",
    branches: [],
    selectedBranchId: "",
    searchDrawerOpen: false,
  });

  const handleStateChange = useCallback(
    <K extends keyof State>(key: K, value: State[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Fetch departments with server-side pagination
  const fetchDepartments = useCallback(
    async (url: string | null = "/church/get-departments"): Promise<FetchDepartmentsResponse> => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const apiUrl = url || "/church/get-departments";
        const response = await Api.get<FetchDepartmentsResponse>(apiUrl);
        const data: unknown = response.data;
        if (!isFetchDepartmentsResponse(data)) {
          throw new Error("Invalid response structure");
        }
        handleStateChange("loading", false);
        return data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to load departments. Please try again later.";
        console.error("Failed to fetch departments:", error);
        handleStateChange("loading", false);
        toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
        throw error;
      }
    },
    [handleStateChange, isMobile]
  );

  const fetchBranches = useCallback(async () => {
    try {
      const response = await Api.get<{ branches: Branch[] }>("/church/get-branches");
      const data = response.data;
      if (!Array.isArray(data.branches)) throw new Error("Invalid branch response");
      setState((prev) => ({
        ...prev,
        branches: data.branches,
      }));
    } catch (error: any) {
      console.error("Failed to fetch branches:", error);
    }
  }, [isMobile]);

  // Debounced search function
  const searchDepartments = useCallback(
    async (
      searchTerm: string,
      branchId?: string | null,
      _typeFilter?: string | null
    ) => {
      handleStateChange("isSearching", true);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        params.append("searchField", "name");            
        if (branchId && branchId !== "HeadQuarter") {
          params.append("branchId", branchId);
        }

        // Fetch data from API
        const response = await Api.get<FetchDepartmentsResponse>(
          `/church/get-departments?${params.toString()}`
        );
        const data = response.data;

        // Validate response
        if (!isFetchDepartmentsResponse(data)) {
          throw new Error("Invalid response structure");
        }

        // Update state
        setState((prev) => ({
          ...prev,
          filteredDepartments: data.departments,
          pagination: data.pagination,
          isSearching: false,
          currentPage: 1,
          pageHistory: [],
        }));
      } catch (error) {
        console.error("Error searching departments:", error);        

        setState((prev) => ({ ...prev, isSearching: false }));
      }
    },
    [handleStateChange, isMobile]
  );

  const handleSearchClick = useCallback(() => {
    searchDepartments(state.searchTerm, state.selectedBranchId, state.typeFilter);
  }, [state.searchTerm, state.selectedBranchId, state.typeFilter, searchDepartments]);

  const refreshDepartments = useCallback(async () => {
    try {
      const data = await fetchDepartments();
      setState((prev) => ({
        ...prev,
        departments: data.departments,
        filteredDepartments: data.departments,
        pagination: data.pagination,
        currentPage: 1,
        pageHistory: [],
        loading: false,
      }));
    } catch (error) {
      handleStateChange("loading", false);
    }
  }, [fetchDepartments, handleStateChange]);

  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const url =
          direction === "next"
            ? state.pagination.nextPage
            : state.pageHistory.length > 0
            ? state.pageHistory[state.pageHistory.length - 2] || "/church/get-departments"
            : null;
        if (!url) throw new Error(direction === "next" ? "No next page available" : "No previous page available");
        const data = await fetchDepartments(url);
        setState((prev) => ({
          ...prev,
          filteredDepartments: data.departments,
          pagination: data.pagination,
          pageHistory: direction === "next" ? [...prev.pageHistory, url] : prev.pageHistory.slice(0, -1),
          currentPage: direction === "next" ? prev.currentPage + 1 : prev.currentPage - 1,
          loading: false,
        }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to load page";
        console.error(`Error fetching ${direction} page:`, error);
        handleStateChange("error", errorMessage);
        handleStateChange("loading", false);
        toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
      }
    },
    [state.pagination.nextPage, state.pageHistory, fetchDepartments, handleStateChange, isMobile]
  );

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [deptData] = await Promise.all([fetchDepartments(), fetchBranches()]);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            departments: deptData.departments,
            filteredDepartments: deptData.departments,
            pagination: deptData.pagination,
            currentPage: 1,
            pageHistory: [],
            loading: false,
          }));
        }
      } catch {
        if (isMounted) handleStateChange("loading", false);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [fetchDepartments, fetchBranches, handleStateChange]);

  const handleBranchChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      handleStateChange("selectedBranchId", e.target.value);
      // Don't call searchDepartments here
    },
    [handleStateChange]
  );

  const handleTypeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      handleStateChange("typeFilter", e.target.value as "" | "Department" | "Outreach");
      // Don't call searchDepartments here
    },
    [handleStateChange]
  );

  const handleEditOpen = useCallback(() => {
    if (state.currentDepartment) {
      handleStateChange("editFormData", {
        name: state.currentDepartment.name,
        description: state.currentDepartment.description || "",
        type: state.currentDepartment.type,
        isActive: state.currentDepartment.isActive,
      });
      handleStateChange("editModalOpen", true);
      handleStateChange("nameError", null);
    }
    handleStateChange("anchorEl", null);
  }, [state.currentDepartment, handleStateChange]);

  const showConfirmation = useCallback(
    (action: "delete" | "suspend") => {
      handleStateChange("actionType", action);
      handleStateChange("confirmModalOpen", true);
      handleStateChange("anchorEl", null);
    },
    [handleStateChange]
  );

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      handleStateChange("editFormData", { ...state.editFormData, [name]: value });
      if (name === "name") {
        handleStateChange("nameError", value.trim() ? null : "Department name is required");
      }
    },
    [state.editFormData, handleStateChange]
  );

  const handleEditTypeChange = useCallback(
    (e: SelectChangeEvent<"Department" | "Outreach">) => {
      handleStateChange("editFormData", { ...state.editFormData, type: e.target.value as "Department" | "Outreach" });
    },
    [state.editFormData, handleStateChange]
  );

  const handleEditSubmit = useCallback(async () => {
    if (!state.currentDepartment?.id) {
      toast.error("Invalid department data", { position: isMobile ? "top-center" : "top-right" });
      return;
    }
    if (!state.editFormData.name.trim()) {
      handleStateChange("nameError", "Department name is required");
      return;
    }
    try {
      handleStateChange("loading", true);
      await Api.patch(`/church/edit-dept/${state.currentDepartment.id}`, {
        ...state.editFormData,
        description: state.editFormData.description || null,
      });
      setState((prev) => ({
        ...prev,
        departments: prev.departments.map((dept) =>
          dept.id === prev.currentDepartment!.id ? { ...dept, ...prev.editFormData } : dept
        ),
        filteredDepartments: prev.filteredDepartments.map((dept) =>
          dept.id === prev.currentDepartment!.id ? { ...dept, ...prev.editFormData } : dept
        ),
      }));
      toast.success("Department updated successfully!", { position: isMobile ? "top-center" : "top-right" });
      handleStateChange("editModalOpen", false);
      handleStateChange("currentDepartment", null);
      handleStateChange("nameError", null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update department";
      console.error("Update error:", error);
      toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
    } finally {
      handleStateChange("loading", false);
    }
  }, [state.currentDepartment, state.editFormData, handleStateChange, isMobile]);

  const handleConfirmedAction = useCallback(async () => {
    if (!state.currentDepartment || !state.actionType) return;
    try {
      handleStateChange("loading", true);
      if (state.actionType === "delete") {
        await Api.delete(`/church/delete-dept/${state.currentDepartment.id}`);
        setState((prev) => ({
          ...prev,
          departments: prev.departments.filter((dept) => dept.id !== prev.currentDepartment!.id),
          filteredDepartments: prev.filteredDepartments.filter((dept) => dept.id !== prev.currentDepartment!.id),
          pagination: { ...prev.pagination, hasNextPage: prev.filteredDepartments.length > 1 },
          pageHistory: prev.currentPage > 1 ? prev.pageHistory.slice(0, -1) : prev.pageHistory,
          currentPage: prev.currentPage > 1 && prev.filteredDepartments.length === 1 ? prev.currentPage - 1 : prev.currentPage,
        }));
        toast.success("Department deleted successfully!", { position: isMobile ? "top-center" : "top-right" });
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentDepartment.isActive;
        await Api.patch(`/church/suspend-dept/${state.currentDepartment.id}`, { isActive: newStatus });
        setState((prev) => ({
          ...prev,
          departments: prev.departments.map((dept) =>
            dept.id === prev.currentDepartment!.id ? { ...dept, isActive: newStatus } : dept
          ),
          filteredDepartments: prev.filteredDepartments.map((dept) =>
            dept.id === prev.currentDepartment!.id ? { ...dept, isActive: newStatus } : dept
          ),
        }));
        toast.success(`Department ${newStatus ? "activated" : "suspended"} successfully!`, {
          position: isMobile ? "top-center" : "top-right",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${state.actionType} department`;
      console.error("Action error:", error);
      toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
    } finally {
      handleStateChange("loading", false);
      handleStateChange("confirmModalOpen", false);
      handleStateChange("actionType", null);
      handleStateChange("currentDepartment", null);
    }
  }, [state.currentDepartment, state.actionType, handleStateChange, isMobile]);

  return (
    <DashboardManager>
      <ToastContainer />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5, alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 9 }}>
            <Typography
              variant={isMobile ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.1rem" : undefined,
                display: "flex",
                alignItems: "center",
                marginBottom: 2,
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Department</span>
            </Typography>            
              <Box
                sx={{
                  border: "1px solid #4d4d4e8e",
                  borderRadius: "32px",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#4d4d4e8e",                 
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
                    padding: "4px 16px",
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
                    Name
                  </Typography>

                  <Autocomplete
                    freeSolo
                    options={state.departments.map((dept) => dept.name)} // 🔹 all department names
                    value={state.searchTerm}
                    onInputChange={(_e, value) => {
                      handleStateChange("searchTerm", value);
                    }}
                    filterOptions={(options, { inputValue }) =>
                      options.filter((option) =>
                        option.toLowerCase().includes(inputValue.toLowerCase())
                      )
                    } // 🔹 client-side filtering
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search by name"
                        variant="standard"
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: {
                            color: "#F6F4FE",
                            fontSize: "14px",
                            padding: "4px 8px",
                            backgroundColor: "transparent",
                          },
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": { border: "none" },
                        }}
                      />
                    )}
                    sx={{ flex: 1, minWidth: 200 }}
                    aria-label="Search departments by name"
                  />
                </Box>

                <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                {isMobile && (
                  <IconButton sx={{color: '#F6F4FE'}} onClick={() => handleStateChange("searchDrawerOpen", true)}>
                    <AttachFileOutlined/>
                  </IconButton>
                )}
                {!isMobile && (
                  <>
                    <Box sx={{ display: "flex", flexDirection: "column", minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                      >
                        Branch
                      </Typography>
                      <FormControl fullWidth>
                        <Select
                          value={state.selectedBranchId}
                          onChange={handleBranchChange}
                          displayEmpty
                          sx={{
                            color: state.selectedBranchId ? "#F6F4FE" : "#777280",
                            fontWeight: 500,
                            fontSize: "14px",
                            border: "none",
                            ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                            ".MuiOutlinedInput-notchedOutline": { border: "#777280" },
                            "& .MuiSelect-icon": { display: "none" },
                          }}
                            renderValue={(selected) =>
                            selected === "HeadQuarter"
                              ? "HeadQuarter"
                              : state.branches.find((branch) => branch.id === selected)?.name || "HeadQuarter"
                          }
                        >
                          {/* HeadQuarter option */}
                          <MenuItem value="HeadQuarter">HeadQuarter</MenuItem>                        
                          {state.branches.map((branch) => (
                            <MenuItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                    <Box sx={{ display: "flex", flexDirection: "column", minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                      >
                        Type
                      </Typography>
                      <Select
                        value={state.typeFilter}
                        onChange={handleTypeChange}
                        displayEmpty
                        sx={{
                          color: state.typeFilter ? "#F6F4FE" : "#777280",
                          fontWeight: 500,
                          fontSize: "14px",
                          ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                          ".MuiOutlinedInput-notchedOutline": { border: "none" },
                          "& .MuiSelect-icon": { display: "none" },
                        }}
                        renderValue={(selected) => (selected ? selected : "Select Type")}
                        aria-label="Filter departments by type"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Department">Department</MenuItem>
                        <MenuItem value="Outreach">Outreach</MenuItem>
                      </Select>
                    </Box>
                  </>
                )}
                <Box sx={{ display: "flex", gap: "8px", pr: "8px" }}>
                  <Button
                    onClick={handleSearchClick}
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
                    disabled={state.loading || state.isSearching}
                    aria-label="Search departments"
                  >
                    {state.isSearching ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SearchIcon sx={{ fontSize: "20px" }} />
                    )}
                  </Button>
                </Box>
              </Box>            
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <Button
              variant="contained"
              onClick={() => handleStateChange("isModalOpen", true)}
              sx={{
                backgroundColor: "#363740",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
                ml: isMobile ? 2 : 0,
              }}
              disabled={!authData?.isSuperAdmin}
              aria-label="Create new department"
            >
              Create Department +
            </Button>
          </Grid>
        </Grid>

        {/* Search Drawer for Mobile */}
        <Drawer
          anchor="top"
          open={state.searchDrawerOpen}
          onClose={() => handleStateChange("searchDrawerOpen", false)}
          sx={{
            "& .MuiDrawer-paper": {
              backgroundColor: "#2C2C2C",
              color: "#F6F4FE",
              padding: 2,
              borderRadius: "0 0 16px 16px",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton
              onClick={() => handleStateChange("searchDrawerOpen", false)}
              aria-label="Close search drawer"
            >
              <Close sx={{ color: "#F6F4FE" }} />
            </IconButton>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}
            >
              Name
            </Typography>
            <Autocomplete
              freeSolo
              options={state.departments.map((dept) => dept.name)}
              value={state.searchTerm}
              onInputChange={(_e, value) => {
                handleStateChange("searchTerm", value);

                if (value.trim()) {
                  searchDepartments(value, state.selectedBranchId, state.typeFilter);
                }
              }}
              filterOptions={(options, { inputValue }) =>
                options.filter((option) =>
                  option.toLowerCase().includes(inputValue.toLowerCase())
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by name"
                  size="small"  
                  variant="outlined" // ✅ outlined for border
                  InputProps={{
                    ...params.InputProps,
                    sx: {
                      color: "#F6F4FE",
                      fontSize: "14px",
                      padding: "4px 8px",
                      backgroundColor: "transparent",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#777280", // ✅ default border
                      },
                      "&:hover fieldset": {
                        borderColor: "#F6F4FE", // ✅ hover state
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#4B8DF8", // ✅ focus state
                      },
                    },
                  }}
                />
              )}
              sx={{ flex: 1, minWidth: 200 }}
              aria-label="Search departments by name"
            />
            <Typography
              variant="caption"
              sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}
            >
              Branch
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={state.selectedBranchId}
                onChange={handleBranchChange}
                displayEmpty
                sx={{
                  color: state.selectedBranchId ? "#F6F4FE" : "#777280",
                  fontWeight: 500,
                  fontSize: "14px",
                  ".MuiSelect-select": { padding: "8px" },
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                }}
                  renderValue={(selected) =>
                  selected === "HeadQuarter"
                    ? "HeadQuarter"
                    : state.branches.find((branch) => branch.id === selected)?.name || "HeadQuarter"
                }
              >
                {/* HeadQuarter option */}
                <MenuItem value="HeadQuarter">HeadQuarter</MenuItem>                        
                {state.branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="caption"
              sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}
            >
              Type
            </Typography>
            <FormControl fullWidth>
              <Select
                value={state.typeFilter}
                onChange={handleTypeChange}
                displayEmpty
                sx={{
                  color: state.typeFilter ? "#F6F4FE" : "#777280",
                  fontWeight: 500,
                  fontSize: "14px",
                  ".MuiSelect-select": { padding: "8px" },
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                }}
                renderValue={(selected) => (selected ? selected : "Select Type")}
                aria-label="Filter departments by type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Department">Department</MenuItem>
                <MenuItem value="Outreach">Outreach</MenuItem>
              </Select>
            </FormControl>
            <Button
              onClick={handleSearchClick}
              sx={{
                mt: 2,
                backgroundColor: "#F6F4FE",
                color: "#2C2C2C",
                borderRadius: 50,
                width: "100%",
                py: 1,
                "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
              }}
              disabled={state.loading || state.isSearching}
              aria-label="Search departments"
            >
              {state.isSearching ? <CircularProgress size={20} color="inherit" /> : "Search"}
            </Button>
          </Box>
        </Drawer>

        {/* Loading State */}
        {state.loading && state.filteredDepartments.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {/* Error or Empty State */}
        {(!state.loading || state.error) && state.filteredDepartments.length === 0 && (
          <EmptyState error={state.error} openModal={() => handleStateChange("isModalOpen", true)} isLargeScreen={isLargeScreen} />
        )}

        {/* Data Cards */}
        {state.filteredDepartments.length > 0 && (
          <>
            <Grid container spacing={2}>
              {state.filteredDepartments.map((dept) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={dept.id}>
                  <Card
                    component="div"
                    sx={{
                      borderRadius: "10.267px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      opacity: dept.isDeleted ? 0.7 : 1,
                      "&:hover": { cursor: "pointer", backgroundColor: "rgba(255, 255, 255, 0.1)" },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                        <Box>
                          <IconButton
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#E1E1E1",
                              flexDirection: "column",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label={`Department icon for ${dept.name}`}
                          >
                            <PiChurch size={30} />
                            <span className="text-[10px]">Department</span>
                          </IconButton>
                        </Box>
                        <Box>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStateChange("currentDepartment", dept);
                              handleStateChange("anchorEl", e.currentTarget);
                            }}
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              padding: "8px",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label={`More options for ${dept.name}`}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{
                            textDecoration: dept.isDeleted ? "line-through" : "none",
                            color: dept.isDeleted ? "gray" : "#E1E1E1",
                          }}
                        >
                          {dept.name}
                          {dept.branch && (
                            <Typography
                              component="span"
                              sx={{ ml: 1, fontSize: "0.75rem", color: "orange", fontWeight: 500 }}
                            >
                              {`(${dept.branch.name})`}
                            </Typography>
                          )}
                          {dept.type === "Outreach" && (
                            <Typography
                              component="span"
                              sx={{ ml: 1, fontSize: "0.75rem", color: "#10b981", fontWeight: 500 }}
                            >
                              (Outreach)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      <Box mt={2}>
                        {dept.description && (
                          <Box display="flex" alignItems="flex-start" mb={1}>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: dept.isDeleted ? "line-through" : "none",
                                color: dept.isDeleted ? "gray" : "#777280",
                              }}
                            >
                              {dept.description}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Custom Pagination */}
            <CustomPagination
              hasNextPage={state.pagination.hasNextPage}
              hasPrevPage={state.currentPage > 1}
              onPageChange={handlePageChange}
              currentPage={state.currentPage}
              isLargeScreen={isLargeScreen}
              isLoading={state.loading}
            />
          </>
        )}

        {/* Action Menu */}
        <Menu
          id="department-menu"
          anchorEl={state.anchorEl}
          keepMounted
          open={Boolean(state.anchorEl)}
          onClose={() => handleStateChange("anchorEl", null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { "& .MuiMenuItem-root": { fontSize: isLargeScreen ? "0.875rem" : undefined } } }}
        >
          <MenuItem onClick={handleEditOpen} disabled={state.currentDepartment?.isDeleted || state.loading}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")} disabled={state.loading}>
            {state.currentDepartment?.isActive ? (
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
          <MenuItem onClick={() => showConfirmation("delete")} disabled={state.loading}>
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Department Modal */}
        <Dialog
          open={state.editModalOpen}
          onClose={() => {
            handleStateChange("editModalOpen", false);
            handleStateChange("currentDepartment", null);
            handleStateChange("nameError", null);
          }}
          maxWidth="sm"
          fullWidth
          sx={{ "& .MuiDialog-paper": { borderRadius: 2, bgcolor: "#2C2C2C", color: "#F6F4FE" } }}
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Edit Department
              </Typography>
              <IconButton
                onClick={() => {
                  handleStateChange("editModalOpen", false);
                  handleStateChange("currentDepartment", null);
                  handleStateChange("nameError", null);
                }}
                aria-label="Close edit modal"
              >
                <Close className="text-gray-300" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Department Name"
                name="name"
                value={state.editFormData.name}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                error={!!state.nameError}
                helperText={state.nameError}
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" },
                }}
                aria-label="Department name"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" }}>
                  Type
                </InputLabel>
                <Select
                  value={state.editFormData.type}
                  onChange={handleEditTypeChange}
                  label="Type"
                  sx={{
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "& .MuiSelect-select": { color: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  }}
                  aria-label="Department type"
                >
                  <MenuItem value="Department" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                    Department
                  </MenuItem>
                  <MenuItem value="Outreach" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                    Outreach
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={state.editFormData.description}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={4}
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" },
                }}
                aria-label="Department description"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditSubmit}
              sx={{
                py: 1,
                backgroundColor: "#F6F4FE",
                px: { xs: 6, sm: 2 },
                borderRadius: 50,
                color: "#2C2C2C",
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
              }}
              variant="contained"
              disabled={state.loading || !!state.nameError}
              aria-label="Save department changes"
            >
              {state.loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Department Modal */}
        <DepartmentModal
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshDepartments}
        />

        {/* Confirmation Modal */}
        <Dialog
          open={state.confirmModalOpen}
          onClose={() => handleStateChange("confirmModalOpen", false)}
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {state.actionType === "delete"
              ? "Delete Department"
              : state.currentDepartment?.isActive
              ? "Suspend Department"
              : "Activate Department"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {state.actionType === "delete"
                ? `Are you sure you want to delete "${state.currentDepartment?.name}"?`
                : `Are you sure you want to ${state.currentDepartment?.isActive ? "suspend" : "activate"} "${state.currentDepartment?.name}"?`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleStateChange("confirmModalOpen", false)}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
              aria-label="Cancel action"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedAction}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
              color={state.actionType === "delete" ? "error" : "primary"}
              variant="contained"
              disabled={state.loading}
              aria-label={state.actionType === "delete" ? "Delete department" : "Confirm action"}
            >
              {state.loading ? "Processing..." : state.actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewDepartment;