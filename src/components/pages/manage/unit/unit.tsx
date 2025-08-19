import React, { useState, useEffect } from "react";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
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

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UnitModal: React.FC<UnitModalProps> = ({ open, onClose, onSuccess }) => {
  const [units, setUnits] = useState<UnitFormData[]>([{ name: "", description: "" }]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
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
          position: isMobile ? "top-center" : "top-right",
        });
      } finally {
        setFetchingDepartments(false);
      }
    };

    if (open) {
      fetchDepartments();
      setUnits([{ name: "", description: "" }]);
      setSelectedDepartment("");
      setShowValidationErrors(false);
    }
  }, [authData?.branchId, isMobile, open]);

  const handleUnitChange = (index: number, field: keyof UnitFormData, value: string) => {
    const updatedUnits = [...units];
    updatedUnits[index] = {
      ...updatedUnits[index],
      [field]: value,
    };
    setUnits(updatedUnits);
  };

  const addUnitField = () => {
    setShowValidationErrors(true);
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
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }

    setShowValidationErrors(true);

    for (const unit of units) {
      if (!unit.name.trim()) {
        toast.error("Unit name is required for all units", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }

      if (!unit.description.trim()) {
        toast.error("Description is required for all units", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const response = await Api.post(`/church/create-units`, {
        departmentId: selectedDepartment,
        units,
      });

      if (response.data?.units) {
        toast.success(`${response.data.units.length} units created successfully!`, {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error("Unit creation error:", error);
      const errorMessage = error.response?.data?.message || "Failed to create units. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
       sx={{
        "& .MuiDialog-paper": {
          borderRadius:  2,
          bgcolor: '#2C2C2C',
          color: "#F6F4FE",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">      
          <Typography
            variant={isMobile ? "h5" : "h5"}
            component="h1"
            fontWeight={600}
            sx={{           
              fontSize: isLargeScreen ? '1.5rem' : undefined,
            }}
          >
            Create New Units
          </Typography>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300"/>
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 1 }}>
          {/* Department Selection */}
          <FormControl fullWidth>
            <InputLabel id="department-select-label" sx={{ fontSize: isLargeScreen ? '1rem' : undefined, color: '#F6F4FE'  }}>
              Select Department *
            </InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              label="Select Department *"
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={loading}
              sx={{
                fontSize: isLargeScreen ? '1rem' : undefined,
                '& .MuiSelect-icon': {
                  display: loading ? 'none' : 'block',
                },                            
                color: "#F6F4FE",
                outlineColor: "#777280",
                borderColor: "#777280",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#777280",
                },
                "& .MuiSelect-select": {
                    borderColor: "#777280",
                    color: "#F6F4FE",
                },              
              }}
              IconComponent={loading ? () => null : undefined}
            >
              {fetchingDepartments ? (
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
          <Typography variant="h6" component="h2" sx={{ fontSize: isLargeScreen ? '1.2rem' : undefined }}>
            Units
          </Typography>

          {units.map((unit, index) => {
            const isUnitEmpty = showValidationErrors && (!unit.name.trim() || !unit.description.trim());
            const isDisabled = loading || !selectedDepartment;

            return (
              <Tooltip
                title={isDisabled ? "Select department first" : ""}
                disableInteractive
                placement="top"
              >
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: isUnitEmpty ? 'rgba(255, 0, 0, 0.05)' : 'inherit',
                    border: isUnitEmpty ? '1px solid rgba(255, 0, 0, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.3s ease',
                    pointerEvents: isDisabled ? 'none' : 'auto', // Prevent interaction when disabled
                    opacity: isDisabled ? 0.6 : 1, // Visual cue for disabled state
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Unit Name *"
                        name={`name-${index}`}
                        value={unit.name}
                        onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                        variant="outlined"
                        placeholder="Enter unit name"
                        disabled={isDisabled}
                        size="medium"
                        error={showValidationErrors && !unit.name.trim()}
                        helperText={showValidationErrors && !unit.name.trim() ? "Required field" : ""}
                        InputProps={{                  
                          sx: {
                            color: "#F6F4FE",
                            outlineColor: "#777280",
                            borderColor: "#777280",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#777280",
                            },
                            fontSize: isLargeScreen ? "1rem" : undefined,
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: isLargeScreen ? "1rem" : undefined,
                            color: "#F6F4FE",                    
                            outlineColor: "#777280",
                            borderColor: "#777280",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#777280",
                            },                    
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Description *"
                        name={`description-${index}`}
                        value={unit.description}
                        onChange={(e) => handleUnitChange(index, 'description', e.target.value)}
                        variant="outlined"
                        placeholder="Enter unit description"
                        disabled={isDisabled}
                        size="medium"
                        error={showValidationErrors && !unit.description.trim()}
                        helperText={showValidationErrors && !unit.description.trim() ? "Required field" : ""}
                        InputProps={{                  
                          sx: {
                            color: "#F6F4FE",
                            outlineColor: "#777280",
                            borderColor: "#777280",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#777280",
                            },
                            fontSize: isLargeScreen ? "1rem" : undefined,
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: isLargeScreen ? "1rem" : undefined,
                            color: "#F6F4FE",                    
                            outlineColor: "#777280",
                            borderColor: "#777280",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#777280",
                            },                    
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }} sx={{ textAlign: 'right' }}>
                      {index === units.length - 1 ? (
                        <IconButton
                          onClick={addUnitField}
                          sx={{
                            color: "#F6F4FE",   
                            border: '0.5px solid #F6F4FE'                        ,                          
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              boxShadow: '0.5px 1px 0.5px',
                            },
                          }}
                          disabled={isDisabled}
                        >
                          <AddIcon />
                        </IconButton>
                      ) : null}
                      {units.length > 1 && (
                        <IconButton
                          onClick={() => removeUnitField(index)}
                          sx={{
                            color: theme.palette.error.main,
                            border: '0.5px solid red',                          
                            ml: 1,
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                          disabled={isDisabled}
                        >
                          <Close />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Tooltip>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>        
        <Button
          variant="contained"
          onClick={handleAddUnits}
          disabled={loading || fetchingDepartments || !selectedDepartment}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 6, sm: 2 },
            borderRadius: 50,
            fontWeight: "semibold",
            color: "#2C2C2C",
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1rem" },
            "&:hover": {
              backgroundColor: "#F6F4FE",
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
      </DialogActions>
    </Dialog>
  );
};

export default UnitModal;