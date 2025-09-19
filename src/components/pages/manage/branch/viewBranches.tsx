import React, { useState, useEffect, useCallback } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import { Navigate } from "react-router-dom";
import BranchModal from "./branch";
import {
  Box,
  Button,
  CardContent,
  Card,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  Divider,
  MenuItem,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Grid,
  Autocomplete,
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import {
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Close,
} from "@mui/icons-material";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { TbArrowFork } from "react-icons/tb";

interface Branch {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isHeadQuarter: boolean;
  isActive: boolean;
  isDeleted?: boolean;
}

interface Pagination {
  hasNextPage: boolean;
  nextCursor: string | null;
  nextPage: string | null;
}

interface FetchBranchesResponse {
  message: string;
  pagination: Pagination;
  branches: Branch[];
}

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading?: boolean;
}

interface State {
  branches: Branch[];
  filteredBranches: Branch[];
  pagination: Pagination;
  currentPage: number;
  pageHistory: string[];
  loading: boolean;
  error: string | null;
  isSearching: boolean;
  editModalOpen: boolean;
  confirmModalOpen: boolean;
  isModalOpen: boolean;
  currentBranch: Branch | null;
  actionType: string | null;
  anchorEl: HTMLElement | null;
  editFormData: Partial<Pick<Branch, "name" | "email" | "phone" | "address">>;
  searchTerm: string;
  locationFilter: string;
}

const initialState: State = {
  branches: [],
  filteredBranches: [],
  pagination: {
    hasNextPage: false,
    nextCursor: null,
    nextPage: null,
  },
  currentPage: 1,
  pageHistory: [],
  loading: false,
  error: null,
  isSearching: false,
  editModalOpen: false,
  confirmModalOpen: false,
  isModalOpen: false,
  currentBranch: null,
  actionType: null,
  anchorEl: null,
  editFormData: {
    name: "",
    email: "",
    phone: "",
    address: "",
  },
  searchTerm: "",
  locationFilter: "",
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
          onClick={() => onPageChange("prev")}
          disabled={!hasPrevPage || isLoading}
          sx={{
            minWidth: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: !hasPrevPage || isLoading ? "#4d4d4e8e" : "#F6F4FE",
            color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
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
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
          }}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </Box>
    </Box>
  );
};

const ViewBranches: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  usePageToast('view-branch');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [state, setState] = useState<State>(initialState);

  const handleStateChange = useCallback(
    <K extends keyof State>(key: K, value: State[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

const fetchBranches = useCallback(
  async (url: string | null = "/church/get-branches") => {
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      let response;
      
      if (url) {
        response = await Api.get<FetchBranchesResponse>(url);
      } else {
        response = await Api.get<FetchBranchesResponse>("/church/get-branches");
      }
      
      const data = response.data;
      
      if (!data?.branches) {
        throw new Error("Invalid response structure");
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      handleStateChange("error", "Failed to load branches. Please try again later.");
      handleStateChange("loading", false);
      showPageToast("Failed to load branches", 'error');
      throw error;
    }
  },
  [handleStateChange]
);

  const searchBranches = useCallback(
    async (url: string | null = "/church/get-branches") => {
      handleStateChange("isSearching", true);
      try {
        const params = new URLSearchParams();

        if (state.searchTerm) {
          params.append("search[name]", state.searchTerm);        
        }

        if (state.locationFilter) {
          params.append("search[address]", state.locationFilter);
        }
        const fullUrl =
          url && url.includes("?")
            ? `${url}&${params.toString()}`
            : `${url}?${params.toString()}`;

        const response = await Api.get<FetchBranchesResponse>(fullUrl);
        const data = response.data;

        if (!data || !data.branches) {
          throw new Error("Invalid response structure");
        }

        handleStateChange("isSearching", false);
        return data;
      } catch (error) {
        console.error("Error searching branches:", error);

        let filtered = [...state.branches];

        if (state.searchTerm) {
          filtered = filtered.filter((branch) =>
            branch.name.toLowerCase().includes(state.searchTerm.toLowerCase())
          );
        }

        if (state.locationFilter) {
          filtered = filtered.filter(
            (branch) =>
              state.locationFilter === "" ||
              (state.locationFilter === "branch" && !branch.isHeadQuarter) ||
              (state.locationFilter === "hq" && branch.isHeadQuarter)
          );
        }

        setState((prev) => ({
          ...prev,
          filteredBranches: filtered,
          pagination: { hasNextPage: false, nextCursor: null, nextPage: null },
          currentPage: 1,
          pageHistory: [],
          isSearching: false,
        }));

        throw error;
      }
    },
    [state.branches, state.searchTerm, state.locationFilter, isMobile, handleStateChange]
  );

  const refreshBranches = useCallback(async () => {
    try {
      const response = await fetchBranches();
      const data = response as unknown as FetchBranchesResponse;
      setState((prev) => ({
        ...prev,
        branches: data.branches || [],
        filteredBranches: data.branches || [],
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
      handleStateChange("loading", false);
    }
  }, [fetchBranches, handleStateChange]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const response = await fetchBranches();
        const data = response as unknown as FetchBranchesResponse;
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            branches: data.branches || [],
            filteredBranches: data.branches || [],
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
        if (isMounted) {
          handleStateChange("loading", false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchBranches, handleStateChange]);

  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        if (direction === "next") {
          const url = state.pagination.nextPage;
          if (!url) throw new Error("No next page available");
          const response = state.searchTerm || state.locationFilter 
            ? await searchBranches(url) 
            : await fetchBranches(url);

          const data = response as FetchBranchesResponse;
          setState((prev) => ({
            ...prev,
            filteredBranches: data.branches || [],
            pagination: {
              hasNextPage: data.pagination?.hasNextPage || false,
              nextCursor: data.pagination?.nextCursor || null,
              nextPage: data.pagination?.nextPage || null,
            },
            pageHistory: [...prev.pageHistory, url],
            currentPage: prev.currentPage + 1,
            loading: false,
          }));
        } else if (direction === "prev") {
          if (state.pageHistory.length === 0) throw new Error("No previous page available");
          const prevIndex = state.pageHistory.length - 2;
          const url = prevIndex >= 0 ? state.pageHistory[prevIndex] : "/church/get-branches";
          const response = state.searchTerm || state.locationFilter 
            ? await searchBranches(url) 
            : await fetchBranches(url);

          const data = response as FetchBranchesResponse;
          setState((prev) => ({
            ...prev,
            filteredBranches: data.branches || [],
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
        handleStateChange("error", errorMessage);
        handleStateChange("loading", false);
        showPageToast(errorMessage, 'error');
      }
    },
    [state.pagination.nextPage, state.pageHistory, state.searchTerm, state.locationFilter, fetchBranches, searchBranches, handleStateChange]
  );

  const handleSearch = useCallback(() => {
    handleStateChange("isSearching", true);
    handleStateChange("currentPage", 1);
    handleStateChange("pageHistory", []);
    if (state.searchTerm || state.locationFilter) {
      searchBranches("/church/get-branches").then((data) => {
        if (data) {
          setState((prev) => ({
            ...prev,
            filteredBranches: data.branches || [],
            pagination: {
              hasNextPage: data.pagination?.hasNextPage || false,
              nextCursor: data.pagination?.nextCursor || null,
              nextPage: data.pagination?.nextPage || null,
            },
            isSearching: false,
          }));
        }
      });
    } else {
      refreshBranches();
    }
  }, [refreshBranches, searchBranches, handleStateChange]);

  const handleMenuClose = () => handleStateChange("anchorEl", null);

  const handleEditOpen = () => {
    if (state.currentBranch) {
      handleStateChange("editFormData", {
        name: state.currentBranch.name,
        email: state.currentBranch.email,
        phone: state.currentBranch.phone,
        address: state.currentBranch.address,
      });
      handleStateChange("editModalOpen", true);
    }
    handleMenuClose();
  };

  const showConfirmation = (action: string) => {
    handleStateChange("actionType", action);
    handleStateChange("confirmModalOpen", true);
    handleMenuClose();
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleStateChange("editFormData", { ...state.editFormData, [name]: value });
  };

  const handleEditSubmit = async () => {
    if (!state.currentBranch?.id) {
      console.error("Branch ID is undefined");
      showPageToast("Invalid branch data", "error");
      return;
    }

    try {
      handleStateChange("loading", true);

      // Build payload with only changed fields
      const payload: Partial<typeof state.editFormData> = {};
      const original = state.currentBranch;

      Object.keys(state.editFormData).forEach((key) => {
        const k = key as keyof typeof state.editFormData;
        const newValue = state.editFormData[k];
        const oldValue = original[k];

        if (newValue !== oldValue) {
          payload[k] = newValue;
        }
      });

      // If no changes, stop here
      if (Object.keys(payload).length === 0) {
        showPageToast("No changes to update", "warning");
        return;
      }

      await Api.patch(`/church/edit-branch/${state.currentBranch.id}`, payload);

      setState((prev) => ({
        ...prev,
        branches: prev.branches.map((branch) =>
          branch.id === prev.currentBranch!.id ? { ...branch, ...payload } : branch
        ),
        filteredBranches: prev.filteredBranches.map((branch) =>
          branch.id === prev.currentBranch!.id ? { ...branch, ...payload } : branch
        ),
      }));

      showPageToast("Branch updated successfully!", "success");
      handleStateChange("editModalOpen", false);
      handleStateChange("currentBranch", null);
    } catch (error) {
      console.error("Update error:", error);
      showPageToast("Failed to update branch", "error");
    } finally {
      handleStateChange("loading", false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!state.currentBranch || !state.actionType) return;

    try {
      handleStateChange("loading", true);
      if (state.actionType === "delete") {
        await Api.delete(`/church/delete-branch/${state.currentBranch.id}`);
        setState((prev) => ({
          ...prev,
          branches: prev.branches.filter((branch) => branch.id !== prev.currentBranch!.id),
          filteredBranches: prev.filteredBranches.filter((branch) => branch.id !== prev.currentBranch!.id),
          pagination: { ...prev.pagination, hasNextPage: prev.filteredBranches.length > 1 },
          pageHistory: prev.currentPage > 1 ? prev.pageHistory.slice(0, -1) : prev.pageHistory,
          currentPage: prev.currentPage > 1 && prev.filteredBranches.length === 1 ? prev.currentPage - 1 : prev.currentPage,
        }));
        showPageToast("Branch deleted successfully!",'success');
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentBranch.isActive;
        await Api.patch(`/church/${newStatus ? "activate" : "suspend"}-branch/${state.currentBranch.id}`);
        setState((prev) => ({
          ...prev,
          branches: prev.branches.map((branch) =>
            branch.id === prev.currentBranch!.id ? { ...branch, isActive: newStatus } : branch
          ),
          filteredBranches: prev.filteredBranches.map((branch) =>
            branch.id === prev.currentBranch!.id ? { ...branch, isActive: newStatus } : branch
          ),
        }));
        showPageToast(`Branch ${newStatus ? "activated" : "suspended"} successfully!`, 'success');
      }
    } catch (error) {
      console.error("Action error:", error);
      showPageToast(`Failed to ${state.actionType} branch`, 'error');
    } finally {
      handleStateChange("loading", false);
      handleStateChange("confirmModalOpen", false);
      handleStateChange("actionType", null);
      handleStateChange("currentBranch", null);
    }
  };

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
        sx={{
          fontSize: isLargeScreen ? "1.25rem" : undefined,
        }}
      >
        No branches found
      </Typography>
      {state.error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {state.error}
        </Typography>
      ) : null}
      <Button
        variant="contained"
        onClick={() => handleStateChange("isModalOpen", true)}
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
        aria-label="Create new branch"
      >
        Create New Branch
      </Button>
    </Box>
  );

  if (authData?.isHeadQuarter === false) {
    return <Navigate to="/manage/view-admins" replace />;
  }

  // ✅ Deduplicate by address
  const uniqueBranches = Array.from(
    new Map(
      state.branches.map((branch) => [branch.address, branch]) // address as key
    ).values()
  );

  return (
    <DashboardManager> 
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
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
              <span className="text-[#F6F4FE]"> Branch</span>
            </Typography>
            <Box>
              <Box
                sx={{
                  border: "1px solid #4d4d4e8e",
                  borderRadius: "32px",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#4d4d4e8e",
                  padding: "4px",
                  width: "auto",
                  gap: "8px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
                }}
              >
                {/* Name Autocomplete */}
                <Box sx={{ display: "flex", flex: 1, flexDirection: "column", padding: "4px 16px", minWidth: 180 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                  >
                    Name?
                  </Typography>
                  <Autocomplete
                    freeSolo
                    options={state.branches} // Pass full branch objects
                    getOptionLabel={(option) => (typeof option === "string" ? option : option.name)} // Handle both string & object
                    value={state.searchTerm}
                    onInputChange={(_, newValue) => handleStateChange("searchTerm", newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        placeholder="Search by name"
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: {
                            color: "#F6F4FE",
                            fontWeight: 500,
                            fontSize: "14px",
                            py: "4px",
                            "& .MuiAutocomplete-clearIndicator": {
                              color: "#F6F4FE",
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />

                {/* Location Autocomplete */}
                <Box sx={{ display: "flex", flex: 1, flexDirection: "column", padding: "4px 8px", minWidth: 160 }}>
                  <Autocomplete
                    options={uniqueBranches.map((branch) => ({
                      id: branch.id,
                      label: branch.address || "",
                    }))}
                    value={
                      state.locationFilter
                        ? { id: state.locationFilter, label: state.locationFilter }
                        : null
                    }
                    onChange={(_, newValue) =>
                      handleStateChange("locationFilter", newValue?.label || "")
                    }
                    getOptionLabel={(option) => option.label || ""}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    popupIcon={null} // ✅ removes dropdown arrow
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search by location"
                        variant="standard"
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: {
                            color: "#F6F4FE",
                            fontWeight: 500,
                            fontSize: "14px",
                            py: "4px",
                            "& .MuiAutocomplete-clearIndicator": {
                              color: "#F6F4FE",
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* Search button */}
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
                      "&:hover": { backgroundColor: "#777280" },
                    }}
                    disabled={state.loading || state.isSearching}
                    aria-label="Search branches"
                  >
                    {state.isSearching ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SearchIcon sx={{ fontSize: "20px" }} />
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-end", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => handleStateChange("isModalOpen", true)}
              size="medium"
              sx={{
                backgroundColor: "#363740",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": {
                  backgroundColor: "#363740",
                  opacity: 0.9,
                },
              }}
              aria-label="Create new branch"
            >
              Create Branch +
            </Button>
          </Grid>
        </Grid>

        {state.loading && state.filteredBranches.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {state.error && !state.loading && state.filteredBranches.length === 0 && <EmptyState />}

        {!state.loading && !state.error && state.filteredBranches.length === 0 && <EmptyState />}

        {state.filteredBranches.length > 0 && (
          <>
            <Grid container spacing={2}>
              {state.filteredBranches.map((branch) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={branch.id}>
                  <Card
                    sx={{
                      borderRadius: "10.267px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      opacity: branch.isDeleted ? 0.7 : 1,
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                        <Box>
                          <IconButton
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              display: "flex",
                              flexDirection: "column",
                              padding: "15px",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label={`Branch icon for ${branch.name}`}
                          >
                            <span className="border-2 rounded-md border-[#777280] p-1">
                              <TbArrowFork size={30} />
                            </span>
                          </IconButton>
                        </Box>
                        <Box>
                          <IconButton
                            onClick={(e) => {
                              handleStateChange("currentBranch", branch);
                              handleStateChange("anchorEl", e.currentTarget);
                            }}
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              padding: "8px",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label={`More options for ${branch.name}`}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box display="flex" flexDirection="column" justifyContent="space-between" alignItems="flex-start">
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{
                            textDecoration: branch.isDeleted ? "line-through" : "none",
                            color: branch.isDeleted ? "gray" : "#E1E1E1",
                          }}                          
                        >
                          {branch.name}
                        </Typography>
                        {branch.address && (
                          <Typography
                           variant="body2"
                            sx={{
                              textDecoration: branch.isDeleted ? "line-through" : "none",
                              color: branch.isDeleted ? "gray" : "#777280",
                            }}
                          >
                            {branch.address}
                          </Typography>
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
          id="branch-menu"
          anchorEl={state.anchorEl}
          keepMounted
          open={Boolean(state.anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              "& .MuiMenuItem-root": {
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              },
            },
          }}
        >
          <MenuItem
            onClick={handleEditOpen}
            disabled={state.currentBranch?.isDeleted || state.currentBranch?.isHeadQuarter}
          >
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => showConfirmation("suspend")}
            disabled={state.loading || state.currentBranch?.isHeadQuarter || authData?.isSuperAdmin === false }
          >
            {state.currentBranch?.isActive ? (
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
            disabled={state.loading || state.currentBranch?.isHeadQuarter || authData?.isSuperAdmin === false }
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        <Dialog
          open={state.editModalOpen}
          onClose={() => {
            handleStateChange("editModalOpen", false);
            handleStateChange("currentBranch", null);
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
              <Typography variant="h6" fontWeight={600}>
                Edit Branch
              </Typography>
              <IconButton
                onClick={() => {
                  handleStateChange("editModalOpen", false);
                  handleStateChange("currentBranch", null);
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
                label="Branch Name"
                name="name"
                value={state.editFormData.name}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                aria-label="Branch name"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={state.editFormData.email}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                aria-label="Branch email"
              />
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                type="tel"
                value={state.editFormData.phone}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                aria-label="Branch phone"
              />
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={state.editFormData.address}
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
                  sx: {
                    color: "#F6F4FE",
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                aria-label="Branch address"
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
                "&:hover": {
                  backgroundColor: "#F6F4FE",
                  opacity: 0.9,
                },
              }}
              variant="contained"
              disabled={state.loading}
              aria-label="Save branch changes"
            >
              {state.loading ? <span className="text-gray-500">Saving..</span> : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        <BranchModal
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshBranches}
        />

        <Dialog
          open={state.confirmModalOpen}
          onClose={() => handleStateChange("confirmModalOpen", false)}
          maxWidth="xs"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 2,
              bgcolor: "#2C2C2C",
              color: "#F6F4FE",
            },
          }}
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {state.actionType === "delete"
              ? "Delete Branch"
              : state.actionType === "suspend"
              ? state.currentBranch?.isActive
                ? "Suspend Branch"
                : "Activate Branch"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {state.actionType === "delete"
                ? `Are you sure you want to delete "${state.currentBranch?.name}"?`
                : `Are you sure you want to ${state.currentBranch?.isActive ? "suspend" : "activate"} "${state.currentBranch?.name}"?`}
              {state.currentBranch?.isHeadQuarter && state.actionType === "delete" && " Headquarters branch cannot be deleted."}
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
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, backgroundColor: state.actionType === "delete" ? "#D32F2F" : "gray.400",
                "&:hover": { backgroundColor: state.actionType === "delete" ? "#D32F2F" : "gray.400", opacity: 0.9 } }}
              color={state.actionType === "delete" ? "error" : "primary"}
              variant="contained"
              disabled={state.loading || (state.actionType === "delete" && state.currentBranch?.isHeadQuarter)}
              aria-label={state.actionType === "delete" ? "Delete branch" : "Confirm action"}
            >
              {state.loading ? "Processing..." : state.actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewBranches;