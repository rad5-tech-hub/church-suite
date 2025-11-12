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
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { usePageToast } from '../../../hooks/usePageToast';
import { showPageToast } from '../../../util/pageToast';
import Api from '../../../shared/api/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../../reduxstore/redux';
// Interface definitions
export interface CollectionItem {
  id: string;
  amount: string;
  collection: {
    id: string;
    name: string;
  };
}

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
  collection: CollectionItem[];
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

export interface CollectionData {
  [key: string]: string;
}

export interface InputField {
  label: string;
  key: keyof AttendanceData;
}

export interface RecordDialogueProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordDialogue: React.FC<RecordDialogueProps> = ({ eventId, open, onClose, onSuccess }) => {
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
  usePageToast('record-attendance');
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    eventId: eventId,
    total: '',
    male: '',
    female: '',
    children: '',
  });
  const [collectionData, setCollectionData] = useState<CollectionData>({});

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

          const initialCollectionData: CollectionData = {};
          if (Array.isArray(eventOccurrence.collection)) {
            eventOccurrence.collection.forEach((item) => {
              initialCollectionData[item.id] = item.amount || '';
            });
          }
          setCollectionData(initialCollectionData);

          setAttendanceData((prev) => ({
            ...prev,
            eventId: eventId,
          }));
        } catch (err: any) {
          const errorMessage = err.message || 'Error processing event data';
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

  const formatNumber = (value: string) => {
    if (!value) return '';
    const numericValue = value.replace(/,/g, '');
    return Number(numericValue).toLocaleString();
  };

  const handleCollectionChange = (collectionItemId: string, value: string) => {
    const raw = value.replace(/,/g, '');
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setCollectionData((prev) => ({
        ...prev,
        [collectionItemId]: formatNumber(raw),
      }));
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

      const collectionUpdates = [];
      for (const [collectionItemId, amount] of Object.entries(collectionData)) {
        const clean = amount.replace(/,/g, '');
        if (clean && clean !== '' && clean !== '0.00') {
          collectionUpdates.push({
            id: collectionItemId,
            amount: parseFloat(clean) || 0,
          });
        }
      }

      if (Object.keys(attendancePayload).length === 0 && collectionUpdates.length === 0) {
        showPageToast('Please enter at least one attendance or collection value', 'error');
        return;
      }

      let attendanceSuccess = false;
      let collectionSuccess = false;

      if (Object.keys(attendancePayload).length > 0) {
        await Api.post(`/church/create-attendance/${attendanceData.eventId}`, attendancePayload);
        attendanceSuccess = true;
      }

      if (collectionUpdates.length > 0) {
        await Api.post(`/church/event-collections/${eventId}`, {
          updates: collectionUpdates,
        });
        collectionSuccess = true;
      }

      if (attendanceSuccess && collectionSuccess) {
        showPageToast('Attendance and collections saved successfully!', 'success');
      } else if (attendanceSuccess) {
        showPageToast('Attendance saved successfully!', 'success');
      } else if (collectionSuccess) {
        showPageToast('Collections updated successfully!', 'success');
      }

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
      onSuccess()
    } catch (err: any) {
      let errorMessage = 'Error saving records';
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (err.config?.url?.includes('create-attendance')) {
        showPageToast(`Attendance Error: ${errorMessage}`, 'error');
      } else if (err.config?.url?.includes('event-collections')) {
        showPageToast(`Collections Error: ${errorMessage}`, 'error');
      } else {
        showPageToast(errorMessage, 'error');
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
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
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
          <Typography fontWeight="bold">Loading...</Typography>
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
          bgcolor: '#2C2C2C',
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
      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Box>
          {/* Members Count Section (Branch Role Only) */}
          {authData?.role !== 'department' && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: '#F6F4FE',
              }}
            >
              <Box sx={{ mb: { xs: 2, sm: 3 }, justifyContent: 'center' }}>
                <Typography variant="h6" fontWeight="medium">
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
          )}

          {/* Collections Records Section (Branch Role Only) */}
          {authData?.role !== 'department' && eventData?.collection && eventData.collection.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: '#F6F4FE',
                mt: 4,
              }}
            >
              <Box sx={{ mb: { xs: 2, sm: 3 }, justifyContent: 'center' }}>
                <Typography variant="h6" fontWeight="medium">
                  Collections
                </Typography>
              </Box>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {eventData.collection.map((item) => (
                  <Grid size={{ xs: 6, sm: 6, lg: 3 }} key={item.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <TextField
                        variant="outlined"
                        value={collectionData[item.id] ?? ''}
                        onChange={(e) => handleCollectionChange(item.id, e.target.value)}
                        type="text"
                        inputMode="decimal"
                        sx={{
                          width: { xs: 90, sm: 95, md: 100 },
                          '& .MuiInputBase-root': {
                            height: { xs: 70, sm: 80 },
                          },
                        }}
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
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            color: '#F6F4FE',
                            '&.Mui-focused': {
                              color: '#F6F4FE',
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
                          textAlign: 'center',
                        }}
                      >
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
              startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
              disabled={submitting}
              sx={{
                py: 1,
                backgroundColor: '#F6F4FE',
                px: { xs: 2, sm: 2 },
                borderRadius: 50,
                color: '#2C2C2C',
                fontWeight: 'semibold',
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1rem' },
                '&:hover': { backgroundColor: '#F6F4FE', opacity: 0.9 },
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