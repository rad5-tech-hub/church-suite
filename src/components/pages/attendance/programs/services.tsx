import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  ListItemText,
  Checkbox,
  Divider,
  IconButton,
} from "@mui/material";
import { CachedOutlined, CalendarTodayOutlined, Add, Close, Refresh } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import MultiDatePicker from "../../../util/datepicker";

interface ServiceFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  departmentIds: string[];
  collectionIds: string[];
  recurrenceType: string;
  endDate?: string;
  byWeekday?: number[];
  nthWeekdays?: { weekday: number; nth: number }[];
  customRecurrenceDates?: string[];
}

interface Department {
  id: string;
  name: string;
  type: string;
}

interface Collection {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
}

interface EventOccurrence {
  id: string;
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  hasAttendance: boolean;
  dayOfWeek: string;
  createdAt: string;
  collections: Collection[];
  event: Event;
}

interface CreateProgramModalProps {
  eventId?: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EventResponse {
  message: string;
  eventOccurrence: EventOccurrence;
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fetchCollections = async (
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  setFetchingCollections: React.Dispatch<React.SetStateAction<boolean>>,
  setFetchCollectionsError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  try {
    setFetchingCollections(true);
    setFetchCollectionsError(null);
    const response = await Api.get("/church/get-collections");
    const fetchedCollections = response.data.collections || [];
    setCollections(fetchedCollections);
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    setFetchCollectionsError("Failed to load collections. Please try again.");
    setCollections([]);
  } finally {
    setFetchingCollections(false);
  }
};

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ open, onClose, onSuccess, eventId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const isEdit = !!eventId;

  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    departmentIds: [],
    collectionIds: [],
    recurrenceType: "none",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [addingCollection, setAddingCollection] = useState<boolean>(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState<boolean>(false);
  const [fetchingCollections, setFetchingCollections] = useState<boolean>(false);
  const [fetchCollectionsError, setFetchCollectionsError] = useState<string | null>(null);
  const [fetchDepartmentsError, setFetchDepartmentsError] = useState<string | null>(null);
  const [createProgramError, setCreateProgramError] = useState<string | null>(null);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);
  const [monthlyOption, setMonthlyOption] = useState<"byDate" | "byWeek">("byDate");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [nthWeekdays, setNthWeekdays] = useState<{ weekday: number; nth: number }[]>([]);
  const [tempNewCollection, setTempNewCollection] = useState("");
  const [selectOpen, setSelectOpen] = useState(false);
  const [eventData, setEventData] = useState<EventOccurrence | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<boolean>(false);
  const [departmentSelectOpen, setDepartmentSelectOpen] = useState(false);

  useEffect(() => {
    if (open && eventId) {
      const fetchEventData = async () => {
        try {
          setLoadingEdit(true);
          const response = await Api.get<EventResponse>(`/church/get-event/${eventId}`);
          setEventData(response.data.eventOccurrence);
        } catch (err) {
          toast.error('Failed to fetch event data');
          console.error('Error fetching event data:', err);
        } finally {
          setLoadingEdit(false);
        }
      };

      fetchEventData();
    }
  }, [eventId, open]);

  useEffect(() => {
    if (eventData) {
      setFormData({
        title: eventData.event.title,
        date: moment(eventData.date).format("YYYY-MM-DD"),
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        departmentIds: [], // Assuming no departments in response; adjust if API includes them
        collectionIds:  eventData.collections ? eventData.collections.map((col) => col.id) : [],
        recurrenceType: "none",
      });
    }
  }, [eventData]);

    // ✅ move fetchDepartments outside useEffect
    const fetchDepartments = async () => {
      try {
        setFetchingDepartments(true);
        setFetchDepartmentsError(null);
        const response = await Api.get("/church/get-departments");

        // ✅ Only departments where branch is null
        const filtered = (response.data.departments || []).filter(
          (dept: any) => dept.branch === null
        );

        setDepartments(filtered);
      } catch (error) {
        setFetchDepartmentsError("Failed to load departments. Please try again.");
      } finally {
        setFetchingDepartments(false);
      }
    };

    useEffect(() => {
      if (open) {
        fetchDepartments();
        fetchCollections(setCollections, setFetchingCollections, setFetchCollectionsError);
      }
    }, [open]);

  useEffect(() => {
    if (formData.recurrenceType !== "monthly") {
      setMonthlyOption("byDate");
      setNthWeekdays([]);
    }
    if (formData.recurrenceType !== "weekly") {
      setSelectedWeekdays([]);
    }
  }, [formData.recurrenceType]);

  const inputProps = {
    sx: {
      fontSize: isLargeScreen ? "0.875rem" : undefined,
      color: "#F6F4FE",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#777280",
      },
    },
  };

  const inputLabelProps = {
    sx: {
      fontSize: isLargeScreen ? "0.875rem" : undefined,
      color: "#F6F4FE",
      "&.Mui-focused": {
        color: "#F6F4FE",
      },
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as keyof ServiceFormData]: value,
    }));
    setCreateProgramError(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    if (formData.recurrenceType === "monthly" && e.target.value) {
      setMonthlyModalOpen(true);
    }
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];

    if (value.includes("all")) {
      // Toggle select all
      if (formData.departmentIds.length === departments.length) {
        // unselect all
        setFormData((prev) => ({ ...prev, departmentIds: [] }));
      } else {
        // select all
        setFormData((prev) => ({
          ...prev,
          departmentIds: departments.map((dept: any) => dept.id),
        }));
      }
    } else {
      // normal multi-select
      setFormData((prev) => ({
        ...prev,
        departmentIds: value.filter((id) => id !== null && id !== "null"),
      }));
    }
  };

  const handleCollectionChange = (event: SelectChangeEvent<typeof formData.collectionIds>) => {
    const { value } = event.target;
    const cleanedValue = Array.isArray(value)
      ? value.filter(id => id !== null && id !== undefined && id !== '')
      : [];
    setFormData((prev) => ({
      ...prev,
      collectionIds: cleanedValue,
    }));
    setCreateProgramError(null);
  };

  const handleWeekdayChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    const selected = typeof value === "string" ? value.split(",") : value;
    setSelectedWeekdays(selected);
    const byWeekday = selected.map((day) => daysOfWeek.indexOf(day));
    setFormData((prev) => ({ ...prev, byWeekday }));
  };

  const handleAddNthWeekday = (weekday: number, nth: number) => {
    if (nth < -1 || nth > 5 || nth === 0) {
      setCreateProgramError("nth must be between -1 and 5 (excluding 0).");
      return;
    }
    if (!nthWeekdays.some((item) => item.weekday === weekday && item.nth === nth)) {
      const newNthWeekdays = [...nthWeekdays, { weekday, nth }];
      setNthWeekdays(newNthWeekdays);
      setFormData((prev) => ({ ...prev, nthWeekdays: newNthWeekdays }));
    }
  };

  const getOrdinalSuffix = (n: number): string => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const handleAddCollection = async () => {
    if (tempNewCollection.trim() === "") {
      setFetchCollectionsError("Collection name cannot be empty.");
      return;
    }
    if (collections.some((col) => col.name.toLowerCase() === tempNewCollection.trim().toLowerCase())) {
      setFetchCollectionsError("Collection already exists.");
      return;
    }

    try {
      setAddingCollection(true);
      setFetchCollectionsError(null);
      const response = await Api.post("/church/create-collection", { name: tempNewCollection.trim() });
      const newCollection = response.data.collection;
      setCollections((prev) => [...prev, newCollection]);
      setTempNewCollection("");
      setFetchCollectionsError("Collection added successfully!");
      fetchCollections(setCollections, setFetchingCollections, setFetchCollectionsError);
    } catch (error) {
      console.error("Failed to create collection:", error);
      setFetchCollectionsError("Failed to create collection. Please try again.");
    } finally {
      setAddingCollection(false);
    }
  };

  const handleSubmit = async () => {    
    let payload: any = {
      title: formData.title,
      recurrenceType: formData.recurrenceType,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      departmentIds: formData.departmentIds,
      collectionIds: formData.collectionIds,
    };

    if (formData.recurrenceType && formData.recurrenceType !== "none") {
      payload.recurrenceType = formData.recurrenceType;

      if (["weekly", "monthly"].includes(formData.recurrenceType)) {
        payload.endDate =
          formData.endDate ||
          moment(formData.date).add(3, "months").format("YYYY-MM-DD");
      }

      if (formData.recurrenceType === "weekly") {
        payload.date = formData.date;
        payload.byWeekday = formData.byWeekday
      }

      if (formData.recurrenceType === "monthly") {
        if (monthlyOption === "byDate") {
          const selectedDate = moment(formData.date);
          const dayNum = selectedDate.date();
          payload.nthWeekdays = [
            { weekday: selectedDate.day(), nth: Math.ceil(dayNum / 7) },
          ];
        }
      }

      if (
        formData.recurrenceType === "custom" &&
        formData.customRecurrenceDates?.length
      ) {
        payload.customRecurrenceDates = formData.customRecurrenceDates;
        delete payload.date;
      }
    }
    try{
      setLoading(true);
      const response = await Api.post("/church/create-event", payload);
      toast.success( `Program ${response.data.event?.title || formData.title}" created successfully!`, { position: isMobile ? "top-center" : "top-right", autoClose: 600 } );
      resetForm();
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Error processing program:", error.response?.data || error.message);
      let errorMessage = "Failed to process program. Please try again.";

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

      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // const handleEdit = async () => {
  //   let payload: any = {
  //     title: formData.title,
  //     recurrenceType: formData.recurrenceType,
  //     date: formData.date,
  //     startTime: formData.startTime,
  //     endTime: formData.endTime,
  //     departmentIds: formData.departmentIds,
  //     collectionIds: formData.collectionIds,
  //   };

  //   await Api.put(`/church/update-event/${eventId}`, payload);
  //   toast.success(`Program "${formData.title}" updated successfully!`, {
  //     position: isMobile ? "top-center" : "top-right",
  //     autoClose: 500,
  //   });
  // };

  const resetForm = () => {
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      departmentIds: [],
      collectionIds: [],
      recurrenceType: "none",
      customRecurrenceDates: [],
    });
    setMonthlyOption("byDate");
    setSelectedWeekdays([]);
    setNthWeekdays([]);
    setTempNewCollection("");
    setSelectOpen(false);
    setCreateProgramError(null);
    setEventData(null);
  };

  const renderProgramType = () => (
    <Grid size={{ xs: 12 }} spacing={2}>
      <FormLabel
        id="program-type-label"
        sx={{ fontSize: "0.9rem", color: "#F6F4FE" }}
      >
        Program Type
      </FormLabel>

      <RadioGroup
        row
        sx={{
          display: "flex",
          justifyContent: "space-around",
          mt: 1,
          color: "#F6F4FE",
        }}
        aria-labelledby="program-type-label"
        name="recurrenceType"
        value={formData.recurrenceType}
        onChange={handleChange}
      >
        {[
          {
            value: "none",
            label: "Single",
            icon: (
              <CalendarTodayOutlined fontSize="small" sx={{ color: "#F6F4FE" }} />
            ),
          },
          {
            value: "weekly",
            label: "Weekly",
            icon: <CachedOutlined fontSize="small" sx={{ color: "#F6F4FE" }} />,
          },
          {
            value: "monthly",
            label: "Monthly",
            icon: <CachedOutlined fontSize="small" sx={{ color: "#F6F4FE" }} />,
          },
          {
            value: "custom",
            label: "Custom",
            icon: <CachedOutlined fontSize="small" sx={{ color: "#F6F4FE" }} />,
          },
        ].map(({ value, label, icon }) => (
          <FormControlLabel
            key={value}
            value={value}
            disabled={loading}
            control={
              <Radio
                sx={{
                  ml: 2,
                  color: "#F6F4FE",
                  "&.Mui-checked": {
                    color: "#F6F4FE",
                  },
                }}
              />
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
              borderRadius: 1,
            }}
          />
        ))}
      </RadioGroup>
    </Grid>
  );

  const renderDateTimeInputs = () => {
    return (
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2}>
          {/* Date input for all recurrence types except custom */}
          {formData.recurrenceType !== "custom" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Start Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleDateChange}
                variant="outlined"
                disabled={loading}
                InputLabelProps={{ shrink: true, ...inputLabelProps }}
                inputProps={inputProps}
                sx={{                
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-root': {
                    color: '#F6F4FE',
                    '& fieldset': { borderColor: '#F6F4FE' },
                    '&:hover fieldset': { borderColor: '#F6F4FE' },
                    '&.Mui-focused fieldset': { borderColor: '#4B8DF8' },
                    '&.Mui-disabled': {
                      color: '#777280',
                      '& fieldset': { borderColor: 'transparent' },
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#F6F4FE',
                    // ✅ Change the calendar/clock icons
                    '&::-webkit-calendar-picker-indicator': {
                      filter: 'invert(1)', // turns it white-ish
                      cursor: 'pointer',
                    },
                  },
                }}
              />

            </Grid>
          )}

          {/* Days of Week selector only for weekly recurrence */}
          {formData.recurrenceType === "weekly" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth variant="outlined" disabled={loading}>
                <InputLabel id="weekday-label" sx={inputLabelProps.sx}>
                  Days of the Week
                </InputLabel>
                <Select
                  labelId="weekday-label"
                  multiple
                  value={selectedWeekdays}
                  onChange={handleWeekdayChange}
                  label="Days of the Week"
                  renderValue={(selected) => selected.join(", ")}
                  sx={{
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "& .MuiSelect-select": { borderColor: "#777280", color: "#F6F4FE" },
                    "& .MuiSelect-icon": { color: "#F6F4FE" },              
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-root': {
                      color: '#F6F4FE',
                      '& fieldset': { borderColor: '#F6F4FE' },
                      '&:hover fieldset': { borderColor: '#F6F4FE' },
                      '&.Mui-focused fieldset': { borderColor: '#4B8DF8' },
                      '&.Mui-disabled': {
                        color: '#777280',
                        '& fieldset': { borderColor: 'transparent' },
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: '#F6F4FE',
                    },
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox checked={selectedWeekdays.indexOf(day) > -1} />
                      <ListItemText primary={day} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Custom date input for custom recurrence */}
            {formData.recurrenceType === "custom" && (
              <Grid size={{ xs: 12, sm: 6 }} >
                <MultiDatePicker                  
                  value={formData.customRecurrenceDates ?? []}
                  onChange={(dates) =>
                    setFormData((prev) => ({
                      ...prev,
                      customRecurrenceDates: dates,
                    }))
                  }
                />

              </Grid>
            )}


          {/* Time inputs */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime ?? ""}
              onChange={handleChange}
              variant="outlined"
              disabled={loading}
              sx={{
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": {
                  color: "#F6F4FE",
                  "& fieldset": { borderColor: "#F6F4FE" },
                  "&:hover fieldset": { borderColor: "#F6F4FE" },
                  "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                  "&.Mui-disabled": {
                    color: "#777280",
                    "& fieldset": { borderColor: "transparent" },
                  },
                },
                "& .MuiInputBase-input": {
                  color: "#F6F4FE",
                  "&::-webkit-calendar-picker-indicator": {
                    filter: "invert(1)",
                    cursor: "pointer",
                  },
                },
              }}
              InputLabelProps={{ shrink: true, ...inputLabelProps }}
              inputProps={inputProps}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime ?? ""}
              onChange={handleChange}
              variant="outlined"
              disabled={loading}
              sx={{
                borderRadius: '8px',
                '& .MuiOutlinedInput-root': {
                  color: '#F6F4FE',
                  '& fieldset': { borderColor: '#F6F4FE' },
                  '&:hover fieldset': { borderColor: '#F6F4FE' },
                  '&.Mui-focused fieldset': { borderColor: '#4B8DF8' },
                  '&.Mui-disabled': {
                    color: '#777280',
                    '& fieldset': { borderColor: 'transparent' },
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#F6F4FE',
                  // ✅ Change the calendar/clock icons
                  '&::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)', // turns it white-ish
                    cursor: 'pointer',
                  },
                },
              }}

              InputLabelProps={{ shrink: true, ...inputLabelProps }}
              inputProps={inputProps}
            />
          </Grid>

          {/* End Date for weekly and monthly recurrence */}
          {["weekly", "monthly",].includes(formData.recurrenceType) && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                variant="outlined"
                disabled={loading}
                sx={{                
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-root': {
                    color: '#F6F4FE',
                    '& fieldset': { borderColor: '#F6F4FE' },
                    '&:hover fieldset': { borderColor: '#F6F4FE' },
                    '&.Mui-focused fieldset': { borderColor: '#4B8DF8' },
                    '&.Mui-disabled': {
                      color: '#777280',
                      '& fieldset': { borderColor: 'transparent' },
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#F6F4FE',
                    // ✅ Change the calendar/clock icons
                    '&::-webkit-calendar-picker-indicator': {
                      filter: 'invert(1)', // turns it white-ish
                      cursor: 'pointer',
                    },
                  },
                }}
                InputLabelProps={{ shrink: true, ...inputLabelProps }}
                inputProps={inputProps}
              />
            </Grid>
          )}
        </Grid>
      </Grid>
    );
  };

  const renderMonthlyModal = () => {
    if (!formData.date || formData.recurrenceType !== "monthly") return null;
    const selectedDate = moment(formData.date);
    const dayNum = selectedDate.date();
    const weekday = selectedDate.day();
    let weekOrdinal = Math.ceil(dayNum / 7);
    const daysInMonth = selectedDate.daysInMonth();
    const lastWeek = Math.ceil(daysInMonth / 7);
    if (weekOrdinal === lastWeek) {
      weekOrdinal = -1;
    }
    const byDateLabel = `${dayNum}${getOrdinalSuffix(dayNum)} of each month`;
    const byWeekLabel = `${weekOrdinal === -1 ? "Last" : ["First", "Second", "Third", "Fourth", "Fifth"][weekOrdinal - 1]
      } ${daysOfWeek[weekday]} of each month`;

    return (
      <Dialog
        open={monthlyModalOpen}
        onClose={() => setMonthlyModalOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            bgcolor: "#2C2C2C",
            py: 3,
            px: 2,
          },
        }}
      >
        <DialogTitle color="#F6F4FE">Choose Monthly Recurrence</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={monthlyOption}
            onChange={(e) => setMonthlyOption(e.target.value as "byDate" | "byWeek")}
          >
            <FormControlLabel
              value="byDate"
              sx={{ color: "#F6F4FE" }}
              control={<Radio color="default" />}
              label={byDateLabel}
            />
            <FormControlLabel
              value="byWeek"
              sx={{ color: "#F6F4FE" }}
              control={<Radio color="default" />}
              label={byWeekLabel}
            />
          </RadioGroup>
          {monthlyOption === "byWeek" && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ color: "#F6F4FE" }}>Add Additional nth Weekday</Typography>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="weekday-select-label" sx={inputLabelProps.sx}>
                  Weekday
                </InputLabel>
                <Select
                  labelId="weekday-select-label"
                  onChange={(e) => {
                    const weekday = daysOfWeek.indexOf(e.target.value as string);
                    handleAddNthWeekday(weekday, weekOrdinal);
                  }}
                  label="Weekday"
                  sx={{
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ mt: 1 }}>
                {nthWeekdays.map((item, index) => (
                  <Typography key={index} sx={{ color: "#F6F4FE" }}>
                    {item.nth === -1 ? "Last" : ["First", "Second", "Third", "Fourth", "Fifth"][item.nth - 1]}{" "}
                    {daysOfWeek[item.weekday]}
                  </Typography>
                ))}
              </Box>
              {createProgramError && monthlyOption === "byWeek" && (
                <Typography sx={{ color: "#FF6B6B", mt: 1 }}>{createProgramError}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMonthlyModalOpen(false)}
            sx={{
              py: 1,
              backgroundColor: "#F6F4FE",
              px: { xs: 2, sm: 2 },
              borderRadius: 50,
              color: "#2C2C2C",
              fontWeight: "semibold",
              textTransform: "none",
              fontSize: { xs: "1rem", sm: "1rem" },
              "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderCollectionInput = () => (
    <Grid size={{ xs: 12 }}>
      <FormControl fullWidth variant="outlined" disabled={loading || addingCollection}>
        <InputLabel id="collection-label" sx={inputLabelProps.sx}>
          Collections
        </InputLabel>
        <Select
          labelId="collection-label"
          name="collectionIds"
          multiple
          value={formData.collectionIds}
          onChange={handleCollectionChange}
          label="Collections"
          open={selectOpen}
          onOpen={() => setSelectOpen(true)}
          onClose={() => {
            setSelectOpen(false);
            setTempNewCollection("");
          }}
          renderValue={(selected) =>
            selected
              .filter(id => id !== null && id !== undefined)
              .map((id) => collections.find((col) => col.id === id)?.name || id)
              .join(", ")
          }
          sx={{
            fontSize: isLargeScreen ? "1rem" : undefined,
            color: "#F6F4FE",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            "& .MuiSelect-select": { borderColor: "#777280", color: "#F6F4FE" },
            "& .MuiSelect-icon": { color: "#F6F4FE" },
          }}
          MenuProps={{ 
            disableAutoFocus: true,
            disableEnforceFocus: true,
            onKeyDown: (e) => {
              if ((e.target as HTMLElement).tagName === 'INPUT') {
                e.stopPropagation();
              }
            }
          }}
        >
          {/* Close button at the top of the menu - aligned with select width */}
          <Box sx={{ 
            position: 'sticky', 
            top: 0,              
            zIndex: 1, 
            display: 'flex', 
            justifyContent: 'flex-end',
            p: 1,
            borderBottom: '1px solid #777280',
            width: '100%', // Ensure it takes full width of the menu
            boxSizing: 'border-box', // Include padding in width calculation
          }}>
            <IconButton
              size="small"
              onClick={() => setSelectOpen(false)}
              sx={{ color: "#2C2C2C", backgroundColor: 'transparent !important', }}
              aria-label="Close menu"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {fetchingCollections ? (
            <MenuItem disabled>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 1 }}>Loading collections...</Typography>
            </MenuItem>
          ) : fetchCollectionsError ? (
              <MenuItem                
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {fetchCollectionsError}
                </Typography>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ prevents select from closing
                    fetchCollections(setCollections, setFetchingCollections, setFetchCollectionsError);
                  }}
                >
                  <Refresh fontSize="small" sx={{ color: "#2C2C2C" }} />
                </IconButton>
              </MenuItem>
          ) : collections.length > 0 ? (
            collections.map((col) => (
              <MenuItem key={col.id} value={col.id} sx={{ width: '100%', boxSizing: 'border-box' }}>
                <Checkbox checked={formData.collectionIds.includes(col.id)} 
                  sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }}
                />
                <ListItemText primary={col.name} />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled sx={{ width: '100%', boxSizing: 'border-box' }}>
              <Typography>No collections available</Typography>
            </MenuItem>
          )}
          
          <Divider sx={{ width: '100%', boxSizing: 'border-box' }} />
          
          <Box sx={{ p: 1, width: '100%', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Add New Collection
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: '100%' }}>
              <TextField
                fullWidth
                size="small"
                value={tempNewCollection}
                onChange={(e) => setTempNewCollection(e.target.value)}
                placeholder="Enter new collection name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    handleAddCollection();
                  }
                  e.stopPropagation();
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                disabled={addingCollection}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                sx={{ 
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },                 
                }}
                inputProps={{
                  autoComplete: "new-password",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCollection();
                }}
                disabled={!tempNewCollection.trim() || addingCollection}
                size="small"
                sx={{
                  color: "#F6F4FE",
                  backgroundColor: "#2C2C2C",
                  borderRadius: 1,
                  "&:hover": { backgroundColor: "#2C2C2C", opacity: 0.8 },
                  "&:disabled": { opacity: 0.5 },
                }}
              >
                {addingCollection ? (
                  <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
                ) : (
                  <Add fontSize="small" />
                )}
              </IconButton>
            </Box>
          </Box>
        </Select>
      </FormControl>
    </Grid>
  );

  const renderDepartmentInput = () => {
    const allSelected = 
      departments.length > 0 && formData.departmentIds.length === departments.length;
    return (
      <Grid size={{ xs: 12 }}>
        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="department-label" sx={inputLabelProps.sx}>
            Expected Departments
          </InputLabel>
          <Select
            labelId="department-label"
            name="departmentIds"
            multiple
            value={formData.departmentIds}
            onChange={handleDepartmentChange}
            renderValue={(selected) =>
              (selected as string[])
                .map((id) => departments.find((dept) => dept.id === id)?.name || id)
                .join(", ")
            }
            open={departmentSelectOpen}
            onOpen={() => setDepartmentSelectOpen(true)}
            onClose={() => setDepartmentSelectOpen(false)}
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
              "& .MuiSelect-select": { borderColor: "#777280", color: "#F6F4FE" },
              "& .MuiSelect-icon": { color: "#F6F4FE" },
            }}
            MenuProps={{
              PaperProps: { sx: { maxHeight: 350 } }
            }}
          >
            {/* ✅ Close button inside menu */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                display: "flex",
                justifyContent: "flex-end",
                p: 1,
                borderBottom: "1px solid #777280",
                backgroundColor: "#fff",
              }}
            >
              <IconButton
                size="small"
                onClick={() => setDepartmentSelectOpen(false)}
                sx={{
                  color: "#2C2C2C",                
                }}
                aria-label="Close menu"
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            {/* ✅ Select All option */}
            {departments.length > 0 && (
              <MenuItem value="all">
                <Checkbox
                  checked={allSelected}
                  indeterminate={
                    formData.departmentIds.length > 0 &&
                    formData.departmentIds.length < departments.length
                  }
                  sx={{
                    color: "var(--color-primary)",
                    "&.Mui-checked": { color: "var(--color-primary)" },
                  }}
                />
                <ListItemText primary="Select All" />
              </MenuItem>
            )}


            {/* Items */}
            {fetchingDepartments ? (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                  <CircularProgress size={20} />
                  <Typography sx={{ ml: 1 }} variant="body2">
                    Loading departments...
                  </Typography>
                </Box>
              </MenuItem>
            ) : fetchDepartmentsError ? (
              <MenuItem sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {fetchDepartmentsError}
                </Typography>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ Prevents Select from closing immediately
                    fetchDepartments();
                  }}
                >
                  <Refresh fontSize="small" sx={{ color: '#2C2C2C' }} />
                </IconButton>
              </MenuItem>
            ) : departments.length > 0 ? (
              departments.map((dept: any) => (
                <MenuItem key={dept.id} value={dept.id}>
                  <Checkbox
                    checked={formData.departmentIds.includes(dept.id)}
                    sx={{
                      color: "var(--color-primary)",
                      "&.Mui-checked": { color: "var(--color-primary)" },
                    }}
                  />
                  <ListItemText 
                    primary={dept.type ? `${dept.name} - (${dept.type})` : dept.name} 
                  />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography variant="body2">No departments available</Typography>
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Grid>
    );
  };


  return (
    <Dialog
      open={open}
      onClose={() => { resetForm(); onClose(); }}
      fullWidth
      maxWidth="md"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: "#2C2C2C",
          py: 3,
          px: 2,
        },
      }}
    >
      <ToastContainer/>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="#F6F4FE" fontWeight={600}>
            {isEdit ? "Edit Program" : "Create Program"}
          </Typography>
          <IconButton onClick={() => { resetForm(); onClose(); }}>
            <Close className="text-gray-300" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isEdit && loadingEdit ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Program Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Enter program title"
                  disabled={loading}
                  InputProps={{
                    sx: {
                      color: "#F6F4FE",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "#F6F4FE",
                      "&.Mui-focused": {
                        color: "#F6F4FE",
                      },
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                  required
                />
              </Grid>
              {!isEdit && renderProgramType()}
              {renderDateTimeInputs()}
              {renderDepartmentInput()}
              {renderCollectionInput()}
              {createProgramError && (
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ color: "#FF6B6B" }}>{createProgramError}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || (isEdit && loadingEdit)}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 2, sm: 2 },
            borderRadius: 50,
            color: "#2C2C2C",
            fontWeight: "semibold",
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1rem" },
            "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
              <span className="text-gray-500">{isEdit ? "Updating..." : "Creating..."}</span>
            </>
          ) : (
            isEdit ? "Update Program" : "Create Program"
          )}
        </Button>
      </DialogActions>

      {renderMonthlyModal()}
    </Dialog>
  );
};

export default CreateProgramModal;