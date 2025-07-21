import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
  Container,
  TextField,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  InputAdornment,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  IoPersonOutline,
  IoCallOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { BsCalendarDate } from "react-icons/bs";
import { FaTransgender } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";

// Define interface for form data
interface FormData {
  name: string;
  phoneNo: string;
  sex: string;
  address: string;
  birthMonth: string;
  birthDay: string;
  timer: number | null;
}

// Define months and days for dropdowns
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

const days = Array.from({ length: 31 }, (_, i) =>
  (i + 1).toString().padStart(2, "0")
);

const RegistrationForm: React.FC = () => {
  // State management
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phoneNo: "",
    sex: "",
    address: "",
    birthMonth: "",
    birthDay: "",
    timer: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [downLoading, setDownLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name?: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle downloading Excel template
  const handleDownloadTemplate = async () => {
    setDownLoading(true);
    try {
      const response = await Api.get("/member/import-followup-template", {
        responseType: "blob",
      });

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let filename = "newcomers-template.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create and trigger file download
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
        error.response?.data?.message ||
        "Failed to download Excel template. Please try again.";
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
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/add-follow-up?churchId=${authData?.churchId}${branchIdParam}`, formData);

      toast.success("New Comer created successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });

      setFormData({
        name: "",
        phoneNo: "",
        sex: "",
        address: "",
        birthMonth: "",
        birthDay: "",
        timer: null,
      });

      setTimeout(() => {
        navigate("/view/followup");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating newcomer:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create New Comer. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Excel import dialog
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
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(
        `/member/import-followup?churchId=${authData?.churchId}${branchIdParam}`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Excel file uploaded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });

      setOpenDialog(false);
      setSelectedFile(null);
      setTimeout(() => {
        navigate("/view/followup");
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

  return (
    <DashboardManager>
      <Container sx={{ py: isMobile ? 2 : 4 }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 7 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: "text.primary" }}>
              Register Newcomer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please fill out the form to register a Newcomer.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/view/followup")}
              sx={{
                py: 1,
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
                borderRadius: 1,
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
              }}
            >
              View Newcomers
            </Button>
          </Grid>
        </Grid>

        {/* Form Section */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Download Template Button */}
          <Box sx={{ display: "flex", justifyContent: "center", pb: 3 }}>
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
                fontSize: { xs: "1rem", md: "0.875rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
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

          {/* Form Fields */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <TextField
                  label="Full Name"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoPersonOutline style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <TextField
                  label="Phone Number"
                  id="phoneNo"
                  name="phoneNo"
                  type="tel"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  label="Gender"
                  onChange={handleChange}
                  disabled={isLoading}
                  startAdornment={
                    <InputAdornment position="start">
                      <FaTransgender style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  }
                  sx={{ "& .MuiSelect-icon": { right: 8 } }}
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
              <FormControl fullWidth>
                <TextField
                  label="Address"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoLocationOutline style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} spacing={2}>
              <Box sx={{ display: "flex", gap: 2, flexDirection: { md: "row", xs: "column" } }}>
                <FormControl fullWidth>
                  <InputLabel id="birthMonth-label">Month of Birth</InputLabel>
                  <Select
                    labelId="birthMonth-label"
                    id="birthMonth"
                    name="birthMonth"
                    value={formData.birthMonth}
                    label="Month of Birth"
                    onChange={handleChange}
                    disabled={isLoading}
                    startAdornment={
                      <InputAdornment position="start">
                        <BsCalendarDate style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="" disabled>
                      Select Month
                    </MenuItem>
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="birthDay-label">Day of Birth</InputLabel>
                  <Select
                    labelId="birthDay-label"
                    id="birthDay"
                    name="birthDay"
                    value={formData.birthDay}
                    label="Day of Birth"
                    onChange={handleChange}
                    disabled={isLoading}
                    startAdornment={
                      <InputAdornment position="start">
                        <BsCalendarDate style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="" disabled>
                      Select Day
                    </MenuItem>
                    {days.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="timer-label">Attendance Duration</InputLabel>
                <Select
                  labelId="timer-label"
                  id="timer"
                  name="timer"
                  value={formData.timer || ""}
                  label="Attendance Duration"
                  onChange={handleChange}
                  disabled={isLoading}
                  startAdornment={
                    <InputAdornment position="start">
                      <FiClock style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="" disabled>
                    Select how many times you have been here
                  </MenuItem>
                  {Array.from({ length: 10 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? "Time" : "Times"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Form Actions */}
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
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
                width: { xs: "100%", sm: "auto" },
                order: { xs: 2, sm: 1 },
              }}
            >
              Import Excel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 1,
                backgroundColor: "var(--color-primary)",
                px: { xs: 5, sm: 5 },
                borderRadius: 1,
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                color: "var(--color-text-on-primary)",
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
                width: { xs: "100%", sm: "auto" },
                order: { xs: 1, sm: 2 },
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
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
                  "&:hover": {
                    backgroundColor: "var(--color-primary)",
                    opacity: 0.9,
                  },
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
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
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

export default RegistrationForm;