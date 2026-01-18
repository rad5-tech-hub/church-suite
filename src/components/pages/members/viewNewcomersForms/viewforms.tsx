import React, { useState, useEffect, useCallback } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import { Navigate } from "react-router-dom";
import {
  Box,
  Button,
  CardContent,
  Card,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
  Chip,
} from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { MdOutlineEdit } from "react-icons/md";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import Form from "../createNewcomersForm/form";
import { SiGoogleforms } from "react-icons/si";

interface Form {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  questions: {
    id: string;
    question: string;
    type: string;
    options: string[] | null;
    FollowUpFormQuestion: {
      order: number;
    };
  }[];
}

interface FetchFormsResponse {
  message: string;
  data: Form[];
}

interface State {
  forms: Form[];
  filteredForms: Form[];
  loading: boolean;
  error: string | null;
  isSearching: boolean;
  isModalOpen: boolean;
  currentForm: Form | null;
  anchorEl: HTMLElement | null;
  searchTerm: string;
}

const initialState: State = {
  forms: [],
  filteredForms: [],
  loading: false,
  error: null,
  isSearching: false,
  isModalOpen: false,
  currentForm: null,
  anchorEl: null,
  searchTerm: "",
};

const ViewForms: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  usePageToast("view-forms");
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

  const fetchForms = useCallback(
    async () => {
      if (!authData?.branchId) {
        showPageToast("Missing branch information. Please try again.", "error");
        return;
      }
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const response = await Api.get<FetchFormsResponse>(`/follow/all-forms?branchId=${authData?.branchId}`);
        const data = response.data;

        if (!data?.data) {
          throw new Error("Invalid response structure");
        }
        return data;
      } catch (error) {
        console.error("Failed to fetch forms:", error);
        handleStateChange("error", "Failed to load forms. Please try again later.");
        handleStateChange("loading", false);
        showPageToast("Failed to load forms", "error");
        throw error;
      }
    },
    [handleStateChange, authData]
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const response = await fetchForms();
        if (isMounted && response) {
          setState((prev) => ({
            ...prev,
            forms: response.data || [],
            filteredForms: response.data || [],
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
  }, [fetchForms, handleStateChange]);

  const handleMenuClose = () => handleStateChange("anchorEl", null);

  const handleEditOpen = () => {
    if (state.currentForm) {
      handleStateChange("isModalOpen", true);
    }
    handleMenuClose();
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
        color="var(--color-text-muted)"
        gutterBottom
        sx={{
          fontSize: isLargeScreen ? "1.25rem" : undefined,
        }}
      >
        No forms found <br />
        <span className="text-gray-600">Customize your newcomers form!</span>
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
          backgroundColor: "var(--color-text-primary)",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-primary)",
          "&:hover": {
            backgroundColor: "var(--color-text-primary)",
            opacity: 0.9,
          },
        }}
        aria-label="create new form"
      >
        Create New Form
      </Button>
    </Box>
  );

  if (authData?.isSuperAdmin === false) {
    return <Navigate to="/manage/view-admins" replace />;
  }

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
                fontSize: isLargeScreen ? "1.6rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[var(--color-text-primary)]">Forms</span>
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
              onClick={() => {
                handleStateChange("currentForm", null);
                handleStateChange("isModalOpen", true);
              }}
              size="medium"
              sx={{
                backgroundColor: "var(--color-text-primary)",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": {
                  backgroundColor: "var(--color-text-primary)",
                  opacity: 0.9,
                },
              }}
              aria-label="Create new form"
            >
              Create New Form
            </Button>
          </Grid>
        </Grid>

        {state.loading && state.filteredForms.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {state.error && !state.loading && state.filteredForms.length === 0 && <EmptyState />}

        {!state.loading && !state.error && state.filteredForms.length === 0 && <EmptyState />}

        {state.filteredForms.length > 0 && (
          <Grid container spacing={2}>
            {state.filteredForms.map((form) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={form.id}>
                <Card
                  sx={{
                    borderRadius: "10.267px",
                    backgroundColor: "var(--color-surface-glass)",
                    boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": {
                      backgroundColor: "var(--color-surface)",
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
                      <Box>
                        <IconButton
                          sx={{
                            backgroundColor: "var(--color-surface-glass)",
                            color: "var(--color-text-secondary)",
                            display: "flex",
                            flexDirection: "column",
                            padding: "10px",
                            borderRadius: 1,
                            textAlign: "center",
                          }}
                          aria-label={`Form icon for ${form.name}`}
                        >
                          <span className="border rounded-md border-[var(--color-border-glass)] p-1">
                            <SiGoogleforms size={28} />
                          </span>
                        </IconButton>
                      </Box>
                      <Box>
                        <IconButton
                          onClick={(e) => {
                            handleStateChange("currentForm", form);
                            handleStateChange("anchorEl", e.currentTarget);
                          }}
                          sx={{
                            backgroundColor: "var(--color-surface-glass)",
                            color: "var(--color-text-primary)",
                            padding: "8px",
                            borderRadius: 1,
                            textAlign: "center",
                          }}
                          aria-label={`More options for ${form.name}`}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box display="flex" flexDirection="column" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          sx={{
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {form.name}
                        </Typography>
                        <Chip
                          label={form.isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            backgroundColor: form.isActive ? "#4CAF50" : "#D32F2F",
                            color: "#FFFFFF",
                            fontSize: "0.75rem",
                            height: "24px",
                          }}
                        />
                      </Box>
                      {form.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {form.description}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Menu
          id="form-menu"
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
          <MenuItem onClick={handleEditOpen}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
        </Menu>

        <Form
          open={state.isModalOpen}
          onClose={() => {
            handleStateChange("isModalOpen", false);
            handleStateChange("currentForm", null);
          }}
          onSuccess={fetchForms}
          formId={state.currentForm?.id || undefined}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewForms;