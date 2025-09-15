import React, { useState } from "react";
import { IoMailOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
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
  // FormHelperText,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface FormData {
  name: string;
  location: string;
  email: string;
  phone: string;
}

interface Errors {
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

  const [errors, setErrors] = useState<Errors>({
    name: "",
    location: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  usePageToast("create-branch");

  const validateForm = (): boolean => {
    const newErrors: Errors = {
      name: "",
      location: "",
      email: "",
      phone: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Branch name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        newErrors.phone = "Phone number must be 10-15 digits";
      }
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.location.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      };

      await Api.post("/church/create-branch", payload);

      showPageToast("Branch created successfully!", "success");

      setFormData({ name: "", location: "", email: "", phone: "" });
      setErrors({ name: "", location: "", email: "", phone: "" });
      onSuccess?.();

      setTimeout(() => {
        onClose();
      }, 4000);
    } catch (error: any) {
      console.error("Error creating branch:", error.response?.data || error.message);
      let errorMessage = "Failed to create branch. Please try again.";

      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.errors)
          ? error.response.data.errors.join(", ")
          : error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(", ");
      }

      if (error.response?.status === 400 && errorMessage.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: "Email address is invalid or already in use" }));
      } else if (error.response?.status === 400 && errorMessage.toLowerCase().includes("phone")) {
        setErrors((prev) => ({ ...prev, phone: "Phone number is invalid or already in use" }));
      } else if (error.response?.status === 400 && errorMessage.toLowerCase().includes("address")) {
        setErrors((prev) => ({ ...prev, location: "Location/address is invalid or already in use" }));
      } else {
        showPageToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", location: "", email: "", phone: "" });
    setErrors({ name: "", location: "", email: "", phone: "" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="md"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: "#2C2C2C",
          color: "#F6F4FE",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600} sx={{ color: "#F6F4FE" }}>
            Create New Branch
          </Typography>
          <IconButton onClick={handleCancel}>
            <Close sx={{ color: "#B0B0B0" }} />
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
            <Grid size={{ xs: 12 }}>
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
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BsPerson style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
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
                error={!!errors.location}
                helperText={errors.location}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoLocationOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
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
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoMailOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Branch Phone No"
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                variant="outlined"
                placeholder="Enter branch phone number"
                disabled={loading}
                size="medium"
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoCallOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isLargeScreen ? "1rem" : undefined,
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
            <Box display="flex" alignItems="center" color="gray">
              <CircularProgress size={18} sx={{ color: "gray", mr: 1 }} />
              Creating...
            </Box>
          ) : (
            "Create Branch"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BranchModal;