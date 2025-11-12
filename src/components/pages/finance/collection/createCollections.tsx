import React, { useState, useCallback, useEffect } from "react";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import dayjs from "dayjs";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  FormControlLabel as CheckboxFormControlLabel,
  IconButton,
  Checkbox,
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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

interface FormData {
  name: string;
  description: string;
  endTime?: string;
  branchIds: string[];
  departmentIds: string[];
  scopeLevel: string;
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

interface BranchDepartments {
  [branchId: string]: Department[];
}


interface Errors {
  name: string;
  description: string;
  endTime: string;
  branchIds: string;
  departmentIds: string;
  memberIds: string;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateCollection: React.FC<AdminModalProps> = ({ open, onClose, onSuccess }) => {
  usePageToast('create-collections');
  
  const initialFormData: FormData = {
    name: "",
    description: "",
    endTime: undefined,
    scopeLevel: "branch",
    branchIds: [],
    departmentIds: [],
  };

  const initialErrors: Errors = {
    name: "",
    description: "",
    endTime: "",
    branchIds: "",
    departmentIds: "",
    memberIds: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchDepartments, setBranchDepartments] = useState<BranchDepartments>({});
  const [hasFetchedBranches, setHasFetchedBranches] = useState(false);
  const [hasFetchedDepartments, setHasFetchedDepartments] = useState<{ [branchId: string]: boolean }>({});
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState<{ [branchId: string]: boolean }>({});
  const [branchesError, setBranchesError] = useState("");
  const [departmentsError, setDepartmentsError] = useState<{ [branchId: string]: string }>({});
  const [, setMembersError] = useState<{ [deptId: string]: string }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [isScheduleChecked, setIsScheduleChecked] = useState(false);

  const getScopeLevels = useCallback((role?: string, isHeadQuarter?: boolean, isSuperAdmin?: boolean) => {

    const branchOption = {
      value: "branch",
      label: (authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1) ? "Church" : "Branch",
    };
    switch (role) {
      case "branch":
        return [
          ...(isSuperAdmin ? [branchOption] : []),
          { value: "department", label: "Department" },
          ...(isHeadQuarter ? [{ value: "church", label: "Church" }] : []),
        ];
      case "department":
        return [
          { value: "department", label: "Department" },
        ];
      default:
        return [];
    }
  }, []);

  const scopeLevels = getScopeLevels(authData?.role, authData?.isHeadQuarter, authData?.isSuperAdmin);

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


  const handleScopeLevelChange = useCallback((e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev, // Keep existing name, description, endTime
      scopeLevel: value,
      branchIds: [], // Reset scope-specific fields
      departmentIds: [],
      members: [],
    }));
    setErrors(initialErrors);
    setBranchDepartments({});
    setHasFetchedDepartments({});
    setDepartmentsError({});
    setMembersError({});
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // SINGLE Branch for branch/department scope
  const handleSingleBranchChange = useCallback((e: SelectChangeEvent<string>) => {
    const branchId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      branchIds: branchId ? [branchId] : [],
      departmentIds: [],
      members: [],
    }));
    setErrors((prev) => ({ ...prev, branchIds: "", departmentIds: "", memberIds: "" }));
    if (branchId) {
      fetchDepartmentsForBranch(branchId);
    }
  }, [fetchDepartmentsForBranch]);

  // SINGLE Department for department scope
  const handleSingleDepartmentChange = useCallback((e: SelectChangeEvent<string>) => {
    const deptId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      departmentIds: deptId ? [deptId] : [],
      members: [],
    }));
    setErrors((prev) => ({ ...prev, departmentIds: "", memberIds: "" }));
  }, []);

  // MULTIPLE Branches for church scope
  const handleMultipleBranchChange = useCallback((e: SelectChangeEvent<string[]>) => {
    const branchIds = e.target.value as string[];
    setFormData((prev) => ({
      ...prev,
      branchIds,
      departmentIds: [],
      members: [],
    }));
    setErrors((prev) => ({ ...prev, branchIds: "", departmentIds: "", memberIds: "" }));
    setBranchDepartments({});
    setHasFetchedDepartments({});
    setDepartmentsError({});
    setMembersError({});
  }, []);


  const validateForm = useCallback((): boolean => {
    const newErrors: Errors = { ...initialErrors };

    if (!formData.name.trim()) {
      newErrors.name = "Collection name is required";
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

    if (formData.scopeLevel === "branch") {
      if (formData.branchIds.length === 0) {
        newErrors.branchIds = "Please select a branch";
      }
    }

    if (formData.scopeLevel === "department") {
      if (formData.branchIds.length === 0) {
        newErrors.branchIds = "Please select a branch";
      }
      if (formData.departmentIds.length === 0) {
        newErrors.departmentIds = "Please select a department";
      }
    }

    if (formData.scopeLevel === "church") {  
      const hasBranches = formData.branchIds?.length > 0;

     if (hasBranches) {
        // Case 3: Only validate branches
        if (formData.branchIds.length === 0) newErrors.branchIds = "Please select at least one branch";
      } else {
        // No selection at all
        newErrors.branchIds = "Please select branches";
      }
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let endpoint = "/church/create-collection";
      let payload: Record<string, any> = {
        name: formData.name.trim(),
        // Only add description if it has content
        ...(formData.description.trim() && { description: formData.description.trim() }),
        ...(formData.endTime && { endTime: formData.endTime }),
      };
      
      // --- Scope Level Logic ---
      if (formData.scopeLevel === "branch") {
        const branchId = formData.branchIds[0];
        payload.scopeType = "branch";
        endpoint += `?branchId=${branchId}`;
      } else if (formData.scopeLevel === "department") {
        payload.scopeType = "department";
        const branchId = formData.branchIds[0];
        const deptId = formData.departmentIds[0];
        endpoint += `?branchId=${branchId}&departmentId=${deptId}`;
      } else if (formData.scopeLevel === "church") {
        endpoint += `?branchId=${authData?.branchId}`;
        payload.scopeType = "church";
        const hasBranches = formData.branchIds?.length > 0;

        // Apply church scope logic - EXACT MATCH
        if  (hasBranches) {
          // Case 3: send only branchIds
          payload.branchIds = formData.branchIds;
        }
      }

      // --- API Call ---
      await Api.post(endpoint, payload);

      showPageToast("Collection created successfully!", 'success');
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
        setMembersError({});
        onClose();
      }, 3000);
      onSuccess?.();
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Failed to create collection";
      if (responseData) {
        if (Array.isArray(responseData.errors)) {
          errorMessage = responseData.errors.join(", ");
        } else if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      }
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
    setMembersError({});
    onClose();
  }, [onClose]);

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
            Create Collection
          </Typography>
          <IconButton onClick={handleCancel}>
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
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Collection Name "
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Collection name"
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
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Description"
                disabled={loading}
                size="medium"
                multiline
                minRows={3}
                maxRows={6}
                error={!!errors.description}
                helperText={errors.description}
                InputProps={{
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    fontSize: "0.9rem",
                    paddingY: 1,
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" }, fontSize: "0.9rem" },
                }}              
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel
                  id="scope-level-label"
                  sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}
                >
                  Level of Collection
                </InputLabel>
                <Select
                  labelId="scope-level-label"
                  id="scopeLevel"
                  name="scopeLevel"
                  value={formData.scopeLevel}
                  onChange={handleScopeLevelChange}
                  label="Level of Collection"
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

            {/* SINGLE BRANCH SELECT - Branch & Department Scope */}
            {!(authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1) && (formData.scopeLevel === "branch" || formData.scopeLevel === "department") && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.branchIds}>
                  <InputLabel
                    id="branch-label"
                    sx={{
                      fontSize: isLargeScreen ? "1rem" : undefined,
                      color: "#F6F4FE",
                    }}
                  >
                    Select Branch
                  </InputLabel>
                  <Select
                    labelId="branch-label"
                    id="branch-select"
                    value={formData.branchIds[0] || ""}
                    onChange={handleSingleBranchChange}
                    onOpen={fetchBranches}
                    label="Select Branch"
                    disabled={loading}
                    sx={{
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                      "& .MuiSelect-select": { color: "#F6F4FE" },
                      "& .MuiSelect-icon": { color: "#F6F4FE" },
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

            {/* SINGLE DEPARTMENT SELECT - Department Scope */}
            {formData.scopeLevel === "department" && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.departmentIds}>
                  <InputLabel
                    id="department-select-label"
                    sx={{
                      fontSize: isLargeScreen ? "1rem" : undefined,
                      color: "#F6F4FE",
                    }}
                  >
                    Select Department
                  </InputLabel>
                  <Select
                    labelId="department-select-label"
                    id="department-select"
                    value={formData.departmentIds[0] || ""}
                    onChange={handleSingleDepartmentChange}
                    onOpen={() => {
                      const branchId = formData.branchIds[0];
                      if (branchId && !hasFetchedDepartments[branchId]) {
                        fetchDepartmentsForBranch(branchId);
                      }
                    }}
                    label="Select Department"
                    disabled={loading || !formData.branchIds[0]}
                    sx={{
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                      "& .MuiSelect-select": { color: "#F6F4FE" },
                      "& .MuiSelect-icon": { color: "#F6F4FE" },
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

            {/* CHURCH SCOPE - ALL 3 CASES */}
            {formData.scopeLevel === "church" && (
              <>
                {/* CASE 3: MULTIPLE BRANCH SELECT */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={!!errors.branchIds}>
                    <InputLabel
                      id="church-branch-label"
                      sx={{
                        fontSize: isLargeScreen ? "1rem" : undefined,
                        color: "#F6F4FE",
                      }}
                    >
                      Select Branch(es)
                    </InputLabel>
                    <Select
                      labelId="church-branch-label"
                      id="church-branchIds"
                      multiple
                      value={formData.branchIds}
                      onChange={handleMultipleBranchChange}
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
                        [
                          <MenuItem key="select-branch" value="" disabled>Select branches</MenuItem>,
                          ...branches.map((branch) => (
                            <MenuItem key={branch.id} value={branch.id}>
                              <Checkbox checked={formData.branchIds.includes(branch.id)} />
                              <ListItemText
                                primary={branch.name}
                                secondary={branch.address}
                                sx={{
                                  "& .MuiListItemText-primary": { fontWeight: 300 },
                                  "& .MuiListItemText-secondary": { color: "#B0B0B0" },
                                }}
                              />
                            </MenuItem>
                          )),
                        ]
                      ) : (
                        <MenuItem disabled>No branches available</MenuItem>
                      )}
                    </Select>
                    {errors.branchIds && <FormHelperText>{errors.branchIds}</FormHelperText>}
                  </FormControl>
                </Grid>
              </>
            )}

            {/* END DATE */}
            <Grid size={{ xs: 12 }}>
              <CheckboxFormControlLabel
                control={
                  <Checkbox
                    checked={isScheduleChecked}
                    onChange={(e) => setIsScheduleChecked(e.target.checked)}
                    sx={{ color: "#F6F4FE", "&.Mui-checked": { color: "#F6F4FE" } }}
                  />
                }
                label="Does this Collection have End Date?"
                sx={{ color: "#F6F4FE", mb: 1 }}
              />
              {isScheduleChecked && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Select Date"
                    value={formData.endTime ? dayjs(formData.endTime) : null}
                    onChange={(newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: newValue ? newValue.toISOString() : undefined,
                      }))
                    }
                    minDate={dayjs()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        placeholder: "Select date",
                        InputProps: {
                          sx: {
                            color: "#F6F4FE",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280 !important" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280 !important" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280 !important" },
                            fontSize: "0.9rem",
                            borderColor: "#777280 !important",
                          },
                        },
                        InputLabelProps: {
                          sx: {
                            color: "#F6F4FE",
                            "&.Mui-focused": { color: "#F6F4FE" },
                            fontSize: "0.9rem",
                          },
                        },
                        sx: {
                          "& .MuiSvgIcon-root": { color: "#F6F4FE" },
                          color: "#F6F4FE",
                          "& fieldset": { borderColor: "#777280 !important" },
                          "&:hover fieldset": { borderColor: "#777280 !important" },
                          "&.Mui-focused fieldset": { borderColor: "#777280 !important" },
                          fontSize: "0.9rem",
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
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
            "Create Collection"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCollection;