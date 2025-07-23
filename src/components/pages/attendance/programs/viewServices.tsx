import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TablePagination,
  Tooltip,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  SentimentVeryDissatisfied as EmptyIcon,
} from "@mui/icons-material";
import { MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  recurrenceType: string;
}

const ViewServices: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState<Omit<Event, "id">>({
    title: "",
    description: "",
    date: "",
    recurrenceType: "",
  });
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get("/church/get-events");
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setError("Failed to load Program. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Calculate counts
  const totalCount = events.length;
  const recurringCount = events.filter(event => event.recurrenceType && event.recurrenceType !== "none").length;

  // Table column widths
  const columnWidths = {
    title: "20%",
    description: "30%",
    date: "20%",
    recurrenceType: "20%",
    actions: "10%",
  };

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventItem: Event) => {
    setAnchorEl(event.currentTarget);
    setCurrentEvent(eventItem);
  };

  const handleMenuClose = () => setAnchorEl(null);

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
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentEvent(null);
  };

  const showConfirmation = (action: string) => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    if (!currentEvent?.id) {
      console.error("Program ID is undefined");
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
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update Program");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!currentEvent || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/church/delete-event/${currentEvent.id}`);
        setEvents(events.filter(event => event.id !== currentEvent.id));
        toast.success("Program deleted successfully!");
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error("Failed to delete program");
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentEvent(null);
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper functions
  const truncateText = (text: string | null, maxLength = 30) => {
    if (!text) return "-";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

  // Empty state component
  const EmptyState = () => (
    <Box sx={{
      textAlign: "center",
      py: 8,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <EmptyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
      <Typography
        variant="h6"
        color="textSecondary"
        gutterBottom
        sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}
      >
        No programs found
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
          {error}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => navigate("/attendance/service")}
        sx={{
          backgroundColor: "var(--color-primary)",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": {
            backgroundColor: "var(--color-primary)",
            opacity: 0.9,
          },
        }}
      >
        Create New Program
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
              component="h1"
              fontWeight={600}
              gutterBottom
              sx={{ color: theme.palette.text.primary, fontSize: isLargeScreen ? "1.5rem" : undefined }}
            >
              All Programs
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
            >
              View and manage all church programs for {authData?.church_name || "your church"}.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/attendance/service")}
              size="medium"
              sx={{
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
              }}
            >
              Create Program
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && events.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
          </Box>
        )}

        {/* Error or Empty State */}
        {(!loading && error && events.length === 0) || (!loading && events.length === 0) ? (
          <EmptyState />
        ) : null}

        {/* Data Table */}
        {events.length > 0 && (
          <>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                color: "#4b5563",
                textAlign: "right",
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              {totalCount} Program{totalCount !== 1 ? "s" : ""} • {recurringCount} Recurring
            </Typography>

            <TableContainer sx={{ boxShadow: 2, borderRadius: 1, overflowX: "auto" }}>
              <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.title, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Title
                    </TableCell>
                     <TableCell sx={{ fontWeight: 600, width: columnWidths.date, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.description, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Description
                    </TableCell>                   
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.recurrenceType, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Recurrence
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((event) => (
                      <TableRow
                        key={event.id}
                        sx={{
                          borderBottom: "1px solid #e5e7eb",
                          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                        }}
                      >
                        <TableCell sx={{ width: columnWidths.title, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {event.title}
                        </TableCell>
                        <TableCell sx={{ width: columnWidths.date, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {new Date(event.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ width: columnWidths.description, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          <Tooltip title={event.description || "-"} arrow>
                            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                              {truncateText(event.description)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ width: columnWidths.recurrenceType, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {event.recurrenceType || "-"}
                        </TableCell>
                        <TableCell sx={{ width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          <IconButton
                            aria-label="more"
                            onClick={(e) => handleMenuOpen(e, event)}
                            disabled={loading}
                            size="small"
                            sx={{
                              borderRadius: 1,
                              backgroundColor: "#E1E1E1",
                              "&:hover": {
                                backgroundColor: "var(--color-primary)",
                                opacity: 0.9,
                                color: "#E1E1E1",
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={events.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: "1px solid #e0e0e0",
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: isLargeScreen ? "0.75rem" : undefined,
                  },
                }}
              />
            </TableContainer>
          </>
        )}

        {/* Action Menu */}
        <Menu
          id="event-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              "& .MuiMenuItem-root": {
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              },
            },
          }}
        >
          <MenuItem
            onClick={handleEditOpen}
            disabled={loading || !authData?.isSuperAdmin}
          >
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => navigate(`/attendance/record?eventId=${currentEvent?.id}`)}
            disabled={loading}
          >
            <Typography sx={{ mr: 1, fontSize: "1rem" }}>📝</Typography>
            Record Attendance
          </MenuItem>
          <MenuItem
            onClick={() => navigate(`/attendance/records/${currentEvent?.id}`)}
            disabled={loading}
          >
            <Typography sx={{ mr: 1, fontSize: "1rem" }}>📋</Typography>
            View Attendance
          </MenuItem>
          <MenuItem
            onClick={() => showConfirmation("delete")}
            disabled={loading || !authData?.isSuperAdmin}
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Event Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            Edit Program
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Program Title"
                name="title"
                value={editFormData.title}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={4}
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
              />
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="datetime-local"
                value={editFormData.date}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
              />
              <TextField
                fullWidth
                label="Recurrence Type"
                name="recurrenceType"
                value={editFormData.recurrenceType}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? "0.875rem" : undefined },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditClose}
              sx={{ border: 1, color: "var(--color-primary)", fontSize: isLargeScreen ? "0.875rem" : undefined }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              sx={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
              variant="contained"
              disabled={loading || !authData?.isSuperAdmin}
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
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            Delete Program
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              Are you sure you want to delete "{currentEvent?.title}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConfirmModalOpen(false)}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedAction}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
              color="error"
              variant="contained"
              disabled={loading || !authData?.isSuperAdmin}
            >
              {loading ? "Processing..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewServices;