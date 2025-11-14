import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormHelperText,
  Chip,
} from "@mui/material";
import { Close, AttachFile, Title as TitleIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import Api from "../../shared/api/api";
import { showPageToast } from "../../util/pageToast";
import { usePageToast } from "../../hooks/usePageToast";
import { RootState } from "../../reduxstore/redux";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ open, onClose, onSuccess }) => {
  const authData = useSelector((state: RootState) => state.auth?.authData);

  const [title, setTitle] = useState("");
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ title: "", files: "" });

  usePageToast("write-report");

  // Extract from auth
  const churchId = authData?.churchId;
  const branchId = authData?.branchId;
  const role = authData?.role;
  const departmentId = role === "department" ? authData?.department : undefined;

  // Validation
  const validate = () => {
    const newErrors = { title: "", files: "" };
    if (!title.trim()) newErrors.title = "Report title is required";
    else if (title.trim().length > 200) newErrors.title = "Title too long (max 200 chars)";
    setErrors(newErrors);
    return !newErrors.title;
  };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);

        // Combine old + new files
        const combined = [...files, ...selected];

        // Limit to 3 files
        if (combined.length > 10) {
            setErrors((prev) => ({
            ...prev,
            files: "Max 10 files allowed",
            }));
            return;
        }

        setFiles(combined);
        setErrors((prev) => ({ ...prev, files: "" }));

        // Reset input value so user can re-select same file again if needed
        e.target.value = "";
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!churchId || !branchId) {
      showPageToast("Missing church or branch info. Please log in again.", "error");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    // Required
    formData.append("title", title.trim());
    formData.append("comments", comments.trim());
    formData.append("churchId", churchId);
    formData.append("branchId", branchId);

    // Department only if role is department
    if (departmentId) {
      formData.append("departmentId", departmentId);
    }

    // Files
    files.forEach((file) => formData.append("file", file));

    try {
      await Api.post("/tenants/write-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showPageToast("Report submitted successfully!", "success");
      resetForm();
      onSuccess?.();
      setTimeout(onClose, 2000);
    } catch (error: any) {
      console.error("Report submission failed:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        "Failed to submit report. Please try again.";
      showPageToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setComments("");
    setFiles([]);
    setErrors({ title: "", files: "" });
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="md"
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
          <Typography variant="h6" fontWeight={600} sx={{ color: "#F6F4FE" }}>
            Submit New Report
          </Typography>
          <IconButton onClick={handleCancel}>
            <Close sx={{ color: "#B0B0B0" }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ py: 2 }}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Report Title *"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                variant="outlined"
                placeholder="e.g. Final 2025 Budget Report"
                disabled={loading}
                error={!!errors.title}
                helperText={errors.title}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TitleIcon sx={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" } },
                }}
              />
            </Grid>

            {/* Comments */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Comments / Summary"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                variant="outlined"
                placeholder="Brief description or notes..."
                multiline
                rows={4}
                disabled={loading}
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" } },
                }}
              />
              <FormHelperText sx={{ color: "rgba(255,255,255,0.6)" }}>
                Optional: Add context or summary
              </FormHelperText>
            </Grid>

            {/* File Upload */}
            <Grid size={{ xs: 12 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFile />}
                sx={{
                  py: 2,
                  borderColor: "#777280",
                  color: "#F6F4FE",
                  textTransform: "none",
                  borderStyle: "dashed",
                  "&:hover": { borderColor: "#F6F4FE", bgcolor: "rgba(255,255,255,0.05)" },
                }}
                disabled={loading}
              >
                {files.length > 0
                  ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                  : "Upload Files (PDF, Images)"}
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>
              {errors.files && (
                <FormHelperText error sx={{ mt: 1 }}>
                  {errors.files}
                </FormHelperText>
              )}
              {files.length > 0 && (
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {files.map((file, i) => (
                    <Chip
                      key={i}
                      label={file.name}
                      size="small"
                      onDelete={() => setFiles(files.filter((_, idx) => idx !== i))}
                      sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#F6F4FE" }}
                    />
                  ))}
                </Box>
              )}
              <FormHelperText sx={{ color: "rgba(255,255,255,0.6)" }}>
                Optional: Max 10 files (PDF, JPG, PNG)
              </FormHelperText>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 2 }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          sx={{
            color: "#B0B0B0",
            textTransform: "none",
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !churchId || !branchId}
          sx={{
            py: 1.2,
            minWidth: 140,
            backgroundColor: "#F6F4FE",
            color: "#2C2C2C",
            fontWeight: "semibold",
            textTransform: "none",
            borderRadius: 50,
            "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
            "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.3)", color: "#777" },
          }}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} sx={{ color: "#2C2C2C" }} />
              Submitting...
            </Box>
          ) : (
            "Submit Report"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportModal;