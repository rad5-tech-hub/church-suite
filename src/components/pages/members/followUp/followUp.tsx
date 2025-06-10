import React, { useState } from "react";
import { IoPersonOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { BsCalendarDate } from "react-icons/bs";
import { FaTransgender} from "react-icons/fa";
import { useNavigate} from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
  Container,
  TextField,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { FiClock } from "react-icons/fi";

interface FormData {
  name: string;
  phoneNo: string;
  sex: string;
  address: string;
  birthMonth: string;
  birthDay: string;
  timer: null
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

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

const RegistrationForm: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);//auth storage to get churchid and branchID
  
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
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | 
       { target: { name?: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/add-follow-up?churchId=${authData?.churchId}${branchIdParam}`, formData);

      toast.success(`New Fellow Up created successfully!`, {
        autoClose: 3000,      
      });
      setTimeout(() => {
        navigate("/manage/view-branches");      
      }, 1500);;
    } catch (error:any) {
        console.error("Error creating branch:", error.response?.data || error.message);
        toast.error(error.response?.data?.message || "Failed to create branch. Please try again.", {
          autoClose: 3000,
        });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardManager>
      <Container  sx={{ py: isMobile ? 2 : 4 }}>
        <Grid container spacing={2} sx={{ mb: 7 }}>
          <Grid size={{xs:12, md:8}}>
            <Typography 
              variant="h5" 
              fontWeight={600}
              gutterBottom
              sx={{ color: 'text.primary' }}
            >
               Register Fellow Up
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please fill out the form below to register a Fellow Up.
            </Typography>
          </Grid>
          <Grid 
            size={{xs:12, md:4}}
            sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
              gap: 2
            }}
          >        
            <Button
              variant="contained"   
              onClick={() => navigate("/view/followup")}                             
              sx={{
                py: 1,
                bgcolor: "#1f2937",
                px: { xs: 2, sm: 2 },
                borderRadius: 1,
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": { bgcolor: "#111827" },
              }}
            >
              View Fellow Up
            </Button>
          </Grid>
        </Grid>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Grid container spacing={4}>
              <Grid size={{xs:12, md:6}}>
                {/* Full Name Input */}
                <FormControl fullWidth>
                  <TextField
                    label="Full Name"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoPersonOutline style={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid  size={{xs:12, md:6}}>
                {/* Phone Number Input */}
                <FormControl fullWidth>
                  <TextField
                    label="Phone Number"
                    id="phoneNo"
                    name="phoneNo"
                    type="number"
                    value={formData.phoneNo}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoCallOutline style={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid  size={{xs:12, md:6}}>
                {/* sex Input */}
                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    id="sex"
                    name="sex"
                    value={formData.sex}                  
                    label="sex"
                    onChange={handleChange}
                    required
                    startAdornment={
                      <InputAdornment position="start">
                        <FaTransgender style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{
                      "& .MuiSelect-icon": {
                        right: 8,
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select sex
                    </MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>                  
                  </Select>
                </FormControl>
              </Grid>

              <Grid  size={{xs:12, md:6}}>
                {/* Address Input */}
                <FormControl fullWidth>
                  <TextField
                    label="Address"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoLocationOutline style={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>

              {/* Date of Birth */}
              <Grid size={{xs:12, md:6}} spacing={2}>
                <Box  sx={{ display: 'flex', gap: 2,  flexDirection: { md: 'row', xs: 'column' } }}>
                  <FormControl fullWidth>
                    <InputLabel id="birthMonth-label">Month of Birth</InputLabel>
                    <Select
                      labelId="birthMonth-label"
                      id="birthMonth"
                      name="birthMonth"
                      value={formData.birthMonth}                    
                      label="Month of Birth"
                      onChange={handleChange}
                      required
                      startAdornment={
                        <InputAdornment position="start">
                          <BsCalendarDate style={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      }
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
                    <InputLabel id="birthDay-label">Day of Birth</InputLabel>
                    <Select
                      labelId="birthDay-label"
                      id="birthDay"
                      name="birthDay"
                      value={formData.birthDay}                    
                      label="Day of Birth"
                      onChange={handleChange}
                      required
                      startAdornment={
                        <InputAdornment position="start">
                          <BsCalendarDate style={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      }
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
                {/* Attendance Duration Input */}
                <FormControl fullWidth>
                  <Select
                    labelId="attendanceDuration-label"
                    id="timer"
                    name="timer"
                    value={formData.timer || ""}
                    onChange={handleChange}
                    displayEmpty
                    required
                    startAdornment={
                      <InputAdornment position="start">
                        <FiClock style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="" disabled>
                      Select how many times you have been here. 
                    </MenuItem>
                    {Array.from({ length: 50 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? 'Time' : 'Times'}
                      </MenuItem>
                    ))}
                  </Select>         
                </FormControl>
              </Grid>
          </Grid>

          {/* Submit Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            {/* Form Actions */}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 1,
                bgcolor: "#1f2937",
                px: { xs: 5, sm: 5 },
                borderRadius: 1,
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": { bgcolor: "#111827" },
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
      </Container>
    </DashboardManager>
  );
};

export default RegistrationForm;