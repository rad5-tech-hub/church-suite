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
import RegistrationModal from '../../members/new-comers/followUp';
import MembersCountDialogue from './memberAttendance';
import CollectionsDialogue from './recordCollections';

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
  const [openForms, setOpenForms] = useState(false);
  const [formId, setFormId] = useState('');
  const [loadingForms, setLoadingForms] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
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
  // date/time used for status calculation and kept in state
  const date = '';
  const startTime ='';
  const endTime = '';
  const [eventStatus, setEventStatus] = useState<string>('');

  /**
   * Rules implemented:
   * - upcoming: date/time has not started yet
   * - ongoing: started but not ended
   * - pending: end time has passed AND hasAttendance === false
   * - past: end time has passed AND hasAttendance === true
   */
  const getEventStatus = (
    evDate: string,
    evStart: string,
    evEnd: string,
    hasAttendance: boolean = false
  ): string => {
    const now = moment().tz('Africa/Lagos');

    // Validate incoming date and times
    const eventDate = moment.tz(evDate, 'YYYY-MM-DD', 'Africa/Lagos');
    const validStart = !!evStart && /^\d{2}:\d{2}$/.test(evStart);
    const validEnd = !!evEnd && /^\d{2}:\d{2}$/.test(evEnd);

    // If date invalid - treat as upcoming fallback
    if (!eventDate.isValid()) return 'upcoming';

    // If times invalid treat as upcoming (not scheduled fully)
    if (!validStart || !validEnd) return 'upcoming';

    const eventStart = moment.tz(`${evDate} ${evStart}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');
    const eventEnd = moment.tz(`${evDate} ${evEnd}`, 'YYYY-MM-DD HH:mm', 'Africa/Lagos');

    // If event hasn't started yet
    if (now.isBefore(eventStart)) return 'upcoming';

    // If currently between start and end -> ongoing
    if (now.isBetween(eventStart, eventEnd, undefined, '[)')) return 'ongoing';

    // If after end time
    if (now.isAfter(eventEnd)) {
      return hasAttendance ? 'past' : 'pending';
    }

    return 'upcoming';
  };

  // update eventStatus whenever date/time/attendance change
  useEffect(() => {
    if (date) {
      const status = getEventStatus(date, startTime, endTime, Boolean(eventData?.hasAttendance));
      setEventStatus(status);
    }
  }, [date, startTime, endTime, eventData?.hasAttendance]);

  // open forms (newcomers) list
  const handleOpen = async () => {
    setOpenForms(true);
    setLoadingForms(true);
    try {
      const res = await Api.get(`/follow/all-forms?branchId=${authData?.branchId}`);
      if (res.data?.data) setForms(res.data.data);
    } catch (err) {
      console.error('❌ Failed to fetch forms:', err);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleClose = () => setOpenForms(false);

  const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);

    const eventRes = await Api.get<EventResponse>(`/church/get-event/${eventId}`);
    const eventOccurrence = eventRes.data.eventOccurrence;
    // Normalize assignedDepartments to always be an array
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
  // const showWorkersChart = eventData?.assignedDepartments?.length > 0;

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
          <IconButton onClick={()=>{onClose(), onSuccess()}} sx={{ color: 'white' }}>
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
                        onClick={() => {
                          setRecordMemberOpen(true);                         
                        }}
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Workers Attendance
                  </Typography>
                  {['ongoing', 'pending'].includes(eventStatus) && !eventData.hasAttendance && (
                    <Tooltip title="Record Workers Attendance" arrow>
                      <IconButton
                        onClick={() => {
                          setWorkerOpen(true);                         
                        }}
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
          {/* Show Edit Program button only if hasAttendance is false and eventStatus is not 'past' */}
          {eventStatus !== 'past' && eventStatus !== 'pending'  && (
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

          {/* Show Record Collections button only if hasAttendance is false, eventStatus is 'ongoing' or 'past', and collections exist */}
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

          {/* Show Record Newcomers button only if hasAttendance is false, eventStatus is 'ongoing' or 'past', and appropriate role */}
          {['ongoing', 'pending'].includes(eventStatus) && (authData?.role === 'department' || authData?.role === 'branch') && (
            // <Button
            //   onClick={() => {
            //     setOpenNewcomers(true);
            //     onClose();
            //   }}
            //   variant="contained"
            //   startIcon={<Save />}
            //   sx={{
            //     py: 1,
            //     backgroundColor: '#F6F4FE',
            //     px: { xs: 2, sm: 2 },
            //     color: '#2C2C2C',
            //     fontWeight: 'semibold',
            //     borderRadius: 50,
            //     textTransform: 'none',
            //     fontSize: { xs: '1rem', sm: '1rem' },
            //     '&:hover': { backgroundColor: '#F6F4FE', opacity: 0.9 },
            //     width: { xs: '100%', sm: '100%', md: 'auto' },
            //   }}
            // >
            //   Record Newcomers
            // </Button>
            <Button
              onClick={handleOpen}
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
        open={openForms}
        onClose={(_, reason) => {
          if (reason !== "backdropClick") {
          handleClose();
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            backgroundColor: "#2C2C2C",
            color: "#F6F4FE",
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
        <Typography fontWeight="bold">
          Select a form
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: '#F6F4FE' }} aria-label="Close dialog">
          <Close />
        </IconButton>
      </DialogTitle>

        <DialogContent>
          {loadingForms ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={28} sx={{ color: "#4CAF50" }} />
            </Box>
          ) : forms.length === 0 ? (
            <Typography sx={{ color: "#BFBFBF", textAlign: "center", mt: 2 }}>
              No forms available.
            </Typography>
          ) : (
            forms.map((form) => (
              <Box
                key={form.id}
                onClick={() => {
                  setFormId(form.id)
                  setOpenNewcomers(true);                  
                }}
                sx={{
                  border: "1px solid #4B4B4B",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#4CAF50",
                    backgroundColor: "rgba(76, 175, 80, 0.08)",
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#F6F4FE" }}>
                  {form.name}
                </Typography>
                <Typography sx={{ color: "#BFBFBF", fontSize: "0.9rem" }}>
                  {form.description.length > 30
                    ? `${form.description.slice(0, 30)}...`
                    : form.description}
                </Typography>
              </Box>
            ))
          )}
        </DialogContent>
      </Dialog>

      <EditProgramModal open={editOpen} eventId={eventData?.id || ''} onSuccess={fetchData} onClose={() => setEditOpen(false)} />
      <CollectionsDialogue eventId={eventData?.id || ''} onSuccess={fetchData} open={recordOpen} onClose={() => setRecordOpen(false)} />
      <MembersCountDialogue eventId={eventData?.id || ''} onSuccess={fetchData} open={recordMemberOpen} onClose={() => setRecordMemberOpen(false)} />
      <RegistrationModal
        open={openNewcomers}
        onClose={() => setOpenNewcomers(false)}
        onSuccess={() => {setOpenNewcomers(false), setOpenForms(false)}}
        eventId={eventData?.id || ''}
        formId={formId}
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