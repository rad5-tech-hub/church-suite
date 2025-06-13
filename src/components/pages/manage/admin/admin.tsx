import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMailOutline, IoCallOutline, IoEyeOutline } from "react-icons/io5";
import { PiEyeClosed } from "react-icons/pi";
import { BsPerson } from "react-icons/bs";
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
} from "@mui/material";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  isSuperAdmin: boolean;
  branchId?: string;
}

interface Branch {
  id: string;
  name: string;
  location: string;
  address: string;
}

const Admin: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    isSuperAdmin: false,
    branchId: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      setIsFetchingBranches(true);
      setBranchesError("");
      try {
        const response = await Api.get("/church/get-branches");
        setBranches(response.data.branches || []);
      } catch (error: any) {
        console.error("Error fetching branches:", error);
        setBranchesError("Failed to load branches. Please try again.");
        toast.error("Failed to load branches", {
          position: isMobile ? "top-center" : "top-right",
        });
      } finally {
        setIsFetchingBranches(false);
      }
    };
    fetchBranches();
  }, [isMobile]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Api.post("church/create-admin", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        isSuperAdmin: formData.isSuperAdmin || undefined,
        branchId: formData.branchId || undefined,
      });
      
      toast.success("Admin created successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
      setTimeout(() => {
        navigate("/manage/view-admins");      
      }, 1500);
    } catch (error: any) {
      console.error("Error creating admin:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to create admin", {
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
            size={{xs:12, md:3}}
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
                backgroundColor: "var(--color-primary)", // 
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: "semibold",
                color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                  opacity: 0.9, // Add hover effect
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
            <Grid size={{xs:12, md:6}}>
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

            {/* Email Field */}
            <Grid size={{xs:12, md:6}}>
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
            <Grid size={{xs:12, md:6}}>
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
            
            {/* Branch Selection */}
            <Grid size={{xs:12, md:6}}>
              <FormControl fullWidth>
                <InputLabel id="branch-label">Assign to Branch</InputLabel>
                <Select
                  labelId="branch-label"
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleSelectChange}
                  label="Assign to Branch"
                  disabled={loading || isFetchingBranches}
                  sx={{
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  }}
                >
                  <MenuItem value="">
                    <em>Select a branch (optional)</em>
                  </MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.address}
                    </MenuItem>
                  ))}
                </Select>
                {isFetchingBranches && (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Loading branches...</Typography>
                  </Box>
                )}
                {branchesError && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {branchesError}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Password Field */}
            <Grid size={{xs:12, md:6}}>
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
                        {!showPassword ? <PiEyeClosed size={20}/> : <IoEyeOutline size={20}/>}
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
            <Grid size={{xs:12, md:6}}>
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
                        {!showConfirmPassword ? <PiEyeClosed size={20}/> : <IoEyeOutline size={20}/>}
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
            <Grid size={12}>
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
                backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                px: { xs: 2, sm: 2 },
                borderRadius: 1,
                color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                  opacity: 0.9, // Add hover effect
                },
              }}
            >
              {loading ? (
                'Creating...'
              ) : (
                "Create Admin"
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default Admin;