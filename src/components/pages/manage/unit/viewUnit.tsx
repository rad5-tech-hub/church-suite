import React, { useState, useEffect, useCallback } from "react";
import { useTheme, useMediaQuery, SelectChangeEvent } from "@mui/material";
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
  Tooltip,
  Menu,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
  Select,
  FormControl,
} from "@mui/material";
import {
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Close,
} from "@mui/icons-material";
import { PiChurch } from "react-icons/pi";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { toast } from "react-toastify";
import DashboardManager from "../../../shared/dashboardManager";
import UnitModal from "./unit";
import Api from "../../../shared/api/api";

interface Department {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDeleted?: boolean;
  branchId: string | null;
  departmentId: string | null;
}

interface Pagination {
  hasNextPage: boolean;
  nextPage: string | null;
}

interface FetchUnitsResponse {
  success: boolean;
  pagination: Pagination;
  units: Unit[];
}

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading: boolean;
}

const isFetchUnitsResponse = (data: unknown): data is FetchUnitsResponse => {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    "success" in obj &&
    typeof obj.success === "boolean" &&
    "units" in obj &&
    Array.isArray(obj.units) &&
    "pagination" in obj &&
    typeof obj.pagination === "object" &&
    obj.pagination !== null &&
    "hasNextPage" in (obj.pagination as Record<string, unknown>) &&
    typeof (obj.pagination as Record<string, unknown>).hasNextPage === "boolean" &&
    "nextPage" in (obj.pagination as Record<string, unknown>) &&
    (typeof (obj.pagination as Record<string, unknown>).nextPage === "string" ||
      (obj.pagination as Record<string, unknown>).nextPage === null)
  );
};

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

const EmptyState: React.FC<{
  error: string | null;
  openModal: () => void;
  isLargeScreen: boolean;
  searchTerm: string;
  handleClearSearch: () => void;
}> = ({ error, openModal, isLargeScreen, searchTerm, handleClearSearch }) => (
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
      {searchTerm ? "No units found matching your search" : "No units available"}
    </Typography>
    {error && (
      <Typography color="error" sx={{ mb: 2 }}>
        {error}
      </Typography>
    )}
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
      aria-label="Create new unit"
    >
      Create New Unit
    </Button>
    {searchTerm && (
      <Button
        variant="contained"
        onClick={handleClearSearch}
        sx={{
          px: { xs: 2, sm: 2 },
          py: 1,
          mt: 2,
          borderRadius: 50,
          backgroundColor: "#363740",
          fontWeight: 500,
          textTransform: "none",
          color: "#FFFFFF",
          fontSize: isLargeScreen ? "1rem" : undefined,
          "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
        }}
        aria-label="Clear search"
      >
        Clear Search
      </Button>
    )}
  </Box>
);

const ViewUnit: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [state, setState] = useState<{
    units: Unit[];
    departments: Department[];
    loading: boolean;
    isSearching: boolean;
    error: string | null;
    editModalOpen: boolean;
    confirmModalOpen: boolean;
    isModalOpen: boolean;
    currentUnit: Unit | null;
    actionType: "delete" | "suspend" | null;
    anchorEl: HTMLElement | null;
    editFormData: Omit<Unit, "id" | "isActive" | "isDeleted" | "branchId" | "departmentId">;
    nameError: string | null;
    searchTerm: string;
    selectedDepartmentId: string;
    currentPage: number;
    pagination: Pagination;
    pageHistory: string[];
  }>({
    units: [],
    departments: [],
    loading: false,
    isSearching: false,
    error: null,
    editModalOpen: false,
    confirmModalOpen: false,
    isModalOpen: false,
    currentUnit: null,
    actionType: null,
    anchorEl: null,
    editFormData: { name: "", description: "" },
    nameError: null,
    searchTerm: "",
    selectedDepartmentId: "",
    currentPage: 1,
    pagination: { hasNextPage: false, nextPage: null },
    pageHistory: [],
  });

  const handleStateChange = useCallback(<K extends keyof typeof state>(key: K, value: typeof state[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fetch units with server-side pagination
  const fetchUnits = useCallback(
    async (url: string | null = "/church/all-units"): Promise<FetchUnitsResponse> => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const apiUrl = url || "/church/all-units";
        const response = await Api.get<FetchUnitsResponse>(apiUrl);
        const data: unknown = response.data;
        
        if (!isFetchUnitsResponse(data)) {
          throw new Error("Invalid response structure");
        }
        
        handleStateChange("loading", false);
        return data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to load units. Please try again later.";
        console.error("Failed to fetch units:", error);
        handleStateChange("error", errorMessage);
        handleStateChange("loading", false);
        toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
        throw error;
      }
    },
    [handleStateChange, isMobile]
  );

  // Search units with filters
  const searchUnits = useCallback(
    async (url: string | null = "/church/all-units", searchTerm: string, departmentId: string) => {
      handleStateChange("isSearching", true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (departmentId) params.append("departmentId", departmentId);
        
        const fullUrl = url && url.includes("?") 
          ? `${url}&${params.toString()}` 
          : `${url}?${params.toString()}`;
          
        const response = await Api.get<FetchUnitsResponse>(fullUrl);
        const data: unknown = response.data;
        
        if (!isFetchUnitsResponse(data)) {
          throw new Error("Invalid response structure");
        }
        
        handleStateChange("isSearching", false);
        toast.success("Search completed successfully!", { position: isMobile ? "top-center" : "top-right" });
        return data;
      } catch (error: any) {
        console.error("Error searching units:", error);
        toast.warn("Server search failed, applying local filter", { position: isMobile ? "top-center" : "top-right" });
        throw error;
      }
    },
    [handleStateChange, isMobile]
  );

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    handleStateChange("loading", true);
    try {
      const response = await Api.get("/church/get-departments");
      handleStateChange("departments", response.data.departments || []);
      handleStateChange("loading", false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to load departments.";
      console.error("Failed to fetch departments:", error);
      handleStateChange("error", errorMessage);
      handleStateChange("loading", false);
      toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
    }
  }, [handleStateChange, isMobile]);

  // Refresh units
  const refreshUnits = useCallback(async () => {
    try {
      const data = await fetchUnits();
      setState((prev) => ({
        ...prev,
        units: data.units,
        pagination: data.pagination,
        currentPage: 1,
        pageHistory: [],
        loading: false,
      }));
    } catch (error) {
      handleStateChange("loading", false);
    }
  }, [fetchUnits, handleStateChange]);

  // Initial data load
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const data = await fetchUnits();
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            units: data.units,
            pagination: data.pagination,
            currentPage: 1,
            pageHistory: [],
            loading: false,
          }));
        }
        await fetchDepartments();
      } catch (error) {
        if (isMounted) handleStateChange("loading", false);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [fetchUnits, fetchDepartments, handleStateChange]);

  // Handle pagination navigation
  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const url =
          direction === "next"
            ? state.pagination.nextPage
            : state.pageHistory.length > 0
            ? state.pageHistory[state.pageHistory.length - 2] || "/church/all-units"
            : null;
            
        if (!url) throw new Error(direction === "next" ? "No next page available" : "No previous page available");
        
        const data = state.searchTerm || state.selectedDepartmentId
          ? await searchUnits(url, state.searchTerm, state.selectedDepartmentId)
          : await fetchUnits(url);
          
        setState((prev) => ({
          ...prev,
          units: data.units,
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
    [
      state.pagination.nextPage,
      state.pageHistory,
      state.searchTerm,
      state.selectedDepartmentId,
      fetchUnits,
      searchUnits,
      handleStateChange,
      isMobile,
    ]
  );

  // Handle search
  const handleSearch = useCallback(() => {
    handleStateChange("isSearching", true);
    handleStateChange("currentPage", 1);
    handleStateChange("pageHistory", []);
    
    if (state.searchTerm || state.selectedDepartmentId) {
      searchUnits("/church/all-units", state.searchTerm, state.selectedDepartmentId)
        .then((data) => {
          setState((prev) => ({
            ...prev,
            units: data.units,
            pagination: data.pagination,
            isSearching: false,
          }));
        })
        .catch(() => {
          // Fallback to local filtering if server search fails
          const filtered = state.units
            .filter((unit) => 
              state.searchTerm ? unit.name.toLowerCase().includes(state.searchTerm.toLowerCase()) : true
            )
            .filter((unit) => 
              state.selectedDepartmentId ? unit.departmentId === state.selectedDepartmentId : true
            );
            
          setState((prev) => ({
            ...prev,
            units: filtered,
            pagination: { hasNextPage: false, nextPage: null },
            currentPage: 1,
            pageHistory: [],
            isSearching: false,
          }));
        });
    } else {
      refreshUnits();
    }
  }, [refreshUnits, searchUnits, state.units, state.searchTerm, state.selectedDepartmentId, handleStateChange]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    handleStateChange("searchTerm", "");
    handleStateChange("selectedDepartmentId", "");
    handleStateChange("currentPage", 1);
    handleStateChange("pageHistory", []);
    refreshUnits();
  }, [refreshUnits, handleStateChange]);

  const handleMenuClose = useCallback(() => handleStateChange("anchorEl", null), [handleStateChange]);

  const handleEditOpen = useCallback(() => {
    if (state.currentUnit) {
      handleStateChange("editFormData", {
        name: state.currentUnit.name,
        description: state.currentUnit.description || "",
      });
      handleStateChange("editModalOpen", true);
      handleStateChange("nameError", null);
    }
    handleMenuClose();
  }, [state.currentUnit, handleStateChange, handleMenuClose]);

  const showConfirmation = useCallback(
    (action: "delete" | "suspend") => {
      handleStateChange("actionType", action);
      handleStateChange("confirmModalOpen", true);
      handleMenuClose();
    },
    [handleStateChange, handleMenuClose]
  );

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      handleStateChange("editFormData", { ...state.editFormData, [name]: value });
      if (name === "name") {
        handleStateChange("nameError", value.trim() ? null : "Unit name is required");
      }
    },
    [state.editFormData, handleStateChange]
  );

  const handleDepartmentChange = useCallback(
    (e: SelectChangeEvent<unknown>) => {
      const value = e.target.value;
      if (typeof value === "string") {
        handleStateChange("selectedDepartmentId", value);
      }
    },
    [handleStateChange]
  );

  const handleEditSubmit = useCallback(async () => {
    if (!state.currentUnit?.id || !state.editFormData.name.trim()) {
      handleStateChange("nameError", "Unit name is required");
      toast.error("Invalid unit data", { position: isMobile ? "top-center" : "top-right" });
      return;
    }
    
    try {
      handleStateChange("loading", true);
      await Api.patch(`/church/edit-unit/${state.currentUnit.id}`, {
        ...state.editFormData,
        description: state.editFormData.description || null,
      });
      
      // Refresh the current page after edit
      const currentUrl = state.pageHistory[state.pageHistory.length - 1] || "/church/all-units";
      const data = state.searchTerm || state.selectedDepartmentId
        ? await searchUnits(currentUrl, state.searchTerm, state.selectedDepartmentId)
        : await fetchUnits(currentUrl);
        
      setState((prev) => ({
        ...prev,
        units: data.units,
        pagination: data.pagination,
        loading: false,
      }));
      
      toast.success("Unit updated successfully!", { position: isMobile ? "top-center" : "top-right" });
      handleStateChange("editModalOpen", false);
      handleStateChange("currentUnit", null);
      handleStateChange("nameError", null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update unit";
      console.error("Update error:", error);
      toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
      handleStateChange("loading", false);
    }
  }, [
    state.currentUnit, 
    state.editFormData, 
    state.pageHistory, 
    state.searchTerm, 
    state.selectedDepartmentId, 
    fetchUnits, 
    searchUnits, 
    handleStateChange, 
    isMobile
  ]);

  const handleConfirmedAction = useCallback(async () => {
    if (!state.currentUnit || !state.actionType) return;
    
    try {
      handleStateChange("loading", true);
      if (state.actionType === "delete") {
        await Api.delete(`/church/delete-unit/${state.currentUnit.id}`);
        
        // Refresh the current page after delete
        const currentUrl = state.pageHistory[state.pageHistory.length - 1] || "/church/all-units";
        const data = state.searchTerm || state.selectedDepartmentId
          ? await searchUnits(currentUrl, state.searchTerm, state.selectedDepartmentId)
          : await fetchUnits(currentUrl);
          
        setState((prev) => ({
          ...prev,
          units: data.units,
          pagination: data.pagination,
          pageHistory: prev.currentPage > 1 && data.units.length === 0 ? prev.pageHistory.slice(0, -1) : prev.pageHistory,
          currentPage: prev.currentPage > 1 && data.units.length === 0 ? prev.currentPage - 1 : prev.currentPage,
          loading: false,
        }));
        
        toast.success("Unit deleted successfully!", { position: isMobile ? "top-center" : "top-right" });
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentUnit.isActive;
        await Api.patch(`/church/suspend-unit/${state.currentUnit.id}`, { isActive: newStatus });
        
        // Refresh the current page after status change
        const currentUrl = state.pageHistory[state.pageHistory.length - 1] || "/church/all-units";
        const data = state.searchTerm || state.selectedDepartmentId
          ? await searchUnits(currentUrl, state.searchTerm, state.selectedDepartmentId)
          : await fetchUnits(currentUrl);
          
        setState((prev) => ({
          ...prev,
          units: data.units,
          pagination: data.pagination,
          loading: false,
        }));
        
        toast.success(`Unit ${newStatus ? "activated" : "suspended"} successfully!`, {
          position: isMobile ? "top-center" : "top-right",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${state.actionType} unit`;
      console.error("Action error:", error);
      toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
    } finally {
      handleStateChange("loading", false);
      handleStateChange("confirmModalOpen", false);
      handleStateChange("actionType", null);
      handleStateChange("currentUnit", null);
    }
  }, [
    state.currentUnit, 
    state.actionType, 
    state.pageHistory, 
    state.searchTerm, 
    state.selectedDepartmentId, 
    fetchUnits, 
    searchUnits, 
    handleStateChange, 
    isMobile
  ]);

  const truncateDescription = (description: string | null, maxLength = 25) => {
    if (!description) return "-";
    return description.length <= maxLength ? description : `${description.substring(0, maxLength)}...`;
  };

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{xs: 12, md: 5}}>
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
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Unit</span>
            </Typography>
            <Box
              sx={{
                border: "1px solid #4d4d4e8e",
                borderRadius: "32px",
                display: "flex",
                alignItems: "center",
                backgroundColor: "#4d4d4e8e",
                padding: "4px",
                width: "100%",
                gap: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1, padding: "4px 16px" }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                >
                  Name
                </Typography>
                <TextField
                  variant="standard"
                  placeholder="Search by name"
                  value={state.searchTerm}
                  onChange={(e) => handleStateChange("searchTerm", e.target.value)}
                  sx={{
                    "& .MuiInputBase-input": { color: "#F6F4FE", fontWeight: 500, fontSize: "14px", py: "4px" },
                    flex: 1,
                  }}
                  InputProps={{ disableUnderline: true }}
                  aria-label="Search units by name"
                />
              </Box>
              <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
              <Box sx={{ display: "flex", flexDirection: "column", minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                >
                  Department
                </Typography>
                <FormControl fullWidth variant="standard">
                  <Select
                    value={state.selectedDepartmentId}
                    onChange={handleDepartmentChange}
                    displayEmpty
                    sx={{
                      color: state.selectedDepartmentId ? "#F6F4FE" : "#777280",
                      fontWeight: 500,
                      fontSize: "14px",
                      ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                      ".MuiOutlinedInput-notchedOutline": { border: "none" },
                      "& .MuiSelect-icon": { display: "none" },
                    }}
                    renderValue={(selected) =>
                      selected
                        ? state.departments.find((dept) => dept.id === selected)?.name || "Select Department"
                        : "Select Department"
                    }
                    aria-label="Select department"
                  >
                    <MenuItem value="">All</MenuItem>
                    {state.departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: "flex", gap: "8px", pr: "8px" }}>
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
                  disabled={state.loading || state.isSearching}
                  aria-label="Search units"
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
          <Grid           
            size={{xs: 12, md: 7}}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
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
                color: "#F6F4FE",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
              }}
              aria-label="Create new unit"
            >
              Create Unit +
            </Button>
          </Grid>
        </Grid>

        {state.loading && state.units.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {(!state.loading || state.error) && state.units.length === 0 && (
          <EmptyState
            error={state.error}
            openModal={() => handleStateChange("isModalOpen", true)}
            isLargeScreen={isLargeScreen}
            searchTerm={state.searchTerm}
            handleClearSearch={handleClearSearch}
          />
        )}

        {state.units.length > 0 && (
          <>
            <Grid container spacing={2}>
              {state.units.map((unit) => (
                <Grid size={{xs:12, sm:6, md:4, lg:3}} key={unit.id}>
                  <Card
                    sx={{
                      borderRadius: "10.267px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      opacity: unit.isDeleted ? 0.7 : 1,
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                        <Box>
                          <IconButton
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#E1E1E1",
                              display: "flex",
                              flexDirection: "column",
                              paddingX: "15px",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label="Unit icon"
                          >
                            <PiChurch size={30} />
                            <span className="text-[10px]">unit</span>
                          </IconButton>
                        </Box>
                        <Box>
                          <IconButton
                            aria-label="Unit actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStateChange("currentUnit", unit);
                              handleStateChange("anchorEl", e.currentTarget);
                            }}
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              padding: "8px",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
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
                            textDecoration: unit.isDeleted ? "line-through" : "none",
                            color: unit.isDeleted ? "gray" : "#E1E1E1",
                          }}
                        >
                          {unit.name}
                        </Typography>
                      </Box>
                      <Box mt={2}>
                        {unit.description && (
                          <Box display="flex" alignItems="flex-start" mb={1}>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: unit.isDeleted ? "line-through" : "none",
                                color: unit.isDeleted ? "gray" : "#777280",
                              }}
                            >
                              <Tooltip title={unit.description} arrow>
                                <span>{truncateDescription(unit.description)}</span>
                              </Tooltip>
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

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

        <Menu
          id="unit-menu"
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
          <MenuItem onClick={handleEditOpen} disabled={state.currentUnit?.isDeleted || state.loading}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")} disabled={state.loading}>
            {state.currentUnit?.isActive ? (
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

        <Dialog
          open={state.editModalOpen}
          onClose={() => {
            handleStateChange("editModalOpen", false);
            handleStateChange("currentUnit", null);
            handleStateChange("nameError", null);
          }}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 2,
              bgcolor: "#2C2C2C",
              color: "#F6F4FE",
            },
          }}
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography
                variant={isMobile ? "h5" : "h5"}
                component="h1"
                fontWeight={600}
                sx={{ fontSize: isLargeScreen ? "1.5rem" : undefined }}
              >
                Edit Unit
              </Typography>
              <IconButton
                onClick={() => {
                  handleStateChange("editModalOpen", false);
                  handleStateChange("currentUnit", null);
                  handleStateChange("nameError", null);
                }}
                aria-label="Close edit dialog"
              >
                <Close className="text-gray-300" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Unit Name"
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
              />
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
                    fontSize: isLargeScreen ? "0.875rem" : undefined 
                  },
                }}
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                handleStateChange("editModalOpen", false);
                handleStateChange("currentUnit", null);
                handleStateChange("nameError", null);
              }}
              sx={{
                border: 1,
                color: "var(--color-primary)",
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
              aria-label="Cancel edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              sx={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
              variant="contained"
              disabled={state.loading || !!state.nameError}
              aria-label="Save unit changes"
            >
              {state.loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        <UnitModal
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshUnits}
        />

        <Dialog
          open={state.confirmModalOpen}
          onClose={() => handleStateChange("confirmModalOpen", false)}
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {state.actionType === "delete"
              ? "Delete Unit"
              : state.currentUnit?.isActive
              ? "Suspend Unit"
              : "Activate Unit"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {state.actionType === "delete"
                ? `Are you sure you want to delete "${state.currentUnit?.name}"?`
                : `Are you sure you want to ${state.currentUnit?.isActive ? "suspend" : "activate"} "${state.currentUnit?.name}"?`}
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
              aria-label={state.actionType === "delete" ? "Delete unit" : "Confirm unit action"}
            >
              {state.loading ? "Processing..." : state.actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewUnit;