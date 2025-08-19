import React, { useState} from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  InputAdornment,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import {
  IoPersonOutline,
  IoCallOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { BsCalendarDate } from "react-icons/bs";
import { FaTransgender } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import Api from "../../../shared/api/api";
import { Close } from "@mui/icons-material";

interface FormData {
  name: string;
  phoneNo: string;
  sex: string;
  address: string;
  birthMonth: string;
  birthDay: string;
  timer: number | null;
}

const months = [
  { name: "January", value: "01" },
  { name: "February", value: "02" },
  { name: "March", value: "03" },
  { name: "April", value: "04" },
  { name: "May", value: "05" },
  { name: "June", value: "06" },
  { name: "July", value: "07" },
  { name: "August", value: "08" },
  { name: "September", value: "09" },
  { name: "October", value: "10" },
  { name: "November", value: "11" },
  { name: "December", value: "12" },
];

const days = Array.from({ length: 31 }, (_, i) =>
  (i + 1).toString().padStart(2, "0")
);

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ 
  open, 
  onClose,
  onSuccess 
}) => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phoneNo: "",
    sex: "",
    address: "",
    birthMonth: "",
    birthDay: "",
    timer: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [downLoading, setDownLoading] = useState(false);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name?: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDownloadTemplate = async () => {
    setDownLoading(true);
    try {
      const response = await Api.get("/member/import-followup-template", {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = "newcomers-template.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel template downloaded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error: any) {
      console.error("Failed to download template:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to download Excel template. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setDownLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/add-follow-up?churchId=${authData?.churchId}${branchIdParam}`, formData);

      toast.success("New Comer created successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });

      setFormData({
        name: "",
        phoneNo: "",
        sex: "",
        address: "",
        birthMonth: "",
        birthDay: "",
        timer: null,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating newcomer:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create New Comer. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Main Registration Modal */}
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            py: 3,
            px: 2
          }
        }}
      >
        <DialogTitle>
          <Box sx={{display: 'flex', flexDirection: {xs: 'column', md: 'row'}, alignItems: {xs:'center', md:'start'}, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" fontWeight={600} sx={{ color: "#F6F4FE" }}>
                Register Newcomer
              </Typography>        
            </Box>          
             <IconButton onClick={onClose}>
                <Close className="text-gray-300"/>
              </IconButton> 
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <Button
              variant="contained"
              onClick={handleDownloadTemplate}
              disabled={downLoading}
              sx={{
                py: 1,
                backgroundColor: "#F6F4FE",
                px: { xs: 3, sm: 3 },
                m:2,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "#2C2C2C",
                fontSize: { xs: "1rem", md: "0.875rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "#F6F4FE",
                  opacity: 0.9,
                },
              }}
            >
              {downLoading ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                  Downloading...
                </>
              ) : (
                "Download Newcomer Template"
              )}
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>        
            {/* Form Fields */}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <TextField
                    label="Full Name"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoPersonOutline style={{ color: '#F6F4FE' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: "#F6F4FE",
                        outlineColor: "#777280",
                        borderColor: "#777280",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#777280",
                        },
                        fontSize: "1rem" ,
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        fontSize: "1rem" ,
                        color: "#F6F4FE",                    
                        outlineColor: "#777280",
                        borderColor: "#777280",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#777280",
                        },                    
                      },
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <TextField
                    label="Phone Number"
                    id="phoneNo"
                    name="phoneNo"
                    type="tel"
                    value={formData.phoneNo}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                    disabled={isLoading}
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
                        fontSize: "1rem" ,
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        fontSize: "1rem" ,
                        color: "#F6F4FE",                    
                        outlineColor: "#777280",
                        borderColor: "#777280",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#777280",
                        },                    
                      },
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="gender-label" sx={{ fontSize: '1rem', color: "#F6F4FE" }}>Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    label="Gender"
                    onChange={handleChange}
                    disabled={isLoading}
                    startAdornment={
                      <InputAdornment position="start">
                        <FaTransgender style={{ color: "#F6F4FE" }} />
                      </InputAdornment>
                    }
                    sx={{ "& .MuiSelect-icon": { right: 8 },                        
                      fontSize: "1rem" ,                
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
                    <MenuItem value="" disabled>
                      Select Gender
                    </MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <TextField
                    label="Address"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    disabled={isLoading}
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
                        fontSize: "1rem" ,
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        fontSize: "1rem" ,
                        color: "#F6F4FE",                    
                        outlineColor: "#777280",
                        borderColor: "#777280",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#777280",
                        },                    
                      },
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} spacing={2}>
                <Box sx={{ display: "flex", gap: 2, flexDirection: { md: "row", xs: "column" } }}>
                  <FormControl fullWidth>
                    <InputLabel id="birthMonth-label" sx={{ fontSize: '1rem', color: "#F6F4FE" }}>Month of Birth</InputLabel>
                    <Select
                      labelId="birthMonth-label"
                      id="birthMonth"
                      name="birthMonth"
                      value={formData.birthMonth}
                      label="Month of Birth"
                      onChange={handleChange}
                      disabled={isLoading}
                      startAdornment={
                        <InputAdornment position="start">
                          <BsCalendarDate style={{ color: "#F6F4FE"}} />
                        </InputAdornment>
                      }
                      sx={{ "& .MuiSelect-icon": { right: 8 },                        
                        fontSize: "1rem" ,                
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
                      <MenuItem value="" disabled>
                        Select Month
                      </MenuItem>
                      {months.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="birthDay-label" sx={{ fontSize: '1rem', color: "#F6F4FE" }}>Day of Birth</InputLabel>
                    <Select
                      labelId="birthDay-label"
                      id="birthDay"
                      name="birthDay"
                      value={formData.birthDay}
                      label="Day of Birth"
                      onChange={handleChange}
                      disabled={isLoading}
                      startAdornment={
                        <InputAdornment position="start">
                          <BsCalendarDate style={{ color: "#F6F4FE"}} />
                        </InputAdornment>
                      }
                      sx={{ "& .MuiSelect-icon": { right: 8 },                        
                        fontSize: "1rem" ,                
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
                      <MenuItem value="" disabled>
                        Select Day
                      </MenuItem>
                      {days.map((day) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="timer-label" sx={{ fontSize: '1rem', color: "#F6F4FE" }}>Attendance Duration</InputLabel>
                  <Select
                    labelId="timer-label"
                    id="timer"
                    name="timer"
                    value={formData.timer || ""}
                    label="Attendance Duration"
                    onChange={handleChange}
                    disabled={isLoading}
                    startAdornment={
                      <InputAdornment position="start">
                        <FiClock style={{ color: "#F6F4FE"}} />
                      </InputAdornment>
                    }
                    sx={{ "& .MuiSelect-icon": { right: 8 },                        
                      fontSize: "1rem" ,                
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
                    <MenuItem value="" disabled>
                      Select how many times you have been here
                    </MenuItem>
                    {Array.from({ length: 10 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? "Time" : "Times"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Form Actions */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "end",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: { xs: "flex-end" },
                width: "100%",
                px: 2,
                py: 1,
              }}
            >            
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1,
                  backgroundColor: "#F6F4FE",
                  px: { xs: 5, sm: 5 },
                  borderRadius: 50,
                  fontWeight: "semibold",
                  textTransform: "none",
                  fontSize: { xs: "1rem", sm: "1rem" },
                  color: "#2C2C2C",
                  "&:hover": {
                    backgroundColor: "#F6F4FE",
                    opacity: 0.9,
                  },
                  width: { xs: "100%", sm: "auto" },
                  order: { xs: 1, sm: 2 },
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </Box>
          </Box>
        </DialogContent>
  
      </Dialog>
    </>
  );
};

export default RegistrationModal;