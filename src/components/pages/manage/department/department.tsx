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
  description: string;
  branchId?: string;
}

interface Branch {
  id: string;
  address: string;
  name: string;
}

interface Errors {
  name: string;
  description: string;
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
    description: "",
    branchId: "",
  };

  const initialErrors: Errors = {
    name: "",
    description: "",
    branchId: "",
  };

  const [formData, setFormData] = useState<DepartmentFormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  usePageToast("create-department");
  const isSuperAdmin = authData?.isSuperAdmin === true;

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await Api.get("/church/get-branches");
      setBranches(response.data.branches || []);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      showPageToast("Failed to load branches. Please try again.", "error");
    } finally {
      setBranchesLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {
      name: "",
      description: "",
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddDepartment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: DepartmentFormData = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        ...(formData.branchId ? { branchId: formData.branchId } : {}),
      };

      const response = await Api.post("/church/create-dept", payload);

      showPageToast(
        response.data.message || `Department "${response.data.Department?.name || formData.name}" created successfully!`,
        "success"
      );

      setFormData(initialFormData);
      setErrors(initialErrors);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("Department creation error:", error);
      let errorMessage = error.response?.data?.message || "Failed to create Department. Please try again.";

      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.join(", ");
      }

      if (error.response?.status === 400) {
        if (errorMessage.toLowerCase().includes("name")) {
          setErrors((prev) => ({ ...prev, name: errorMessage }));
        } else if (errorMessage.toLowerCase().includes("branch")) {
          setErrors((prev) => ({ ...prev, branchId: errorMessage }));
        } else {
          showPageToast(errorMessage, "error");
        }
      } else {
        showPageToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
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
                } as unknown as React.ChangeEvent<HTMLInputElement>);
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
                  label="Branch *"
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
                      "& .MuiAutocomplete-clearIndicator": {
                        color: "#F6F4FE", // ✅ clear icon color
                      },
                      "& .MuiAutocomplete-popupIndicator": {
                        color: "#F6F4FE", // ✅ dropdown arrow icon color
                      },
                    },
                    endAdornment: (
                      <>
                        {branchesLoading ? (
                          <CircularProgress
                            size={16}
                            sx={{ mr: 1, color: "#F6F4FE" }} // ✅ loader color
                          />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            {errors.branchId && <FormHelperText>{errors.branchId}</FormHelperText>}
          </FormControl>
          
          <TextField
            fullWidth
            label="Department Name *"
            id="name"
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
            required
          />

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
              id="type"
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

          <TextField
            fullWidth
            label="Description *"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter Department description"
            multiline
            rows={4}
            disabled={loading}
            size="medium"
            error={!!errors.description}
            helperText={errors.description}
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
            required
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
            <Box display="flex" alignItems="center" color="#2C2C2C">
              <CircularProgress size={18} sx={{ color: "#2C2C2C", mr: 1 }} />
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