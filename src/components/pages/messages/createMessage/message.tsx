import React, { useCallback, useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider,
  InputLabel,
  InputAdornment,
  TextField,
  FormControlLabel as CheckboxFormControlLabel,  
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaPeopleCarry } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { LocalizationProvider, DateTimePicker, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import dayjs from "dayjs";
import { CiWallet } from "react-icons/ci";

interface FormData {
  type: string;
  programs: string;
  newcomers: string[];
  workers: string[];
  departments: string;
  categories: string[];
  subject: string;
  message: string;
  walletId: string;
  scheduledDateTime?: string;
}

interface Event {
  id: string;
  title: string;
  occurrenceDate?: string;
  occurrences: {
    id: string;
    date: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

interface Department {
  id: string;
  name: string;
}

interface Newcomer {
  id: string;
  name: string;
  phoneNo: string;
}

interface Worker {
  id: string;
  name: string;
  phoneNo: string;
}

interface State {
  events: Event[];
  selectedEventIds: string[];
  eventsLoading: boolean;
  dateDialogOpen: boolean;
  selectedDate: Dayjs | null;
  newcomers: Newcomer[];
  newcomersLoading: boolean;
  departments: Department[];
  departmentsLoading: boolean;
  workers: Worker[];
  wallets: any[];
  walletLoading: boolean;
  walletError: string | null;
  workersLoading: boolean;
  isScheduleChecked: boolean; // New state for checkbox
}

interface DatePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onDateSelect: (date: Dayjs | null) => void;
  onDateApply: () => void;
}

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: FormData; // Added for resend functionality
}

interface RenderAudienceTypeProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string | string[] } },
    _child?: React.ReactNode
  ) => void;
  isLoading: boolean;
}

const DatePickerDialog: React.FC<DatePickerDialogProps> = ({
  open,
  onClose,
  onDateSelect,
  onDateApply,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs">
    <DialogTitle>Select Date</DialogTitle>
    <DialogContent>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          onChange={onDateSelect}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: "outlined",
              placeholder: "Select a date",
            },
          }}
        />
      </LocalizationProvider>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onDateApply} variant="contained">
        Apply
      </Button>
    </DialogActions>
  </Dialog>
);

const RenderAudienceType: React.FC<RenderAudienceTypeProps> = ({
  formData,
  setFormData,
  handleChange,
  isLoading,
}) => (
  <Grid size={{ xs: 12 }}>
    <FormLabel id="program-type-label" sx={{ fontSize: "0.9rem", color: "#F6F4FE" }}>
      Audience Type
    </FormLabel>
    <RadioGroup
      row
      sx={{ display: "flex", justifyContent: "space-around", mt: 1, color: "#F6F4FE" }}
      aria-labelledby="program-type-label"
      name="type"
      value={formData.type}
      onChange={(e) => {
        handleChange(e);
        setFormData((prev) => ({
          ...prev,
          programs: "",
          newcomers: [],
          workers: [],
          departments: "",
          categories: [],
        }));
      }}
    >
      {[
        {
          value: "newcomers",
          label: "Newcomers",
          icon: <FaPeopleGroup fontSize="25" color="#F6F4FE" />,
        },
        {
          value: "workers",
          label: "Workers",
          icon: <FaPeopleCarry fontSize="25" color="#F6F4FE" />,
        },
        // {
        //   value: "members",
        //   label: "Members",
        //   icon: <FaPeopleGroup fontSize="25" color="#F6F4FE" />,
        // },
      ].map(({ value, label, icon }) => (
        <FormControlLabel
          key={value}
          value={value}
          disabled={isLoading}
          control={
            <Radio sx={{ ml: 2, color: "#F6F4FE", "&.Mui-checked": { color: "#F6F4FE" } }} />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {icon}
              <Typography sx={{ ml: 1, color: "#F6F4FE" }}>{label}</Typography>
            </Box>
          }
          labelPlacement="start"
          sx={{
            border: "0.5px solid gray",
            flexDirection: "row-reverse",
            gap: 1,
            padding: "4px 8px",
            mb: 2,
            backgroundColor: formData.type === value ? "rgba(255, 255, 255, 0.15)" : "transparent",
            borderRadius: 1,
          }}
        />
      ))}
    </RadioGroup>
  </Grid>
);

const MessageModal: React.FC<MessageModalProps> = ({ open, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState<FormData>(
    initialData || {
      type: "newcomers",
      programs: "",
      newcomers: [],
      workers: [],
      departments: "",
      categories: [], 
      subject: "",
      message: "",
      walletId: "",
      scheduledDateTime: undefined,
    }
  );
  const [state, setState] = useState<State>({
    events: [],
    selectedEventIds: [],
    eventsLoading: false,
    dateDialogOpen: false,
    selectedDate: null,
    newcomers: [],
    newcomersLoading: false,
    departments: [],
    departmentsLoading: false,
    walletLoading: false,
    wallets: [],
    walletError: null,
    workers: [],
    workersLoading: false,
    isScheduleChecked: false, // Initialize checkbox state
  });
  const [isLoading, setLoading] = useState(false);
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const categoryOptions = ["men", "women", "children"];
  usePageToast("createMessages");

  useEffect(() => {
    if (initialData && open) {
      setFormData(initialData);
      setState((prev) => ({
        ...prev,
        isScheduleChecked: !!initialData.scheduledDateTime, // Check if scheduledDateTime exists
      }));
    }
  }, [initialData, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string | string[] } },
    _child?: React.ReactNode
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateChange = useCallback(
    <K extends keyof State>(key: K, value: State[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetForm = () => {
    setFormData({
      type: "newcomers",
      programs: "",
      newcomers: [],
      workers: [],
      departments: "",
      categories: [],
      subject: "",
      message: "",
      walletId: "",
      scheduledDateTime: undefined,
    });
    setState({
      events: [],
      selectedEventIds: [],
      eventsLoading: false,
      dateDialogOpen: false,
      selectedDate: null,
      newcomers: [],
      newcomersLoading: false,
      departments: [],
      departmentsLoading: false,
      walletError: null,
      walletLoading: false,
      wallets: [],
      workers: [],
      workersLoading: false,
      isScheduleChecked: false,
    });
  };

  const fetchEvents = useCallback(
    async (date: Dayjs | null = null) => {
      if (!authData?.branchId) {
        showPageToast("Missing branch information. Please try again.", "error");
        return;
      }
      handleStateChange("eventsLoading", true);
      try {
        const params = new URLSearchParams({ branchId: authData.branchId });
        if (authData?.role === "department" && authData.department) {
          params.append("departmentId", authData.department);
        }
        if (date) {
          params.append("date", date.format("YYYY-MM-DD"));
        }
        const response = await Api.get<{ events: Event[] }>(`/church/get-events?${params.toString()}`);
        handleStateChange("events", response.data?.events || []);
        handleStateChange("selectedEventIds", []);
      } catch (error) {
        showPageToast("Failed to load events. Please try again.", "error");
        handleStateChange("events", []);
      } finally {
        handleStateChange("eventsLoading", false);
      }
    },
    [handleStateChange, authData]
  );

  const fetchNewcomers = useCallback(
    async (eventOccurrenceId: string = "") => {
      if (!authData?.branchId) {
        showPageToast("Missing branch information. Please try again.", "error");
        return;
      }
      handleStateChange("newcomersLoading", true);
      try {
        const params = new URLSearchParams({ branchId: authData.branchId });
        if (eventOccurrenceId) {
          params.append("eventOccurrenceId", eventOccurrenceId);
        }
        const response = await Api.get<{ results: Newcomer[] }>(`/member/get-follow-up?${params.toString()}`);
        const newcomers = response.data?.results || [];
        handleStateChange("newcomers", newcomers);
        setFormData((prev) => ({
          ...prev,
          newcomers: prev.newcomers.filter((id) => newcomers.some((n) => n.id === id)),
        }));
      } catch (error) {
        showPageToast("Failed to load newcomers. Please try again.", "error");
        handleStateChange("newcomers", []);
        setFormData((prev) => ({ ...prev, newcomers: [] }));
      } finally {
        handleStateChange("newcomersLoading", false);
      }
    },
    [handleStateChange, authData]
  );

  // Fetch workers (no department required)
  const fetchWorkers = useCallback(async (departmentId: string = "") => {
    if (!authData?.branchId) {
      showPageToast("Missing branch information. Please try again.", "error");
      return;
    }
    handleStateChange("workersLoading", true);
    try {
      const params = new URLSearchParams({ branchId: authData.branchId });
      const dept = departmentId || authData?.department;
      if (dept) params.append("departmentId", dept);

      const response = await Api.get<{ data: Worker[] }>(
        `/member/all-members?${params.toString()}`
      );

      const workers = (response.data?.data || []).map((w) => ({
        id: w.id,
        name: w.name,
        phoneNo: w.phoneNo,
      }));

      handleStateChange("workers", workers);
      setFormData((prev) => ({
        ...prev,
        workers: prev.workers.filter((id) => workers.some((w) => w.id === id)),
      }));
    } catch {
      showPageToast("Failed to load workers. Please try again.", "error");
      handleStateChange("workers", []);
      setFormData((prev) => ({ ...prev, workers: [] }));
    } finally {
      handleStateChange("workersLoading", false);
    }
  }, [handleStateChange, authData]);

  const fetchDepartments = useCallback(async () => {
    if (!authData?.branchId) {
      showPageToast("Missing branch information. Please try again.", "error");
      return;
    }
    handleStateChange("departmentsLoading", true);
    try {
      const params = new URLSearchParams({ branchId: authData.branchId });
      const response = await Api.get<{ departments: Department[] }>(
        `/church/get-departments?${params.toString()}`
      );
      handleStateChange("departments", response.data?.departments || []);
    } catch (error) {
      showPageToast("Failed to load departments. Please try again.", "error");
      handleStateChange("departments", []);
    } finally {
      handleStateChange("departmentsLoading", false);
    }
  }, [handleStateChange, authData]);

  const fetchWallet = useCallback(async () => {
    handleStateChange("walletLoading", true);
    try {
      const response = await Api.get(`/wallet/my-wallet`);
      handleStateChange("wallets", response.data?.wallets || []);
    } catch (error) {
      handleStateChange("walletError", "Failed to load wallets. Please try again.");
      handleStateChange("wallets", []);
    } finally {
      handleStateChange("walletLoading", false);
    }
  }, [handleStateChange]);

  // 🔹 Fetch workers immediately when modal opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchWallet();
      fetchWorkers(); // ✅ Fetch all workers immediately
      if (formData.type === "newcomers" && formData.programs) fetchNewcomers(formData.programs);
    }
  }, [open, fetchDepartments, fetchNewcomers, fetchWorkers, formData.type, formData.programs]);

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.message) {
        showPageToast("Message is required.", "error");
        setLoading(false);
        return;
      }
  
      if (formData.type === "newcomers" && formData.newcomers.length === 0) {
        showPageToast("Please select at least one newcomer.", "error");
        setLoading(false);
        return;
      }
      if (formData.type === "workers" && formData.workers.length === 0) {
        showPageToast("Please select at least one worker.", "error");
        setLoading(false);
        return;
      }

      const recipients = formData.type === "newcomers" ? state.newcomers : state.workers;
      const selectedIds = formData.type === "newcomers" ? formData.newcomers : formData.workers; 

      if (!recipients.length) {
        showPageToast(`No ${formData.type} available. Please try refreshing the list.`, "error");
        setLoading(false);
        return;
      }

      if (!selectedIds.length) {
        showPageToast(`No ${formData.type} selected. Please select at least one recipient.`, "error");
        setLoading(false);
        return;
      }

      const toNumbers = recipients
        .filter((recipient) => {
          const isSelected = selectedIds.includes(recipient.id);       
          return isSelected;
        })
        .map((recipient) => {           
          let phoneNo = recipient.phoneNo;
          if (phoneNo) {
            phoneNo = `${phoneNo}`;
          }
          return phoneNo;
        })

      if (toNumbers.length === 0) {
        showPageToast(
          "No valid phone numbers found. Ensure selected recipients have valid phone numbers starting with '+'.",
          "error"
        );
        setLoading(false);
        return;
      }

      const payload = {
        message: formData.message,
        walletId: formData.walletId,
        toNumbers,
        channel: "generic",
        ...(formData.type === "newcomers" && { followUpIds: formData.newcomers }),
        ...(formData.scheduledDateTime && { sendAt: formData.scheduledDateTime }),
      };

      await Api.post("/wallet/send-sms", payload);      
      showPageToast("Message sent successfully!", "success");
      onSuccess?.();
      setTimeout(handleModalClose, 4000);
    } catch (error: any) {
      let errorMessages = error.response?.data?.error?.message;      
      showPageToast(
        errorMessages || "Failed to send message. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgramType = () => (
    <Grid size={{ xs: 12, md: 6 }}>
      <InputLabel id="program-type-label" sx={{ color: "#F6F4FE", fontSize: "0.9rem", mb: 1 }}>
        Program Type
      </InputLabel>
      <Select
        fullWidth
        value={formData.programs}
        onChange={(e) => {
          handleChange({ target: { name: "programs", value: e.target.value as string } });
          fetchNewcomers(e.target.value as string);
        }}
        name="programs"
        onOpen={() => fetchEvents(state.selectedDate)}
        displayEmpty
        disabled={!authData?.branchId || isLoading}
        sx={{
          fontSize: isLargeScreen ? "1rem" : undefined,
          color: "#F6F4FE",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "& .MuiSelect-select": { borderColor: "#777280", color: "#F6F4FE" },
          "& .MuiSelect-icon": { color: "#F6F4FE" },
        }}
        renderValue={(selected) => {
          if (!selected) return "Select Program";
          const allOccurrences = state.events.flatMap((event) =>
            event.occurrences.map((occ) => ({ ...occ, eventTitle: event.title }))
          );
          const selectedOccurrence = allOccurrences.find((occ) => occ.id === selected);
          return selectedOccurrence
            ? `${selectedOccurrence.eventTitle} (${selectedOccurrence.startTime} - ${selectedOccurrence.endTime})`
            : "Select Program";
        }}
      >
        {state.eventsLoading ? (
          <MenuItem disabled>Loading...</MenuItem>
        ) : (
          <>          
            <MenuItem value=''>
              None
            </MenuItem>
            {state.events.flatMap((event) =>
              event.occurrences.map((occurrence) => {
                const start = new Date(`1970-01-01T${occurrence.startTime}`);
                const end = new Date(`1970-01-01T${occurrence.endTime}`);
                const formattedStart = start.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                const formattedEnd = end.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <MenuItem key={occurrence.id} value={occurrence.id}>
                    <ListItemText primary={`${event.title} (${formattedStart} - ${formattedEnd})`} />
                  </MenuItem>
                );
              })
            )}
          </>
        )}
        <Divider />
        <MenuItem onClick={() => handleStateChange("dateDialogOpen", true)}>
          {state.selectedDate ? `Selected Date: ${state.selectedDate.format("MMMM D, YYYY")}` : "Select Date"}
        </MenuItem>
      </Select>
    </Grid>
  );

  const renderCheckNewcomers = () => {
    const allSelected =
      state.newcomers.length > 0 &&
      formData.newcomers.length === state.newcomers.length;

    const handleToggle = (id: string) => {
      setFormData((prev) => {
        const selected = prev.newcomers.includes(id)
          ? prev.newcomers.filter((x) => x !== id)
          : [...prev.newcomers, id];
        return { ...prev, newcomers: selected };
      });
    };

    const handleSelectAll = () => {
      setFormData((prev) => ({
        ...prev,
        newcomers: allSelected ? [] : state.newcomers.map((n) => n.id),
      }));
    };

    return (
      <Grid size={{ xs: 12, md: 6 }}>
        <InputLabel sx={{ color: "#F6F4FE", fontSize: "0.9rem", mb: 1 }}>
          Check Newcomers
        </InputLabel>
        <Select
          fullWidth
          multiple
          value={formData.newcomers}
          name="newcomers"
          renderValue={(selected) =>
            selected.length === 0
              ? "Select Newcomers"
              : state.newcomers
                  .filter((n) => selected.includes(n.id))
                  .map((n) => n.name)
                  .join(", ")
          }
          sx={{
            color: "#F6F4FE",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            "& .MuiSelect-icon": { color: "#F6F4FE" },
          }}
        >
          {state.newcomersLoading ? (
            <MenuItem disabled>Loading...</MenuItem>
          ) : (
            <>
              <MenuItem
                value="__none"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    newcomers: [], // Reset all selections
                  }))
                }
              >
                <ListItemText primary="None" />
              </MenuItem>
              <MenuItem onClick={handleSelectAll}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={
                    formData.newcomers.length > 0 &&
                    formData.newcomers.length < state.newcomers.length
                  }
                  color="default"
                />
                <ListItemText primary="Select All" />
              </MenuItem>
              {state.newcomers.map((n) => (
                <MenuItem
                  key={n.id}
                  value={n.id}
                  onClick={() => handleToggle(n.id)}
                >
                  <Checkbox
                    checked={formData.newcomers.includes(n.id)}
                    color="default"
                  />
                  <ListItemText
                    primary={`${n.name} (${n.phoneNo || "No phone"})`}
                  />
                </MenuItem>
              ))}
            </>
          )}
        </Select>
      </Grid>
    );
  };

  const renderCheckWorkers = () => {
    const allSelected =
      state.workers.length > 0 &&
      formData.workers.length === state.workers.length;

    const handleToggle = (id: string) => {
      setFormData((prev) => {
        const selected = prev.workers.includes(id)
          ? prev.workers.filter((x) => x !== id)
          : [...prev.workers, id];
        return { ...prev, workers: selected };
      });
    };

    const handleSelectAll = () => {
      setFormData((prev) => ({
        ...prev,
        workers: allSelected ? [] : state.workers.map((w) => w.id),
      }));
    };

    return (
      <Grid size={{ xs: 12, md: 6 }}>
        <InputLabel sx={{ color: "#F6F4FE", fontSize: "0.9rem", mb: 1 }}>
          Check Workers
        </InputLabel>
        <Select
          fullWidth
          multiple
          value={formData.workers}
          name="workers"
          renderValue={(selected) =>
            selected.length === 0
              ? "Select Workers"
              : state.workers
                  .filter((w) => selected.includes(w.id))
                  .map((w) => w.name)
                  .join(", ")
          }
          sx={{
            color: "#F6F4FE",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            "& .MuiSelect-icon": { color: "#F6F4FE" },
          }}
        >
          {state.workersLoading ? (
            <MenuItem disabled>Loading...</MenuItem>
          ) : (
            <>
              <MenuItem
                value="__none"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    workers: [], // Reset all selections
                  }))
                }
              >
                <ListItemText primary="None" />
              </MenuItem>
              <MenuItem onClick={handleSelectAll}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={
                    formData.workers.length > 0 &&
                    formData.workers.length < state.workers.length
                  }
                  color="default"
                />
                <ListItemText primary="Select All" />
              </MenuItem>
              {state.workers.map((w) => (
                <MenuItem
                  key={w.id}
                  value={w.id}
                  onClick={() => handleToggle(w.id)}
                >
                  <Checkbox
                    checked={formData.workers.includes(w.id)}
                    color="default"
                  />
                  <ListItemText
                    primary={`${w.name} (${w.phoneNo || "No phone"})`}
                  />
                </MenuItem>
              ))}
            </>
          )}
        </Select>
      </Grid>
    );
  };

  const renderDepartments = () => (
    <Grid size={{ xs: 12, md: 6 }}>
      <InputLabel id="departments-label" sx={{ color: "#F6F4FE", fontSize: "0.9rem", mb: 1 }}>
        Department
      </InputLabel>
      <Select
        fullWidth
        labelId="departments-label"
        value={formData.departments}
        onChange={(e) => {
          handleChange({ target: { name: "departments", value: e.target.value as string } });
          fetchWorkers(e.target.value as string);
        }}
        name="departments"
        disabled={isLoading}
        startAdornment={
          <InputAdornment position="start">
            <FiClock style={{ color: "#F6F4FE" }} />
          </InputAdornment>
        }
        sx={{
          color: "#F6F4FE",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "& .MuiSelect-select": { paddingRight: "24px !important" },
          "& .MuiSelect-icon": { color: "#F6F4FE" },
          fontSize: "0.875rem",
        }}
        renderValue={(selected) =>
          selected
            ? state.departments.find((dept) => dept.id === selected)?.name || "Select Department"
            : "Select Department"
        }
      >
        {state.departmentsLoading ? (
          <MenuItem disabled>Loading...</MenuItem>
        ) : state.departments.length === 0 ? (
          <MenuItem disabled>No departments available</MenuItem>
        ) : (
          state.departments.map((dept) => (
            <MenuItem key={dept.id} value={dept.id}>
              <ListItemText primary={dept.name} />
            </MenuItem>
          ))
        )}
      </Select>
    </Grid>
  );

  const renderWallet = () => (
    <Grid size={{ xs: 12}}>
      <InputLabel id="wallet-label" sx={{ color: "#F6F4FE", fontSize: "0.9rem", mb: 1 }}>
       Select Wallet
      </InputLabel>

      <Select
        fullWidth
        labelId="wallet-label"
        name="walletId"
        value={formData.walletId}
        onChange={(e) =>
          handleChange({
            target: { name: "walletId", value: e.target.value as string },
          })
        }
        disabled={state.walletLoading}
        startAdornment={
          <InputAdornment position="start">
            <CiWallet style={{ color: "#F6F4FE" }} />
          </InputAdornment>
        }
        sx={{
          color: "#F6F4FE",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "& .MuiSelect-select": { paddingRight: "24px !important" },
          "& .MuiSelect-icon": { color: "#F6F4FE" },
          fontSize: "0.875rem",
        }}
        renderValue={(selected) => {
          if (!selected) return "Select Wallet";

          const wallet = state.wallets.find((w) => w.id === selected);
          if (!wallet) return "Select Wallet";

          return (
            wallet.deptWallet?.name || 
            wallet.branchWallet?.name || 
            "Unnamed Wallet"
          );
        }}
      >
        {state.walletLoading ? (
          <MenuItem disabled>Loading...</MenuItem>
        ) : state.wallets.length === 0 ? (
          <MenuItem disabled>No Wallet Found</MenuItem>
        ) : (
          state.wallets.map((wallet) => (
            <MenuItem key={wallet.id} value={wallet.id}>
              <ListItemText
                primary={
                  wallet.deptWallet?.name ||
                  wallet.branchWallet?.name ||
                  "Unnamed Wallet"
                }
                secondary={`Balance: ₦${Number(wallet.balance).toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                })}`}
              />
            </MenuItem>
          ))
        )}
      </Select>
    </Grid>
  );

  const renderCategories = () => (
    <Grid size={{ xs: 12, md: 12 }}>
      <InputLabel id="categories-label" sx={{ color: "#F6F4FE", fontSize: "0.9rem", mb: 1 }}>
        Category
      </InputLabel>
      <Select
        fullWidth
        multiple
        value={formData.categories}
        onChange={(e) => {
          const value = e.target.value as string[];
          if (value.includes("All")) {
            setFormData((prev) => ({
              ...prev,
              categories: formData.categories.length === categoryOptions.length ? [] : categoryOptions,
            }));
          } else {
            setFormData((prev) => ({ ...prev, categories: value }));
          }
        }}
        name="categories"
        disabled={isLoading}
        sx={{
          color: "#F6F4FE",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          "& .MuiSelect-select": { paddingRight: "24px !important" },
          "& .MuiSelect-icon": { color: "#F6F4FE" },
          fontSize: "0.875rem",
        }}
        renderValue={(selected) => (selected.length === 0 ? "Select Category" : selected.join(", "))}
      >
        <MenuItem value="All">
          <Checkbox
            checked={formData.categories.length === categoryOptions.length}
            indeterminate={formData.categories.length > 0 && formData.categories.length < categoryOptions.length}
            sx={{ color: "#777280", "&.Mui-checked": { color: "#2c2c2c" }, "& svg": { fontSize: 18 } }}
          />
          <ListItemText primary="All" />
        </MenuItem>
        {categoryOptions.map((category) => (
          <MenuItem key={category} value={category}>
            <Checkbox
              checked={formData.categories.includes(category)}
              sx={{ color: "#777280", "&.Mui-checked": { color: "#2c2c2c" }, "& svg": { fontSize: 18 } }}
            />
            <ListItemText primary={category.charAt(0).toUpperCase() + category.slice(1)} />
          </MenuItem>
        ))}
      </Select>
    </Grid>
  );

  const renderSubjectAndMessage = () => (
    <>
      <Grid size={{ xs: 12, md: 12 }}>
        <TextField
          fullWidth
          multiline
          minRows={6}
          label="Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          variant="outlined"
          placeholder="Enter your message here..."
          InputProps={{
            sx: {
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              fontSize: "0.9rem",
              paddingY: 1,
            },
          }}
          InputLabelProps={{
            sx: { color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" }, fontSize: "0.9rem" },
          }}
          required
        />
      </Grid>
      {renderWallet()}
      <Grid size={{ xs: 12, md: 12 }}>
        <CheckboxFormControlLabel
          control={
            <Checkbox
              checked={state.isScheduleChecked}
              onChange={(e) => {
                handleStateChange("isScheduleChecked", e.target.checked);
                if (!e.target.checked) {
                  setFormData((prev) => ({ ...prev, scheduledDateTime: undefined }));
                }
              }}
              sx={{ color: "#F6F4FE", "&.Mui-checked": { color: "#F6F4FE" } }}
            />
          }
          label="Schedule Message"
          sx={{ color: "#F6F4FE", mb: 1 }}
        />
        {state.isScheduleChecked && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              sx={{ borderColor: "#777280" }}
              label="Select Date and Time"
              value={formData.scheduledDateTime ? dayjs(formData.scheduledDateTime) : null}
              onChange={(newValue) =>
                handleChange({
                  target: {
                    name: "scheduledDateTime",
                    value: newValue ? newValue.toISOString() : "",
                  },
                })
              }
              minDateTime={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  placeholder: "Select date and time to send message",
                  InputProps: {
                    sx: {
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280 !important" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280 !important" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280 !important" },
                      fontSize: "0.9rem",
                      borderColor: "#777280 !important",
                    },
                  },
                  InputLabelProps: {
                    sx: {
                      color: "#F6F4FE",
                      "&.Mui-focused": { color: "#F6F4FE" },
                      fontSize: "0.9rem",
                    },
                  },
                  sx: {
                    "& .MuiSvgIcon-root": {
                      color: "#F6F4FE",
                    },
                    color: "#F6F4FE",
                    "& fieldset": {
                      borderColor: "#777280 !important",
                    },
                    "&:hover fieldset": {
                      borderColor: "#777280 !important",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#777280 !important",
                    },
                    fontSize: "0.9rem",
                  },
                },
              }}
            />
          </LocalizationProvider>
        )}
      </Grid>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          handleModalClose();
        }
      }}
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
            Send SMS Messages
          </Typography>
          <IconButton onClick={onClose}>
            <Close sx={{ color: "#B0B0B0" }} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4, py: 2 }}>
          <Grid container spacing={3}>
            <RenderAudienceType
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              isLoading={isLoading}
            />
            {formData.type === "newcomers" && (
              <>
                {renderProgramType()}
                {renderCheckNewcomers()}
              </>
            )}
            {formData.type === "workers" && (
              <>
                {renderDepartments()}
                {renderCheckWorkers()}
              </>
            )}
            {formData.type === "members" && renderCategories()}           
            {renderSubjectAndMessage()}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 6, sm: 2 },
            borderRadius: 50,
            color: "#2C2C2C",
            fontWeight: "semibold",
            textTransform: "none",
            fontSize: { xs: "0.9rem", sm: "0.9rem" },
            "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          }}
        >
          {isLoading ? (
            <Box display="flex" alignItems="center" color="gray">
              <CircularProgress size={18} sx={{ color: "gray", mr: 1 }} />
              Sending...
            </Box>
          ) : (
            "Send Message"
          )}
        </Button>
      </DialogActions>
      <DatePickerDialog
        open={state.dateDialogOpen}
        onClose={() => handleStateChange("dateDialogOpen", false)}
        onDateSelect={(date) => handleStateChange("selectedDate", date)}
        onDateApply={() => {
          handleStateChange("dateDialogOpen", false);
          fetchEvents(state.selectedDate);
        }}
      />
    </Dialog>
  );
};

export default MessageModal;