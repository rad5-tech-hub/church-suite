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
  List,
  ListItem,
  ListItemSecondaryAction,
} from "@mui/material";
import { CachedOutlined, CalendarTodayOutlined, Add, Delete, Close } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import moment from "moment";

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
  _id: string;
  name: string;
}

interface Collection {
  _id: string;
  name: string;
}

interface CreateProgramModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

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
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [tempNewCollection, setTempNewCollection] = useState("");
  const [selectOpen, setSelectOpen] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setFetchingDepartments(true);
        setFetchDepartmentsError(null);
        const response = await Api.get("/church/get-departments");
        setDepartments(response.data.departments || []);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        setFetchDepartmentsError("Failed to load departments. Please try again.");
      } finally {
        setFetchingDepartments(false);
      }
    };

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
    if (formData.recurrenceType !== "custom") {
      setCustomDates([]);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | string[]>
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
    const { value } = event.target;
    const selectedIds = typeof value === "string" ? value.split(",") : value;
    setFormData((prev) => ({
      ...prev,
      departmentIds: selectedIds,
    }));
    setCreateProgramError(null);
  };

  const handleCollectionChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    const selectedIds = typeof value === "string" ? value.split(",") : value;
    setFormData((prev) => ({
      ...prev,
      collectionIds: selectedIds,
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

  const handleAddCustomDate = (newDate: string) => {
    if (!newDate || isNaN(new Date(newDate).getTime())) {
      setCreateProgramError("Invalid date format.");
      return;
    }
    if (customDates.includes(newDate)) {
      setCreateProgramError("Date already selected.");
      return;
    }
    const newCustomDates = [...customDates, newDate];
    setCustomDates(newCustomDates);
    setFormData((prev) => ({ ...prev, customRecurrenceDates: newCustomDates }));
  };

  const handleRemoveCustomDate = (dateToRemove: string) => {
    const newCustomDates = customDates.filter((date) => date !== dateToRemove);
    setCustomDates(newCustomDates);
    setFormData((prev) => ({ ...prev, customRecurrenceDates: newCustomDates }));
  };

  const handleCustomClick = () => {
    setFormData((prev) => ({ ...prev, recurrenceType: "custom" }));
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

  const handleAddService = async () => {
    if (!formData.title.trim()) {
      setCreateProgramError("Program title is required.");
      return;
    }

    try {
      setLoading(true);
      setCreateProgramError(null);
      let payload: any = { ...formData };

      if (formData.recurrenceType === "none") {
        const startDateTime = moment(`${formData.date} ${formData.startTime}`).toISOString();
        const endDateTime = moment(`${formData.date} ${formData.endTime}`).toISOString();
        payload = {
          ...payload,
          startDateTime,
          endDateTime,
          date: undefined,
          startTime: undefined,
          endTime: undefined,
        };
      }

      if (["weekly", "monthly"].includes(formData.recurrenceType) && !formData.endDate) {
        const defaultEndDate = moment(formData.date).add(3, "months").format("YYYY-MM-DD");
        payload.endDate = defaultEndDate;
      }

      if (formData.recurrenceType === "weekly") {
        const startDateStr = moment(formData.date).format("YYYY-MM-DD");
        payload.date = startDateStr;
      }

      if (formData.recurrenceType === "monthly" && monthlyOption === "byDate") {
        const selectedDate = moment(formData.date);
        const dayNum = selectedDate.date();
        payload.recurrenceType = "monthly";
        payload.nthWeekdays = [{ weekday: selectedDate.day(), nth: Math.ceil(dayNum / 7) }];
      }

      const response = await Api.post("/church/create-event", payload);

      setCreateProgramError(
        `Program "${response.data.event?.title || formData.title}" created successfully!`
      );
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Program creation error:", error);
      setCreateProgramError(
        error.response?.data?.message || "Failed to create program. Please try again."
      );
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
    });
    setMonthlyOption("byDate");
    setSelectedWeekdays([]);
    setNthWeekdays([]);
    setCustomDates([]);
    setTempNewCollection("");
    setSelectOpen(false);
    setCreateProgramError(null);
    onClose();
  };

  const renderProgramType = () => (
    <Grid size={{ xs: 12 }} spacing={2}>
      <FormLabel id="program-type-label" sx={{ fontSize: "0.9rem", color: "#F6F4FE" }}>
        <Box className="flex items-center justify-between">
          <Box>Program Type</Box>
          <Box
            sx={{
              color: formData.recurrenceType === "custom" ? "#F6F4FE" : "#788280",
              "&:hover": { color: "#F6F4FE", opacity: 0.9, textDecoration: "none" },
              cursor: "pointer",
            }}
            onClick={handleCustomClick}
            role="button"
            aria-label="Select Custom Recurrence"
          >
            Custom
          </Box>
        </Box>
      </FormLabel>
      <RadioGroup
        row
        sx={{ display: "flex", justifyContent: "space-around", mt: 1, color: "#F6F4FE" }}
        aria-labelledby="program-type-label"
        name="recurrenceType"
        value={formData.recurrenceType === "custom" ? "" : formData.recurrenceType}
        onChange={handleChange}
        color="default"
      >
        {[
          { value: "none", label: "Single", icon: <CalendarTodayOutlined fontSize="small" /> },
          { value: "weekly", label: "Weekly", icon: <CachedOutlined fontSize="small" /> },
          { value: "monthly", label: "Monthly", icon: <CachedOutlined fontSize="small" /> },
        ].map(({ value, label, icon }) => (
          <FormControlLabel
            key={value}
            value={value}
            control={<Radio sx={{ ml: 2 }} />}
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {icon}
                <Typography sx={{ ml: 1 }}>{label}</Typography>
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
            color="default"
          />
        ))}
      </RadioGroup>
    </Grid>
  );

  const renderDateTimeInputs = () => {
    let dateInput;
    if (formData.recurrenceType === "weekly") {
      dateInput = (
        <FormControl fullWidth variant="outlined">
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
      );
    } else if (formData.recurrenceType === "custom") {
      dateInput = (
        <Box>
          <TextField
            fullWidth
            label="Add Custom Date"
            type="date"
            onChange={(e) => handleAddCustomDate(e.target.value)}
            variant="outlined"
            disabled={loading}
            InputLabelProps={{ shrink: true, ...inputLabelProps }}
            inputProps={inputProps}
          />
          <List sx={{ maxHeight: 150, overflow: "auto" }}>
            {customDates.map((date, index) => (
              <ListItem key={index} sx={{ color: "#F6F4FE", border: "0.5px solid #777280", borderRadius: 1 }}>
                <ListItemText primary={moment(date).format("MMMM D, YYYY")} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveCustomDate(date)}
                    disabled={loading}
                    sx={{ color: "#F6F4FE" }}
                    aria-label={`Remove date ${moment(date).format("MMMM D, YYYY")}`}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      );
    } else {
      dateInput = (
        <TextField
          fullWidth
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleDateChange}
          variant="outlined"
          disabled={loading}
          InputLabelProps={{ shrink: true, ...inputLabelProps }}
          inputProps={inputProps}
        />
      );
    }

    return (
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>{dateInput}</Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              variant="outlined"
              disabled={loading}
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
              value={formData.endTime}
              onChange={handleChange}
              variant="outlined"
              disabled={loading}
              InputLabelProps={{ shrink: true, ...inputLabelProps }}
              inputProps={inputProps}
            />
          </Grid>
          {["weekly", "monthly"].includes(formData.recurrenceType) && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate || ""}
                onChange={handleChange}
                variant="outlined"
                disabled={loading}
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
              .map((id) => collections.find((col) => col._id === id)?.name || id)
              .join(", ")
          }
          sx={{
            fontSize: isLargeScreen ? "1rem" : undefined,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
          }}
          MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
        >
          {fetchingCollections ? (
            <MenuItem disabled>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 1 }}>Loading collections...</Typography>
            </MenuItem>
          ) : fetchCollectionsError ? (
            <MenuItem disabled>
              <Typography>{fetchCollectionsError}</Typography>
            </MenuItem>
          ) : collections.length > 0 ? (
            collections.map((col) => (
              <MenuItem key={col._id} value={col._id}>
                <Checkbox checked={formData.collectionIds.includes(col._id)} />
                <ListItemText primary={col.name} />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography>No collections available</Typography>
            </MenuItem>
          )}
          <Divider />
          <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              autoFocus
              value={tempNewCollection}
              onChange={(e) => setTempNewCollection(e.target.value)}
              placeholder="Enter new collection"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  handleAddCollection();
                }
              }}
              disabled={addingCollection}
              sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" } }}
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
              }}
            >
              {addingCollection ? (
                <CircularProgress size={16} sx={{ color: "#F6F4FE" }} />
              ) : (
                <Add fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Select>
      </FormControl>
    </Grid>
  );

  const renderDepartmentInput = () => (
    <Grid size={{ xs: 12 }}>
      <FormControl fullWidth variant="outlined" disabled={loading || fetchingDepartments}>
        <InputLabel id="department-label" sx={inputLabelProps.sx}>
          Expected Departments
        </InputLabel>
        <Select
          labelId="department-label"
          name="departmentIds"
          multiple
          value={formData.departmentIds}
          onChange={handleDepartmentChange}
          label="Expected Departments"
          renderValue={(selected) =>
            selected
              .map((id) => departments.find((dept) => dept._id === id)?.name || id)
              .join(", ")
          }
          sx={{
            fontSize: isLargeScreen ? "1rem" : undefined,
            color: "#F6F4FE",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            "& .MuiSelect-select": { borderColor: "#777280", color: "#F6F4FE" },
          }}
          MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
        >
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
            <MenuItem disabled>
              <Typography variant="body2">{fetchDepartmentsError}</Typography>
            </MenuItem>
          ) : departments.length > 0 ? (
            departments.map((dept) => (
              <MenuItem key={dept._id} value={dept._id}>
                <Checkbox checked={formData.departmentIds.includes(dept._id)} />
                <ListItemText primary={dept.name} />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2">No departments available</Typography>
            </MenuItem>
          )}
        </Select>
        {fetchDepartmentsError && !fetchingDepartments && (
          <Typography variant="body2" color="error" sx={{ mt: 1, display: "flex", alignItems: "center" }}>
            <Box component="span" sx={{ mr: 1 }}>
              ⚠️
            </Box>
            {fetchDepartmentsError}
          </Typography>
        )}
      </FormControl>
    </Grid>
  );

  return (
    <Dialog
      open={open}
      onClose={resetForm}
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
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="#F6F4FE" fontWeight={600}>
            Create Program
          </Typography>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
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
            {renderProgramType()}
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
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={handleAddService}
          disabled={loading}
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
              Creating...
            </>
          ) : (
            "Create Program"
          )}
        </Button>
      </DialogActions>

      {renderMonthlyModal()}
    </Dialog>
  );
};

export default CreateProgramModal;