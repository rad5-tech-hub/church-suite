import React, { useState } from "react";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import {showPageToast } from "../../../util/pageToast";
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
  FormHelperText,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface FormData {
  name: string;
  title: string;
  email: string;
  phone: string;
  isSuperAdmin: boolean;
  scopeLevel: string;
  branchIds: string[];
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
  branchId: string;
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
}

interface BranchDepartments {
  [branchId: string]: Department[];
}

interface DepartmentUnits {
  [deptId: string]: Unit[];
}

interface Errors {
  name: string;
  title: string;
  email: string;
  phone: string;
  branchIds: string;
  departmentIds: string;
  unitIds: string;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ open, onClose }) => {
  usePageToast('createadmins')
  const initialFormData: FormData = {
    name: "",
    title: "",
    email: "",
    phone: "",
    isSuperAdmin: false,
    scopeLevel: "branch",
    branchIds: [],
    departmentIds: [],
    unitIds: [],
  };

  const initialErrors: Errors = {
    name: "",
    title: "",
    email: "",
    phone: "",
    branchIds: "",
    departmentIds: "",
    unitIds: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchDepartments, setBranchDepartments] = useState<BranchDepartments>({});
  const [departmentUnits, setDepartmentUnits] = useState<DepartmentUnits>({});
  const [hasFetchedBranches, setHasFetchedBranches] = useState(false);
  const [hasFetchedDepartments, setHasFetchedDepartments] = useState<{ [branchId: string]: boolean }>({});
  const [hasFetchedUnits, setHasFetchedUnits] = useState<{ [deptId: string]: boolean }>({});
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState<{ [branchId: string]: boolean }>({});
  const [isFetchingUnits, setIsFetchingUnits] = useState<{ [deptId: string]: boolean }>({});
  const [branchesError, setBranchesError] = useState("");
  const [departmentsError, setDepartmentsError] = useState<{ [branchId: string]: string }>({});
  const [unitsError, setUnitsError] = useState<{ [deptId: string]: string }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);

  const getScopeLevels = (role?: string) => {
    switch (role) {
      case "branch":
        return [
          { value: "branch", label: "Branch" },
          { value: "department", label: "Department" },
          { value: "unit", label: "Unit" },
        ];
      case "department":
        return [
          { value: "department", label: "Department" },
          { value: "unit", label: "Unit" },
        ];
      case "unit ":
        return [{ value: "unit", label: "Unit" }];
      default:
        return [];
    }
  };

  const scopeLevels = getScopeLevels(authData?.role);


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

  const fetchDepartmentsForBranch = async (branchId: string) => {
    if (hasFetchedDepartments[branchId] || isFetchingDepartments[branchId]) return;

    setIsFetchingDepartments((prev) => ({ ...prev, [branchId]: true }));
    setDepartmentsError((prev) => ({ ...prev, [branchId]: "" }));

    try {
      const response = await Api.get(`/church/get-departments?branchId=${branchId}`);
      const departments = response.data.departments || [];
      setBranchDepartments((prev) => ({ ...prev, [branchId]: departments }));
      setHasFetchedDepartments((prev) => ({ ...prev, [branchId]: true }));
    } catch (error: any) {
      console.error(`Error fetching departments for branch ${branchId}:`, error);
      setDepartmentsError((prev) => ({
        ...prev,
        [branchId]: "Failed to load departments for this branch.",
      }));
    } finally {
      setIsFetchingDepartments((prev) => ({ ...prev, [branchId]: false }));
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
      branchIds: value !== "branch" && value !== "department" && value !== "unit" ? [] : prev.branchIds,
      departmentIds: value !== "department" && value !== "unit" ? [] : prev.departmentIds,
      unitIds: value !== "unit" ? [] : prev.unitIds,
    }));
    setErrors(initialErrors);

    if (value !== "branch" && value !== "department" && value !== "unit") {
      setBranches([]);
      setHasFetchedBranches(false);
    }
    if (value !== "department" && value !== "unit") {
      setBranchDepartments({});
      setHasFetchedDepartments({});
      setDepartmentsError({});
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
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBranchSelectChange = (e: SelectChangeEvent<string[]>) => {
    const selectedBranchIds = e.target.value as string[];
    setFormData((prev) => ({
      ...prev,
      branchIds: selectedBranchIds,
      departmentIds: [],
      unitIds: [],
    }));
    setErrors((prev) => ({ ...prev, branchIds: "", departmentIds: "", unitIds: "" }));
    setBranchDepartments({});
    setHasFetchedDepartments({});
    setDepartmentsError({});
    setDepartmentUnits({});
    setHasFetchedUnits({});
    setUnitsError({});
  };

  const handleDepartmentSelectChange = (branchId: string) => (e: SelectChangeEvent<string[]>) => {
    const selectedDepartmentIds = e.target.value as string[];
    const otherDepartmentIds = formData.departmentIds.filter(
      (deptId) => !branchDepartments[branchId]?.some((dept) => dept.id === deptId)
    );
    setFormData((prev) => ({
      ...prev,
      departmentIds: [...otherDepartmentIds, ...selectedDepartmentIds],
      unitIds: [],
    }));
    setErrors((prev) => ({ ...prev, departmentIds: "", unitIds: "" }));
    setDepartmentUnits({});
    setHasFetchedUnits({});
    setUnitsError({});
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
    setErrors((prev) => ({ ...prev, unitIds: "" }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = { ...initialErrors };

    if (!formData.name.trim()) {
      newErrors.name = "Admin name is required";
    } else {
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (!nameRegex.test(formData.name)) {
        newErrors.name = "Name can only contain letters, spaces, hyphens, and apostrophes";
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters long";
      } else if (formData.name.trim().length > 50) {
        newErrors.name = "Name must be less than 50 characters";
      }
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters long";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (10-15 digits)";
    }

    if (formData.scopeLevel === "branch" && formData.branchIds.length === 0) {
      newErrors.branchIds = "Please select at least one branch";
    }

    if (formData.scopeLevel === "department") {
      if (formData.branchIds.length === 0) {
        newErrors.branchIds = "Please select at least one branch";
      }
      if (formData.departmentIds.length === 0) {
        newErrors.departmentIds = "Please select at least one department";
      }
    }

    if (formData.scopeLevel === "unit") {
      if (formData.branchIds.length === 0) {
        newErrors.branchIds = "Please select at least one branch";
      }
      if (formData.departmentIds.length === 0) {
        newErrors.departmentIds = "Please select at least one department";
      }
      if (formData.unitIds.length === 0) {
        newErrors.unitIds = "Please select at least one unit";
      }
    }

    setErrors(newErrors);

    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        isSuperAdmin: formData.isSuperAdmin || undefined,
        scopeLevel: formData.scopeLevel,
        branchIds: formData.branchIds.length > 0 ? formData.branchIds : undefined,
        departmentIds: formData.departmentIds.length > 0 ? formData.departmentIds : undefined,
        unitIds: formData.unitIds.length > 0 ? formData.unitIds : undefined,
      };

      await Api.post("church/create-admin", payload);

      showPageToast("Admin created successfully!",'success');

      setTimeout(() => {
        setFormData(initialFormData);
        setErrors(initialErrors);
        setBranches([]);
        setBranchDepartments({});
        setDepartmentUnits({});
        setHasFetchedBranches(false);
        setHasFetchedDepartments({});
        setHasFetchedUnits({});
        setIsFetchingBranches(false);
        setIsFetchingDepartments({});
        setIsFetchingUnits({});
        setBranchesError("");
        setDepartmentsError({});
        setUnitsError({});
        onClose();      
      }, 3000);
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Failed to create admin";

      if (responseData) {
        if (Array.isArray(responseData.errors)) {
          errorMessage = responseData.errors.join(", ") || responseData.message || errorMessage;
        } else if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      }

      if (error.response?.status === 400) {
        if (errorMessage.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: "Email address is invalid or already in use" }));
        } else if (errorMessage.toLowerCase().includes("phone")) {
          setErrors((prev) => ({ ...prev, phone: "Phone number is invalid or already in use" }));
        } else {
           showPageToast(errorMessage, 'error');
        }
      } else if (error.response?.status === 401) {
        showPageToast("You don't have permission to create admins", 'error');
      } else if (error.response?.status >= 500) {
        showPageToast("Server error. Please try again later", 'error');
      } else {
        showPageToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setBranches([]);
    setBranchDepartments({});
    setDepartmentUnits({});
    setHasFetchedBranches(false);
    setHasFetchedDepartments({});
    setHasFetchedUnits({});
    setBranchesError("");
    setDepartmentsError({});
    setUnitsError({});
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
          bgcolor: "#2C2C2C",
          color: "#F6F4FE",
        },
      }}
    >    
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h1"
            fontWeight={300}
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
                error={!!errors.name}
                helperText={errors.name}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Position *"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Position"
                disabled={loading}
                size="medium"
                error={!!errors.title}
                helperText={errors.title}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
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
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoMailOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
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
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Admin phone number"
                disabled={loading}
                size="medium"
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoCallOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!errors.branchIds}>
                <InputLabel
                  id="scope-level-label"
                  sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}
                >
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
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    "& .MuiSelect-select": { color: "#F6F4FE" },
                    "& .MuiSelect-icon": { color: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
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

            {(formData.scopeLevel === "branch" ||
              formData.scopeLevel === "department" ||
              formData.scopeLevel === "unit") && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.branchIds}>
                  <InputLabel
                    id="branch-label"
                    sx={{
                      fontSize: isLargeScreen ? "1rem" : undefined,
                      color: "#F6F4FE",
                    }}
                  >
                    Select Branch(es)
                  </InputLabel>
                  <Select
                    labelId="branch-label"
                    id="branchIds"
                    name="branchIds"
                    multiple
                    value={formData.branchIds}
                    onChange={handleBranchSelectChange}
                    onOpen={fetchBranches}
                    label="Select Branch(es)"
                    disabled={loading}
                    renderValue={(selected) =>
                      (selected as string[])
                        .map((id) => branches.find((branch) => branch.id === id)?.name || id)
                        .join(", ")
                    }
                    sx={{
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                      "& .MuiSelect-select": { color: "#F6F4FE" },
                      "& .MuiSelect-icon": { color: "#F6F4FE" },
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: { maxHeight: 300 },
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
                    ) : branches.length > 0 ? (
                      [
                        <MenuItem key="select-branch" value="" disabled>
                          <em>Select branches</em>
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
                            <Checkbox checked={formData.branchIds.includes(branch.id)} />
                            <ListItemText
                              primary={branch.name}
                              secondary={branch.address}
                              sx={{
                                "& .MuiListItemText-primary": {                                 
                                  fontWeight: 300,
                                },
                                "& .MuiListItemText-secondary": {
                                  color: "#B0B0B0",
                                },
                              }}
                            />
                          </MenuItem>
                        )),
                      ]
                    ) : (
                      <MenuItem disabled>
                        <Typography variant="body2">No branches available</Typography>
                      </MenuItem>
                    )}
                  </Select>
                  {errors.branchIds && <FormHelperText>{errors.branchIds}</FormHelperText>}
                  {branchesError && !isFetchingBranches && (
                    <FormHelperText error>
                      <Box component="span" sx={{ mr: 1 }}>
                        ⚠️
                      </Box>
                      {branchesError}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}

            {(formData.scopeLevel === "department" || formData.scopeLevel === "unit") &&
              formData.branchIds.map((branchId) => (
                <Grid size={{ xs: 12, md: 6 }} key={branchId}>
                  <FormControl fullWidth error={!!errors.departmentIds}>
                    <InputLabel
                      id={`department-label-${branchId}`}
                      sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}
                    >
                      Departments for {branches.find((b) => b.id === branchId)?.name || "Branch"}
                    </InputLabel>
                    <Select
                      labelId={`department-label-${branchId}`}
                      id={`departmentIds-${branchId}`}
                      name={`departmentIds-${branchId}`}
                      multiple
                      value={formData.departmentIds.filter((deptId) =>
                        branchDepartments[branchId]?.some((dept) => dept.id === deptId)
                      )}
                      onChange={handleDepartmentSelectChange(branchId)}
                      onOpen={() => fetchDepartmentsForBranch(branchId)}
                      label={`Departments for ${
                        branches.find((b) => b.id === branchId)?.name || "Branch"
                      }`}
                      disabled={loading}
                      renderValue={(selected) =>
                        (selected as string[])
                          .map(
                            (id) =>
                              branchDepartments[branchId]?.find((dept) => dept.id === id)?.name ||
                              id
                          )
                          .join(", ")
                      }
                      sx={{
                        color: "#F6F4FE",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                        "& .MuiSelect-select": { color: "#F6F4FE" },
                        "& .MuiSelect-icon": { color: "#F6F4FE" },
                        fontSize: isLargeScreen ? "1rem" : undefined,
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: { maxHeight: 300 },
                        },
                      }}
                    >
                      {isFetchingDepartments[branchId] ? (
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
                            <Typography variant="body2">Loading departments...</Typography>
                          </Box>
                        </MenuItem>
                      ) : branchDepartments[branchId]?.length > 0 ? (
                        branchDepartments[branchId].map((department) => (
                          <MenuItem key={department.id} value={department.id}>
                            <Checkbox
                              checked={formData.departmentIds.includes(department.id)}
                            />
                            <ListItemText
                              primary={
                                department.type
                                  ? `${department.name} - (${department.type})`
                                  : department.name
                              }
                              sx={{
                                "& .MuiListItemText-primary": {                                  
                                  fontWeight: 300,
                                },
                              }}
                            />
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          <Typography variant="body2">No departments available</Typography>
                        </MenuItem>
                      )}
                    </Select>
                    {errors.departmentIds && <FormHelperText>{errors.departmentIds}</FormHelperText>}
                    {departmentsError[branchId] && !isFetchingDepartments[branchId] && (
                      <FormHelperText error>
                        <Box component="span" sx={{ mr: 1 }}>
                          ⚠️
                        </Box>
                        {departmentsError[branchId]}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              ))}

            {formData.scopeLevel === "unit" &&
              formData.departmentIds.map((deptId) => {
                const department = Object.values(branchDepartments)
                  .flat()
                  .find((dept) => dept.id === deptId);
                const branch = branches.find((b) => b.id === department?.branchId);
                return (
                  <Grid size={{ xs: 12, md: 6 }} key={deptId}>
                    <FormControl fullWidth error={!!errors.unitIds}>
                      <InputLabel
                        id={`unit-label-${deptId}`}
                        sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}
                      >
                        Units for {department?.name || "Department"} ({branch?.name || "Branch"})
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
                        label={`Units for ${department?.name || "Department"} (${
                          branch?.name || "Branch"
                        })`}
                        disabled={loading}
                        renderValue={(selected) =>
                          (selected as string[])
                            .map(
                              (id) =>
                                departmentUnits[deptId]?.find((unit) => unit.id === id)?.name ||
                                id
                            )
                            .join(", ")
                        }
                        sx={{
                          color: "#F6F4FE",
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#F6F4FE",
                          },
                          "& .MuiSelect-select": { color: "#F6F4FE" },
                          "& .MuiSelect-icon": { color: "#F6F4FE" },
                          fontSize: isLargeScreen ? "1rem" : undefined,
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: { maxHeight: 300 },
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
                          departmentUnits[deptId].map((unit) => (
                            <MenuItem
                              key={unit.id}
                              value={unit.id}
                              sx={{
                                whiteSpace: "normal",
                                py: 1.5,
                              }}
                            >
                              <Checkbox checked={formData.unitIds.includes(unit.id)} />
                              <ListItemText
                                primary={unit.name}
                                secondary={unit.description || "No description"}
                                sx={{
                                  "& .MuiListItemText-primary": {                                  
                                    fontWeight: 300,
                                  },
                                  "& .MuiListItemText-secondary": {
                                    color: "#B0B0B0",
                                  },
                                }}
                              />
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>
                            <Typography variant="body2">No units available</Typography>
                          </MenuItem>
                        )}
                      </Select>
                      {errors.unitIds && <FormHelperText>{errors.unitIds}</FormHelperText>}
                      {unitsError[deptId] && !isFetchingUnits[deptId] && (
                        <FormHelperText error>
                          <Box component="span" sx={{ mr: 1 }}>
                            ⚠️
                          </Box>
                          {unitsError[deptId]}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                );
              })}
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
                    color: "#F6F4FE",
                  },
                }}
              />
            </Grid>
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
          {loading ? (
            <span className="text-gray-300">
              <CircularProgress size={24} color="inherit" /> Creating
            </span>
          ) : (
            "Create Admin"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminModal;