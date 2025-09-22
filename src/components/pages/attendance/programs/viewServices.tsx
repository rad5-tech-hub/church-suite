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
  useTheme,
  useMediaQuery,
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
import { CreateProgramModal } from "./services";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
    ongoing: "green",
    pending: "orange",
    upcoming: "purple",
    past: "gray",
  };

  const getEventStatus = (start: Date, end: Date): keyof typeof eventStatusColors => {
    const now = new Date();
    if (now > end) return "past";
    if (now >= start && now <= end) return "ongoing";
    if (now < start && start.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) return "pending";
    return "upcoming";
  };

  const getEventColor = (event: CalendarEvent): string => {
    return eventStatusColors[event.extendedProps.status as keyof typeof eventStatusColors] || eventStatusColors.upcoming;
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
        const branchId = selectedBranch || authData?.branchId || "";
        if (!branchId) {
          throw new Error("No branch selected");
        }

        const params = new URLSearchParams({ branchId });

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
        showPageToast("Failed to load events", "error");
      } finally {
        setLoading(false);
      }
    },
    [view, currentDate, selectedBranch, authData?.branchId]
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

  const calendarEvents: CalendarEvent[] = events.flatMap((e) =>
    e.occurrences
      .filter((occ) => !occ.isCancelled) // Skip cancelled occurrences
      .map((occ) => {
        // Recalculate dayOfWeek to ensure accuracy
        const eventDate = moment(occ.date).toDate();
        const dayOfWeek = moment(eventDate).format("dddd");

        // Handle null startTime and endTime with fallback times
        const startTime = occ.startTime || "09:00"; // Default to 9:00 AM
        const endTime = occ.endTime || "17:00"; // Default to 5:00 PM
        const startDateTime = moment(`${occ.date.split("T")[0]}T${startTime}`).toDate();
        const endDateTime = moment(`${occ.date.split("T")[0]}T${endTime}`).toDate();

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
            dayOfWeek, // Include recalculated dayOfWeek
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

  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const formatTime = (date: Date) => moment(date).format("h:mm A");
    const isTimeAvailable = event.start && event.end && !moment(event.start).isSame(moment(event.end), "day");

    return (
      <div style={{ padding: "2px", overflow: "hidden" }}>
        <div style={{ fontSize: "10px", fontWeight: "bold" }}>
          {isTimeAvailable ? `${formatTime(event.start)} - ${formatTime(event.end)}` : "No time specified"}
        </div>
        <div style={{ fontSize: "12px" }}>{event.title}</div>
        <div style={{ fontSize: "10px", color: "gray" }}>{event.extendedProps.dayOfWeek}</div>
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
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr", // stack vertically on mobile
                    md: "1fr 1fr 1fr", // 3 columns from md up
                  },
                  justifyItems: {
                    xs: "center", // center content horizontally on mobile
                    md: "stretch", // normal alignment on desktop
                  },
                  alignItems: "center", // vertical centering
                  mb: 2,
                  gap: 2,
                  backgroundColor: "transparent",
                  color: "#f6f4fe",
                  textAlign: { xs: "center", md: "left" }, // center text on mobile
                }}
              >
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

                {(authData?.isHeadQuarter && authData?.isSuperAdmin) && <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                </Box>}

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
                        p: 2,
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
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{
                    height: "calc(100vh - 180px)",
                    minHeight: "600px",
                  }}
                  eventPropGetter={(event) => ({
                    style: {
                      color: "#000",
                      backgroundColor: getEventColor(event as CalendarEvent),
                      borderRadius: "3px",
                      border: "none",
                    },
                  })}
                  components={{ event: EventComponent }}
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
                  min={new Date(2025, 0, 1, 6, 0)} // Start at 6 AM
                  max={new Date(2025, 0, 1, 22, 0)} // End at 10 PM
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
        />

        <CreateProgramModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            fetchEvents(view, currentDate);
          }}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewServices;