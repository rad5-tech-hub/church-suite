import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  CircularProgress,  
  InputAdornment,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
} from "@mui/material";
import { BsPerson, BsGeoAlt, BsCalendar } from "react-icons/bs";
import { IoCallOutline, IoLocationOutline, IoPersonOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import Api from "../../../shared/api/api";

interface FormData {
  name: string;
  phoneNo: string;
  sex: string;
  address: string;
  birthMonth: string;
  birthDay: string;
  whatappNo: string;
  maritalStatus: string;
  memberFor: string;
  ageFrom: number | null;
  ageTo: number | null;
  state: string;
  LGA: string;
  nationality: string;
}

const MemberForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [showCustomAgeInputs, setShowCustomAgeInputs] = useState(false);
  const [churchId, setChurchId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");

  useEffect(() => {
    const urlChurchId = searchParams.get("churchId");
    const urlBranchId = searchParams.get("branchId");
    
    if (urlChurchId) setChurchId(urlChurchId);
    if (urlBranchId) setBranchId(urlBranchId);
  }, [searchParams]);

  const steps = ["Personal Information", "Additional Details"];
  
  const ageRanges = [
    { label: "12-18", from: 12, to: 18 },
    { label: "19-25", from: 19, to: 25 },
    { label: "26-35", from: 26, to: 35 },
    { label: "36-45", from: 36, to: 45 },
    { label: "46-55", from: 46, to: 55 },
    { label: "56+", from: 56, to: null },
    { label: "Custom", from: null, to: null },
  ];

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

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phoneNo: "",
    sex: "",
    address: "",
    birthMonth: "",
    birthDay: "",
    whatappNo: "",
    maritalStatus: "",
    memberFor: "",
    ageFrom: null,
    ageTo: null,
    state: "",
    LGA: "",
    nationality: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value === "" ? null : Number(value) });
  };

  const handleAgeRangeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const value = e.target.value as string;
    setSelectedAgeRange(value);
    
    const selectedRange = ageRanges.find(range => range.label === value);
    if (selectedRange) {
      setShowCustomAgeInputs(value === "Custom");
      setFormData({
        ...formData,
        ageFrom: selectedRange.from,
        ageTo: selectedRange.to,
      });
    }
  };

  const handleNextStep = () => {
    if (
      !formData.name ||
      !formData.phoneNo ||
      !formData.sex ||
      !formData.maritalStatus ||
      !formData.address
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setCurrentStep(1);
  };

  const handlePrevStep = () => {
    setCurrentStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const branchIdParam = branchId ? `&branchId=${branchId}` : "";
      await Api.post(`/member//add-member?churchId=${churchId}${branchIdParam}`, formData);

      toast.success("Member information submitted successfully!", {
        autoClose: 3000,
      });

    } catch (error: any) {
      console.error("Error creating member:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to submit member information. Please try again.", {
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isLargeScreen = true;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        {/* Left Section with Image */}
        <div className="image-section flex-1 relative rounded-lg overflow-hidden">
          <div
            className="absolute inset-0 bg-no-repeat bg-center lg:bg-fit bg-contain"
            style={{
              backgroundImage: "url('https://i.pinimg.com/736x/9c/10/a5/9c10a5de35e8026656533f06bd0dbb72.jpg')",
            }}
          ></div>
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 min-h-[200px] flex flex-col justify-center"></div>
        </div>

        {/* Right Section with Form */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
          <Box>
            <Box 
              sx={{                
                mb: 4, 
                mx: 'auto',
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: "text.primary" }}>
                {currentStep === 0 ? "Member's Personal Information" : "Member's Additional Details"}                
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 1}}>
                {currentStep === 0 
                  ? "Welcome! Please provide your basic information." 
                  : "Help us know you better with some additional details."}
              </Typography>
              <Stepper
                activeStep={currentStep}
                alternativeLabel
                sx={{
                  width: "100%",
                  padding: { xs: 1, sm: 2 },
                  "& .MuiStepLabel-root": {
                    padding: 0,
                    width: "100%",
                  },
                  "& .MuiStepLabel-label": {
                    fontSize: "0.75rem",
                    color: "#6B7280",
                    "&.Mui-active": {
                      color: "#111827 !important",
                      fontWeight: "bold",
                    },
                    "&.Mui-completed": {
                      color: "#111827 !important",
                      fontWeight: "normal",
                    },
                  },
                  "& .MuiStepIcon-root": {
                    color: "#D1D5DB",
                    "&.Mui-active": {
                      color: "#111827",
                    },
                    "&.Mui-completed": {
                      color: "#111827",
                    },
                  },
                  "& .MuiStepIcon-text": {
                    fill: "#FFFFFF",
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
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3}}>                
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
                            <IoPersonOutline style={{ color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: isLargeScreen ? "1rem" : undefined,
                        },
                      }}
                      required
                    />                  
            
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
                      }}
                      required
                    >
                      <MenuItem value="" disabled>
                        Select Gender
                      </MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </TextField>                 
               
                    <TextField
                      fullWidth
                      label="Phone Number *"
                      id="phoneNo"
                      name="phoneNo"
                      type="number"
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
                      }}
                      required
                    />                 
               
                    <TextField
                      fullWidth
                      label="WhatsApp Number"
                      id="whatappNo"
                      name="whatappNo"
                      value={formData.whatappNo}
                      type="number"                                
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
                      }}
                    />              
                  
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
                    </TextField>     
                                             
               
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
                            <IoLocationOutline style={{ color: theme.palette.text.secondary, marginTop: -14 }} />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />                  
                </Box>
              ) : (
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>                
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
                            <BsGeoAlt style={{ color: theme.palette.text.secondary, marginTop: -18 }} />
                            </InputAdornment>
                        ),
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

                    {showCustomAgeInputs && (
                        <>
                        <Box sx={{ mt: 2 }}>
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
                                inputProps: {
                                min: 0,
                                },
                            }}
                            />                        
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
                                inputProps: {
                                min: formData.ageFrom ?? 0,
                                },
                            }}
                            />
                        </Box>
                        </>
                    )}
            
                    <TextField
                    fullWidth
                    label="Year Of Membership"
                    id="memberFor"
                    name="memberFor"
                    type="date"
                    value={formData.memberFor}
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
                      }}
                      required
                    >
                      <MenuItem value="" disabled>
                        Select day
                      </MenuItem>
                      {days.map((day) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ))}
                    </TextField>               

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
                      required
                    />               
            
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
                      required
                    />              
             
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
                      required
                    />             
                </Box>
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
                      bgcolor: "#1f2937",
                      px: { xs: 3, sm: 3 },
                      borderRadius: 1,
                      fontWeight: "semibold",
                      textTransform: "none",
                      fontSize: { xs: "1rem", sm: "1rem" },
                      "&:hover": { bgcolor: "#111827" },
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
                      bgcolor: "#1f2937",
                      px: { xs: 2, sm: 2 },
                      borderRadius: 1,
                      fontWeight: "semibold",
                      textTransform: "none",
                      fontSize: { xs: "1rem", sm: "1rem" },
                      "&:hover": { bgcolor: "#111827" },
                      ml: "auto",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                        Submitting...
                      </>
                    ) : (
                      "Submit Information"
                    )}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </div>
      </div>
    </div>
  );
};

export default MemberForm;