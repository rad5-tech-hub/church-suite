import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  Typography,
  TextField,
  Box,
  Grid,
  CircularProgress
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import Api from '../../../shared/api/api';

interface CollectionItem {
  id: string;
  amount: string;
  collection: {
    id: string;
    name: string;
  };
}

interface Event {
  id: string;
  title: string;
}

interface EventOccurrence {
  id: string;
  eventId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isCancelled: boolean;
  hasAttendance: boolean;
  dayOfWeek: string;
  createdAt: string;
  updatedAt: string;
  attendances: any[];
  event: Event;
  collection: CollectionItem[]; // Updated to match the new structure
}

interface EventResponse {
  message: string;
  eventOccurrence: EventOccurrence;
}

interface RecordDialogueProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
}

interface AttendanceData {
  eventId: string;
  date?: string;
  total: string;
  male: string;
  female: string;
  children: string;
}

interface CollectionData {
  [key: string]: string; // collectionId: amount
}

// Define input configuration with proper mapping
interface InputField {
  label: string;
  key: keyof AttendanceData;
}

const RecordDialogue: React.FC<RecordDialogueProps> = ({
  eventId,
  open,
  onClose,
}) => {
  // Define input fields with proper mapping between labels and data keys
  const inputFields: InputField[] = [
    { label: "Men", key: "male" },
    { label: "Women", key: "female" },
    { label: "Children", key: "children" },
    { label: "Total", key: "total" }
  ];
  
  const [eventData, setEventData] = useState<EventOccurrence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    eventId: eventId,
    total: '',
    male: '',
    female: '',
    children: ''
  });
  const [collectionData, setCollectionData] = useState<CollectionData>({});

  useEffect(() => {
    if (open && eventId) {
      const fetchEventData = async () => {
        try {
          setLoading(true);
          setFetchError(null);
          const response = await Api.get<EventResponse>(`/church/get-event/${eventId}`);
          const eventOccurrence = response.data.eventOccurrence;
          setEventData(eventOccurrence);
          
          // Initialize collection data with current amounts
          const initialCollectionData: CollectionData = {};
          eventOccurrence.collection.forEach(item => {
            initialCollectionData[item.collection.id] = item.amount;
          });
          setCollectionData(initialCollectionData);
          
          // Update attendanceData with the eventId
          setAttendanceData(prev => ({
            ...prev,
            eventId: eventId
          }));
        } catch (err) {
          const errorMessage = 'Error fetching event data';
          setFetchError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      fetchEventData();
    }
  }, [eventId, open]);

  const handleInputChange = (field: keyof AttendanceData, value: string) => {
    // Only allow numbers and empty string
    if (value === '' || /^\d+$/.test(value)) {
      setAttendanceData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCollectionChange = (collectionId: string, value: string) => {
    // Only allow numbers, decimal point, and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCollectionData(prev => ({
        ...prev,
        [collectionId]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      // Create attendance payload object with only fields that have values
      const attendancePayload: any = {};
      
      // Only add fields that have non-empty values
      if (attendanceData.total) attendancePayload.total = parseInt(attendanceData.total);
      if (attendanceData.male) attendancePayload.male = parseInt(attendanceData.male);
      if (attendanceData.female) attendancePayload.female = parseInt(attendanceData.female);
      if (attendanceData.children) attendancePayload.children = parseInt(attendanceData.children);
      
      // Create collection payload
      const collectionPayload: any = {};
      Object.entries(collectionData).forEach(([collectionId, amount]) => {
        if (amount !== '' && amount !== '0.00') {
          collectionPayload[collectionId] = parseFloat(amount);
        }
      });
      
      // Check if both payloads are empty
      if (Object.keys(attendancePayload).length === 0 && Object.keys(collectionPayload).length === 0) {
        toast.error('Please enter at least one attendance or collection value');
        return;
      }
      
      // Save attendance if there are values
      if (Object.keys(attendancePayload).length > 0) {
        await Api.post(`/church/create-attendance/${attendanceData.eventId}`, attendancePayload);
      }
      
      // Save collections if there are values
      if (Object.keys(collectionPayload).length > 0) {
        await Api.post(`/church/update-collections/${eventId}`, collectionPayload);
      }
      
      toast.success('Records saved successfully!', {
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      
      setTimeout(() => {
        onClose();
        // Reset form after closing
        setAttendanceData({
          eventId: eventId,
          total: '',
          male: '',
          female: '',
          children: ''
        });
      }, 1500);
    } catch (err: any) {
      console.error('Save error:', err);
      
      // Extract error message from the API response structure
      let errorMessage = 'Error saving records';
      
      if (err.response?.data?.error?.message) {
        // Handle the specific error structure you provided
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        // Handle other potential error structures
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            bgcolor: "#2C2C2C",
          },
        }}
      >
        <ToastContainer/>
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: '#F6F4FE'
        }}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            Loading...
          </Typography>
          <IconButton 
            onClick={onClose} 
            sx={{ color: '#F6F4FE' }}
            aria-label="Close dialog"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 3, 
          mt: 2, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '200px'
        }}>
          <CircularProgress sx={{ color: '#777280' }} />
        </DialogContent>
      </Dialog>
    );
  }

  // Show error state if fetching failed
  if (fetchError) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            bgcolor: "#2C2C2C",
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: '#F6F4FE'
        }}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            Error
          </Typography>
          <IconButton 
            onClick={onClose} 
            sx={{ color: '#F6F4FE' }}
            aria-label="Close dialog"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" sx={{ color: '#F6F4FE', textAlign: 'center' }}>
            {fetchError}
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
          bgcolor: "#2C2C2C",
        },
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        color: '#F6F4FE'
      }}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          {eventData ? `Manage Record for ${eventData.event.title}` : 'Manage Record'}
        </Typography>
        <IconButton 
          onClick={onClose} 
          sx={{ color: '#F6F4FE' }}
          aria-label="Close dialog"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Box>
          {/* Members Count Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            color: '#F6F4FE',
          }}>
            <Box sx={{ 
              mb: { xs: 2, sm: 3 }, 
              justifyContent: 'center' 
            }}>
              <Typography variant="h6" fontWeight="medium">
                Members Count
              </Typography>
            </Box>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {inputFields.map((field) => (
                <Grid size={{xs: 6, sm: 6, lg: 3}}  key={field.key}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <TextField
                      variant="outlined"
                      value={attendanceData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      type="text" // Changed to text to allow empty input
                      inputMode="numeric" // Shows numeric keyboard on mobile
                      sx={{ 
                        width: { xs: 90, sm: 95, md: 100 },
                        justifyContent: 'center',
                        '& .MuiInputBase-root': {
                          height: { xs: 70, sm: 80 }
                        }
                      }}
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
                        }
                      }}
                      InputLabelProps={{
                        sx: {
                          color: "#F6F4FE",
                          "&.Mui-focused": {
                            color: "#F6F4FE",
                          }, 
                        }                                                           
                      }}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ 
                      mt: 1, 
                      fontWeight: 'medium',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}>
                      {field.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>                
          </Box>

          {/* Collections Records Section - Only show if collections exist */}
          {eventData?.collection && eventData.collection.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              color: '#F6F4FE',
              mt: 4
            }}>
              <Box sx={{             
                mb: { xs: 2, sm: 3 }, 
                justifyContent: 'center' 
              }}>
                <Typography variant="h6" fontWeight="medium">
                  Collections
                </Typography>
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {eventData.collection.map((item) => (
                  <Grid size={{xs: 6, sm: 6, lg: 3}} key={item.id}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}>
                      <TextField
                        variant="outlined"
                        value={collectionData[item.collection.id] || item.amount}
                        onChange={(e) => handleCollectionChange(item.collection.id, e.target.value)}
                        type="text"
                        inputMode="decimal"
                        sx={{ 
                          width: { xs: 90, sm: 95, md: 100 },
                          '& .MuiInputBase-root': {
                            height: { xs: 70, sm: 80 }
                          }
                        }}
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
                          }
                        }}
                        InputLabelProps={{
                          sx: {
                            color: "#F6F4FE",
                            "&.Mui-focused": {
                              color: "#F6F4FE",
                            }, 
                          }                                                           
                        }}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ 
                        mt: 1, 
                        fontWeight: 'medium',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        textAlign: 'center'
                      }}>
                        {item.collection.name}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>                
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, pt: 4 }}>          
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={submitting ? <CircularProgress size={20}/> : <Save />}
              disabled={submitting}
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
              Save Record
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDialogue;