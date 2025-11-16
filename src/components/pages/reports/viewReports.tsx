/* src/pages/reports/ViewReports.tsx */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";                 // <-- NEW
import DashboardManager from "../../shared/dashboardManager";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Grid,
  Tooltip,
  Avatar,
  Divider,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  CalendarToday,
  Comment,
  SentimentVeryDissatisfied as EmptyIcon,
} from "@mui/icons-material";
import { MdOutlineEdit } from "react-icons/md";
import moment from "moment";

import Api from "../../shared/api/api";
import { usePageToast } from "../../hooks/usePageToast";
import { showPageToast } from "../../util/pageToast";
import ReportModal from "./reports";

/* -------------------------- Types -------------------------- */
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
export interface Report {
  id: string;
  title: string;
  comments: string;
  file: File[];
  createdAt: string;
  creator: Creator;
}
export interface FetchReportsResponse {
  count: number;
  reports: Report[];
}

/* -------------------------- UI State -------------------------- */
interface UIState {
  reports: Report[];
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;
  anchorEl: HTMLElement | null;
  selectedId: string | null;               // <-- NEW – id of the report whose menu is open
}
const init: UIState = {
  reports: [],
  loading: false,
  error: null,
  isModalOpen: false,
  anchorEl: null,
  selectedId: null,
};

/* -------------------------- Component -------------------------- */
const ViewReports: React.FC = () => {
  usePageToast("view-reports");
  const theme = useTheme();
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const navigate = useNavigate();                         // <-- NEW

  const [s, setS] = useState<UIState>(init);

  const set = useCallback(
    <K extends keyof UIState>(k: K, v: UIState[K]) => setS((p) => ({ ...p, [k]: v })),
    []
  );

  /* -------------------------- API -------------------------- */
  const fetchReports = useCallback(async () => {
    set("loading", true);
    set("error", null);
    try {
      const { data } = await Api.get<FetchReportsResponse>("/tenants/get-report");
      if (!data?.reports) throw new Error("Invalid response – no reports");
      set("reports", data.reports);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to load reports.";
      set("error", msg);
      showPageToast(msg, "error");
    } finally {
      set("loading", false);
    }
  }, [set]);

  const refresh = () => fetchReports();

  /* Mount → fetch once */
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------- Menu -------------------------- */
  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    set("anchorEl", e.currentTarget);
    set("selectedId", id);
  };
  const closeMenu = () => {
    set("anchorEl", null);
    set("selectedId", null);
  };
  const goToDetails = () => {
    if (s.selectedId) navigate(`/reports/${s.selectedId}`);
    closeMenu();
  };

  /* -------------------------- UI Helpers -------------------------- */
  const openModal = () => set("isModalOpen", true);
  const closeModal = () => set("isModalOpen", false);

  const Empty = () => (
    <Box sx={{ textAlign: "center", py: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <EmptyIcon sx={{ fontSize: 60, color: "rgba(255,255,255,0.5)", mb: 2 }} />
      <Typography variant="h6" color="rgba(255,255,255,0.5)" gutterBottom>
        {s.error ? "Failed to load reports" : "No reports found"}
      </Typography>
      {s.error && (
        <Typography variant="body2" sx={{ color: "#ff6b6b", mb: 2 }}>
          {s.error}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={openModal}
        sx={{
          mt: 2,
          bgcolor: "#4d4d4e8e",
          "&:hover": { bgcolor: "#4d4d4e8e", opacity: 0.9 },
        }}
      >
        Write Report
      </Button>
    </Box>
  );

  /* -------------------------- Render -------------------------- */
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
                fontSize: isLg ? "1.5rem" : "1.25rem",
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
              onClick={openModal}
              sx={{
                bgcolor: "#4d4d4e8e",
                px: 3,
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "#F6F4FE",
                "&:hover": { bgcolor: "#777280", opacity: 0.9 },
              }}
            >
              Write Report
            </Button>
          </Grid>
        </Grid>

        {/* Loading */}
        {s.loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#777280" }} />
          </Box>
        )}

        {/* Empty / Error */}
        {!s.loading && (s.error || s.reports.length === 0) && <Empty />}

        {/* Reports Grid */}
        {s.reports.length > 0 && !s.loading && (
          <Grid container spacing={2}>
            {s.reports.map((r) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={r.id}>
                <Card
                  sx={{
                    borderRadius: "10px",
                    bgcolor: "rgba(255,255,255,0.05)",
                    boxShadow: "0 1.3px 15px rgba(0,0,0,0.1)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all .3s ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.1)",
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: "16px !important" }}>
                    {/* Title + Menu */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ color: "#F6F4FE", wordBreak: "break-word", flex: 1 }}
                      >
                        {r.title}
                      </Typography>

                      <Box>
                        <IconButton
                            onClick={(e) => openMenu(e, r.id)}
                            sx={{
                            bgcolor: "rgba(255,255,255,0.06)",
                            color: "#F6F4FE",
                            p: "6px",
                            borderRadius: 1,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Comments */}
                    {r.comments && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2 }}>
                        <Comment sx={{ color: "rgba(255,255,255,0.5)", fontSize: 16, mt: 0.3 }} />
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.5, wordBreak: "break-word" }}
                        >
                          {(() => {
                            const words = r.comments.split(" ");
                            return words.length > 50 ? `${words.slice(0, 50).join(" ")}...` : r.comments;
                          })()}
                        </Typography>
                      </Box>
                    )}

                    {/* File count */}
                    {r.file?.length > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                        <Tooltip title={`${r.file.length} file${r.file.length > 1 ? "s" : ""}`}>
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.3)" }}>
                            file: {r.file.length}
                          </Typography>
                        </Tooltip>
                      </Box>
                    )}

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

                    {/* Creator */}
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
                        {r.creator.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </Avatar>

                      <Box>
                        <Typography variant="body2" sx={{ color: "#F6F4FE", fontWeight: 500 }}>
                          {r.creator.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                          {r.creator.email}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Date */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarToday sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }} />
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {moment(r.createdAt).format("MMM DD, YYYY [at] h:mm A")}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* More Menu – navigates to details */}
        <Menu
          anchorEl={s.anchorEl}
          open={Boolean(s.anchorEl)}
          onClose={closeMenu}
          PaperProps={{
            sx: {
              bgcolor: "#2C2C2C",
              color: "#F6F4FE",
              "& .MuiMenuItem-root": {
                fontSize: isLg ? "0.875rem" : "0.8rem",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              },
            },
          }}
        >
          <MenuItem onClick={goToDetails}>
            <MdOutlineEdit style={{ marginRight: 8 }} />
            View Details
          </MenuItem>
        </Menu>

        {/* Write Report Modal */}
        <ReportModal open={s.isModalOpen} onClose={closeModal} onSuccess={refresh} />
      </Box>
    </DashboardManager>
  );
};

export default ViewReports;