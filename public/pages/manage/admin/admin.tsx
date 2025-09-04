import React, { useState } from "react";
import { IoMailOutline, IoCallOutline, IoEyeOutline } from "react-icons/io5";
import { PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import Api from "../../../shared/api/api";
import { toast, ToastContainer } from "react-toastify";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
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
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface FormData {
  name: string;
  title: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  isSuperAdmin: boolean;
  scopeLevel: string;
  branchId?: string;
  departmentIds: string[];
  unitIds: string[];
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
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ open, onClose }) => {
  const initialFormData: FormData = {
    name: "",
    title: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    isSuperAdmin: false,
    scopeLevel: "branch",
    branchId: "",
    departmentIds: [],
    unitIds: [],
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentUnits, setDepartmentUnits] = useState<{ [deptId: string]: Unit[] }>({});
  const [hasFetchedBranches, setHasFetchedBranches] = useState(false);
  const [hasFetchedDepartments, setHasFetchedDepartments] = useState(false);
  const [hasFetchedUnits, setHasFetchedUnits] = useState<{ [deptId: string]: boolean }>({});
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState(false);
  const [isFetchingUnits, setIsFetchingUnits] = useState<{ [deptId: string]: boolean }>({});
  const [branchesError, setBranchesError] = useState("");
  const [departmentsError, setDepartmentsError] = useState("");
  const [unitsError, setUnitsError] = useState<{ [deptId: string]: string }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const scopeLevels: { value: string; label: string }[] = [
    { value: "branch", label: "Branch" },
    { value: "department", label: "Department" },
    { value: "unit", label: "Unit" },
  ];

  const fetchBranches = async () => {
    if (hasFetchedBranches || isFetchingBranches) return;

    setIsFetchingBranches(true);
    setBranchesError("");

    try {
      const response = await Api.get("/church/get-branches");
      setBranches(response.data.branches || []);
      setHasFetchedBranches(true);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      setBranchesError("Failed to load branches. Please try again.");
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const fetchDepartments = async () => {
    if (hasFetchedDepartments || isFetchingDepartments) return;

    setIsFetchingDepartments(true);
    setDepartmentsError("");

    try {
      const response = await Api.get("/church/get-departments");
      setDepartments(response.data.departments || []);
      setHasFetchedDepartments(true);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      setDepartmentsError("Failed to load departments. Please try again.");
    } finally {
      setIsFetchingDepartments(false);
    }
  };

  const fetchUnits = async (deptId: string) => {
    if (hasFetchedUnits[deptId] || isFetchingUnits[deptId]) return;

    setIsFetchingUnits((prev) => ({ ...prev, [deptId]: true }));
    setUnitsError((prev) => ({ ...prev, [deptId]: "" }));

    try {
      const response = await Api.get(`/church/a-department/${deptId}`);
      const units = (response.data.department.units || []).map((unit: Unit) => ({
        ...unit,
        departmentId: deptId,
      }));
      setDepartmentUnits((prev) => ({ ...prev, [deptId]: units }));
      setHasFetchedUnits((prev) => ({ ...prev, [deptId]: true }));
    } catch (error: any) {
      console.error(`Error fetching units for department ${deptId}:`, error);
      setUnitsError((prev) => ({
        ...prev,
        [deptId]: "Failed to load units for this department.",
      }));
    } finally {
      setIsFetchingUnits((prev) => ({ ...prev, [deptId]: false }));
    }
  };

  const handleScopeLevelChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      branchId: value !== "branch" ? "" : prev.branchId,
      departmentIds: value !== "department" && value !== "unit" ? [] : prev.departmentIds,
      unitIds: value !== "unit" ? [] : prev.unitIds,
    }));

    if (value !== "branch") {
      setBranches([]);
      setHasFetchedBranches(false);
    }
    if (value !== "department" && value !== "unit") {
      setDepartments([]);
      setHasFetchedDepartments(false);
    }
    if (value !== "unit") {
      setDepartmentUnits({});
      setHasFetchedUnits({});
      setUnitsError({});
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "departmentIds" && { unitIds: [] }),
    }));

    if (name === "departmentIds") {
      setDepartmentUnits({});
      setHasFetchedUnits({});
      setUnitsError({});
    }
  };

  const handleUnitSelectChange = (deptId: string) => (e: SelectChangeEvent<string[]>) => {
    const selectedUnitIds = e.target.value as string[];
    const otherUnitIds = formData.unitIds.filter(
      (unitId) => !departmentUnits[deptId]?.some((unit) => unit.id === unitId)
    );
    setFormData((prev) => ({
      ...prev,
      unitIds: [...otherUnitIds, ...selectedUnitIds],
    }));
  };

// Form validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Remove any non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    // Check if it's between 10-15 digits (international format)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => { 
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    return { isValid: true, message: "" };
  };

  const validateForm = (): boolean => {
    // Required field validation
    if (!formData.name.trim()) {
      toast.error("Admin name is required", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error("Phone number is required", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (!formData.password.trim()) {
      toast.error("Password is required", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (!formData.confirmPassword.trim()) {
      toast.error("Password confirmation is required", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    // Format validation
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (!validatePhone(formData.phone)) {
      toast.error("Please enter a valid phone number (10-15 digits)", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message, {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 4000,
      });
      return false;
    }

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    // Scope level specific validation
    if (formData.scopeLevel === "branch" && !formData.branchId) {
      toast.error("Please select a branch for branch-level admin", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (formData.scopeLevel === "department" && formData.departmentIds.length === 0) {
      toast.error("Please select at least one department for department-level admin", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (formData.scopeLevel === "unit") {
      if (formData.departmentIds.length === 0) {
        toast.error("Please select at least one department for unit-level admin", {
          position: isMobile ? "top-center" : "top-right",
          autoClose: 3000,
        });
        return false;
      }
      if (formData.unitIds.length === 0) {
        toast.error("Please select at least one unit for unit-level admin", {
          position: isMobile ? "top-center" : "top-right",
          autoClose: 3000,
        });
        return false;
      }
    }

    // Name validation (no numbers or special characters except spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(formData.name)) {
      toast.error("Name can only contain letters, spaces, hyphens, and apostrophes", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    // Name length validation
    if (formData.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters long", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (formData.name.trim().length > 50) {
      toast.error("Name must be less than 50 characters", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    // Title validation
    if (formData.title.trim().length < 2) {
      toast.error("Title must be at least 2 characters long", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (formData.title.trim().length > 100) {
      toast.error("Title must be less than 100 characters", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 3000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        title: formData.title.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        isSuperAdmin: formData.isSuperAdmin || undefined,
        scopeLevel: formData.scopeLevel,
        branchId: formData.branchId || undefined,
        departmentIds: formData.departmentIds.length > 0 ? formData.departmentIds : undefined,
        unitIds: formData.unitIds.length > 0 ? formData.unitIds : undefined,
      };

      await Api.post("church/create-admin", payload);

      // Show success toast
      toast.success("Admin created successfully!", {
        position: isMobile ? "top-center" : "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Clear forms and reset all state after showing toast
      setTimeout(() => {
        // Reset form data
        setFormData(initialFormData);
        
        // Reset all fetched data
        setBranches([]);
        setDepartments([]);
        setDepartmentUnits({});
        
        // Reset fetch states
        setHasFetchedBranches(false);
        setHasFetchedDepartments(false);
        setHasFetchedUnits({});
        
        // Reset loading states
        setIsFetchingBranches(false);
        setIsFetchingDepartments(false);
        setIsFetchingUnits({});
        
        // Reset error states
        setBranchesError("");
        setDepartmentsError("");
        setUnitsError({});
        
        // Reset password visibility
        setShowPassword(false);
        setShowConfirmPassword(false);
        
        // Close modal
        onClose();
      }, 2000);

    } catch (error: any) {
      // Handle specific server errors
      const responseData = error.response?.data;
      
      // Extract error message based on different response structures
      let errorMessage = "Failed to create admin";
      
      if (responseData) {
        // Handle validation errors with array structure
        if (Array.isArray(responseData.errors)) {
          errorMessage = responseData.errors.join(", ") || responseData.message || errorMessage;
        } 
        // Handle object with error property
        else if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        }
        // Handle direct message property
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
      }

      // Show different messages for different types of errors
      if (error.response?.status === 400) {
        if (errorMessage.toLowerCase().includes("email")) {
          toast.error("Email address is invalid or already in use", {
            position: isMobile ? "top-center" : "top-right",
            autoClose: 4000,
          });
        } else if (errorMessage.toLowerCase().includes("phone")) {
          toast.error("Phone number is invalid or already in use", {
            position: isMobile ? "top-center" : "top-right",
            autoClose: 4000,
          });
        } else {
          toast.error(errorMessage, {
            position: isMobile ? "top-center" : "top-right",
            autoClose: 4000,
          });
        }
      } else if (error.response?.status === 401) {
        toast.error("You don't have permission to create admins", {
          position: isMobile ? "top-center" : "top-right",
          autoClose: 4000,
        });
      } else if (error.response?.status >= 500) {
        toast.error("Server error. Please try again later", {
          position: isMobile ? "top-center" : "top-right",
          autoClose: 4000,
        });
      } else {
        toast.error(errorMessage, {
          position: isMobile ? "top-center" : "top-right",
          autoClose: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setBranches([]);
    setDepartments([]);
    setDepartmentUnits({});
    setHasFetchedBranches(false);
    setHasFetchedDepartments(false);
    setHasFetchedUnits({});
    setBranchesError("");
    setDepartmentsError("");
    setUnitsError({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

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
          bgcolor: '#2C2C2C',
          color: "#F6F4FE",
        },
      }}
    >
      <ToastContainer />
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h1"
            fontWeight={600}
            sx={{ color: "#F6F4FE" }}
          >
            Create Admin
          </Typography> 
          <IconButton onClick={onClose}>
            <Close className="text-gray-300" />
          </IconButton> 
        </Box>      
      </DialogTitle>
      <DialogContent dividers>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            mt: 2,
          }}
        >
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Admin Name *"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Admin name"
                disabled={loading}
                size="medium"
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE", // This changes the label color
                    "&.Mui-focused": {
                      color: "#F6F4FE", // Keeps the same color when focused (optional)
                    },
                  },
                }}
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}             
                inputProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Title *"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter title"
                disabled={loading}
                size="medium"
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE", // This changes the label color
                    "&.Mui-focused": {
                      color: "#F6F4FE", // Keeps the same color when focused (optional)
                    },
                  },
                }}
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                inputProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Admin Email *"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Admin email"
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoMailOutline style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,                
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Admin Phone No *"
                id="phone"
                name="phone"
                type="number"
                value={formData.phone}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Admin phone number"
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoCallOutline style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),                             
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="scope-level-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>
                  Scope Level *
                </InputLabel>
                <Select
                  labelId="scope-level-label"
                  id="scopeLevel"
                  name="scopeLevel"
                  value={formData.scopeLevel}
                  onChange={handleScopeLevelChange}
                  label="Scope Level *"
                  disabled={loading}
                  sx={{
                    fontSize: isLargeScreen ? "1rem" : undefined,                
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    "& .MuiSelect-select": {
                        borderColor: "#777280",
                        color: "#F6F4FE",
                    },              
                  }}
                >
                  {scopeLevels.map((level, index) => (
                    <MenuItem key={index} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {formData.scopeLevel === "branch" && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="branch-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined,  color: "#F6F4FE" }}>
                    Assign to Branch
                  </InputLabel>
                  <Select
                    labelId="branch-label"
                    id="branchId"
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleSelectChange}
                    onOpen={fetchBranches}
                    label="Assign to Branch"
                    disabled={loading}
                    sx={{
                      fontSize: isLargeScreen ? "1rem" : undefined,                
                      color: "#F6F4FE",
                      outlineColor: "#777280",
                      borderColor: "#777280",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "& .MuiSelect-select": {
                          borderColor: "#777280",
                          color: "#F6F4FE",
                      },              
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {isFetchingBranches ? (
                      <MenuItem disabled>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Typography variant="body2">Loading branches...</Typography>
                        </Box>
                      </MenuItem>
                    ) : branches.length === 0 && hasFetchedBranches ? (
                      <MenuItem disabled>
                        <Typography variant="body2">No branches available</Typography>
                      </MenuItem>
                    ) : [
                        <MenuItem key="select-branch" value="" disabled>
                          <em>Select a branch (optional)</em>
                        </MenuItem>,
                        ...branches.map((branch) => (
                          <MenuItem
                            key={branch.id}
                            value={branch.id}
                            sx={{
                              whiteSpace: "normal",
                              py: 1.5,
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2">{branch.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {branch.address}
                              </Typography>
                            </Box>
                          </MenuItem>
                        )),
                      ]}
                  </Select>
                  {branchesError && !isFetchingBranches && (
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Box component="span" sx={{ mr: 1 }}>
                        ⚠️
                      </Box>
                      {branchesError}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}
            {(formData.scopeLevel === "department" || formData.scopeLevel === "unit") && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="department-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>
                    {formData.scopeLevel === "department"
                      ? "Assign to Department(s)"
                      : "Select Department(s)"}
                  </InputLabel>
                  <Select
                    labelId="department-label"
                    id="departmentIds"
                    name="departmentIds"
                    multiple
                    value={formData.departmentIds}
                    onChange={handleSelectChange}
                    onOpen={fetchDepartments}
                    label={
                      formData.scopeLevel === "department"
                        ? "Assign to Department(s)"
                        : "Select Department(s)"
                    }
                    disabled={loading}
                    renderValue={(selected) =>
                      (selected as string[])
                        .map((id) => departments.find((dept) => dept.id === id)?.name || id)
                        .join(", ")
                    }
                    sx={{
                      fontSize: isLargeScreen ? "1rem" : undefined,                                      
                      outlineColor: "#777280",
                      borderColor: "#777280",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "& .MuiSelect-select": {
                          borderColor: "#777280",
                          color: "#F6F4FE",
                      },              
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {isFetchingDepartments ? (
                      <MenuItem disabled>
                        <Box
                          display="flex"
                          alignItems="center"
                          width="100%"
                          justifyContent="center"
                        >
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Typography variant="body2">Loading departments...</Typography>
                        </Box>
                      </MenuItem>
                    ) : departments.length === 0 && hasFetchedDepartments ? (
                      <MenuItem disabled>
                        <Typography variant="body2">No departments available</Typography>
                      </MenuItem>
                    ) : (
                      departments.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          <Checkbox 
                            checked={formData.departmentIds.includes(department.id)}
                          />
                          <ListItemText 
                            primary={department.type
                              ? `${department.name} - (${department.type})`
                              : department.name}                         
                          />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {departmentsError && !isFetchingDepartments && (
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Box component="span" sx={{ mr: 1 }}>
                        ⚠️
                      </Box>
                      {departmentsError}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}
            {formData.scopeLevel === "unit" &&
              formData.departmentIds.map((deptId) => (
                <Grid size={{ xs: 12, md: 6 }} key={deptId}>
                  <FormControl fullWidth>
                    <InputLabel id={`unit-label-${deptId}`} sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>
                      Units for {departments.find((dept) => dept.id === deptId)?.name || "Department"}
                    </InputLabel>
                    <Select
                      labelId={`unit-label-${deptId}`}
                      id={`unitIds-${deptId}`}
                      name={`unitIds-${deptId}`}
                      multiple
                      value={formData.unitIds.filter((unitId) =>
                        departmentUnits[deptId]?.some((unit) => unit.id === unitId)
                      )}
                      onChange={handleUnitSelectChange(deptId)}
                      onOpen={() => fetchUnits(deptId)}
                      label={`Units for ${departments.find((dept) => dept.id === deptId)?.name || "Department"}`}
                      disabled={loading}
                      renderValue={(selected) =>
                        (selected as string[])
                          .map((id) => departmentUnits[deptId]?.find((unit) => unit.id === id)?.name || id)
                          .join(", ")
                      }
                       sx={{
                        fontSize: isLargeScreen ? "1rem" : undefined,                
                        color: "#F6F4FE",
                        outlineColor: "#777280",
                        borderColor: "#777280",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#777280",
                        },
                        "& .MuiSelect-select": {
                            borderColor: "#777280",
                            color: "#F6F4FE",
                        },              
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                          },
                        },
                      }}
                    >
                      {isFetchingUnits[deptId] ? (
                        <MenuItem disabled>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              justifyContent: "center",
                            }}
                          >
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            <Typography variant="body2">Loading units...</Typography>
                          </Box>
                        </MenuItem>
                      ) : departmentUnits[deptId]?.length > 0 ? (
                        departmentUnits[deptId].map((unit) => {
                          const currentUnitIds = formData.unitIds.filter((unitId) =>
                            departmentUnits[deptId]?.some((u) => u.id === unitId)
                          );
                          const isChecked = currentUnitIds.includes(unit.id);
                          
                          return (
                            <MenuItem
                              key={unit.id}
                              value={unit.id}
                              sx={{
                                whiteSpace: "normal",
                                py: 1.5,
                              }}
                            >
                              <Checkbox 
                                checked={isChecked}                              
                              />
                              <ListItemText 
                                primary={unit.name}
                                secondary={unit.description || "No description"}
                                sx={{
                                  "& .MuiListItemText-primary": {
                                    color: "#F6F4FE",
                                    fontWeight: 600,
                                  },
                                  "& .MuiListItemText-secondary": {
                                    color: "#B0B0B0",
                                  },
                                }}
                              />
                            </MenuItem>
                          );
                        })
                      ) : (
                        <MenuItem disabled>
                          <Typography variant="body2">No units available</Typography>
                        </MenuItem>
                      )}
                    </Select>
                    {unitsError[deptId] && !isFetchingUnits[deptId] && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{
                          mt: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Box component="span" sx={{ mr: 1 }}>
                          ⚠️
                        </Box>
                        {unitsError[deptId]}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              ))}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Admin Password *"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Admin password"
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SlLock style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {!showPassword ? <PiEyeClosed size={20} style={{ color: '#F6F4FE' }} /> : <IoEyeOutline size={20} style={{ color: '#F6F4FE' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Confirm Password *"
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                variant="outlined"
                placeholder="Confirm Admin password"
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SlLock style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {!showConfirmPassword ? (
                          <PiEyeClosed size={20} style={{ color: '#F6F4FE' }} />
                        ) : (
                          <IoEyeOutline size={20} style={{ color: '#F6F4FE' }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isSuperAdmin}
                    onChange={handleChange}
                    name="isSuperAdmin"
                    color="default"
                  />
                }
                label="Is Super Admin?"
                sx={{
                  "& .MuiTypography-root": {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: '#F6F4FE'
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        {/* <Button
          onClick={handleCancel}
          variant="outlined"
          sx={{
            py: 1,
            px: { xs: 2, sm: 2 },
            borderRadius: 1,
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1rem" },
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
          }}
        >
          Cancel
        </Button> */}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",          
            px: { xs: 7, sm: 2 },
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
          {loading ? <span className="text-gray-600"> <CircularProgress size={24} color="inherit" /> Creating </span> : "Create Admin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminModal;