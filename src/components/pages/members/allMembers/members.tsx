import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsPerson, BsCalendar, BsGeoAlt } from "react-icons/bs";
import { IoCallOutline } from "react-icons/io5";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";

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
  InputAdornment,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";

interface FormData {
  name: string;
  address: string;
  whatappNo: string;
  phoneNo: string;
  sex: string;
  maritalStatus: string;
  memberSince: string;
  ageFrom: number | null;
  ageTo: number | null;
  birthMonth: string;
  birthDay: string;
  state: string;
  LGA: string;
  nationality: string;
}

const memberSincem: React.FC = () => {
  const ageRanges = [
    { label: "12-18", from: 12, to: 18 },
    { label: "19-25", from: 19, to: 25 },
    { label: "26-35", from: 26, to: 35 },
    { label: "36-45", from: 36, to: 45 },
    { label: "46-55", from: 46, to: 55 },
    { label: "56+", from: 56, to: null },
    { label: "Custom", from: null, to: null },
  ];

  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    whatappNo: "",
    phoneNo: "",
    sex: "",
    maritalStatus: "",
    memberSince: "",
    ageFrom: null,
    ageTo: null,
    birthMonth: "",
    birthDay: "",
    state: "",
    LGA: "",
    nationality: "",
  });    
  

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [showCustomAgeInputs, setShowCustomAgeInputs] = useState(false);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : Number(value),
    }));
  };

  const handleAgeRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedAgeRange(value);

    if (value === "Custom") {
      setShowCustomAgeInputs(true);
      setFormData(prev => ({
        ...prev,
        ageFrom: null,
        ageTo: null,
      }));
    } else {
      setShowCustomAgeInputs(false);
      const selectedRange = ageRanges.find(range => range.label === value);
      if (selectedRange) {
        setFormData(prev => ({
          ...prev,
          ageFrom: selectedRange.from,
          ageTo: selectedRange.to,
        }));
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!formData.name || !formData.address || !formData.phoneNo || !formData.sex || !formData.maritalStatus) {
        toast.error("Please fill in all required fields", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.address || !formData.phoneNo || 
          !formData.birthMonth || !formData.birthDay || 
          !formData.state || !formData.LGA || !formData.nationality) {
        throw new Error("Please fill in all required fields");
      }

      const payload = {
        ...formData,
      };
      
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/add-member?churchId=${authData?.churchId}${branchIdParam}`, payload);
      toast.success("Member created successfully!", { 
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      
      setFormData({
        name: "",
        address: "",
        whatappNo: "",
        phoneNo: "",
        sex: "",
        maritalStatus: "",
        memberSince: "",
        ageFrom: null,
        ageTo: null,
        birthMonth: "",
        birthDay: "",
        state: "",
        LGA: "",
        nationality: "",
      });
      setSelectedAgeRange("");
      setShowCustomAgeInputs(false);
      setTimeout(()=>{
        navigate('/members/view-members')
      }, 1500)

    } catch (error: any) {
      console.error("Error creating member:", error);
      const errorMessage = error.response?.data?.message || 
        error.message || 
        "Failed to create member. Please try again.";
      toast.error(errorMessage, { 
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const steps = ["Basic Information", "Additional Details"];


  return (
    <DashboardManager>
      <Container sx={{ py: isMobile ? 2 : 3 }}>
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{xs:12, md:9}}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
              component="h1"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.5rem" : undefined,
              }}
            >
              Manage Members
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.8125rem" : undefined,
              }}
            >
              Create and manage member records for {authData?.church_name}.
            </Typography>
          </Grid>
          <Grid
            size={{xs:12, md:3}}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/members/view-members")}
              size="medium"
              sx={{
                backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
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
              View Members
            </Button>
          </Grid>
        </Grid>

        <Box 
          sx={{ 
            width: { xs: '100%', sm: '75%', md: '40%' }, // Reduce width based on screen size
            mb: 4, 
            mx: 'auto', // Center the Stepper horizontally
            textAlign: 'center' // Center the text inside the Stepper
          }}
        >
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            sx={{
              // Ensure the stepper container is styled appropriately
              width: "100%",
              padding: { xs: 1, sm: 2 },
              // Target the StepLabel root
              "& .MuiStepLabel-root": {
                padding: 0,
                width: "100%",
              },
              // Target the label text directly
              "& .MuiStepLabel-label": {
                fontSize: "0.75rem",
                // Default label color (non-active, non-completed)
                color: "#6B7280", // Gray for inactive steps
                // Active state
                "&.Mui-active": {
                  color: "var(--color-primary) !important", // Force color with !important
                  fontWeight: "bold",
                },
                // Completed state
                "&.Mui-completed": {
                  color: "var(--color-primary) !important", // Force color with !important
                  fontWeight: "normal",
                },
              },
              // Ensure step icon colors align with label
              "& .MuiStepIcon-root": {
                color: "#D1D5DB", // Inactive icon color
                "&.Mui-active": {
                  color: "var(--color-primary)", // Active icon color
                },
                "&.Mui-completed": {
                  color: "var(--color-primary)", // Completed icon color
                },
              },
              "& .MuiStepIcon-text": {
                fill: "#FFFFFF", // Text inside step icons (e.g., step number)
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            mt: 4,
            borderRadius: 2,
          }}
        >
          {currentStep === 0 ? (
            <Grid container spacing={4}>
              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter full name"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                />
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  select
                  label="Gender *"
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  variant="outlined"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                >
                  <MenuItem value="" disabled>
                    Select Gender
                  </MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  label="WhatsApp Number"
                  id="whatappNo"
                  name="whatappNo"
                  value={formData.whatappNo}
                  type="tel"                                
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter WhatsApp number"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                />
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  id="phoneNo"
                  name="phoneNo"
                  type="tel"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter phone number"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                />
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  select
                  label="Marital Status *"
                  id="maritalStatus"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  variant="outlined"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsPerson style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                >
                  <MenuItem value="" disabled>
                    Select marital status
                  </MenuItem>
                  <MenuItem value="single">Single</MenuItem>
                  <MenuItem value="married">Married</MenuItem>
                  <MenuItem value="divorced">Divorced</MenuItem>
                  <MenuItem value="widowed">Widowed</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>

                <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  label="Year Of Membership"
                  id="memberSince"
                  name="memberSince"
                  type="date"
                  value={formData.memberSince}
                  onChange={handleChange} // Changed to handleChange to correctly update the state
                  variant="outlined"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                    <BsPerson style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                  }}
                  InputLabelProps={{
                  shrink: true, // Ensures the label stays above the input for date fields
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                  }}
                />
                </Grid>
              <Grid size={{xs:12, md:12}}>
                <TextField
                  fullWidth
                  label="Address *"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter address"
                  disabled={isLoading}
                  size="medium"
                  multiline
                  rows={3}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary, marginTop: -14 }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={4}>
              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  select
                  label="Age Range"
                  value={selectedAgeRange}
                  onChange={handleAgeRangeChange}
                  variant="outlined"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary, marginTop: -18 }} /> {/* Adjusted marginTop */}
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Select age range
                  </MenuItem>
                  {ageRanges.map((range) => (
                    <MenuItem key={range.label} value={range.label}>
                      {range.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {showCustomAgeInputs && (
                <>
                  <Grid size={{xs:6, md:3}}>
                    <TextField
                      fullWidth
                      label="Age From"
                      id="ageFrom"
                      name="ageFrom"
                      type="number"
                      value={formData.ageFrom ?? ""}
                      onChange={handleNumberChange}
                      variant="outlined"
                      placeholder="From"
                      disabled={isLoading}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BsPerson style={{ color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: isLargeScreen ? "1rem" : undefined,
                        },
                        inputProps: {
                          min: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{xs:6, md:3}}>
                    <TextField
                      fullWidth
                      label="Age To"
                      id="ageTo"
                      name="ageTo"
                      type="number"
                      value={formData.ageTo ?? ""}
                      onChange={handleNumberChange}
                      variant="outlined"
                      placeholder="To"
                      disabled={isLoading}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BsPerson style={{ color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: isLargeScreen ? "1rem" : undefined,
                        },
                        inputProps: {
                          min: formData.ageFrom ?? 0,
                        },
                      }}
                    />
                  </Grid>
                </>
              )}

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  select
                  label="Birth Month *"
                  id="birthMonth"
                  name="birthMonth"
                  value={formData.birthMonth}
                  onChange={handleChange}
                  variant="outlined"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsCalendar style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                >
                  <MenuItem value="" disabled>
                    Select birth month
                  </MenuItem>
                  {months.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  select
                  label="Birth Day *"
                  id="birthDay"
                  name="birthDay"
                  value={formData.birthDay}
                  onChange={handleChange}
                  variant="outlined"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsCalendar style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                >
                  <MenuItem value="" disabled>
                    Select day
                  </MenuItem>
                  {days.map((day) => (
                    <MenuItem key={day} value={day.toString().padStart(2, '0')}>
                      {day}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  label="State *"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter state"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                />
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  label="LGA *"
                  id="LGA"
                  name="LGA"
                  value={formData.LGA}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter local government area"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                />
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <TextField
                  fullWidth
                  label="Nationality *"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter nationality"
                  disabled={isLoading}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BsGeoAlt style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: isLargeScreen ? "1rem" : undefined,
                    },
                  }}
                  required
                />
              </Grid>
            </Grid>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            {currentStep === 1 ? (
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                disabled={isLoading}
                sx={{
                  py: 1,
                  px: { xs: 2, sm: 2 },
                  borderRadius: 1,
                  fontWeight: "semibold",
                  textTransform: "none",
                  fontSize: { xs: "1rem", sm: "1rem" },
                }}
              >
                Previous
              </Button>
            ) : (
              <div /> 
            )}
            
            {currentStep === 0 ? (
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={isLoading}
                sx={{
                  py: 1,
                  backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                  px: { xs: 3, sm: 3 },
                  borderRadius: 1,
                  fontWeight: "semibold",
                  textTransform: "none",
                  color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                  fontSize: { xs: "1rem", sm: "1rem" },
                  "&:hover": {
                    backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                    opacity: 0.9, // Add hover effect
                  },
                  ml: "auto",
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1,
                  backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
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
                  ml: "auto",
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                    Creating Member...
                  </>
                ) : (
                  "Create Member"
                )}
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default memberSincem;