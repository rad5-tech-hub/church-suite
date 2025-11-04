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
  Drawer,
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import {
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Close,
  AttachFileOutlined,
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
  searchDrawerOpen: boolean;          // <-- NEW
}

const initialState: State = {
  branches: [],
  filteredBranches: [],
  pagination: { hasNextPage: false, nextCursor: null, nextPage: null },
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
  editFormData: { name: "", email: "", phone: "", address: "" },
  searchTerm: "",
  locationFilter: "",
  searchDrawerOpen: false,            // <-- NEW
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
            color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
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
};

const ViewBranches: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  usePageToast('view-branch');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
        const response = await Api.get<FetchBranchesResponse>(url || "/church/get-branches");
        const data = response.data;
        if (!data?.branches) throw new Error("Invalid response structure");
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
        if (state.searchTerm) params.append("search[name]", state.searchTerm);
        if (state.locationFilter) params.append("search[address]", state.locationFilter);

        const fullUrl =
          url && url.includes("?")
            ? `${url}&${params.toString()}`
            : `${url}?${params.toString()}`;

        const response = await Api.get<FetchBranchesResponse>(fullUrl);
        const data = response.data;
        if (!data || !data.branches) throw new Error("Invalid response structure");

        handleStateChange("isSearching", false);
        return data;
      } catch (error) {
        console.error("Error searching branches:", error);
        // fallback client-side filter
        let filtered = [...state.branches];
        if (state.searchTerm) {
          filtered = filtered.filter((b) =>
            b.name.toLowerCase().includes(state.searchTerm.toLowerCase())
          );
        }
        if (state.locationFilter) {
          filtered = filtered.filter(
            (b) =>
              state.locationFilter === "" ||
              (state.locationFilter === "branch" && !b.isHeadQuarter) ||
              (state.locationFilter === "hq" && b.isHeadQuarter)
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
    [state.branches, state.searchTerm, state.locationFilter, handleStateChange]
  );

  const refreshBranches = useCallback(async () => {
    try {
      const data = await fetchBranches();
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
    } catch {
      handleStateChange("loading", false);
    }
  }, [fetchBranches, handleStateChange]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      handleStateChange("loading", true);
      try {
        const data = await fetchBranches();
        if (mounted) {
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
      } catch {
        if (mounted) handleStateChange("loading", false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchBranches, handleStateChange]);

  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      try {
        let url: string | null = null;
        if (direction === "next") {
          url = state.pagination.nextPage;
        } else {
          const idx = state.pageHistory.length - 2;
          url = idx >= 0 ? state.pageHistory[idx] : "/church/get-branches";
        }
        if (!url) throw new Error("No URL");

        const data = state.searchTerm || state.locationFilter
          ? await searchBranches(url)
          : await fetchBranches(url);

        setState((prev) => ({
          ...prev,
          filteredBranches: data.branches || [],
          pagination: {
            hasNextPage: data.pagination?.hasNextPage || false,
            nextCursor: data.pagination?.nextCursor || null,
            nextPage: data.pagination?.nextPage || null,
          },
          pageHistory:
            direction === "next"
              ? [...prev.pageHistory, url!]
              : prev.pageHistory.slice(0, -1),
          currentPage: direction === "next" ? prev.currentPage + 1 : prev.currentPage - 1,
          loading: false,
        }));
      } catch (err) {
        console.error(err);
        showPageToast("Failed to load page", "error");
        handleStateChange("loading", false);
      }
    },
    [state.pagination.nextPage, state.pageHistory, state.searchTerm, state.locationFilter, fetchBranches, searchBranches, handleStateChange]
  );

  const handleSearch = useCallback(() => {
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
  }, [state.searchTerm, state.locationFilter, searchBranches, refreshBranches]);

  /* ------------------------------------------------------------------ */
  /*  EDIT / DELETE / SUSPEND LOGIC (unchanged, only tiny clean-ups)   */
  /* ------------------------------------------------------------------ */
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
    if (!state.currentBranch?.id) return showPageToast("Invalid branch", "error");

    const payload: Partial<typeof state.editFormData> = {};
    const orig = state.currentBranch;
    (Object.keys(state.editFormData) as (keyof typeof state.editFormData)[]).forEach((k) => {
      if (state.editFormData[k] !== orig[k]) payload[k] = state.editFormData[k];
    });
    if (!Object.keys(payload).length) return showPageToast("No changes", "warning");

    try {
      handleStateChange("loading", true);
      await Api.patch(`/church/edit-branch/${state.currentBranch.id}`, payload);
      setState((prev) => ({
        ...prev,
        branches: prev.branches.map((b) =>
          b.id === prev.currentBranch!.id ? { ...b, ...payload } : b
        ),
        filteredBranches: prev.filteredBranches.map((b) =>
          b.id === prev.currentBranch!.id ? { ...b, ...payload } : b
        ),
      }));
      showPageToast("Branch updated!", "success");
      handleStateChange("editModalOpen", false);
    } catch {
      showPageToast("Failed to update", "error");
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
          branches: prev.branches.filter((b) => b.id !== prev.currentBranch!.id),
          filteredBranches: prev.filteredBranches.filter((b) => b.id !== prev.currentBranch!.id),
        }));
        showPageToast("Branch deleted!", "success");
      } else if (state.actionType === "suspend") {
        const newStatus = !state.currentBranch.isActive;
        await Api.patch(`/church/${newStatus ? "activate" : "suspend"}-branch/${state.currentBranch.id}`);
        setState((prev) => ({
          ...prev,
          branches: prev.branches.map((b) =>
            b.id === prev.currentBranch!.id ? { ...b, isActive: newStatus } : b
          ),
          filteredBranches: prev.filteredBranches.map((b) =>
            b.id === prev.currentBranch!.id ? { ...b, isActive: newStatus } : b
          ),
        }));
        showPageToast(`Branch ${newStatus ? "activated" : "suspended"}!`, "success");
      }
    } catch {
      showPageToast(`Failed to ${state.actionType}`, "error");
    } finally {
      handleStateChange("loading", false);
      handleStateChange("confirmModalOpen", false);
      handleStateChange("actionType", null);
      handleStateChange("currentBranch", null);
    }
  };

  const EmptyState = () => (
    <Box sx={{ textAlign: "center", py: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <EmptyIcon sx={{ fontSize: 60, color: "rgba(255,255,255,0.5)", mb: 2 }} />
      <Typography variant="h6" color="rgba(255,255,255,0.5)" gutterBottom>
        No branches found
      </Typography>
      {state.error && <Typography color="error">{state.error}</Typography>}
      <Button
        variant="contained"
        onClick={() => handleStateChange("isModalOpen", true)}
        sx={{ mt: 2, backgroundColor: "#363740", "&:hover": { backgroundColor: "#363740", opacity: 0.9 } }}
      >
        Create New Branch
      </Button>
    </Box>
  );

  if (authData?.isHeadQuarter === false) {
    return <Navigate to="/manage/view-admins" replace />;
  }

  const uniqueBranches = Array.from(
    new Map(state.branches.map((b) => [b.address, b])).values()
  );

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */
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
              <span className="text-[#777280]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Branches</span>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 6 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
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
                "&:hover": { backgroundColor: "#777280", opacity: 0.9 },
              }}
            >
              Create Branch +
            </Button>          
          </Grid>

          {/* ==================== FILTER BAR ==================== */}
          <Grid
            size={{ xs: 12, lg: 7 }}
            sx={{
              display: "flex",  
              alignItems: "center",
              mt: { xs: 2, lg: 0 },
            }}
          >
            {/* ---------- DESKTOP FILTER ---------- */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                border: "1px solid #4d4d4e8e",
                borderRadius: "32px",
                backgroundColor: "#4d4d4e8e",
                p: "4px",
                gap: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
                alignItems: "center",
                width: "100%",
              }}
            >
              {/* Name */}
              <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "13px", mb: 0.5 }}>
                  Name?
                </Typography>
                <Autocomplete
                  freeSolo
                  options={state.branches}
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
                  value={state.searchTerm}
                  onInputChange={(_, v) => handleStateChange("searchTerm", v ?? "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name"
                      variant="standard"
                      InputProps={{
                        ...params.InputProps,
                        disableUnderline: true,
                        sx: { color: "#F6F4FE", fontSize: "14px", py: "2px" },
                      }}
                    />
                  )}
                  sx={{ "& .MuiAutocomplete-clearIndicator": { color: "#F6F4FE" } }}
                />
              </Box>

              <Divider orientation="vertical" sx={{ height: 30, bgcolor: "#F6F4FE" }} />

              {/* Location */}
              <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>
                <Autocomplete
                  options={uniqueBranches.map((b) => ({ id: b.id, label: b.address || "" }))}
                  value={state.locationFilter ? { id: state.locationFilter, label: state.locationFilter } : null}
                  onChange={(_, v) => handleStateChange("locationFilter", v?.label ?? "")}
                  getOptionLabel={(opt) => opt.label}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  popupIcon={null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by location"
                      variant="standard"
                      InputProps={{
                        ...params.InputProps,
                        disableUnderline: true,
                        sx: { color: "#F6F4FE", fontSize: "14px", py: "2px" },
                      }}
                    />
                  )}
                  sx={{ "& .MuiAutocomplete-clearIndicator": { color: "#F6F4FE" } }}
                />
              </Box>

              {/* Search button */}
              <Box sx={{ pr: 1 }}>
                <Button
                  onClick={handleSearch}
                  disabled={state.loading || state.isSearching}
                  sx={{
                    minWidth: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: "1px solid #777280",
                    bgcolor: "transparent",
                    color: "#F6F4FE",
                    "&:hover": { bgcolor: "#777280" },
                  }}
                >
                  {state.isSearching ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SearchIcon sx={{ fontSize: 20 }} />
                  )}
                </Button>
              </Box>
            </Box>

            {/* ---------- MOBILE FILTER (preview + drawer) ---------- */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                border: "1px solid #4d4d4e8e",
                borderRadius: "32px",            
                alignItems: "center",
                backgroundColor: "#4d4d4e8e",
                width: "100%",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)"}                  
              }}
            >
                <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                  <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "13px", mb: 0.5 }}>
                    Name?
                  </Typography>
                  <Autocomplete
                    freeSolo
                    options={state.branches}
                    getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
                    value={state.searchTerm}
                    onInputChange={(_, v) => handleStateChange("searchTerm", v ?? "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search by name"
                        variant="standard"
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: { color: "#F6F4FE", fontSize: "14px", py: "2px" },
                        }}
                      />
                    )}
                    sx={{ "& .MuiAutocomplete-clearIndicator": { color: "#F6F4FE" } }}
                  />
                </Box>
                <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                <IconButton
                  onClick={() => handleStateChange("searchDrawerOpen", true)}
                  sx={{ color: "#F6F4FE" }}
                >
                  <AttachFileOutlined/>
                </IconButton>
                {/* Search button */}
                <Box sx={{ pr: 1 }}>
                  <Button
                    onClick={handleSearch}
                    disabled={state.loading || state.isSearching}
                    sx={{
                      minWidth: 48,
                      height: 48,
                      borderRadius: "50%",
                      border: "1px solid #777280",
                      bgcolor: "transparent",
                      color: "#F6F4FE",
                      "&:hover": { bgcolor: "#777280" },
                    }}
                  >
                    {state.isSearching ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SearchIcon sx={{ fontSize: 20 }} />
                    )}
                  </Button>
                </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ==================== MOBILE DRAWER ==================== */}
        <Drawer
          anchor="top"
          open={state.searchDrawerOpen}
          onClose={() => handleStateChange("searchDrawerOpen", false)}
          sx={{
            "& .MuiDrawer-paper": {
              bgcolor: "#2C2C2C",
              color: "#F6F4FE",
              p: 2,
              borderRadius: "0 0 16px 16px",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <IconButton
              onClick={() => handleStateChange("searchDrawerOpen", false)}
              aria-label="Close filter drawer"
            >
              <Close sx={{ color: "#F6F4FE" }} />
            </IconButton>
          </Box>

          {/* Name */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "13px" }}>
              Name?
            </Typography>
            <Autocomplete
              freeSolo
              options={state.branches}
              getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
              value={state.searchTerm}
              onInputChange={(_, v) => handleStateChange("searchTerm", v ?? "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by name"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    sx: { color: "#F6F4FE", bgcolor: "transparent" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "#F6F4FE" },
                    },
                  }}
                />
              )}
            />
          </Box>

          {/* Location */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "13px" }}>
              Location?
            </Typography>
            <Autocomplete
              options={uniqueBranches.map((b) => ({ id: b.id, label: b.address || "" }))}
              value={state.locationFilter ? { id: state.locationFilter, label: state.locationFilter } : null}
              onChange={(_, v) => handleStateChange("locationFilter", v?.label ?? "")}
              getOptionLabel={(opt) => opt.label}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              popupIcon={null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by location"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    sx: { color: "#F6F4FE", bgcolor: "transparent" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "#F6F4FE" },
                    },
                  }}
                />
              )}
            />
          </Box>

          <Button
            fullWidth
            onClick={() => {
              handleSearch();
              handleStateChange("searchDrawerOpen", false);
            }}
            disabled={state.loading || state.isSearching}
            sx={{
              mt: 1,
              bgcolor: "#F6F4FE",
              color: "#2C2C2C",
              borderRadius: 50,
              py: 1.5,
              "&:hover": { bgcolor: "#F6F4FE", opacity: 0.9 },
            }}
          >
            {state.isSearching ? <CircularProgress size={20} sx={{ color: "#2C2C2C" }} /> : "Search"}
          </Button>
        </Drawer>

        {/* ==================== LIST / EMPTY / LOADING ==================== */}
        {state.loading && state.filteredBranches.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#777280" }} />
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
                      backgroundColor: "rgba(255,255,255,0.06)",
                      boxShadow: "0 1.272px 15.267px 0 rgba(0,0,0,0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      opacity: branch.isDeleted ? 0.7 : 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
                        <Box>
                          <IconButton
                            sx={{
                              backgroundColor: "rgba(255,255,255,0.06)",
                              color: "#777280",
                              display: "flex",
                              flexDirection: "column",
                              padding: "15px",
                              borderRadius: 1,
                            }}
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
                              backgroundColor: "rgba(255,255,255,0.06)",
                              color: "#777280",
                              padding: "8px",
                              borderRadius: 1,
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box>
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

        {/* ==================== MENU, EDIT, CONFIRM, MODAL ==================== */}
        <Menu
          anchorEl={state.anchorEl}
          open={Boolean(state.anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { "& .MuiMenuItem-root": { fontSize: isLargeScreen ? "0.875rem" : undefined } } }}
        >
          <MenuItem onClick={handleEditOpen} disabled={state.currentBranch?.isDeleted || state.currentBranch?.isHeadQuarter}>
            <MdOutlineEdit style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => showConfirmation("suspend")}
            disabled={state.loading || state.currentBranch?.isHeadQuarter || authData?.isSuperAdmin === false}
          >
            {state.currentBranch?.isActive ? (
              <>
                <BlockIcon sx={{ mr: 1 }} />
                {state.loading && state.actionType === "suspend" ? "Suspending..." : "Suspend"}
              </>
            ) : (
              <>
                <MdRefresh style={{ marginRight: 8 }} />
                {state.loading && state.actionType === "suspend" ? "Activating..." : "Activate"}
              </>
            )}
          </MenuItem>
          <MenuItem
            onClick={() => showConfirmation("delete")}
            disabled={state.loading || state.currentBranch?.isHeadQuarter || authData?.isSuperAdmin === false}
          >
            <AiOutlineDelete style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Dialog */}
        <Dialog open={state.editModalOpen} onClose={() => handleStateChange("editModalOpen", false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>Edit Branch</Typography>
              <IconButton onClick={() => handleStateChange("editModalOpen", false)}><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              {["name", "email", "phone", "address"].map((field) => (
                <TextField
                  key={field}
                  fullWidth
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  name={field}
                  value={state.editFormData[field as keyof typeof state.editFormData] ?? ""}
                  onChange={handleEditChange}
                  variant="outlined"
                  InputProps={{ sx: { color: "#F6F4FE" } }}
                  InputLabelProps={{ sx: { color: "#F6F4FE" } }}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditSubmit} variant="contained" disabled={state.loading}>
              {state.loading ? "Saving…" : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Modal */}
        <BranchModal
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshBranches}
        />

        {/* Confirmation Dialog */}
        <Dialog open={state.confirmModalOpen} onClose={() => handleStateChange("confirmModalOpen", false)} maxWidth="xs">
          <DialogTitle>
            {state.actionType === "delete"
              ? "Delete Branch"
              : state.currentBranch?.isActive
              ? "Suspend Branch"
              : "Activate Branch"}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {state.actionType === "delete"
                ? `Delete "${state.currentBranch?.name}"?`
                : ` ${state.currentBranch?.isActive ? "Suspend" : "Activate"} "${state.currentBranch?.name}"?`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleStateChange("confirmModalOpen", false)}>Cancel</Button>
            <Button onClick={handleConfirmedAction} color={state.actionType === "delete" ? "error" : "primary"} variant="contained" disabled={state.loading}>
              {state.loading ? "Processing…" : state.actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewBranches;