import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Close,
  EventNote,
  Schedule,
  CalendarToday,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import Api from '../../../shared/api/api';
import { RootState } from '../../../reduxstore/redux';
import { showPageToast } from '../../../util/pageToast';
import RegistrationModal from './followUp';

interface EventOccurrence {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  hasAttendance: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  recurrenceType: string;
  createdAt: string;
  isDeleted: boolean;
  occurrences: EventOccurrence[];
}

interface EventOccurrenceSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EventOccurrenceSelectionDialog: React.FC<EventOccurrenceSelectionDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const authData = useSelector((state: RootState) => state?.auth?.authData);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string>('');

  // Fetch events with optional date filter
  const fetchEvents = useCallback(async (date: Dayjs | null = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (authData?.branchId) {
        params.append('branchId', authData.branchId);
      }
      
      if (authData?.role === 'department' && authData.department) {
        params.append('departmentId', authData.department);
      }
      
      if (date) {
        params.append('date', date.format('YYYY-MM-DD'));
      }

      const response = await Api.get<{ message: string; events: Event[] }>(
        `/church/get-events?${params.toString()}`
      );

      setEvents(response.data?.events || []);
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load events. Please try again.';
      showPageToast(errorMessage, 'error');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [authData]);

  // Fetch events on mount and when date changes
  useEffect(() => {
    if (open) {
      fetchEvents(selectedDate);
    }
  }, [open, selectedDate, fetchEvents]);

  // Format time to readable format
  const formatTime = (time: string) => {
    try {
      const date = new Date(`1970-01-01T${time}`);
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  // Handle occurrence selection
  const handleOccurrenceSelect = (occurrenceId: string) => {
    setSelectedOccurrenceId(occurrenceId);
    setRegistrationModalOpen(true);
  };

  // Handle registration modal close
  const handleRegistrationClose = () => {
    setRegistrationModalOpen(false);
    setSelectedOccurrenceId('');
  };

  // Handle registration success
  const handleRegistrationSuccess = () => {
    setRegistrationModalOpen(false);
    setSelectedOccurrenceId('');
    onSuccess();
    onClose();
  };

  // Handle dialog close
  const handleClose = () => {
    setSelectedDate(null);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: 'var(--color-primary)',
            color: 'var(--color-text-primary)',
            p: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 0,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ color: 'var(--color-text-primary)' }}>
              Select Event & Occurrence
            </Typography>
            <Typography variant="body2" sx={{ color: '#777280', mt: 0.5 }}>
              Choose an event occurrence to add newcomers
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'var(--color-text-primary)' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Date Filter */}
          <Box sx={{ my: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label="Filter by Date (Optional)"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slotProps={{
                textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    placeholder: 'Select a date',  // ← cleaner than default format mask

                    InputProps: {
                    sx: {
                        backgroundColor: 'var(--color-surface-glass)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '12px',
                        color: 'var(--color-text-primary)',

                        '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        borderWidth: '1px',
                        '& legend': { padding: '0 12px !important' }, // wider notch
                        },

                        '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.45)',
                        },

                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--color-text-primary)',
                        borderWidth: '2px',
                        },

                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                        color: 'var(--color-text-primary)',
                        },

                        '& .MuiInputBase-input': {
                        paddingTop: '18px',
                        paddingBottom: '14px',
                        },
                    },
                    },

                    InputLabelProps: {
                    sx: {
                        color: 'var(--color-text-muted)',
                        '&.Mui-focused': { color: 'var(--color-text-primary)' },

                        '&.MuiInputLabel-shrink': {
                        backgroundColor: 'var(--color-surface-glass)',
                        padding: '0 12px',                    // ← key: wider background
                        transform: 'translate(14px, -10px) scale(0.75)', // slight vertical tweak
                        lineHeight: '1.2',
                        zIndex: 1,
                        },
                    },
                    },
                },

                // popper / actionBar styles remain the same...
                }}
            />
            </LocalizationProvider>
            {selectedDate && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#777280' }}>
                  Showing events for: {selectedDate.format('MMMM D, YYYY')}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedDate(null)}
                  sx={{
                    color: 'var(--color-text-primary)',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                  }}
                >
                  Clear Filter
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 3, borderColor: '#777280' }} />

          {/* Loading State */}
          {loading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 4,
              }}
            >
              <CircularProgress size={40} sx={{ color: 'var(--color-text-primary)' }} />
            </Box>
          )}

          {/* Empty State */}
          {!loading && events.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <EventNote sx={{ fontSize: 60, color: '#777280', mb: 2 }} />
              <Typography variant="h6" color="#777280">
                No Events Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#777280', mt: 1 }}>
                {selectedDate
                  ? 'No events scheduled for the selected date'
                  : 'No events available at the moment'}
              </Typography>
            </Box>
          )}

          {/* Events List */}
          {!loading && events.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {events.map((event) => (
                <Card
                  key={event.id}
                  sx={{
                    bgcolor: 'var(--color-surface-glass)',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* Event Header */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'var(--color-text-primary)',
                          fontWeight: 600,
                          fontSize: isMobile ? '1rem' : '1.25rem',
                        }}
                      >
                        {event.title}
                      </Typography>
                      {event.description && (
                        <Typography variant="body2" sx={{ color: '#777280', mt: 0.5 }}>
                          {event.description}
                        </Typography>
                      )}
                    </Box>

                    {/* Occurrences */}
                    {event.occurrences.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {event.occurrences.map((occurrence) => (
                          <CardActionArea
                            key={occurrence.id}
                            onClick={() => handleOccurrenceSelect(occurrence.id)}
                            sx={{
                              borderRadius: 1,
                              bgcolor: 'var(--color-surface-glass)',
                              p: 2,
                              '&:hover': {
                                bgcolor: 'var(--color-surface-glass)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 2,
                              }}
                            >
                              {/* Date and Day */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday
                                  sx={{ fontSize: 20, color: 'var(--color-text-primary)' }}
                                />
                                <Box>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      color: 'var(--color-text-primary)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {dayjs(occurrence.date).format('MMM D, YYYY')}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#777280' }}>
                                    {occurrence.dayOfWeek}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Time */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule
                                  sx={{ fontSize: 20, color: 'var(--color-text-primary)' }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: 'var(--color-text-primary)' }}
                                >
                                  {formatTime(occurrence.startTime)} -{' '}
                                  {formatTime(occurrence.endTime)}
                                </Typography>
                              </Box>

                              {/* Attendance Status */}
                              {occurrence.hasAttendance && (
                                <Chip
                                  label="Has Attendance"
                                  size="small"
                                  sx={{
                                    bgcolor: '#2E7D32',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              )}
                            </Box>
                          </CardActionArea>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#777280', fontStyle: 'italic' }}>
                        No occurrences available for this event
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Modal */}
      <RegistrationModal
        open={registrationModalOpen}
        eventId={selectedOccurrenceId}
        onClose={handleRegistrationClose}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  );
};

export default EventOccurrenceSelectionDialog;