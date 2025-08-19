import React, { useState } from "react";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface DepartmentFormData {
  name: string;
  type: 'Department' | 'Outreach';
  description: string;
}

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<DepartmentFormData>({ 
    name: "",
    type: 'Department',
    description: ""
  });
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
      
      toast.success(response.data.message || `Department "${response.data.Department.name}" created successfully!`, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right"
      });
      
      setFormData({ name: "", type: 'Department', description: "" });
      onSuccess?.();
      onClose();
      
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
          <Typography variant="h6" fontWeight={600}>
            Create New Department
          </Typography>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300"/>
          </IconButton>
        </Box>       
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
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
            size="medium"
            InputLabelProps={{
              sx: {
                color: "#F6F4FE", // This changes the label color
                "&.Mui-focused": {
                  color: "#F6F4FE", // Keeps the same color when focused (optional)
                },
              },
            }}
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
            inputProps={{
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

          {/* Type Field */}
          <FormControl fullWidth size="medium">
            <InputLabel id="type-label" sx={{ fontSize: isLargeScreen ? '1rem' : undefined, color: "#F6F4FE"}}>
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
                fontSize: isLargeScreen ? "1rem" : undefined,                
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
            size="medium"
            InputLabelProps={{
              sx: {
                color: "#F6F4FE", // This changes the label color
                "&.Mui-focused": {
                  color: "#F6F4FE", // Keeps the same color when focused (optional)
                },
              },
            }}
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
            inputProps={{
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
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={handleAddDepartment}
          disabled={loading}    
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 2, sm: 2 },
            borderRadius: 50,
            color: "#2C2C2C",
            fontWeight: "semibold",
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
            "Create Department"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentModal;