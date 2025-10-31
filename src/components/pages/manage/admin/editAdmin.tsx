import React, { useState, useEffect } from "react";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
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
  branches: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  units: { id: string; name: string }[];
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
  branches: string;
  departments: string;
  units: string;
}

interface EditAdminModalProps {
  open: boolean;
  onClose: () => void;
  adminData: FormData & { id: string | number };
}

const EditAdminModal: React.FC<EditAdminModalProps> = ({ open, onClose, adminData }) => {
  usePageToast('editadmins');
  const initialFormData: FormData = {
    name: adminData?.name || "",
    title: adminData?.title || "",
    email: adminData?.email || "",
    phone: adminData?.phone || "",
    isSuperAdmin: adminData?.isSuperAdmin || false,
    scopeLevel: adminData?.scopeLevel || "branch",
    branches: adminData?.branches || [],
    departments: adminData?.departments || [],
    units: adminData?.units || [],
  };

  const initialErrors: Errors = {
    name: "",
    title: "",
    email: "",
    phone: "",
    branches: "",
    departments: "",
    units: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [changedFields, setChangedFields] = useState<Partial<FormData>>({});
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
  const authData = useSelector((state) => (state as RootState)?.auth?.authData);


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
      case "units":
        return [{ value: "unit", label: "Unit" }];
      default:
        return [];
    }
  };

  const scopeLevels = getScopeLevels(authData?.role);


  useEffect(() => {
    // Initialize form data when adminData changes
    setFormData({
      name: adminData?.name || "",
      title: adminData?.title || "",
      email: adminData?.email || "",
      phone: adminData?.phone || "",
      isSuperAdmin: adminData?.isSuperAdmin || false,
      scopeLevel: adminData?.scopeLevel || "branch",
      branches: adminData?.branches || [],
      departments: adminData?.departments || [],
      units: adminData?.units || [],
    });
    setChangedFields({});
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
  }, [adminData]);

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
      branches: value !== "branch" && value !== "department" && value !== "unit" ? [] : prev.branches,
      departments: value !== "department" && value !== "unit" ? [] : prev.departments,
      units: value !== "unit" ? [] : prev.units,
    }));
    setChangedFields((prev) => ({ ...prev, [name]: value }));
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
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setChangedFields((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBranchSelectChange = (e: SelectChangeEvent<string[]>) => {
    const selectedBranchIds = e.target.value as string[];
    const selectedBranches = selectedBranchIds.map((id) => ({
      id,
      name: branches.find((branch) => branch.id === id)?.name || formData.branches.find((b) => b.id === id)?.name || id,
    }));
    setFormData((prev) => ({
      ...prev,
      branches: selectedBranches,
      departments: [],
      units: [],
    }));
    setChangedFields((prev) => ({
      ...prev,
      branches: selectedBranches,
      departments: [],
      units: [],
    }));
    setErrors((prev) => ({ ...prev, branches: "", departments: "", units: "" }));
    setBranchDepartments({});
    setHasFetchedDepartments({});
    setDepartmentsError({});
    setDepartmentUnits({});
    setHasFetchedUnits({});
    setUnitsError({});
  };

  const handleDepartmentSelectChange = (branchId: string) => (e: SelectChangeEvent<string[]>) => {
    const selectedDepartmentIds = e.target.value as string[];
    const selectedDepartments = selectedDepartmentIds.map((id) => ({
      id,
      name: branchDepartments[branchId]?.find((dept) => dept.id === id)?.name || formData.departments.find((d) => d.id === id)?.name || id,
    }));
    const otherDepartments = formData.departments.filter(
      (dept) => !branchDepartments[branchId]?.some((d) => d.id === dept.id)
    );
    setFormData((prev) => ({
      ...prev,
      departments: [...otherDepartments, ...selectedDepartments],
      units: [],
    }));
    setChangedFields((prev) => ({
      ...prev,
      departments: [...otherDepartments, ...selectedDepartments],
      units: [],
    }));
    setErrors((prev) => ({ ...prev, departments: "", units: "" }));
    setDepartmentUnits({});
    setHasFetchedUnits({});
    setUnitsError({});
  };

  const handleUnitSelectChange = (deptId: string) => (e: SelectChangeEvent<string[]>) => {
    const selectedUnitIds = e.target.value as string[];
    const selectedUnits = selectedUnitIds.map((id) => ({
      id,
      name: departmentUnits[deptId]?.find((unit) => unit.id === id)?.name || formData.units.find((u) => u.id === id)?.name || id,
    }));
    const otherUnits = formData.units.filter(
      (unit) => !departmentUnits[deptId]?.some((u) => u.id === unit.id)
    );
    setFormData((prev) => ({
      ...prev,
      units: [...otherUnits, ...selectedUnits],
    }));
    setChangedFields((prev) => ({
      ...prev,
      units: [...otherUnits, ...selectedUnits],
    }));
    setErrors((prev) => ({ ...prev, units: "" }));
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

    if (changedFields.name !== undefined) {
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
    }

    if (changedFields.title !== undefined) {
      if (!formData.title.trim()) {
        newErrors.title = "Title is required";
      } else if (formData.title.trim().length < 2) {
        newErrors.title = "Title must be at least 2 characters long";
      } else if (formData.title.trim().length > 100) {
        newErrors.title = "Title must be less than 100 characters";
      }
    }

    if (changedFields.email !== undefined) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (changedFields.phone !== undefined) {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number (10-15 digits)";
      }
    }

    if (changedFields.scopeLevel !== undefined || changedFields.branches !== undefined) {
      if (formData.scopeLevel === "branch" && formData.branches.length === 0) {
        newErrors.branches = "Please select at least one branch";
      }
    }

    if (changedFields.scopeLevel !== undefined || changedFields.departments !== undefined) {
      if (formData.scopeLevel === "department") {
        if (formData.branches.length === 0) {
          newErrors.branches = "Please select at least one branch";
        }
        if (formData.departments.length === 0) {
          newErrors.departments = "Please select at least one department";
        }
      }
    }

    if (changedFields.scopeLevel !== undefined || changedFields.units !== undefined) {
      if (formData.scopeLevel === "unit") {
        if (formData.branches.length === 0) {
          newErrors.branches = "Please select at least one branch";
        }
        if (formData.departments.length === 0) {
          newErrors.departments = "Please select at least one department";
        }
        if (formData.units.length === 0) {
          newErrors.units = "Please select at least one unit";
        }
      }
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !adminData?.id) {
      return;
    }

    setLoading(true);

    try {
      const payload: Partial<FormData> & { branchIds?: string[]; departmentIds?: string[]; unitIds?: string[] } = {};

      // Always include branchIds in payload
      payload.branchIds = formData.branches.map((branch) => branch.id);

      // Include other changed fields
      Object.keys(changedFields).forEach((key) => {
        const field = key as keyof FormData;
        // Use any cast for dynamic assignment to satisfy TS, and handle string trimming/lowercasing explicitly
        if (field === "name" || field === "title" || field === "email" || field === "phone") {
          const value = (formData[field] as unknown as string).trim();
          if (field === "email") {
            (payload as any)[field] = value.toLowerCase();
          } else {
            (payload as any)[field] = value;
          }
        } else if (field === "branches") {
          // Already included as branchIds
        } else if (field === "departments") {
          payload.departmentIds = formData.departments.length > 0 ? formData.departments.map((dept) => dept.id) : undefined;
        } else if (field === "units") {
          payload.unitIds = formData.units.length > 0 ? formData.units.map((unit) => unit.id) : undefined;
        } else {
          (payload as any)[field] = formData[field as keyof FormData];
        }
      });

      // If only branchIds is included and it matches the original, show no changes message
      const originalBranchIds = adminData.branches.map((b) => b.id);
      if (
        Object.keys(payload).length === 1 &&
        payload.branchIds?.length === originalBranchIds.length &&
        payload.branchIds?.every((id) => originalBranchIds.includes(id))
      ) {
        showPageToast("No changes to submit", 'warning');
        onClose();
        return;
      }

      await Api.patch(`/church/edit-admin/${adminData.id}`, payload);

      showPageToast("Admin updated successfully!", 'success');

      setTimeout(() => {
        setFormData(initialFormData);
        setChangedFields({});
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
      let errorMessage = "Failed to update admin";

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
        showPageToast("You don't have permission to update admins", 'error');
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
    setChangedFields({});
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
            Edit Admin
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
                inputProps={{ readOnly: true }}
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
              <FormControl fullWidth error={!!errors.branches}>
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
                <FormControl fullWidth error={!!errors.branches}>
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
                    id="branches"
                    name="branches"
                    multiple
                    value={formData.branches.map((b) => b.id)}
                    onChange={handleBranchSelectChange}
                    onOpen={fetchBranches}
                    label="Select Branch(es)"
                    disabled={loading}
                    renderValue={(selected) =>
                      (selected as string[])
                        .map((id) => formData.branches.find((b) => b.id === id)?.name || branches.find((branch) => branch.id === id)?.name || id)
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
                            <Checkbox checked={formData.branches.some((b) => b.id === branch.id)} />
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
                  {errors.branches && <FormHelperText>{errors.branches}</FormHelperText>}
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
              formData.branches.map((branch) => (
                <Grid size={{ xs: 12, md: 6 }} key={branch.id}>
                  <FormControl fullWidth error={!!errors.departments}>
                    <InputLabel
                      id={`department-label-${branch.id}`}
                      sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}
                    >
                      Departments for {branch.name}
                    </InputLabel>
                    <Select
                      labelId={`department-label-${branch.id}`}
                      id={`departments-${branch.id}`}
                      name={`departments-${branch.id}`}
                      multiple
                      value={formData.departments
                        .filter((dept) => branchDepartments[branch.id]?.some((d) => d.id === dept.id))
                        .map((d) => d.id)}
                      onChange={handleDepartmentSelectChange(branch.id)}
                      onOpen={() => fetchDepartmentsForBranch(branch.id)}
                      label={`Departments for ${branch.name}`}
                      disabled={loading}
                      renderValue={(selected) =>
                        (selected as string[])
                          .map((id) => formData.departments.find((d) => d.id === id)?.name || branchDepartments[branch.id]?.find((dept) => dept.id === id)?.name || id)
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
                      {isFetchingDepartments[branch.id] ? (
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
                      ) : branchDepartments[branch.id]?.length > 0 ? (
                        branchDepartments[branch.id].map((department) => (
                          <MenuItem key={department.id} value={department.id}>
                            <Checkbox
                              checked={formData.departments.some((d) => d.id === department.id)}
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
                    {errors.departments && <FormHelperText>{errors.departments}</FormHelperText>}
                    {departmentsError[branch.id] && !isFetchingDepartments[branch.id] && (
                      <FormHelperText error>
                        <Box component="span" sx={{ mr: 1 }}>
                          ⚠️
                        </Box>
                        {departmentsError[branch.id]}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              ))}

            {formData.scopeLevel === "unit" &&
              formData.departments.map((dept) => {
                const department = Object.values(branchDepartments)
                  .flat()
                  .find((d) => d.id === dept.id);
                const branch = branches.find((b) => b.id === department?.branchId);
                return (
                  <Grid size={{ xs: 12, md: 6 }} key={dept.id}>
                    <FormControl fullWidth error={!!errors.units}>
                      <InputLabel
                        id={`unit-label-${dept.id}`}
                        sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}
                      >
                        Units for {dept.name} ({branch?.name || "Branch"})
                      </InputLabel>
                      <Select
                        labelId={`unit-label-${dept.id}`}
                        id={`units-${dept.id}`}
                        name={`units-${dept.id}`}
                        multiple
                        value={formData.units
                          .filter((unit) => departmentUnits[dept.id]?.some((u) => u.id === unit.id))
                          .map((u) => u.id)}
                        onChange={handleUnitSelectChange(dept.id)}
                        onOpen={() => fetchUnits(dept.id)}
                        label={`Units for ${dept.name} (${branch?.name || "Branch"})`}
                        disabled={loading}
                        renderValue={(selected) =>
                          (selected as string[])
                            .map((id) => formData.units.find((u) => u.id === id)?.name || departmentUnits[dept.id]?.find((unit) => unit.id === id)?.name || id)
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
                        {isFetchingUnits[dept.id] ? (
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
                        ) : departmentUnits[dept.id]?.length > 0 ? (
                          departmentUnits[dept.id].map((unit) => (
                            <MenuItem
                              key={unit.id}
                              value={unit.id}
                              sx={{
                                whiteSpace: "normal",
                                py: 1.5,
                              }}
                            >
                              <Checkbox checked={formData.units.some((u) => u.id === unit.id)} />
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
                      {errors.units && <FormHelperText>{errors.units}</FormHelperText>}
                      {unitsError[dept.id] && !isFetchingUnits[dept.id] && (
                        <FormHelperText error>
                          <Box component="span" sx={{ mr: 1 }}>
                            ⚠️
                          </Box>
                          {unitsError[dept.id]}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                );
              })}
              {formData.scopeLevel === "branch" && 
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
              }
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
              <CircularProgress size={24} color="inherit" /> Updating
            </span>
          ) : (
            "Update Admin"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAdminModal;