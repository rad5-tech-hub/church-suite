import React, { useState } from "react";
import { useSelector } from "react-redux";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
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
  Autocomplete,
} from "@mui/material";
import {
  IoPersonOutline,
  IoCallOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { BsCalendarDate } from "react-icons/bs";
import { FaTransgender } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { Close, DownloadOutlined, UploadFileOutlined } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import UploadNewcomersDialog from "./uploadExcel";

interface FormData {
  name: string;
  phoneNo: string;
  sex: string;
  address: string;
  birthMonth: string;
  birthDay: string;
  timer: number | null;
  branchId?: string;
  eventOccurrenceId: string;
}

interface Branch {
  id: string;
  name: string;
}

interface RegistrationModalProps {
  open: boolean;
  eventId: string ;
  onClose: () => void;
  onSuccess: () => void;
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

const getDaysInMonth = (month: string): number => {
  const monthNumber = parseInt(month, 10);
  if (monthNumber === 2) return 29; // Simplified for leap year
  return [1, 3, 5, 7, 8, 10, 12].includes(monthNumber) ? 31 : 30;
};

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  open,
  onClose,
  eventId,
  onSuccess,
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
    eventOccurrenceId: eventId || "",
    birthDay: "",
    timer: null,
    branchId: authData?.branchId || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [downLoading, setDownLoading] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  usePageToast('newcomers')

  // Fetch branches when modal opens
  const fetchBranches = async () => {
    setBranchLoading(true);
    try {
      const response = await Api.get<{ branches: Branch[] }>("/church/get-branches");
      const branchesData = response.data?.branches || [];
      setBranches(branchesData);
      // Set default branch to authData.branchId or HeadQuarter if no branchId
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      showPageToast("Failed to load branches. Please try again.", "error");
    }
    finally {
      setBranchLoading(false);
    }
  };

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
      const response = await Api.get(`/member/import-followup-template/${authData?.branchId}`, {
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

      showPageToast("Excel template downloaded successfully!", 'success');
    } catch (error: any) {
      console.error("Failed to download template:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to download Excel template. Please try again.";
      showPageToast(errorMessage, 'error');
    } finally {
      setDownLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // ✅ clone the formData but exclude branchId
    const { branchId, ...payload } = formData;

    // ✅ decide if branchId should go to params
    const branchIdParam = branchId ? `&branchId=${branchId}` : "";

    if (eventId) {
      payload
    }

    await Api.post(
      `/member/add-follow-up?churchId=${authData?.churchId}${branchIdParam}`,
      payload
    );

    showPageToast("New Comer created successfully!", "success");

    setFormData({
      name: "",
      phoneNo: "",
      sex: "",
      address: "",
      birthMonth: "",
      birthDay: "",      
      timer: null,
      eventOccurrenceId: "",
      branchId: "", // keep state consistent
    });

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 3000);
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
      errorMessage = error.response.data.errors.join(", ");
    }

    showPageToast(errorMessage, "error");
  } finally {
    setIsLoading(false);
  }
};


  return (
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
          px: 2,
        },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ color: "#F6F4FE" }}>
              Register Newcomer
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300" />
          </IconButton>
        </Box>
        <Box 
            sx={{
              display: "flex",
              justifyContent: { xs: "center", md: "between" }, // center on mobile, end on desktop
              flexDirection: { xs: "column", sm: "column", md: "row" }, // stack on mobile/tablet
              gap: 2, // space between buttons
            }}
        >
          <Button
            variant="contained"
            onClick={handleDownloadTemplate}
            disabled={downLoading}
            sx={{
              py: 1,
              backgroundColor: "#F6F4FE",
              px: { xs: 3, sm: 3 },
              m: 2,
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
               <span className="flex gap-1"> Download Template <DownloadOutlined className="mt-1"/>
                </span>
            )}
          </Button>
          <Button
            variant="contained"            
            disabled={downLoading}
            onClick={()=>{setOpenUpload(true)}}
            sx={{
              py: 1,
              backgroundColor: "#F6F4FE",
              px: { xs: 3, sm: 3 },
              m: 2,
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
              <span className="flex gap-1"> Upload Newcomers <UploadFileOutlined className="text-base"/>
              </span>        
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Grid container spacing={4}>
            <Grid size={{xs: 12, md: 6}}>
              <FormControl fullWidth>
                <InputLabel 
                  id="branch-select-label" 
                  sx={{ 
                    fontSize: '1rem', 
                    color: '#F6F4FE',
                    '&.Mui-focused': { color: '#F6F4FE' }
                  }}
                >
                  Select Branch (optional)
                </InputLabel>
                <Select
                  labelId="branch-select-label"
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  onOpen={fetchBranches}
                  label="Select Branch (optional)"
                  disabled={isLoading}
                  sx={{
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    "& .MuiSelect-select": { color: "#F6F4FE" },
                    "& .MuiSelect-icon": { color: "#F6F4FE" },
                    fontSize: "1rem"
                  }}
                  aria-label="Select branch"
                >
                  <MenuItem value='' > None</MenuItem>
                  {branchLoading ? 
                    <MenuItem disabled> Loading ...</MenuItem>  :
                  branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                  ))
                }
                </Select>
              </FormControl>              
            </Grid>

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
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      fontSize: isMobile ? '0.875rem' : '1rem',
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: '#F6F4FE',
                      '&.Mui-focused': {
                        color: '#F6F4FE',
                      },
                      fontSize: isMobile ? '0.875rem' : '1rem',
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
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline style={{ color: '#F6F4FE' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      color: "#F6F4FE",
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      fontSize: isMobile ? '0.875rem' : '1rem',
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: '#F6F4FE',
                      '&.Mui-focused': {
                        color: '#F6F4FE',
                      },
                      fontSize: isMobile ? '0.875rem' : '1rem',
                    },
                  }}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="gender-label" sx={{ color: '#F6F4FE', fontSize: isMobile ? '0.875rem' : '1rem' }}>
                  Gender
                </InputLabel>
                <Select
                  labelId="gender-label"
                  id="sex"
                  name="sex"
                  required
                  value={formData.sex}
                  label="Gender"
                  onChange={handleChange}
                  disabled={isLoading}
                  startAdornment={
                    <InputAdornment position="start">
                      <FaTransgender style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  }
                  sx={{
                    color: '#F6F4FE',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777280',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777280',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777280',
                    },
                    '& .MuiSelect-select': {
                      paddingRight: '24px !important',
                    },
                    "& .MuiSelect-icon": { color: "#F6F4FE" },
                    fontSize: isMobile ? '0.875rem' : '1rem',
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
                      color: '#F6F4FE',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#777280',
                      },
                      fontSize: isMobile ? '0.875rem' : '1rem',
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: '#F6F4FE',
                      '&.Mui-focused': {
                        color: '#F6F4FE',
                      },
                      fontSize: isMobile ? '0.875rem' : '1rem',
                    },
                  }}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                id="birthDate"              
                options={(() => {
                  const options = [];
                  for (const month of months) {
                    const daysInMonth = getDaysInMonth(month.value);
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dayFormatted = day.toString().padStart(2, '0');
                      options.push({
                        value: `${month.value}-${dayFormatted}`,
                        label: `${month.name} ${dayFormatted}`,
                        monthName: month.name,
                        day: day,
                      });
                    }
                  }
                  return options;
                })()}
                getOptionLabel={(option) => option.label}
                value={
                  formData.birthMonth && formData.birthDay
                    ? {
                        value: `${formData.birthMonth}-${formData.birthDay}`,
                        label: `${
                          months.find((m) => m.value === formData.birthMonth)?.name || ''
                        } ${formData.birthDay}`,
                        monthName: months.find((m) => m.value === formData.birthMonth)?.name || '',
                        day: Number(formData.birthDay),
                      }
                    : null
                }
                isOptionEqualToValue={(option, value) => option.value === value?.value}
                onChange={(_event, newValue) => {
                  if (newValue) {
                    const [month, day] = newValue.value.split('-');
                    handleChange({ target: { name: 'birthMonth', value: month } });
                    handleChange({ target: { name: 'birthDay', value: day } });
                  } else {
                    handleChange({ target: { name: 'birthMonth', value: '' } });
                    handleChange({ target: { name: 'birthDay', value: '' } });
                  }
                }}
                filterOptions={(options, state) => {
                  const input = state.inputValue.toLowerCase();
                  return options.filter(
                    (option) =>
                      option.monthName.toLowerCase().includes(input) ||
                      option.day.toString().padStart(2, '0').includes(input) ||
                      option.label.toLowerCase().includes(input)
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={option.value} {...otherProps}>
                      {option.label}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Date of Birth *"
                    required
                    variant="outlined"                    
                    InputLabelProps={{
                      sx: {
                        color: '#F6F4FE',
                        '&.Mui-focused': {
                          color: '#F6F4FE',
                        },
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        transform: params.inputProps.value ? 'translate(14px, -9px) scale(0.75)' : undefined,
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start" sx={{ paddingLeft: 2 }}>
                          <BsCalendarDate style={{ color: '#F6F4FE' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        '& input': { paddingLeft: '8px !important' },
                        color: '#F6F4FE',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#777280',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#777280',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#777280',
                        },
                        "& .MuiAutocomplete-popupIndicator": { color: "#F6F4FE" } 
                      },
                    }}
                  />
                )}
                disabled={isLoading}
                size="medium"
                sx={{ '& .MuiAutocomplete-inputRoot': { paddingLeft: '6px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="timer-label" sx={{ color: '#F6F4FE', fontSize: isMobile ? '0.875rem' : '1rem' }}>
                  Attendance Duration
                </InputLabel>
                <Select
                  labelId="timer-label"
                  id="timer"
                  name="timer"
                  value={formData.timer || ""}
                  label="Attendance Duration"
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <FiClock style={{ color: '#F6F4FE' }} />
                    </InputAdornment>
                  }
                  sx={{
                    color: '#F6F4FE',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777280',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777280',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777280',
                    },
                    '& .MuiSelect-select': {
                      paddingRight: '24px !important',
                    },
                    "& .MuiSelect-icon": { color: "#F6F4FE" },
                    fontSize: isMobile ? '0.875rem' : '1rem',
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

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'end',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'flex-end' },
              width: '100%',
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
                backgroundColor: '#F6F4FE',
                px: { xs: 5, sm: 5 },
                borderRadius: 50,
                fontWeight: 'semibold',
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1rem' },
                color: '#2C2C2C',
                '&:hover': {
                  backgroundColor: '#F6F4FE',
                  opacity: 0.9,
                },
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 1, sm: 2 },
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <UploadNewcomersDialog
        open={openUpload}
        onClose={()=>{setOpenUpload(false)}}
        onSuccess={()=>{setOpenUpload(false)}}
        eventId={eventId}
      />  
    </Dialog>
  );
};

export default RegistrationModal;


