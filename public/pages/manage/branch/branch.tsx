import React, { useState } from "react";
import { IoMailOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import Api from "../../../shared/api/api";
import { toast, ToastContainer } from "react-toastify";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface FormData {
  name: string;
  location: string;
  email: string;
  phone: string;
}

interface BranchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BranchModal: React.FC<BranchModalProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    location: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const theme = useTheme();
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

      setFormData({ name: "", location: "", email: "", phone: "" });
      onSuccess?.();
      setTimeout(() => {        
        onClose();
      },2000)

    } catch (error: any) {
      console.error("Error creating branch:", error.response?.data || error.message);
      let errorMessage = "Failed to create branch. Please try again.";
            
      if (error.response?.data?.error?.message) {
        errorMessage = `${error.response.data.error.message} Please try again.`;
      } else if (error.response?.data?.message) {
         if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(", ");
        } else {
          errorMessage = `${error.response.data.message} Please try again.`;
        }
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        errorMessage = error.response.data.errors.join(", ");
      }
      
      toast.error(errorMessage, {
        autoClose: 5000,
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
      maxWidth="md"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius:  2,
          bgcolor: '#2C2C2C',
          color: "#F6F4FE",
        },
      }}
    >
      <ToastContainer/>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Create New Branch
          </Typography>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300"/>
          </IconButton>
        </Box>
      </DialogTitle>      

      <DialogContent dividers>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            py: 2,
          }}
        >
          <Grid container spacing={4}>
            {/* Name Field */}
            <Grid size={12}>
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
                      <BsPerson style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),
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
                required
              />
            </Grid>

            {/* Location Field */}
            <Grid size={12}>
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
                      <IoLocationOutline style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),
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

            {/* Email Field */}
            <Grid size={12}>
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
                      <IoMailOutline style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),
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

            {/* Phone Field */}
            <Grid size={12}>
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
                      <IoCallOutline style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  ),
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
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 6, sm: 2 },
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
            <span className="text-gray-500">
              <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
              Creating...
            </span>
          ) : (
            "Create Branch"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BranchModal;