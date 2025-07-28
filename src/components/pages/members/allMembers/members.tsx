import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import { BsPerson, BsCalendar, BsGeoAlt } from "react-icons/bs";
import { IoCallOutline } from "react-icons/io5";
import DashboardManager from "../../../shared/dashboardManager";
import { SelectChangeEvent } from '@mui/material/Select';
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

// Interface for form data
interface FormData {
  name: string;
  address: string;
  whatappNo: string;
  phoneNo: string;
  sex: string;
  maritalStatus: string;
  memberSince: string;
  ageFrom: number | null;
  ageTo: number | null;
  birthMonth: string;
  birthDay: string;
  state: string;
  LGA: string;
  nationality: string;
  departmentIds: string[];
  unitIds: string[];
  comments: string;
}

// Interface for department and unit data
interface Department {
  id: string;
  name: string;
  type?: string;
}

// Interface for Countries and unit data
interface Countries {
  iso2: string;
  name: string;
  flag: string;
}


interface Unit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
}

interface State {
  name: string;
}

// Constants
const ageRanges = [
  { label: "0-11", from: 0, to: 11 },
  { label: "12-18", from: 12, to: 18 },
  { label: "19-25", from: 19, to: 25 },
  { label: "26-35", from: 26, to: 35 },
  { label: "36-45", from: 36, to: 45 },
  { label: "46-55", from: 46, to: 55 },
  { label: "56+", from: 56, to: null },
];

const months = [
  { name: "January", value: "01" },
  { name: "February", value: "02" },
  { name: "March", value: "03" },
  { name: "April", value: "04" },
  { name: "May", value: "05" },
  { name: "June", value: "06" },
  { name: "July", value: "07" },
  { name: "August", value: "08" },
  { name: "September", value: "09" },
  { name: "October", value: "10" },
  { name: "November", value: "11" },
  { name: "December", value: "12" },
];

const steps = ["Basic Information", "Additional Details"];

const MemberSince: React.FC = () => {
  // State management
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    whatappNo: "",
    phoneNo: "",
    sex: "",
    maritalStatus: "",
    memberSince: "",
    ageFrom: null,
    ageTo: null,
    birthMonth: "",
    birthDay: "",
    state: "",
    LGA: "",
    nationality: "",
    departmentIds: [],
    unitIds: [],
    comments: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [downLoading, setDownLoading] = useState(false);
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [countries, setCountries] = useState<Countries[]>([]);
  const [isFetchingCountries, setIsFetchingCountries] = useState(false);
  const [hasFetchedCountries, setHasFetchedCountries] = useState(false);
  const [departmentUnits, setDepartmentUnits] = useState<{ [deptId: string]: Unit[] }>({});
  const [hasFetchedDepartments, setHasFetchedDepartments] = useState(false);
  const [hasFetchedUnits, setHasFetchedUnits] = useState<{ [deptId: string]: boolean }>({});
  const [isFetchingDepartments, setIsFetchingDepartments] = useState(false);
  const [isFetchingUnits, setIsFetchingUnits] = useState<{ [deptId: string]: boolean }>({});
  const [departmentsError, setDepartmentsError] = useState("");
  const [unitsError, setUnitsError] = useState<{ [deptId: string]: string }>({});
  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // select year membership since function
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1960 + 1 }, (_, i) => 1960 + i);


  // Fetch departments
  const fetchDepartments = useCallback(async () => {
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
  }, [hasFetchedDepartments]);

  // Fetch units for a specific department
  const fetchUnits = useCallback(async (deptId: string) => {
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
  }, [hasFetchedUnits, isFetchingUnits]);

  // Handle department selection
  const handleDepartmentChange = (event: SelectChangeEvent<string[]>)  => {
    const selectedIds = event.target.value as string[];
    setFormData((prev) => ({
      ...prev,
      departmentIds: selectedIds,
      unitIds: [], // Reset unitIds when departments change
    }));
    setDepartmentUnits({});
    setHasFetchedUnits({});
    setUnitsError({});
  };

  // Handle unit selection
  const handleUnitChange =  (deptId: string) => (event: SelectChangeEvent<string[]>) => {
    const selectedUnitIds = event.target.value as string[];
    const otherUnitIds = formData.unitIds.filter(
      (unitId) => !departmentUnits[deptId]?.some((unit) => unit.id === unitId)
    );
    setFormData((prev) => ({
      ...prev,
      unitIds: [...otherUnitIds, ...selectedUnitIds],
    }));
  };

  // fetch locations
  const fetchLocations = useCallback(async () => {
    if (hasFetchedCountries || isFetchingCountries) return; // Skip if already set

    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/flag/images");
      const result = await response.json(); // Parse the JSON response
      setCountries(result.data || []); 
      setHasFetchedCountries(true);     
    } catch (error: any) {
      console.error("Error fetching locations:", error);
    } finally{
      setIsFetchingCountries(false)
    }
  }, [hasFetchedCountries, isFetchingCountries]);

  // Fetch states when nationality changes
   useEffect(() => {
    const fetchStates = async () => {
      if (!formData.nationality) return;
      
      setLoadingStates(true);
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            country: formData.nationality
          })
        });
        const data = await response.json();
        setStates(data.data?.states || []);
        setFormData(prev => ({ ...prev, state: '' })); // Reset state when country changes
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [formData.nationality]);  

  // Initial data fetch
  useEffect(() => {
    fetchDepartments();
    fetchLocations();
  }, [fetchDepartments, fetchLocations]);


  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name?: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle age range selection
  const handleAgeRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedAgeRange(value);
    const selectedRange = ageRanges.find((range) => range.label === value);
    if (selectedRange) {
      setFormData((prev) => ({
        ...prev,
        ageFrom: selectedRange.from,
        ageTo: selectedRange.to,
      }));
    }
  };

  // Handle stepper navigation
  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!formData.name || !formData.address || !formData.phoneNo || !formData.sex || !formData.maritalStatus) {
        toast.error("Please fill in all required fields", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Handle downloading Excel template
  const handleDownloadTemplate = async () => {
    setDownLoading(true);
    try {
      const response = await Api.get("/member/import-template", {
        responseType: "blob",
      });
      const contentDisposition = response.headers["content-disposition"];
      let filename = "workers-template.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel template downloaded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error: any) {
      console.error("Failed to download template:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to download Excel template. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setDownLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (
        !formData.name ||
        !formData.address ||
        !formData.phoneNo ||
        !formData.birthMonth ||
        !formData.birthDay ||
        !formData.state ||
        !formData.LGA ||
        !formData.nationality
      ) {
        throw new Error("Please fill in all required fields");
      }
      const payload = {
        ...formData,
        departmentIds: formData.departmentIds,
      };
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/add-member?churchId=${authData?.churchId}${branchIdParam}`, payload);
      toast.success("Worker created successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setFormData({
        name: "",
        address: "",
        whatappNo: "",
        phoneNo: "",
        sex: "",
        maritalStatus: "",
        memberSince: "",
        ageFrom: null,
        ageTo: null,
        birthMonth: "",
        birthDay: "",
        state: "",
        LGA: "",
        nationality: "",
        departmentIds: [],
        unitIds: [],
        comments: "",
      });
      setSelectedAgeRange("");
      setTimeout(() => {
        navigate("/members/view-members");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating worker:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to create Worker. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Excel import
  const handleImportExcel = () => {
    setOpenDialog(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setSelectedFile(file);
    } else {
      toast.error("Please select a valid Excel file (.xlsx or .xls)", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setSelectedFile(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setSelectedFile(file);
    } else {
      toast.error("Please drop a valid Excel file (.xlsx or .xls)", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setSelectedFile(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an Excel file to upload", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/import?churchId=${authData?.churchId}${branchIdParam}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Excel file uploaded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setOpenDialog(false);
      setSelectedFile(null);
      setTimeout(() => {
        navigate("/members/view-members");
      }, 1500);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to upload Excel file. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFile(null);
    setIsDragging(false);
  };

  function getDaysInMonth(month: string): number {
    const monthNumber = parseInt(month, 10);    
    
    // Handle February with leap year calculation
    if (monthNumber === 2) {
      return 29
      // return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28; handles for leap year
    }
    
    // Months with 31 days
    if ([1, 3, 5, 7, 8, 10, 12].includes(monthNumber)) {
      return 31;
    }
    
    // All others have 30 days
    return 30;
  }

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
              sx={{ color: theme.palette.text.primary, fontSize: isLargeScreen ? "1.5rem" : undefined }}
            >
              Manage Workers
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: isLargeScreen ? "0.8125rem" : undefined }}
            >
              Create and manage Workers records for {authData?.church_name}.
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
              onClick={() => navigate("/members/view-members")}
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
                "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
              }}
            >
              View Workers
            </Button>
          </Grid>
        </Grid>

        {/* Stepper and Download Template */}
        <Box sx={{ width: { xs: "100%", sm: "75%", md: "40%" }, mb: 5, mx: "auto", textAlign: "center" }}>
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            sx={{
              width: "100%",
              padding: { xs: 1, sm: 2 },
              "& .MuiStepLabel-root": { padding: 0, width: "100%" },
              "& .MuiStepLabel-label": {
                fontSize: "0.75rem",
                color: "#6B7280",
                "&.Mui-active": { color: "var(--color-primary) !important", fontWeight: "bold" },
                "&.Mui-completed": { color: "var(--color-primary) !important", fontWeight: "normal" },
              },
              "& .MuiStepIcon-root": {
                color: "#D1D5DB",
                "&.Mui-active": { color: "var(--color-primary)" },
                "&.Mui-completed": { color: "var(--color-primary)" },
              },
              "& .MuiStepIcon-text": { fill: "#FFFFFF" },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {currentStep === 0 && <Tooltip title='Download Worker Form Template In Excel'>
            <Button
              variant="contained"
              onClick={handleDownloadTemplate}
              disabled={downLoading}
              sx={{
                py: 1,
                backgroundColor: "var(--color-primary)",
                px: { xs: 3, sm: 3 },
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "0.875rem" : { xs: "1rem", sm: "1rem" },
                "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
                ml: "auto",
              }}
            >
              {downLoading ? (
                <>
                  <CircularProgress size={18} sx={{ color: "var(--color-text-on-primary)", mr: 1 }} />
                  Downloading...
                </>
              ) : (
                "Download Excel Template"
              )}
            </Button>
          </Tooltip>}
        </Box>

        {/* Form Section */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 4, borderRadius: 2 }}>
          {currentStep === 0 ? (
            <Grid container spacing={4}>
              {/* fullname input  */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter full name"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                  InputLabelProps={{ sx: { fontSize: isLargeScreen ? "1rem" : undefined } }}
                  required
                />
              </Grid>

              {/* gender input */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="sex-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Gender *
                  </InputLabel>
                  <Select
                    labelId="sex-label"
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isLoading}
                    label="Gender *"
                    startAdornment={
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                  >
                    <MenuItem value="" disabled>
                      Select Gender
                    </MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* whatsapp input */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="WhatsApp Number"
                  id="whatappNo"
                  name="whatappNo"
                  value={formData.whatappNo}
                  type="number"
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter WhatsApp number"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                  InputLabelProps={{ sx: { fontSize: isLargeScreen ? "1rem" : undefined } }}
                />
              </Grid>

              {/* phone number input */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  id="phoneNo"
                  name="phoneNo"
                  type="number"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter phone number"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                  InputLabelProps={{ sx: { fontSize: isLargeScreen ? "1rem" : undefined } }}
                  required
                />
              </Grid>

              {/* martial status input */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="maritalStatus-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Marital Status *
                  </InputLabel>
                  <Select
                    labelId="maritalStatus-label"
                    id="maritalStatus"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isLoading}
                    label="Marital Status *"
                    startAdornment={
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                  >
                    <MenuItem value="" disabled>
                      Select marital status
                    </MenuItem>
                    <MenuItem value="single">Single</MenuItem>
                    <MenuItem value="married">Married</MenuItem>
                    <MenuItem value="divorced">Divorced</MenuItem>
                    <MenuItem value="widowed">Widowed</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* year of membership input */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="ageRange-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                   Year of Membership
                  </InputLabel>
                  <Select
                    fullWidth
                    label="Year of Membership"
                    id="memberSince"
                    name="memberSince"
                    value={formData.memberSince}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isLoading}
                    size="medium"
                    startAdornment={
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{ 
                      fontSize: isLargeScreen ? "1rem" : undefined,
                      textAlign: 'left'
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300 // Limit dropdown height
                        }
                      }
                    }}
                  >
                    {years.map((year) => (
                      <MenuItem  key={String(year)} value={String(year)}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* address input */}
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  fullWidth
                  label="Address *"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter address"
                  disabled={isLoading}
                  size="medium"
                  multiline
                  rows={3}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary, marginTop: -14 }} />
                      </InputAdornment>
                    ),
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                  InputLabelProps={{ sx: { fontSize: isLargeScreen ? "1rem" : undefined } }}
                  required
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={4}>
               {/* age range input */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="ageRange-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Age Range
                  </InputLabel>
                  <Select
                    labelId="ageRange-label"
                    value={selectedAgeRange}
                    onChange={handleAgeRangeChange as any}
                    variant="outlined"
                    disabled={isLoading}
                    label="Age Range"                  
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                  >
                    <MenuItem value="" disabled>
                      Select age range
                    </MenuItem>
                    {ageRanges.map((range) => (
                      <MenuItem key={range.label} value={range.label}>
                        {range.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Month/Day Row */}         
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  id="birthDate"
                  options={(() => {
                    const options = [];
                    for (const month of months) {
                      const daysInMonth = getDaysInMonth(month.value);
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dayFormatted = day.toString().padStart(2, '0'); // Format day as two digits
                        options.push({
                          value: `${month.value}-${dayFormatted}`,
                          label: `${month.name} ${dayFormatted}`,
                          monthName: month.name,
                          day: day
                        });
                      }
                    }
                    return options;
                  })()}
                  getOptionLabel={(option) => option.label}
                  value={
                    formData.birthMonth && formData.birthDay
                      ? {
                          value: `${formData.birthMonth}-${formData.birthDay.toString().padStart(2, '0')}`,
                          label: `${months.find(m => m.value === formData.birthMonth)?.name || ''} ${formData.birthDay.toString().padStart(2, '0')}`,
                          monthName: months.find(m => m.value === formData.birthMonth)?.name || '',
                          day: Number(formData.birthDay)
                        }
                      : null
                  }
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  onChange={(_event, newValue) => {
                    if (newValue) {
                      const [month, day] = newValue.value.split('-');
                      handleChange({
                        target: { name: 'birthMonth', value: month }
                      });
                      handleChange({
                        target: { name: 'birthDay', value: day }
                      });
                    } else {
                      handleChange({ target: { name: 'birthMonth', value: '' } });
                      handleChange({ target: { name: 'birthDay', value: '' } });
                    }
                  }}
                  filterOptions={(options, state) => {
                    const input = state.inputValue.toLowerCase();
                    return options.filter(option => 
                      option.monthName.toLowerCase().includes(input) || 
                      option.day.toString().padStart(2, '0').includes(input) || // Search with two-digit format
                      option.label.toLowerCase().includes(input)
                    );
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={option.value} {...otherProps}>
                        {option.label}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Date of Birth *"
                      variant="outlined"
                      required
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start" sx={{paddingLeft: 2}}>
                            <BsCalendar style={{ color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        ),
                        sx: { 
                          fontSize: isLargeScreen ? "1rem" : undefined,
                          '& input': {
                            paddingLeft: '8px !important'
                          }
                        }
                      }}
                      InputLabelProps={{ 
                        sx: { 
                          fontSize: isLargeScreen ? "1rem" : undefined,
                          transform: params.inputProps.value ? 'translate(14px, -9px) scale(0.75)' : undefined
                        } 
                      }}
                    />
                  )}
                  disabled={isLoading}
                  size="medium"
                  sx={{ 
                    '& .MuiAutocomplete-inputRoot': {
                      paddingLeft: '6px'
                    }
                  }}
                />
              </Grid>
       
              {/* Country Select */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  id="nationality"
                  options={countries}
                  getOptionLabel={(option: Countries) => option.name}
                  value={countries.find(c => c.name === formData.nationality) || null}
                  onChange={(_event: any, newValue: Countries | null) => {
                    handleChange({
                      target: {
                        name: "nationality",
                        value: newValue?.name || ""
                      }
                    });
                  }}
                  isOptionEqualToValue={(option, value) => option.name === value?.name}
                  filterOptions={(options, state) => {
                    return options.filter(option =>
                      option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                    );
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props; // Extract key from props
                    return (
                      <li 
                        key={key} // Pass key directly
                        {...otherProps} // Spread remaining props
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <img 
                          src={option.flag} 
                          alt={option.iso2} 
                          style={{ 
                            width: 24, 
                            height: 16, 
                            marginRight: 8, 
                            flexShrink: 0 
                          }} 
                        />
                        <span>{option.name}</span>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nationality *"
                      variant="outlined"
                      required
                      InputProps={{
                        ...params.InputProps,                    
                        sx: { 
                          fontSize: isLargeScreen ? "1rem" : undefined,
                          '& input': {
                            paddingLeft: '8px !important'
                          }
                        }
                      }}
                      InputLabelProps={{ 
                        sx: { 
                          fontSize: isLargeScreen ? "1rem" : undefined,
                          transform: params.inputProps.value ? 'translate(14px, -9px) scale(0.75)' : undefined
                        } 
                      }}
                    />
                  )}
                  disabled={isLoading}
                  size="medium"
                  sx={{ 
                    '& .MuiAutocomplete-inputRoot': {
                      paddingLeft: '6px'
                    }
                  }}
                />
              </Grid>

              {/* State Select */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  id="state"
                  options={states}
                  loading={loadingStates}
                  loadingText="Loading states..."
                  getOptionLabel={(option: State) => option.name}
                  value={states.find(s => s.name === formData.state) || null}
                  onChange={(_event: any, newValue: State | null) => {
                    handleChange({
                      target: {
                        name: "state",
                        value: newValue?.name || ""
                      }
                    });
                  }}
                  isOptionEqualToValue={(option, value) => option.name === value?.name}
                  filterOptions={(options, state) => {
                    return options.filter(option =>
                      option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                    );
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps} style={{ display: 'flex', alignItems: 'center' }}>
                        <span>{option.name}</span>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="State *"
                      variant="outlined"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStates && <CircularProgress color="inherit" size={20} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                        sx: { 
                          fontSize: isLargeScreen ? "1rem" : undefined,
                          '& input': {
                            paddingLeft: '8px !important'
                          }
                        }
                      }}
                      InputLabelProps={{ 
                        sx: { 
                          fontSize: isLargeScreen ? "1rem" : undefined,
                          transform: params.inputProps.value ? 'translate(14px, -9px) scale(0.75)' : undefined
                        } 
                      }}
                    />
                  )}
                  noOptionsText={!formData.nationality ? "Select a Nationality or Country first" : "No states found"}
                  size="medium"
                  sx={{ 
                    '& .MuiAutocomplete-inputRoot': {
                      paddingLeft: '6px'
                    }
                  }}
                />
              </Grid>

              {/* L.G.A Input form */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="LGA *"
                  id="LGA"
                  name="LGA"
                  value={formData.LGA}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter local government area"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                  InputLabelProps={{ sx: { fontSize: isLargeScreen ? "1rem" : undefined } }}
                  required
                />
              </Grid> 

              {/* department form*/}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="departmentIds-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Departments
                  </InputLabel>
                  <Select
                    labelId="departmentIds-label"
                    id="departmentIds"
                    name="departmentIds"
                    multiple
                    value={formData.departmentIds}
                    onChange={handleDepartmentChange}
                    onOpen={fetchDepartments}
                    variant="outlined"
                    disabled={isLoading || isFetchingDepartments}
                    label="Departments"
                    renderValue={(selected) =>
                      (selected as string[])
                        .map((id) => departments.find((dept) => dept.id === id)?.name || id)
                        .join(", ")
                    }
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
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
                    ) : departments.length === 0 && hasFetchedDepartments ? (
                      <MenuItem disabled>
                        <Typography variant="body2">No departments available</Typography>
                      </MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          <Checkbox
                            checked={formData.departmentIds.includes(dept.id)}
                            sx={{
                              color: "var(--color-primary)",
                              "&.Mui-checked": { color: "var(--color-primary)" },
                            }}
                          />
                          <ListItemText primary={dept.type ? `${dept.name} - (${dept.type})` : dept.name} />
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

              {/* dynamic unit input form */}
              {formData.departmentIds.map((deptId) => (
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
                      onChange={handleUnitChange(deptId)}
                      onOpen={() => fetchUnits(deptId)}
                      variant="outlined"
                      disabled={isLoading || isFetchingUnits[deptId]}
                      label={`Units for ${departments.find((dept) => dept.id === deptId)?.name || "Department"}`}
                      renderValue={(selected) =>
                        (selected as string[])
                          .map((id) => departmentUnits[deptId]?.find((unit) => unit.id === id)?.name || id)
                          .join(", ")
                      }
                      sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
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
                          <MenuItem key={unit.id} value={unit.id}>
                            <Checkbox
                              checked={formData.unitIds.includes(unit.id)}
                              sx={{
                                color: "var(--color-primary)",
                                "&.Mui-checked": { color: "var(--color-primary)" },
                              }}
                            />
                            <ListItemText
                              primary={unit.name}
                              secondary={unit.description || "No description"}
                            />
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

              {/* comment input */}
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  fullWidth
                  label="Comments"
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter any additional comments"
                  disabled={isLoading}
                  size="medium"
                  multiline
                  rows={3}
                  InputProps={{
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                  InputLabelProps={{ sx: { fontSize: isLargeScreen ? "1rem" : undefined } }}
                />
              </Grid>
            </Grid>
          )}

          {/* Form Actions */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            {currentStep === 1 ? (
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                disabled={isLoading}
                sx={{
                  py: 1,
                  px: { xs: 2, sm: 2 },
                  borderRadius: 1,
                  fontWeight: "semibold",
                  textTransform: "none",
                  fontSize: { xs: "1rem", sm: "1rem" },
                }}
              >
                Previous
              </Button>
            ) : (
              <div />
            )}
            {currentStep === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "end",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  alignItems: { xs: "flex-end" },
                  width: "100%",
                  px: 2,
                  py: 1,
                }}
              >
                <Tooltip title="Import worker's data in excel to this system ">
                  <Button
                    variant="contained"
                    onClick={handleImportExcel}
                    disabled={isLoading}
                    sx={{
                      py: 1,
                      backgroundColor: "var(--color-primary)",
                      px: { xs: 3, sm: 3 },
                      borderRadius: 1,
                      fontWeight: "semibold",
                      textTransform: "none",
                      color: "var(--color-text-on-primary)",
                      fontSize: { xs: "1rem", sm: "1rem" },
                      "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
                      width: { xs: "100%", sm: "auto" },
                      order: { xs: 2, sm: 1 },
                    }}
                  >
                    Import Excel
                  </Button>
                </Tooltip>
                <Button
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  sx={{
                    py: 1,
                    backgroundColor: "var(--color-primary)",
                    px: { xs: 3, sm: 3 },
                    borderRadius: 1,
                    fontWeight: "semibold",
                    textTransform: "none",
                    color: "var(--color-text-on-primary)",
                    fontSize: { xs: "1rem", sm: "1rem" },
                    "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
                    width: { xs: "100%", sm: "auto" },
                    order: { xs: 1, sm: 2 },
                  }}
                >
                  Next
                </Button>
              </Box>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1,
                  backgroundColor: "var(--color-primary)",
                  px: { xs: 2, sm: 2 },
                  borderRadius: 1,
                  fontWeight: "semibold",
                  color: "var(--color-text-on-primary)",
                  textTransform: "none",
                  fontSize: { xs: "1rem", sm: "1rem" },
                  "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
                  ml: "auto",
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                    Creating...
                  </>
                ) : (
                  "Create Worker"
                )}
              </Button>
            )}
          </Box>
        </Box>

        {/* Import Excel Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Import Excel File</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.grey[400]}`,
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                bgcolor: isDragging ? theme.palette.grey[100] : "transparent",
                transition: "all 0.2s",
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Drag and drop your Excel file here or
              </Typography>
              <Button
                variant="contained"
                component="label"
                sx={{
                  mt: 2,
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-on-primary)",
                  "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
                }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={isLoading || !selectedFile}
              sx={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardManager>
  );
};

export default MemberSince;