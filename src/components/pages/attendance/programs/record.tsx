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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import Api from '../../../shared/api/api';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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
  assignedDepartments: Dept[];
}

interface Dept {
  id : string;
  name: string;
}

interface Worker {
  id: string;
  name: string;
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
  collection: CollectionItem[];
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
  [key: string]: string;
}

interface InputField {
  label: string;
  key: keyof AttendanceData;
}

const RecordDialogue: React.FC<RecordDialogueProps> = ({
  eventId,
  open,
  onClose,
}) => {
  const inputFields: InputField[] = [
    { label: "Men", key: "male" },
    { label: "Women", key: "female" },
    { label: "Children", key: "children" },
    { label: "Total", key: "total" }
  ];
  const [workers, setWorkers] = useState<Record<string, Worker[]>>({});
  const [deploading, setDepLoading] = useState<Record<string, boolean>>({});
  const [attendance, setAttendance] = useState<Record<string, Record<string, boolean>>>({});
  const [depsubmitting, setDepSubmitting] = useState<Record<string, boolean>>({});
  const [depMessage, setDepMessage] = useState<Record<string, string>>({});
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
          
          const initialCollectionData: CollectionData = {};
          eventOccurrence.collection.forEach(item => {
            initialCollectionData[item.id] = item.amount; // Use item.id instead of collection.id
          });
          setCollectionData(initialCollectionData);
          
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

  // handle the toogle
  const handleToggle = (deptId: string, workerId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        [workerId]: !prev[deptId]?.[workerId],
      },
    }));
  };

  // fetch Worker when open accordion
  const handleFetchWorkers = async (deptId: string) => {
    if (workers[deptId]) return; // already fetched
    try {
      setDepLoading((prev) => ({ ...prev, [deptId]: true }));
      const res = await Api.get(`/member/all-members?departmentId=${deptId}`);
      setWorkers((prev) => ({ ...prev, [deptId]: res.data.data }));
      setDepLoading((prev) => ({ ...prev, [deptId]: false }));
    } catch (err) {
      console.error("Error fetching workers:", err);
      setDepLoading((prev) => ({ ...prev, [deptId]: false }));
    }
  };

  // handle submit for departments
    const handleSubmit = async (deptId: string) => {
      const deptAttendance = attendance[deptId] || {};

      const payload = Object.entries(deptAttendance).map(([workerId, present]) => ({
        workerId,
        status: present ? "present" : "", // ensure we send either present/absent
      }));

      try {
        setDepSubmitting((prev) => ({ ...prev, [deptId]: true }));

        const response = await Api.post(
          `/church/worker-attendance/occurance/${eventId}/department/${deptId}`,
          payload
        );

        // ✅ Save message for this department
        setDepMessage((prev) => ({
          ...prev,
          [deptId]: response?.data?.message || "Submitted successfully",
        }));

        setDepSubmitting((prev) => ({ ...prev, [deptId]: false }));
      } catch (err: any) {
        console.error("Error submitting attendance:", err);

        setDepMessage((prev) => ({
          ...prev,
          [deptId]: err?.response?.data?.message || "Error submitting attendance",
        }));

        setDepSubmitting((prev) => ({ ...prev, [deptId]: false }));
      }
    };

  const handleInputChange = (field: keyof AttendanceData, value: string) => {
    // allow empty or numeric (with commas stripped)
    if (value === "" || /^\d+$/.test(value.replace(/,/g, ""))) {
      setAttendanceData((prev) => {
        const updated = { ...prev, [field]: value };

        // Only recalc total if user edits male/female/children
        if (field !== "total") {
          const male = parseInt(updated.male.replace(/,/g, "") || "0", 10);
          const female = parseInt(updated.female.replace(/,/g, "") || "0", 10);
          const children = parseInt(updated.children.replace(/,/g, "") || "0", 10);

          const sum = male + female + children;

          updated.total = sum > 0 ? sum.toString() : ""; // clear if all are empty
        }

        return updated;
      });
    }
  };

  const formatNumber = (value: string) => {
    if (!value) return '';
    const numericValue = value.replace(/,/g, '');
    return Number(numericValue).toLocaleString();
  };

  const handleCollectionChange = (collectionItemId: string, value: string) => {
    // Strip commas before validating
    const raw = value.replace(/,/g, '');
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setCollectionData(prev => ({
        ...prev,
        [collectionItemId]: formatNumber(raw)
      }));
    }
  };


  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      // Attendance payload (clean numbers)
      const attendancePayload: Record<string, number> = {};
      if (attendanceData.total) attendancePayload.total = parseInt(attendanceData.total.replace(/,/g, ''));
      if (attendanceData.male) attendancePayload.male = parseInt(attendanceData.male.replace(/,/g, ''));
      if (attendanceData.female) attendancePayload.female = parseInt(attendanceData.female.replace(/,/g, ''));
      if (attendanceData.children) attendancePayload.children = parseInt(attendanceData.children.replace(/,/g, ''));

      // Collections (clean numbers)
      const collectionUpdates = [];
      for (const [collectionItemId, amount] of Object.entries(collectionData)) {
        const clean = amount.replace(/,/g, '');
        if (clean && clean !== "" && clean !== "0.00") {
          collectionUpdates.push({
            id: collectionItemId,
            amount: parseFloat(clean) || 0,
          });
        }
      }
      
      // Check if both payloads are empty
      if (Object.keys(attendancePayload).length === 0 && collectionUpdates.length === 0) {
        toast.error('Please enter at least one attendance or collection value');
        return;
      }
      
      // Save attendance if there are values
      let attendanceSuccess = false;
      let collectionSuccess = false;
      
      if (Object.keys(attendancePayload).length > 0) {
        await Api.post(`/church/create-attendance/${attendanceData.eventId}`, attendancePayload);
        attendanceSuccess = true;
      }
      
      // Save collections if there are values
      if (collectionUpdates.length > 0) {
        await Api.post(`/church/event-collections/${eventId}`, {
          updates: collectionUpdates
        });
        collectionSuccess = true;
      }
      
      // Show appropriate success message
      if (attendanceSuccess && collectionSuccess) {
        toast.success('Attendance and collections saved successfully!', {autoClose: 1000});
      } else if (attendanceSuccess) {
        toast.success('Attendance saved successfully!');
      } else if (collectionSuccess) {
        toast.success('Collections updated successfully!');
      }
      
      setTimeout(() => {
        onClose();
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
      
      let errorMessage = 'Error saving records';
      
      // Handle different error response structures
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show specific error messages based on the endpoint
      if (err.config?.url?.includes('create-attendance')) {
        toast.error(`Attendance Error: ${errorMessage}`);
      } else if (err.config?.url?.includes('event-collections')) {
        toast.error(`Collections Error: ${errorMessage}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <Typography fontWeight="bold">
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
          <Typography variant="body1" sx={{ color: '#F6F4FE', textAlign: 'center' }}>
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
          {eventData && eventData.event.title}
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
          <Box>
            <Typography variant='h6' color='#F6F4FE' fontWeight='medium'>Expected Departments </Typography>
            <div className='my-5'>
              {eventData?.event?.assignedDepartments.map((dept) => (
                <Accordion
                  key={dept.id}
                  onChange={(_, expanded) => {
                    if (expanded) handleFetchWorkers(dept.id);
                  }}
                  sx={{ bgcolor: "transparent", color: "#F6F4FE",border: '0.5px solid', borderColor: "#777280", my: 2 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon  sx={{ color: "white" }}/>}>
                    <Typography fontWeight="medium">{dept.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {deploading[dept.id] ? (
                      <Box sx={{display: 'flex', alignContent: 'center', gap: 2}}><CircularProgress size={24} sx={{color: '#777280'}}/> Loading..</Box>
                    ) : (
                      <>
                        <List dense>
                          {workers[dept.id]?.map((worker) => (
                            <ListItem
                              key={worker.id}
                              sx={{ display: "flex", color: "grey.300", justifyContent: "space-between" }}
                            >
                              <ListItemText primary={worker.name} />
                              <Switch
                                checked={attendance[dept.id]?.[worker.id] || false}
                                onChange={() => handleToggle(dept.id, worker.id)}
                                color="success"
                              />
                            </ListItem>
                          ))}
                          {!workers[dept.id] && (
                            <Typography variant="body2" color="grey.300">
                              No workers found
                            </Typography>
                          )}
                        </List>

                        <Box sx={{ textAlign: "right", mt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={depsubmitting[dept.id]}
                            onClick={() => handleSubmit(dept.id)}
                            sx={{
                              py: 1,
                              backgroundColor: "#F6F4FE",
                              px: { xs: 2, sm: 2 },
                              borderRadius: 50,
                              color: "#2C2C2C",
                              fontWeight: "semibold",
                              textTransform: "none",
                              fontSize: { xs: "1rem", sm: "1rem" },
                              "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 }
                            }}
                          >
                            {depsubmitting[dept.id] ? "Submitting..." : "Save Attendance"}
                          </Button>
                        </Box>
                        
                        {/* ✅ Show department message here */}
                        {depMessage[dept.id] && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              color: depMessage[dept.id].toLowerCase().includes("error")
                                ? "error.main"
                                : "#777280",
                            }}
                          >
                            {depMessage[dept.id]}
                          </Typography>
                        )}
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </Box>  

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
                      type="text"
                      inputMode="numeric"
                      sx={{
                        width: { xs: 90, sm: 95, md: 100 },
                        justifyContent: "center",
                        "& .MuiInputBase-root": {
                          height: { xs: 70, sm: 80 },
                        },
                        "&.Mui-disabled": {
                          WebkitTextFillColor: "#F6F4FE",
                          color: "#777280",
                        }

                      }}
                      disabled={
                        field.key === "total" &&
                        (!!attendanceData.male || !!attendanceData.female || !!attendanceData.children)
                      }
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
                          "&.Mui-disabled": {
                            "& .MuiInputBase-input.Mui-disabled": {
                              WebkitTextFillColor: "#F6F4FE", // for Chrome/Edge
                              color: "#F6F4FE", // for Firefox
                            },
                          },
                        },
                      }}
                      inputProps={{
                        sx: {
                          WebkitTextFillColor: "#F6F4FE", // ensures text is white even if disabled
                          color: "#F6F4FE",
                            "&.Mui-disabled": {
                              color: "#777280", // label matches disabled color
                            },
                        },
                      }}
                      size='small'
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

          {/* Collections Records Section */}
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
                        value={collectionData[item.id] ?? ''}
                        onChange={(e) => handleCollectionChange(item.id, e.target.value)}
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
              Save Information
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDialogue;