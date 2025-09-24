import React, { useState, useEffect } from "react";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
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

interface Branch {
  id: string;
  name: string;
}

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UnitModal: React.FC<UnitModalProps> = ({ open, onClose, onSuccess }) => {
  usePageToast("unit-modal");
  const [units, setUnits] = useState<UnitFormData[]>([{ name: "", description: "" }]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  // Fetch branches when modal opens
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setFetchingBranches(true);
        const response = await Api.get<{ branches: Branch[] }>("/church/get-branches");
        const branchesData = response.data?.branches || [];
        setBranches(branchesData);
        // Set default branch to authData.branchId or HeadQuarter if no branchId
        setSelectedBranch(authData?.branchId);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        showPageToast("Failed to load branches. Please try again.", "error");
      }
      finally{
        setFetchingBranches(false);
      }
    };

    if (open) {
      fetchBranches();
    }
  }, [open, authData?.branchId]);

  // Fetch departments when selectedBranch changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedBranch) {
        setDepartments([]);
        setSelectedDepartment("");
        return;
      }

      try {
        setFetchingDepartments(true);
        const params = new URLSearchParams();
        if (selectedBranch) {
          params.append("branchId", selectedBranch);
        }

        const response = await Api.get<{ departments: Department[] }>(
          `/church/get-departments?${params.toString()}`
        );
        setDepartments(response.data?.departments || []);
        setSelectedDepartment(authData?.department || ''); // Reset department selection on branch change
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        showPageToast("Failed to load departments. Please try again.", "error");
      } finally {
        setFetchingDepartments(false);
      }
    };

    if (open) {
      fetchDepartments();
    }
  }, [selectedBranch, open]);

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
    if (!selectedBranch) {
      showPageToast("Please select a branch", "error");
      return;
    }

    if (!selectedDepartment) {
      showPageToast("Please select a department", "error");
      return;
    }

    setShowValidationErrors(true);

    for (const unit of units) {
      if (!unit.name.trim()) {
        showPageToast("Unit name is required for all units", "error");
        return;
      }
      if (!unit.description.trim()) {
        showPageToast("Description is required for all units", "error");
        return;
      }
    }

    const payload: any = {
      departmentId: selectedDepartment,
      units: units.map(unit => ({
        name: unit.name.trim(),
        description: unit.description.trim(),
      })),
    };

    if (selectedBranch) {
      payload.branchId = selectedBranch;
    }

    try {
      setLoading(true);
      const response = await Api.post(`/church/create-units`, payload);

      if (response.data?.units) {
        showPageToast(`${response.data.units.length} unit(s) created successfully!`, "success");
        setUnits([{ name: "", description: "" }]);
        setSelectedDepartment("");
        setSelectedBranch(authData?.branchId);
        setShowValidationErrors(false);

        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 2500);
      }
    } catch (error: any) {
      console.error("Unit creation error:", error);
      let errorMessage = "Failed to create Unit. Please try again.";

      if (error.response?.data?.error?.message) {
        errorMessage = `${error.response.data.error.message} Please try again.`;
      } else if (error.response?.data?.message) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(", ");
        } else {
          errorMessage = `${error.response.data.message} Please try again.`;
        }
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(", ");
      }

      showPageToast(errorMessage, "error");
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
          borderRadius: 2,
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
          <IconButton onClick={onClose} aria-label="Close dialog">
            <Close sx={{ color: "#B0B0B0" }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel 
              id="branch-select-label" 
              sx={{ 
                fontSize: isLargeScreen ? '1rem' : undefined, 
                color: '#F6F4FE',
                '&.Mui-focused': { color: '#F6F4FE' }
              }}
            >
              Select Branch *
            </InputLabel>
            <Select
              labelId="branch-select-label"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              label="Select Branch *"
              disabled={loading}
              sx={{
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                "& .MuiSelect-select": { color: "#F6F4FE" },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              }}
              aria-label="Select branch"
            >
              {fetchingBranches ? (
                <MenuItem disabled>
                  <Box display="flex" alignItems="center" width="100%">
                    <CircularProgress size={20} sx={{ color: "#F6F4FE", mr: 1 }} />
                    Loading branches...
                  </Box>
                </MenuItem>
              ) : branches.length === 0 ? (
                <MenuItem disabled>No branches available</MenuItem>
              ) :
               (branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
              )))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel 
              id="department-select-label" 
              sx={{ 
                fontSize: isLargeScreen ? '1rem' : undefined, 
                color: '#F6F4FE',
                '&.Mui-focused': { color: '#F6F4FE' }
              }}
            >
              Select Department *
            </InputLabel>
            <Select
              labelId="department-select-label"
              value={selectedDepartment}
              label="Select Department *"
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={loading || !selectedBranch || fetchingDepartments}
              sx={{
                fontSize: isLargeScreen ? '1rem' : undefined,
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                "& .MuiSelect-select": { color: "#F6F4FE" },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
              }}
              aria-label="Select department"
            >
              {fetchingDepartments ? (
                <MenuItem disabled>
                  <Box display="flex" alignItems="center" width="100%">
                    <CircularProgress size={20} sx={{ color: "#F6F4FE", mr: 1 }} />
                    Loading departments...
                  </Box>
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

          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontSize: isLargeScreen ? '1.2rem' : undefined,
              color: "#F6F4FE"
            }}
          >
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
                key={index}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: isUnitEmpty ? '#353535' : '#2C2C2C', // Lighter dialog background for validation errors
                    border: isUnitEmpty ? '1px solid #4B4B4B' : '1px solid #2C2C2C',
                    transition: 'all 0.3s ease',
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12 }} sx={{ textAlign: 'right' }}>                     
                      {units.length > 1 && (
                        <IconButton
                          onClick={() => removeUnitField(index)}
                          title="Remove Unit"
                          sx={{
                            color: 'gray',                        
                            ml: 1,                           
                            borderRadius: '4px'
                          }}
                          disabled={isDisabled}
                          aria-label={`Remove unit ${index + 1}`}
                        >
                          <Close fontSize="small"/>
                        </IconButton>
                      )}
                    </Grid>
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
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                            fontSize: isLargeScreen ? "1rem" : undefined,
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: isLargeScreen ? "1rem" : undefined,
                            color: "#F6F4FE",
                            "&.Mui-focused": { color: "#F6F4FE" },
                          },
                        }}
                        aria-label={`Unit name ${index + 1}`}
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
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                            fontSize: isLargeScreen ? "1rem" : undefined,
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: isLargeScreen ? "1rem" : undefined,
                            color: "#F6F4FE",
                            "&.Mui-focused": { color: "#F6F4FE" },
                          },
                        }}
                        aria-label={`Unit description ${index + 1}`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }} sx={{ textAlign: 'right' }}>
                      {index === units.length - 1 ? (
                        <IconButton
                          onClick={addUnitField}
                          title="Add More Unit"
                          sx={{
                            color: "#F6F4FE",
                            borderRadius: '5px',
                            border: '0.5px solid gray',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              boxShadow: '0.5px 1px 0.5px',
                            },
                          }}
                          disabled={isDisabled}
                          aria-label="Add new unit"
                        >
                          <AddIcon />
                        </IconButton>
                      ) : null}
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
          disabled={loading || fetchingDepartments || !selectedBranch || !selectedDepartment}
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
          aria-label="Create units"
        >
          {loading ? (
            <Box display="flex" alignItems="center">
              <CircularProgress size={18} sx={{ color: '#2C2C2C', mr: 1 }} />
              Creating...
            </Box>
          ) : (
            `Create ${units.length > 1 ? `${units.length} Units` : 'Unit'}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitModal;