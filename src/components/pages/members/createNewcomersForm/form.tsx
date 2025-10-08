import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  CircularProgress,
  OutlinedInput,
  ListItemText,
  Autocomplete,
  FormControlLabel,
  Dialog,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tooltip,
  Radio,
  RadioGroup,
} from "@mui/material";
// import DashboardManager from "../../../shared/dashboardManager";
import CheckIcon from "@mui/icons-material/Check";
import { Close, Delete, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import Question from "./question";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";
import { useSelector } from "react-redux";
import { showPageToast } from "../../../util/pageToast";
import { usePageToast } from "../../../hooks/usePageToast";

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
  if (monthNumber === 2) return 29;
  return [1, 3, 5, 7, 8, 10, 12].includes(monthNumber) ? 31 : 30;
};

interface Question {
  id: string;
  question: string;
  type: "text" | "yes-no" | "multi-choice";
  options?: string[] | null;
  FollowUpFormQuestion: {
    order: number;
  };
}

interface FormData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  config: {
    visibleFields: string[];
    requiredFields: string[];
    defaults: {
      timer: string;
    };
  };
  createdAt: string;
  questions: Question[];
}

interface FormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formId?: string;
}

const Form: React.FC<FormProps> = ({ open, onClose, onSuccess, formId }) => {
  const [openQuestions, setOpenQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  usePageToast("Create-Forms");
  const [formLoading, setFormLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [checkedFields, setCheckedFields] = useState<Record<string, boolean>>({
    fullname: true,
    phoneNumber: true,
    gender: false,
    address: false,
    dateOfBirth: false,
    attendanceDuration: false,
    isVisitor: false,
  });
  const [attendanceDuration, setAttendanceDuration] = useState("1");
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleOpenQuestions = () => setOpenQuestions(true);
  const handleCloseQuestions = () => setOpenQuestions(false);

  const handleEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setOpenEditDialog(true);
  };

  const handleDialogClose = () => {
    setOpenEditDialog(false);
    setSelectedQuestion(null);
  };

  const handleEditSave = async () => {
    if (!selectedQuestion?.id) {
      showPageToast("No question selected!", "error");
      return;
    }

    setEditLoading(true);
    try {
      const payload: any = {
        question: selectedQuestion.question,
        type: selectedQuestion.type,
      };

      if (selectedQuestion.type === "multi-choice" && selectedQuestion.options) {
        payload.options = selectedQuestion.options;
      }

      const branchId = authData?.branchId;
      await Api.patch(`/follow/edit-question/${selectedQuestion.id}?branchId=${branchId}`, payload);

      showPageToast("Question updated successfully!", "success");
      await fetchQuestions();
      setOpenEditDialog(false);
    } catch (error: any) {
      console.error("Error updating question:", error);
      showPageToast(error.response?.data?.message || "Failed to update question. Please try again.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const updateQuestion = (key: keyof Question, value: any) => {
    setSelectedQuestion((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const addOption = () => {
    setSelectedQuestion((prev) =>
      prev ? { ...prev, options: [...(prev.options || []), ""] } : prev
    );
  };

  const removeOption = (index: number) => {
    setSelectedQuestion((prev) =>
      prev
        ? { ...prev, options: prev.options?.filter((_, i) => i !== index) || [] }
        : prev
    );
  };

  const updateOption = (index: number, value: string) => {
    setSelectedQuestion((prev) =>
      prev
        ? {
            ...prev,
            options: prev.options?.map((opt, i) => (i === index ? value : opt)) || [],
          }
        : prev
    );
  };

  const visibleFields = useMemo(
    () =>
      Object.keys(checkedFields).filter(
        (key) => checkedFields[key] && ["fullname", "phoneNumber", "gender", "address", "dateOfBirth", "attendanceDuration"].includes(key)
      ),
    [checkedFields]
  );

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await Api.get(`/follow/all-questions?branchId=${authData?.branchId}`);
      const fetchedQuestions = res.data.data || [];
      setQuestions(fetchedQuestions);
      const initialChecked = fetchedQuestions.reduce((acc: Record<string, boolean>, q: any) => {
        acc[q.id] = false;
        return acc;
      }, {});
      setCheckedQuestions(initialChecked);
    } catch (err) {
      console.error("❌ Failed to fetch questions", err);
      showPageToast("Failed to fetch questions. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [authData?.branchId]);

  const fetchForm = useCallback(async () => {
    if (!formId || !authData?.branchId) return;

    setFormLoading(true);
    try {
      const res = await Api.get<{ message: string; form: FormData }>(
        `/follow/a-form/${formId}?branchId=${authData?.branchId}`
      );
      const formData = res.data.form;

      setFormName(formData.name);
      setDescription(formData.description);
      setAttendanceDuration(formData.config.defaults.timer);
      setCheckedFields({
        fullname: formData.config.visibleFields.includes("fullname"),
        phoneNumber: formData.config.visibleFields.includes("phoneNumber"),
        gender: formData.config.visibleFields.includes("gender"),
        address: formData.config.visibleFields.includes("address"),
        dateOfBirth: formData.config.visibleFields.includes("dateOfBirth"),
        attendanceDuration: formData.config.visibleFields.includes("attendanceDuration"),
      });
      setCheckedQuestions((prev) => {
        const updated = { ...prev };
        formData.questions.forEach((q) => {
          updated[q.id] = true;
        });
        return updated;
      });
    } catch (err) {
      console.error("❌ Failed to fetch form", err);
      showPageToast("Failed to fetch form. Please try again.", "error");
    } finally {
      setFormLoading(false);
    }
  }, [formId, authData?.branchId]);

  useEffect(() => {
    fetchQuestions();
    if (formId) {
      fetchForm();
    } else {
      // Reset form for create mode
      setFormName("");
      setDescription("");
      setCheckedFields({
        fullname: true,
        phoneNumber: true,
        gender: false,
        address: false,
        dateOfBirth: false,
        attendanceDuration: false,
      });
      setAttendanceDuration("1");
      setCheckedQuestions({});
      setAnswers({});
    }
  }, [fetchQuestions, fetchForm, formId]);

  const handleAnswerChange = (id: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleFieldCheck = (field: string) => {
    setCheckedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleQuestionCheck = (id: string) => {
    setCheckedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      showPageToast("Form name is required", "error");
      return;
    }

    if (!description.trim()) {
      showPageToast("Description is required", "error");
      return;
    }

    if (!checkedFields.fullname && !checkedFields.phoneNumber) {
      showPageToast("Full Name or Phone Number must be selected", "error");
      return;
    }

    if (
      !checkedFields.fullname &&
      !checkedFields.phoneNumber &&
      !Object.values(checkedQuestions).some((v) => v)
    ) {
      showPageToast("At least one field or question must be selected", "error");
      return;
    }

    try {
      setFormLoading(true);
      const requiredFields = ["fullname", "phoneNumber"].filter((field) => checkedFields[field]);
      const payload = {
        name: formName,
        description,
        config: {
          visibleFields,
          requiredFields,
          defaults: {
            timer: attendanceDuration,
          },
        },
        questions: Object.keys(checkedQuestions)
          .filter((id) => checkedQuestions[id])
          .map((id, index) => ({
            id,
            order: index + 1,
          })),
      };

      if (formId) {
        await Api.patch(`/follow/edit-form/${formId}?branchId=${authData?.branchId}`, payload);
        showPageToast("Form updated successfully", "success");
      } else {
        await Api.post(`/follow/custom-form?branchId=${authData?.branchId}`, payload);
        showPageToast("Form saved successfully", "success");
      }

      setTimeout(() => {
        setFormName("");
        setDescription("");
        setCheckedFields({
          fullname: true,
          phoneNumber: true,
          gender: false,
          address: false,
          dateOfBirth: false,
          attendanceDuration: false,
        });
        setCheckedQuestions({});
        setAttendanceDuration("1");
        setAnswers({});
        setCheckedQuestions(
          questions.reduce((acc: Record<string, boolean>, q: any) => {
            acc[q.id] = false;
            return acc;
          }, {})
        );
        onClose();
      }, 1000);
      onSuccess();
    } catch (err) {
      console.error("❌ Failed to save form", err);
      showPageToast("Failed to save form", "error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
      fullWidth
      maxWidth="lg"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          py: 2,
          px: 1,
          bgcolor: "#2C2C2C",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h5"
            fontWeight={600}
            gutterBottom
            sx={{ color: "#F6F4FE", fontSize: "1.5rem" }}
          >
            {formId ? "Edit Form" : "Create Form"}
          </Typography>
          <IconButton onClick={onClose}>
            <Close className="text-gray-300" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>    
        <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
          <Grid container spacing={2} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <TextField
                  variant="outlined"
                  placeholder="Enter Form Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  InputProps={{
                    sx: {
                      fontWeight: 500,
                      fontSize: { xs: "1rem", md: "1.1rem" },
                      color: "#F6F4FE",
                      maxWidth: { xs: "80%", md: "60%" },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "#777280" },
                      "&.Mui-focused fieldset": { borderColor: "#777280" },
                    },
                  }}
                />
                <TextField
                  variant="outlined"
                  placeholder="Enter Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  InputProps={{
                    sx: {
                      fontWeight: 400,
                      fontSize: { xs: "1rem", md: "1.1rem" },
                      color: "#F6F4FE",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#777280" },
                      "&:hover fieldset": { borderColor: "#777280" },
                      "&.Mui-focused fieldset": { borderColor: "#777280" },
                    },
                  }}
                />
              </div>
            </Grid>
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-end", md: "flex-end" },
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                size="medium"
                sx={{
                  backgroundColor: "#363740",
                  px: { xs: 2, sm: 2 },
                  py: 1,
                  borderRadius: 50,
                  fontWeight: 500,
                  textTransform: "none",
                  color: "var(--color-text-on-primary)",
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: "#363740",
                    opacity: 0.9,
                  },
                  mr: 2,
                }}
                aria-label="Add questions"
                onClick={handleOpenQuestions}
              >
                Add Questions
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <TextField
                  label="Full Name"
                  placeholder="Enter your full name"
                  fullWidth
                  disabled={!checkedFields.fullname}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: checkedFields.fullname ? "#4CAF50" : "#4B4B4B" },
                      "&:hover fieldset": { borderColor: checkedFields.fullname ? "#4CAF50" : "#777280" },
                      "&.Mui-focused fieldset": { borderColor: checkedFields.fullname ? "#4CAF50" : "#777280" },
                      color: "#F6F4FE",
                    },
                  }}
                  InputProps={{
                    sx: {
                      fontSize: "1rem",
                      "& .MuiInputBase-input.Mui-disabled": {
                        color: "#4B4B4B",
                        WebkitTextFillColor: "#9E9E9E",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4B4B4B",
                      },
                      "& input::placeholder": {
                        color: "#9E9E9E",
                        opacity: 1,
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: "1rem",
                      color: "#9E9E9E",
                      "&.Mui-focused": { color: "#F6F4FE" },
                      "&.Mui-disabled": {
                        color: "#4B4B4B",
                      },
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled
                      checked={checkedFields.fullname}
                      onChange={() => handleFieldCheck("fullname")}
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #4CAF50",
                            backgroundColor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      }
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#4CAF50",
                        },
                      }}
                    />
                  }
                  label=""
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    right: "10px",
                    "& .MuiCheckbox-root": {
                      padding: "4px",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <TextField
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your phone number"
                  fullWidth
                  disabled={!checkedFields.phoneNumber}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: checkedFields.phoneNumber ? "#4CAF50" : "#4B4B4B" },
                      "&:hover fieldset": { borderColor: checkedFields.phoneNumber ? "#4CAF50" : "#777280" },
                      "&.Mui-focused fieldset": { borderColor: checkedFields.phoneNumber ? "#4CAF50" : "#777280" },
                      color: "#F6F4FE",
                    },
                  }}
                  InputProps={{
                    sx: {
                      fontSize: "1rem",
                      "& .MuiInputBase-input.Mui-disabled": {
                        color: "#4B4B4B",
                        WebkitTextFillColor: "#9E9E9E",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4B4B4B",
                      },
                      "& input::placeholder": {
                        color: "#9E9E9E",
                        opacity: 1,
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: "1rem",
                      color: "#9E9E9E",
                      "&.Mui-focused": { color: "#F6F4FE" },
                      "&.Mui-disabled": {
                        color: "#4B4B4B",
                      },
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled
                      checked={checkedFields.phoneNumber}
                      onChange={() => handleFieldCheck("phoneNumber")}
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #4CAF50",
                            backgroundColor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      }
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#4CAF50",
                        },
                      }}
                    />
                  }
                  label=""
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    right: "10px",
                    "& .MuiCheckbox-root": {
                      padding: "4px",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <FormControl fullWidth disabled={!checkedFields.gender}>
                  <InputLabel
                    sx={{
                      color: checkedFields.gender ? "#4CAF50" : "#4B4B4B",
                      "&.Mui-focused": { color: "#4CAF50 !important" },
                      "&.Mui-disabled": { color: "#4B4B4B !important" },
                    }}
                  >
                    Gender
                  </InputLabel>
                  <Select
                    defaultValue=""
                    sx={{
                      fontSize: "1rem",
                      color: checkedFields.gender ? "#F6F4FE" : "#9E9E9E",
                      "& .MuiSelect-select": {
                        color: checkedFields.gender ? "#F6F4FE" : "#9E9E9E",
                      },
                      "& .MuiSelect-select.Mui-disabled": {
                        color: "#4B4B4B !important",
                        WebkitTextFillColor: "#4B4B4B",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: `${checkedFields.gender ? "#4CAF50" : "#4B4B4B"} !important`,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: `${checkedFields.gender ? "#4CAF50" : "#777280"} !important`,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4CAF50 !important",
                      },
                      "& .MuiSelect-icon": {
                        color: checkedFields.gender ? "#4CAF50" : "#4B4B4B !important",
                      },
                    }}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkedFields.gender}
                      onChange={() => handleFieldCheck("gender")}
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #4CAF50",
                            backgroundColor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      }
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#4CAF50",
                        },
                      }}
                    />
                  }
                  label=""
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    right: "10px",
                    "& .MuiCheckbox-root": {
                      padding: "4px",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <TextField
                  label="Address"
                  placeholder="Enter your address"
                  fullWidth
                  disabled={!checkedFields.address}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: checkedFields.address ? "#4CAF50" : "#4B4B4B" },
                      "&:hover fieldset": { borderColor: checkedFields.address ? "#4CAF50" : "#777280" },
                      "&.Mui-focused fieldset": { borderColor: checkedFields.address ? "#4CAF50" : "#777280" },
                      color: "#F6F4FE",
                    },
                  }}
                  InputProps={{
                    sx: {
                      fontSize: "1rem",
                      "& .MuiInputBase-input.Mui-disabled": {
                        color: "#4B4B4B",
                        WebkitTextFillColor: "#9E9E9E",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                      },
                      "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4B4B4B",
                      },
                      "& input::placeholder": {
                        color: "#9E9E9E",
                        opacity: 1,
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: "1rem",
                      color: "#9E9E9E",
                      "&.Mui-focused": { color: "#F6F4FE" },
                      "&.Mui-disabled": {
                        color: "#4B4B4B",
                      },
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkedFields.address}
                      onChange={() => handleFieldCheck("address")}
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #4CAF50",
                            backgroundColor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      }
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#4CAF50",
                        },
                      }}
                    />
                  }
                  label=""
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    right: "10px",
                    "& .MuiCheckbox-root": {
                      padding: "4px",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <Autocomplete
                  disabled={!checkedFields.dateOfBirth}
                  options={(() => {
                    const options = [];
                    for (const month of months) {
                      const daysInMonth = getDaysInMonth(month.value);
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dayFormatted = day.toString().padStart(2, "0");
                        options.push({
                          value: `${month.value}-${dayFormatted}`,
                          label: `${month.name} ${dayFormatted}`,
                        });
                      }
                    }
                    return options;
                  })()}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Date of Birth"
                      variant="outlined"
                      InputLabelProps={{
                        sx: {
                          color: checkedFields.dateOfBirth ? "#4CAF50" : "#4B4B4B",
                          "&.Mui-focused": { color: "#4CAF50 !important" },
                          "&.Mui-disabled": { color: "#4B4B4B !important" },
                          transform: params.inputProps.value ? "translate(14px, -9px) scale(0.75)" : undefined,
                        },
                      }}
                      InputProps={{
                        ...params.InputProps,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: checkedFields.dateOfBirth ? "#4CAF50 !important" : "#4B4B4B !important",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: checkedFields.dateOfBirth ? "#4CAF50 !important" : "#4B4B4B !important",
                          },
                          "&:hover fieldset": {
                            borderColor: checkedFields.dateOfBirth ? "#4CAF50 !important" : "#4B4B4B !important",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: checkedFields.dateOfBirth ? "#4CAF50 !important" : "#4B4B4B !important",
                          },
                          "& input": {
                            color: checkedFields.dateOfBirth ? "#4CAF50 !important" : "#4B4B4B !important",
                          },
                          "& .MuiInputBase-input": {
                            color: checkedFields.dateOfBirth ? "#4CAF50 !important" : "#4B4B4B !important",
                          },
                        },
                        "& .MuiFormLabel-root": {
                          color: checkedFields.dateOfBirth ? "#4CAF50 !important" : "#4B4B4 !important",
                        },
                        "& .MuiAutocomplete-popupIndicator": {
                          color: checkedFields.dateOfBirth ? "#4CAF50" : "#4B4B4B !important",
                        },
                      }}
                    />
                  )}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkedFields.dateOfBirth}
                      onChange={() => handleFieldCheck("dateOfBirth")}
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #4CAF50",
                            backgroundColor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      }
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#4CAF50",
                        },
                      }}
                    />
                  }
                  label=""
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    right: "10px",
                    "& .MuiCheckbox-root": {
                      padding: "4px",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <FormControl fullWidth disabled={!checkedFields.attendanceDuration}>
                  <InputLabel
                    sx={{
                      color: checkedFields.attendanceDuration ? "#4CAF50" : "#4B4B4B",
                      "&.Mui-focused": { color: "#4CAF50 !important" },
                      "&.Mui-disabled": { color: "#4B4B4B !important" },
                    }}
                  >
                    Attendance Duration
                  </InputLabel>
                  <Select
                    value={attendanceDuration}
                    onChange={(e) => setAttendanceDuration(e.target.value)}
                    sx={{
                      fontSize: "1rem",
                      color: checkedFields.attendanceDuration ? "#F6F4FE" : "#9E9E9E",
                      "& .MuiSelect-select": {
                        color: checkedFields.attendanceDuration ? "#F6F4FE" : "#9E9E9E",
                      },
                      "& .MuiSelect-select.Mui-disabled": {
                        color: "#4B4B4B !important",
                        WebkitTextFillColor: "#4B4B4B",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: `${checkedFields.attendanceDuration ? "#4CAF50" : "#4B4B4B"} !important`,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: `${checkedFields.attendanceDuration ? "#4CAF50" : "#777280"} !important`,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4CAF50 !important",
                      },
                      "& .MuiSelect-icon": {
                        color: checkedFields.attendanceDuration ? "#4CAF50" : "#4B4B4B !important",
                      },
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? "Time" : "Times"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkedFields.attendanceDuration}
                      onChange={() => handleFieldCheck("attendanceDuration")}
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #4CAF50",
                            backgroundColor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      }
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#4CAF50",
                        },
                      }}
                    />
                  }
                  label=""
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    right: "10px",
                    "& .MuiCheckbox-root": {
                      padding: "4px",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: "relative" }}>
                <FormControl fullWidth disabled={!checkedFields.isVisitor}>
                  <InputLabel
                    sx={{
                      color: checkedFields.isVisitor ? "#4CAF50" : "#4B4B4B",
                      "&.Mui-focused": { color: "#4CAF50 !important" },
                      "&.Mui-disabled": { color: "#4B4B4B !important" },
                    }}
                  >
                    Is a Visitor?
                  </InputLabel>
                  <Select
                    defaultValue=""
                    sx={{
                      fontSize: "1rem",
                      color: checkedFields.isVisitor ? "#F6F4FE" : "#9E9E9E",
                      "& .MuiSelect-select": {
                        color: checkedFields.isVisitor ? "#F6F4FE" : "#9E9E9E",
                      },
                      "& .MuiSelect-select.Mui-disabled": {
                        color: "#4B4B4B !important",
                        WebkitTextFillColor: "#4B4B4B",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: `${checkedFields.isVisitor ? "#4CAF50" : "#4B4B4B"} !important`,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: `${checkedFields.isVisitor ? "#4CAF50" : "#777280"} !important`,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4CAF50 !important",
                      },
                      "& .MuiSelect-icon": {
                        color: checkedFields.isVisitor ? "#4CAF50" : "#4B4B4B !important",
                      },
                    }}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkedFields.isVisitor}
                      onChange={() => handleFieldCheck("isVisitor")}
                      icon={
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid #4B4B4B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      }
                      checkedIcon={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #4CAF50",
                            backgroundColor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      }
                      color="success"
                      sx={{
                        "&.Mui-checked": {
                          color: "#4CAF50",
                        },
                      }}
                    />
                  }
                  label=""
                  sx={{
                    position: "absolute",
                    top: "-12px",
                    right: "10px",
                    "& .MuiCheckbox-root": {
                      padding: "4px",
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignContent: "center", gap: 2, width: "100%", color: "gray", mt: 2 }}>
                <CircularProgress size={20} sx={{ color: "gray" }} />Loading more questions...
              </Box>
            ) : (
              questions.map((q) => (
                <Grid size={{ xs: 12, md: 6 }} key={q.id}>
                  <Box sx={{ mb: 2, position: "relative" }}>
                    <Box sx={{ fontWeight: 600, mb: 1, color: "#F6F4FE" }}>{q.question}</Box>
                    {q.type === "text" && (
                      <TextField
                        fullWidth
                        placeholder="Enter your answer"
                        value={answers[q.id] || ""}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={!checkedQuestions[q.id]}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: checkedQuestions[q.id] ? "#4CAF50" : "#4B4B4B" },
                            "&:hover fieldset": { borderColor: checkedQuestions[q.id] ? "#4CAF50" : "#777280" },
                            "&.Mui-focused fieldset": { borderColor: checkedQuestions[q.id] ? "#4CAF50" : "#777280" },
                            color: "#F6F4FE",
                          },
                        }}
                        InputProps={{
                          sx: {
                            fontSize: "1rem",
                            "& .MuiInputBase-input.Mui-disabled": {
                              color: "#4B4B4B",
                              WebkitTextFillColor: "#9E9E9E",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#777280",
                            },
                            "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#4B4B4B",
                            },
                            "& input::placeholder": {
                              color: "#9E9E9E",
                              opacity: 1,
                            },
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: "1rem",
                            color: "#4B4B4B",
                            "&.Mui-focused": { color: "#F6F4FE" },
                            "&.Mui-disabled": {
                              color: "#4B4B4B",
                            },
                          },
                        }}
                      />
                    )}
                    {q.type === "yes-no" && (
                      <FormControl fullWidth disabled={!checkedQuestions[q.id]}>
                        <InputLabel
                          sx={{
                            color: checkedQuestions[q.id] ? "#4CAF50" : "#4B4B4B",
                            "&.Mui-focused": { color: "#4CAF50 !important" },
                            "&.Mui-disabled": { color: "#4B4B4B !important" },
                          }}
                        >
                          Select
                        </InputLabel>
                        <Select
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          sx={{
                            fontSize: "1rem",
                            color: checkedQuestions[q.id] ? "#F6F4FE" : "#9E9E9E",
                            "& .MuiSelect-select": {
                              color: checkedQuestions[q.id] ? "#F6F4FE" : "#9E9E9E",
                            },
                            "& .MuiSelect-select.Mui-disabled": {
                              color: "#4B4B4B !important",
                              WebkitTextFillColor: "#4B4B4B",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: `${checkedQuestions[q.id] ? "#4CAF50" : "#4B4B4B"} !important`,
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: `${checkedQuestions[q.id] ? "#4CAF50" : "#777280"} !important`,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#4CAF50 !important",
                            },
                            "& .MuiSelect-icon": {
                              color: checkedQuestions[q.id] ? "#4CAF50" : "#4B4B4B",
                            },
                          }}
                        >
                          <MenuItem value="yes">Yes</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    {q.type === "multi-choice" && (
                      <FormControl fullWidth disabled={!checkedQuestions[q.id]}>
                        <InputLabel
                          sx={{
                            color: checkedQuestions[q.id] ? "#4CAF50" : "#4B4B4B",
                            "&.Mui-focused": { color: "#4CAF50 !important" },
                            "&.Mui-disabled": { color: "#4B4B4B !important" },
                          }}
                        >
                          Select
                        </InputLabel>
                        <Select
                          multiple
                          value={answers[q.id] || []}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          input={<OutlinedInput />}
                          renderValue={(selected) => (selected as string[]).join(", ")}
                          sx={{
                            fontSize: "1rem",
                            color: checkedQuestions[q.id] ? "#F6F4FE" : "#9E9E9E",
                            "& .MuiSelect-select": {
                              color: checkedQuestions[q.id] ? "#F6F4FE" : "#9E9E9E",
                            },
                            "& .MuiSelect-select.Mui-disabled": {
                              color: "#4B4B4B !important",
                              WebkitTextFillColor: "#4B4B4B",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: `${checkedQuestions[q.id] ? "#4CAF50" : "#4B4B4B"} !important`,
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: `${checkedQuestions[q.id] ? "#4CAF50" : "#777280"} !important`,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#4CAF50 !important",
                            },
                            "& .MuiSelect-icon": {
                              color: checkedQuestions[q.id] ? "#4CAF50" : "#4B4B4B",
                            },
                          }}
                        >
                          {q.options?.map((opt: string, i: number) => (
                            <MenuItem key={i} value={opt}>
                              <Checkbox checked={answers[q.id]?.includes(opt) || false} />
                              <ListItemText primary={opt} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkedQuestions[q.id]}
                          onChange={() => handleQuestionCheck(q.id)}
                          icon={
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: "2px solid #4B4B4B",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            />
                          }
                          checkedIcon={
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: "2px solid #4CAF50",
                                backgroundColor: "#4CAF50",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CheckIcon sx={{ fontSize: 14, color: "#fff" }} />
                            </Box>
                          }
                          color="success"
                          sx={{
                            "&.Mui-checked": {
                              color: "#4CAF50",
                            },
                          }}
                        />
                      }
                      label=""
                      sx={{
                        position: "absolute",
                        top: "19px",
                        right: "10px",
                        "& .MuiCheckbox-root": {
                          padding: "4px",
                        },
                      }}
                    />
                    {checkedQuestions[q.id] && (
                      <Tooltip title="Edit question" arrow placement="top">
                        <IconButton
                          onClick={() => handleEditClick(q)}
                          size="small"
                          sx={{
                            color: "#4CAF50",
                            position: "absolute",
                            top: "19px",
                            backgroundColor: "#2c2c2c",
                            right: "-15px",
                            "&:hover": { color: "#66BB6A", backgroundColor: "#2c2c2c" },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Grid>
              ))
            )}
          </Grid>

          <Dialog
            open={openEditDialog}
            onClose={(_, reason) => {
              if (reason !== "backdropClick") {
                handleDialogClose();
              }
            }}
            fullWidth
            maxWidth="md"
            sx={{
              "& .MuiDialog-paper": {
                borderRadius: 2,
                py: 2,
                px: 1,
                bgcolor: "#2C2C2C",
              },
            }}
          >
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="h5"
                  fontWeight={600}
                  gutterBottom
                  sx={{ color: "#F6F4FE", fontSize: "1.5rem" }}
                >
                  Edit Question
                </Typography>
                <IconButton onClick={handleDialogClose}>
                  <Close className="text-gray-300" />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedQuestion && (
                <Box
                  sx={{
                    border: "1px solid #777280",
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    bgcolor: "#2C2C2C",
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <TextField
                        fullWidth
                        label="Question"
                        value={selectedQuestion.question}
                        onChange={(e) => updateQuestion("question", e.target.value)}
                        InputProps={{
                          sx: {
                            color: "#F6F4FE",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            color: "#F6F4FE",
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: "#F6F4FE" }}>Type</InputLabel>
                        <Select
                          value={selectedQuestion.type}
                          onChange={(e) => updateQuestion("type", e.target.value)}
                          sx={{
                            fontSize: "1rem",
                            color: "#F6F4FE",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                            "& .MuiSelect-select": { color: "#F6F4FE" },
                            "& .MuiSelect-icon": { color: "#777280" },
                          }}
                        >
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="yes-no">Yes/No</MenuItem>
                          <MenuItem value="multi-choice">Multi Choice</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  {selectedQuestion.type === "text" && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        disabled
                        placeholder="Free text response"
                        size="small"
                        InputProps={{
                          sx: {
                            fontSize: "1rem",
                            "& .MuiInputBase-input.Mui-disabled": {
                              color: "#9E9E9E",
                              WebkitTextFillColor: "#9E9E9E",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#777280",
                            },
                            "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#777280",
                            },
                            "& input::placeholder": {
                              color: "#9E9E9E",
                              opacity: 1,
                            },
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: "1rem",
                            color: "#9E9E9E",
                            "&.Mui-focused": { color: "#F6F4FE" },
                            "&.Mui-disabled": {
                              color: "#9E9E9E",
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                  {selectedQuestion.type === "yes-no" && (
                    <Box sx={{ mt: 2 }}>
                      <RadioGroup row>
                        <FormControlLabel
                          value="yes"
                          control={
                            <Radio
                              disabled
                              sx={{
                                color: "#777280",
                                "&.Mui-disabled": {
                                  color: "#777280",
                                },
                              }}
                            />
                          }
                          label="Yes"
                          sx={{
                            "& .MuiFormControlLabel-label.Mui-disabled": {
                              color: "#9E9E9E",
                            },
                          }}
                        />
                        <FormControlLabel
                          value="no"
                          control={
                            <Radio
                              disabled
                              sx={{
                                color: "#777280",
                                "&.Mui-disabled": {
                                  color: "#777280",
                                },
                              }}
                            />
                          }
                          label="No"
                          sx={{
                            "& .MuiFormControlLabel-label.Mui-disabled": {
                              color: "#9E9E9E",
                            },
                          }}
                        />
                      </RadioGroup>
                    </Box>
                  )}
                  {selectedQuestion.type === "multi-choice" && (
                    <Box sx={{ mt: 2 }}>
                      {selectedQuestion.options?.map((opt: any, i: any) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={opt}
                            placeholder="Enter option"
                            onChange={(e) => updateOption(i, e.target.value)}
                            InputProps={{
                              sx: {
                                color: "#F6F4FE",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                              },
                            }}
                          />
                          <Tooltip title="Delete Option" arrow placement="top">
                            <IconButton
                              onClick={() => removeOption(i)}
                              size="small"
                              color="error"
                              sx={{
                                bgcolor: "#4B4B4B",
                                "&:hover": { bgcolor: "#6B6B6B" },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Tooltip title="Add Option" arrow placement="top">
                          <IconButton
                            onClick={addOption}
                            size="small"
                            sx={{
                              mt: 1,
                              bgcolor: "#4B4B4B",
                              "&:hover": { bgcolor: "#525252" },
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleEditSave}
                variant="contained"
                sx={{
                  py: 1,
                  backgroundColor: "#F6F4FE",
                  px: { xs: 5, sm: 5 },
                  borderRadius: 50,
                  fontWeight: "semibold",
                  textTransform: "none",
                  fontSize: { xs: "1rem", sm: "1rem" },
                  color: "#2C2C2C",
                  "&:hover": {
                    backgroundColor: "#F6F4FE",
                    opacity: 0.9,
                  },
                }}
                disabled={editLoading}
              >
                {editLoading ? <span className="text-gray-400">Saving...</span> : "Save Question"}
              </Button>
            </DialogActions>
          </Dialog>
          {openQuestions && <Question open={openQuestions} onClose={handleCloseQuestions} onSuccess={fetchQuestions} />}
        </Box>        
      </DialogContent>
      <DialogActions>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            size="medium"
            sx={{
              backgroundColor: "#f6f4fe",
              px: { xs: 2, sm: 2 },
              py: 1,
              borderRadius: 50,
              fontWeight: 500,
              textTransform: "none",
              color: "#363740",
              fontSize: "1rem",
              "&:hover": {
                backgroundColor: "#f6f4fe",
                opacity: 0.9,
              },
            }}
            aria-label={formId ? "Update form" : "Create form"}
            onClick={handleSaveForm}
            disabled={formLoading || loading}
          >
            {formLoading ? <span className="text-gray-400">{formId ? "Updating..." : "Creating..."}</span> : formId ? "Update Form" : "Create Form"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default Form;