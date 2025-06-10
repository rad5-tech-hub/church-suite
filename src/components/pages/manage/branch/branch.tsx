import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMailOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
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
} from "@mui/material";

interface FormData {
  name: string;
  location: string;
  email: string;
  phone: string;
}

const Branch: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    location: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await Api.post("/church/create-branch", {
        name: formData.name,
        address: formData.location || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      toast.success("Branch created successfully!", {
        autoClose: 3000,
      });
      setTimeout(() => {
        navigate("/manage/view-branches");      
      }, 1500);
    } catch (error: any) {
      console.error("Error creating branch:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to create branch. Please try again.", {
        autoClose: 3000,
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
          <Grid size={{xs:12, md:9}}>
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
              Manage Branches
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.8125rem" : undefined,
              }}
            >
              Create and manage branches for your church.
            </Typography>
          </Grid>
          <Grid
           size={{xs:12, md:3}}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/manage/view-branches")}
              size="medium"
              sx={{
                bgcolor: "#1f2937",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": { bgcolor: "#111827" },
              }}
            >
              View Branches
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
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Branch Name *"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter branch name"
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BsPerson style={{ color: theme.palette.text.secondary }} />
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

            {/* Location Field */}
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Branch Location"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter branch location"
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoLocationOutline style={{ color: theme.palette.text.secondary }} />
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
              />
            </Grid>

            {/* Email Field */}
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Branch Email"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter branch email"
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
              />
            </Grid>

            {/* Phone Field */}
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Branch Phone No"
                id="phone"
                name="phone"
                type="number"
                value={formData.phone}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter branch phone number"
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
                bgcolor: "#1f2937",
                px: { xs: 2, sm: 2 },
                borderRadius: 1,
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": { bgcolor: "#111827" },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                  Creating...
                </>
              ) : (
                "Create Branch"
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default Branch;
