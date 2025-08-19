import React, { useState } from "react";
import { IoMailOutline, IoCallOutline, IoEyeOutline } from "react-icons/io5";
import { PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
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
        onClose();
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data.error.message || "Failed to create admin", {
        position: isMobile ? "top-center" : "top-right",
      });
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
      <DialogTitle>
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
          {loading ? <CircularProgress size={24} color="inherit" /> : "Create Admin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminModal;