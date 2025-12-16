import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Button,
  Typography,
  DialogActions,
  useTheme,
  useMediaQuery,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tooltip,
} from '@mui/material';
import { Close, EditDocument, Save } from '@mui/icons-material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import moment from 'moment-timezone';
import { useSelector } from 'react-redux';
import { RootState } from '../../../reduxstore/redux';
import { CiMoneyBill } from 'react-icons/ci';
import RegistrationModal from '../../members/new-comers/followUp';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Api from '../../../shared/api/api';
import { EditProgramModal } from './services';
import WorkerAttendanceDialogue from './workersAttendance';
import MembersCountDialogue from './memberAttendance';
import CollectionsDialogue from './recordCollections';
import { showPageToast } from '../../../util/pageToast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  ChartDataLabels
);

interface Attendance {
  id: string;
  eventOccurrenceId: string;
  total: number;
  male: number;
  female: number;
  children: number;
  adults: number;
  createdBy: string;
  createdByName: string;
  updatedBy: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  recurrenceType: string;
}

interface Dept {
  id: string;
  name: string;
}

interface EventOccurrence {
  id: string;
  tenantId: string;
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  hasAttendance: boolean;
  dayOfWeek: string;
  createdAt: string;
  updatedAt: string;
  attendances: Attendance[];
  assignedDepartments: Dept[];
  collection: CollectionItem[];
  event: Event;
}

interface EventResponse {
  message: string;
  eventOccurrence: EventOccurrence;
}

interface EventSummaryDialogProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EventSummaryDialog: React.FC<EventSummaryDialogProps> = ({ eventId, open, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [eventData, setEventData] = useState<EventOccurrence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [recordOpen, setRecordOpen] = useState<boolean>(false);
  const [recordMemberOpen, setRecordMemberOpen] = useState<boolean>(false);
  const [workerOpen, setWorkerOpen] = useState<boolean>(false);
  const [openNewcomers, setOpenNewcomers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [workersPercentage, setWorkersPercentage] = useState<number>(0);
  const [nonWorkersPercentage, setNonWorkersPercentage] = useState<number>(0);
  const [eventStatus, setEventStatus] = useState<string>('');
  const [delloading, setDelLoading] = useState(false);
  const [confirmDelOpen, setConfirmDelOpen] = useState(false);

  const getEventStatus = (
    evDate: string,
    evStart: string,
    evEnd: string,
    hasAttendance: boolean = false
  ): string => {
    const now = moment().tz('Africa/Lagos');
    const eventDate = moment.tz(evDate, 'YYYY-MM-DD', 'Africa/Lagos');
    const validStart = !!evStart && /^\d{2}:\d{2}$/.test(evStart);
    const validEnd = !!evEnd && /^\d{2}:\d{2}$/.test(evEnd);

    if (!eventDate.isValid() || !validStart || !validEnd) return 'upcoming';

    const eventStart = moment.tz(`${evDate} ${evStart}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');
    const eventEnd = moment.tz(`${evDate} ${evEnd}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

    if (now.isBefore(eventStart)) return 'upcoming';
    if (now.isBetween(eventStart, eventEnd, undefined, '[)')) return 'ongoing';
    if (now.isAfter(eventEnd)) {
      return hasAttendance ? 'past' : 'pending';
    }
    return 'upcoming';
  };

  useEffect(() => {
    if (eventData?.date) {
      const status = getEventStatus(
        eventData.date,
        eventData.startTime,
        eventData.endTime,
        eventData.hasAttendance
      );
      setEventStatus(status);
    }
  }, [eventData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const eventRes = await Api.get<EventResponse>(`/church/get-event/${eventId}`);
      const eventOccurrence = eventRes.data.eventOccurrence;
      setEventData({
        ...eventOccurrence,
        assignedDepartments: eventOccurrence.assignedDepartments || [],
      });

      if (eventOccurrence) {
        const status = getEventStatus(
          eventOccurrence.date,
          eventOccurrence.startTime,
          eventOccurrence.endTime
        );
        setEventStatus(status);

        if (eventOccurrence.assignedDepartments?.length > 0) {
          const attendanceRes = await Api.get<{ overall: { attendanceRate: number } }>(
            `/church/worker-attendace-stats/${eventId}`
          );
          const rate = attendanceRes.data.overall.attendanceRate || 0;
          setWorkersPercentage(rate);
          setNonWorkersPercentage(100 - rate);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch event or attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Open confirmation
  const handleDeleteClick = () => {
    setConfirmDelOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!eventId) return;

    setDelLoading(true);
    try {
      await Api.patch(`/church/soft-delete-event/${eventData?.event.id}`);
      showPageToast(`${eventData?.event.title} deleted successfully`, "success");
      setConfirmDelOpen(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      showPageToast(err?.response?.data?.message || "Failed to delete event", "error");
    } finally {
      setConfirmDelOpen(false);
      setDelLoading(false);
    }
  };

  useEffect(() => {
    if (open && eventId) {
      fetchData();
    }
  }, [open, eventId]);

  const attendance = eventData?.attendances?.[0] || {
    male: 0,
    female: 0,
    children: 0,
    adults: 0,
    total: 0,
  };

  const barChartData = {
    labels: ['Men', 'Women', 'Children'],
    datasets: [
      {
        label: 'Attendance',
        data: [attendance.male, attendance.female, attendance.children],
        backgroundColor: ['#F6F4FE', '#F6F4FE', '#F6F4FE'],
        borderColor: ['#F6F4FE', '#F6F4FE', '#F6F4FE'],
        borderWidth: 0,
        borderRadius: 5,
        barThickness: 60,
      },
    ],
  };

  const maxAttendance = Math.max(attendance.male || 0, attendance.female || 0, attendance.children || 0);
  const suggestedMax = Math.ceil(maxAttendance / 50) * 50;

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw}`,
        },
      },
      datalabels: {
        color: '#F6F4FE',
        anchor: 'end',
        align: 'top',
        formatter: (value: number) => value,
        font: { weight: 'bold' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax || 50,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawTicks: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          stepSize: 50,
          callback: (value: any) => value,
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { weight: 'bold' as const },
        },
        border: { display: false },
      },
    },
  };

  const doughnutChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [workersPercentage, nonWorkersPercentage],
        backgroundColor: ['#211930', '#F6F4FE'],
        borderColor: 'transparent',
        borderWidth: 0,
        cutout: '52%',
      },
    ],
  };

  const doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.label}: ${context.raw}%`,
        },
      },
      datalabels: {
        color: (context: any) =>
          context.dataset.backgroundColor[context.dataIndex] === '#F6F4FE' ? '#1f2937' : 'white',
        formatter: (value: number) => `${value}%`,
        font: { weight: 'bold', size: 14 },
      },
    },
  };

  const formatCurrency = (amount: string | number, currency: string = 'NGN'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const collections = eventData?.collection || [];

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            color: 'white',
            p: 2,
          },
        }}
        component="div"
      >
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: 0,
          }}
        >
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 'bold', fontSize: '1rem', color: '#F6F4FE' }}
          >
            Loading...
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#F6F4FE',
              '&:hover': { color: '#C49C6B' },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            minHeight: 300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress sx={{ color: '#777280' }} />
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !eventData) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2, bgcolor: '#2C2C2C', color: 'white', p: 2 } }}
      >
        <DialogTitle sx={{ p: 0, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Error</Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '300px' }}>
          <Typography>{error || 'No data available'}</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== "backdropClick") {
            onClose();
            onSuccess();
          }
        }}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2, bgcolor: '#2C2C2C', py: 2, px: 3, color: 'white' } }}
      >
        <DialogTitle sx={{ p: 0, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {eventData.event.title}
            {eventStatus && (
              <Typography component="span" sx={{ ml: 2, fontSize: '0.8rem', color: 'grey.300' }}>
                ({eventStatus.charAt(0).toUpperCase() + eventStatus.slice(1)})
              </Typography>
            )}
          </Typography>
          <IconButton component="button" onClick={() => { onClose(); onSuccess(); }} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: eventData?.assignedDepartments?.length > 0 || authData?.role !== 'branch' ? (isMobile ? '1fr' : '1fr 1fr') : '1fr',
              gap: 3,
              mb: 4,
            }}
          >
            {authData?.role === 'branch' && (
              <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#393939', border: '1.5px #404040 solid', height: 398 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Members Attendance
                  </Typography>
                  {['ongoing', 'pending'].includes(eventStatus) && authData?.role === 'branch' && !eventData.hasAttendance && (
                    <Tooltip title="Record Members Attendance" arrow>
                      <IconButton
                        onClick={() => setRecordMemberOpen(true)}
                        sx={{
                          color: 'white',
                          backgroundColor: '#2C2C2C',
                          '&:hover': { backgroundColor: '#2C2C2C', opacity: 0.9 },
                          borderRadius: 50,
                        }}
                      >
                        <EditDocument />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ height: 250 }}>
                  <Bar data={barChartData} options={barChartOptions} plugins={[ChartDataLabels]} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>{attendance.male} Men</Typography>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>{attendance.female} Women</Typography>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>{attendance.children} Children</Typography>
                </Box>
              </Paper>
            )}

            {eventData?.assignedDepartments?.length > 0 && (
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: '#393939',
                  height: 398,
                  border: '1.5px #404040 solid',
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent:'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Workers Attendance
                  </Typography>
                  {['ongoing', 'pending'].includes(eventStatus) && !eventData.hasAttendance && (
                    <Tooltip title="Record Workers Attendance" arrow>
                      <IconButton
                        onClick={() => setWorkerOpen(true)}
                        sx={{
                          color: 'white',
                          backgroundColor: '#2C2C2C',
                          '&:hover': { backgroundColor: '#2C2C2C', opacity: 0.9 },
                          borderRadius: 50,
                        }}
                      >
                        <EditDocument />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                  <Box sx={{ width: isMobile ? 250 : 280, height: isMobile ? 250 : 280 }}>
                    <Doughnut data={doughnutChartData} options={doughnutChartOptions} plugins={[ChartDataLabels]} />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '45%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body1" sx={{ color: 'white', fontSize: '12px', fontWeight: 300 }}>
                      workers
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'grey.400', fontSize: '12px', fontWeight: 300 }}>
                      Attendance
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>

          {collections.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                Collections
              </Typography>
              <Grid container spacing={2}>
                {collections.map((collection, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                    <Box
                      sx={{
                        bgcolor: '#F6F4FE',
                        p: 2,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: 100,
                        flex: '1 0 auto',
                        maxWidth: 120,
                      }}
                    >
                      <Box sx={{ bgcolor: '#211930', borderRadius: '10%', mb: 1 }}>
                        <CiMoneyBill size={54} style={{ color: '#F6F4FE', margin: '3px 8px' }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 'semibold', textAlign: 'center' }}>
                        {collection.collection.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'grey.800', display: 'flex', justifyContent: 'center', alignContent: 'center' }}
                      >
                        {formatCurrency(collection.amount)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Box sx={{ mb: 4 }}>
            <Accordion sx={{ bgcolor: '#393939', color: 'white' }}>
              <AccordionSummary expandIcon={<ArrowDownwardIcon sx={{ color: 'white' }} />}>
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Program Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    <strong>Date Created:</strong> {moment(eventData.date).tz('Africa/Lagos').format('dddd, MMMM D, YYYY')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    <strong>Program Type:</strong> {eventData.event.recurrenceType === 'none' ? 'Single' : eventData.event.recurrenceType}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    <strong>Time:</strong>{" "}
                    {new Date(`1970-01-01T${eventData.startTime}`).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    -{" "}
                    {new Date(`1970-01-01T${eventData.endTime}`).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    <strong>Day:</strong> {eventData.dayOfWeek}
                  </Typography>
                  {eventData?.assignedDepartments?.length > 0 && (
                    <Typography variant="body2" sx={{ color: 'grey.300' }}>
                      <strong>Assigned Departments:</strong>{' '}
                      {eventData.assignedDepartments.map((dept) => dept.name).join(', ')}
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>            
          </Box>

          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={handleDeleteClick}
              sx={{
                mt: 2,
                px: 8, // increased horizontal padding
                minWidth: '250px', // ensures a minimum width
                backgroundColor: "rgba(183, 28, 28, 0.3)", // transparent red
                color: "#f0f0f0", // white text
                border: "1px solid rgba(183, 28, 28, 0.4)", // subtle red border
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(183, 28, 28, 0.2)", // slightly deeper red on hover
                  borderColor: "#b71c1c",
                },
              }}
            >
              Delete
            </Button>
          </Box>


        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            pt: 2,
            flexDirection: { xs: 'column', sm: 'column', md: 'row' },
            alignItems: 'center',
            width: '100%',
          }}
        >
          {eventStatus !== 'past' && eventStatus !== 'pending' && (
            <Button
              variant="contained"
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
                width: { xs: '100%', sm: '100%', md: 'auto' },
              }}
              onClick={() => {
                if (eventData.eventId) {
                  setEditOpen(true);
                }
              }}
            >
              Edit Program
            </Button>
          )}

          {['ongoing', 'pending'].includes(eventStatus) && authData?.role === 'branch' && collections.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => {
                if (eventData.id) {
                  setRecordOpen(true);
                }
              }}
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
                width: { xs: '100%', sm: '100%', md: 'auto' },
              }}
            >
              Record Collections
            </Button>
          )}

          {['ongoing', 'pending'].includes(eventStatus) && (authData?.role === 'department' || authData?.role === 'branch') && (
            <Button
              onClick={() => {setOpenNewcomers(true); onClose()}}
              variant="contained"
              startIcon={<Save />}
              sx={{
                py: 1,
                backgroundColor: '#F6F4FE',
                px: { xs: 2, sm: 2 },
                color: '#2C2C2C',
                fontWeight: 'semibold',
                borderRadius: 50,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1rem' },
                '&:hover': { backgroundColor: '#F6F4FE', opacity: 0.9 },
                width: { xs: '100%', sm: '100%', md: 'auto' },
              }}
            >
              Record Newcomers
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDelOpen}
        onClose={() => !delloading && setConfirmDelOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            bgcolor: '#2C2C2C',
            color: 'white',
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: "#F6F4FE", fontWeight: 600 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{eventData.event.title}</strong> program?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDelOpen(false)}
            disabled={!eventId}
            sx={{ color: "#E4F4EC" }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={!eventId}
            variant="contained"
            sx={{
              bgcolor: "#EF4444",
              "&:hover": { bgcolor: "#DC2626" },
            }}
          >
            {delloading ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <EditProgramModal open={editOpen} eventId={eventData?.id || ''} onSuccess={fetchData} onClose={() => setEditOpen(false)} />
      <CollectionsDialogue eventId={eventData?.id || ''} onSuccess={fetchData} open={recordOpen} onClose={() => setRecordOpen(false)} />
      <MembersCountDialogue eventId={eventData?.id || ''} onSuccess={fetchData} open={recordMemberOpen} onClose={() => setRecordMemberOpen(false)} />
      <RegistrationModal
        open={openNewcomers}
        onClose={() => setOpenNewcomers(false)}
        onSuccess={() => setOpenNewcomers(false)}
        eventId={eventData?.id || ''}
      />
      <WorkerAttendanceDialogue
        eventId={eventData?.id || ''}
        open={workerOpen}
        onClose={() => setWorkerOpen(false)}
        onSuccess={fetchData}
        assignedDepartments={eventData?.assignedDepartments || []}
      />
    </>
  );
};

export default EventSummaryDialog;