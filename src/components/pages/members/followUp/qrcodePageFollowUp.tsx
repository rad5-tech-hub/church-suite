import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Material-UI components
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

// Third-party icons
import { IoCallOutline, IoLocationOutline, IoPersonOutline } from "react-icons/io5";

// Third-party libraries
import { toast } from "react-toastify";

// Local modules
import Api from "../../../shared/api/api";

// Interfaces
interface FirstTimerFormProps {}

interface FirstTimerData {
  fullName: string;
  phoneNo: string;
  gender: string;
  address: string;
  birthDay: string;
  birthMonth: string;
  timer?: number | null;
}

// Main Component
const FirstTimerForm: React.FC<FirstTimerFormProps> = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FirstTimerData>({
    fullName: "",
    phoneNo: "",
    gender: "",
    address: "",
    birthDay: "",
    birthMonth: "",
    timer: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const authData = { churchId: "dummy-church-id", branchId: "dummy-branch-id" };
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/add-follow-up?churchId=${authData?.churchId}${branchIdParam}`, formData);

      toast.success("New Follow Up created successfully!", {
        autoClose: 3000,
      });

      setTimeout(() => {
        navigate("/manage/view-branches");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating follow up:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to create follow up. Please try again.", {
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        <LeftSection />
        <RightSection
          handleSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          formData={formData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

const LeftSection: React.FC = () => (
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
);

interface RightSectionProps {
  handleSubmit: (e: React.FormEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (e: SelectChangeEvent<string | number>) => void;
  formData: FirstTimerData;
  isLoading: boolean;
}

const RightSection: React.FC<RightSectionProps> = ({ 
  handleSubmit, 
  handleInputChange, 
  handleSelectChange, 
  formData, 
  isLoading 
}) => {
  const theme = useTheme();

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

  return (
    <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,              
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: "text.primary" }}>
            Register Follow Up
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome to our church! We're excited to get to know you better.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <FormControl fullWidth>
            <TextField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter full name"
              required
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                    <IoPersonOutline />
                  </Box>
                ),
              }}
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              label="Phone Number"
              name="phoneNo"
              type="tel"
              value={formData.phoneNo}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              required
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                    <IoCallOutline color={theme.palette.text.secondary} />
                  </Box>
                ),
              }}
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              name="gender"
              value={formData.gender}
              label="Gender"
              onChange={handleSelectChange}
              required
            >
              <MenuItem value="" disabled>
                Select gender
              </MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <TextField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
              required
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                    <IoLocationOutline color={theme.palette.text.secondary} />
                  </Box>
                ),
                multiline: true,
                rows: 3,
              }}
            />
          </FormControl>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { md: "row", xs: "column" },
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="birthMonth-label">Birth Month</InputLabel>
              <Select
                labelId="birthMonth-label"
                name="birthMonth"
                value={formData.birthMonth}
                label="Birth Month"
                onChange={handleSelectChange}
                required
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
              <InputLabel id="birthDay-label">Birth Day</InputLabel>
              <Select
                labelId="birthDay-label"
                name="birthDay"
                value={formData.birthDay}
                label="Birth Day"
                onChange={handleSelectChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Day
                </MenuItem>
                {days.map((day) => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl fullWidth>
            <InputLabel id="timer-label">Attendance Frequency</InputLabel>
            <Select
              labelId="timer-label"
              name="timer"
              value={formData.timer ?? ""}
              label="Attendance Frequency"
              onChange={handleSelectChange}
              required
            >
              <MenuItem value="" disabled>
                Select how many times you have been here
              </MenuItem>
              {Array.from({ length: 50 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1} {i + 1 === 1 ? "Time" : "Times"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 3,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 1,
                bgcolor: "#1f2937",
                px: 5,
                borderRadius: 1,
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: "1rem",
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
      </Box>
    </div>
  );
};

export default FirstTimerForm;