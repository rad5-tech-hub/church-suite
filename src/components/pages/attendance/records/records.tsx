import React, { useState, useEffect } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

interface AttendanceFormData {
  service: string;
  category: string;
  number: number | "";
}

interface Service {
  id: string;
  name: string;
}

const Attendance: React.FC = () => {
  const [formData, setFormData] = useState<AttendanceFormData>({
    service: "",
    category: "",
    number: "",
  });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [serviceLoading, setServiceLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setServiceLoading(true);
      try {
        const response = await Api.get("/church/get-services");
        setServices(response.data.services || []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchServices();
  }, [isMobile]);

  // Static category options
  const categoryOptions = [
    { value: "Men", label: "Men" },
    { value: "Women", label: "Women" },
    { value: "Children", label: "Children" },
    { value: "Everybody", label: "Everybody" },
  ];

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleAddAttendance = async () => {
    if (!formData.service) {
      toast.error("Service is required.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    if (!formData.category) {
      toast.error("Category is required.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    if (formData.number === "" || formData.number < 0) {
      toast.error("Valid attendance number is required.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await Api.post(
        `/church/record-attendance${authData?.branchId ? `/${authData.branchId}` : ""}`,
        formData
      );

      toast.success(response.data.message || "Attendance recorded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setFormData({ service: "", category: "", number: "" }); // Reset form
      navigate("/manage/view-attendance");
    } catch (error: any) {
      console.error("Attendance recording error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to record attendance. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
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
              Record Attendance
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.8125rem" : undefined,
              }}
            >
              Record attendance for {authData?.church_name}.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: "grow" }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/manage/view-attendance")}
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
              View Attendance
            </Button>
          </Grid>
        </Grid>

        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Service Field */}
          <FormControl fullWidth size="medium" disabled={loading}>
            <InputLabel id="service-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
              Service *
            </InputLabel>
            <Select
              labelId="service-label"
              id="service"
              name="service"
              value={formData.service}
              onChange={handleSelectChange}
              label="Service *"
              sx={{
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                {serviceLoading ? <em>Loading..</em> : <em>Select a service</em>}
              </MenuItem>
              {services.map((service) => (
                <MenuItem
                  key={service.id}
                  value={service.id}
                  sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                >
                  {service.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Category Field */}
          <FormControl fullWidth size="medium">
            <InputLabel id="category-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
              Category *
            </InputLabel>
            <Select
              labelId="category-label"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleSelectChange}
              label="Category *"
              disabled={loading}
              sx={{
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                <em>Select a category</em>
              </MenuItem>
              {categoryOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Number Field */}
          <TextField
            fullWidth
            label="Attendance Number *"
            id="number"
            name="number"
            type="number"
            value={formData.number}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter attendance number"
            disabled={loading}
            size="medium"
            InputLabelProps={{
              sx: {
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
            InputProps={{
              sx: {
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
          />

          {/* Submit Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleAddAttendance}
              disabled={loading}
              sx={{
                py: 1,
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
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
              {loading ? (
                <>
                  <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                  Recording...
                </>
              ) : (
                "Record Attendance"
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default Attendance;