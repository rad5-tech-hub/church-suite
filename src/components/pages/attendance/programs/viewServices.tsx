import React, { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventSummaryDialog from "./programOverview";
import { RRule } from "rrule";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  useTheme,
  useMediaQuery,
  Typography,
  Chip,
  Grid,
} from "@mui/material";
import { Check } from "@mui/icons-material";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import CreateProgramModal from "./services";

const localizer = momentLocalizer(moment);

interface Occurrence {
  id: string;
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  hasAttendance: boolean;
  dayOfWeek: string;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  customRecurrenceDates: string[] | null;
  recurrenceType: string;
  tenantId: string;
  churchId: string;
  branchId: string | null;
  createdBy: string;
  createByName: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  occurrences: Occurrence[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  extendedProps: {
    description: string;
    recurrenceType: string;
    eventId: string;
    occurrenceId: string;
    status: string;
  };
  rrule?: {
    freq: number;
    dtstart: Date;
  };
}

interface FetchEventsResponse {
  message: string;
  events: Event[];
}

const isFetchEventsResponse = (data: unknown): data is FetchEventsResponse => {
  return (
    !!data &&
    typeof data === "object" &&
    "message" in data &&
    "events" in data &&
    Array.isArray((data as any).events)
  );
};

const ViewServices: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [events, setEvents] = useState<Event[]>([]);
  const [, setLoading] = useState(false);
  const [, setCurrentEvent] = useState<Event | null>(null);
  const [currentOccurrence, setCurrentOccurrence] = useState<Occurrence | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [isOpen, setIsOpen] = useState(false);
  
  const eventStatusColors = {
    ongoing: "green",
    pending: "orange",
    upcoming: "purple",
    past: "gray",
  };

  const getEventStatus = (start: Date, end: Date): keyof typeof eventStatusColors => {
    const now = new Date();
    
    if (now > end) return "past";
    if (now >= start && now <= end) return "ongoing";
    if (now < start && (start.getTime() - now.getTime()) <= 24 * 60 * 60 * 1000) return "pending";
    
    return "upcoming";
  };

  const getEventColor = (event: CalendarEvent): string => {
    return eventStatusColors[event.extendedProps.status as keyof typeof eventStatusColors] || eventStatusColors.upcoming;
  };

  const fetchEvents = useCallback(async (viewType: "month" | "week" | "day" = view, date: Date = currentDate) => {
    setLoading(true);
    try {
      let url = "/church/get-events";
      
      if (viewType === "month") {
        const startOfMonth = moment(date).startOf('month').format('YYYY-MM-DD');
        const endOfMonth = moment(date).endOf('month').format('YYYY-MM-DD');
        url = `/church/get-events?startDate=${startOfMonth}&endDate=${endOfMonth}`;
      } else if (viewType === "day") {
        const day = moment(date).format('YYYY-MM-DD');
        url = `/church/get-events?date=${day}`;
      } else{
        url = '/church/get-events'
      }

      const response = await Api.get<FetchEventsResponse>(url);
      const data = response.data;
      if (!isFetchEventsResponse(data)) {
        throw new Error("Invalid response structure");
      }
      setEvents(data.events || []);
    } catch (error) {
      toast.error("Failed to load events", {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [isMobile, view, currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleViewChange = useCallback((newView: "month" | "week" | "day") => {
    setView(newView);
    fetchEvents(newView, currentDate);
  }, [fetchEvents, currentDate]);

  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
    fetchEvents(view, newDate);
  }, [fetchEvents, view]);

  const calendarEvents: CalendarEvent[] = events.flatMap((e) =>
    e.occurrences.map((occ) => {
      const startDateTime = occ.startTime 
        ? moment(`${occ.date.split("T")[0]}T${occ.startTime}`).toDate()
        : moment(occ.date).startOf('day').toDate();
      
      const endDateTime = occ.endTime 
        ? moment(`${occ.date.split("T")[0]}T${occ.endTime}`).toDate()
        : moment(occ.date).endOf('day').toDate();
      
      const eventStatus = getEventStatus(startDateTime, endDateTime);
      
      return {
        id: `${e.id}-${occ.id}`,
        title: e.title,
        start: startDateTime,
        end: endDateTime,
        color: eventStatusColors[eventStatus],
        extendedProps: {
          description: e.description,
          recurrenceType: e.recurrenceType,
          eventId: e.id,
          occurrenceId: occ.id,
          status: eventStatus,
        },
        rrule: e.recurrenceType && e.recurrenceType !== "none"
          ? {
              freq:
                e.recurrenceType === "weekly"
                  ? RRule.WEEKLY
                  : e.recurrenceType === "monthly"
                  ? RRule.MONTHLY
                  : RRule.DAILY,
              dtstart: new Date(e.date),
            }
          : undefined,
      };
    })
  );

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      const eventData = events.find((e) => e.id === event.extendedProps.eventId);
      const occurrenceData = eventData?.occurrences.find(
        (occ) => occ.id === event.extendedProps.occurrenceId
      );
      if (eventData && occurrenceData) {
        setCurrentEvent(eventData);
        setCurrentOccurrence(occurrenceData);
        setSummaryDialogOpen(true);
      }
    },
    [events]
  );

  // Custom event component to show time
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const formatTime = (date: Date) => moment(date).format("h:mm A");
    
    return (
      <div style={{ padding: "2px", overflow: "hidden" }}>
        <div style={{ fontSize: "10px", fontWeight: "bold" }}>
          {formatTime(event.start)} - {formatTime(event.end)}
        </div>
        <div style={{ fontSize: "12px" }}>{event.title}</div>
      </div>
    );
  };

  return (
    <DashboardManager>
      <ToastContainer/>
      <Box sx={{ minHeight: "100vh", py:3, px:1 }}>
        <Grid container spacing={2}>
          <Grid size={{xs:12 , lg: 1.5}}>
            <Box sx={{ borderRadius: 2, boxShadow: {lg: 0, sm: 1},            
              display: 'flex', 
              flexDirection: 'column',
              }}>
              <Button
                variant="contained"
                onClick={() => setIsOpen(true)}
                sx={{
                  mb: 2,
                  backgroundColor: "#F6F4FE",
                  color: "gray",
                  border: "1px solid white",
                  width: { xs: "100%", md: "auto" },
                }}
              >
                + Create
              </Button>
              <List
                sx={{
                  display: { xs: "grid", md: "block" },
                  gridTemplateColumns: { xs: "1fr 1fr" },
                  gap: 1,
                  padding: 0,
                }}
              >
                {Object.entries(eventStatusColors).map(([status, color]) => (
                  <ListItem key={status} sx={{ color: "white" }}>
                    <IconButton
                      size="small"
                      sx={{
                        borderRadius: "50%",
                        bgcolor: color,
                        mr: 1,
                        width: 25,
                        height: 25,
                      }}
                    >
                      <Check sx={{ fontSize: "20px" }} />
                    </IconButton>
                    <span className="text-sm" style={{ textTransform: 'capitalize' }}>
                      {status}
                    </span>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>

          <Grid size={{xs:12 , lg: 10.5}}>
            <Box sx={{ borderRadius: 2, boxShadow: 1, p: 2 }}>
              <Box sx={{ 
                display: "flex", 
                flexDirection: { xs: "column", sm: "row" }, 
                justifyContent: "space-between", 
                alignItems: { xs: "flex-start", sm: "center" },
                mb: 2,
                gap: 1,
                backgroundColor: 'transparent',
                color: '#f6f4fe'
              }}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  flexWrap: 'wrap',
                  backgroundColor: 'transparent',
                }}>
                <Typography variant="h6" sx={{ fontSize: "1.125rem", fontWeight: "medium" }}>
                  {moment(currentDate).format("MMMM YYYY")}
                </Typography>
                <Button
                  onClick={() => handleNavigate(moment(currentDate).subtract(1, view).toDate())}
                  sx={{ p: 1, color: '#f6f4fe', "&:hover": { bgcolor: "grey.100" , color: 'purple'}, borderRadius: 1 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button
                  onClick={() => handleNavigate(moment(currentDate).add(1, view).toDate())}
                  sx={{ p: 1,  color: '#f6f4fe', "&:hover": { bgcolor: "grey.100" , color: 'purple'},  borderRadius: 1 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
                </Box>
                
                <Box sx={{ display: "flex", gap: 0.5, alignItems:'center'}}>   
                  <Typography variant="body2" sx={{ color: '#777280' }}>Program for the</Typography>               
                  {["month", "week", "day"].map((viewType) => (
                    <Chip
                      key={viewType}
                      label={viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                      onClick={() => handleViewChange(viewType as "month" | "week" | "day")}                      
                      sx={{
                        p: 2, 
                        color: view === viewType ? "grey" : "#777280", 
                        bgcolor: view === viewType ? '#f6f4fe' : 'none', 
                        cursor: 'pointer'
                      }}
                      variant={view === viewType ? "filled" : "outlined"}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
              
              <Box sx={{backgroundColor: '#f6f4fe', borderRadius: 2, p:1}}>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ 
                    height: "calc(100vh - 180px)",
                    minHeight: "600px"
                  }}
                  eventPropGetter={(event) => ({
                    style: {                  
                      color: "#000",
                      backgroundColor: getEventColor(event as CalendarEvent),
                      borderRadius: "3px",
                      border: "none",
                    },
                  })}
                  components={{
                    event: EventComponent
                  }}
                  onSelectEvent={handleSelectEvent}    
                  selectable
                  popup
                  view={view}
                  onView={(newView) => {
                    if (["month", "week", "day"].includes(newView)) {
                      handleViewChange(newView as "month" | "week" | "day");
                    }
                  }}
                  date={currentDate}
                  onNavigate={handleNavigate}        
                  dayLayoutAlgorithm="no-overlap"
                  showMultiDayTimes
                  step={15}
                  timeslots={isMobile ? 2 : 4}
                  views={["month", "week", "day"]}
                  min={new Date(2025, 7, 1, 6, 0)}
                  max={new Date(2025, 7, 1, 22, 0)}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        <EventSummaryDialog
          eventId={currentOccurrence?.id || ""}
          open={summaryDialogOpen}
          onClose={() => {
            setSummaryDialogOpen(false);
            setCurrentEvent(null);
            setCurrentOccurrence(null);
          }}
        />

        <CreateProgramModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            fetchEvents(view, currentDate);
            toast.success("Program created successfully!", {
              position: isMobile ? "top-center" : "top-right",
            });
          }}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewServices;