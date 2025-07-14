import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMailOutline, IoCallOutline, IoEyeOutline } from "react-icons/io5";
import { PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import Api from "../../../shared/api/api";
import DashboardManager from "../../../shared/dashboardManager";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Container,
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
} from "@mui/material";

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

const Admin: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
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
  });
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
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Scope level options
  const scopeLevels: { value: string; label: string }[] = [
    { value: "branch", label: "Branch" },
    { value: "department", label: "Department" },
    { value: "unit", label: "Unit" },
  ];

  // Fetch branches when branch Select is opened
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

  // Fetch departments when department Select is opened
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

  // Fetch units for a specific department when its unit Select is opened
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

  // Reset related fields when scope level changes
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

    // Reset fetched data when scope changes
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

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle select changes (for branchId and departmentIds)
  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset unitIds when departmentIds changes
      ...(name === "departmentIds" && { unitIds: [] }),
    }));

    // Reset units and fetch states when departmentIds change
    if (name === "departmentIds") {
      setDepartmentUnits({});
      setHasFetchedUnits({});
      setUnitsError({});
    }
  };

  // Handle unit selection per department
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        title: formData.title || undefined,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        isSuperAdmin: formData.isSuperAdmin || undefined,
        scopeLevel: formData.scopeLevel,
        branchId: formData.branchId || undefined,
        departmentIds: formData.departmentIds.length > 0 ? formData.departmentIds : undefined,
        unitIds: formData.unitIds.length > 0 ? formData.unitIds : undefined,
      };

      await Api.post("church/create-admin", payload);

      toast.success("Admin created successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
      setTimeout(() => {
        navigate("/manage/view-admins");
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data.error.message || "Failed to create admin", {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardManager>
      <Container sx={{ py: isMobile ? 2 : 3 }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 9 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
              component="h1"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.5rem" : undefined,
              }}
            >
              Manage Admins
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.8125rem" : undefined,
              }}
            >
              Create and manage Admins for your church.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/manage/view-admins")}
              size="medium"
              sx={{
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: "semibold",
                color: "var(--color-text-on-primary)",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
              }}
            >
              View Admins
            </Button>
          </Grid>
        </Grid>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            mt: 4,
            borderRadius: 2,
          }}
        >
          <Grid container spacing={4}>
            {/* Name Field */}
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
                InputProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            {/* Title Field */}
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
                InputProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            {/* Email Field */}
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
                      <IoMailOutline style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            {/* Phone Field */}
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
                      <IoCallOutline style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            {/* Scope Level Selection */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="scope-level-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
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

            {/* Branch Selection - shown only when scopeLevel is branch */}
            {formData.scopeLevel === "branch" && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="branch-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
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
                      "& .MuiSelect-select": {
                        display: "flex",
                        alignItems: "center",
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

            {/* Department Selection - shown when scopeLevel is department or unit */}
            {(formData.scopeLevel === "department" || formData.scopeLevel === "unit") && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="department-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    {formData.scopeLevel === "department"
                        ? "Assign to Department(s)"
                        : "Select Department(s)"
                    }
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
                          {department.type
                            ? `${department.name} - (${department.type})`
                            : department.name}
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

            {/* Unit Selection per Department - shown when scopeLevel is unit and departmentIds are selected */}
            {formData.scopeLevel === "unit" &&
              formData.departmentIds.map((deptId) => (
                <Grid size={{ xs: 12, md: 6 }} key={deptId}>
                  <FormControl fullWidth>
                    <InputLabel id={`unit-label-${deptId}`} sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
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
                        "& .MuiSelect-select": {
                          display: "flex",
                          alignItems: "center",
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
                        departmentUnits[deptId].map((unit) => (
                          <MenuItem
                            key={unit.id}
                            value={unit.id}
                            sx={{
                              whiteSpace: "normal",
                              py: 1.5,
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2">{unit.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {unit.description || "No description"}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))
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

            {/* Password Field */}
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
                      <SlLock style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {!showPassword ? <PiEyeClosed size={20} /> : <IoEyeOutline size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            {/* Confirm Password Field */}
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
                      <SlLock style={{ color: theme.palette.text.secondary }} />
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
                          <PiEyeClosed size={20} />
                        ) : (
                          <IoEyeOutline size={20} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            {/* Super Admin Checkbox */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isSuperAdmin}
                    onChange={handleChange}
                    name="isSuperAdmin"
                    color="primary"
                  />
                }
                label="Is Super Admin?"
                sx={{
                  "& .MuiTypography-root": {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1,
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
                borderRadius: 1,
                color: "var(--color-text-on-primary)",
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Create Admin"}
            </Button>
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default Admin;