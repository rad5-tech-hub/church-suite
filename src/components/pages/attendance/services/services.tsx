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
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from "@mui/material";

interface ServiceFormData {
  name: string;
  date: string;
  description: string;
  recurrenceType: string;
}

const Service: React.FC = () => {
  const [formData, setFormData] = useState<ServiceFormData>({ 
    name: "",
    date: "",
    description: "",
    recurrenceType: "none"
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as keyof ServiceFormData]: value
    }));
  };

  const handleAddService = async () => {
    if (!formData.name.trim()) {
      toast.error("Service name is required.", { 
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
        `church/create-event`, 
        formData
      );
      
      toast.success(response.data.message || `Service "${response.data.Service.name}" created successfully!`, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right"
      });
      setFormData({ name: "", date: "", description: "", recurrenceType: "none" }); // Reset

      navigate("/manage/view-Services");
      
    } catch (error: any) {
      console.error("Service creation error:", error);
      const errorMessage = error.response?.data?.message || "Failed to create Service. Please try again.";
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
              Create Service
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? '0.8125rem' : undefined
              }}
            >
              Create and manage Services for {authData?.church_name}.
            </Typography>
          </Grid>
          <Grid size={{ xs:12, md:'grow' }}  sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            alignItems: 'center'
          }}>
            <Button
              variant="contained"
              onClick={() => navigate("/manage/view-Services")}
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
              View Services
            </Button>
          </Grid>
        </Grid>      
     
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Grid container spacing={4}>
            <Grid size={{xs:12, md:6}}>
              {/* Name Field */}
              <TextField
                fullWidth
                label="Service Name *"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter Service name"
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
            </Grid>
            <Grid size={{xs:12, md:6}}>
              {/* Date Field */}
              <TextField
                fullWidth
                label="Service Date (Optional)"
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                variant="outlined"
                placeholder="Select a date"
                disabled={loading}
                size={"medium"}
                InputLabelProps={{
                  shrink: true,
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
            </Grid>
            <Grid size={{xs:12}}>
              {/* Recurrence Type Field */}
              <FormControl fullWidth variant="outlined" disabled={loading}>
                <InputLabel id="recurrenceType-label" sx={{
                  fontSize: isLargeScreen ? '1rem' : undefined
                }}>
                  Regularity Type
                </InputLabel>
                <Select
                  labelId="recurrenceType-label"
                  id="recurrenceType"
                  name="recurrenceType"
                  value={formData.recurrenceType}
                  onChange={handleChange}
                  label="Recurrence Type"
                  sx={{
                    fontSize: isLargeScreen ? '1rem' : undefined
                  }}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="annually">Annually</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Description Field */}
          <TextField
            fullWidth
            label="Description *"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter Service description"
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
              onClick={handleAddService}
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
                  <CircularProgress size={18} sx={{ color: 'white', mr: 1 }} />
                  Creating...
                </>
              ) : (
                "Create Service"
              )}
            </Button>
          </Box>
        </Box>      
      </Container>
    </DashboardManager>
  );
};

export default Service;