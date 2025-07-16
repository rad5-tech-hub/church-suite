import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
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
  Checkbox,
  ListItemText,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

interface AttendanceFormData {
  eventId: string;
  date: string;
  total: number | null;
  male: number | null;
  female: number | null;
  children: number | null;
  categories: string[];
}

interface Event {
  id: string;
  name: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface AuthData {
  church_name?: string;
  isSuperAdmin?: boolean;
}

const Attendance: React.FC = () => {
  const [formData, setFormData] = useState<AttendanceFormData>({
    eventId: "",
    date: "",
    total: null,
    male: null,
    female: null,
    children: null,
    categories: [],
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [eventLoading, setEventLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authData = useSelector((state: RootState & { auth?: { authData?: AuthData } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Category options
  const categoryOptions: CategoryOption[] = [
    { value: "total", label: "Everyone" },
    { value: "male", label: "Men" },
    { value: "female", label: "Women" },
    { value: "children", label: "Children" },
  ];

  // Calculate total attendance (sum of male, female, children)
  const calculatedTotal = useMemo(() => {
    const categoriesToSum = ["male", "female", "children"];
    return categoriesToSum.reduce((sum, category) => {
      if (formData.categories.includes(category)) {
        const value = formData[category as keyof AttendanceFormData];
        return sum + (typeof value === "number" && value >= 0 ? value : 0);
      }
      return sum;
    }, 0);
  }, [formData]);

  // Fetch events and pre-select eventId from URL
  useEffect(() => {
    const fetchEvents = async () => {
      setEventLoading(true);
      try {
        const response = await Api.get("/church/get-events");
        const fetchedEvents = (response.data.events || []).map((event: any) => ({
          id: event.id,
          name: event.title,
        }));
        setEvents(fetchedEvents);

        // Pre-select eventId from URL query parameter
        const params = new URLSearchParams(location.search);
        const eventId = params.get("eventId");
        if (eventId && fetchedEvents.some((event: Event) => event.id === eventId)) {
          setFormData((prev) => ({ ...prev, eventId }));
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
        toast.error("Failed to load programs.", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
      } finally {
        setEventLoading(false);
      }
    };
    fetchEvents();
  }, [location.search, isMobile]);

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "date" ? value : value === "" ? null : Number(value),
    }));
  };

  // Handle select changes for eventId
  const handleEventSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value as string,
    }));
  };

  // Handle category selection with checkboxes
  const handleCategoryChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value as string[];
    setFormData((prev) => {
      let newCategories = value;
      let updatedFormData = { ...prev, categories: newCategories };

      // If "total" is selected, deselect and reset male, female, children
      if (value.includes("total")) {
        newCategories = ["total"];
        updatedFormData = {
          ...prev,
          categories: newCategories,
          male: null,
          female: null,
          children: null,
        };
      }
      // If any of male, female, children are selected, deselect and reset total
      else if (value.some((cat) => ["male", "female", "children"].includes(cat))) {
        newCategories = value.filter((cat) => cat !== "total");
        updatedFormData = {
          ...prev,
          categories: newCategories,
          total: null,
        };
      }

      // Reset values for deselected categories
      const removedCategories = prev.categories.filter((cat) => !newCategories.includes(cat));
      removedCategories.forEach((cat) => {
        if (["total", "male", "female", "children"].includes(cat)) {
          updatedFormData[cat as keyof Pick<AttendanceFormData, "total" | "male" | "female" | "children">] = null;
        }
      });

      return updatedFormData;
    });
  };

  // Handle form submission
  const handleAddAttendance = async () => {
    if (!formData.eventId) {
      toast.error("Program is required.", {
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

    if (formData.date && isNaN(new Date(formData.date).getTime())) {
      toast.error("Invalid date format.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    for (const category of formData.categories) {
      const selectedValue = formData[category as keyof AttendanceFormData];
      if (selectedValue === null || Number(selectedValue) < 0) {
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
        total: formData.total === null ? undefined : Number(formData.total),
        male: formData.male === null ? undefined : Number(formData.male),
        female: formData.female === null ? undefined : Number(formData.female),
        children: formData.children === null ? undefined : Number(formData.children),
      };

      const response = await Api.post("/church/create-attendance", payload);

      toast.success(response.data.message || "Attendance recorded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setFormData({
        eventId: "",
        date: "",
        total: null,
        male: null,
        female: null,
        children: null,
        categories: [],
      });
      navigate("/attendance/viewRecords");
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
      <Container sx={{ py: isMobile ? 2 : 4, px: { xs: 2, sm: 3 } }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 8 }}>
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
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              Record attendance for {authData?.church_name || "your church"}.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
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
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
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

        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel id="event-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                  Programs *
                </InputLabel>
                <Select
                  labelId="event-label"
                  id="eventId"
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleEventSelectChange}
                  label="Programs *"
                  sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
                >
                  {eventLoading ? (
                    <MenuItem disabled sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading programs...
                    </MenuItem>
                  ) : events.length === 0 ? (
                    <MenuItem disabled sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      No programs available
                    </MenuItem>
                  ) : (
                    [
                      <MenuItem key="placeholder" value="" disabled sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                        <em>Select a Program</em>
                      </MenuItem>,
                      ...events.map((event) => (
                        <MenuItem
                          key={event.id}
                          value={event.id}
                          sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
                        >
                          {event.name}
                        </MenuItem>
                      )),
                    ]
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Date (Optional)"
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                variant="outlined"
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel id="category-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                  Select Category *
                </InputLabel>
                <Select
                  labelId="category-label"
                  id="categories"
                  name="categories"
                  multiple
                  value={formData.categories}
                  onChange={handleCategoryChange}
                  label="Select Category *"
                  renderValue={(selected) =>
                    selected.length === 0
                      ? "Select categories"
                      : selected
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
                      disabled={
                        (option.value === "total" &&
                          formData.categories.some((cat) =>
                            ["male", "female", "children"].includes(cat)
                          )) ||
                        (["male", "female", "children"].includes(option.value) &&
                          formData.categories.includes("total"))
                      }
                      sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
                    >
                      <Checkbox
                        checked={formData.categories.includes(option.value)}
                        sx={{
                          color: "var(--color-primary)",
                          "&.Mui-checked": {
                            color: "var(--color-primary)",
                          },
                        }}
                      />
                      <ListItemText primary={option.label} />
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
                  value={formData[category as keyof AttendanceFormData] ?? ""}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder={`Enter ${category} attendance number`}
                  disabled={loading}
                  inputProps={{ min: 0 }}
                  InputLabelProps={{
                    sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                  }}
                  InputProps={{
                    sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                  }}
                />
              </Grid>
            ))}
            {!formData.categories.includes("total") && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Calculated Attendance"
                  value={calculatedTotal}
                  variant="outlined"
                  disabled
                  InputLabelProps={{
                    sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                  }}
                  InputProps={{
                    sx: {
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                      backgroundColor: theme.palette.grey[100],
                    },
                  }}
                />
              </Grid>
            )}
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleAddAttendance}
              disabled={loading || eventLoading}
              sx={{
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 3 },
                py: 1,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "0.875rem" : undefined,
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