import React, { useState, useEffect, useCallback } from "react";
import DashboardManager from "../../../shared/dashboardManager";
// import { Navigate } from "react-router-dom";
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
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import {
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
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
import MessageModal from "../createMessage/message";

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
      console.error("Failed to fetch messages:", error);
      handleStateChange("error", "Failed to load messages. Please try again later.");
      handleStateChange("loading", false);
      showPageToast("Failed to load messages", 'error');
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
        console.error("Error searching messages:", error);

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
        aria-label="send new messages"
      >
        Send Messages
      </Button>
    </Box>
  );

  // if (authData?. === false) {
  //   return <Navigate to="/manage/view-admins" replace />;
  // }

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
              <span className="text-[#F6F4FE]"> Message</span>
            </Typography>
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
              Send Messages
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

      <MessageModal 
        open={state.isModalOpen}
        onClose={() => handleStateChange("isModalOpen", false)}
      onSuccess={fetchBranches}
    />
    </DashboardManager>
  );
};

export default ViewBranches;