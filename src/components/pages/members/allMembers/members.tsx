import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
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
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  Tooltip,
  Autocomplete,
  Dialog,
  DialogContent,
  IconButton,
  DialogTitle,
} from "@mui/material";
import { BsPerson, BsCalendar, BsGeoAlt } from "react-icons/bs";
import { IoCallOutline } from "react-icons/io5";
import { SelectChangeEvent } from '@mui/material/Select';
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";
import { Close } from "@mui/icons-material";
import { PiDownload } from "react-icons/pi";

// Interfaces
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
  departmentIds: string[];
  unitIds: string[];
  comments: string;
  branchId: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  type?: string;
}

interface Countries {
  iso2: string;
  name: string;
  flag: string;
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
}

interface State {
  name: string;
}

interface MemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Constants
const ageRanges = [
  { label: "0-11", from: 0, to: 11 },
  { label: "12-18", from: 12, to: 18 },
  { label: "19-25", from: 19, to: 25 },
  { label: "26-35", from: 26, to: 35 },
  { label: "36-45", from: 36, to: 45 },
  { label: "46-55", from: 46, to: 55 },
  { label: "56+", from: 56, to: null },
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

const steps = ['Basic Information', 'Additional Details'];

const MemberModal: React.FC<MemberModalProps> = ({ open, onClose, onSuccess }) => {
  usePageToast("member-modal");
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // State Management
  const [currentStep, setCurrentStep] = useState(0);
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
    departmentIds: [],
    unitIds: [],
    comments: "",
    branchId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [downLoading, setDownLoading] = useState(false);
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [countries, setCountries] = useState<Countries[]>([]);
  const [isFetchingCountries, setIsFetchingCountries] = useState(false);
  const [hasFetchedCountries, setHasFetchedCountries] = useState(false);
  const [departmentUnits, setDepartmentUnits] = useState<{ [deptId: string]: Unit[] }>({});
  const [hasFetchedBranches, setHasFetchedBranches] = useState(false);
  const [hasFetchedDepartments, setHasFetchedDepartments] = useState(false);
  const [hasFetchedUnits, setHasFetchedUnits] = useState<{ [deptId: string]: boolean }>({});
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState(false);
  const [isFetchingUnits, setIsFetchingUnits] = useState<{ [deptId: string]: boolean }>({});
  const [branchesError, setBranchesError] = useState("");
  const [departmentsError, setDepartmentsError] = useState("");
  const [unitsError, setUnitsError] = useState<{ [deptId: string]: string }>({});
  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // Year started
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1960 + 1 }, (_, i) => 1960 + i);

  // Fetch Branches
  const fetchBranches = useCallback(async () => {
    if (isFetchingBranches || hasFetchedBranches) return;
    setIsFetchingBranches(true);
    setBranchesError('');
    try {
      const response = await Api.get('/church/get-branches');
      setBranches(response.data.branches || []);
      setHasFetchedBranches(true);
    } catch (error: any) {
      setBranchesError('Failed to load branches. Please try again.');
      showPageToast('Failed to load branches. Please try again.', 'error');
    } finally {
      setIsFetchingBranches(false);
    }
  }, [isFetchingBranches, hasFetchedBranches]);

  // Fetch Departments
  const fetchDepartments = useCallback(async (branchId: string) => {
    if (isFetchingDepartments || !branchId) return;
    setIsFetchingDepartments(true);
    setDepartmentsError('');
    setDepartments([]);
    setDepartmentUnits({});
    setHasFetchedUnits({});
    try {
      const response = await Api.get(`/church/get-departments?branchId=${branchId}`);
      setDepartments(response.data.departments || []);
      setHasFetchedDepartments(true);
    } catch (error: any) {
      setDepartmentsError('Failed to load departments. Please try again.');
    } finally {
      setIsFetchingDepartments(false);
    }
  }, [isFetchingDepartments]);

  // Fetch Units
    const fetchUnits = useCallback(async (deptId: string) => {
      // require a selected branch before fetching units
      if (!formData.branchId) return;
      if (hasFetchedUnits[deptId] || isFetchingUnits[deptId]) return;
      setIsFetchingUnits((prev) => ({ ...prev, [deptId]: true }));
      setUnitsError((prev) => ({ ...prev, [deptId]: '' }));
      try {
        const response = await Api.get(`/church/a-department/${deptId}/branch/${formData.branchId}`);
        const units = (response.data.department?.units || []).map((unit: Unit) => ({
          ...unit,
          departmentId: deptId,
        }));
        setDepartmentUnits((prev) => ({ ...prev, [deptId]: units }));
        setHasFetchedUnits((prev) => ({ ...prev, [deptId]: true }));
      } catch (error: any) {
        setUnitsError((prev) => ({ ...prev, [deptId]: 'Failed to load units for this department.' }));
      } finally {
        setIsFetchingUnits((prev) => ({ ...prev, [deptId]: false }));
      }
    }, [hasFetchedUnits, isFetchingUnits, formData.branchId]);

  // Fetch Locations (Countries)
  const fetchLocations = useCallback(async () => {
    if (isFetchingCountries || hasFetchedCountries) return;
    setIsFetchingCountries(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/flag/images');
      const result = await response.json();
      setCountries(result.data || []);
      setHasFetchedCountries(true);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      showPageToast('Failed to load countries. Please try again.', 'error');
    } finally {
      setIsFetchingCountries(false);
    }
  }, [isFetchingCountries, hasFetchedCountries]);

  // Fetch States
  useEffect(() => {
    const fetchStates = async () => {
      if (!formData.nationality) return;
      setLoadingStates(true);
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: formData.nationality }),
        });
        const data = await response.json();
        setStates(data.data?.states || []);
        setFormData((prev) => ({ ...prev, state: '' }));
      } catch (error) {
        console.error('Error fetching states:', error);
        showPageToast('Failed to load states. Please try again.', 'error');
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, [formData.nationality]);

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name?: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === 'branchId' && value) {
        fetchDepartments(value as string);
      }
    }
  };

  const handleAgeRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedAgeRange(value);
    const selectedRange = ageRanges.find((range) => range.label === value);
    if (selectedRange) {
      setFormData((prev) => ({
        ...prev,
        ageFrom: selectedRange.from,
        ageTo: selectedRange.to,
      }));
    }
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string[]>) => {
    const selectedIds = event.target.value as string[];
    setFormData((prev) => ({
      ...prev,
      departmentIds: selectedIds,
      unitIds: [],
    }));
    setDepartmentUnits({});
    setHasFetchedUnits({});
    setUnitsError({});
  };

  const handleUnitChange = (deptId: string) => (event: SelectChangeEvent<string[]>) => {
    const selectedUnitIds = event.target.value as string[];
    const otherUnitIds = formData.unitIds.filter(
      (unitId) => !departmentUnits[deptId]?.some((unit) => unit.id === unitId)
    );
    setFormData((prev) => ({
      ...prev,
      unitIds: [...otherUnitIds, ...selectedUnitIds],
    }));
  };

  const handleDownloadTemplate = async () => {
    setDownLoading(true);
    try {
      const response = await Api.get(`/member/import-template/${authData?.branchId}`, { responseType: "blob" });
      const contentDisposition = response.headers["content-disposition"];
      let filename = "workers-template.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
      }
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showPageToast("Excel template downloaded successfully!", "success");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to download Excel template. Please try again.";
      showPageToast(errorMessage, "error");
    } finally {
      setDownLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (
        !formData.name ||
        !formData.address ||
        !formData.phoneNo ||
        !formData.birthMonth ||
        !formData.birthDay ||
        !formData.state ||
        !formData.nationality ||
        !formData.branchId
      ) {
        throw new Error("Please fill in all required fields");
      }
      const payload = { ...formData, departmentIds: formData.departmentIds };
      const params = new URLSearchParams();
      params.append("churchId", authData?.churchId || "");
      params.append("branchId", formData.branchId);
      if (authData?.role === 'department') {
        params.append("departmentId", authData.department || "");
      };
      await Api.post(`/member/add-member?${params.toString()}`, payload);
      showPageToast("Worker created successfully!", "success");
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
        departmentIds: [],
        unitIds: [],
        comments: "",
        branchId: "",
      });
      setSelectedAgeRange("");
      onSuccess?.();
      setTimeout(() => {
        setCurrentStep(0);
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Error creating worker:", error.response?.data || error.message);
      let errorMessage = "Failed to create worker. Please try again.";
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

  const getDaysInMonth = (month: string): number => {
    const monthNumber = parseInt(month, 10);
    if (monthNumber === 2) return 29; // Simplified for leap year
    return [1, 3, 5, 7, 8, 10, 12].includes(monthNumber) ? 31 : 30;
  };

  // Form Components
  const renderBasicInfo = () => (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>Branch *</InputLabel>
          <Select
            name="branchId"
            value={formData.branchId}
            onChange={handleChange}
            onOpen={() => {
              if (!hasFetchedBranches && !isFetchingBranches) {
                fetchBranches();
              }
            }}
            disabled={isLoading || isFetchingBranches}
            label="Branch *"
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
              "& .MuiSelect-select": { color: "#F6F4FE" },
            }}
          >
            <MenuItem value="" disabled>Select Branch</MenuItem>
            {isFetchingBranches ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
              ))
            )}
          </Select>
          {branchesError && !isFetchingBranches && (
            <Typography variant="body2" color="error" sx={{ mt: 1, display: "flex", alignItems: "center" }}>
              <Box component="span" sx={{ mr: 1 }}>⚠️</Box>
              {branchesError}
            </Typography>
          )}
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Full Name *"
          name="name"
          value={formData.name}
          onChange={handleChange}
          variant="outlined"
          placeholder="Enter full name"
          disabled={isLoading}
          size="medium"
          autoComplete="off"
          InputProps={{
            startAdornment: <InputAdornment position="start"><BsPerson style={{ color: '#F6F4FE' }} /></InputAdornment>,
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            },
          }}
          InputLabelProps={{
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "&.Mui-focused": { color: "#F6F4FE" },
            },
          }}
          required
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>Gender *</InputLabel>
          <Select
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            disabled={isLoading}
            label="Gender *"
            startAdornment={<InputAdornment position="start"><BsPerson style={{ color: "#F6F4FE" }} /></InputAdornment>}
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
              "& .MuiSelect-select": { color: "#F6F4FE" },
            }}
          >
            <MenuItem value="" disabled>Select Gender</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="WhatsApp Number"
          name="whatappNo"
          type="number"
          value={formData.whatappNo}
          onChange={handleChange}
          variant="outlined"
          placeholder="Enter WhatsApp number"
          disabled={isLoading}
          InputProps={{
            startAdornment: <InputAdornment position="start"><IoCallOutline style={{ color: '#F6F4FE' }} /></InputAdornment>,
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            },
          }}
          InputLabelProps={{
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "&.Mui-focused": { color: "#F6F4FE" },
            },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="Phone Number *"
          name="phoneNo"
          type="number"
          value={formData.phoneNo}
          onChange={handleChange}
          variant="outlined"
          placeholder="Enter phone number"
          disabled={isLoading}
          InputProps={{
            startAdornment: <InputAdornment position="start"><IoCallOutline style={{ color: '#F6F4FE' }} /></InputAdornment>,
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            },
          }}
          InputLabelProps={{
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "&.Mui-focused": { color: "#F6F4FE" },
            },
          }}
          required
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>Marital Status *</InputLabel>
          <Select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            disabled={isLoading}
            label="Marital Status *"
            startAdornment={<InputAdornment position="start"><BsPerson style={{ color: "#F6F4FE" }} /></InputAdornment>}
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
              "& .MuiSelect-select": { color: "#F6F4FE" },
            }}
          >
            <MenuItem value="" disabled>Select marital status</MenuItem>
            <MenuItem value="single">Single</MenuItem>
            <MenuItem value="married">Married</MenuItem>
            <MenuItem value="divorced">Divorced</MenuItem>
            <MenuItem value="widowed">Widowed</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>Year of Membership</InputLabel>
          <Select
            name="memberSince"
            value={formData.memberSince}
            onChange={handleChange}
            disabled={isLoading}
            label="Year of Membership"
            startAdornment={<InputAdornment position="start"><BsPerson style={{ color: "#F6F4FE" }} /></InputAdornment>}
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
              "& .MuiSelect-select": { color: "#F6F4FE" },
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
          >
            {years.map((year) => (
              <MenuItem key={String(year)} value={String(year)}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 12 }}>
        <TextField
          fullWidth
          label="Address *"
          name="address"
          value={formData.address}
          onChange={handleChange}
          variant="outlined"
          placeholder="Enter address"
          disabled={isLoading}
          multiline
          rows={3}
          InputProps={{
            startAdornment: <InputAdornment position="start"><BsGeoAlt style={{ color: '#F6F4FE' }} /></InputAdornment>,
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            },
          }}
          InputLabelProps={{
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "&.Mui-focused": { color: "#F6F4FE" },
            },
          }}
        />
      </Grid>
    </Grid>
  );

  const renderAdditionalDetails = () => (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>Age Range</InputLabel>
          <Select
            value={selectedAgeRange}
            onChange={handleAgeRangeChange as any}
            disabled={isLoading}
            label="Age Range"
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
              "& .MuiSelect-select": { color: "#F6F4FE" },
            }}
          >
            <MenuItem value="" disabled>Select age range</MenuItem>
            {ageRanges.map((range) => (
              <MenuItem key={range.label} value={range.label}>{range.label}</MenuItem>
            ))}
          </Select>
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
                  value: `${formData.birthMonth}-${formData.birthDay.toString().padStart(2, '0')}`,
                  label: `${months.find(m => m.value === formData.birthMonth)?.name || ''} ${formData.birthDay.toString().padStart(2, '0')}`,
                  monthName: months.find(m => m.value === formData.birthMonth)?.name || '',
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
            return options.filter(option =>
              option.monthName.toLowerCase().includes(input) ||
              option.day.toString().padStart(2, '0').includes(input) ||
              option.label.toLowerCase().includes(input)
            );
          }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return <li key={option.value} {...otherProps}>{option.label}</li>;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Date of Birth *"
              variant="outlined"
              required
              InputLabelProps={{
                sx: {
                  color: "#F6F4FE",
                  "&.Mui-focused": { color: "#F6F4FE" },
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  transform: params.inputProps.value ? 'translate(14px, -9px) scale(0.75)' : undefined
                },
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start" sx={{ paddingLeft: 2 }}>
                    <BsCalendar style={{ color: "#F6F4FE" }} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  '& input': { paddingLeft: '8px !important' },
                  color: "#F6F4FE",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "& .MuiSelect-icon": { color: "#F6F4FE" },
                },
              }}
            />
          )}
          disabled={isLoading}
          size="medium"
          sx={{ '& .MuiAutocomplete-inputRoot': { paddingLeft: '6px' },
          '& .MuiAutocomplete-popupIndicator': { color: '#F6F4FE' }, // 🎯 dropdown arrow
          '& .MuiSvgIcon-root': { color: '#F6F4FE' }, // fallback for any svg icon
         }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          id="nationality"
          options={countries}
          loading={isFetchingCountries}
          loadingText="Loading..."
          noOptionsText="No options available"
          onOpen={() => {
            if (!hasFetchedCountries && !isFetchingCountries) {
              fetchLocations();
            }
          }}
          getOptionLabel={(option: Countries) => option.name}
          value={countries.find(c => c.name === formData.nationality) || null}
          onChange={(_event, newValue: Countries | null) => {
            handleChange({ target: { name: "nationality", value: newValue?.name || "" } });
          }}
          isOptionEqualToValue={(option, value) => option.name === value?.name}
          filterOptions={(options, state) => {
            return options.filter(option =>
              option.name.toLowerCase().includes(state.inputValue.toLowerCase())
            );
          }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <li key={key} {...otherProps} style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={option.flag}
                  alt={option.iso2}
                  style={{ width: 24, height: 16, marginRight: 8, flexShrink: 0 }}
                />
                <span>{option.name}</span>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Nationality *"
              variant="outlined"
              required
              InputProps={{
                ...params.InputProps,
                sx: {
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  '& input': { paddingLeft: '8px !important' },
                  color: "#F6F4FE",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                },
              }}
              InputLabelProps={{
                sx: {
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  color: "#F6F4FE",
                  "&.Mui-focused": { color: "#F6F4FE" },
                  transform: params.inputProps.value
                    ? 'translate(14px, -9px) scale(0.75)'
                    : undefined,
                },
              }}
            />
          )}
          disabled={isLoading}
          size="medium"
          sx={{
            '& .MuiAutocomplete-inputRoot': { paddingLeft: '6px' },
            '& .MuiAutocomplete-popupIndicator': { color: '#F6F4FE' },
            '& .MuiSvgIcon-root': { color: '#F6F4FE' },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          id="state"
          options={states}
          loading={loadingStates}
          loadingText="Loading states..."
          getOptionLabel={(option: State) => option.name}
          value={states.find(s => s.name === formData.state) || null}
          onChange={(_event, newValue: State | null) => {
            handleChange({ target: { name: "state", value: newValue?.name || "" } });
          }}
          isOptionEqualToValue={(option, value) => option.name === value?.name}
          filterOptions={(options, state) => {
            return options.filter(option => option.name.toLowerCase().includes(state.inputValue.toLowerCase()));
          }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return <li key={key} {...otherProps} style={{ display: 'flex', alignItems: 'center' }}><span>{option.name}</span></li>;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="State *"
              variant="outlined"
              required
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingStates && <CircularProgress color="inherit" size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
                sx: {
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  '& input': { paddingLeft: '8px !important' },
                  color: "#F6F4FE",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "& .MuiSelect-icon": { color: "#F6F4FE" },
                },
              }}
              InputLabelProps={{
                sx: {
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  color: "#F6F4FE",
                  "&.Mui-focused": { color: "#F6F4FE" },
                  transform: params.inputProps.value ? 'translate(14px, -9px) scale(0.75)' : undefined
                }
              }}
            />
          )}
          noOptionsText={!formData.nationality ? "Select a Nationality or Country first" : "No states found"}
          size="medium"
          sx={{ '& .MuiAutocomplete-inputRoot': { paddingLeft: '6px' },
            '& .MuiAutocomplete-popupIndicator': { color: '#F6F4FE' },
            '& .MuiSvgIcon-root': { color: '#F6F4FE' },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="LGA *"
          name="LGA"
          value={formData.LGA}
          onChange={handleChange}
          variant="outlined"
          placeholder="Enter local government area"
          disabled={isLoading}
          InputProps={{
            startAdornment: <InputAdornment position="start"><BsGeoAlt style={{ color: '#F6F4FE' }} /></InputAdornment>,
            sx: {
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
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
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>Departments</InputLabel>
          <Select
            name="departmentIds"
            multiple
            value={formData.departmentIds}
            onChange={handleDepartmentChange}
            onOpen={() => {
              if (!hasFetchedDepartments && !isFetchingDepartments && formData.branchId) {
                fetchDepartments(formData.branchId);
              }
            }}
            disabled={isLoading || isFetchingDepartments || !formData.branchId}
            label="Departments"
            renderValue={(selected) =>
              (selected as string[])
                .map((id) => departments.find((dept) => dept.id === id)?.name || id)
                .join(", ")
            }
            sx={{
              fontSize: isLargeScreen ? '1rem' : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
              "& .MuiSelect-select": { color: "#F6F4FE" },
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
          >
            {isFetchingDepartments ? (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">Loading departments...</Typography>
                </Box>
              </MenuItem>
            ) : departments.length === 0 && hasFetchedDepartments ? (
              <MenuItem disabled><Typography variant="body2">No departments available</Typography></MenuItem>
            ) : (
              departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  <Checkbox
                    checked={formData.departmentIds.includes(dept.id)}
                    sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }}
                  />
                  <ListItemText primary={dept.type ? `${dept.name} - (${dept.type})` : dept.name} />
                </MenuItem>
              ))
            )}
          </Select>
          {departmentsError && !isFetchingDepartments && (
            <Typography variant="body2" color="error" sx={{ mt: 1, display: "flex", alignItems: "center" }}>
              <Box component="span" sx={{ mr: 1 }}>⚠️</Box>
              {departmentsError}
            </Typography>
          )}
        </FormControl>
      </Grid>
      {formData.departmentIds.map((deptId) => (
        <Grid size={{ xs: 12, md: 6 }} key={deptId}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE" }}>
              Units for {departments.find((dept) => dept.id === deptId)?.name || "Department"}
            </InputLabel>
            <Select
              name={`unitIds-${deptId}`}
              multiple
              value={formData.unitIds.filter((unitId) => departmentUnits[deptId]?.some((unit) => unit.id === unitId))}
              onChange={handleUnitChange(deptId)}
              onOpen={() => fetchUnits(deptId)}
              disabled={isLoading || isFetchingUnits[deptId]}
              label={`Units for ${departments.find((dept) => dept.id === deptId)?.name || "Department"}`}
              renderValue={(selected) =>
                (selected as string[])
                  .map((id) => departmentUnits[deptId]?.find((unit) => unit.id === id)?.name || id)
                  .join(", ")
              }
              sx={{
                fontSize: isLargeScreen ? '1rem' : undefined,
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
                "& .MuiSelect-select": { color: "#F6F4FE" },
              }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              {isFetchingUnits[deptId] ? (
                <MenuItem disabled>
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Loading units...</Typography>
                  </Box>
                </MenuItem>
              ) : departmentUnits[deptId]?.length > 0 ? (
                departmentUnits[deptId].map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    <Checkbox
                      checked={formData.unitIds.includes(unit.id)}
                      sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }}
                    />
                    <ListItemText primary={unit.name} secondary={unit.description || "No description"} />
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled><Typography variant="body2">No units available</Typography></MenuItem>
              )}
            </Select>
            {unitsError[deptId] && !isFetchingUnits[deptId] && (
              <Typography variant="body2" color="error" sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Box component="span" sx={{ mr: 1 }}>⚠️</Box>
                {unitsError[deptId]}
              </Typography>
            )}
          </FormControl>
        </Grid>
      ))}
      <Grid size={{ xs: 12, md: 12 }}>
        <TextField
          fullWidth
          label="Comments"
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          variant="outlined"
          placeholder="Enter any additional comments"
          disabled={isLoading}
          multiline
          rows={3}
          InputLabelProps={{
            sx: {
              color: "#F6F4FE",
              "&.Mui-focused": { color: "#F6F4FE" },
              fontSize: isLargeScreen ? "1rem" : undefined,
            },
          }}
          InputProps={{
            sx: {
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              fontSize: isLargeScreen ? "1rem" : undefined,
            },
          }}
        />
      </Grid>
    </Grid>
  );

  // Stepper Navigation
  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep === 0) {
      if (!formData.name || !formData.address || !formData.phoneNo || !formData.sex || !formData.maritalStatus || !formData.branchId) {
        showPageToast("Please fill in all required fields", "error");
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: '#2C2C2C',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h5"}
            fontWeight={600}
            gutterBottom
            sx={{ color: "#F6F4FE", fontSize: isLargeScreen ? "1.5rem" : undefined }}
          >
            Add New Worker
          </Typography>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300"/>
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ py: isMobile ? 1 : 2 }}>
        <Container>
          <Box sx={{ display: "flex", flexDirection: {xs: 'column', md: 'row'}, justifyContent: { xs: "normal", md: 'space-between'}, alignItems: "center", my: 2 }} >
            <Box sx={{ width: { xs: "100%", sm: "75%", md: "40%", mb: 2 }}}>
              <Stepper activeStep={currentStep} alternativeLabel sx={{
                "& .MuiStepLabel-label": {
                  fontSize: "0.75rem",
                  color: "#6B7280",
                  "&.Mui-active": { color: "#F6F4FE !important", fontWeight: "bold" },
                  "&.Mui-completed": { color: "var(--color-primary) !important", fontWeight: "normal" },
                },
                "& .MuiStepIcon-root": {
                  color: "#D1D5DB",
                  "&.Mui-active": { color: "var(--color-primary)" },
                  "&.Mui-completed": { color: "var(--color-primary)" },
                },
                "& .MuiStepIcon-text": { fill: "#FFFFFF" },
              }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            {currentStep === 0 && (
              <Tooltip title="Download Worker Form Template In Excel">
                <Button
                  variant="contained"
                  onClick={handleDownloadTemplate}
                  disabled={downLoading}
                  sx={{
                    py: 1,
                    backgroundColor: "#F6F4FE",
                    px: { xs: 3, sm: 3 },
                    fontWeight: 500,
                    textTransform: "none",
                    color: "#2C2C2C",
                    borderRadius: 50,
                    fontSize: isLargeScreen ? "0.875rem" : { xs: "1rem", sm: "1rem" },
                    "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
                    mt: 2,
                  }}
                >
                  {downLoading ? (
                    <span className="text-gray-300">
                      <CircularProgress size={18} sx={{ mr: 1 , color: '#f6f4fe'}} />
                      Downloading...
                    </span>
                  ) : (
                    <span className="flex gap-1"> Download Template <PiDownload className="mt-1"/>
                    </span>
                  )}
                </Button>
              </Tooltip>
            )}
          </Box>
          {currentStep === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 4 }}>
              {renderBasicInfo()}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  sx={{
                    py: 1,
                    backgroundColor: "#F6F4FE",
                    px: { xs: 5, sm: 3 },
                    borderRadius: 50,
                    fontWeight: "semibold",
                    textTransform: "none",
                    color: "#2C2C2C",
                    fontSize: { xs: "1rem", sm: "1rem" },
                    "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 4 }}>
              {renderAdditionalDetails()}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                  sx={{ py: 1, px: { xs: 2, sm: 2 }, borderRadius: 1, fontWeight: "semibold", textTransform: "none", fontSize: { xs: "1rem", sm: "1rem" } }}
                >
                  Previous
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    py: 1,
                    backgroundColor: "#F6F4FE",
                    px: { xs: 5, sm: 2 },
                    borderRadius: 50,
                    fontWeight: "semibold",
                    color: "#2C2C2C",
                    textTransform: "none",
                    fontSize: { xs: "1rem", sm: "1rem" },
                    "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
                  }}
                >
                  {isLoading ? (
                    <span className="text-gray-500">
                      <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                      Creating...
                    </span>
                  ) : (
                    "Create Worker"
                  )}
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default MemberModal;