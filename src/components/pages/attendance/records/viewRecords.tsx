import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
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

interface AttendanceRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  date: string;
  total: number | null;
  male: number | null;
  female: number | null;
  children: number | null;
  adults: number | null; // Added adults field
}

const ViewAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState<Omit<AttendanceRecord, "id" | "eventTitle">>({
    eventId: "",
    date: "",
    total: null,
    male: null,
    female: null,
    children: null,
    adults: null, // Added adults field
  });
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const navigate = useNavigate();
  const { programId } = useParams<{ programId: string }>(); // Extract eventId from URL
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Fetch attendance records for a specific event
  const fetchAttendance = async () => {
    if (!programId) {
      setError("No event ID provided in the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await Api.get(`/church/get-event/${programId}`);
      const eventData = response.data.event;
      const attendanceRecords: AttendanceRecord[] = (eventData.attendances || []).map((attendance: any) => ({
        id: attendance.id,
        eventId: attendance.eventId,
        eventTitle: eventData.title, // Set eventTitle from event.title
        date: attendance.date,
        total: attendance.total,
        male: attendance.male,
        female: attendance.female,
        children: attendance.children,
        adults: attendance.adults, // Include adults field
      }));
      setRecords(attendanceRecords);
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      setError("Failed to load attendance records for this event. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [programId]); // Re-fetch if eventId changes

  // Calculate counts
  const totalCount = records.length;
  const totalCategoryCount = records.filter(record => record.total !== null).length;

  // Table column widths
  const columnWidths = {
    date: "18%",
    total: "18%",
    male: "18%",
    female: "18%",
    children: "18%",
    actions: "10%",
  };

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, record: AttendanceRecord) => {
    setAnchorEl(event.currentTarget);
    setCurrentRecord(record);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEditOpen = () => {
    if (currentRecord) {
      setEditFormData({
        eventId: currentRecord.eventId,
        date: currentRecord.date,
        total: currentRecord.total,
        male: currentRecord.male,
        female: currentRecord.female,
        children: currentRecord.children,
        adults: currentRecord.adults, // Include adults field
      });
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentRecord(null);
  };

  const showConfirmation = (action: string) => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === "date" ? value : value === "" ? null : Number(value),
    }));
  };

  const handleEditSubmit = async () => {
    if (!currentRecord?.id) {
      console.error("Attendance record ID is undefined");
      toast.error("Invalid attendance record data");
      return;
    }

    try {
      setLoading(true);
      await Api.patch(`/church/edit-attendance/${currentRecord.id}`, editFormData);
      setRecords(records.map(record =>
        record.id === currentRecord.id ? { ...record, ...editFormData } : record
      ));
      toast.success("Attendance record updated successfully!");
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update attendance record");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!currentRecord || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/church/delete-attendance/${currentRecord.id}`);
        setRecords(records.filter(record => record.id !== currentRecord.id));
        toast.success("Attendance record deleted successfully!");
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error("Failed to delete attendance record");
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentRecord(null);
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
        No attendance records found
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
          {error}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => navigate(`/attendance/record?eventId=${programId}`)}
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
        Record Attendance
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
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.5rem" : undefined,
              }}
            >
              Attendance Records for {records[0]?.eventTitle || "Event"}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
            >
              View and manage attendance records for {authData?.church_name || "your church"}.
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
              onClick={() => navigate(`/attendance/record?eventId=${programId}`)}
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
              Record Attendance
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && records.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
          </Box>
        )}

        {/* Error or Empty State */}
        {(!loading && error && records.length === 0) || (!loading && records.length === 0) ? (
          <EmptyState />
        ) : null}

        {/* Data Table */}
        {records.length > 0 && (
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
              {totalCount} Record{totalCount !== 1 ? "s" : ""} • {totalCategoryCount} with Total
            </Typography>

            <TableContainer sx={{ boxShadow: 2, borderRadius: 1, overflowX: "auto" }}>
              <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
                <TableHead>
                  <TableRow>             
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.date, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Date
                    </TableCell>                    
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.male, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Men
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.female, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Women
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.children, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Children
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.total, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => (
                      <TableRow
                        key={record.id}
                        sx={{
                          borderBottom: "1px solid #e5e7eb",
                          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                        }}
                      >                        
                        <TableCell sx={{ width: columnWidths.date, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {record.date ? new Date(record.date).toLocaleDateString() : "-"}
                        </TableCell>                       
                        <TableCell sx={{ width: columnWidths.male, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {record.male ?? "-"}
                        </TableCell>
                        <TableCell sx={{ width: columnWidths.female, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {record.female ?? "-"}
                        </TableCell>
                        <TableCell sx={{ width: columnWidths.children, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {record.children ?? "-"}
                        </TableCell>
                         <TableCell sx={{ width: columnWidths.total, fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          {record.total ?? "-"}
                        </TableCell>
                        <TableCell sx={{ width: columnWidths.actions, textAlign: "center", fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                          <IconButton
                            aria-label="more"
                            onClick={(e) => handleMenuOpen(e, record)}
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
                count={records.length}
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
          id="attendance-menu"
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
            onClick={() => showConfirmation("delete")}
            disabled={loading || !authData?.isSuperAdmin}
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Attendance Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            Edit Attendance Record
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Program ID"
                name="eventId"
                value={editFormData.eventId}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                disabled
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
                label="Total Attendance"
                name="total"
                type="number"
                value={editFormData.total ?? ""}
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
                label="Men Attendance"
                name="male"
                type="number"
                value={editFormData.male ?? ""}
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
                label="Women Attendance"
                name="female"
                type="number"
                value={editFormData.female ?? ""}
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
                label="Children Attendance"
                name="children"
                type="number"
                value={editFormData.children ?? ""}
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
                label="Adults Attendance"
                name="adults"
                type="number"
                value={editFormData.adults ?? ""}
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
            Delete Attendance Record
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              Are you sure you want to delete the attendance record for "{currentRecord?.eventTitle}"?
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

export default ViewAttendance;