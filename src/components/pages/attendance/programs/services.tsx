import React, { useState, useEffect, useRef } from "react";
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
  Chip,
} from "@mui/material";
import { CachedOutlined, CalendarTodayOutlined, Add, Close, Refresh } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import moment from "moment";
import { showPageToast } from "../../../util/pageToast";
import { usePageToast } from "../../../hooks/usePageToast";
import dayjs from "dayjs";
import CustomCalendarDialog from "../../../util/popCalender";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";

export interface ServiceFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  departmentIds: string[];
  collectionIds: string[];
  recurrenceType: string;
  endDate?: string;
  byWeekday?: Weeks[];
  nthWeekdays?: {
    weekday: number;
    nth: number;
    startTime?: string;
    endTime?: string;
  }[];
  customRecurrenceDates?: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
  branchId?: string;
}

interface Weeks {
  weekday: number;
  startTime: string;
  endTime: string;
}

interface Department {
  id: string;
  name: string;
  type?: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  name: string;
  collection: collectionData;
}

interface collectionData {
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
  collection: Collection[];
  assignedDeparments: Department[];
  event: Event;
  branchId?: string;
}

interface ProgramModalProps {
  eventId?: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface EventResponse {
  message: string;
  eventOccurrence: EventOccurrence;
}

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const fetchCollections = async (
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  setFetchingCollections: React.Dispatch<React.SetStateAction<boolean>>,
  setFetchCollectionsError: React.Dispatch<React.SetStateAction<string | null>>,
  branchId?: string
) => {
  try {
    setFetchingCollections(true);
    setFetchCollectionsError(null);
    const response = await Api.get(`/church/get-collections/${branchId}`);
    const rawCollections = response.data.branchCollections || [];
    const mappedCollections = rawCollections.map((item: any) => ({
      id: item.collection?.id,
      name: item.collection?.name,
    }));
    setCollections(mappedCollections);
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    setFetchCollectionsError("Failed to load collections. Please try again.");
    setCollections([]);
  } finally {
    setFetchingCollections(false);
  }
};

const fetchDepartments = async (
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>,
  setFetchingDepartments: React.Dispatch<React.SetStateAction<boolean>>,
  setFetchDepartmentsError: React.Dispatch<React.SetStateAction<string | null>>,
  branchId?: string
) => {
  if (!branchId) return;
  try {
    setFetchingDepartments(true);
    setFetchDepartmentsError(null);
    const response = await Api.get(`/church/get-departments?branchId=${branchId}`);
    setDepartments(response.data.departments || []);
  } catch (error) {
    setFetchDepartmentsError("Failed to load departments. Please try again.");
  } finally {
    setFetchingDepartments(false);
  }
};

const fetchBranches = async (
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>,
  setFetchingBranch: React.Dispatch<React.SetStateAction<boolean>>,
  setFetchBranchesError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  try {
    setFetchingBranch(true);
    setFetchBranchesError(null);
    const response = await Api.get("/church/get-branches");
    setBranches(response.data.branches);
  } catch (error) {
    setFetchBranchesError("Failed to load branches. Please try again.");
  } finally {
    setFetchingBranch(false);
  }
};

const ProgramModal: React.FC<ProgramModalProps & { isEdit?: boolean }> = ({
  open,
  onClose,
  onSuccess,
  eventId,
  isEdit = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  usePageToast('program-modal');

  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    departmentIds: [],
    collectionIds: [],
    branchId: authData?.branchId || "",
    recurrenceType: "none",
  });
  const [initialFormData, setInitialFormData] = useState<ServiceFormData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    departmentIds: [],
    collectionIds: [],
    branchId: authData?.branchId || "",
    recurrenceType: "none",
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [addingCollection, setAddingCollection] = useState<boolean>(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState<boolean>(false);
  const [fetchingCollections, setFetchingCollections] = useState<boolean>(false);
  const [fetchCollectionsError, setFetchCollectionsError] = useState<string | null>(null);
  const [fetchDepartmentsError, setFetchDepartmentsError] = useState<string | null>(null);
  const [createProgramError, setCreateProgramError] = useState<string | null>(null);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);
  const [monthlyOption, setMonthlyOption] = useState<"byDate" | "byWeek">("byDate");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [nthWeekdays, setNthWeekdays] = useState<{ weekday: number; nth: number }[]>([]);
  const [tempNewCollection, setTempNewCollection] = useState("");
  const [selectOpen, setSelectOpen] = useState(false);
  const [eventData, setEventData] = useState<EventOccurrence | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<boolean>(false);
  const [departmentSelectOpen, setDepartmentSelectOpen] = useState(false);
  const [weekdayMenuOpen, setWeekdayMenuOpen] = useState(false);
  const [branchSelectOpen, setBranchSelectOpen] = useState(false);
  const [fetchingBranch, setFetchingBranch] = useState(false);
  const [fetchBranchesError, setFetchBranchesError] = useState<string | null>(null);
  const selectRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      const fetchInitialData = async () => {
        await Promise.all([
          fetchBranches(setBranches, setFetchingBranch, setFetchBranchesError),
          fetchCollections(setCollections, setFetchingCollections, setFetchCollectionsError, formData.branchId || authData?.branchId),
          formData.branchId ? fetchDepartments(setDepartments, setFetchingDepartments, setFetchDepartmentsError, formData.branchId) : Promise.resolve(),
          isEdit && eventId ? fetchEventData() : Promise.resolve()
        ]);
      };
      fetchInitialData();
    }
  }, [open]);

  const fetchEventData = async () => {
    if (!isEdit || !eventId) return;
    try {
      setLoadingEdit(true);
      const response = await Api.get<EventResponse>(`/church/get-event/${eventId}`);
      setEventData(response.data.eventOccurrence);
    } catch (err) {
      showPageToast('Failed to fetch event data', 'error');
      console.error('Error fetching event data:', err);
    } finally {
      setLoadingEdit(false);
    }
  };

  useEffect(() => {
    if (eventData && isEdit) {
      const newFormData = {
        title: eventData.event.title,
        date: moment(eventData.date).format("YYYY-MM-DD"),
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        departmentIds: eventData?.assignedDeparments?.map((dept) => dept.id) || [],
        collectionIds: eventData.collection?.map((col) => col.collection.id) || [],
        recurrenceType: "none",
        branchId: eventData.branchId || authData?.branchId || "",
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [eventData, isEdit, authData?.branchId]);

  useEffect(() => {
    if (open && formData.branchId && formData.branchId !== initialFormData.branchId) {
      fetchDepartments(setDepartments, setFetchingDepartments, setFetchDepartmentsError, formData.branchId);
    }
  }, [open, formData.branchId, initialFormData.branchId]);

  useEffect(() => {
    if (open && formData.branchId && formData.branchId !== initialFormData.branchId) {
      fetchCollections(setCollections, setFetchingCollections, setFetchCollectionsError, formData.branchId || authData?.branchId);
    }
  }, [open, formData.branchId, initialFormData.branchId, authData?.branchId]);

  useEffect(() => {
    switch (formData.recurrenceType) {
      case "weekly":
        setMonthlyOption("byDate");
        setNthWeekdays([]);
        setSelectedWeekdays([]);
        setWeekdayMenuOpen(true);
        setFormData(prev => ({ ...prev, byWeekday: [] }));
        break;
      case "monthly":
        setSelectedWeekdays([]);
        setWeekdayMenuOpen(false);
        break;
      case "custom":
        setMonthlyOption("byDate");
        setNthWeekdays([]);
        setSelectedWeekdays([]);
        setWeekdayMenuOpen(false);
        setCalendarOpen(true);
        setFormData(prev => ({
          ...prev,
          byWeekday: [],
          nthWeekdays: [],
          customRecurrenceDates: prev.customRecurrenceDates || [],
        }));
        break;
      default:
        setMonthlyOption("byDate");
        setNthWeekdays([]);
        setSelectedWeekdays([]);
        setWeekdayMenuOpen(false);
        setFormData(prev => ({
          ...prev,
          byWeekday: [],
          nthWeekdays: [],
          customRecurrenceDates: [],
        }));
    }
  }, [formData.recurrenceType]);

  const inputProps = {
    sx: {
      fontSize: isLargeScreen ? "0.875rem" : undefined,
      color: "#F6F4FE",
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
    },
  };

  const inputLabelProps = {
    sx: {
      fontSize: isLargeScreen ? "0.875rem" : undefined,
      color: "#F6F4FE",
      "&.Mui-focused": { color: "#F6F4FE" },
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

  const handleDepartmentChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    if (value.includes("all")) {
      if (formData.departmentIds.length === departments.length) {
        setFormData(prev => ({ ...prev, departmentIds: [] }));
      } else {
        setFormData(prev => ({
          ...prev,
          departmentIds: departments.map((dept: any) => dept.id).filter(id => id),
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        departmentIds: value.filter(id => id),
      }));
    }
  };

  const handleCollectionChange = (event: SelectChangeEvent<typeof formData.collectionIds>) => {
    const { value } = event.target;
    const cleanedValue = Array.isArray(value) ? value.filter(id => id) : [];
    setFormData((prev) => ({
      ...prev,
      collectionIds: cleanedValue,
    }));
    setCreateProgramError(null);
  };

  const handleWeekdayChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as number[];
    setSelectedWeekdays(value);
    setFormData((prev) => {
      const updated = [...(prev.byWeekday || [])];
      value.forEach((dayNum) => {
        if (!updated.find((w) => w.weekday === dayNum)) {
          updated.push({ weekday: dayNum, startTime: "", endTime: "" });
        }
      });
      const filtered = updated.filter((w) => value.includes(w.weekday));
      return { ...prev, byWeekday: filtered };
    });
  };

  const handleWeekdayTimeChange = (
    weekday: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      byWeekday: prev.byWeekday?.map((w) =>
        w.weekday === weekday ? { ...w, [field]: value } : w
      ) || [],
    }));
  };

  const handleConfirmMonthly = () => {
    if (monthlyOption === "byWeek") {
      const selectedDate = moment(formData.date);
      const dayNum = selectedDate.date();
      const weekday = selectedDate.day();
      let weekOrdinal = Math.ceil(dayNum / 7);
      const daysInMonth = selectedDate.daysInMonth();
      const lastWeek = Math.ceil(daysInMonth / 7);
      if (weekOrdinal === lastWeek) weekOrdinal = -1;
      const newNthWeekdays = [{
        weekday,
        nth: weekOrdinal,
        startTime: "",
        endTime: "",
      }];
      setFormData((prev) => ({
        ...prev,
        nthWeekdays: newNthWeekdays,
      }));
    }
    setMonthlyModalOpen(false);
  };

  const handleMonthlyWeekdayTimeChange = (
    weekday: number,
    nth: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      nthWeekdays: prev.nthWeekdays?.map((w) =>
        w.weekday === weekday && w.nth === nth ? { ...w, [field]: value } : w
      ),
    }));
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
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
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
      const response = await Api.post(`/church/create-collection`, {
        name: tempNewCollection.trim(),
        branchIds: [formData.branchId || authData?.branchId],
      });
      const newCollection = response.data.collection;
      setCollections((prev) => [...prev, newCollection]);
      setTempNewCollection("");
      setFetchCollectionsError("Collection added successfully!");
      fetchCollections(setCollections, setFetchingCollections, setFetchCollectionsError, formData.branchId || authData?.branchId);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create collection:", error);
      setFetchCollectionsError("Failed to create collection. Please try again.");
    } finally {
      setAddingCollection(false);
    }
  };

  const validateForm = () => {
    if (!formData.title) {
      showPageToast("Program title is required", 'error');
      return false;
    }
    if (!formData.date && formData.recurrenceType !== 'custom') {
      showPageToast("Start date is required", 'error');
      return false;
    }
    if (formData.recurrenceType === "weekly") {
      if (!formData.byWeekday || formData.byWeekday.length === 0) {
        showPageToast("Please select at least one day", 'error');
        return false;
      }
      for (const day of formData.byWeekday) {
        if (!day.startTime || !day.endTime) {
          showPageToast(
            `Start and End time are required for ${daysOfWeek.find((d) => d.value === day.weekday)?.label || day.weekday}`,
            'error'
          );
          return false;
        }
      }
    }
    if (formData.recurrenceType === "monthly" && monthlyOption === "byWeek") {
      if (formData.nthWeekdays?.length) {
        for (const w of formData.nthWeekdays) {
          if (!w.startTime || !w.endTime) {
            showPageToast(
              `Start and End time are required for ${daysOfWeek.find((d) => d.value === w.weekday)?.label || w.weekday}`,
              'error'
            );
            return false;
          }
        }
      } else if (!formData.startTime || !formData.endTime) {
        showPageToast("Start and End time are required for the month", 'error');
        return false;
      }
    }
    return true;
  };

  const buildPayload = () => {
    const payload: any = {
      title: formData.title,
      recurrenceType: formData.recurrenceType,
      departmentIds: formData.departmentIds,
      collectionIds: formData.collectionIds,
      date: formData.date,
      branchId: formData.branchId,
    };

    if (formData.recurrenceType === "weekly" && formData.byWeekday?.length) {
      payload.byWeekday = formData.byWeekday.map((day) => ({
        weekday: day.weekday,
        startTime: day.startTime,
        endTime: day.endTime,
      }));
    }

    if (formData.recurrenceType === "monthly") {
      if (monthlyOption === "byWeek") {
        if (formData.nthWeekdays?.length) {
          payload.nthWeekdays = formData.nthWeekdays.map((w) => ({
            weekday: w.weekday,
            nth: w.nth,
            startTime: w.startTime || "",
            endTime: w.endTime || "",
          }));
          delete payload.startTime;
          delete payload.endTime;
        } else {
          payload.startTime = formData.startTime;
          payload.endTime = formData.endTime;
          delete payload.nthWeekdays;
        }
      } else if (monthlyOption === "byDate") {
        payload.startTime = formData.startTime;
        payload.endTime = formData.endTime;
        delete payload.nthWeekdays;
      }
    }

    if (formData.recurrenceType === "custom" && formData.customRecurrenceDates?.length) {
      payload.customRecurrenceDates = formData.customRecurrenceDates;
      delete payload.date;
      delete payload.startTime;
      delete payload.endTime;
    }

    if (formData.recurrenceType === "none") {
      payload.startTime = formData.startTime;
      payload.endTime = formData.endTime;
    }

    if (["weekly", "monthly"].includes(formData.recurrenceType)) {
      payload.endDate =
        formData.endDate ||
        moment(formData.date).add(3, "months").format("YYYY-MM-DD");
    }

    return payload;
  };

  const buildEditPayload = (initial: typeof formData) => {
    const payload: any = {};

    const addIfChanged = (key: keyof typeof formData) => {
      const current = formData[key];
      const previous = initial[key];

      const isObjectOrArray =
        typeof current === "object" && current !== null;

      if (isObjectOrArray) {
        if (JSON.stringify(current) !== JSON.stringify(previous)) {
          payload[key] = current;
        }
      } else {
        if (current !== previous) {
          payload[key] = current;
        }
      }
    };

    addIfChanged("title");
    addIfChanged("departmentIds");
    addIfChanged("collectionIds");
    addIfChanged("date");
    addIfChanged("startTime");
    addIfChanged("endTime");

    if (formData.recurrenceType !== initial.recurrenceType) {
      payload.recurrenceType = formData.recurrenceType;
    }

    if (formData.recurrenceType === "weekly") {
      if (JSON.stringify(formData.byWeekday) !== JSON.stringify(initial.byWeekday)) {
        payload.byWeekday = formData.byWeekday;
      }
    }

    if (formData.recurrenceType === "monthly") {
      if (monthlyOption === "byWeek") {
        if (JSON.stringify(formData.nthWeekdays) !== JSON.stringify(initial.nthWeekdays)) {
          payload.nthWeekdays = formData.nthWeekdays;
        }
      } else if (monthlyOption === "byDate") {
        addIfChanged("startTime");
        addIfChanged("endTime");
      }
    }

    if (
      formData.recurrenceType === "custom" &&
      JSON.stringify(formData.customRecurrenceDates) !==
        JSON.stringify(initial.customRecurrenceDates)
    ) {
      payload.customRecurrenceDates = formData.customRecurrenceDates;
    }

    if (
      ["weekly", "monthly"].includes(formData.recurrenceType) &&
      formData.endDate !== initial.endDate
    ) {
      payload.endDate =
        formData.endDate ||
        moment(formData.date).add(3, "months").format("YYYY-MM-DD");
    }

    return payload;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const payload = buildPayload();
      const response = await Api.post("/church/create-event", payload);
      showPageToast(`Program "${response.data.event?.title || formData.title}" created successfully!`, 'success');
      resetForm();
      onSuccess?.();
      setTimeout(() => onClose(), 1000);
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Failed to create program";
      if (responseData) {
        if (Array.isArray(responseData.errors)) {
          errorMessage = responseData.errors.join(", ") || responseData.message || errorMessage;
        } else if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      }
      showPageToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !eventId || !formData.branchId || !initialFormData) return;

    try {
      setLoading(true);

      const payload = buildEditPayload(initialFormData);

      if (Object.keys(payload).length === 0) {
        showPageToast("No changes to update", "warning");
        setLoading(false);
        return;
      }

      await Api.patch(
        `/church/edit-an-event/${eventId}/branch/${formData.branchId}`,
        payload
      );

      showPageToast(`Program "${formData.title}" updated successfully!`, "success");
      resetForm();
      onSuccess?.();
      setTimeout(() => onClose(), 1000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to update program";
      showPageToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

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
      branchId: authData?.branchId || "",
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
      <FormLabel id="program-type-label" sx={{ fontSize: "0.9rem", color: "#F6F4FE" }}>
        Program Type
      </FormLabel>
      <RadioGroup
        row
        sx={{ display: "flex", justifyContent: "space-around", mt: 1, color: "#F6F4FE" }}
        aria-labelledby="program-type-label"
        name="recurrenceType"
        value={formData.recurrenceType}
        onChange={handleChange}
      >
        {[
          { value: "none", label: "Single", icon: <CalendarTodayOutlined fontSize="small" sx={{ color: "#F6F4FE" }} /> },
          { value: "weekly", label: "Weekly", icon: <CachedOutlined fontSize="small" sx={{ color: "#F6F4FE" }} /> },
          { value: "monthly", label: "Monthly", icon: <CachedOutlined fontSize="small" sx={{ color: "#F6F4FE" }} /> },
          { value: "custom", label: "Custom", icon: <CachedOutlined fontSize="small" sx={{ color: "#F6F4FE" }} /> },
        ].map(({ value, label, icon }) => (
          <FormControlLabel
            key={value}
            value={value}
            disabled={loading}
            control={<Radio sx={{ ml: 2, color: "#F6F4FE", "&.Mui-checked": { color: "#F6F4FE" } }} />}
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {icon}
                <Typography sx={{ ml: 1, color: "#F6F4FE" }}>{label}</Typography>
              </Box>
            }
            labelPlacement="start"
            sx={{ border: "0.5px solid gray", flexDirection: "row-reverse", gap: 1, padding: "4px 8px", mb: 2, borderRadius: 1 }}
          />
        ))}
      </RadioGroup>
    </Grid>
  );

  const renderDateTimeInputs = () => (
    <Grid size={{ xs: 12 }}>
      <Grid container spacing={2}>
        {formData.recurrenceType === "weekly" && (
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth variant="outlined" disabled={loading}>
                <InputLabel id="weekday-label" sx={inputLabelProps.sx}>Days of the Week</InputLabel>
                <Select
                  labelId="weekday-label"
                  multiple
                  value={selectedWeekdays}
                  onChange={handleWeekdayChange}
                  open={weekdayMenuOpen}
                  onOpen={() => setWeekdayMenuOpen(true)}
                  onClose={() => setWeekdayMenuOpen(false)}
                  ref={selectRef}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={daysOfWeek.find((d) => d.value === value)?.label}
                          onDelete={() => {
                            setSelectedWeekdays((prev) => prev.filter((day) => day !== value));
                            setFormData((prev) => ({
                              ...prev,
                              byWeekday: prev.byWeekday?.filter((w) => w.weekday !== value) || [],
                            }));
                          }}
                          deleteIcon={<span onMouseDown={(e) => e.stopPropagation()}>×</span>}
                          sx={{
                            bgcolor: "rgba(121,121,121,0.2)",
                            color: "#F6F4FE",
                            "& .MuiChip-deleteIcon": { color: "#F6F4FE", "&:hover": { color: "#4B8DF8" } },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "& .MuiSelect-select": { borderColor: "#777280", color: "#F6F4FE", display: "flex", flexWrap: "wrap", gap: "4px" },
                    "& .MuiSelect-icon": { color: "#F6F4FE" },
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-root": {
                      color: "#F6F4FE",
                      "& fieldset": { borderColor: "#F6F4FE" },
                      "&:hover fieldset": { borderColor: "#F6F4FE" },
                      "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                      "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                    },
                    "& .MuiInputBase-input": { color: "#F6F4FE" },
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      <Checkbox checked={selectedWeekdays.indexOf(day.value) > -1} />
                      <ListItemText primary={day.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {formData.byWeekday?.map((w) => (
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }} sx={{ mb: 2 }} key={w.weekday}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "#777280",
                    borderRadius: "8px",
                    p: 2,
                    color: "#F6F4FE",
                    bgcolor: "rgba(121,121,121,0.2)",
                    display: "flex",
                    alignItems: 'center',
                    flexWrap: { xs: "wrap", lg: "nowrap" },
                    gap: 2,
                    mt: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ mb: 1, textAlign: "center" }}>
                    {daysOfWeek.find(opt => opt.value === w.weekday)?.label ?? w.weekday}
                  </Typography>
                  <TextField
                    type="time"
                    label="Start Time"
                    fullWidth
                    value={w.startTime}
                    onChange={(e) => handleWeekdayTimeChange(w.weekday, "startTime", e.target.value)}
                    sx={{
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-root": {
                        color: "#F6F4FE",
                        "& fieldset": { borderColor: "#F6F4FE" },
                        "&:hover fieldset": { borderColor: "#F6F4FE" },
                        "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                        "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                      },
                      "& .MuiInputBase-input": {
                        color: "#F6F4FE",
                        "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                      },
                    }}
                    InputLabelProps={{ shrink: true, ...inputLabelProps }}
                    inputProps={inputProps}
                  />
                  <TextField
                    type="time"
                    label="End Time"
                    fullWidth
                    value={w.endTime}
                    onChange={(e) => handleWeekdayTimeChange(w.weekday, "endTime", e.target.value)}
                    InputLabelProps={{ shrink: true, ...inputLabelProps }}
                    inputProps={inputProps}
                    sx={{
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-root": {
                        color: "#F6F4FE",
                        "& fieldset": { borderColor: "#F6F4FE" },
                        "&:hover fieldset": { borderColor: "#F6F4FE" },
                        "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                        "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                      },
                      "& .MuiInputBase-input": {
                        color: "#F6F4FE",
                        "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                      },
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
        {formData.recurrenceType === 'monthly' && (
          <Box sx={{ mb: 3, width: "100%" }}>
            <FormControl fullWidth disabled={loading}>
              <TextField
                label="Select Date For The Month"
                type="date"
                value={formData.date || ""}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, date: e.target.value }));
                  setMonthlyModalOpen(true);
                }}
                fullWidth
                sx={{
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-root': {
                    color: '#F6F4FE',
                    '& fieldset': { borderColor: '#F6F4FE' },
                    '&:hover fieldset': { borderColor: '#F6F4FE' },
                    '&.Mui-focused fieldset': { borderColor: '#4B8DF8' },
                    '&.Mui-disabled': { color: '#777280', '& fieldset': { borderColor: 'transparent' } },
                  },
                  '& .MuiInputBase-input': {
                    color: '#F6F4FE',
                    '&::-webkit-calendar-picker-indicator': { filter: 'invert(1)', cursor: 'pointer' },
                  },
                }}
                InputLabelProps={{ shrink: true, ...inputLabelProps }}
                inputProps={inputProps}
              />
            </FormControl>
          </Box>
        )}
        {monthlyOption === "byWeek" && formData.nthWeekdays?.map((w) => (
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }} key={`${w.weekday}-${w.nth}`}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "#777280",
                borderRadius: "8px",
                p: 2,
                color: "#F6F4FE",
                bgcolor: "rgba(121,121,121,0.2)",
                display: "flex",
                alignItems: 'center',
                flexWrap: { xs: "wrap", lg: "nowrap" },
                gap: 2,
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1, textAlign: "center" }}>
                {w.nth === -1
                  ? `Last ${daysOfWeek[w.weekday]?.label ?? w.weekday}`
                  : `${["First", "Second", "Third", "Fourth", "Fifth"][w.nth - 1]} ${daysOfWeek[w.weekday]?.label ?? w.weekday} Of Each Month`}
              </Typography>
              <TextField
                type="time"
                label="Start Time"
                fullWidth
                value={w.startTime || ""}
                onChange={(e) => handleMonthlyWeekdayTimeChange(w.weekday, w.nth, "startTime", e.target.value)}
                InputLabelProps={{ shrink: true, ...inputLabelProps }}
                inputProps={inputProps}
                sx={{
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-root": {
                    color: "#F6F4FE",
                    "& fieldset": { borderColor: "#F6F4FE" },
                    "&:hover fieldset": { borderColor: "#F6F4FE" },
                    "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                    "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                  },
                  "& .MuiInputBase-input": {
                    color: "#F6F4FE",
                    "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                  },
                }}
              />
              <TextField
                type="time"
                label="End Time"
                fullWidth
                value={w.endTime || ""}
                onChange={(e) => handleMonthlyWeekdayTimeChange(w.weekday, w.nth, "endTime", e.target.value)}
                InputLabelProps={{ shrink: true, ...inputLabelProps }}
                inputProps={inputProps}
                sx={{
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-root": {
                    color: "#F6F4FE",
                    "& fieldset": { borderColor: "#F6F4FE" },
                    "&:hover fieldset": { borderColor: "#F6F4FE" },
                    "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                    "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                  },
                  "& .MuiInputBase-input": {
                    color: "#F6F4FE",
                    "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                  },
                }}
              />
            </Box>
          </Grid>
        ))}
        {formData.recurrenceType === "custom" && (
          <Grid container spacing={2} sx={{ border: "1px solid", borderColor: "#777280", borderRadius: "8px", p: 2, color: "#F6F4FE", bgcolor: "rgba(121,121,121,0.2)", mb: 2 }}>
            <p>Selected Dates</p>
            {formData.customRecurrenceDates?.map((d, index) => (
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }} key={d.date}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "#777280",
                    borderRadius: "8px",
                    p: 2,
                    color: "#F6F4FE",
                    bgcolor: "rgba(121,121,121,0.2)",
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    alignItems: { xs: "flex-start", lg: "center" },
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <Typography>{dayjs(d.date).format("MMMM DD, YYYY")}</Typography>
                    <Box sx={{ display: { xs: "block", lg: "none" } }}>
                      <IconButton
                        onClick={() => setFormData((prev) => ({
                          ...prev,
                          customRecurrenceDates: prev.customRecurrenceDates?.filter((_, i) => i !== index) || [],
                        }))}
                        sx={{ color: "#F6F4FE", "&:hover": { color: "#FF6B6B" } }}
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  </Box>
                  <TextField
                    label="Start Time"
                    type="time"
                    fullWidth
                    value={d.startTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => {
                        const updated = [...(prev.customRecurrenceDates || [])];
                        updated[index] = { ...updated[index], startTime: value };
                        return { ...prev, customRecurrenceDates: updated };
                      });
                    }}
                    sx={{
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-root": {
                        color: "#F6F4FE",
                        "& fieldset": { borderColor: "#F6F4FE" },
                        "&:hover fieldset": { borderColor: "#F6F4FE" },
                        "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                        "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                      },
                      "& .MuiInputBase-input": {
                        color: "#F6F4FE",
                        "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                      },
                    }}
                    InputLabelProps={{ shrink: true, ...inputLabelProps }}
                    inputProps={inputProps}
                  />
                  <TextField
                    label="End Time"
                    type="time"
                    fullWidth
                    value={d.endTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => {
                        const updated = [...(prev.customRecurrenceDates || [])];
                        updated[index] = { ...updated[index], endTime: value };
                        return { ...prev, customRecurrenceDates: updated };
                      });
                    }}
                    sx={{
                      borderRadius: "8px",
                      "& .MuiOutlinedInput-root": {
                        color: "#F6F4FE",
                        "& fieldset": { borderColor: "#F6F4FE" },
                        "&:hover fieldset": { borderColor: "#F6F4FE" },
                        "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                        "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                      },
                      "& .MuiInputBase-input": {
                        color: "#F6F4FE",
                        "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                      },
                    }}
                    InputLabelProps={{ shrink: true, ...inputLabelProps }}
                    inputProps={inputProps}
                  />
                  <Box sx={{ display: { xs: "none", lg: "block" } }}>
                    <IconButton
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        customRecurrenceDates: prev.customRecurrenceDates?.filter((_, i) => i !== index) || [],
                      }))}
                      sx={{ color: "#F6F4FE", "&:hover": { color: "#FF6B6B" } }}
                    >
                      <Close />
                    </IconButton>
                  </Box>
                </Box>
              </Grid>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <IconButton
                onClick={() => setCalendarOpen(true)}
                sx={{ color: "#F6F4FE", bgcolor: "#2C2C2C", borderRadius: 2, "&:hover": { bgcolor: "#3a3a3a" } }}
              >
                <Add />
              </IconButton>
            </Box>
          </Grid>
        )}
        {formData.recurrenceType !== "custom" && !(formData.recurrenceType === "monthly" && monthlyOption === "byDate") && (
          <Grid size={{ xs: 12, sm: 12 }} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Start Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              variant="outlined"
              disabled={loading}
              InputLabelProps={{ shrink: true, ...inputLabelProps }}
              inputProps={inputProps}
              sx={{
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": {
                  color: "#F6F4FE",
                  "& fieldset": { borderColor: "#F6F4FE" },
                  "&:hover fieldset": { borderColor: "#F6F4FE" },
                  "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                  "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                },
                "& .MuiInputBase-input": {
                  color: "#F6F4FE",
                  "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                },
              }}
            />
          </Grid>
        )}
        {(formData.recurrenceType === "none" || (formData.recurrenceType === "monthly" && monthlyOption === "byDate")) && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                    "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                  },
                  "& .MuiInputBase-input": {
                    color: "#F6F4FE",
                    "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                  },
                }}
                InputLabelProps={{ shrink: true, ...inputLabelProps }}
                inputProps={inputProps}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-root": {
                    color: "#F6F4FE",
                    "& fieldset": { borderColor: "#F6F4FE" },
                    "&:hover fieldset": { borderColor: "#F6F4FE" },
                    "&.Mui-focused fieldset": { borderColor: "#4B8DF8" },
                    "&.Mui-disabled": { color: "#777280", "& fieldset": { borderColor: "transparent" } },
                  },
                  "& .MuiInputBase-input": {
                    color: "#F6F4FE",
                    "&::-webkit-calendar-picker-indicator": { filter: "invert(1)", cursor: "pointer" },
                  },
                }}
                InputLabelProps={{ shrink: true, ...inputLabelProps }}
                inputProps={inputProps}
              />
            </Grid>
          </>
        )}
        {["weekly", "monthly"].includes(formData.recurrenceType) && (
          <Grid size={{ xs: 12, sm: 12 }} sx={{ mt: 2 }}>
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
                  '&.Mui-disabled': { color: '#777280', '& fieldset': { borderColor: 'transparent' } },
                },
                '& .MuiInputBase-input': {
                  color: '#F6F4FE',
                  '&::-webkit-calendar-picker-indicator': { filter: 'invert(1)', cursor: 'pointer' },
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

  const renderMonthlyModal = () => {
    if (!formData.date || formData.recurrenceType !== "monthly") return null;
    const selectedDate = moment(formData.date);
    const dayNum = selectedDate.date();
    const weekday = selectedDate.day();
    let weekOrdinal = Math.ceil(dayNum / 7);
    const daysInMonth = selectedDate.daysInMonth();
    const lastWeek = Math.ceil(daysInMonth / 7);
    if (weekOrdinal === lastWeek) weekOrdinal = -1;
    const byDateLabel = `${dayNum}${getOrdinalSuffix(dayNum)} of each month`;
    const byWeekLabel = `${weekOrdinal === -1 ? "Last" : ["First", "Second", "Third", "Fourth", "Fifth"][weekOrdinal - 1]} ${daysOfWeek[weekday]?.label ?? weekday} of each month`;
    return (
      <Dialog
        open={monthlyModalOpen}
        onClose={() => setMonthlyModalOpen(false)}
        sx={{ "& .MuiDialog-paper": { borderRadius: 2, bgcolor: "#2C2C2C", py: 3, px: 2 } }}
      >
        <DialogTitle color="#F6F4FE">Choose Monthly Recurrence</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={monthlyOption}
            onChange={(e) => {
              const value = e.target.value as "byDate" | "byWeek";
              setMonthlyOption(value);
              if (value === "byWeek") {
                handleAddNthWeekday(weekday, weekOrdinal);
              }
            }}
          >
            <FormControlLabel value="byDate" sx={{ color: "#F6F4FE" }} control={<Radio color="default" />} label={byDateLabel} />
            <FormControlLabel value="byWeek" sx={{ color: "#F6F4FE" }} control={<Radio color="default" />} label={byWeekLabel} />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleConfirmMonthly}
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
        <InputLabel id="collection-label" sx={inputLabelProps.sx}>Collections of this Branch</InputLabel>
        <Select
          labelId="collection-label"
          name="collectionIds"
          multiple
          value={formData.collectionIds}
          onChange={handleCollectionChange}
          label="Collections"
          open={selectOpen}
          onOpen={() => setSelectOpen(true)}
          onClose={() => { setSelectOpen(false); setTempNewCollection(""); }}
          renderValue={(selected) =>
            selected.filter(id => id).map((id) => collections.find((col) => col.id === id)?.name || id).join(", ")
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
          <Box sx={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'flex-end', p: 1, borderBottom: '1px solid #777280', width: '100%', boxSizing: 'border-box' }}>
            <IconButton size="small" onClick={() => setSelectOpen(false)} sx={{ color: "#2C2C2C", backgroundColor: 'transparent !important' }} aria-label="Close menu">
              <Close fontSize="small" />
            </IconButton>
          </Box>
          {fetchingCollections ? (
            <MenuItem disabled>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 1 }}>Loading collections...</Typography>
            </MenuItem>
          ) : fetchCollectionsError ? (
            <MenuItem sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ mr: 1 }}>{fetchCollectionsError}</Typography>
              <IconButton
                size="small"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchCollections(setCollections, setFetchingCollections, setFetchCollectionsError, formData.branchId || authData?.branchId);
                }}
              >
                <Refresh fontSize="small" sx={{ color: "#2C2C2C" }} />
              </IconButton>
            </MenuItem>
          ) : collections.length > 0 ? (
            collections.map((col) => (
              <MenuItem key={col.id} value={col.id} sx={{ width: '100%', boxSizing: 'border-box' }}>
                <Checkbox checked={formData.collectionIds.includes(col.id)} sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />
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
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Add New Collection</Typography>
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
                sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" } }}
                inputProps={{ autoComplete: "new-password", form: { autoComplete: "off" } }}
              />
              <IconButton
                onClick={(e) => { e.stopPropagation(); handleAddCollection(); }}
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
                {addingCollection ? <CircularProgress size={16} sx={{ color: "#F6F4FE" }} /> : <Add fontSize="small" />}
              </IconButton>
            </Box>
          </Box>
        </Select>
      </FormControl>
    </Grid>
  );

  const renderBranchInput = () => (
    <Grid size={{ xs: 12 }}>
      <FormControl fullWidth variant="outlined" disabled={loading}>
        <InputLabel id="branch-label" sx={inputLabelProps.sx}>Expected Branch</InputLabel>
        <Select
          labelId="branch-label"
          name="branchId"
          value={formData.branchId || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, branchId: e.target.value }))}
          open={branchSelectOpen}
          onOpen={() => setBranchSelectOpen(true)}
          onClose={() => setBranchSelectOpen(false)}
          sx={{
            fontSize: isLargeScreen ? "1rem" : undefined,
            color: "#F6F4FE",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            "& .MuiSelect-select": { borderColor: "#777280", color: "#F6F4FE" },
            "& .MuiSelect-icon": { color: "#F6F4FE" },
          }}
          MenuProps={{ PaperProps: { sx: { maxHeight: 350 } } }}
        >
          <Box sx={{ position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "flex-end", p: 1, borderBottom: "1px solid #777280", backgroundColor: "#fff" }}>
            <IconButton size="small" onClick={() => setBranchSelectOpen(false)} sx={{ color: "#2C2C2C" }} aria-label="Close menu">
              <Close fontSize="small" />
            </IconButton>
          </Box>
          {fetchingBranch ? (
            <MenuItem disabled>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                <CircularProgress size={20} />
                <Typography sx={{ ml: 1 }} variant="body2">Loading branches...</Typography>
              </Box>
            </MenuItem>
          ) : fetchBranchesError ? (
            <MenuItem sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ mr: 1 }}>{fetchBranchesError}</Typography>
              <IconButton
                size="small"
                color="inherit"
                onClick={(e) => { e.stopPropagation(); fetchBranches(setBranches, setFetchingBranch, setFetchBranchesError); }}
              >
                <Refresh fontSize="small" sx={{ color: "#2C2C2C" }} />
              </IconButton>
            </MenuItem>
          ) : branches.length > 0 ? (
            branches.map((branch: any) => (
              <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
            ))
          ) : (
            <MenuItem disabled><Typography variant="body2">No branches available</Typography></MenuItem>
          )}
        </Select>
      </FormControl>
    </Grid>
  );

  const renderDepartmentInput = () => {
    const allSelected = departments.length > 0 && formData.departmentIds.length === departments.length;
    return (
      <Grid size={{ xs: 12 }}>
        <FormControl fullWidth variant="outlined" disabled={loading || !formData.branchId}>
          <InputLabel id="department-label" sx={inputLabelProps.sx}>Expected Departments</InputLabel>
          <Select
            labelId="department-label"
            name="departmentIds"
            multiple
            value={formData.departmentIds}
            onChange={handleDepartmentChange}
            renderValue={(selected) =>
              (selected as string[]).map((id) => departments.find((dept) => dept.id === id)?.name || id).join(", ")
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
            MenuProps={{ PaperProps: { sx: { maxHeight: 350 } } }}
          >
            <Box sx={{ position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "flex-end", p: 1, borderBottom: "1px solid #777280", backgroundColor: "#fff" }}>
              <IconButton size="small" onClick={() => setDepartmentSelectOpen(false)} sx={{ color: "#2C2C2C" }} aria-label="Close menu">
                <Close fontSize="small" />
              </IconButton>
            </Box>
            {departments.length > 0 && (
              <MenuItem value="all">
                <Checkbox
                  checked={allSelected}
                  indeterminate={formData.departmentIds.length > 0 && formData.departmentIds.length < departments.length}
                  sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }}
                />
                <ListItemText primary="Select All" />
              </MenuItem>
            )}
            {fetchingDepartments ? (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
                  <CircularProgress size={20} />
                  <Typography sx={{ ml: 1 }} variant="body2">Loading departments...</Typography>
                </Box>
              </MenuItem>
            ) : fetchDepartmentsError ? (
              <MenuItem sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 1 }}>{fetchDepartmentsError}</Typography>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => { e.stopPropagation(); fetchDepartments(setDepartments, setFetchingDepartments, setFetchDepartmentsError, formData.branchId); }}
                >
                  <Refresh fontSize="small" sx={{ color: '#2C2C2C' }} />
                </IconButton>
              </MenuItem>
            ) : departments.length > 0 ? (
              departments.map((dept: any) => (
                <MenuItem key={dept.id} value={dept.id}>
                  <Checkbox checked={formData.departmentIds.includes(dept.id)} sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />
                  <ListItemText primary={dept.type ? `${dept.name} - (${dept.type})` : dept.name} />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled><Typography variant="body2">No departments available</Typography></MenuItem>
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
      sx={{ "& .MuiDialog-paper": { borderRadius: 2, bgcolor: "#2C2C2C", py: 3, px: 2 } }}
    >
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
          <Box sx={{ display: "flex", justifyContent: "center", color: 'gray.400', alignItems: "center", height: "200px" }}>
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
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                  InputLabelProps={{
                    sx: { color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" }, fontSize: isMobile ? "0.875rem" : "1rem" },
                  }}
                  required
                />
              </Grid>
              {!isEdit && renderProgramType()}
              {renderDateTimeInputs()}
              {renderBranchInput()}
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
        <CustomCalendarDialog
          formData={formData}
          setFormData={setFormData}
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={isEdit ? handleEdit : handleCreate}
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

export const CreateProgramModal: React.FC<ProgramModalProps> = (props) => (
  <ProgramModal {...props} isEdit={false} />
);

export const EditProgramModal: React.FC<ProgramModalProps> = (props) => (
  <ProgramModal {...props} isEdit={true} />
);