import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { RootState } from "../../../reduxstore/redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  FormControl,
  InputLabel,
  IconButton,
  Autocomplete,
  Checkbox,
  ListItemText,
  OutlinedInput,
  SelectChangeEvent,
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
  name?: string;
  phoneNo?: string;
  email?: string;
  sex?: string;
  address?: string;
  birthMonth?: string;
  birthDay?: string;
  timer?: number | null;
  branchId?: string;
  isVisitor?: boolean | string;
  eventOccurrenceId: string;
  [key: string]: any; // To store dynamic question answers
}

interface Branch {
  id: string;
  name: string;
}

interface Question {
  id: string;
  question: string;
  type: "text" | "yes-no" | "multi-choice";
  options: string[] | null;
  FollowUpFormQuestion: {
    order: number;
  };
}

interface FormConfig {
  visibleFields: string[];
  requiredFields: string[];
  defaults: {
    timer: string;
  };
}

interface FormResponse {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  config: FormConfig;
  createdAt: string;
  questions: Question[];
}

interface RegistrationModalProps {
  open: boolean;
  eventId: string;
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
  if (monthNumber === 2) return 29;
  return [1, 3, 5, 7, 8, 10, 12].includes(monthNumber) ? 31 : 30;
};

const defaultFormConfig: FormConfig = {
  visibleFields: [
    "fullname",
    "phoneNumber",
    "gender",
    "address",
    "isVisitor",
    "dateOfBirth",
    "attendanceDuration",
  ],
  requiredFields: ["fullname", "phoneNumber"],
  defaults: { timer: "1" },
};

type Answer = any;

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  open,
  onClose,
  eventId,
  onSuccess,
}) => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormResponse | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phoneNo: "",
    sex: "",
    address: "",
    birthMonth: "",
    birthDay: "",
    isVisitor: "",
    timer: parseInt(defaultFormConfig.defaults.timer),
    eventOccurrenceId: eventId || "",
    branchId: authData?.branchId || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [downLoading, setDownLoading] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const initialAnswers: Answer[] = [
    {
      questionId: "43ceb352-76b2-4193-ab2e-e2ebc8ed81d1",
      answer: "Looking to join the choir",
    },
    {
      questionId: "c04861a8-6a32-4870-851d-8b0279ac143b",
      answer: "Yes",
    },
    {
      questionId: "0154ffd3-a20d-4e7e-9686-043dba2e3189",
      answer: ["Ushering", "Technical"],
    },
  ];
  usePageToast("newcomers");

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    setBranchLoading(true);
    try {
      const response = await Api.get<{ branches: Branch[] }>("/church/get-branches");
      setBranches(response.data?.branches || []);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      showPageToast("Failed to load branches. Please try again.", "error");
    } finally {
      setBranchLoading(false);
    }
  }, []);

  // Fetch all forms
  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Api.get<{ data: FormResponse[] }>(
        `/follow/all-forms?branchId=${authData?.branchId}`
      );
      setForms(response?.data.data || []);
      // Initialize with default form
      setSelectedForm(null);
    } catch (error) {
      console.error("Failed to fetch forms:", error);
      showPageToast("Failed to load forms. Please try again.", "error");
      setSelectedForm(null);
    } finally {
      setLoading(false);
    }
  }, [authData?.branchId]);

  // Fetch a specific form
  const fetchForm = useCallback(
    async (formId: string) => {
      setLoading(true);
      try {
        const response = await Api.get<{ form: FormResponse }>(
          `/follow/a-form/${formId}?branchId=${authData?.branchId}`
        );
        const fetchedForm = response?.data.form;
        setSelectedForm(fetchedForm);
        // Initialize formData based on the fetched form
        const newFormData: FormData = {
          eventOccurrenceId: eventId || "",
          branchId: authData?.branchId || "",
        };

        // Initialize visible fields
        if (fetchedForm?.config?.visibleFields.includes("phoneNumber")) {
          newFormData.phoneNo = "";
        }
        if (fetchedForm?.config?.visibleFields.includes("email")) {
          newFormData.email = "";
        }
        if (fetchedForm?.config?.visibleFields.includes("isVisitor")) {
          newFormData.isVisitor = "";
        }
        if (fetchedForm?.config?.visibleFields.includes("attendanceDuration")) {
          newFormData.timer = parseInt(fetchedForm?.config?.defaults?.timer || "1");
        }

        // Initialize dynamic questions
        const validQuestionIds = fetchedForm?.questions?.map((q) => q.id) || [];
        initialAnswers.forEach((answer) => {
          if (validQuestionIds.includes(answer.questionId)) {
            newFormData[answer.questionId] = answer.answer;
          }
        });

        setFormData(newFormData);
      } catch (error) {
        console.error("Failed to fetch form:", error);
        showPageToast("Failed to load form. Please try again.", "error");
        setSelectedForm(null);
        // Reset to default formData
        setFormData({
          name: "",
          phoneNo: "",
          sex: "",
          address: "",
          birthMonth: "",
          birthDay: "",
          isVisitor: "",
          timer: parseInt(defaultFormConfig.defaults.timer),
          eventOccurrenceId: eventId || "",
          branchId: authData?.branchId || "",
        });
      } finally {
        setLoading(false);
      }
    },
    [authData?.branchId, eventId, initialAnswers]
  );

  // Handle form selection
  const handleFormSelect = useCallback(
    (form: FormResponse | null) => {
      if (form) {
        // Fetch the specific form if a form is selected
        fetchForm(form.id);
      } else {
        // Use default form config
        setSelectedForm(null);
        setFormData({
          name: "",
          phoneNo: "",
          sex: "",
          address: "",
          birthMonth: "",
          birthDay: "",
          isVisitor: "",
          timer: parseInt(defaultFormConfig.defaults.timer),
          eventOccurrenceId: eventId || "",
          branchId: authData?.branchId || "",
        });
      }
    },
    [authData?.branchId, eventId, fetchForm]
  );

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const selectedId = e.target.value;
    const selected = forms.find((form) => form.id === selectedId) || null;
    handleFormSelect(selected);
  };

  // Handle input changes
  const handleChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        | { target: { name?: string; value: unknown } }
    ) => {
      const { name, value } = e.target;
      if (name) {
        setFormData((prev) => ({
          ...prev,
          [name]: name === "isVisitor" ? (value === "yes" ? true : value === "no" ? false : "") : value,
        }));
      }
    },
    []
  );

  // Handle Excel template download
  const handleDownloadTemplate = useCallback(async () => {
    setDownLoading(true);
    try {
      const response = await Api.get(
        `/member/import-followup-template/${authData?.branchId}`,
        {
          responseType: "blob",
        }
      );
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
      showPageToast("Excel template downloaded successfully!", "success");
    } catch (error: any) {
      console.error("Failed to download template:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to download Excel template. Please try again.";
      showPageToast(errorMessage, "error");
    } finally {
      setDownLoading(false);
    }
  }, [authData?.branchId]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const payload: Record<string, any> = {};
        const config = selectedForm?.config || defaultFormConfig;

        // Populate payload with visible fields
        if (config.visibleFields.includes("fullname") && formData.name) {
          payload.name = formData.name;
        }
        if (config.visibleFields.includes("phoneNumber") && formData.phoneNo) {
          payload.phoneNo = formData.phoneNo;
        }
        if (config.visibleFields.includes("email") && formData.email) {
          payload.email = formData.email;
        }
        if (config.visibleFields.includes("gender") && formData.sex) {
          payload.sex = formData.sex;
        }
        if (config.visibleFields.includes("address") && formData.address) {
          payload.address = formData.address;
        }
        if (config.visibleFields.includes("isVisitor") && formData.isVisitor !== "") {
          payload.isVisitor = formData.isVisitor === true; // Ensure boolean value
        }
        if (
          config.visibleFields.includes("dateOfBirth") &&
          formData.birthMonth &&
          formData.birthDay
        ) {
          payload.birthMonth = formData.birthMonth;
          payload.birthDay = formData.birthDay;
        }
        if (
          config.visibleFields.includes("attendanceDuration") &&
          formData.timer !== null
        ) {
          payload.timer = formData.timer;
        }

        if (selectedForm) {
          payload.formId = selectedForm?.id || '';
        }

        payload.eventOccurrenceId = eventId;
        const validQuestionIds = selectedForm?.questions?.map((q) => q.id) || [];
        const answers = validQuestionIds
          .filter(
            (qId) =>
              formData[qId] !== undefined &&
              formData[qId] !== "" &&
              formData[qId]?.length !== 0
          )
          .map((qId) => ({
            questionId: qId,
            answer: formData[qId],
          }));

        if (answers.length > 0) {
          payload.answers = answers;
        }

        const branchIdParam = formData.branchId
          ? `&branchId=${formData.branchId}`
          : "";

        await Api.post(
          `/member/add-follow-up?churchId=${authData?.churchId}${branchIdParam}`,
          payload
        );

        showPageToast("Newcomer created successfully!", "success");

        const newFormData: FormData = {
          eventOccurrenceId: eventId || "",
          branchId: authData?.branchId || "",
        };

        // Reset visible fields based on selected or default form
        if (!selectedForm) {
          newFormData.name = "";
          newFormData.phoneNo = "";
          newFormData.sex = "";
          newFormData.address = "";
          newFormData.birthMonth = "";
          newFormData.birthDay = "";
          newFormData.isVisitor = "";
          newFormData.timer = parseInt(defaultFormConfig.defaults.timer);
        } else {
          if (config.visibleFields.includes("phoneNumber")) {
            newFormData.phoneNo = "";
          }
          if (config.visibleFields.includes("email")) {
            newFormData.email = "";
          }
          if (config.visibleFields.includes("isVisitor")) {
            newFormData.isVisitor = "";
          }
          if (config.visibleFields.includes("attendanceDuration")) {
            newFormData.timer = parseInt(config?.defaults?.timer || "1");
          }
          validQuestionIds.forEach((qId) => {
            const initialAnswer = initialAnswers.find(
              (ans) => ans.questionId === qId
            );
            if (initialAnswer) {
              newFormData[qId] = initialAnswer.answer;
            }
          });
        }

        setFormData(newFormData);

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } catch (error: any) {
        console.error("Error creating newcomer:", error.response?.data || error.message);
        let errorMessage = "Failed to create newcomer. Please try again.";
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
    },
    [
      authData?.churchId,
      authData?.branchId,
      eventId,
      selectedForm,
      formData,
      onSuccess,
      onClose,
    ]
  );

  // Fetch forms and branches on mount
  useEffect(() => {
    if (open) {
      fetchForms();
      fetchBranches();
    }
  }, [open, fetchForms, fetchBranches]);

  // Render form fields
  const renderFormFields = () => {
    const config = selectedForm?.config || defaultFormConfig;
    return (
      <Grid container spacing={4}>
        {/* Branch Selection */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel
              id="branch-select-label"
              sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                color: "#F6F4FE",
                "&.Mui-focused": { color: "#F6F4FE" },
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
              label="Select Branch (optional)"
              disabled={isLoading}
              sx={{
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#F6F4FE",
                },
                "& .MuiSelect-select": { color: "#F6F4FE" },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
              aria-label="Select branch"
            >
              <MenuItem value="">None</MenuItem>
              {branchLoading ? (
                <MenuItem disabled>Loading...</MenuItem>
              ) : (
                branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Render Default or Fetched Form Fields */}
        {config.visibleFields.includes("fullname") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <TextField
                label="Full Name"
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Enter your full name"
                required={config.requiredFields.includes("fullname")}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoPersonOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
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
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                }}
              />
            </FormControl>
          </Grid>
        )}

        {config.visibleFields.includes("phoneNumber") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <TextField
                label="Phone Number"
                id="phoneNo"
                name="phoneNo"
                type="tel"
                value={formData.phoneNo || ""}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required={config.requiredFields.includes("phoneNumber")}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoCallOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
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
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                }}
              />
            </FormControl>
          </Grid>
        )}

        {config.visibleFields.includes("email") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <TextField
                label="Email"
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="Enter your email"
                required={config.requiredFields.includes("email")}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoPersonOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
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
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                }}
              />
            </FormControl>
          </Grid>
        )}

        {config.visibleFields.includes("gender") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel
                id="gender-label"
                sx={{
                  color: "#F6F4FE",
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                Gender
              </InputLabel>
              <Select
                labelId="gender-label"
                id="sex"
                name="sex"
                value={formData.sex || ""}
                label="Gender"
                onChange={handleChange}
                disabled={isLoading}
                required={config.requiredFields.includes("gender")}
                startAdornment={
                  <InputAdornment position="start">
                    <FaTransgender style={{ color: "#F6F4FE" }} />
                  </InputAdornment>
                }
                sx={{
                  color: "#F6F4FE",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },
                  "& .MuiSelect-select": { paddingRight: "24px !important" },
                  "& .MuiSelect-icon": { color: "#F6F4FE" },
                  fontSize: isMobile ? "0.875rem" : "1rem",
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
        )}

        {config.visibleFields.includes("address") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <TextField
                label="Address"
                id="address"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Enter your address"
                required={config.requiredFields.includes("address")}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoLocationOutline style={{ color: "#F6F4FE" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
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
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                }}
              />
            </FormControl>
          </Grid>
        )}

        {config.visibleFields.includes("dateOfBirth") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              id="birthDate"
              options={(() => {
                const options = [];
                for (const month of months) {
                  const daysInMonth = getDaysInMonth(month.value);
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayFormatted = day.toString().padStart(2, "0");
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
                        months.find((m) => m.value === formData.birthMonth)?.name ||
                        ""
                      } ${formData.birthDay}`,
                      monthName:
                        months.find((m) => m.value === formData.birthMonth)?.name ||
                        "",
                      day: Number(formData.birthDay),
                    }
                  : null
              }
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              onChange={(_event, newValue) => {
                if (newValue) {
                  const [month, day] = newValue.value.split("-");
                  handleChange({ target: { name: "birthMonth", value: month } });
                  handleChange({ target: { name: "birthDay", value: day } });
                } else {
                  handleChange({ target: { name: "birthMonth", value: "" } });
                  handleChange({ target: { name: "birthDay", value: "" } });
                }
              }}
              filterOptions={(options, state) => {
                const input = state.inputValue.toLowerCase();
                return options.filter(
                  (option) =>
                    option.monthName.toLowerCase().includes(input) ||
                    option.day.toString().padStart(2, "0").includes(input) ||
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
                  label="Date of Birth"
                  required={config.requiredFields.includes("dateOfBirth")}
                  variant="outlined"
                  InputLabelProps={{
                    sx: {
                      color: "#F6F4FE",
                      "&.Mui-focused": { color: "#F6F4FE" },
                      fontSize: isMobile ? "0.875rem" : "1rem",
                      transform: params.inputProps.value
                        ? "translate(14px, -9px) scale(0.75)"
                        : undefined,
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start" sx={{ paddingLeft: 2 }}>
                        <BsCalendarDate style={{ color: "#F6F4FE" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                      "& input": { paddingLeft: "8px !important" },
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
                      "& .MuiAutocomplete-popupIndicator": { color: "#F6F4FE" },
                    },
                  }}
                />
              )}
              disabled={isLoading}
              size="medium"
              sx={{ "& .MuiAutocomplete-inputRoot": { paddingLeft: "6px" } }}
            />
          </Grid>
        )}

        {config.visibleFields.includes("attendanceDuration") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel
                id="timer-label"
                sx={{ color: "#F6F4FE", fontSize: isMobile ? "0.875rem" : "1rem" }}
              >
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
                required={config.requiredFields.includes("attendanceDuration")}
                startAdornment={
                  <InputAdornment position="start">
                    <FiClock style={{ color: "#F6F4FE" }} />
                  </InputAdornment>
                }
                sx={{
                  color: "#F6F4FE",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },
                  "& .MuiSelect-select": { paddingRight: "24px !important" },
                  "& .MuiSelect-icon": { color: "#F6F4FE" },
                  fontSize: isMobile ? "0.875rem" : "1rem",
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
        )}

        {config.visibleFields.includes("isVisitor") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel
                id="visitor-label"
                sx={{
                  color: "#F6F4FE",
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                Is a visitor?
              </InputLabel>
              <Select
                labelId="visitor-label"
                id="isVisitor"
                name="isVisitor"
                value={typeof formData.isVisitor === "boolean" ? (formData.isVisitor ? "yes" : "no") : formData.isVisitor || ""}
                label="Is a visitor?"
                onChange={handleChange}
                disabled={isLoading}
                required={config.requiredFields.includes("isVisitor")}
                sx={{
                  color: "#F6F4FE",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#777280",
                  },
                  "& .MuiSelect-select": { paddingRight: "24px !important" },
                  "& .MuiSelect-icon": { color: "#F6F4FE" },
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                <MenuItem value="" disabled selected>
                  Select an option
                </MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Dynamic Questions */}
        {selectedForm?.questions
          ?.sort((a, b) => a.FollowUpFormQuestion.order - b.FollowUpFormQuestion.order)
          .map((q) => (
            <Grid size={{ xs: 12, md: 6 }} key={q.id}>
              <FormControl fullWidth>
                {q.type === "text" && (
                  <TextField
                    label={q.question}
                    id={q.id}
                    name={q.id}
                    value={formData[q.id] || ""}
                    onChange={handleChange}
                    placeholder={`Enter your answer for ${q.question}`}
                    disabled={isLoading}
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
                        "&.Mui-focused": { color: "#F6F4FE" },
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      },
                    }}
                  />
                )}
                {q.type === "yes-no" && (
                  <>
                    <InputLabel
                      id={`${q.id}-label`}
                      sx={{
                        color: "#F6F4FE",
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      }}
                    >
                      {q.question}
                    </InputLabel>
                    <Select
                      labelId={`${q.id}-label`}
                      id={q.id}
                      name={q.id}
                      value={formData[q.id] || ""}
                      onChange={handleChange}
                      disabled={isLoading}
                      label={q.question}
                      sx={{
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
                        "& .MuiSelect-select": { paddingRight: "24px !important" },
                        "& .MuiSelect-icon": { color: "#F6F4FE" },
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select an option
                      </MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </>
                )}
                {q.type === "multi-choice" && (
                  <>
                    <InputLabel
                      id={`${q.id}-label`}
                      sx={{
                        color: "#F6F4FE",
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      }}
                    >
                      {q.question}
                    </InputLabel>
                    <Select
                      labelId={`${q.id}-label`}
                      id={q.id}
                      name={q.id}
                      multiple
                      value={formData[q.id] || []}
                      onChange={handleChange}
                      input={<OutlinedInput />}
                      renderValue={(selected) => (selected as string[]).join(", ")}
                      disabled={isLoading}
                      label={q.question}
                      sx={{
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
                        "& .MuiSelect-select": { paddingRight: "24px !important" },
                        "& .MuiSelect-icon": { color: "#F6F4FE" },
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      }}
                    >
                      {q.options?.map((opt, i) => (
                        <MenuItem key={i} value={opt}>
                          <Checkbox checked={formData[q.id]?.includes(opt) || false} />
                          <ListItemText primary={opt} />
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                )}
              </FormControl>
            </Grid>
          ))}
      </Grid>
    );
  };

  // Main Render
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
          color: "white",
          p: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ color: "#F6F4FE" }}>
            {selectedForm?.name || "Newcomer Registration"}
          </Typography>
          {selectedForm && (
            <Typography variant="body2" sx={{ color: "#F6F4FE", mt: 1 }}>
              {selectedForm.description} for{" "}
              {selectedForm.config?.defaults?.timer ||
                defaultFormConfig.defaults.timer}{" "}
              Timers
            </Typography>
          )}
          {selectedForm?.config?.visibleFields.includes("attendanceDuration") && (
            <Typography variant="body2" sx={{ color: "#F6F4FE", mt: 1 }}>
              Default Attendance Duration:{" "}
              {selectedForm?.config?.defaults?.timer ||
                defaultFormConfig.defaults.timer}{" "}
              {parseInt(
                selectedForm?.config?.defaults?.timer ||
                  defaultFormConfig.defaults.timer
              ) === 1
                ? "Time"
                : "Times"}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={onClose} sx={{ color: "#F6F4FE" }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              width: "100%",
              color: "gray",
              mt: 2,
            }}
          >
            <CircularProgress size={20} sx={{ color: "gray" }} /> Loading form...
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-end" },
                flexDirection: { xs: "column", sm: "column", md: "row" },
                gap: 2,
                mb: 3,
              }}
            >
              <Button
                variant="contained"
                onClick={handleDownloadTemplate}
                disabled={downLoading || isLoading}
                sx={{
                  py: 1,
                  backgroundColor: "#F6F4FE",
                  px: { xs: 3, sm: 3 },
                  borderRadius: 50,
                  fontWeight: 500,
                  textTransform: "none",
                  color: "#2C2C2C",
                  fontSize: { xs: "1rem", md: "0.875rem", sm: "1rem" },
                  "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
                }}
              >
                {downLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ mr: 1 }} />
                    Downloading...
                  </>
                ) : (
                  <span className="flex gap-1">
                    Download Template <DownloadOutlined className="mt-1" />
                  </span>
                )}
              </Button>
              <Button
                variant="contained"
                disabled={downLoading || isLoading}
                onClick={() => setOpenUpload(true)}
                sx={{
                  py: 1,
                  backgroundColor: "#F6F4FE",
                  px: { xs: 3, sm: 3 },
                  borderRadius: 50,
                  fontWeight: 500,
                  textTransform: "none",
                  color: "#2C2C2C",
                  fontSize: { xs: "1rem", md: "0.875rem", sm: "1rem" },
                  "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
                }}
              >
                <span className="flex gap-1">
                  Upload Newcomers <UploadFileOutlined className="text-base" />
                </span>
              </Button>
            </Box>
            <Box display="flex" justifyContent="flex-end">
              <FormControl
                size="small"
                sx={{
                  minWidth: 160,
                  bgcolor: "#2C2C2C",
                  "& .MuiOutlinedInput-root": {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F6F4FE",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F6F4FE",
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#F6F4FE",
                  },
                }}
              >
                <InputLabel
                  sx={{
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
                    fontSize: "0.9rem",
                  }}
                >
                  Select Form
                </InputLabel>
                <Select
                  label="Select Form"
                  value={selectedForm?.id || ""}
                  onChange={handleSelectChange}
                  MenuProps={{
                    PaperProps: {
                      sx: { bgcolor: "#2C2C2C", color: "#F6F4FE" },
                    },
                  }}
                >
                  <MenuItem value="">Default Form</MenuItem>
                  {forms.map((form) => (
                    <MenuItem key={form.id} value={form.id}>
                      {form.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {renderFormFields()}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "end",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { xs: "flex-end" },
          px: 2,
          py: 1,
        }}
      >
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          onClick={handleSubmit}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 5, sm: 5 },
            borderRadius: 50,
            fontWeight: "semibold",
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1rem" },
            color: "#2C2C2C",
            "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
            width: { xs: "100%", sm: "auto" },
            order: { xs: 1, sm: 2 },
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
      </DialogActions>

      <UploadNewcomersDialog
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onSuccess={() => setOpenUpload(false)}
        eventId={eventId}
      />
    </Dialog>
  );
};

export default RegistrationModal;