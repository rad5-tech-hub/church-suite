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
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { Close } from "@mui/icons-material";

interface UnitFormData {
  name: string;
  description: string;
}

interface Department {
  id: string;
  name: string;
}

const Unit: React.FC = () => {
  const [units, setUnits] = useState<UnitFormData[]>([{ name: "", description: "" }]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setFetchingDepartments(true);
        const response = await Api.get(`/church/get-departments`);
        setDepartments(response.data?.departments || []);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Failed to load departments. Please try again.", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right"
        });
      } finally {
        setFetchingDepartments(false);
      }
    };

    fetchDepartments();
  }, [authData?.branchId, isMobile]);

  const handleUnitChange = (index: number, field: keyof UnitFormData, value: string) => {
    const updatedUnits = [...units];
    updatedUnits[index] = {
      ...updatedUnits[index],
      [field]: value
    };
    setUnits(updatedUnits);
  };

  const addUnitField = () => {
    setUnits([...units, { name: "", description: "" }]);
  };

  const removeUnitField = (index: number) => {
    if (units.length > 1) {
      const updatedUnits = [...units];
      updatedUnits.splice(index, 1);
      setUnits(updatedUnits);
    }
  };

  const handleAddUnits = async () => {
    if (!selectedDepartment) {
      toast.error("Please select a department", { 
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right"
      });
      return;
    }

    // Validate all units
    for (const unit of units) {
      if (!unit.name.trim()) {
        toast.error("Unit name is required for all units", { 
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right"
        });
        return;
      }

      if (!unit.description.trim()) {
        toast.error("Description is required for all units", { 
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right"
        });
        return;
      }
    }

    try {
      setLoading(true);
      const response = await Api.post(
        `/church/create-units`, 
        {departmentId: selectedDepartment, units }
      );
      
      if (response.data?.units) {
        toast.success(`${response.data.units.length} units created successfully!`, {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right"
        });
        navigate("/manage/view-Departments");
      }
    } catch (error: any) {
      console.error("Unit creation error:", error);
      const errorMessage = error.response?.data?.message || "Failed to create units. Please try again.";
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
          <Grid size={{xs:12,  md:9}} >
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
              Manage Units
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? '0.8125rem' : undefined
              }}
            >
              Create and manage units for {authData?.church_name}.
            </Typography>
          </Grid>
          <Grid size={{xs:12,  md:3}} sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            alignItems: 'center'
          }}>
            <Button
              variant="contained"
              onClick={() => navigate("/manage/viewUnits")}
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
              View Units
            </Button>
          </Grid>
        </Grid>      
     
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Department Selection */}
          <FormControl fullWidth>
            <InputLabel id="department-select-label" sx={{ fontSize: isLargeScreen ? '1rem' : undefined }}>
              Department *
            </InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              label="Department *"
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={loading}
              sx={{
                fontSize: isLargeScreen ? '1rem' : undefined,
                '& .MuiSelect-icon': {
                  display: loading ? 'none' : 'block'
                }
              }}
              IconComponent={loading ? () => null : undefined}
            >
              {loading || !departments.length ? (
                <MenuItem disabled>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <CircularProgress size={20} style={{ marginRight: '8px' }} />
                    Loading departments...
                  </div>
                </MenuItem>
              ) : departments.length === 0 ? (
                <MenuItem disabled>No departments available</MenuItem>
              ) : (
                departments.map((dept) => (
                  <MenuItem 
                    key={dept.id} 
                    value={dept.id} 
                    sx={{ fontSize: isLargeScreen ? '1rem' : undefined }}
                  >
                    {dept.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Units Fields */}
          <Typography variant="h6" component="h2" sx={{ 
             fontSize: isLargeScreen ? '1.2rem' : undefined}}>
            Units
          </Typography>
          
          {units.map((unit, index) => {
                const isUnitEmpty = !unit.name.trim() || !unit.description.trim();
                
                return (
                    <Paper 
                    key={index} 
                    elevation={1} 
                    sx={{ 
                        p: 2,
                        backgroundColor: isUnitEmpty ? 'rgba(255, 0, 0, 0.05)' : 'inherit',
                        border: isUnitEmpty ? '1px solid rgba(255, 0, 0, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
                        transition: 'all 0.3s ease'
                    }}
                    >
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{xs:12, sm: 5}}>
                        <TextField
                            fullWidth
                            label="Unit Name *"
                            name={`name-${index}`}
                            value={unit.name}
                            onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                            variant="outlined"
                            placeholder="Enter unit name"
                            disabled={loading}
                            size="medium"
                            error={!unit.name.trim()}
                            helperText={!unit.name.trim() ? "Required field" : ""}
                            InputLabelProps={{
                            sx: { fontSize: isLargeScreen ? '1rem' : undefined }
                            }}
                            InputProps={{
                            sx: { 
                                fontSize: isLargeScreen ? '1rem' : undefined,
                            }
                            }}
                        />
                        </Grid>
                        <Grid size={{xs:12, sm: 5}}>
                        <TextField
                            fullWidth
                            label="Description *"
                            name={`description-${index}`}
                            value={unit.description}
                            onChange={(e) => handleUnitChange(index, 'description', e.target.value)}
                            variant="outlined"
                            placeholder="Enter unit description"
                            disabled={loading}
                            size="medium"
                            error={!unit.description.trim()}
                            helperText={!unit.description.trim() ? "Required field" : ""}
                            InputLabelProps={{
                            sx: { fontSize: isLargeScreen ? '1rem' : undefined }
                            }}
                            InputProps={{
                            sx: { 
                                fontSize: isLargeScreen ? '1rem' : undefined,
                            }
                            }}
                        />
                        </Grid>
                        <Grid size={{xs:12, sm: 2}} sx={{ textAlign: 'right' }}>
                        {index === units.length - 1 ? (
                            <IconButton 
                            onClick={addUnitField} 
                            sx={{
                                color: "var(--color-primary)",
                                '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }} 
                            disabled={loading}
                            >
                            <AddIcon />
                            </IconButton>
                        ) : null}
                        {units.length > 1 && (
                            <IconButton 
                            onClick={() => removeUnitField(index)} 
                            sx={{ 
                                color: theme.palette.error.main,
                                ml: 1,
                                '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }} 
                            disabled={loading}
                            >
                            <Close />
                            </IconButton>
                        )}
                        </Grid>
                    </Grid>
                    </Paper>
                );
            })}

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleAddUnits}
              disabled={loading || fetchingDepartments}    
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
                `Create ${units.length > 1 ? `${units.length} Units` : 'Unit'}`
              )}
            </Button>
          </Box>
        </Box>      
      </Container>
    </DashboardManager>
  );
};

export default Unit;