import React, { useState, useEffect } from "react";
// import { useSelector } from "react-redux";
import { toast } from "react-toastify";
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
import { CachedOutlined, CalendarTodayOutlined, Add } from "@mui/icons-material";
import Api from "../../../shared/api/api";
// import { RootState } from "../../../reduxstore/redux";
import moment from "moment";

interface ServiceFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string[];
  recurrenceType: string;
  collection: string;
}

interface Department {
  _id: string;
  name: string;
}

// interface AuthData {
//   church_name?: string;
//   isSuperAdmin?: boolean;
// }

interface CreateProgramModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  // Hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  // const authData = useSelector((state: RootState & { auth?: { authData?: AuthData } }) =>
  //   state.auth?.authData
  // );

  // State
  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    department: [],
    recurrenceType: "none",
    collection: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [collections, setCollections] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState<boolean>(true);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);
  const [monthlyOption, setMonthlyOption] = useState<"byDate" | "byWeek">("byDate");

  // Fetch departments and collections on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setFetchingDepartments(true);
        const response = await Api.get("/church/get-departments");
        setDepartments(response.data.departments || []);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Failed to load departments. Please try again.", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
      } finally {
        setFetchingDepartments(false);
      }
    };

    const fetchCollections = async () => {
      try {
        const response = await Api.get("/collection/get-collections");
        const fetchedCollections = response.data.collections || [];
        setCollections([...fetchedCollections, "No Collection"]);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
        setCollections(["No Collection"]);
      }
    };

    if (open) {
      fetchDepartments();
      fetchCollections();
    }
  }, [open, isMobile]);

  useEffect(() => {
    if (formData.recurrenceType !== "monthly") {
      setMonthlyOption("byDate");
    }
  }, [formData.recurrenceType]);


  const inputProps = {
    sx: { fontSize: isLargeScreen ? "0.875rem" : undefined, utlineColor: "#777280",
      borderColor: "#777280",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#777280",
      },    },
  };

  const inputLabelProps = {
    sx: { fontSize: isLargeScreen ? "0.875rem" : undefined,  color: "#F6F4FE", // This changes the label color
      "&.Mui-focused": {
        color: "#F6F4FE", // Keeps the same color when focused (optional)
      }, },
  };   

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | string[]>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as keyof ServiceFormData]: value,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    if (formData.recurrenceType === "monthly" && e.target.value) {
      setMonthlyModalOpen(true);
    }
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      department: typeof value === "string" ? value.split(",") : value,
    }));
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

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Program title is required.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return false;
    }

    if (formData.recurrenceType === "weekly" && !daysOfWeek.includes(formData.date)) {
      toast.error("Please select a day of the week.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return false;
    }

    if (
      formData.recurrenceType !== "weekly" &&
      (!formData.date || isNaN(new Date(formData.date).getTime()))
    ) {
      toast.error("Invalid date format.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return false;
    }

    if (!formData.collection) {
      toast.error("Please select a collection.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return false;
    }

    return true;
  };

  const handleAddService = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      let payload = { ...formData };

      if (formData.recurrenceType === "weekly") {
        const daysMap: { [key: string]: number } = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };
        const targetDay = daysMap[formData.date];
        const now = moment();
        let diff = targetDay - now.day();
        if (diff <= 0) diff += 7;
        const startDateStr = now.add(diff, "days").format("YYYY-MM-DD");
        payload.date = startDateStr;
      }

      if (formData.recurrenceType === "monthly") {
        const selectedDate = moment(formData.date);
        const dayNum = selectedDate.date();
        if (monthlyOption === "byDate") {
          payload.recurrenceType = `monthly;BYMONTHDAY=${dayNum}`;
        } else {
          const weekday = selectedDate.format("dddd");
          let weekOrdinal = Math.ceil(dayNum / 7);
          const weekdayAbbr = weekday.slice(0, 2).toUpperCase();
          const daysInMonth = selectedDate.daysInMonth();
          const lastWeek = Math.ceil(daysInMonth / 7);
          let nth = weekOrdinal;
          if (weekOrdinal === lastWeek) {
            nth = -1;
          }
          payload.recurrenceType = `monthly;BYDAY=${nth}${weekdayAbbr}`;
        }
      }

      const response = await Api.post("/church/create-event", payload);

      toast.success(
        response.data.message ||
          `Program "${response.data.event?.title || formData.title}" created successfully!`,
        {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        }
      );

      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Program creation error:", error);
      toast.error(
        error.response?.data?.message || "Failed to create program. Please try again.",
        {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        }
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
      department: [],
      recurrenceType: "none",
      collection: "",
    });
    setMonthlyOption("byDate");
    onClose();
  };

  // Render Components
  const renderProgramType = () => (
    <Grid size={{ xs: 12 }} spacing={2}>
      <FormLabel id="program-type-label" sx={{ fontSize: "0.9rem" , color: '#F6F4FE'}}>
        Program Type
      </FormLabel>
      <RadioGroup
        row
        sx={{ display: "flex", justifyContent: "space-around", mt: 1, color: '#F6F4FE' }}
        aria-labelledby="program-type-label"
        name="recurrenceType"
        value={formData.recurrenceType}
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
        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="day-of-week-label" sx={inputLabelProps.sx}>
            Day of the Week
          </InputLabel>
          <Select
            labelId="day-of-week-label"
            name="date"
            value={formData.date}
            onChange={handleChange}
            label="Day of the Week"         
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,                
              color: "#F6F4FE",
              outlineColor: "#777280",
              borderColor: "#777280",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#777280",
              },
              "& .MuiSelect-select": {
                  borderColor: "#777280",
                  color: "#F6F4FE",
              },              
            }}
            inputProps={{
              sx: {
                fontSize: isLargeScreen ? "1rem" : undefined,
                color: "#F6F4FE",                    
                outlineColor: "#777280",
                borderColor: "#777280",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#777280",
                },                    
              },
            }}
          >
            {daysOfWeek.map((day) => (
              <MenuItem key={day} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
          InputProps={inputProps}
          inputProps={{
            sx: {
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",                    
              outlineColor: "#777280",
              borderColor: "#777280",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#777280",
              },                    
            },
          }}
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
              InputProps={inputProps}
              sx={{color: '#F6F4FE'}}
              inputProps={{
                sx: {
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  color: "#F6F4FE",                    
                  outlineColor: "#777280",
                  borderColor: "#777280",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },                    
                },
              }}
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
              InputProps={inputProps}
              inputProps={{
                sx: {
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  color: "#F6F4FE",                    
                  outlineColor: "#777280",
                  borderColor: "#777280",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },                    
                },
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    );
  };

  const renderCollectionInput = () => {
    const [showAddCollection, setShowAddCollection] = useState(false);
    const [tempNewCollection, setTempNewCollection] = useState("");
    const [selectOpen, setSelectOpen] = useState(false);

    const handleAddCollection = () => {
      if (tempNewCollection.trim() === "") {
        toast.error("Collection name cannot be empty.", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }
      if (collections.includes(tempNewCollection.trim())) {
        toast.error("Collection already exists.", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }

      const updatedCollections = [
        ...collections.filter((c) => c !== "No Collection"),
        tempNewCollection.trim(),
        "No Collection",
      ];
      setCollections(updatedCollections);
      setFormData((prev) => ({ ...prev, collection: tempNewCollection.trim() }));
      setTempNewCollection("");
      setShowAddCollection(false);
      setSelectOpen(false);
      toast.success("Collection added successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    };

    return (
      <Grid size={{ xs: 12 }}>
        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="collection-label" sx={inputLabelProps.sx}>
            Collection
          </InputLabel>
          <Select
            labelId="collection-label"
            name="collection"
            value={formData.collection}
            onChange={handleChange}
            label="Collection"
            open={selectOpen}
            onOpen={() => setSelectOpen(true)}
            onClose={() => {
              if (showAddCollection) return; // Prevent closing when adding
              setSelectOpen(false);
              setShowAddCollection(false);
              setTempNewCollection("");
            }}
            sx={{
              fontSize: isLargeScreen ? "1rem" : undefined,
              color: "#F6F4FE",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#777280",
              },
              "& .MuiSelect-select": {
                borderColor: "#777280",
                color: "#F6F4FE",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 300,
                },
              },
            }}
          >
            {collections.map((collection) => (
              <MenuItem key={collection} value={collection}>
                {collection}
              </MenuItem>
            ))}
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
                    e.stopPropagation(); // Prevent menu from closing
                    handleAddCollection();
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },
                }}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation(); // Prevent menu from closing
                  handleAddCollection();
                }}
                disabled={!tempNewCollection.trim()}
                size="small"
                sx={{ color: "#F6F4FE", backgroundColor: '#2C2C2C', borderRadius: 1, 
                  "&:hover": { backgroundColor: "#2C2C2C", color: "#F6F4FE",opacity: 0.8 }
                 }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderDepartmentInput = () => (
    <Grid size={{ xs: 12 }}>
      <FormControl fullWidth variant="outlined" disabled={loading}>
        <InputLabel id="department-label" sx={inputLabelProps.sx}>
          Expected Departments
        </InputLabel>
        <Select
          labelId="department-label"
          name="department"
          multiple
          value={formData.department}
          onChange={handleDepartmentChange}
          label="Expected Departments"
          renderValue={(selected) => selected.join(", ")}
          sx={{
            fontSize: isLargeScreen ? "1rem" : undefined,                
            color: "#F6F4FE",
            outlineColor: "#777280",
            borderColor: "#777280",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#777280",
            },
            "& .MuiSelect-select": {
                borderColor: "#777280",
                color: "#F6F4FE",
            },              
          }}
        >
          {fetchingDepartments ? (
            <MenuItem disabled>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 1 }}>Loading departments...</Typography>
            </MenuItem>
          ) : departments.length > 0 ? (
            departments.map((dept) => (
              <MenuItem key={dept._id} value={dept.name}>
                <Checkbox checked={formData.department.indexOf(dept.name) > -1} />
                <ListItemText primary={dept.name} />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography>No departments available</Typography>
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </Grid>
  );

  const renderMonthlyModal = () => {
    if (!formData.date || formData.recurrenceType !== "monthly") return null;
    const selectedDate = moment(formData.date);
    const dayNum = selectedDate.date();
    const weekday = selectedDate.format("dddd");
    let weekOrdinal = Math.ceil(dayNum / 7);
    let ordinalStr = ["First", "Second", "Third", "Fourth", "Fifth"][weekOrdinal - 1];
    const daysInMonth = selectedDate.daysInMonth();
    const lastWeek = Math.ceil(daysInMonth / 7);
    if (weekOrdinal === lastWeek) {
      ordinalStr = "Last";
    }
    const byDateLabel = `${dayNum}${getOrdinalSuffix(dayNum)} of each month`;
    const byWeekLabel = `${ordinalStr} ${weekday} of each month`;

    return (
      <Dialog
        open={monthlyModalOpen}
        onClose={() => setMonthlyModalOpen(false)}
         sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            py: 3,
            px: 2
          }
        }}
      >
        <DialogTitle color="#F6F4FE">Choose Monthly Recurrence</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={monthlyOption}
            onChange={(e) => setMonthlyOption(e.target.value as "byDate" | "byWeek")}
          >
            <FormControlLabel value="byDate" sx={{color: '#F6F4FE'}} control={<Radio color="default"/>} label={byDateLabel} />
            <FormControlLabel value="byWeek" sx={{color: '#F6F4FE'}} control={<Radio color="default"/>} label={byWeekLabel} />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMonthlyModalOpen(false)} 
             sx={{
                py: 1,
                backgroundColor: "#F6F4FE",
                px: { xs: 2, sm: 2 },
                borderRadius: 50,
                color: "#2C2C2C",
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "#F6F4FE",
                  opacity: 0.9,
                },
              }}
            >Confirm</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Dialog open={open} onClose={resetForm} fullWidth maxWidth='md'  sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            py: 3,
            px: 2
          }
        }}>
      <DialogTitle>
        <Typography
          variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
          component="h1"
          fontWeight={600}
          sx={{ color: "#F6F4FE"}}
        >
          Create Program
        </Typography>
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
                InputLabelProps={inputLabelProps}
                InputProps={inputProps}
                inputProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
                required
              />
            </Grid>

            {renderProgramType()}
            {renderDateTimeInputs()}
            {renderDepartmentInput()}
            {renderCollectionInput()}
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
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
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