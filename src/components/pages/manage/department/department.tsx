import React, { useState } from "react";
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
  useMediaQuery
} from "@mui/material";

interface DepartmentFormData {
  name: string;
  type: 'Department' | 'Outreach';
  description: string;
}

const Department: React.FC = () => {
  const [formData, setFormData] = useState<DepartmentFormData>({ 
    name: "",
    type: 'Department',
    description: ""
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required.", { 
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required.", { 
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right"
      });
      return;
    }
  
    try {
      setLoading(true);
      const response = await Api.post(
        `/church/create-dept${authData?.branchId ? `/${authData.branchId}` : ''}`, 
        formData
      );
      
      if (response.data?.Department) {
        toast.success(response.data.message || `Department "${response.data.Department.name}" created successfully!`, {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right"
        });
        navigate("/manage/view-Departments");
      }
    } catch (error: any) {
      console.error("Department creation error:", error);
      const errorMessage = error.response?.data?.message || "Failed to create Department. Please try again.";
      toast.error(errorMessage, {       
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardManager>
      <Container sx={{ py: isMobile ? 2 : 3}}>
        {/* Header Section */}        
        <Grid container spacing={2} sx={{mb: 5}}>
          <Grid size={{ xs:12, md:9 }} >
            <Typography 
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
              component="h1" 
              fontWeight={600}
              gutterBottom
              sx={{ 
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? '1.5rem' : undefined
              }}
            >
              Manage Department
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? '0.8125rem' : undefined
              }}
            >
              Create and manage Departments for {authData?.church_name}.
            </Typography>
          </Grid>
          <Grid size={{ xs:12, md:'grow' }}  sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            alignItems: 'center'
          }}>
            <Button
              variant="contained"
              onClick={() => navigate("/manage/view-Departments")}
              size="medium"             
              sx={{
                backgroundColor: "var(--color-primary)", 
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
              View Departments
            </Button>
          </Grid>
        </Grid>      
     
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Name Field */}
          <TextField
            fullWidth
            label="Department Name *"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter Department name"
            disabled={loading}
            size={"medium"}
            InputLabelProps={{
              sx: {
                fontSize: isLargeScreen ? '1rem' : undefined,              
              }
            }}
            InputProps={{
              sx: {
                fontSize: isLargeScreen ? '1rem' : undefined
              }
            }}
          />

          {/* Type Field */}
          <FormControl fullWidth size={"medium"}>
            <InputLabel id="type-label" sx={{ fontSize: isLargeScreen ? '1rem' : undefined }}>
              Type *
            </InputLabel>
            <Select
              labelId="type-label"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleSelectChange}
              label="Type *"
              disabled={loading}
              sx={{
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }}
            >
              <MenuItem value="Department" sx={{ fontSize: isLargeScreen ? '1rem' : undefined }}>
                Department
              </MenuItem>
              <MenuItem value="Outreach" sx={{ fontSize: isLargeScreen ? '1rem' : undefined }}>
                Outreach
              </MenuItem>
            </Select>
          </FormControl>

          {/* Description Field */}
          <TextField
            fullWidth
            label="Description *"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter Department description"
            multiline
            rows={4}
            disabled={loading}
            size={"medium"}
            InputLabelProps={{
              sx: {
                fontSize: isLargeScreen ? '1rem' : undefined
              }
            }}
            InputProps={{
              sx: {
                fontSize: isLargeScreen ? '1rem' : undefined
              }
            }}
          />

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleAddDepartment}
              disabled={loading}    
              sx={{                
                py: 1,                  
                backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable bgcolor: "#1f2937",
                px: { xs: 2, sm: 2 },                  
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
              {loading ? (
                <>
                  <CircularProgress size={18} sx={{ color: 'white', mr: 1 }} />
                  Creating...
                </>
              ) : (
                "Create Department"
              )}
            </Button>
          </Box>
        </Box>      
      </Container>
    </DashboardManager>
  );
};

export default Department;