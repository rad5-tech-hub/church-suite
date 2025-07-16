import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

interface ServiceFormData {
  title: string;
  date: string;
  description: string;
  recurrenceType: string;
}

interface AuthData {
  church_name?: string;
  isSuperAdmin?: boolean;
}

const Service: React.FC = () => {
  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    date: "",
    description: "",
    recurrenceType: "none",
  });
  const [isRegularService, setIsRegularService] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState & { auth?: { authData?: AuthData } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as keyof ServiceFormData]: value,
    }));
    // Uncheck isRegularService if recurrenceType is set to "none"
    if (name === "recurrenceType" && value === "none") {
      setIsRegularService(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsRegularService(e.target.checked);
    if (!e.target.checked) {
      setFormData((prev) => ({
        ...prev,
        recurrenceType: "none",
      }));
    }
  };

  const handleAddService = async () => {
    if (!formData.title.trim()) {
      toast.error("Program title is required.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required.", {
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

    if (isRegularService && formData.recurrenceType === "none") {
      toast.error("Recurrence type must be set for regular program.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        recurrenceType: isRegularService ? formData.recurrenceType : "none",
      };
      const response = await Api.post("/church/create-event", payload);

      toast.success(response.data.message || `Program "${response.data.event?.title || formData.title}" created successfully!`, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setFormData({ title: "", date: "", description: "", recurrenceType: "none" });
      setIsRegularService(false);
      navigate("/attendance/viewServices");
    } catch (error: any) {
      console.error("Program creation error:", error);
      const errorMessage = error.response?.data?.message || "Failed to create program. Please try again.";
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
              Create Program
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              Create and manage programs for {authData?.church_name || "your church"}.
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
              onClick={() => navigate("/attendance/viewServices")}
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
              View Programs
            </Button>
          </Grid>
        </Grid>

        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              {/* Title Field */}
              <TextField
                fullWidth
                label="Program Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter program title"
                disabled={loading}
                InputLabelProps={{                
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {/* Date Field */}
              <TextField
                fullWidth
                label="Program Date (Optional)"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                variant="outlined"
                disabled={loading}
                required
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
              {/* Checkbox for Regular Service */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRegularService}
                    onChange={handleCheckboxChange}
                    disabled={loading}
                    sx={{
                      color: "var(--color-primary)",
                      "&.Mui-checked": {
                        color: "var(--color-primary)",
                      },
                    }}
                  />
                }
                label="Is this a regular program?"
                sx={{
                  fontSize: isLargeScreen ? "0.875rem" : undefined,
                  color: theme.palette.text.primary,
                }}
              />
            </Grid>
            {isRegularService && (
              <Grid size={{ xs: 12 }}>
                {/* Recurrence Type Field */}
                <FormControl fullWidth variant="outlined" disabled={loading}>
                  <InputLabel
                    id="recurrenceType-label"
                    sx={{
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    }}
                  >
                    Recurrence Type *
                  </InputLabel>
                  <Select
                    labelId="recurrenceType-label"
                    name="recurrenceType"
                    value={formData.recurrenceType}
                    onChange={handleChange}
                    label="Recurrence Type *"
                    sx={{
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    }}
                  >                  
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="annually">Annually</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              {/* Description Field */}
              <TextField
                fullWidth
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter program description"
                multiline
                rows={4}
                disabled={loading}
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
              />
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleAddService}
              disabled={loading}
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
                  Creating...
                </>
              ) : (
                "Create Program"
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default Service;