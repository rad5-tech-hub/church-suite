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
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { 
  // MoreVert as MoreVertIcon,
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
}

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

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading?: boolean;
}

interface State {
  collections: Collections[];
  fillteredCollection: Collections[];
  pagination: Pagination;
  currentPage: number;
  pageHistory: string[];
  loading: boolean;
  error: string | null;
  editModalOpen: boolean;
  confirmModalOpen: boolean;
  isModalOpen: boolean;
  currentBranch: Collections | null;
  actionType: string | null;
  anchorEl: HTMLElement | null;
  editFormData: Partial<Pick<Collections, "name" | 'description'>>;
}

const initialState: State = {
  fillteredCollection: [],
  collections: [],
  pagination: {
    hasNextPage: false,
    nextCursor: null,
    nextPage: null,
  },
  currentPage: 1,
  pageHistory: [],
  loading: false,
  error: null,
  editModalOpen: false,
  confirmModalOpen: false,
  isModalOpen: false,
  currentBranch: null,
  actionType: null,
  anchorEl: null,
  editFormData: {
    name: "",
    description: "",
  },
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

const ViewCollections: React.FC = () => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
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

  const fetchCollections = useCallback(
    async (url?: string) => {
      handleStateChange("loading", true);
      handleStateChange("error", null);

      try {
        let finalUrl = url || "/church/get-collection-attributes";

        // ✅ If role is "department", use new route with params
        if (authData?.role === "department") {
          const params = new URLSearchParams();
          
          if (authData?.department) params.append("departmentId", authData.department);

          finalUrl = `/church/get-all-collections/${authData.branchId}?${params.toString()}`;
        }

        const response = await Api.get<FetchCollectionsResponse>(finalUrl);
        const data = response.data;

        if (!data?.collections) {
          throw new Error("Invalid response structure");
        }

        return data;
      } catch (error: any) {
        console.error("Failed to fetch Collections:", error?.response?.data?.error?.message);
        const errorMessage = error?.response?.data?.error?.message || "Failed to load collections";

        handleStateChange("error", `${errorMessage}, Please try again later.`);
        showPageToast(errorMessage, "error");
        throw error;
      } finally {
        handleStateChange("loading", false);
      }
    },
    [authData?.role, authData?.branchId, authData?.department, handleStateChange]
  );


  const refreshCollections = useCallback(async () => {
    try {
      const response = await fetchCollections();
      const data = response as unknown as FetchCollectionsResponse;
      setState((prev) => ({
        ...prev,
        fillteredCollection: data.collections || [],
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
    } catch (error) {
      handleStateChange("loading", false);
    }
  }, [fetchCollections, handleStateChange]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const response = await fetchCollections();
        const data = response as unknown as FetchCollectionsResponse;
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            collections: data.collections || [],
            fillteredCollection: data.collections || [],         
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
  }, [fetchCollections, handleStateChange]);

  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        if (direction === "next") {
          const url = state.pagination.nextPage;
          if (!url) throw new Error("No next page available");
          const response =  await fetchCollections(url);

          const data = response as FetchCollectionsResponse;
          setState((prev) => ({
            ...prev,
            fillteredCollection: data.collections || [],
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
          const response = await fetchCollections(url);

          const data = response as FetchCollectionsResponse;
          setState((prev) => ({
            ...prev,
            fillteredCollection: data.collections || [],
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
    [state.pagination.nextPage, state.pageHistory,  fetchCollections, handleStateChange]
  );

  const handleMenuClose = () => handleStateChange("anchorEl", null);

  const handleEditOpen = () => {
    if (state.currentBranch) {
      handleStateChange("editFormData", {
        name: state.currentBranch.name,
        description: state.currentBranch.description,});
      handleStateChange("editModalOpen", true);
    }
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
        collections: prev.collections.map((collection) =>
          collection.id === prev.currentBranch!.id ? { ...collection, ...payload } : collection
        ),
        fillteredCollection: prev.fillteredCollection.map((collection) =>
          collection.id === prev.currentBranch!.id ? { ...collection, ...payload } : collection
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
        sx={{
          fontSize: isLargeScreen ? "1.25rem" : undefined,
        }}
      >
        No Collection found
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
        aria-label="Create new Collection"
      >
        Create New Collection
      </Button>
    </Box>
  );

  // if (authData?.isHeadQuarter === false) {
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
                fontSize: isLargeScreen ? "1.4rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Finance</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]"> Collections</span>
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
              Create Collection
            </Button>
          </Grid>
        </Grid>

        {state.loading && state.fillteredCollection.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {state.error && !state.loading && state.fillteredCollection.length === 0 && <EmptyState />}

        {!state.loading && !state.error && state.fillteredCollection.length === 0 && <EmptyState />}

        {state.fillteredCollection.length > 0 && (
          <>
            <Grid container spacing={2}>
              {state.fillteredCollection.map((collection) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={collection.id}>
                  <Card
                    sx={{
                      borderRadius: "10.267px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",                    
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
                            aria-label={`Branch icon for ${collection.name}`}
                          >
                            <span className="border-2 rounded-md border-[#777280] p-1">
                              <FaBoxTissue size={30} />
                            </span>
                          </IconButton>
                        </Box>
                        {/* <Box>
                          <IconButton
                            onClick={(e) => {
                              handleStateChange("currentBranch", collection);
                              handleStateChange("anchorEl", e.currentTarget);
                            }}
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#777280",
                              padding: "8px",
                              borderRadius: 1,
                              textAlign: "center",
                            }}
                            aria-label={`More options for ${collection.name}`}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box> */}
                      </Box>
                      <Box display="flex" flexDirection="column" justifyContent="space-between" alignItems="flex-start">
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{
                            color: "#E1E1E1",
                          }}                          
                        >
                          {collection.name}
                        </Typography>
                      </Box>
                      <Box mt={2}>
                        {collection.description && (
                          <Box mb={1}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#777280",
                                width: "100%",
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                                overflow: "hidden",
                                lineHeight: 1.4,
                                wordBreak: "break-word",        // ✅ Forces word breaking
                                overflowWrap: "break-word",     // ✅ Modern word breaking
                                hyphens: "auto",                // ✅ Adds hyphens for long words
                                textOverflow: "ellipsis",       // ✅ Fallback for ellipsis
                              }}
                              title={collection.description}
                            >
                              {collection.description}
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

        <CreateCollection 
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshCollections}
        />

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
          >
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
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
      </Box>
    </DashboardManager>
  );
};

export default ViewCollections;