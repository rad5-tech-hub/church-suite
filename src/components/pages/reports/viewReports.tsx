import React, { useState, useEffect, useCallback } from "react";
import DashboardManager from "../../shared/dashboardManager";
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
  CircularProgress,
  Grid,
  Chip,
  Tooltip,
  Avatar,
  Divider,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  CalendarToday,
  Comment,
} from "@mui/icons-material";
import { MdOutlineEdit } from "react-icons/md";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import moment from "moment";
import Api from "../../shared/api/api";
import { usePageToast } from "../../hooks/usePageToast";
import { showPageToast } from "../../util/pageToast";
import ReportModal from "./reports";

interface File {
  url: string;
  size: number;
  fileName: string;
  fileType: string;
}

interface Creator {
  id: string;
  name: string;
  email: string;
}

interface Report {
  id: string;
  title: string;
  comments: string;
  file: File[];
  createdAt: string;
  creator: Creator;
}

interface FetchReportsResponse {
  count: number;
  reports: Report[];
}

interface State {
  reports: Report[];
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;
  anchorEl: HTMLElement | null;
}

const initialState: State = {
  reports: [],
  loading: false,
  error: null,
  isModalOpen: false,
  anchorEl: null,
};

const ViewReports: React.FC = () => {
  usePageToast("view-reports");
  const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [state, setState] = useState<State>(initialState);

  const handleStateChange = useCallback(
    <K extends keyof State>(key: K, value: State[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const fetchReports = useCallback(async () => {
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      const response = await Api.get<FetchReportsResponse>("/tenants/get-report");
      const data = response.data;
      if (!data?.reports) throw new Error("Invalid response");
      handleStateChange("reports", data.reports);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      handleStateChange("error", "Failed to load reports.");
      showPageToast("Failed to load reports", "error");
    } finally {
      handleStateChange("loading", false);
    }
  }, [handleStateChange]);

  const refreshReports = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      handleStateChange("loading", true);
      try {
        const response = await Api.get<FetchReportsResponse>("/tenants/get-report");
        if (mounted) {
          handleStateChange("reports", response.data.reports || []);
        }
      } catch {
        if (mounted) {
          handleStateChange("error", "Failed to load reports.");
          showPageToast("Failed to load reports", "error");
        }
      } finally {
        if (mounted) handleStateChange("loading", false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [handleStateChange]);

  const handleMenuClose = () => handleStateChange("anchorEl", null);

  const EmptyState = () => (
    <Box sx={{ textAlign: "center", py: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <EmptyIcon sx={{ fontSize: 60, color: "rgba(255,255,255,0.5)", mb: 2 }} />
      <Typography variant="h6" color="rgba(255,255,255,0.5)" gutterBottom>
        No reports found
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mb: 2 }}>
        Start by submitting your first report
      </Typography>
      <Button
        variant="contained"
        onClick={() => handleStateChange("isModalOpen", true)}
        sx={{
          mt: 2,
          backgroundColor: "#4d4d4e8e",
          "&:hover": { backgroundColor: "#4d4d4e8e", opacity: 0.9 },
        }}
      >
        Write Report
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 5, alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="h5"
              fontWeight={600}
              sx={{
                color: "#F6F4FE",
                fontSize: isLargeScreen ? "1.5rem" : "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Report Histories
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={() => handleStateChange("isModalOpen", true)}
              sx={{
                backgroundColor: "#4d4d4e8e",
                px: 3,
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "#F6F4FE",
                "&:hover": { backgroundColor: "#777280", opacity: 0.9 },
              }}
            >
              Write Report
            </Button>
          </Grid>
        </Grid>

        {/* Loading */}
        {state.loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#777280" }} />
          </Box>
        )}

        {/* Error or Empty */}
        {(state.error || state.reports.length === 0) && !state.loading && <EmptyState />}

        {/* Reports Grid */}
        {state.reports.length > 0 && !state.loading && (
          <Grid container spacing={2}>
            {state.reports.map((report) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={report.id}>
                <Card
                    sx={{
                        borderRadius: "10px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        boxShadow: "0 1.3px 15px rgba(0,0,0,0.1)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s ease",
                        "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.1)",
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                        },
                    }}
                >
                <CardContent sx={{ flexGrow: 1, pb: "16px !important" }}>
                    {/* Header: Title + File Badge + Menu */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        {/* Title + File Badge */}
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                            color: "#F6F4FE",
                            wordBreak: "break-word",
                            flex: 1,
                            }}
                        >
                            {report.title}
                        </Typography>

                        {report.file.length > 0 && (
                            <Tooltip title={`${report.file.length} file${report.file.length > 1 ? "s" : ""}`}>
                            <Chip
                                icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                                label={report.file.length}
                                size="small"
                                sx={{
                                bgcolor: "rgba(33, 150, 243, 0.2)",
                                color: "#2196F3",
                                fontWeight: "bold",
                                height: 24,
                                }}
                            />
                            </Tooltip>
                        )}
                        </Box>

                        {/* Comments */}
                        {report.comments && (
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Comment sx={{ color: "rgba(255,255,255,0.5)", fontSize: 16, mt: 0.3 }} />
                            <Typography
                            variant="body2"
                            sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.5, wordBreak: "break-word" }}
                            >
                            {report.comments}
                            </Typography>
                        </Box>
                        )}
                    </Box>

                    {/* Menu Icon */}
                        <Box>
                            <IconButton
                                onClick={(e) => handleStateChange("anchorEl", e.currentTarget)}
                                sx={{
                                backgroundColor: "rgba(255,255,255,0.06)",
                                color: "#F6F4FE",
                                padding: "6px",
                                borderRadius: 1,
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                                }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

                    {/* Creator Info */}
                    <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "rgba(255,255,255,0.1)",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                        }}
                        >
                        {report.creator.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </Avatar>

                        <Box>
                        <Typography variant="body2" sx={{ color: "#F6F4FE", fontWeight: 500 }}>
                            {report.creator.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                            {report.creator.email}
                        </Typography>
                        </Box>
                    </Box>

                    {/* Date */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarToday sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }} />
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {moment(report.createdAt).format("MMM DD, YYYY [at] h:mm A")}
                        </Typography>
                    </Box>
                    </Box>
                </CardContent>
                </Card>

              </Grid>
            ))}
          </Grid>
        )}

        {/* More Menu */}
        <Menu
          anchorEl={state.anchorEl}
          open={Boolean(state.anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              bgcolor: "#2C2C2C",
              color: "#F6F4FE",
              "& .MuiMenuItem-root": {
                fontSize: isLargeScreen ? "0.875rem" : "0.8rem",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              },
            },
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <MdOutlineEdit style={{ marginRight: 8 }} />
            View Details
          </MenuItem>
        </Menu>

        {/* Write Report Modal */}
        <ReportModal
          open={state.isModalOpen}
          onClose={() => handleStateChange("isModalOpen", false)}
          onSuccess={refreshReports}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewReports;