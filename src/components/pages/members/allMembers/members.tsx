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
} from "@mui/material";
import { BsPerson, BsCalendar, BsGeoAlt } from "react-icons/bs";
import { IoCallOutline } from "react-icons/io5";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

// Interface for form data
interface FormData {
  name: string;
  address: string;
  whatsappNo: string;
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
}

interface Unit {
  id: string;
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

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));

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
    whatsappNo: "",
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [fetchingUnits, setFetchingUnits] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    if (!authData?.churchId) return;
    try {
      const response = await Api.get(`/church/get-departments`);
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);     
    }
  }, [authData?.churchId, isMobile]);

  // Fetch units based on selected department
  const fetchUnits = useCallback(
    async (departmentId: string) => {
      if (!authData?.churchId || !departmentId) {
        setUnits([]);
        return;
      }
      setFetchingUnits(true);
      try {
        const response = await Api.get(
          `/church/a-department/${departmentId}`
        );
        setUnits(response.data.units || []);
      } catch (error) {
        console.error("Failed to fetch units:", error);
      } finally {
        setFetchingUnits(false);
      }
    },
    [authData?.churchId, isMobile]
  );

  // Initial data fetch
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

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
      if (name === "departmentIds" && typeof value === "string") {
        setFormData((prev) => ({ ...prev, unitIds: [] }));
        fetchUnits(value);
      }
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
        departmentIds: formData.departmentIds.length > 0 ? [formData.departmentIds[0]] : [],
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
        whatsappNo: "",
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

  // Render selected unit names
  const renderUnitValues = (selected: string[]) => {
    return selected
      .map((id) => units.find((unit) => unit.id === id)?.name || id)
      .join(", ");
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
        </Box>

        {/* Form Section */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 4, borderRadius: 2 }}>
          {currentStep === 0 ? (
            <Grid container spacing={4}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="WhatsApp Number"
                  id="whatsappNo"
                  name="whatsappNo"
                  value={formData.whatsappNo}
                  type="tel"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  id="phoneNo"
                  name="phoneNo"
                  type="tel"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Year of Membership"
                  id="memberSince"
                  name="memberSince"
                  type="date"
                  value={formData.memberSince}
                  onChange={handleChange}
                  variant="outlined"
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
                  InputLabelProps={{ shrink: true, sx: { fontSize: isLargeScreen ? "1rem" : undefined } }}
                />
              </Grid>
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
                    startAdornment={
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
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
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="birthMonth-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Birth Month *
                  </InputLabel>
                  <Select
                    labelId="birthMonth-label"
                    id="birthMonth"
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isLoading}
                    label="Birth Month *"
                    startAdornment={
                      <InputAdornment position="start">
                        <BsCalendar style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                  >
                    <MenuItem value="" disabled>
                      Select birth month
                    </MenuItem>
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="birthDay-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Birth Day *
                  </InputLabel>
                  <Select
                    labelId="birthDay-label"
                    id="birthDay"
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isLoading}
                    label="Birth Day *"
                    startAdornment={
                      <InputAdornment position="start">
                        <BsCalendar style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                  >
                    <MenuItem value="" disabled>
                      Select day
                    </MenuItem>
                    {days.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="State *"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter state"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nationality *"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter nationality"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="departmentIds-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Department
                  </InputLabel>
                  <Select
                    labelId="departmentIds-label"
                    id="departmentIds"
                    name="departmentIds"
                    value={formData.departmentIds[0] || ""}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isLoading || departments.length === 0}
                    label="Department"
                    startAdornment={
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                  >
                    <MenuItem value="" disabled>
                      {departments.length === 0 ? "No departments available" : "Select department"}
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="unitIds-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    Units
                  </InputLabel>
                  <Select
                    labelId="unitIds-label"
                    id="unitIds"
                    name="unitIds"
                    multiple
                    value={formData.unitIds}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isLoading || fetchingUnits || units.length === 0 || !formData.departmentIds[0]}
                    label="Units"
                    renderValue={renderUnitValues}
                    startAdornment={
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                  >
                    <MenuItem value="" disabled>
                      <ListItemText primary={units.length === 0 ? "No units available" : "Select units"} />
                    </MenuItem>
                    {units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        <Checkbox checked={formData.unitIds.includes(unit.id)} />
                        <ListItemText primary={unit.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
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
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary, marginTop: -14 }} />
                      </InputAdornment>
                    ),
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
                    Creating Worker...
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