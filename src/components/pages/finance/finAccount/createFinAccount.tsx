import React, { useState, useCallback, useEffect } from "react";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
  FormHelperText,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface FormData {
  amount: number;
  description: string;
  type: string;
  scopeLevel: string;
  branchIds: string[];
  departmentIds: string[];
}

interface Branch {
  id: string;
  name: string;
  location: string;
  address: string;
}

interface Department {
  id: string;
  name: string;
  type?: string;
  branchId: string;
}

interface Errors {
  amount: string;
  description: string;
  type: string;
  branchIds: string;
  departmentIds: string;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateAccountDialog: React.FC<AdminModalProps> = ({ open, onClose, onSuccess }) => {
  usePageToast('create-collections');
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // INITIAL STATES
  // ═══════════════════════════════════════════════════════════════════════════════
  const initialFormData: FormData = {
    amount: 0,
    description: "",
    type: "credit",
    scopeLevel: "branch",
    branchIds: [],
    departmentIds: [],
  };

  const initialErrors: Errors = {
    amount: "",
    description: "",
    type: "",
    branchIds: "",
    departmentIds: "",
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE HOOKS
  // ═══════════════════════════════════════════════════════════════════════════════
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchDepartments, setBranchDepartments] = useState<{ [branchId: string]: Department[] }>({});
  
  // Fetching states
  const [hasFetchedBranches, setHasFetchedBranches] = useState(false);
  const [hasFetchedDepartments, setHasFetchedDepartments] = useState<{ [branchId: string]: boolean }>({});
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState<{ [branchId: string]: boolean }>({});
  
  // Error states
  const [branchesError, setBranchesError] = useState("");
  const [departmentsError, setDepartmentsError] = useState<{ [branchId: string]: string }>({});

  // ═══════════════════════════════════════════════════════════════════════════════
  // SHARED HOOKS
  // ═══════════════════════════════════════════════════════════════════════════════
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCOPE LEVELS CONFIG
  // ═══════════════════════════════════════════════════════════════════════════════
  const getScopeLevels = useCallback(() => {
    const isSingleBranch =
      authData?.isHeadQuarter === false &&
      (authData?.branches?.length ?? 0) === 1;

    const branchOption = {
      value: "branch",
      label: isSingleBranch ? "Church" : "Branch",
    };

    switch (authData?.role) {
      case "branch":
        return isSingleBranch
          ? [branchOption] // only one option labeled "Church"
          : [
              branchOption,
              { value: "church", label: "Church" },
            ];
      case "department":
        return [{ value: "department", label: "Department" }];
      default:
        return [];
    }
  }, [authData?.isHeadQuarter, authData?.branches, authData?.role]);

  const scopeLevels = getScopeLevels();

  // ═══════════════════════════════════════════════════════════════════════════════
  // API FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchBranches = useCallback(async () => {
    if (hasFetchedBranches || isFetchingBranches) return;
    setIsFetchingBranches(true);
    setBranchesError("");
    try {
      const response = await Api.get("/church/get-branches");
      setBranches(response.data.branches || []);
      setHasFetchedBranches(true);
    } catch (error: any) {
      setBranchesError("Failed to load branches. Please try again.");
    } finally {
      setIsFetchingBranches(false);
    }
  }, [hasFetchedBranches, isFetchingBranches]);

  const fetchDepartmentsForBranch = useCallback(async (branchId: string) => {
    if (hasFetchedDepartments[branchId] || isFetchingDepartments[branchId]) return;
    setIsFetchingDepartments((prev) => ({ ...prev, [branchId]: true }));
    setDepartmentsError((prev) => ({ ...prev, [branchId]: "" }));
    try {
      const response = await Api.get(`/church/get-departments?branchId=${branchId}`);
      const departments = response.data.departments || [];
      setBranchDepartments((prev) => ({ ...prev, [branchId]: departments }));
      setHasFetchedDepartments((prev) => ({ ...prev, [branchId]: true }));
    } catch (error: any) {
      setDepartmentsError((prev) => ({
        ...prev,
        [branchId]: "Failed to load departments for this branch.",
      }));
    } finally {
      setIsFetchingDepartments((prev) => ({ ...prev, [branchId]: false }));
    }
  }, [hasFetchedDepartments, isFetchingDepartments]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleScopeLevelChange = useCallback((e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev, // Keep amount, description, type
      scopeLevel: value,
      branchIds: [],
      departmentIds: [],
    }));
    setErrors(initialErrors);
    setBranchDepartments({});
    setHasFetchedDepartments({});
    setDepartmentsError({});
  }, []);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target as any;
    setFormData((prev) => ({
      ...prev, // Keep other fields intact
      [name]: name === "amount" ? parseFloat(value.replace(/[^\d]/g, '')) || '' : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleSingleBranchChange = useCallback((e: SelectChangeEvent<string>) => {
    const branchId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      branchIds: branchId ? [branchId] : [],
      departmentIds: [],
    }));
    setErrors((prev) => ({ ...prev, branchIds: "", departmentIds: "" }));
    if (branchId) fetchDepartmentsForBranch(branchId);
  }, [fetchDepartmentsForBranch]);

  const handleSingleDepartmentChange = useCallback((e: SelectChangeEvent<string>) => {
    const deptId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      departmentIds: deptId ? [deptId] : [],
    }));
    setErrors((prev) => ({ ...prev, departmentIds: "" }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const validateForm = useCallback((): boolean => {
    const newErrors: Errors = { ...initialErrors };

    if (formData.amount <= 0) newErrors.amount = "Amount must be greater than 0";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    if (formData.scopeLevel === "branch") {
      if (formData.branchIds.length === 0) newErrors.branchIds = "Please select a branch";
    }

    if (formData.scopeLevel === "department") {
      if (formData.branchIds.length === 0) newErrors.branchIds = "Please select a branch";
      if (formData.departmentIds.length === 0) newErrors.departmentIds = "Please select a department";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  }, [formData]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUBMIT HANDLER
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let endpoint = "/wallet/update-account";
      const payload = {
        amount: formData.amount,
        description: formData.description.trim(),
        type: formData.type,
      };

      if (formData.scopeLevel === "branch") {
        endpoint += `?branchId=${formData.branchIds[0]}`;
      } else if (formData.scopeLevel === "department") {
        endpoint += `?branchId=${formData.branchIds[0]}&departmentId=${formData.departmentIds[0]}`;
      }

      await Api.post(endpoint, payload);

      showPageToast(`Account ${formData.type} successfully!`, 'success');
      setTimeout(() => {
        setFormData(initialFormData);
        setErrors(initialErrors);
        setBranches([]);
        setBranchDepartments({});
        setHasFetchedBranches(false);
        setHasFetchedDepartments({});
        setIsFetchingBranches(false);
        setIsFetchingDepartments({});
        setBranchesError("");
        setDepartmentsError({});
        onClose();
      }, 3000);
      onSuccess?.();
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Failed to update account";
      if (responseData?.errors?.length) errorMessage = responseData.errors.join(", ");
      else if (responseData?.error?.message) errorMessage = responseData.error.message;
      else if (responseData?.message) errorMessage = responseData.message;
      showPageToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onClose, onSuccess]);

  // Automatically set branchIds if only 1 branch and not HQ
  useEffect(() => {
    if (
      authData?.isHeadQuarter === false &&
      (authData?.branches?.length ?? 0) === 1 &&
      authData?.branchId
    ) {
      const branchId = authData.branchId;
      setFormData((prev) => ({
        ...prev,
        branchIds: [branchId],
        departmentIds: [],
      }));

      // Auto-fetch departments for department scope
      if (formData.scopeLevel === "department") {
        fetchDepartmentsForBranch(branchId);
      }
    }
  }, [authData, formData.scopeLevel, fetchDepartmentsForBranch]);

  const handleCancel = useCallback(() => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setBranches([]);
    setBranchDepartments({});
    setHasFetchedBranches(false);
    setHasFetchedDepartments({});
    setBranchesError("");
    setDepartmentsError({});
    onClose();
  }, [onClose]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: isMobile ? 0 : 2,
          bgcolor: "var(--color-primary)",
          color: "var(--color-text-primary)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h1"
            fontWeight={300}
            sx={{ color: "var(--color-text-primary)" }}
          >
            Record Transaction
          </Typography>
          <IconButton onClick={handleCancel}>
            <Close className="text-gray-300" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 2 }}>
          <Grid container spacing={4}>
            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            {/* AMOUNT FIELD */}
            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Amount *"
                id="amount"
                name="amount"
                value={formData.amount.toLocaleString()}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter amount"
                disabled={loading}
                size="medium"
                error={!!errors.amount}
                helperText={errors.amount}
                InputLabelProps={{ sx: { color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" } } }}
                InputProps={{
                  sx: {
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            {/* DESCRIPTION FIELD */}
            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description *"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter description"
                disabled={loading}
                size="medium"
                multiline
                minRows={3}
                maxRows={6}
                error={!!errors.description}
                helperText={errors.description}
                InputProps={{
                  sx: {
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    fontSize: "0.9rem",
                    paddingY: 1,
                  },
                }}
                InputLabelProps={{ sx: { color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" }, fontSize: "0.9rem" } }}
                required
              />
            </Grid>

            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            {/* TYPE & SCOPE LEVEL */}
            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
                <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "var(--color-text-primary)" }}>
                Type
                </InputLabel>
                <Select
                label="Type"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={loading}
                sx={{
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                    "& .MuiSelect-select": { color: "var(--color-text-primary)" },
                    "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                }}
                >
                <MenuItem value="credit">Credit</MenuItem>
                <MenuItem value="debit">Debit</MenuItem>
                </Select>
            </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Transaction For
                </InputLabel>

                <Select
                  label="Level"
                  id="scopeLevel"
                  name="scopeLevel"
                  value={formData.scopeLevel}
                  onChange={handleScopeLevelChange}
                  disabled={loading}
                  sx={{
                    color: "var(--color-text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--color-text-primary)",
                    },
                    "& .MuiSelect-select": { color: "var(--color-text-primary)" },
                    "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  }}
                >
                  {scopeLevels.length > 0 ? (
                    scopeLevels.map((level, index) => (
                      <MenuItem key={index} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No available options</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>


            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            {/* BRANCH SELECTION */}
            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            {!(authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1) && (formData.scopeLevel === "branch" || formData.scopeLevel === "department") && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.branchIds}>
                  <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "var(--color-text-primary)" }}>
                    Select Branch *
                  </InputLabel>
                  <Select
                    label="Select Branch *"
                    value={formData.branchIds[0] || ""}
                    onChange={handleSingleBranchChange}
                    onOpen={fetchBranches}
                    disabled={loading}
                    sx={{
                      color: "var(--color-text-primary)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                      "& .MuiSelect-select": { color: "var(--color-text-primary)" },
                      "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    }}
                    MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                  >
                    {isFetchingBranches ? (
                      <MenuItem disabled>
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Typography variant="body2">Loading branches...</Typography>
                        </Box>
                      </MenuItem>
                    ) : branches.length > 0 ? (
                      branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          <ListItemText
                            primary={branch.name}
                            secondary={branch.address}
                            sx={{
                              "& .MuiListItemText-primary": { fontWeight: 300 },
                              "& .MuiListItemText-secondary": { color: "#B0B0B0" },
                            }}
                          />
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No branches available</MenuItem>
                    )}
                  </Select>
                  {errors.branchIds && <FormHelperText>{errors.branchIds}</FormHelperText>}
                  {branchesError && !isFetchingBranches && (
                    <FormHelperText error>
                      <Box component="span" sx={{ mr: 1 }}>⚠️</Box>
                      {branchesError}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            {/* DEPARTMENT SELECTION */}
            {/* ═══════════════════════════════════════════════════════════════════════════════ */}
            {formData.scopeLevel === "department" && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.departmentIds}>
                  <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "var(--color-text-primary)" }}>
                    Select Department *
                  </InputLabel>
                  <Select
                    label="Select Department *"
                    value={formData.departmentIds[0] || ""}
                    onChange={handleSingleDepartmentChange}
                    onOpen={() => {
                      const branchId = formData.branchIds[0];
                      if (branchId && !hasFetchedDepartments[branchId]) {
                        fetchDepartmentsForBranch(branchId);
                      }
                    }}
                    disabled={loading || !formData.branchIds[0]}
                    sx={{
                      color: "var(--color-text-primary)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                      "& .MuiSelect-select": { color: "var(--color-text-primary)" },
                      "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    }}
                    MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                  >
                    {isFetchingDepartments[formData.branchIds[0]] ? (
                      <MenuItem disabled>
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Typography variant="body2">Loading departments...</Typography>
                        </Box>
                      </MenuItem>
                    ) : branchDepartments[formData.branchIds[0]]?.length > 0 ? (
                      branchDepartments[formData.branchIds[0]].map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.type ? `${department.name} - (${department.type})` : department.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No departments available</MenuItem>
                    )}
                  </Select>
                  {errors.departmentIds && <FormHelperText>{errors.departmentIds}</FormHelperText>}
                  {departmentsError[formData.branchIds[0]] && !isFetchingDepartments[formData.branchIds[0]] && (
                    <FormHelperText error>
                      <Box component="span" sx={{ mr: 1 }}>⚠️</Box>
                      {departmentsError[formData.branchIds[0]]}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
          sx={{
            py: 1.5,
            backgroundColor: "var(--color-text-primary)",
            px: { xs: 8, sm: 4 },
            borderRadius: 50,
            color: "var(--color-primary)",
            fontWeight: "semibold",
            textTransform: "none",
            fontSize: "1rem",
            "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
          }}
        >
          {loading ? (
            <span className="text-gray-300">
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> Processing...
            </span>
          ) : (
            'process Transaction'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAccountDialog;