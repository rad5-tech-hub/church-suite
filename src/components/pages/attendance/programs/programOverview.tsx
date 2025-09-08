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
  AccordionDetails
} from '@mui/material';
import { Close } from '@mui/icons-material';
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import dayjs from "dayjs"; // for formatting date
import Api from '../../../shared/api/api';
import CreateProgramModal from './services';
import RecordDialogue from './record';
import { CiMoneyBill } from "react-icons/ci";

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Type definitions (unchanged)
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
  amount: string; // Note: API returns amount as string
  collection: {
    id: string;
    name: string;
  };
}

interface EventOccurrence {
  // ... other properties
  collection: CollectionItem[]; // Changed from collections to collection
}

interface Event {
  id: string;
  title: string;
  recurrenceType: string;
  assignedDepartments: Departments[];
}

interface Departments {
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
  collections: CollectionItem[];
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
}

const EventSummaryDialog: React.FC<EventSummaryDialogProps> = ({ 
  eventId, 
  open, 
  onClose 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [eventData, setEventData] = useState<EventOccurrence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [EditOpen, setEditOpen] = useState<boolean>(false);
  const [recordOpen, setRecordOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && eventId) {
      const fetchEventData = async () => {
        try {
          setLoading(true);
          const response = await Api.get<EventResponse>(`/church/get-event/${eventId}`);
          setEventData(response.data.eventOccurrence);
          setError(null);
        } catch (err) {
          setError('Failed to fetch event data');
          console.error('Error fetching event data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchEventData();
    }
  }, [eventId, open]);

  // Get attendance data from API or use empty defaults
  const attendance = eventData?.attendances?.[0] || {
    male: 0, // Sample data from the design
    female: 0, // Sample data from the design
    children: 0, // Sample data from the design
    adults: 0,
    total: 0
  };

  // Chart.js data configuration for attendance bar chart
  const barChartData = {
    labels: ['Men', 'Women', 'Children'],
    datasets: [
      {
        label: 'Attendance',
        data: [attendance.male, attendance.female, attendance.children],
        backgroundColor: [
          '#F6F4FE',
          '#F6F4FE', 
          '#F6F4FE', 
        ],
        borderColor: [
          '#F6F4FE',
          '#F6F4FE',
          '#F6F4FE',
        ],
        borderWidth: 0,
        borderRadius: 5,
        barThickness: 60,
      },
    ],
  };

  // Find max attendance value
  const maxAttendance = Math.max(
    attendance.male || 0,
    attendance.female || 0,
    attendance.children || 0
  );

  // Round up to nearest 50 for chart scale
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
          label: function (context: any) {
            return `${context.dataset.label}: ${context.raw}`;
          },
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
        suggestedMax: suggestedMax || 50, // fallback if all zero
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawTicks: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          stepSize: 50,
          callback: function (value: any) {
            return value; // dynamically show every 50
          },
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

  // Calculate workers vs non-workers percentage
  const workersPercentage = 0;
  const nonWorkersPercentage = 0;

  // Chart.js data configuration for workers doughnut chart
  const doughnutChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [workersPercentage, nonWorkersPercentage],
        backgroundColor: [
          '#211930', // Workers - indigo
          '#F6F4FE', // Non-workers - gray
        ],
        borderColor: 'transparent',
        borderWidth: 0,
        cutout: '52%',
      },
    ],
  };

  // Fix: Properly type the doughnut chart options
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
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      },
      datalabels: {
        color: (context: any) => {
          // Get the background color of the current segment
          const backgroundColor = context.dataset.backgroundColor[context.dataIndex];
          // If background color is light (#F6F4FE), use dark text color
          return backgroundColor === '#F6F4FE' ? '#1f2937' : 'white';
        },
        formatter: (value: number) => {
          return `${value}%`;
        },
        font: {
          weight: 'bold',
          size: 14
        }
      }
    },
  };

  // Update the formatCurrency function to handle string amounts
  const formatCurrency = (amount: string | number, currency: string = 'NGN'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // In the component, update how you access collections
  const collections = eventData?.collection || [];

  const StatCard = ({ title, value }: { title: string; value: string }) => (
    <Box sx={{ 
      bgcolor: '#F6F4FE', 
      p: 2, 
      borderRadius: 2, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minWidth: 100,
      flex: '1 0 auto',
      maxWidth: 120
    }}>
      <Box sx={{ bgcolor: '#211930', borderRadius: '10%', mb: 1 }} >
        <CiMoneyBill size={54} style={{ color: '#F6F4FE', margin: '3px 8px' }} />
      </Box>
      <Typography variant="body2" sx={{ color: 'grey.800', fontWeight: 'semibold', textAlign: 'center' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'grey.800', display: 'flex', justifyContent: 'center', alignContent: 'center', height: 'full'}}>
        {value}
      </Typography>
    </Box>
  );

  if (loading) {
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
            color: 'white',
            p: 2
          },
        }}
      >
        <DialogTitle sx={{ p: 0, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Loading...
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center'}} >
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
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            bgcolor: "#2C2C2C",
            color: 'white',
            p: 2
          },
        }}
      >
        <DialogTitle sx={{ p: 0, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Error
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{minHeight: '300px'}}>
          <Typography>{error || 'No data available'}</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            bgcolor: "#2C2C2C",
            py: 2,
            px: 3,
            color: 'white',
          },
        }}
      >
        <DialogTitle sx={{ p: 0, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {eventData.event.title}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 3, mb: 4 }}>
            {/* Attendance Bar Chart */}
            <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#393939',border: '1.5px #404040 solid', height: 380 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                Members Attendance
              </Typography>
              <Box sx={{ height: 250 }}>
                <Bar data={barChartData} options={barChartOptions} plugins={[ChartDataLabels]} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>                
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    {attendance.male} Men
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>             
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    {attendance.female} Women
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    {attendance.children} Children
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Workers Attendance Doughnut Chart */}
            <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#393939', height: 380, border: '1.5px #404040 solid', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                Workers Attendance
              </Typography>
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <Box sx={{ width: isMobile ? 250 : 280, height: isMobile ? 250 : 280 }}>
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} plugins={[ChartDataLabels]} />
                </Box>
                <Box sx={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'white', fontSize: '12px', fontWeight: '300' }}>
                    workers
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400', fontSize: '12px', fontWeight: '300'  }}>
                    Attendance
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Collections Section */}
          {collections.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                Collections
              </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}>
                  {collections.map((collection, index) => (
                    <StatCard 
                      key={index} 
                      title={collection.collection.name} // Use collection.name instead of type
                      value={formatCurrency(collection.amount)} 
                    />
                  ))}
                </Box>
            </Box>
          )}

          <Box sx={{marginBottom: 4}}>
            <Accordion sx={{ bgcolor: "#393939", color: "white" }}>
              <AccordionSummary
                expandIcon={<ArrowDownwardIcon sx={{ color: "white" }} />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span" sx={{ fontWeight: "bold" }}>
                  Program Details
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "grey.300" }}>
                    <strong>Date Created:</strong>{" "}
                    {dayjs(eventData.date).format("dddd, MMMM D, YYYY")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "grey.300" }}>
                    <strong>Program Type:</strong> {eventData.event.recurrenceType === 'none' ? 'Single' : eventData.event.recurrenceType}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "grey.300" }}>
                    <strong>Time:</strong> {eventData.startTime} - {eventData.endTime}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "grey.300" }}>
                    <strong>Day:</strong> {eventData.dayOfWeek}
                  </Typography>
                  {eventData.event?.assignedDepartments?.length > 0 && (
                    <Typography variant="body2" sx={{ color: "grey.300" }}>
                      <strong>Assigned Departments:</strong>{" "}
                      {eventData.event.assignedDepartments
                        .map((dept) => dept.name)
                        .join(", ")}
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pt: 2 }}>
          <Button 
            variant="contained" 
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
            onClick={() => {
              if (eventData.id) {
                setEditOpen(true);
                onClose(); // Close the Event Summary dialog
              }
            }}
          >
            Edit Program
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              if (eventData.id) {
                setRecordOpen(true);
                onClose(); // Close the Event Summary dialog
              }
            }}
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
            Manage Program
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Program Dialog */}
      <CreateProgramModal
        open={EditOpen}
        eventId={eventData.id}
        onClose={() => setEditOpen(false)}
      />
      <RecordDialogue
        eventId={eventData.id}
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
      />
    </>
  );
};

export default EventSummaryDialog;