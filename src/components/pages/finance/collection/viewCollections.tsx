import React, { useState, useEffect, useCallback } from "react";
import DashboardManager from "../../../shared/dashboardManager";
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
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import {
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
  Close,
} from "@mui/icons-material";
import { MdOutlineEdit } from "react-icons/md";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import CreateCollection from "./createCollections";
import { FaBoxTissue } from "react-icons/fa";

interface Collections {
  id: string;
  name: string;
  description: string;
  scopeType?: "church" | "branch" | "department";
  branchId?: string;
  departmentId?: string;
}

/* ---------- Pagination & API types ---------- */
interface Pagination {
  hasNextPage: boolean;
  nextCursor: string | null;
  nextPage: string | null;
}
interface FetchCollectionsResponse {
  message: string;
  pagination: Pagination;
  collections: Collections[];
}

/* ---------- Branch / Department fetch types ---------- */
interface Branch {
  id: string;
  name: string;
}
interface Department {
  id: string;
  name: string;
}
interface FetchBranchesResponse {
  branches: Branch[];
}
interface FetchDepartmentsResponse {
  departments: Department[];
}

/* ---------- State ---------- */
interface State {
  collections: Collections[];
  filteredCollection: Collections[];
  pagination: Pagination;
  currentPage: number;
  pageHistory: string[];
  loading: boolean;
  error: string | null;
  editModalOpen: boolean;
  confirmModalOpen: boolean;
  isModalOpen: boolean;
  currentCollection: Collections | null;
  actionType: string | null;
  anchorEl: HTMLElement | null;

  /* edit form */
  editFormData: Partial<
    Pick<Collections, "name" | "description" | "scopeType" | "branchId" | "departmentId">
  >;

  /* level-dependent selects */
  branches: Branch[];
  departments: Department[];
  loadingBranches: boolean;
  loadingDepartments: boolean;
}

const initialState: State = {
  filteredCollection: [],
  collections: [],
  pagination: { hasNextPage: false, nextCursor: null, nextPage: null },
  currentPage: 1,
  pageHistory: [],
  loading: false,
  error: null,
  editModalOpen: false,
  confirmModalOpen: false,
  isModalOpen: false,
  currentCollection: null,
  actionType: null,
  anchorEl: null,
  editFormData: { name: "", description: "", scopeType: "church" },
  branches: [],
  departments: [],
  loadingBranches: false,
  loadingDepartments: false,
};

/* ---------- Custom Pagination (unchanged) ---------- */
interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading?: boolean;
}
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

/* ---------- Main Component ---------- */
const ViewCollections: React.FC = () => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  usePageToast("view-branch");
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

  /* ---------- FETCH COLLECTIONS (unchanged) ---------- */
  const fetchCollections = useCallback(
    async (url?: string) => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        let finalUrl = url || "/church/get-collection-attributes";

        if (authData?.role === "department") {
          const params = new URLSearchParams();
          if (authData?.department) params.append("departmentId", authData.department);
          finalUrl = `/church/get-all-collections/${authData.branchId}?${params.toString()}`;
        }

        const response = await Api.get<FetchCollectionsResponse>(finalUrl);
        return response.data;
      } catch (error: any) {
        const msg = error?.response?.data?.error?.message || "Failed to load collections";
        handleStateChange("error", `${msg}, Please try again later.`);
        showPageToast(msg, "error");
        throw error;
      } finally {
        handleStateChange("loading", false);
      }
    },
    [authData?.role, authData?.branchId, authData?.department, handleStateChange]
  );

  const refreshCollections = useCallback(async () => {
    try {
      const data = await fetchCollections();
      setState((prev) => ({
        ...prev,
        filteredCollection: data.collections || [],
        collections: data.collections || [],
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
  }, [fetchCollections, handleStateChange]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      handleStateChange("loading", true);
      try {
        const data = await fetchCollections();
        if (mounted) {
          setState((prev) => ({
            ...prev,
            collections: data.collections || [],
            filteredCollection: data.collections || [],
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
    return () => {
      mounted = false;
    };
  }, [fetchCollections, handleStateChange]);

  /* ---------- Pagination (unchanged) ---------- */
  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      try {
        let url: string | undefined;
        if (direction === "next") {
          url = state.pagination.nextPage ?? undefined;
        } else {
          const hist = state.pageHistory;
          const idx = hist.length - 2;
          url = idx >= 0 ? hist[idx] : undefined;
        }
        if (!url) throw new Error("No page URL");
        const data = await fetchCollections(url);
        setState((prev) => ({
          ...prev,
          filteredCollection: data.collections || [],
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
      } catch {
        handleStateChange("error", "Failed to load page");
        handleStateChange("loading", false);
        showPageToast("Failed to load page", "error");
      }
    },
    [state.pagination.nextPage, state.pageHistory, fetchCollections, handleStateChange]
  );

  /* ---------- FETCH BRANCHES (for edit) ---------- */
  const fetchBranches = useCallback(async () => {
    handleStateChange("loadingBranches", true);
    try {
      const resp = await Api.get<FetchBranchesResponse>("/church/get-branches");
      handleStateChange("branches", resp.data.branches);
    } catch (err) {
      showPageToast("Failed to load branches", "error");
    } finally {
      handleStateChange("loadingBranches", false);
    }
  }, [handleStateChange]);

  /* ---------- FETCH DEPARTMENTS (for edit) ---------- */
  const fetchDepartments = useCallback(
    async (branchId: string) => {
      handleStateChange("loadingDepartments", true);
      try {
        const resp = await Api.get<FetchDepartmentsResponse>(
          `/church/get-departments?branchId=${branchId}`
        );
        handleStateChange("departments", resp.data.departments);
      } catch (err) {
        showPageToast("Failed to load departments", "error");
      } finally {
        handleStateChange("loadingDepartments", false);
      }
    },
    [handleStateChange]
  );

  /* ---------- MENU & EDIT OPEN ---------- */
  const handleMenuClose = () => handleStateChange("anchorEl", null);

  const handleEditOpen = async () => {
    if (!state.currentCollection) return;

    // Populate form
    handleStateChange("editFormData", {
      name: state.currentCollection.name,
      description: state.currentCollection.description,
      scopeType: state.currentCollection.scopeType,
      branchId: state.currentCollection.branchId,
      departmentId: state.currentCollection.departmentId,
    });

    // Load branches if needed
    if (state.currentCollection.scopeType !== "church") await fetchBranches();

    // Load departments if level = department
    if (state.currentCollection.scopeType === "department" && state.currentCollection.branchId) {
      await fetchDepartments(state.currentCollection.branchId);
    }

    handleStateChange("editModalOpen", true);
    handleMenuClose();
  };

  /* ---------- FORM HANDLERS ---------- */
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleStateChange("editFormData", { ...state.editFormData, [name]: value });
  };

  const handleScopeChange = (event: SelectChangeEvent<"church" | "branch" | "department">) => {
    handleStateChange("editFormData", {
      ...state.editFormData,
      scopeType: event.target.value as "church" | "branch" | "department",
    });
  };


  const handleBranchChange = async (e: SelectChangeEvent) => {
    const branchId = e.target.value;
    handleStateChange("editFormData", {
      ...state.editFormData,
      branchId,
      departmentId: undefined,
    });

    if (state.editFormData.scopeType === "department") {
      await fetchDepartments(branchId);
    }
  };

  const handleDepartmentChange = (e: SelectChangeEvent) => {
    handleStateChange("editFormData", {
      ...state.editFormData,
      departmentId: e.target.value,
    });
  };

  const handleEditSubmit = async () => {
    if (!state.currentCollection?.id) return;

    try {
      handleStateChange("loading", true);

      const original = state.currentCollection;

      const payload: any = {};

      if (state.editFormData.name !== original.name)
        payload.name = state.editFormData.name;

      if (state.editFormData.description !== original.description)
        payload.description = state.editFormData.description;

      if (state.editFormData.scopeType !== original.scopeType)
        payload.scopeType = state.editFormData.scopeType;

      let url = `/church/edit-collection/${state.currentCollection.id}`;
      const params = new URLSearchParams();

      // 🔥 Add params instead of body based on scopeType
      if (state.editFormData.scopeType === "branch") {
        params.append("branchId", state.editFormData.branchId as string);
      }

      if (state.editFormData.scopeType === "department") {
        params.append("branchId", state.editFormData.branchId as string);
        params.append("departmentId", state.editFormData.departmentId as string);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      await Api.patch(url, payload);

      showPageToast("Collection updated successfully!", "success");
      handleStateChange("editModalOpen", false);
      handleStateChange("currentCollection", null);
      refreshCollections();
    } catch (err) {
      showPageToast("Failed to update collection!", "error");
    } finally {
      handleStateChange("loading", false);
    }
  };


  /* ---------- EMPTY STATE ---------- */
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
      <FaBoxTissue size={60} color="rgba(255, 255, 255, 0.5)" style={{ marginBottom: 16 }} />
      <Typography
        variant="h6"
        color="rgba(255, 255, 255, 0.5)"
        gutterBottom
        sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}
      >
        No Collection found
      </Typography>
      {state.error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {state.error}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => handleStateChange("isModalOpen", true)}
        sx={{
          backgroundColor: "#363740",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
        }}
      >
        Create New Collection
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant={isMobile ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.4rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Finance</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Collections</span>
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
              }}
            >
              Create Collection
            </Button>
          </Grid>
        </Grid>

        {/* Loading / Empty */}
        {state.loading && state.filteredCollection.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}
        {state.error && !state.loading && state.filteredCollection.length === 0 && <EmptyState />}
        {!state.loading && !state.error && state.filteredCollection.length === 0 && <EmptyState />}

        {/* Collections Grid */}
        {state.filteredCollection.length > 0 && (
          <>
            <Grid container spacing={2}>
              {state.filteredCollection.map((collection) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={collection.id}>
                  <Card
                    sx={{
                      borderRadius: "10.267px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                        <Box>         
                          <IconButton
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              padding: "15px",
                              borderRadius: 1,
                            }}
                          >
                            <span className="border-2 rounded-md border-[#777280] p-1">
                              <FaBoxTissue size={30} />
                            </span>
                          </IconButton>
                        </Box> 

                        <Box>
                          <IconButton
                            onClick={(e) => {
                              handleStateChange("currentCollection", collection);
                              handleStateChange("anchorEl", e.currentTarget);
                            }}
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              padding: "8px",
                              borderRadius: 1,
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ color: "#E1E1E1", display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {collection.name}
                        
                        <Box
                          sx={{
                            backgroundColor: "#533483",        // Purple badge
                            color: "#FFFFFF",
                            fontSize: "0.65rem",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            letterSpacing: 0.3,
                            textTransform: "uppercase",
                          }}
                        >
                          {collection.scopeType}
                        </Box>
                      </Typography>

                      {collection.description && (
                        <Box mt={2}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#777280",
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                              lineHeight: 1.4,
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              hyphens: "auto",
                              textOverflow: "ellipsis",
                            }}
                            title={collection.description}
                          >
                            {collection.description}
                          </Typography>
                        </Box>
                      )}
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

        {/* Create Modal */}
        <CreateCollection
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshCollections}
        />

        {/* More-Vert Menu */}
        <Menu
          anchorEl={state.anchorEl}
          open={Boolean(state.anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { "& .MuiMenuItem-root": { fontSize: isLargeScreen ? "0.875rem" : undefined } } }}
        >
          <MenuItem onClick={handleEditOpen}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
        </Menu>

        {/* EDIT DIALOG */}
        <Dialog
          open={state.editModalOpen}
          onClose={() => {
            handleStateChange("editModalOpen", false);
            handleStateChange("currentCollection", null);
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
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Edit Collection
              </Typography>
              <IconButton
                onClick={() => {
                  handleStateChange("editModalOpen", false);
                  handleStateChange("currentCollection", null);
                }}
              >
                <Close className="text-gray-300" />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Name */}
              <TextField
                fullWidth
                label="Collection Name"
                name="name"
                value={state.editFormData.name ?? ""}
                onChange={handleEditChange}
                variant="outlined"
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  },
                }}
                InputLabelProps={{ sx: { color: "#F6F4FE" } }}
              />

              {/* Level */}
              <FormControl fullWidth variant="outlined">
                <InputLabel sx={{ color: "#F6F4FE" }}>Scope</InputLabel>

                <Select<"church" | "branch" | "department">
                  value={state.editFormData.scopeType ?? ""}
                  label="Scope"
                  onChange={handleScopeChange}
                  sx={{
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "& .MuiSvgIcon-root": { color: "#F6F4FE" },
                  }}
                >
                  <MenuItem value="church">Church</MenuItem>
                  <MenuItem value="branch">Branch</MenuItem>
                  <MenuItem value="department">Department</MenuItem>
                </Select>
              </FormControl>


              {/* Branch (shown for branch / department) */}
              {(state.editFormData.scopeType === "branch" || state.editFormData.scopeType === "department") && (
                <FormControl fullWidth variant="outlined">
                  <InputLabel sx={{ color: "#F6F4FE" }}>
                    {state.loadingBranches ? "Loading…" : "Branch"}
                  </InputLabel>
                  <Select
                    value={state.editFormData.branchId ?? ""}
                    onChange={handleBranchChange}
                    label={state.loadingBranches ? "Loading…" : "Branch"}
                    disabled={state.loadingBranches}
                    sx={{
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "& .MuiSvgIcon-root": { color: "#F6F4FE" },
                    }}
                  >
                    {state.branches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {state.loadingBranches && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </FormControl>
              )}

              {/* Department (shown only for department) */}
              {state.editFormData.scopeType === "department" && (
                <FormControl fullWidth variant="outlined">
                  <InputLabel sx={{ color: "#F6F4FE" }}>
                    {state.loadingDepartments ? "Loading…" : "Department"}
                  </InputLabel>
                  <Select
                    value={state.editFormData.departmentId ?? ""}
                    onChange={handleDepartmentChange}
                    label={state.loadingDepartments ? "Loading…" : "Department"}
                    disabled={state.loadingDepartments || !state.editFormData.branchId}
                    sx={{
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "& .MuiSvgIcon-root": { color: "#F6F4FE" },
                    }}
                  >
                    {state.departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {state.loadingDepartments && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </FormControl>
              )}

              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={state.editFormData.description ?? ""}
                onChange={handleEditChange}
                multiline
                rows={4}
                variant="outlined"
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  },
                }}
                InputLabelProps={{ sx: { color: "#F6F4FE" } }}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={handleEditSubmit}
              disabled={state.loading}
              sx={{
                py: 1,
                backgroundColor: "#F6F4FE",
                px: { xs: 6, sm: 2 },
                borderRadius: 50,
                color: "#2C2C2C",
                fontWeight: "semibold",
                textTransform: "none",
                "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
              }}
            >
              {state.loading ? "Saving…" : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewCollections;