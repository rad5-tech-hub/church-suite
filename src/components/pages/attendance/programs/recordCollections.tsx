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

export interface CollectionData {
  [key: string]: string;
}

export interface CollectionsDialogueProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CollectionsDialogue: React.FC<CollectionsDialogueProps> = ({ eventId, open, onClose, onSuccess }) => {
  const [eventData, setEventData] = useState<EventOccurrence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [collectionData, setCollectionData] = useState<CollectionData>({});
  usePageToast('record-collections')

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

      if (collectionUpdates.length === 0) {
        showPageToast('Please enter at least one collection value', 'error');
        return;
      }

      await Api.post(`/church/event-collections/${eventId}`, {
        updates: collectionUpdates,
      });
      showPageToast('Collections updated successfully!', 'success');

      setTimeout(() => {
        onClose();
        setCollectionData({});
      }, 3000);
      onSuccess();
    } catch (err: any) {
      let errorMessage = 'Error saving collections';
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showPageToast(`Collections Error: ${errorMessage}`, 'error');
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
            Collections
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#F6F4FE', textAlign: 'center' }}>
            Collection recording is not available for department role.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!eventData?.collection || eventData.collection.length === 0) {
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
            Collections
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#F6F4FE', textAlign: 'center' }}>
            No collections available for this event.
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

export default CollectionsDialogue;