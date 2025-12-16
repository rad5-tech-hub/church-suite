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
  CircularProgress,
  DialogActions,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { showPageToast } from '../../../util/pageToast';
import Api from '../../../shared/api/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../../reduxstore/redux';
import { usePageToast } from '../../../hooks/usePageToast';

export interface Event {
  id: string;
  title: string;
}

export interface EventOccurrence {
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
  assignedDepartments: any[];
  event: Event;
}

export interface EventResponse {
  message: string;
  eventOccurrence: EventOccurrence;
}

export interface AttendanceData {
  eventId: string;
  date?: string;
  total: string;
  male: string;
  female: string;
  children: string;
}

export interface InputField {
  label: string;
  key: keyof AttendanceData;
}

export interface MembersCountDialogueProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MembersCountDialogue: React.FC<MembersCountDialogueProps> = ({ eventId, open, onClose , onSuccess}) => {
  const inputFields: InputField[] = [
    { label: 'Men', key: 'male' },
    { label: 'Women', key: 'female' },
    { label: 'Children', key: 'children' },
    { label: 'Total', key: 'total' },
  ];
  const [eventData, setEventData] = useState<EventOccurrence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  usePageToast('members-count')
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    eventId: eventId,
    total: '',
    male: '',
    female: '',
    children: '',
  });

  useEffect(() => {
    if (open && eventId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setFetchError(null);

          const eventResponse = await Api.get<EventResponse>(`/church/get-event/${eventId}`);
          if (!eventResponse?.data?.eventOccurrence) {
            throw new Error('Invalid event data: eventOccurrence is missing');
          }

          const eventOccurrence = eventResponse.data.eventOccurrence;
          setEventData(eventOccurrence);

          // Initialize attendanceData with values from attendances if available
          const initialAttendance: AttendanceData = {
            eventId: eventId,
            total: '',
            male: '',
            female: '',
            children: '',
          };
          if (Array.isArray(eventOccurrence.attendances) && eventOccurrence.attendances.length > 0) {
            const attendance = eventOccurrence.attendances[0];
            initialAttendance.total = attendance.total ? attendance.total.toString() : '';
            initialAttendance.male = attendance.male ? attendance.male.toString() : '';
            initialAttendance.female = attendance.female ? attendance.female.toString() : '';
            initialAttendance.children = attendance.children ? attendance.children.toString() : '';
          }

          setAttendanceData(initialAttendance);
        } catch (err: any) {
          const errorMessage = err.message || 'Error fetching event data';
          console.error('Fetch error:', err);
          setFetchError(errorMessage);
          showPageToast(errorMessage, 'error');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [eventId, open]);

  const handleInputChange = (field: keyof AttendanceData, value: string) => {
    if (value === '' || /^\d+$/.test(value.replace(/,/g, ''))) {
      setAttendanceData((prev) => {
        const updated = { ...prev, [field]: value };
        if (field !== 'total') {
          const male = parseInt(updated.male.replace(/,/g, '') || '0', 10);
          const female = parseInt(updated.female.replace(/,/g, '') || '0', 10);
          const children = parseInt(updated.children.replace(/,/g, '') || '0', 10);
          const sum = male + female + children;
          updated.total = sum > 0 ? sum.toString() : '';
        }
        return updated;
      });
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      const attendancePayload: Record<string, number> = {};
      if (attendanceData.total) attendancePayload.total = parseInt(attendanceData.total.replace(/,/g, ''));
      if (attendanceData.male) attendancePayload.male = parseInt(attendanceData.male.replace(/,/g, ''));
      if (attendanceData.female) attendancePayload.female = parseInt(attendanceData.female.replace(/,/g, ''));
      if (attendanceData.children) attendancePayload.children = parseInt(attendanceData.children.replace(/,/g, ''));

      if (Object.keys(attendancePayload).length === 0) {
        showPageToast('Please enter at least one attendance value', 'error');
        return;
      }

      await Api.post(`/church/create-attendance/${attendanceData.eventId}`, attendancePayload);
      showPageToast('Attendance saved successfully!', 'success');

      setTimeout(() => {
        onClose();
        setAttendanceData({
          eventId: eventId,
          total: '',
          male: '',
          female: '',
          children: '',
        });
      }, 3000);
      onSuccess();
    } catch (err: any) {
      let errorMessage = 'Error saving attendance';
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showPageToast(`Attendance Error: ${errorMessage}`, 'error');
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
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            minHeight: '300px',
          },
        }}
      >
        <DialogTitle
          component="div" // ✅ prevents nested <h2> issue
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: 0,
          }}
        >
          <Typography
            variant="h6" // slightly larger, fits dialog header better
            component="span" // ✅ renders as <span> to avoid nested heading error
            sx={{ fontWeight: 'bold', fontSize: '1rem', color: '#F6F4FE' }}
          >
            Loading...
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            mt: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
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
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            minHeight: '300px',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#F6F4FE',
          }}
        >
          <Typography variant="h5" component="h2" fontWeight="bold">
            Error
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
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

  if (authData?.role === 'department') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            minHeight: '300px',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#F6F4FE',
          }}
        >
          <Typography variant="h5" component="h2" fontWeight="bold">
            Members Count
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#F6F4FE', textAlign: 'center' }}>
            Attendance recording is not available for department role.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          onClose();
          onSuccess()
        }
      }}
      fullWidth
      maxWidth="md"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          bgcolor: '#2C2C2C',
          minHeight: '300px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#F6F4FE',
        }}
      >
        <Typography variant="h5" component="h2" fontWeight="bold">
          {eventData && eventData.event.title}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, mt: 2, pb: 12 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#F6F4FE',
          }}
        >
          <Box sx={{ mb: { xs: 2, sm: 3 }, justifyContent: 'center' }}>
            <Typography variant="h6" fontWeight="medium" textAlign={'center'}>
              Members Count
            </Typography>
          </Box>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {inputFields.map((field) => (
              <Grid size={{ xs: 6, sm: 6, lg: 3 }} key={field.key}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <TextField
                    variant="outlined"
                    value={attendanceData[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    type="text"
                    inputMode="numeric"
                    sx={{
                      width: { xs: 90, sm: 95, md: 100 },
                      justifyContent: 'center',
                      '& .MuiInputBase-root': {
                        height: { xs: 70, sm: 80 },
                      },
                      '&.Mui-disabled': {
                        WebkitTextFillColor: '#F6F4FE',
                        color: '#777280',
                      },
                    }}
                    disabled={
                      field.key === 'total' &&
                      (!!attendanceData.male || !!attendanceData.female || !!attendanceData.children)
                    }
                    InputProps={{
                      sx: {
                        color: '#F6F4FE',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#777280',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#777280',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#777280',
                        },
                        '&.Mui-disabled': {
                          '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: '#F6F4FE',
                            color: '#F6F4FE',
                          },
                        },
                      },
                    }}
                    inputProps={{
                      sx: {
                        WebkitTextFillColor: '#F6F4FE',
                        color: '#F6F4FE',
                        '&.Mui-disabled': {
                          color: '#777280',
                        },
                      },
                    }}
                    size="small"
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      fontWeight: 'medium',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    {field.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          bgcolor: '#2C2C2C',
          p: 2,
          justifyContent: 'center',
        }}
      >
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={submitting ? <CircularProgress size={20} sx={{ color: '#2C2C2C' }} /> : <Save />}
          disabled={submitting}
          sx={{
            backgroundColor: '#F6F4FE',
            color: '#2C2C2C',
            borderRadius: 50,
            px: 4,
            fontWeight: 'semibold',
            textTransform: 'none',
            minWidth: '200px',
            '&:hover': { backgroundColor: '#F6F4FE', opacity: 0.9 },
          }}
        >
          Save Information
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MembersCountDialogue;