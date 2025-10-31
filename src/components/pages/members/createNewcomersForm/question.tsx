import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  IconButton,
  Button,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { showPageToast } from "../../../util/pageToast";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";
import { usePageToast } from '../../../hooks/usePageToast';
import { useSelector } from 'react-redux';

interface QuestionType {
  question: string;
  type: 'text' | 'yes-no' | 'multi-choice';
  options: string[];
}

interface QuestionProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const Question: React.FC<QuestionProps> = ({ open, onClose, onSuccess }) => {
  const [questions, setQuestions] = useState<QuestionType[]>([
    { question: '', type: 'text', options: [] },
  ]);
  const [loading, setLoading] = useState(false);
  usePageToast("form-questions");
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', type: 'text', options: [] }]);
  };

  const removeQuestion = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(qIndex, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (
    index: number,
    field: 'question' | 'type',
    value: string
  ) => {
    const newQuestions = [...questions];
    if (field === 'type') {
      newQuestions[index].type = value as 'text' | 'yes-no' | 'multi-choice';
      if (value === 'multi-choice' && newQuestions[index].options.length === 0) {
        newQuestions[index].options = [''];
      }
    } else {
      newQuestions[index].question = value;
    }
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    // ✅ Check if there’s at least one non-empty question
    const validQuestions = questions.filter((q) => q.question.trim() !== "");

    if (validQuestions.length === 0) {
      showPageToast("Please add at least one valid question.", "error");
      return;
    }

    // ✅ Build payload only from valid questions
    const payload = {
      questions: validQuestions.map((q) => {
        const { question, type } = q;
        if (type === "multi-choice") {
          return {
            question,
            type,
            options: q.options.filter((opt) => opt.trim() !== ""),
          };
        }
        return { question, type };
      }),
    };

    try {
      setLoading(true);
      await Api.post(
        `/follow/custom-questions?branchId=${authData?.branchId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      showPageToast("Questions Added Successfully", "success");
      onSuccess();

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error: any) {
      console.error("❌ Failed to save questions:", error.response?.data || error.message);
      showPageToast(
        error.response?.data?.message ||
          "Failed to save questions. Please try again.", 'error'
      );
    } finally {
      setLoading(false);
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
      maxWidth="md"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          py: 2,
          px: 1,
          bgcolor: '#2C2C2C',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
                variant="h5"
                fontWeight={600}
                gutterBottom
                sx={{ color: "#F6F4FE", fontSize: "1.5rem"}}
            >
            Add Questions
            </Typography>
            <IconButton onClick={onClose}>
            <Close className="text-gray-300"/>
            </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent >
        {questions.map((q, qIndex) => (
          <Box
            key={qIndex}
            sx={{
              border: '1px solid',
              borderColor: '#777280',
              p: 2,
              mb: 2,
              mt: 3,
              borderRadius: 1,
              bgcolor: '#2C2C2C',
              position: 'relative',
            }}
          >
            {/* Delete button on top-right */}
            <IconButton
                onClick={() => removeQuestion(qIndex)}
                size="small"
                color="error"
                sx={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    bgcolor: '#4B4B4B',
                    borderRadius: '6px',
                    "&:hover": {
                    bgcolor: '#6B6B6B', // lighter version of #4B4B4B
                    },
                }}
            >
            <DeleteIcon />
            </IconButton>

            {/* Responsive Question row */}
            <Grid container spacing={2} alignItems="flex-end">
              <Grid size={{xs: 12, md: 7}}>
                <TextField
                  fullWidth
                  label="Question"
                  value={q.question}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateQuestion(qIndex, 'question', e.target.value)
                  }
                InputProps={{
                    sx: {
                    color: "#F6F4FE",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                    fontSize:  "1rem",
                    },
                }}
                InputLabelProps={{
                    sx: {
                    fontSize:  "1rem",
                    color: "#F6F4FE",
                    "&.Mui-focused": { color: "#F6F4FE" },
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
              </Grid>
              <Grid size={{xs: 12, md: 5}}>
                <FormControl fullWidth>
                  <InputLabel sx={{color:'#f6f4fe'}} > Type</InputLabel>
                  <Select
                    value={q.type}
                    label="Type"
                    onChange={(e) =>
                      updateQuestion(
                        qIndex,
                        'type',
                        e.target.value as 'text' | 'yes-no' | 'multi-choice'
                      )
                    }
                    sx={{
                        fontSize: '1rem',
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

            {/* Render preview based on type */}
            {q.type === 'text' && (
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
                        color: "#9E9E9E", // muted input text when disabled
                        WebkitTextFillColor: "#9E9E9E", // ✅ ensures color overrides browser styles
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280",
                    },
                    "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#777280", // muted border when disabled
                    },
                    "& input::placeholder": {
                        color: "#9E9E9E", // muted placeholder
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
                        color: "#9E9E9E", // muted label when disabled
                    },
                    },
                }}
                />
            </Box>
            )}


            {q.type === 'yes-no' && (
            <Box sx={{ mt: 2 }}>
                <RadioGroup row>
                <FormControlLabel
                    value="yes"
                    control={
                    <Radio
                        disabled
                        sx={{
                        color: "#777280", // muted border
                        "&.Mui-disabled": {
                            color: "#777280", // muted radio circle
                        },
                        }}
                    />
                    }
                    label="Yes"
                    sx={{
                    "& .MuiFormControlLabel-label.Mui-disabled": {
                        color: "#9E9E9E", // muted label text
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

            {q.type === 'multi-choice' && (
                <Box sx={{ mt: 2 }}>
                    {q.options.map((opt, oIndex) => (
                    <Box
                        key={oIndex}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                    >
                        {/* Preview checkbox (muted, disabled) */}
                        <Checkbox
                        disabled
                        sx={{
                            color: "#777280",
                            "&.Mui-disabled": {
                            color: "#777280",
                            },
                        }}
                        />

                        {/* Editable option input */}
                        <TextField
                        fullWidth
                        size="small"
                        value={opt}
                        placeholder="Enter option"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateOption(qIndex, oIndex, e.target.value)
                        }
                        InputProps={{
                            sx: {
                            color: "#F6F4FE", // active text color
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#777280", // muted border
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#9E9E9E", // hover state
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#777280", // focus highlight
                            },
                            fontSize: "1rem",
                            "& input::placeholder": {
                                color: "#777280", // muted placeholder
                                opacity: 1,
                            },
                            },
                        }}
                        />

                        {/* Delete option button */}                        
                        <Tooltip title="Delete Option" arrow placement="top">
                            <IconButton
                                onClick={() => removeOption(qIndex, oIndex)}
                                size="small"
                                color="error"
                                sx={{
                                bgcolor: '#4B4B4B',
                                borderRadius: '6px',
                                "&:hover": {
                                    bgcolor: '#6B6B6B', // lighter version of #4B4B4B
                                },
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                    </Box>
                    ))}

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {/* Add option button */}
                        <Tooltip title="Add Option" arrow placement="top">
                            <IconButton
                            onClick={() => addOption(qIndex)}
                            size="small"
                            color="primary"
                            sx={{
                                mt: 1,
                                bgcolor: '#4B4B4B',
                                "&:hover": { bgcolor: '#525252' },
                            }}
                            >
                            <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            )}

          </Box>
        ))}

        {/* Add question button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Tooltip title="Add Question" arrow placement="top">
                <IconButton
                onClick={addQuestion}
                size="large"
                color="primary"
                sx={{
                    mt: 1,
                    bgcolor: '#4B4B4B',
                    '&:hover': { bgcolor: '#525252' },
                }}
                >
                <AddIcon />
                </IconButton>
            </Tooltip>
        </Box>
      </DialogContent>

      <DialogActions>    
        <Button onClick={handleSave} variant="contained"               
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
            disabled={loading}
        >
            {loading ? <span className='text-gray-400'>Adding...</span> : 'Add Questions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Question;
