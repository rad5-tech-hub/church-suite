/* src/pages/reports/viewAReport.tsx */
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  CalendarToday,
  Comment,
  Reply,
  ArrowBack,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import Api from "../../shared/api/api";
import { showPageToast } from "../../util/pageToast";
import DashboardManager from "../../shared/dashboardManager";

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
  responseComments: string | null;
  file: File[] | null; // ← Allow null
  createdAt: string;
  creator: Creator;
}

const ReportDetail: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const { data } = await Api.get<Report>(`/tenants/get-report/${reportId}`);
        setReport(data);
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setError(true);
        showPageToast("Failed to load report", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardManager>
        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "#777280" }} />
        </Box>
      </DashboardManager>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Error / Not Found
  // ─────────────────────────────────────────────────────────────
  if (error || !report) {
    return (
      <DashboardManager>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            Report not found
          </Typography>
          <Button onClick={() => navigate(-1)} variant="outlined" sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Box>
      </DashboardManager>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Safe access: file is null → treat as []
  // ─────────────────────────────────────────────────────────────
  const files = report.file || [];

  // ─────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────
  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{
              color: "var(--color-text-primary)",
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            Report Details
          </Typography>
          <Button
            onClick={() => navigate(-1)}
            variant="outlined"
            sx={{
              color: "var(--color-primary)",
              backgroundColor: "var(--color-text-primary)",
              display: 'flex',
              gap: 1,
              textTransform: "none",
              "&:hover": { borderColor: "var(--color-border-glass)", bgcolor: "var(--color-text-primary)" },
            }}
          >
            <ArrowBack/> Back to List
          </Button>
        </Box>

        <Paper
          sx={{
            bgcolor: "var(--color-surface-glass)",
            border: "1px solid var(--color-border-glass)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* Title + File Count */}
          <Box sx={{ p: 3, borderBottom: "1px solid var(--color-border-glass)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  color: "var(--color-text-primary)",
                  wordBreak: "break-word",
                  flex: 1,
                }}
              >
                {report.title}
              </Typography>
              {files.length > 0 && (
                <Chip
                  icon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                  label={`${files.length} file${files.length > 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(33, 150, 243, 0.2)",
                    color: "#2196F3",
                    fontWeight: "bold",
                  }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Creator + Date */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: "var(--color-text-primary)",
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
                    <Typography variant="body1" sx={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                      {report.creator.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--color-text-secondary)" }}>
                      {report.creator.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                  <CalendarToday sx={{ color: "var(--color-text-primary)", fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: "var(--color-text-secondary)" }}>
                    {moment(report.createdAt).format("MMMM DD, YYYY [at] h:mm A")}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

              {/* Comments */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Comment sx={{ color: "var(--color-text-primary)", fontSize: 20, mt: 0.5 }} />
                  <Box flex={1}>
                    <Typography variant="subtitle2" sx={{ color: "var(--color-text-primary)", mb: 1 }}>
                      Report Summary
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {report.comments || (
                        <Typography component="span" sx={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          No comments provided
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Response Comments */}
              {report.responseComments && (
                <>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Reply sx={{ color: "#4CAF50", fontSize: 20, mt: 0.5 }} />
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ color: "#4CAF50", mb: 1 }}>
                          Response from Admin
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {report.responseComments}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              )}

              {/* Files */}
              {files.length > 0 && (
                <>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "var(--color-text-primary)", mb: 2 }}>
                      Attached Files ({files.length})
                    </Typography>
                    <Stack spacing={2}>
                      {files.map((file, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            bgcolor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          {/* File Icon */}
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor:
                                file.fileType.includes("image")
                                  ? "rgba(33, 150, 243, 0.2)"
                                  : file.fileType.includes("pdf")
                                  ? "rgba(244, 67, 54, 0.2)"
                                  : "rgba(255, 193, 7, 0.2)",
                              borderRadius: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {file.fileType.includes("image") ? (
                              <img
                                src={file.url}
                                alt={file.fileName}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <Typography
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: "bold",
                                  color:
                                    file.fileType.includes("pdf")
                                      ? "#F44336"
                                      : file.fileType.includes("document")
                                      ? "#FFC107"
                                      : "#777280",
                                }}
                              >
                                {file.fileType.includes("pdf")
                                  ? "PDF"
                                  : file.fileType.includes("document")
                                  ? "DOC"
                                  : "FILE"}
                              </Typography>
                            )}
                          </Box>

                          {/* File Info */}
                          <Box flex={1} minWidth={0}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "var(--color-text-primary)",
                                fontWeight: 500,
                                wordBreak: "break-all",
                              }}
                            >
                              {file.fileName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                              {formatFileSize(file.size)} • {file.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                            </Typography>
                          </Box>

                          {/* Download */}
                          <Tooltip title="Download">
                            <IconButton
                              component="a"
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: "var(--color-text-primary)",
                                "&:hover": { bgcolor: "var(--color-surface-glass)" },
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </DashboardManager>
  );
};

export default ReportDetail;