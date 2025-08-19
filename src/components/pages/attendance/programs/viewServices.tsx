import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import CreateProgramModal from "./services";
import { Box, Button, IconButton, List, ListItem } from "@mui/material";
import { Check } from "@mui/icons-material";

const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  recurrenceType: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    description: string;
    recurrenceType: string;
  };
  rrule?: {
    freq: string;
    dtstart: string;
  };
}

interface RootState {
  auth?: {
    authData?: {
      isSuperAdmin?: boolean;
    };
  };
}

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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Event, "id">>({
    title: "",
    description: "",
    date: "",
    recurrenceType: "",
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const colors = ["#FFDAB9", "#98FB98", "#DDA0DD", "#ADD8E6"];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await Api.get("/church/with-events");
      setEvents(response.data.events || []);
    } catch (error) {
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const calendarEvents = events.map((e, i) => {
    const startDate = new Date(e.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    return {
      id: e.id,
      title: e.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      color: colors[i % colors.length],
      extendedProps: {
        description: e.description,
        recurrenceType: e.recurrenceType,
      },
      rrule: e.recurrenceType && e.recurrenceType !== "none" ? {
        freq: e.recurrenceType.toUpperCase(),
        dtstart: startDate.toISOString(),
      } : undefined,
    };
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventItem: Event) => {
    setAnchorEl(event.currentTarget);
    setCurrentEvent(eventItem);
  };

  const handleEditOpen = () => {
    if (currentEvent) {
      setEditFormData({
        title: currentEvent.title,
        description: currentEvent.description,
        date: currentEvent.date,
        recurrenceType: currentEvent.recurrenceType,
      });
      setEditModalOpen(true);
    }
    setAnchorEl(null);
  };

  const handleEditSubmit = async () => {
    if (!currentEvent?.id) {
      toast.error("Invalid program data");
      return;
    }
    try {
      setLoading(true);
      await Api.patch(`/church/edit-event/${currentEvent.id}`, editFormData);
      setEvents(events.map(event =>
        event.id === currentEvent.id ? { ...event, ...editFormData } : event
      ));
      toast.success("Program updated successfully!");
      setEditModalOpen(false);
      setCurrentEvent(null);
    } catch (error) {
      toast.error("Failed to update program");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentEvent) return;
    try {
      setLoading(true);
      await Api.delete(`/church/delete-event/${currentEvent.id}`);
      setEvents(events.filter(event => event.id !== currentEvent.id));
      toast.success("Program deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete program");
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setCurrentEvent(null);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const eventData: Event = {
      id: event.id,
      title: event.title,
      description: event.extendedProps.description,
      date: event.start,
      recurrenceType: event.extendedProps.recurrenceType,
    };
    handleMenuOpen({ currentTarget: document.body } as React.MouseEvent<HTMLElement>, eventData);
  };

  const handleSelectSlot = (_slotInfo: any) => {
    setIsOpen(true);
  };

  return (
    <DashboardManager>
      <div className="p-4 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 rounded-lg shadow">
            <Box>
              <Button
                variant="contained"
                onClick={() => setIsOpen(true)}
                sx={{ 
                  mb: 2,
                  backgroundColor: '#F6F4FE', 
                  color: 'gray', 
                  border: '1px solid white',
                  width: { xs: '100%', md: 'auto' }
                }}
              >
                + Create
              </Button>
              <List 
                sx={{
                  display: { xs: 'grid', md: 'block' },
                  gridTemplateColumns: { xs: '1fr 1fr' },
                  gap: 1,
                  padding: 0,
                }}
              >
                {[
                  { label: 'Ongoing', color: 'green' },
                  { label: 'Pending', color: 'orange' },
                  { label: 'Upcoming', color: 'purple' },
                  { label: 'Past', color: 'gray' }
                ].map((item) => (
                  <ListItem key={item.label} sx={{ color: 'white' }}>
                    <IconButton
                      size="small"
                      sx={{                       
                        borderRadius: '50%', 
                        bgcolor: item.color, 
                        mr: 1,
                        width: 25, 
                        height: 25,
                      }} 
                    >
                      <Check sx={{fontSize:"20"}}/>
                    </IconButton>
                    <span className="text-sm">{item.label}</span>                    
                  </ListItem>
                ))}
              </List>
            </Box>
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-7 bg-[#F6F4FE] rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentDate(moment(currentDate).subtract(1, view).toDate());
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setCurrentDate(moment(currentDate).add(1, view).toDate());
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Today
                </button>
                <span className="text-lg font-medium">
                  {moment(currentDate).format("MMMM YYYY")}
                </span>
              </div>
            </div>
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
              timeslots={window.innerWidth < 640 ? 2 : 4}
              views={['month', 'week', 'day']} // This line removes the Agenda view
            />
          </div>
        </div>

        {/* Action Menu */}
        <div
          className={`fixed z-10 bg-white shadow-lg rounded-lg ${anchorEl ? "block" : "hidden"}`}
          style={{
            top: (anchorEl?.getBoundingClientRect().top ?? 0) + window.scrollY,
            left: (anchorEl?.getBoundingClientRect().left ?? 0) + window.scrollX,
          }}
        >
          <ul className="py-2">
            <li
              onClick={handleEditOpen}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </li>
            <li
              onClick={() => navigate(`/attendance/record?eventId=${currentEvent?.id}`)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Record Attendance
            </li>
            <li
              onClick={() => navigate(`/attendance/records/${currentEvent?.id}`)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Attendance
            </li>
            <li
              onClick={() => {
                setConfirmModalOpen(true);
                setAnchorEl(null);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a2 2 0 00-2 2v1h8V5a2 2 0 00-2-2zm-1 6v10m4-10v10" />
              </svg>
              Delete
            </li>
          </ul>
        </div>

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Program</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Program Title"
                  className="w-full border rounded px-3 py-2"
                />
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Description"
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                />
                <input
                  type="datetime-local"
                  name="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="recurrenceType"
                  value={editFormData.recurrenceType}
                  onChange={(e) => setEditFormData({ ...editFormData, recurrenceType: e.target.value })}
                  placeholder="Recurrence Type"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setCurrentEvent(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={loading || !authData?.isSuperAdmin}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h2 className="text-xl font-semibold mb-4">Delete Program</h2>
              <p className="mb-4">Are you sure you want to delete "{currentEvent?.title}"?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || !authData?.isSuperAdmin}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                >
                  {loading ? "Processing..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <CreateProgramModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            fetchEvents();
          }}
        />
      </div>
    </DashboardManager>
  );
};

export default ViewServices;