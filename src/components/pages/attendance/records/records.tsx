import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

interface AttendanceFormData {
  eventId: string;
  date: string;
  total: number | "";
  male: number | "";
  female: number | "";
  children: number | "";
  adults: number | "";
  categories: string[];
}

interface Service {
  id: string;
  name: string;
}

const Attendance: React.FC = () => {
  const [formData, setFormData] = useState<AttendanceFormData>({
    eventId: "",
    date: "",
    total: "",
    male: "",
    female: "",
    children: "",
    adults: "",
    categories: [],
  });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [serviceLoading, setServiceLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Category options
  const categoryOptions = [
    { value: "total", label: "Total" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "children", label: "Children" },
    { value: "adults", label: "Adults" },
  ];

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setServiceLoading(true);
      try {
        const response = await Api.get("/church/get-services");
        setServices(response.data.services || []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        toast.error("Failed to fetch services. Please try again.", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
      } finally {
        setServiceLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "date" ? value : value === "" ? "" : Number(value),
    }));
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleAddAttendance = async () => {
    if (!formData.eventId) {
      toast.error("Service is required.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    if (!formData.categories.length) {
      toast.error("At least one category is required.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    for (const category of formData.categories) {
      const selectedValue = formData[category as keyof AttendanceFormData];
      if (selectedValue === "" || Number(selectedValue) < 0) {
        toast.error(`Valid ${category} attendance number is required.`, {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        eventId: formData.eventId,
        date: formData.date || undefined,
        total: formData.total === "" ? undefined : Number(formData.total),
        male: formData.male === "" ? undefined : Number(formData.male),
        female: formData.female === "" ? undefined : Number(formData.female),
        children: formData.children === "" ? undefined : Number(formData.children),
        adults: formData.adults === "" ? undefined : Number(formData.adults),
      };

      const response = await Api.post(
        `/church/record-attendance${authData?.branchId ? `/${authData.branchId}` : ""}`,
        payload
      );

      toast.success(response.data.message || "Attendance recorded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setFormData({
        eventId: "",
        date: "",
        total: "",
        male: "",
        female: "",
        children: "",
        adults: "",
        categories: [],
      });
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
              Record attendance for {authData?.church_name || "your church"}.
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
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="medium" disabled={loading || serviceLoading}>
                <InputLabel id="service-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                  Service *
                </InputLabel>
                <Select
                  labelId="service-label"
                  id="eventId"
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleSelectChange}
                  label="Service *"
                  sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                    {serviceLoading ? <em>Loading...</em> : <em>Select a service</em>}
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Date (Optional)"
                id="date"
                name="date"
                type="datetime-local"
                value={formData.date}
                onChange={handleChange}
                variant="outlined"
                disabled={loading}
                size="medium"
                InputLabelProps={{
                  shrink: true,
                  sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="medium" disabled={loading}>
                <InputLabel id="category-label" sx={{ fontSize: isLargeScreen ? "1rem" : undefined }}>
                  Categories *
                </InputLabel>
                <Select
                  labelId="category-label"
                  id="categories"
                  name="categories"
                  multiple
                  value={formData.categories}
                  onChange={handleSelectChange}
                  label="Categories *"
                  renderValue={(selected) =>
                    selected
                      .map(
                        (value) =>
                          categoryOptions.find((option) => option.value === value)?.label || value
                      )
                      .join(", ")
                  }
                  sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
                >
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
            </Grid>
            {formData.categories.map((category) => (
              <Grid size={{ xs: 12, md: 6 }} key={category}>
                <TextField
                  fullWidth
                  label={`${category.charAt(0).toUpperCase() + category.slice(1)} Attendance *`}
                  id={category}
                  name={category}
                  type="number"
                  value={formData[category as keyof AttendanceFormData] || ""}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder={`Enter ${category} attendance number`}
                  disabled={loading}
                  size="medium"
                  inputProps={{ min: 0 }}
                  InputLabelProps={{
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                  InputProps={{
                    sx: { fontSize: isLargeScreen ? "1rem" : undefined },
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleAddAttendance}
              disabled={loading || serviceLoading}
              sx={{
                py: 1,
                px: { xs: 2, sm: 3 },
                borderRadius: 1,
                fontWeight: "semibold",
                backgroundColor: "var(--color-primary)",
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