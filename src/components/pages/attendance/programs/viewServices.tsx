import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { showPageToast } from "../../../util/pageToast";
import { usePageToast } from "../../../hooks/usePageToast";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { RRule } from "rrule";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { Check } from "@mui/icons-material";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { CreateProgramModal, EditProgramModal } from "./services";
import EventSummaryDialog from "./programOverview";

const localizer = momentLocalizer(moment);

interface Branch {
  id: string;
  name: string;
}

interface Occurrence {
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
}

interface Event {
  id: string;
  title: string;
  description: string | null;
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
    description: string | null;
    recurrenceType: string;
    eventId: string;
    occurrenceId: string;
    status: string;
    dayOfWeek: string;
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
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setCurrentEvent] = useState<Event | null>(null);
  const [currentOccurrence, setCurrentOccurrence] = useState<Occurrence | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [branchLoading, setBranchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  usePageToast("view-programs");

  const eventStatusColors = {
    ongoing: {
      background: "#E4F4EC", // Light green
      text: "#2d5016", // Dark green
      legend: "#4caf50" // Original green for legend
    },
    pending: {
      background: "#fff3e0", // Light orange
      text: "#e65100", // Dark orange
      legend: "#ff9800" // Original orange for legend
    },
    upcoming: {
      background: "#f3e5f5", // Light purple
      text: "#4a148c", // Dark purple
      legend: "#9c27b0" // Original purple for legend
    },
    past: {
      background: "#E5E3EC", // Light gray
      text: "#424242", // Dark gray
      legend: "#757575" // Original gray for legend
    },
  };

  const getEventStatus = (start: Date, end: Date, hasAttendance: boolean): keyof typeof eventStatusColors => {
    const now = new Date();
    
    const eventStart = new Date(start);
    const eventEnd = new Date(end);

    // Check if program has ended (endTime has passed)
    const hasEnded = now > eventEnd;

    // Past: hasAttendance is true and program has ended
    if (hasEnded && hasAttendance) {
      return "past";
    }

    // Pending: hasAttendance is false and program has ended
    if (hasEnded && !hasAttendance) {
      return "pending";
    }

    // Ongoing: Current time is between startTime and endTime
    if (now >= eventStart && now <= eventEnd) {
      return "ongoing";
    }

    // Upcoming: Program has not started yet (startTime in future)
    if (now < eventStart) {
      return "upcoming";
    }

    // Default to upcoming for any edge cases
    return "upcoming";
  };

  const getEventColors = (status: keyof typeof eventStatusColors) => {
    return eventStatusColors[status] || eventStatusColors.upcoming;
  };

  const fetchBranches = useCallback(async () => {
    if (fetched) return;
    setBranchLoading(true);
    setError(null);
    try {
      const res = await Api.get("/church/get-branches");
      const data: Branch[] = res.data.branches || [];
      setBranches(data);
      setSelectedBranch(authData?.branchId || data[0]?.id || "");
      setFetched(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch branches");
    } finally {
      setBranchLoading(false);
    }
  }, [fetched, authData?.branchId]);

    const fetchEvents = useCallback(
      async (viewType: "month" | "week" | "day" = view, date: Date = currentDate) => {
        setLoading(true);
        try {
          let params = new URLSearchParams();

          // ✅ Branch always comes first
          const branchId = selectedBranch || authData?.branchId || "";
          if (!branchId) throw new Error("No branch selected");
          params.append("branchId", branchId);

          // ✅ Add departmentId if role = department
          if (authData?.role === "department") {
            if (!authData.department) throw new Error("No department found");
            params.append("departmentId", authData.department);
          }

          // ✅ Add dates depending on view type
          if (viewType === "month") {
            params.append("startDate", moment(date).startOf("month").format("YYYY-MM-DD"));
            params.append("endDate", moment(date).endOf("month").format("YYYY-MM-DD"));
          } else if (viewType === "week") {
            params.append("startDate", moment(date).startOf("week").format("YYYY-MM-DD"));
            params.append("endDate", moment(date).endOf("week").format("YYYY-MM-DD"));
          } else if (viewType === "day") {
            params.append("date", moment(date).format("YYYY-MM-DD"));
          }

          const url = `/church/get-events?${params.toString()}`;
          const response = await Api.get<FetchEventsResponse>(url);
          const data = response.data;

          if (!isFetchEventsResponse(data)) {
            throw new Error("Invalid response structure");
          }

          setEvents(data.events || []);
        } catch (error) {
          console.error("fetchEvents error:", error);
          showPageToast("Failed to load events", "error");
        } finally {
          setLoading(false);
        }
      },
      [view, currentDate, selectedBranch, authData?.branchId, authData?.department, authData?.role]
    );

    useEffect(() => {
      if (selectedBranch || authData?.branchId) {
        fetchEvents();
      }
    }, [fetchEvents, selectedBranch, authData?.branchId]);

  const handleViewChange = useCallback(
    (newView: "month" | "week" | "day") => {
      setView(newView);
      fetchEvents(newView, currentDate);
    },
    [fetchEvents, currentDate]
  );

  const handleNavigate = useCallback(
    (newDate: Date) => {
      setCurrentDate(newDate);
      fetchEvents(view, newDate);
    },
    [fetchEvents, view]
  );

  // ✅ Utility to format HH:mm into AM/PM
  const formatTime = (time: string | null, fallback: string): string => {
    if (!time) return fallback;
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calendarEvents: CalendarEvent[] = events.flatMap((e) =>
    e.occurrences
      .filter((occ) => !occ.isCancelled)
      .map((occ) => {
        const eventDate = moment(occ.date).format("YYYY-MM-DD");
        const dayOfWeek = moment(occ.date).format("dddd");

        // Show fallback in AM/PM style
        const formattedStart = formatTime(occ.startTime, "9:00 AM");
        const formattedEnd = formatTime(occ.endTime, "5:00 PM");

        // Keep raw values for Date objects
        const startDateTime = moment(
          `${eventDate} ${occ.startTime || "09:00"}`,
          "YYYY-MM-DD HH:mm"
        ).toDate();

        const endDateTime = moment(
          `${eventDate} ${occ.endTime || "17:00"}`,
          "YYYY-MM-DD HH:mm"
        ).toDate();

        // Pass hasAttendance to getEventStatus
        const eventStatus = getEventStatus(startDateTime, endDateTime, occ.hasAttendance);
        const colors = getEventColors(eventStatus);

        return {
          id: `${e.id}-${occ.id}`,
          title: `${e.title} (${formattedStart} - ${formattedEnd})`,
          start: startDateTime,
          end: endDateTime,
          color: colors.background,
          extendedProps: {
            description: e.description,
            recurrenceType: e.recurrenceType,
            eventId: e.id,
            occurrenceId: occ.id,
            status: eventStatus,
            dayOfWeek,
          },
          rrule:
            e.recurrenceType && e.recurrenceType !== "none"
              ? {
                  freq:
                    e.recurrenceType === "weekly"
                      ? RRule.WEEKLY
                      : e.recurrenceType === "monthly"
                      ? RRule.MONTHLY
                      : RRule.DAILY,
                  dtstart: startDateTime,
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

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const colors = getEventColors(event.extendedProps.status as keyof typeof eventStatusColors);
    
    return (
      <div style={{ 
        padding: "4px", 
        overflow: "hidden",
        color: colors.text,
        fontWeight: "500"
      }}>
        <div style={{ fontSize: "12px", fontWeight: "600", padding: 3 }}>
          {event.title}
        </div>
      </div>
    );
  };

  return (
    <DashboardManager>
      <Box sx={{ minHeight: "100vh", py: 3, px: 1 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 1.5 }}>
            <Box
              sx={{
                borderRadius: 2,
                boxShadow: { lg: 0, sm: 1 },
                display: "flex",
                flexDirection: "column",
              }}
            >
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
                  display: { xs: "grid", lg: "block" },
                  gridTemplateColumns: { xs: "1fr 1fr" },
                  gap: 1,
                  padding: 0,
                }}
              >
                {Object.entries(eventStatusColors).map(([status, colors]) => (
                  <ListItem key={status} sx={{ color: "white" }}>
                    <IconButton
                      size="small"
                      sx={{
                        borderRadius: "50%",
                        bgcolor: colors.legend,
                        mr: 1,
                        width: 25,
                        height: 25,
                      }}
                    >
                      <Check sx={{ fontSize: "20px" }} />
                    </IconButton>
                    <span style={{ textTransform: "capitalize" }}>{status}</span>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 10.5 }}>
            <Box sx={{ borderRadius: 2, boxShadow: 1, p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  gap: 2,
                  backgroundColor: "transparent",
                  color: "#f6f4fe",
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                {/* Left: Date & Navigation */}
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="h6" sx={{ fontSize: "1.125rem", fontWeight: "medium" }}>
                    {moment(currentDate).format("MMMM YYYY")}
                  </Typography>
                  <Button
                    onClick={() => handleNavigate(moment(currentDate).subtract(1, view).toDate())}
                    sx={{ p: 1, color: "#f6f4fe", "&:hover": { bgcolor: "grey.100", color: "purple" }, borderRadius: 1 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <Button
                    onClick={() => handleNavigate(moment(currentDate).add(1, view).toDate())}
                    sx={{ p: 1, color: "#f6f4fe", "&:hover": { bgcolor: "grey.100", color: "purple" }, borderRadius: 1 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Box>

                {/* Middle: Branch Selector (only for HQ + SuperAdmin) */}
                {(authData?.isHeadQuarter && authData?.isSuperAdmin) && (
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Typography variant="body2" sx={{ color: "#777280", display: { xs: "none", lg: "block" } }}>
                      Branch:
                    </Typography>
                    <FormControl
                      size="small"
                      sx={{
                        minWidth: 180,
                        "& .MuiInputBase-root": { borderRadius: 2, bgcolor: "#f6f4fe", color: "#000" },
                      }}
                    >
                      <Select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        onOpen={fetchBranches}
                        displayEmpty
                        renderValue={(selected) =>
                          selected ? branches.find((b) => b.id === selected)?.name || "Select Branch" : "Select Branch"
                        }
                      >
                        <MenuItem value="">None</MenuItem>
                        {branchLoading && (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                          </MenuItem>
                        )}
                        {error && (
                          <MenuItem disabled sx={{ color: "red" }}>
                            {error}
                          </MenuItem>
                        )}
                        {!branchLoading &&
                          !error &&
                          branches.map((branch) => (
                            <MenuItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Right: Program View Selector */}
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <Typography variant="body2" sx={{ color: "#777280", display: { xs: "none", lg: "block" } }}>
                    Program for the
                  </Typography>
                  {["month", "week", "day"].map((viewType) => (
                    <Chip
                      key={viewType}
                      label={viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                      onClick={() => handleViewChange(viewType as "month" | "week" | "day")}
                      sx={{
                        p: 1,
                        color: view === viewType ? "grey" : "#777280",
                        bgcolor: view === viewType ? "#f6f4fe" : "none",
                        cursor: "pointer",
                      }}
                      variant={view === viewType ? "filled" : "outlined"}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ backgroundColor: "#f6f4fe", borderRadius: 2, p: 1, position: "relative" }}>
                <style>{`
                  .rbc-time-gutter {
                    width: 60px !important;
                    display: block !important;
                  }

                  .rbc-time-slot {                   
                    font-size: 12px !important;
                    font-weight: 500 !important;
                  }

                  .rbc-time-header-gutter {
                    display: block !important;
                  }               

                  .rbc-time-view .rbc-time-gutter .rbc-timeslot-group {
                    display: block !important;
                  }       

                  .rbc-label {
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    color: #333 !important;
                  }
                `}</style>


                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{
                    height: "calc(100vh - 180px)",
                    minHeight: "600px",
                  }}
                  eventPropGetter={(event) => {
                    const colors = getEventColors(event.extendedProps.status as keyof typeof eventStatusColors);
                    return {
                      style: {
                        backgroundColor: colors.background,
                        color: colors.text,
                        border: `1px solid ${colors.legend}`,
                        borderRadius: "4px",
                        fontSize: "11px",
                      },
                    };
                  }}
                  components={{ 
                    event: EventComponent,
                    timeGutterHeader: () => <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>Time</div>,
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
                  showMultiDayTimes={true}
                  step={60} // 60-minute intervals for cleaner 24-hour display
                  timeslots={1} // One slot per hour
                  views={["month", "week", "day"]}
                  min={new Date(2025, 0, 1, 6, 0)} // Start at 6:00 AM
                  max={new Date(2025, 0, 1, 22, 0)} // End at 10:00 PM
                  formats={{
                    timeGutterFormat: (date) => {
                      const hour = date.getHours();
                      const period = hour >= 12 ? "PM" : "AM";
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      return `${displayHour}:00${period}`;
                    },
                    eventTimeRangeFormat: ({ start, end }, culture, localizer) => {
                      if (!localizer) {
                        const startTime = moment(start).format("h:mm A");
                        const endTime = moment(end).format("h:mm A");
                        return `${startTime} - ${endTime}`;
                      }
                      return `${localizer.format(start, "h:mm A", culture)} - ${localizer.format(
                        end,
                        "h:mm A",
                        culture
                      )}`;
                    },
                    agendaTimeFormat: (date, culture, localizer) => {
                      if (!localizer) {
                        return moment(date).format("h:mm A");
                      }
                      return localizer.format(date, "h:mm A", culture);
                    },
                    agendaTimeRangeFormat: ({ start, end }, culture, localizer) => {
                      if (!localizer) {
                        const startTime = moment(start).format("h:mm A");
                        const endTime = moment(end).format("h:mm A");
                        return `${startTime} - ${endTime}`;
                      }
                      return `${localizer.format(start, "h:mm A", culture)} - ${localizer.format(
                        end,
                        "h:mm A",
                        culture
                      )}`;
                    },
                  }}

                />
                {loading && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 2,
                      zIndex: 10,
                    }}
                  >
                    <CircularProgress size={40} sx={{ color: "white" }} />
                  </Box>
                )}
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
          onSuccess={fetchEvents}
        />

        <CreateProgramModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            fetchEvents(view, currentDate);
          }}          
        />
        <EditProgramModal
          open={false}
          eventId={currentOccurrence?.eventId || ""}
          onClose={() => {}}      
          />
      </Box>
    </DashboardManager>
  );
};

export default ViewServices;