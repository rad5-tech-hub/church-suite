import React, { useState, useEffect } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  SelectChangeEvent,
  FormHelperText,
  Autocomplete,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface DepartmentFormData {
  name: string;
  type: "Department" | "Outreach";
  description?: string;
  branchId?: string;
}

interface Branch {
  id: string;
  address: string;
  name: string;
}

interface Errors {
  name: string;
  branchId: string;
}

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ open, onClose, onSuccess }) => {
  const initialFormData: DepartmentFormData = {
    name: "",
    type: "Department",
    branchId: "",
  };

  const initialErrors: Errors = {
    name: "",
    branchId: "",
  };

  const [formData, setFormData] = useState<DepartmentFormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [charCount, setCharCount] = useState(0); // ✅ Changed to character count
  
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  usePageToast("create-department");
  const isSuperAdmin = authData?.isSuperAdmin === true;

  // ✅ Character limit check
  const MAX_CHARS = 256;

// ✅ UPDATED: Smooth 256 char limit handler
  const handleDescriptionChange = (value: string) => {
    const currentCharCount = value.length;
    
    // ✅ Allow typing UP TO 256 chars (smooth experience)
    if (currentCharCount <= MAX_CHARS) {
      setFormData((prev) => ({
        ...prev,
        description: value,
      }));
      setCharCount(currentCharCount);
    }
    // Browser maxLength handles the rest naturally
  };

  // Auto-select branch when dialog opens
  useEffect(() => {
    if (open) {
      const defaultBranchId = isSuperAdmin ? authData?.branchId || "" : "";
      setFormData({
        name: "",
        type: "Department",
        branchId: defaultBranchId,
      });
      setCharCount(0);
      fetchBranches();
    }
  }, [open, isSuperAdmin, authData?.branchId]);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await Api.get("/church/get-branches");
      setBranches(response.data.branches || []);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
    } finally {
      setBranchesLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {
      name: "",
      branchId: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Department name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (isSuperAdmin && !formData.branchId) {
      newErrors.branchId = "Please select a branch";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "description") {
      handleDescriptionChange(value); // ✅ Use special handler
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setErrors((prev) => ({ ...prev, [name as keyof Errors]: "" }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name as keyof Errors]: "" }));
  };

  const handleAddDepartment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
      };

      if (formData.branchId) {
        payload.branchId = formData.branchId;
      }

      if (formData.description?.trim()) {
        payload.description = formData.description.trim();
      }

      const response = await Api.post("/church/create-dept", payload);

      showPageToast(
        response.data.message || `Department "${response.data.Department?.name || formData.name}" created successfully!`,
        "success"
      );

      setFormData(initialFormData);
      setErrors(initialErrors);
      setCharCount(0);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("Department creation error:", error);
      
      if (error.response?.status === 422 || error.response?.status === 400) {
        const serverErrors = error.response?.data?.errors;
        
        if (serverErrors) {
          if (serverErrors.name) {
            setErrors((prev) => ({ ...prev, name: serverErrors.name[0] || "Invalid name" }));
          }
          if (serverErrors.branchId || serverErrors.branch) {
            setErrors((prev) => ({ 
              ...prev, 
              branchId: serverErrors.branchId?.[0] || serverErrors.branch?.[0] || "Invalid branch" 
            }));
          }
          if (serverErrors.description) {
            showPageToast(serverErrors.description[0], "error");
          }
          return;
        }
      }

      const errorMessage = error.response?.data?.error?.message || "Failed to create Department. Please try again.";
      showPageToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setCharCount(0);
    setBranches([]);
    setBranchesLoading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="sm"
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
            Create New Department
          </Typography>
          <IconButton onClick={handleCancel}>
            <Close sx={{ color: "#B0B0B0" }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 2 }}>
          {/* Branch Autocomplete */}
          <FormControl fullWidth size="medium" error={!!errors.branchId}>
            <Autocomplete
              disablePortal
              options={branches.map((branch) => ({
                label: branch.name,
                value: branch.id,
                address: branch.address,
              }))}
              value={
                formData.branchId
                  ? {
                      label: branches.find((b) => b.id === formData.branchId)?.name || "",
                      value: formData.branchId,
                      address: branches.find((b) => b.id === formData.branchId)?.address || "",
                    }
                  : null
              }
              onChange={(_, newValue) => {
                handleSelectChange({
                  target: {
                    name: "branchId",
                    value: newValue?.value || "",
                  },
                } as any);
              }}
              getOptionLabel={(option) =>
                option && typeof option === "object"
                  ? `${option.label}${option.address ? ` — ${option.address}` : ""}`
                  : ""
              }
              loading={branchesLoading}
              renderOption={(props, option) => (
                <li {...props} key={option.value}>
                  <Box>
                    <Typography sx={{ fontWeight: 500 }}>{option.label}</Typography>
                    {option.address && (
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#aaa" }}>
                        {option.address}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={isSuperAdmin ? "Branch *" : "Branch"}
                  variant="outlined"
                  placeholder="Select a branch"
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                      color: "#F6F4FE",
                      "&.Mui-focused": { color: "#F6F4FE" },
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    sx: {
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#F6F4FE",
                      },
                      "& .MuiAutocomplete-clearIndicator": { color: "#F6F4FE" },
                      "& .MuiAutocomplete-popupIndicator": { color: "#F6F4FE" },
                    },
                    endAdornment: (
                      <>
                        {branchesLoading ? (
                          <CircularProgress size={16} sx={{ mr: 1, color: "#F6F4FE" }} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            {errors.branchId && <FormHelperText error>{errors.branchId}</FormHelperText>}
          </FormControl>

          {/* Department Name */}
          <TextField
            fullWidth
            label="Department Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter Department name"
            disabled={loading}
            size="medium"
            error={!!errors.name}
            helperText={errors.name}
            InputLabelProps={{
              sx: {
                color: "#F6F4FE",
                "&.Mui-focused": { color: "#F6F4FE" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
            InputProps={{
              sx: {
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
          />

          {/* Type Select */}
          <FormControl fullWidth size="medium">
            <InputLabel
              id="type-label"
              sx={{
                fontSize: isLargeScreen ? "1rem" : undefined,
                color: "#F6F4FE",
                "&.Mui-focused": { color: "#F6F4FE" },
              }}
            >
              Type *
            </InputLabel>
            <Select
              labelId="type-label"
              name="type"
              value={formData.type}
              onChange={handleSelectChange}
              label="Type *"
              disabled={loading}
              sx={{
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                "& .MuiSelect-select": { color: "#F6F4FE" },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              }}
            >
              <MenuItem value="Department" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                Department
              </MenuItem>
              <MenuItem value="Outreach" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                Outreach
              </MenuItem>
            </Select>
          </FormControl>

          {/* Description - ✅ 256 CHAR LIMIT + READONLY EFFECT */}
          <TextField
            fullWidth
            label="Description (Optional)"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter Department description"
            multiline
            rows={4}
            disabled={loading}
            size="medium"
            inputProps={{
              maxLength: MAX_CHARS, // ✅ Browser handles limit naturally
            }}
            InputLabelProps={{
              sx: {
                color: "#F6F4FE",
                "&.Mui-focused": { color: "#F6F4FE" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
            InputProps={{
              sx: {
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { 
                  borderColor: charCount >= MAX_CHARS ? "#ff9800" : "#777280" // 🟠 Warning orange
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { 
                  borderColor: charCount >= MAX_CHARS ? "#ff9800" : "#F6F4FE" 
                },
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
            helperText={
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography 
                  variant="caption"
                  sx={{ 
                    color: "#aaa",
                    fontSize: "12px"
                  }}
                >
                  Max {MAX_CHARS} characters
                </Typography>
                <Typography 
                  variant="caption"
                  sx={{ 
                    color: charCount >= MAX_CHARS ? "#ff9800" : "#90EE90", 
                    fontSize: "13px",
                    fontWeight: 600,
                    minWidth: 60,
                    textAlign: "right"
                  }}
                >
                  {charCount}/{MAX_CHARS}
                </Typography>
              </Box>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={handleAddDepartment}
          disabled={loading}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 2, sm: 2 },
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
        >
          {loading ? (
            <Box display="flex" alignItems="center" color="#777280">
              <CircularProgress size={18} sx={{ color: "#777280", mr: 1 }} />
              Creating...
            </Box>
          ) : (
            "Create Department"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentModal;