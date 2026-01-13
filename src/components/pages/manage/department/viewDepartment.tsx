import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
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
import { Navigate } from "react-router-dom";

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

interface Errors {
  name: string;
  description: string;
  branchId: string;
}

interface State {
  departments: Department[];
  charCount: number;
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
  editFormData: Omit<Department, "id"> & { branchId?: string };
  searchTerm: string;
  typeFilter: "" | "Department" | "Outreach";
  branches: Branch[];
  selectedBranchId: string;
  searchDrawerOpen: boolean;
  errors: Errors;
}

const isFetchDepartmentsResponse = (data: unknown): data is FetchDepartmentsResponse => {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if ("message" in obj && typeof obj.message !== "string") return false;
  if (!("departments" in obj) || !Array.isArray(obj.departments)) return false;
  if (!("pagination" in obj) || typeof obj.pagination !== "object" || obj.pagination === null) return false;
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
          backgroundColor: !hasPrevPage || isLoading ? "#4d4d4e8e" : "var(--color-text-primary)",
          color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
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
          backgroundColor: !hasNextPage || isLoading ? "#4d4d4e8e" : "var(--color-text-primary)",
          color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </Box>
  </Box>
);

const EmptyState: React.FC<{ error: string | null; role: string | null; openModal: () => void; isLargeScreen: boolean }> = ({
  error,
  openModal,
  isLargeScreen,
  role ,
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
      color="rgba(255, 255, 255, 0.5)"
      gutterBottom
      sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}
    >
      {error || "No departments Found"}
    </Typography>
    {role === 'branch' && <Button
      variant="contained"
      onClick={openModal}
      sx={{
        backgroundColor: "var(--color-text-primary)",
        px: { xs: 2, sm: 2 },
        py: 1,
        mt: 2,
        fontWeight: 500,
        textTransform: "none",
        color: "var(--color-primary)",
        fontSize: isLargeScreen ? "1rem" : undefined,
        "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
      }}
      aria-label="Create new department"
    >
      Create New Department
    </Button>}
  </Box>
);

const ViewDepartment: React.FC = () => {
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  usePageToast("view-department");

  const initialState: State = {
    departments: [],
    filteredDepartments: [],
    pagination: { hasNextPage: false, nextCursor: null, nextPage: null },
    currentPage: 1,
    pageHistory: [],
    loading: false,
    charCount: 0,
    error: null,
    isSearching: false,
    editModalOpen: false,
    confirmModalOpen: false,
    isModalOpen: false,
    currentDepartment: null,
    actionType: null,
    anchorEl: null,
    editFormData: { name: "", description: "", type: "Department", isActive: true, branchId: '' },
    searchTerm: "",
    typeFilter: "",
    branches: [],
    selectedBranchId: authData?.branchId || "",
    searchDrawerOpen: false,
    errors: { name: "", description: "" , branchId: '',},
  };

  const [state, setState] = useState<State>(initialState);

  const handleStateChange = useCallback(<K extends keyof State>(key: K, value: State[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleBranchOpen = async () => {
    if (!branchesLoaded) {
      await fetchBranches();
      setBranchesLoaded(true);
    }
  };

  if (authData?.role === "unit") {
    return <Navigate to="/manage/view-units" replace />;
  }

  const fetchDepartments = useCallback(
    async (url: string | null = `/church/get-departments${authData?.branchId ? `?branchId=${authData.branchId}` : ""}`): Promise<FetchDepartmentsResponse> => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const response = await Api.get<FetchDepartmentsResponse>(url || `/church/get-departments`);
        const data: unknown = response.data;
        if (!isFetchDepartmentsResponse(data)) {
          throw new Error("Invalid response structure");
        }
        handleStateChange("loading", false);
        return data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message;
        console.error("Failed to fetch departments:", error);
        handleStateChange("loading", false);
        handleStateChange("error", errorMessage);
        throw error;
      }
    },
    [handleStateChange]
  );

  const fetchBranches = useCallback(async () => {
    if (branchesLoaded) return;
    if (branchesLoading) return;
    
    setBranchesLoading(true);
    try {
      const response = await Api.get<{ branches: Branch[] }>("/church/get-branches");
      const data = response.data;
      if (!Array.isArray(data.branches)) throw new Error("Invalid branch response");
      handleStateChange("branches", data.branches);
      setBranchesLoaded(true);
    } catch (error: any) {
      console.error("Failed to fetch branches:", error);
      showPageToast("Failed to load branches. Please try again.", "error");
    } finally {
      setBranchesLoading(false);
    }
  }, [handleStateChange, branchesLoaded, branchesLoading]);

  const searchDepartments = useCallback(
    async (searchTerm: string, branchId?: string | null, typeFilter?: string | null) => {
      handleStateChange("isSearching", true);
      try {
        const params = new URLSearchParams();
        if (searchTerm){params.append("search", searchTerm)
          params.append('searchField', 'name')
        };
        if (typeFilter) params.append("type", typeFilter);
        if (branchId) params.append("branchId", branchId);    

        const response = await Api.get<FetchDepartmentsResponse>(
          `/church/get-departments?${params.toString()}`
        );
        const data = response.data;
        if (!isFetchDepartmentsResponse(data)) {
          throw new Error("Invalid response structure");
        }

        handleStateChange("filteredDepartments", data.departments);
        handleStateChange("pagination", data.pagination);
        handleStateChange("isSearching", false);
        handleStateChange("currentPage", 1);
        handleStateChange("pageHistory", []);
      } catch (error: any) {
        console.error("Error searching departments:", error);
        const errorMessage = error.response?.data?.message || "Failed to search departments.";
        showPageToast(errorMessage, "error");
        handleStateChange("isSearching", false);
      }
    },
    [handleStateChange]
  );

  const handleSearchClick = useCallback(() => {
    searchDepartments(state.searchTerm, state.selectedBranchId || undefined, state.typeFilter || undefined);
  }, [state.searchTerm, state.selectedBranchId, state.typeFilter, searchDepartments,]);

  const refreshDepartments = useCallback(async () => {
    try {
      const data = await fetchDepartments();
      handleStateChange("departments", data.departments);
      handleStateChange("filteredDepartments", data.departments);
      handleStateChange("pagination", data.pagination);
      handleStateChange("currentPage", 1);
      handleStateChange("pageHistory", []);
      handleStateChange("loading", false);
    } catch {
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
        if (!url) throw new Error(direction === "next" ? "No next page" : "No previous page");
        const data = await fetchDepartments(url);
        handleStateChange("filteredDepartments", data.departments);
        handleStateChange("pagination", data.pagination);
        handleStateChange(
          "pageHistory",
          direction === "next" ? [...state.pageHistory, url] : state.pageHistory.slice(0, -1)
        );
        handleStateChange("currentPage", direction === "next" ? state.currentPage + 1 : state.currentPage - 1);
        handleStateChange("loading", false);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || `Failed to load ${direction} page`;
        showPageToast(errorMessage, "error");
        handleStateChange("loading", false);
      }
    },
    [state.pagination.nextPage, state.pageHistory, state.currentPage, fetchDepartments, handleStateChange]
  );

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [deptData] = await Promise.all([fetchDepartments(),]);
        if (isMounted) {
          handleStateChange("departments", deptData.departments);
          handleStateChange("filteredDepartments", deptData.departments);
          handleStateChange("pagination", deptData.pagination);
          handleStateChange("currentPage", 1);
          handleStateChange("pageHistory", []);
          handleStateChange("loading", false);
        }
      } catch {
        if (isMounted) handleStateChange("loading", false);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [fetchDepartments, handleStateChange]);

  useEffect(() => {
    if (
      authData?.isHeadQuarter === false &&
      (authData?.branches?.length ?? 0) === 1 &&
      authData.branchId
    ) {
      handleStateChange("selectedBranchId", authData.branchId);
    }
  }, [authData?.isHeadQuarter, authData?.branches, authData?.branchId, handleStateChange]);

  const handleTypeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      handleStateChange("typeFilter", e.target.value as "" | "Department" | "Outreach");
    },
    [handleStateChange]
  );

  const handleEditOpen = useCallback(async () => {
    if (state.currentDepartment) {
      // Load branches if not loaded
      if (!branchesLoaded) {
        await fetchBranches();
        setBranchesLoaded(true);
      }

      handleStateChange("editFormData", {
        name: state.currentDepartment.name,
        description: state.currentDepartment.description || "",
        type: state.currentDepartment.type,
        isActive: state.currentDepartment.isActive,
        branchId: state.currentDepartment.branch?.id || "",
      });
      handleStateChange("errors", { name: "", description: "", branchId: "" });
      handleStateChange("editModalOpen", true);
    }
    handleStateChange("anchorEl", null);
  }, [state.currentDepartment, branchesLoaded, fetchBranches, handleStateChange]);

  const showConfirmation = useCallback(
    (action: "delete" | "suspend") => {
      handleStateChange("actionType", action);
      handleStateChange("confirmModalOpen", true);
      handleStateChange("anchorEl", null);
    },
    [handleStateChange]
  );

  const handleBranchChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      handleStateChange("selectedBranchId", e.target.value);
    },
    [handleStateChange]
  );

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      handleStateChange("editFormData", { ...state.editFormData, [name]: value });
      // ✅ 256 CHAR LIMIT HANDLER
      if (name === "description") {
        const currentCharCount = value.length;
        if (currentCharCount <= 256) { // ✅ Server limit
          handleStateChange("editFormData", { 
            ...state.editFormData, 
            [name]: value 
          });
          // Update char count for visual feedback
          handleStateChange("charCount", currentCharCount);
        }
        // Browser maxLength handles rest naturally
      } else {
        handleStateChange("editFormData", { 
          ...state.editFormData, 
          [name]: value 
        });
      }
      
      handleStateChange("errors", { ...state.errors, [name]: "" });
    },
    [state.editFormData, state.errors, handleStateChange]
  );

  const handleEditBranchChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      handleStateChange("editFormData", { ...state.editFormData, branchId: e.target.value });
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
      showPageToast("Invalid department data", "error");
      return;
    }

    const newErrors: Errors = { name: "", description: "", branchId: ''};

    // Name validation
    if (!state.editFormData.name.trim()) {
      newErrors.name = "Department name is required";
    } else if (state.editFormData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    } else if (state.editFormData.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    // Description validation (handle null safely)
    const description = state.editFormData.description?.trim() ?? "";
    if (description && description.length < 5) {
      newErrors.description = "Description must be at least 5 characters long";
    } else if (description.length > 256) { // ✅ Server limit
      newErrors.description = "Description must be 256 characters or less";
    }

    handleStateChange("errors", newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    try {
      handleStateChange("loading", true);

      // Build payload with only changed fields, but always include branchId
      const { isActive, ...editFormData } = state.editFormData;
      const original = state.currentDepartment;

      const payload: Partial<typeof editFormData> = {
        branchId: state.editFormData.branchId || undefined, // always include branchId (undefined when not set)
      };

      Object.keys(editFormData).forEach((key) => {
        const k = key as keyof typeof editFormData;

        if (k === "branchId") return; // skip here since already handled

        // Normalize empty description to null
        const newValue =
          k === "description" ? (editFormData[k]?.trim() || null) : editFormData[k];

        // Compare with original, add only if different
        if (newValue !== (original[k] ?? null)) {
          payload[k] = newValue as any;
        }
      });

      // If only branchId is present but unchanged, still send it
      if (
        Object.keys(payload).length === 1 &&
        payload.branchId === (original?.branch?.id ?? undefined)
      ) {
        showPageToast("No changes to update", "warning");
        return;
      }

      await Api.patch(`/church/edit-dept/${state.currentDepartment.id}`, payload);

      const updatedDept = { ...state.currentDepartment, ...payload };

      handleStateChange(
        "departments",
        state.departments.map((dept) =>
          dept.id === state.currentDepartment!.id ? updatedDept : dept
        )
      );
      handleStateChange(
        "filteredDepartments",
        state.filteredDepartments.map((dept) =>
          dept.id === state.currentDepartment!.id ? updatedDept : dept
        )
      );

      showPageToast("Department updated successfully!", "success");
      handleStateChange("editModalOpen", false);
      handleStateChange("currentDepartment", null);
      handleStateChange("errors", { name: "", description: "", branchId: ''});
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || "Failed to update department";
      if (
        error.response?.status === 400 &&
        errorMessage.toLowerCase().includes("name")
      ) {
        handleStateChange("errors", { ...state.errors, name: errorMessage });
      } else {
        showPageToast(errorMessage, "error");
      }
    } finally {
      handleStateChange("loading", false);
    }
  }, [
    state.currentDepartment,
    state.editFormData,
    state.departments,
    state.filteredDepartments,
    handleStateChange,
  ]);


  const handleCancelEdit = useCallback(() => {
    handleStateChange("editModalOpen", false);
    handleStateChange("currentDepartment", null);
    handleStateChange("errors", { name: "", description: "", branchId: ''});
    handleStateChange("editFormData", { name: "", description: "", type: "Department", isActive: true,  branchId: ""  });
    handleStateChange("charCount", 0)
  }, [handleStateChange]);

  const handleConfirmedAction = useCallback(async () => {
    if (!state.currentDepartment || !state.actionType) return;
    try {
      handleStateChange("loading", true);
      if (state.actionType === "delete") {
        await Api.delete(`/church/delete-dept/${state.currentDepartment.id}/branch/${authData?.branchId}`);
        const newDepartments = state.departments.filter((dept) => dept.id !== state.currentDepartment!.id);
        handleStateChange("departments", newDepartments);
        handleStateChange("filteredDepartments", state.filteredDepartments.filter((dept) => dept.id !== state.currentDepartment!.id));
        handleStateChange("pagination", { ...state.pagination, hasNextPage: newDepartments.length > 1 });
        if (state.currentPage > 1 && newDepartments.length === 0) {
          handleStateChange("currentPage", state.currentPage - 1);
          handleStateChange("pageHistory", state.pageHistory.slice(0, -1));
        }
        showPageToast("Department deleted successfully!", "success");
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentDepartment.isActive;
        await Api.patch(`/church/suspend-dept/${state.currentDepartment.id}/branch/${authData?.branchId}`, { isActive: newStatus });
        const updatedDept = { ...state.currentDepartment, isActive: newStatus };
        handleStateChange("departments", state.departments.map((dept) =>
          dept.id === state.currentDepartment!.id ? updatedDept : dept
        ));
        handleStateChange("filteredDepartments", state.filteredDepartments.map((dept) =>
          dept.id === state.currentDepartment!.id ? updatedDept : dept
        ));
        showPageToast(`Department ${newStatus ? "activated" : "suspended"} successfully!`, "success");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${state.actionType} department`;
      showPageToast(errorMessage, "error");
    } finally {
      handleStateChange("loading", false);
      handleStateChange("confirmModalOpen", false);
      handleStateChange("actionType", null);
      handleStateChange("currentDepartment", null);
    }
  }, [state.currentDepartment, state.actionType, state.departments, state.filteredDepartments, state.currentPage, state.pagination, state.pageHistory, handleStateChange]);

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 5, alignItems: "center" }}>        
          <Grid size={{ xs: 12, md: 6, lg: 6 }}>
            <Typography
              variant={isMobile ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.5rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[var(--color-text-muted)]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[var(--color-text-primary)]" />{" "}
              <span className="text-[var(--color-text-primary)]">Departments</span>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 6 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            {authData?.role === 'branch' &&<Button
              variant="contained"
              onClick={() => handleStateChange("isModalOpen", true)}
              sx={{
                backgroundColor: "var(--color-text-primary)",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": { backgroundColor: "#777280", opacity: 0.9 },
                ml: isMobile ? 2 : 0,
              }}          
              aria-label="Create new department"
            >
              Create Department +
            </Button>}    
          </Grid>
          <Grid size={{ xs: 12, lg: 8 }} sx={{ display: "flex", alignItems: "center", mt: { xs: 2, lg: 0 }, }}>
            {/* Desktop View */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                border: "1px solid var(--color-border-glass)",
                borderRadius: "9999px",
                backgroundColor: "var(--color-surface-glass)",
                p: "4px",
                gap: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
                alignItems: "center",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1, padding: "4px 16px" }}>
                <Typography variant="caption" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "13px", ml: "8px" }}>
                  Name
                </Typography>
                <Autocomplete
                  freeSolo
                  options={state.departments.map((dept) => dept.name)}
                  value={state.searchTerm}
                  onInputChange={(_e, value) => {
                    handleStateChange("searchTerm", value);                    
                  }}
                  filterOptions={(options, { inputValue }) =>
                    options.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name"
                      variant="standard"
                      InputProps={{
                        ...params.InputProps,
                        disableUnderline: true,
                        sx: { color: "var(--color-text-primary)", fontSize: "14px", padding: "4px 8px", backgroundColor: "transparent" },
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { border: "none" },
                          "& .MuiAutocomplete-clearIndicator": {
                            color: "var(--color-text-primary)", // ✅ ensure cancel icon stays styled
                          },
                      }}
                    />
                  )}
                  sx={{ flex: 1, minWidth: 200 }}
                  aria-label="Search departments by name"
                />
              </Box>
              {!(
                  authData?.isHeadQuarter === false &&
                  (authData?.branches?.length ?? 0) === 1
                ) &&  <><Divider sx={{ height: 30, backgroundColor: "var(--color-text-primary)" }} orientation="vertical" />
              <Box sx={{ display: "flex", flexDirection: "column", flex:  1, minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
                <Typography variant="caption" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "13px", ml: "8px" }}>
                  Branch
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={state.selectedBranchId}
                    onChange={handleBranchChange}
                    displayEmpty
                    onOpen={handleBranchOpen} 
                    sx={{
                      color: state.selectedBranchId ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      fontWeight: 500,
                      fontSize: "14px",
                      ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                      ".MuiOutlinedInput-notchedOutline": { border: "none" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
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
              </Box></>}
              <Divider sx={{ height: 30, backgroundColor: "var(--color-text-primary)" }} orientation="vertical" />
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
                <Typography variant="caption" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "13px", ml: "8px" }}>
                  Type
                </Typography>
                <Select
                  value={state.typeFilter}
                  onChange={handleTypeChange}
                  displayEmpty
                  sx={{
                    color: state.typeFilter ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    fontWeight: 500,
                    fontSize: "14px",
                    ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                    ".MuiOutlinedInput-notchedOutline": { border: "none" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                    "& .MuiSelect-icon": { display: "none" }
                  }}
                  renderValue={(selected) => (selected ? selected : "Select Type")}
                  aria-label="Filter departments by type"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Department">Department</MenuItem>
                  <MenuItem value="Outreach">Outreach</MenuItem>
                </Select>
              </Box>
              <Box sx={{ display: "flex", gap: "2px", pr: "8px" }}>
                <Button
                  onClick={handleSearchClick}
                  sx={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--color-text-muted)",
                    color: "var(--color-text-primary)",
                    borderRadius: "50%",
                    minWidth: "48px",
                    height: "48px",
                    padding: 0,
                    "&:hover": { backgroundColor: "var(--color-surface-glass)" },
                  }}
                  disabled={state.loading || state.isSearching}
                  aria-label="Search departments"
                >
                  {state.isSearching ? (
                    <CircularProgress size={20} sx={{ color: "var(--color-text-primary)" }} />
                  ) : (
                    <SearchIcon sx={{ fontSize: "20px" }} />
                  )}
                </Button>
              </Box>
            </Box>

            {/* ---------- MOBILE FILTER (preview + drawer) ---------- */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                border: "1px solid var(--color-border-glass)",
                borderRadius: "9999px",            
                alignItems: "center",
                backgroundColor: "var(--color-surface-glass)",
                width: "100%",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)"}                  
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                <Typography variant="caption" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "13px", ml: "8px" }}>
                  Name
                </Typography>
                <Autocomplete
                  freeSolo
                  options={state.departments.map((dept) => dept.name)}
                  value={state.searchTerm}
                  onInputChange={(_e, value) => {
                    handleStateChange("searchTerm", value);                    
                  }}
                  filterOptions={(options, { inputValue }) =>
                    options.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name"
                      variant="standard"
                      InputProps={{
                        ...params.InputProps,
                        disableUnderline: true,
                        sx: { color: "var(--color-text-primary)", fontSize: "14px", padding: "4px 8px", backgroundColor: "transparent" },
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { border: "none" },
                          "& .MuiAutocomplete-clearIndicator": {
                            color: "var(--color-text-primary)", // ✅ ensure cancel icon stays styled
                          },
                      }}
                    />
                  )}
                  sx={{ flex: 1, minWidth: 200 }}
                  aria-label="Search departments by name"
                />
              </Box>
              <Divider sx={{ height: 30, backgroundColor: "var(--color-text-primary)" }} orientation="vertical" />
              <IconButton sx={{ color: "var(--color-text-primary)" }} onClick={() => handleStateChange("searchDrawerOpen", true)}>
                <AttachFileOutlined />
              </IconButton>
              <Box sx={{ pr: 1 }}>
                <Button
                  onClick={handleSearchClick}
                  sx={{
                    backgroundColor: "transparent",
                    border: "1px solid #777280",
                    color: "var(--color-text-primary)",
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
                    <CircularProgress size={20} sx={{ color: "var(--color-text-primary)" }} />
                  ) : (
                    <SearchIcon sx={{ fontSize: "20px" }} />
                  )}
                </Button>
              </Box>
            </Box>        
          </Grid>
        </Grid>

        <Drawer
          anchor="top"
          open={state.searchDrawerOpen}
          onClose={() => handleStateChange("searchDrawerOpen", false)}
          sx={{
            "& .MuiDrawer-paper": {
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-primary)",
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
              <Close sx={{ color: "var(--color-text-primary)" }} />
            </IconButton>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "11px", mb: 1 }}>
              Name
            </Typography>
            <Autocomplete
              freeSolo
              options={state.departments.map((dept) => dept.name)}
              value={state.searchTerm}
              onInputChange={(_e, value) => {
                handleStateChange("searchTerm", value);              
              }}
              filterOptions={(options, { inputValue }) =>
                options.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by name"
                  size="small"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    sx: { color: "var(--color-text-primary)", fontSize: "14px", padding: "4px 8px", backgroundColor: "transparent" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "var(--color-text-primary)" },
                      "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                    },
                  }}
                />
              )}
              sx={{ flex: 1, minWidth: 200 }}
              aria-label="Search departments by name"
            />
            {!(
                authData?.isHeadQuarter === false &&
                (authData?.branches?.length ?? 0) === 1
              ) && 
              <>
                <Typography variant="caption" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "11px", mb: 1, mt: 2 }}>
                  Branch
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Select
                    value={state.selectedBranchId}
                    onChange={handleBranchChange}
                    onOpen={handleBranchOpen}
                    displayEmpty
                    sx={{
                      color: state.selectedBranchId ? "var(--color-text-primary)" : "#777280",
                      fontWeight: 500,
                      fontSize: "14px",
                      ".MuiSelect-select": { padding: "8px" },
                      ".MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                      "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
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
              </>
            }           
            <Typography variant="caption" sx={{ color: "var(--color-text-primary)", fontWeight: 500, fontSize: "11px", mb: 1 }}>
              Type
            </Typography>
            <FormControl fullWidth>
              <Select
                value={state.typeFilter}
                onChange={handleTypeChange}
                displayEmpty
                sx={{
                  color: state.typeFilter ? "var(--color-text-primary)" : "#777280",
                  fontWeight: 500,
                  fontSize: "14px",
                  ".MuiSelect-select": { padding: "8px" },
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                  "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
                }}
                renderValue={(selected) => (selected ? selected : "Select Type")}
                aria-label="Filter departments by type"
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Department">Department</MenuItem>
                <MenuItem value="Outreach">Outreach</MenuItem>
              </Select>
            </FormControl>
            <Button
              onClick={handleSearchClick}
              sx={{
                mt: 2,
                backgroundColor: "var(--color-text-primary)",
                color: "var(--color-primary)",
                borderRadius: 50,
                width: "100%",
                py: 1,
                "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
              }}
              disabled={state.loading || state.isSearching}
              aria-label="Search departments"
            >
              {state.isSearching ? <CircularProgress size={20} sx={{ color: "#2C2C2C" }} /> : "Search"}
            </Button>
          </Box>
        </Drawer>

        {state.loading && state.filteredDepartments.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#777280" }} />
          </Box>
        )}

        {(!state.loading || state.error) && state.filteredDepartments.length === 0 && (
          <EmptyState error={state.error} openModal={() => handleStateChange("isModalOpen", true)} isLargeScreen={isLargeScreen} role={authData?.role ?? null}/>
        )}

        {state.filteredDepartments.length > 0 && (
          <>
            <Grid container spacing={2}>
              {state.filteredDepartments.map((dept) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={dept.id}>
                  <Card
                    component="div"
                    sx={{
                      borderRadius: "10.267px",
                      bgcolor: "var(--color-surface-glass)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      height: "100%",
                      transition: "all 0.2s",
                      "&:hover": { bgcolor: "var(--color-surface)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },                   
                      display: "flex",
                      flexDirection: "column",
                      opacity: dept.isDeleted ? 0.7 : 1,                      
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                        <Box>
                          <IconButton
                            sx={{
                              backgroundColor: "var(--color-surface-glass)",
                              color: "var(--color-text-secondary)",
                              flexDirection: "column",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label={`Department icon for ${dept.name}`}
                          >
                            <PiChurch size={30} />
                            <Typography sx={{ fontSize: "10px", color: "var(--color-text-primary)" }}>{dept.type}</Typography>
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
                              backgroundColor: "var(--color-surface-glass)",
                              color: "var(--color-text-primary)",
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
                            color: dept.isDeleted ? "gray" : "var(--color-text-primary)",
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
                        </Typography>
                      </Box>
                      <Box mt={2}>
                        {dept.description && (
                          <Box mb={1}>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: dept.isDeleted ? "line-through" : "none",
                                color: dept.isDeleted ? "gray" : "#777280",
                                width: "100%",
                                display: "-webkit-box !important",
                                WebkitBoxOrient: "vertical !important",
                                WebkitLineClamp: 2,
                                overflow: "hidden",
                                lineHeight: 1.4,
                              }}
                              title={dept.description}
                            >
                              {dept.description
                                .split(' ')
                                .slice(0, 25)
                                .join(' ') + (dept.description.split(' ').length > 25 ? '...' : '')}
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

        <Dialog
          open={state.editModalOpen}
          onClose={handleCancelEdit}
          maxWidth="sm"
          fullWidth
          sx={{ "& .MuiDialog-paper": { borderRadius: 2, bgcolor: "#2C2C2C", color: "var(--color-text-primary)" } }}
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600} sx={{ color: "var(--color-text-primary)" }}>
                Edit Department
              </Typography>
              <IconButton onClick={handleCancelEdit} aria-label="Close edit modal">
                <Close sx={{ color: "#B0B0B0" }} />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* ✅ BRANCH - AUTO-SELECTED ON LOAD */}
              {authData?.isHeadQuarter && <FormControl fullWidth error={!!state.errors.branchId}>
                <InputLabel
                  sx={{ 
                    fontSize: isLargeScreen ? "0.875rem" : undefined, 
                    color: "var(--color-text-primary)", 
                    "&.Mui-focused": { color: "var(--color-text-primary)" } 
                  }}
                >
                  Branch *
                </InputLabel>
                <Select
                  value={state.editFormData.branchId || ""}
                  onChange={handleEditBranchChange}                
                  label="Branch *"
                  sx={{
                    color: state.editFormData.branchId ? "var(--color-text-primary)" : "#777280",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                    "& .MuiSelect-select": { color: "var(--color-text-primary)" },
                    "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  }}
                  renderValue={(selected) => {
                    if (!selected) return "Select Branch";
                    const branch = state.branches.find((b) => b.id === selected);
                    return branch ? branch.name : "Select Branch";
                  }}
                  aria-label="Department branch"
                >               
                  {branchesLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={16} sx={{ mr: 1 }} /> Loading branches...
                    </MenuItem>
                  ) : (
                    state.branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {state.errors.branchId && (
                  <Typography variant="caption" sx={{ color: "#ff6b6b", fontSize: "0.75rem", mt: 0.5 }}>
                    {state.errors.branchId}
                  </Typography>
                )}
              </FormControl>}
              <TextField
                fullWidth
                label="Department Name *"
                name="name"
                value={state.editFormData.name}
                onChange={handleEditChange}
                variant="outlined"
                error={!!state.errors.name}
                helperText={state.errors.name}
                InputProps={{
                  sx: {
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "1rem" : undefined, color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" } },
                }}
                aria-label="Department name"
                required
              />
              <FormControl fullWidth>
                <InputLabel
                  sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" } }}
                >
                  Type *
                </InputLabel>
                <Select
                  value={state.editFormData.type}
                  onChange={handleEditTypeChange}
                  label="Type *"
                  sx={{
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                    "& .MuiSelect-select": { color: "var(--color-text-primary)" },
                    "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
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
              {/* ✅ DESCRIPTION WITH 256 CHAR LIMIT + PERFECT UX */}
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={state.editFormData.description}
                onChange={handleEditChange}
                variant="outlined"
                multiline
                rows={4}
                error={!!state.errors.description}
                helperText={
                  state.errors.description ? (
                    state.errors.description
                  ) : (
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography 
                        variant="caption"
                        sx={{ 
                          color: "#aaa",
                          fontSize: "12px"
                        }}
                      >
                        Max 256 characters
                      </Typography>
                      <Typography 
                        variant="caption"
                        sx={{ 
                          color: state.charCount >= 256 ? "#ff9800" : "#90EE90", 
                          fontSize: "13px",
                          fontWeight: 600,
                          minWidth: 60,
                          textAlign: "right"
                        }}
                      >
                        {state.charCount}/256
                      </Typography>
                    </Box>
                  )
                }
                inputProps={{
                  maxLength: 256, // ✅ Browser handles limit naturally
                }}
                InputProps={{
                  sx: {
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { 
                      borderColor: state.charCount >= 256 ? "#ff9800" : "#777280" // 🟠 Warning orange
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { 
                      borderColor: state.charCount >= 256 ? "#ff9800" : "var(--color-text-primary)" 
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: { 
                    fontSize: isLargeScreen ? "1rem" : undefined, 
                    color: "var(--color-text-primary)", 
                    "&.Mui-focused": { color: "var(--color-text-primary)" } 
                  },
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
                backgroundColor: "var(--color-text-primary)",
                px: { xs: 6, sm: 2 },
                borderRadius: 50,
                color: "#2C2C2C",
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
              }}
              variant="contained"
              disabled={state.loading || Object.values(state.errors).some((error) => error)}
              aria-label="Save department changes"
            >
              {state.loading ? (
                <Box display="flex" alignItems="center" color="gray">
                  <CircularProgress size={18} sx={{ color: "gray", mr: 1 }} />
                  Saving...
                </Box>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <DepartmentModal
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshDepartments}
        />

        <Dialog
          open={state.confirmModalOpen}
          onClose={() => handleStateChange("confirmModalOpen", false)}
          maxWidth="xs"
          sx={{ "& .MuiDialog-paper": { bgcolor: "#2C2C2C", color: "var(--color-text-primary)" } }}
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {state.actionType === "delete"
              ? "Delete Department"
              : state.currentDepartment?.isActive
              ? "Suspend Department"
              : "Activate Department"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "var(--color-text-primary)" }}>
              {state.actionType === "delete"
                ? `Are you sure you want to delete "${state.currentDepartment?.name}"?`
                : `Are you sure you want to ${state.currentDepartment?.isActive ? "suspend" : "activate"} "${state.currentDepartment?.name}"?`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleStateChange("confirmModalOpen", false)}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "var(--color-text-primary)" }}
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
              {state.loading ? (
                <Box display="flex" alignItems="center">
                  <CircularProgress size={18} sx={{ color: "var(--color-text-primary)", mr: 1 }} />
                  Processing...
                </Box>
              ) : state.actionType === "delete" ? (
                "Delete"
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewDepartment;