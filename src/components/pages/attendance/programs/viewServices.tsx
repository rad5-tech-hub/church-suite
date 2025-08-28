import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast,ToastContainer } from "react-toastify";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Check, Close } from "@mui/icons-material";
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
  };
  rrule?: {
    freq: number;
    dtstart: Date;
  };
}

interface RootState {
  auth?: {
    authData?: {
      isSuperAdmin?: boolean;
    };
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

const EventComponent: React.FC<{ event: CalendarEvent }> = ({ event }) => (
  <div className="p-1 rounded text-sm h-full overflow-hidden">
    <strong>{event.title}</strong>
    <div className="text-xs">
      {moment(event.start).format("h:mm A")}
      {event.end && ` - ${moment(event.end).format("h:mm A")}`}
    </div>
  </div>
);

const ViewServices: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentOccurrence, setCurrentOccurrence] = useState<Occurrence | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    recurrenceType: string;
  }>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    recurrenceType: "",
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [isOpen, setIsOpen] = useState(false);
  const colors = ["#FFDAB9", "#98FB98", "#DDA0DD", "#ADD8E6"];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Api.get<FetchEventsResponse>("/church/get-events");
      const data = response.data;
      if (!isFetchEventsResponse(data)) {
        throw new Error("Invalid response structure");
      }
      setEvents(data.events || []);
      toast.success("Events loaded successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error) {
      toast.error("Failed to load events", {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const calendarEvents: CalendarEvent[] = events.flatMap((e, i) =>
    e.occurrences.map((occ) => {
      const startDateTime = moment(`${occ.date.split("T")[0]}T${occ.startTime}`).toDate();
      const endDateTime = moment(`${occ.date.split("T")[0]}T${occ.endTime}`).toDate();
      return {
        id: `${e.id}-${occ.id}`,
        title: e.title,
        start: startDateTime,
        end: endDateTime,
        color: colors[i % colors.length],
        extendedProps: {
          description: e.description,
          recurrenceType: e.recurrenceType,
          eventId: e.id,
          occurrenceId: occ.id,
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
        setEditFormData({
          title: eventData.title,
          description: eventData.description,
          date: moment(occurrenceData.date).format("YYYY-MM-DD"),
          startTime: occurrenceData.startTime,
          endTime: occurrenceData.endTime,
          recurrenceType: eventData.recurrenceType,
        });
        setAnchorEl(document.body);
      }
    },
    [events]
  );

  const handleEditOpen = useCallback(() => {
    setEditModalOpen(true);
    setAnchorEl(null);
  }, []);

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleEditSubmit = useCallback(async () => {
    if (!currentEvent?.id || !currentOccurrence?.id || !editFormData.title.trim()) {
      toast.error("Program title is required", {
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }
    try {
      setLoading(true);
      await Api.patch(`/church/edit-event/${currentEvent.id}`, {
        title: editFormData.title,
        description: editFormData.description,
        date: editFormData.date,
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        recurrenceType: editFormData.recurrenceType,
        occurrenceId: currentOccurrence.id,
      });
      await fetchEvents();
      toast.success("Program updated successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
      setEditModalOpen(false);
      setCurrentEvent(null);
      setCurrentOccurrence(null);
    } catch (error) {
      toast.error("Failed to update program", {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [currentEvent, currentOccurrence, editFormData, fetchEvents, isMobile]);

  const handleDelete = useCallback(async () => {
    if (!currentEvent) return;
    try {
      setLoading(true);
      await Api.delete(`/church/delete-event/${currentEvent.id}`);
      await fetchEvents();
      toast.success("Program deleted successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error) {
      toast.error("Failed to delete program", {
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setCurrentEvent(null);
      setCurrentOccurrence(null);
    }
  }, [currentEvent, fetchEvents, isMobile]);

  const handleSelectSlot = useCallback((_slotInfo: any) => {
    setIsOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setCurrentEvent(null);
    setCurrentOccurrence(null);
  }, []);

  return (
    <DashboardManager>
      <ToastContainer/>
      <Box sx={{ p: 4, minHeight: "100vh" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 7fr" }, gap: 4 }}>
          {/* Sidebar */}
          <Box sx={{ borderRadius: 2, boxShadow: 1 }}>
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
              {[
                { label: "Ongoing", color: "green" },
                { label: "Pending", color: "orange" },
                { label: "Upcoming", color: "purple" },
                { label: "Past", color: "gray" },
              ].map((item) => (
                <ListItem key={item.label} sx={{ color: "white" }}>
                  <IconButton
                    size="small"
                    sx={{
                      borderRadius: "50%",
                      bgcolor: item.color,
                      mr: 1,
                      width: 25,
                      height: 25,
                    }}
                  >
                    <Check sx={{ fontSize: "20px" }} />
                  </IconButton>
                  <span className="text-sm">{item.label}</span>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Main Calendar */}
          <Box sx={{ bgcolor: "#F6F4FE", borderRadius: 2, boxShadow: 1, p: 4 }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center", mb: 4, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  onClick={() => setCurrentDate(moment(currentDate).subtract(1, view).toDate())}
                  sx={{ p: 2, "&:hover": { bgcolor: "grey.100" }, borderRadius: 1 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button
                  onClick={() => setCurrentDate(moment(currentDate).add(1, view).toDate())}
                  sx={{ p: 2, "&:hover": { bgcolor: "grey.100" }, borderRadius: 1 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
                <Button
                  onClick={() => setCurrentDate(new Date())}
                  sx={{ px: 4, py: 2, bgcolor: "grey.100", borderRadius: 1, "&:hover": { bgcolor: "grey.200" } }}
                >
                  Today
                </Button>
                <Box component="span" sx={{ fontSize: "1.125rem", fontWeight: "medium" }}>
                  {moment(currentDate).format("MMMM YYYY")}
                </Box>
              </Box>
            </Box>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "calc(100vh - 100px)" }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.color,
                  color: "#fff",
                },
              })}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              popup
              view={view}
              onView={(newView) => {
                if (["month", "week", "day"].includes(newView)) {
                  setView(newView as "month" | "week" | "day");
                }
              }}
              date={currentDate}
              onNavigate={setCurrentDate}
              components={{ event: EventComponent }}
              dayLayoutAlgorithm="no-overlap"
              showMultiDayTimes
              step={15}
              timeslots={isMobile ? 2 : 4}
              views={["month", "week", "day"]}
            />
          </Box>
        </Box>

        {/* Action Menu */}
        <Menu
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleEditOpen}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </MenuItem>
          <MenuItem onClick={() => navigate(`/attendance/record?eventId=${currentEvent?.id}`)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Record Attendance
          </MenuItem>
          <MenuItem onClick={() => navigate(`/attendance/records/${currentEvent?.id}`)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Attendance
          </MenuItem>
          <MenuItem
            onClick={() => {
              setConfirmModalOpen(true);
              setAnchorEl(null);
            }}
            sx={{ color: "red" }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a2 2 0 00-2 2v1h8V5a2 2 0 00-2-2zm-1 6v10m4-10v10" />
            </svg>
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Modal */}
        <Dialog
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setCurrentEvent(null);
            setCurrentOccurrence(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>Edit Program</Box>
              <IconButton
                onClick={() => {
                  setEditModalOpen(false);
                  setCurrentEvent(null);
                  setCurrentOccurrence(null);
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              <TextField
                label="Program Title"
                name="title"
                value={editFormData.title}
                onChange={handleEditChange}
                fullWidth
                required
              />
              <TextField
                label="Description"
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                fullWidth
                multiline
                rows={4}
              />
              <TextField
                label="Date"
                name="date"
                type="date"
                value={editFormData.date}
                onChange={handleEditChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Start Time"
                name="startTime"
                type="time"
                value={editFormData.startTime}
                onChange={handleEditChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                name="endTime"
                type="time"
                value={editFormData.endTime}
                onChange={handleEditChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Recurrence Type"
                name="recurrenceType"
                value={editFormData.recurrenceType}
                onChange={handleEditChange}
                fullWidth
                select
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditModalOpen(false);
                setCurrentEvent(null);
                setCurrentOccurrence(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={loading || !authData?.isSuperAdmin}
              variant="contained"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Modal */}
        <Dialog
          open={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Program</DialogTitle>
          <DialogContent>
            <Box>Are you sure you want to delete "{currentEvent?.title}"?</Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              disabled={loading || !authData?.isSuperAdmin}
              color="error"
              variant="contained"
            >
              {loading ? "Processing..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        <CreateProgramModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            fetchEvents();
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