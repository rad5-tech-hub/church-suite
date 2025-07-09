import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Tooltip,
  Menu,
  useTheme,
  useMediaQuery,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { SelectChangeEvent } from "@mui/material";

interface Unit {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDeleted?: boolean;
}

interface Department {
  id: string;
  name: string;
}

const ViewUnit: React.FC = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState<Omit<Unit, "id" | "isActive" | "isDeleted">>({
    name: "",
    description: "",
  });
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await Api.get("/church/get-departments");
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setError("Failed to load departments. Please try again later.");
      toast.error("Failed to load departments");
    }
  };

  // Fetch units for the selected department
  const fetchUnits = async (departmentId: string) => {
    if (!departmentId) {
      setUnits([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get(`/church/a-department/${departmentId}`);
      setUnits(response.data.department.units || []);;
    } catch (error) {
      console.error("Failed to fetch units:", error);
      setError("Failed to load units. Please try again later.");
      toast.error("Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchUnits(selectedDepartmentId);
  }, [selectedDepartmentId]);

  // Table column widths
  const columnWidths = {
    name: "40%",
    description: "45%",
    actions: "15%",
  };

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, unit: Unit) => {
    setAnchorEl(event.currentTarget);
    setCurrentUnit(unit);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEditOpen = () => {
    if (currentUnit) {
      setEditFormData({
        name: currentUnit.name,
        description: currentUnit.description || "",
      });
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentUnit(null);
  };

  const showConfirmation = (action: string) => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (e: SelectChangeEvent<string>) => {
    setSelectedDepartmentId(e.target.value);
    setPage(0); // Reset pagination when department changes
  };

  const handleEditSubmit = async () => {
    if (!currentUnit?.id) {
      console.error("Unit ID is undefined");
      toast.error("Invalid unit data");
      return;
    }

    try {
      setLoading(true);
      await Api.patch(`/church/edit-unit/${currentUnit.id}`, editFormData);

      setUnits(
        units.map((unit) =>
          unit.id === currentUnit.id ? { ...unit, ...editFormData } : unit
        )
      );

      toast.success("Unit updated successfully!");
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update unit");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!currentUnit || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/church/delete-unit/${currentUnit.id}`);
        setUnits(units.filter((unit) => unit.id !== currentUnit.id));
        toast.success("Unit deleted successfully!");
      } else if (actionType === "suspend") {
        const newStatus = !currentUnit.isActive;
        await Api.patch(`/church/suspend-unit/${currentUnit.id}`, {
          isActive: newStatus,
        });
        setUnits(
          units.map((unit) =>
            unit.id === currentUnit.id ? { ...unit, isActive: newStatus } : unit
          )
        );
        toast.success(`Unit ${newStatus ? "activated" : "suspended"} successfully!`);
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${actionType} unit`);
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentUnit(null);
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper functions
  const truncateDescription = (description: string | null, maxLength = 50) => {
    if (!description) return "-";
    return description.length <= maxLength
      ? description
      : `${description.substring(0, maxLength)}...`;
  };

  // Empty state component
  const EmptyState = () => (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EmptyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
      <Typography
        variant="h6"
        color="textSecondary"
        gutterBottom
        sx={{
          fontSize: isLargeScreen ? "1.25rem" : undefined,
        }}
      >
        {selectedDepartmentId
          ? "No units found for this department"
          : "Please select a department to view units"}
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => navigate("/manage/unit")}
        sx={{
          backgroundColor: "var(--color-primary)",
          px: { xs: 2, sm: 2 },
          color: "var(--color-text-on-primary)",
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          "&:hover": {
            backgroundColor: "var(--color-primary)",
            opacity: 0.9,
          },
        }}
      >
        Create New Unit
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
              All Units
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              View and manage all units for the selected department.
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
              onClick={() => navigate("/manage/unit")}
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
              Create Unit
            </Button>
          </Grid>
        </Grid>

        {/* Department Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth variant="outlined" disabled={loading}>
            <InputLabel id="department-label" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              Select Department
            </InputLabel>
            <Select
              labelId="department-label"
              id="departmentId"
              value={selectedDepartmentId}
              onChange={handleDepartmentChange}
              label="Select Department"
              sx={{
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                {!departments.length ? <em>Loading...</em> : <em>Select a department</em>}
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem
                  key={dept.id}
                  value={dept.id}
                  sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
                >
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Loading State */}
        {loading && selectedDepartmentId && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "var(--color-primary)" }} />
          </Box>
        )}

        {/* Error or Empty State */}
        {(!loading && (error || units.length === 0 || !selectedDepartmentId)) && <EmptyState />}

        {/* Data Table */}
        {units.length > 0 && (
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
              {units.length} Unit{units.length !== 1 ? "s" : ""}
            </Typography>

            <TableContainer
              sx={{
                boxShadow: 2,
                borderRadius: 1,
                overflowX: "auto",
              }}
            >
              <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.name,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.description,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Description
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.actions,
                        textAlign: "center",
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {units
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((unit) => (
                      <TableRow
                        key={unit.id}
                        sx={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: unit.isDeleted ? "rgba(0, 0, 0, 0.04)" : "inherit",
                          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                        }}
                      >
                        <TableCell
                          sx={{
                            textDecoration: unit.isDeleted ? "line-through" : "none",
                            color: unit.isDeleted ? "gray" : "inherit",
                            width: columnWidths.name,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                          }}
                        >
                          {unit.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            textDecoration: unit.isDeleted ? "line-through" : "none",
                            color: unit.isDeleted ? "gray" : "inherit",
                            width: columnWidths.description,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                          }}
                        >
                          <Tooltip title={unit.description || "-"} arrow>
                            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                              {truncateDescription(unit.description)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.actions,
                            textAlign: "center",
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                          }}
                        >
                          <IconButton
                            aria-label="more"
                            onClick={(e) => handleMenuOpen(e, unit)}
                            disabled={loading}
                            size="small"
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
                count={units.length}
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
          id="unit-menu"
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
          <MenuItem onClick={handleEditOpen} disabled={currentUnit?.isDeleted}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")} disabled={loading}>
            {!currentUnit?.isDeleted ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: "1rem" }} />
                {loading && actionType === "suspend" ? "Suspending..." : "Suspend"}
              </>
            ) : (
              <>
                <MdRefresh style={{ marginRight: 8, fontSize: "1rem" }} />
                {loading && actionType === "suspend" ? "Activating..." : "Activate"}
              </>
            )}
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("delete")} disabled={loading}>
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Unit Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            Edit Unit
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Unit Name"
                name="name"
                value={editFormData.name}
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
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditClose}
              sx={{
                border: 1,
                color: "var(--color-primary)",
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
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
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Modal */}
        <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="xs">
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {actionType === "delete"
              ? "Delete Unit"
              : actionType === "suspend"
              ? currentUnit?.isActive
                ? "Suspend Unit"
                : "Activate Unit"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {actionType === "delete"
                ? `Are you sure you want to delete "${currentUnit?.name}"?`
                : `Are you sure you want to ${currentUnit?.isActive ? "suspend" : "activate"} "${currentUnit?.name}"?`}
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
              color={actionType === "delete" ? "error" : "primary"}
              variant="contained"
              disabled={loading}
            >
              {loading ? "Processing..." : actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewUnit;