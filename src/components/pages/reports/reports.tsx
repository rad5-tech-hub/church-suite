import React, { useEffect, useState } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Close, AttachFile, Title as TitleIcon, Send } from "@mui/icons-material";
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

interface Branch {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

type SubmitToType = "church" | "branch" | "department";

const ReportModal: React.FC<ReportModalProps> = ({ open, onClose, onSuccess }) => {
  const authData = useSelector((state: RootState) => state.auth?.authData);

  const [title, setTitle] = useState("");
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitTo, setSubmitTo] = useState<SubmitToType>("branch");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ title: "", files: "", submitTo: "", branch: "", department: "" });
  // Dynamic branch & department
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  usePageToast("write-report");

  // Extract from auth
  const churchId = authData?.churchId;
  const branchId = authData?.branchId;
  const role = authData?.role;
  const isHeadQuarter = authData?.isHeadQuarter;
  const departmentId = role === "department" ? authData?.department : undefined;

  // Determine available submit options based on role
  const getAvailableOptions = (): SubmitToType[] => {
    const options: SubmitToType[] = [];

    if (role === "department") {
      // Department users can submit to branch or department
      options.push("branch", "department");
    } else if (isHeadQuarter) {
      // Headquarters can submit to church or branch
      options.push("church", "branch");
    } else {
      // Regular users can only submit to branch
      options.push("branch");
    }

    return options;
  };

  // Fetch branches when modal opens or when "branch" or "church" is selected
  const fetchBranches = async () => {
    if (!churchId) return;
    setLoadingBranches(true);
    try {
      const res = await Api.get("/church/get-branches");
      const branchList = res.data.branches || [];
      setBranches(branchList);

      // Pre-select current branch if available
      if (branchId && branchList.some((b: Branch) => b.id === branchId)) {
        setSelectedBranchId(branchId);
      } else if (branchList.length > 0) {
        setSelectedBranchId(branchList[0].id);
      }
    } catch (err) {
      showPageToast("Failed to load branches", "error");
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Fetch departments when a branch is selected and needed
  const fetchDepartments = async (branchId: string) => {
    if (!branchId) return;
    setLoadingDepartments(true);
    try {
      const res = await Api.get(`/church/get-departments?branchId=${branchId}`);
      const deptList = res.data.departments || [];
      setDepartments(deptList);

      // Pre-select current department if available
      if (departmentId && deptList.some((d: Department) => d.id === departmentId)) {
        setSelectedDepartmentId(departmentId);
      } else if (deptList.length > 0) {
        setSelectedDepartmentId(deptList[0].id);
      } else {
        setSelectedDepartmentId("");
      }
    } catch (err) {
      showPageToast("Failed to load departments", "error");
      setDepartments([]);
      setSelectedDepartmentId("");
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Determine what fields to show
  const showBranchSelect = submitTo === "branch" && isHeadQuarter;
  const showDepartmentSelect = submitTo === "department";

  // Load branches when modal opens (only if needed)
  useEffect(() => {
    if (open && (isHeadQuarter || showBranchSelect)) {
      fetchBranches();
    }
  }, [open, isHeadQuarter]);

  // Load departments when branch changes and department is needed
  useEffect(() => {
    if (showDepartmentSelect && selectedBranchId) {
      fetchDepartments(selectedBranchId);
    }
  }, [selectedBranchId, showDepartmentSelect]);

  const availableOptions = getAvailableOptions();

  // Set default submitTo based on available options
  React.useEffect(() => {
    if (availableOptions.length > 0 && !availableOptions.includes(submitTo)) {
      setSubmitTo(availableOptions[0]);
    }
  }, [availableOptions, submitTo]);

  // Validation
  const validate = () => {
    const newErrors = { title: "", files: "", submitTo: "", branch: "", department: "" };
    if (!title.trim()) newErrors.title = "Report title is required";
    else if (title.trim().length > 200) newErrors.title = "Title too long (max 200 chars)";
    
    if (!submitTo) newErrors.submitTo = "Please select where to submit";
    
    setErrors(newErrors);
    return !newErrors.title && !newErrors.submitTo;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);

    // Combine old + new files
    const combined = [...files, ...selected];

    // Limit to 10 files
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
    formData.append("submitTo", submitTo);

    // Department only if role is department and submitTo is department
    if (departmentId && submitTo === "department") {
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
    setSubmitTo(availableOptions[0] || "branch");
    setErrors({ title: "", files: "", submitTo: "", branch: "", department: "" });
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Get label for submit option
  const getSubmitLabel = (option: SubmitToType) => {
    switch (option) {
      case "church":
        return "Church (Headquarters)";
      case "branch":
        return "Branch";
      case "department":
        return "Department";
      default:
        return option;
    }
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
          bgcolor: "var(--color-primary)",
          color: "var(--color-text-primary)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600} sx={{ color: "var(--color-text-primary)" }}>
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
            {/* Submit To */}
            {availableOptions.length > 1 && (
              <Grid size={{ xs: 12 }}>
                <FormControl
                  fullWidth
                  error={!!errors.submitTo}
                  disabled={loading}
                >
                  <InputLabel
                    sx={{
                      color: "var(--color-text-primary)",
                      "&.Mui-focused": { color: "var(--color-text-primary)" },
                    }}
                  >
                    Submit To *
                  </InputLabel>
                  <Select
                    value={submitTo}
                    onChange={(e) => {
                      setSubmitTo(e.target.value as SubmitToType);
                      setErrors((prev) => ({ ...prev, submitTo: "" }));
                    }}
                    label="Submit To *"
                    startAdornment={
                      <InputAdornment position="start">
                        <Send sx={{ color: "var(--color-text-primary)" }} />
                      </InputAdornment>
                    }
                    sx={{
                      color: "var(--color-text-primary)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--color-text-primary)",
                      },
                      "& .MuiSvgIcon-root": {
                        color: "var(--color-text-primary)",
                      },
                    }}
                  >
                    {availableOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {getSubmitLabel(option)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.submitTo && (
                    <FormHelperText error>{errors.submitTo}</FormHelperText>
                  )}
                  <FormHelperText sx={{ color: "rgba(255,255,255,0.6)" }}>
                    {submitTo === "church" && "Report will be submitted to Church Headquarters"}
                    {submitTo === "branch" && "Report will be submitted to your Branch"}
                    {submitTo === "department" && "Report will be submitted to your Department"}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}

            {/* Branch Selector - shown when needed */}
            {showBranchSelect && (
              <Grid size={12}>
                <FormControl fullWidth error={!!errors.branch}>
                  <InputLabel sx={{ color: "var(--color-text-primary)" }}>
                    Select Branch 
                  </InputLabel>
                  <Select
                    value={selectedBranchId}
                    label='Select Branch'
                    onOpen={fetchBranches}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    disabled={loadingBranches}
                    sx={{
                      color: "var(--color-text-primary)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                      "& .MuiSvgIcon-root": {
                        color: "var(--color-text-primary)",
                      },
                    }}
                  >
                    {loadingBranches ? (
                      <MenuItem disabled><CircularProgress size={20} /> Loading branches...</MenuItem>
                    ) : branches.length === 0 ? (
                      <MenuItem disabled>No branches available</MenuItem>
                    ) : (
                      branches.map((b) => (
                        <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.branch && <FormHelperText error>{errors.branch}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            {/* Department Selector */}
            {showDepartmentSelect && (
              <Grid size={12}>
                <FormControl fullWidth error={!!errors.department}>
                  <InputLabel sx={{ color: "var(--color-text-primary)" }}>Select Department *</InputLabel>
                  <Select
                    value={selectedDepartmentId}
                    label="Select Department *"
                    onOpen={() => selectedBranchId && fetchDepartments(selectedBranchId)}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    disabled={loadingDepartments || !selectedBranchId}
                    sx={{
                      color: "var(--color-text-primary)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                      "& .MuiSvgIcon-root": {
                        color: "var(--color-text-primary)",
                      },
                    }}
                  >
                    {loadingDepartments ? (
                      <MenuItem disabled><CircularProgress size={20} /> Loading departments...</MenuItem>
                    ) : departments.length === 0 ? (
                      <MenuItem disabled>No departments in this branch</MenuItem>
                    ) : (
                      departments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.department && <FormHelperText error>{errors.department}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

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
                      <TitleIcon sx={{ color: "var(--color-text-primary)" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" } },
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
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" } },
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
                  color: "var(--color-text-primary)",
                  textTransform: "none",
                  borderStyle: "dashed",
                  "&:hover": { borderColor: "var(--color-text-primary)", bgcolor: "rgba(255,255,255,0.05)" },
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
                      sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "var(--color-text-primary)" }}
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
          disabled={loading || !title.trim() || !churchId || !branchId || !submitTo}
          sx={{
            py: 1.2,
            minWidth: 140,
            backgroundColor: "var(--color-text-primary)",
            color: "var(--color-primary)",
            fontWeight: "semibold",
            textTransform: "none",
            borderRadius: 50,
            "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
            "&.Mui-disabled": { bgcolor: "var(--color-text-muted)", color: "var(--color-surface)" },
          }}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} sx={{ color: "var(--color-primary)" }} />
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