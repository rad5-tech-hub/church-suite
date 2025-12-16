import React, { useState, useEffect, useCallback } from "react";
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
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Dialog,
  DialogContent,
  IconButton,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
} from "@mui/material";
import { BsPerson, BsCalendar, BsGeoAlt } from "react-icons/bs";
import { IoCallOutline } from "react-icons/io5";
import { Close } from "@mui/icons-material";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import Api from "../../../shared/api/api";

// Interfaces
interface FormData {
  id: string;
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

interface Countries {
  iso2: string;
  name: string;
  flag: string;
}

interface State {
  name: string;
}

interface EditMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  memberId: string;
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

const EditMemberModal = ({ open, onClose, onSuccess, memberId }: EditMemberModalProps) => {
  usePageToast("edit-member");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // State Management
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    address: '',
    whatappNo: '',
    phoneNo: '',
    sex: '',
    maritalStatus: '',
    memberSince: '',
    ageFrom: null,
    ageTo: null,
    birthMonth: '',
    birthDay: '',
    state: '',
    LGA: '',
    nationality: '',
    departmentIds: [],
    unitIds: [],
    comments: '',
    branchId: '',
  });
  const [initialFormData, setInitialFormData] = useState<FormData>(formData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMember, setIsFetchingMember] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [countries, setCountries] = useState<Countries[]>([]);
  const [isFetchingCountries, setIsFetchingCountries] = useState(false);
  const [hasFetchedCountries, setHasFetchedCountries] = useState(false);
  const [hasFetchedBranches, setHasFetchedBranches] = useState(false);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [lastFetchedNationality, setLastFetchedNationality] = useState<string>('');

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
    } finally {
      setIsFetchingBranches(false);
    }
  }, [isFetchingBranches, hasFetchedBranches]);

  // ✅ Run once on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

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

  // Fetch Member
  const fetchMember = useCallback(async () => {
    if (!memberId) {
      setFetchError("No member ID provided");
      setIsFetchingMember(false);
      return;
    }

    setIsFetchingMember(true);
    setFetchError(null);

    try {
      const response = await Api.get(`/member/a-member/${memberId}`);
      const member = response.data.member;

      if (!member) {
        throw new Error("Member not found");
      }

      const memberData: FormData = {
        id: member.id || "",
        name: member.name || "",
        address: member.address || "",
        whatappNo: member.whatappNo || "",
        phoneNo: member.phoneNo || "",
        sex: member.sex || "",
        maritalStatus: member.maritalStatus || "",
        memberSince: member.memberSince
          ? String(member.memberSince).split("-")[0]
          : "",
        ageFrom: member.ageFrom || null,
        ageTo: member.ageTo || null,
        birthMonth: member.birthMonth || "",
        birthDay: member.birthDay || "",
        state: member.state || "",
        LGA: member.LGA || "",
        nationality: member.nationality || "",
        departmentIds: member.departments?.map((dept: { id: string }) => dept.id) || [],
        unitIds: member.units?.map((unit: { id: string }) => unit.id) || [],
        comments: member.comments || "",
        branchId: member.branchId || "",
      };

      setFormData(memberData);
      setInitialFormData(memberData);

      setSelectedAgeRange(
        ageRanges.find(
          (range) =>
            range.from === memberData.ageFrom && range.to === memberData.ageTo
        )?.label || ""
      );
    } catch (error: any) {
      console.error("Error fetching member:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch member data. Please try again.";
      setFetchError(errorMessage);
    } finally {
      setIsFetchingMember(false);
    }
  }, [memberId, ageRanges]);

  // Fetch when modal opens
  useEffect(() => {
    if (open && memberId) {
      fetchMember();
    }
  }, [open, memberId, fetchMember]);

  // Fetch states when nationality changes
  useEffect(() => {
    if (!formData.nationality || formData.nationality === lastFetchedNationality) return;

    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: formData.nationality }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        const data = await response.json();
        setStates(data.data?.states || []);
        setLastFetchedNationality(formData.nationality);

        if (!data.data?.states.some((s: State) => s.name === formData.state)) {
          setFormData((prev) => ({ ...prev, state: "" }));
        }
      } catch (error: any) {
        console.error("Error fetching states:", error);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [formData.nationality, lastFetchedNationality]);

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name?: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
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
    } else {
      setFormData((prev) => ({
        ...prev,
        ageFrom: null,
        ageTo: null,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
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

      // Determine changed fields
      const changedFields: Partial<FormData> & Record<string, unknown> = {};

      Object.keys(formData).forEach((key) => {
        if (key !== "id" && key !== "activity" && key !== "branch") {
          const k = key as keyof FormData;
          const newValue = formData[k];
          const oldValue = initialFormData[k];

          if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            (changedFields as Record<string, unknown>)[k as string] = newValue;
          }
        }
      });

      // If nothing changed
      if (Object.keys(changedFields).length === 0) {
        showPageToast("No changes detected", "warning");
        setIsLoading(false);
        return;
      }

      // Call API with only changed fields
      await Api.patch(
        `member/edit-member/${formData.id}/branch/${formData.branchId}`,
        changedFields
      );

      showPageToast("Member updated successfully!", "success");

      // Update initial form data to current after success
      setInitialFormData(formData);

      onSuccess?.();
      setTimeout(() => {
        setCurrentStep(0);
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update Member. Please try again.";
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

  // Loading State UI
  if (isFetchingMember) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            bgcolor: "#2C2C2C",
            py: 3,
            px: 2,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight={600} sx={{ color: "#F6F4FE" }}>
              Edit Member
            </Typography>
            <IconButton onClick={onClose}>
              <Close className="text-gray-300" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#F6F4FE" }} />
            <Typography sx={{ ml: 2, color: "#F6F4FE" }}>Loading Member data...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Error State UI
  if (fetchError) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            bgcolor: "#2C2C2C",
            py: 3,
            px: 2,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight={600} sx={{ color: "#F6F4FE" }}>
              Edit Worker
            </Typography>
            <IconButton onClick={onClose}>
              <Close className="text-gray-300" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error">{fetchError}</Typography>
            <Button
              variant="contained"
              onClick={fetchMember}
              sx={{ mt: 2, backgroundColor: "#F6F4FE", color: "#2C2C2C" }}
              disabled={isFetchingMember}
            >
              Retry
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

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
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
                  <Typography variant="body2">Loading branches...</Typography>
                </Box>
              </MenuItem>
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
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  color: "#F6F4FE",
                  "&.Mui-focused": { color: "#F6F4FE" },
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
          sx={{
            '& .MuiAutocomplete-inputRoot': { paddingLeft: '6px' },
            '& .MuiAutocomplete-popupIndicator': { color: '#F6F4FE' },
            '& .MuiSvgIcon-root': { color: '#F6F4FE' },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          loading={isFetchingCountries} // ✅ tell Autocomplete we're loading
          loadingText="Loading..." // ✅ text to show while fetching
          noOptionsText="No options available" // ✅ fallback after loading is done
          id="nationality"
          options={countries}
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
            return options.filter(option => option.name.toLowerCase().includes(state.inputValue.toLowerCase()));
          }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <li key={key} {...otherProps} style={{ display: 'flex', alignItems: 'center' }}>
                <img src={option.flag} alt={option.iso2} style={{ width: 24, height: 16, marginRight: 8, flexShrink: 0 }} />
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
                endAdornment: (
                  <>
                    {isFetchingCountries && <CircularProgress color="inherit" size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
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
                  transform: params.inputProps.value ? 'translate(14px, -9px) scale(0.75)' : undefined
                }
              }}
            />
          )}
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
          sx={{
            '& .MuiAutocomplete-inputRoot': { paddingLeft: '6px' },
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
  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!formData.name || !formData.address || !formData.phoneNo || !formData.sex || !formData.maritalStatus || !formData.branchId) {
        showPageToast("Please fill in all required fields", "error");
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

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
            Edit Member
          </Typography>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300"/>
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ py: isMobile ? 1 : 2 }}>
        <Container>
          <Box sx={{ display: "flex", flexDirection: {xs: 'column', md: 'row'}, justifyContent: { xs: "normal", md: 'space-between'}, alignItems: "center", my: 2 }}>
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
          </Box>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 4 }}>
            {currentStep === 0 ? renderBasicInfo() : renderAdditionalDetails()}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
              {currentStep === 1 ? (
                <Button
                  variant="outlined"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                  sx={{ py: 1, px: { xs: 2, sm: 2 }, borderRadius: 1, fontWeight: "semibold", textTransform: "none", fontSize: { xs: "1rem", sm: "1rem" } }}
                >
                  Previous
                </Button>
              ) : <div />}
              {currentStep === 0 ? (
                <Button
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={isLoading || isFetchingMember}
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
              ) : (
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
                      Updating...
                    </span>
                  ) : (
                    "Update Member"
                  )}
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberModal;