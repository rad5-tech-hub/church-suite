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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Tooltip,
  SelectChangeEvent,
  Menu,
  useTheme,
  useMediaQuery,
  Grid
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

interface Department {
  id: string;
  name: string;
  description: string | null;
  type: "Department" | "Outreach";
  isActive: boolean;
  isDeleted?: boolean;
}

const ViewDepartment: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState<Omit<Department, "id">>({
    name: "",
    description: "",
    type: "Department",
    isActive: true,
  });
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  // Fetch departments with error handling
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get("/church/get-departments");
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setError("Failed to load departments. Please try again later.");
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Calculate counts
  const departmentCount = departments.filter(dept => dept.type === "Department").length;
  const outreachCount = departments.filter(dept => dept.type === "Outreach").length;

  // Table column widths
  const columnWidths = {
    name: "30%",
    description: "40%",
    type: "15%",
    actions: "15%"
  };

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, department: Department) => {
    setAnchorEl(event.currentTarget);
    setCurrentDepartment(department);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEditOpen = () => {
    if (currentDepartment) {
      setEditFormData({
        name: currentDepartment.name,
        description: currentDepartment.description || "",
        type: currentDepartment.type,
        isActive: currentDepartment.isActive,
      });
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentDepartment(null);
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

  const handleTypeChange = (e: SelectChangeEvent<"Department" | "Outreach">) => {
    setEditFormData(prev => ({ ...prev, type: e.target.value as "Department" | "Outreach" }));
  };

  const handleEditSubmit = async () => {
    if (!currentDepartment?.id) {
      console.error("Department ID is undefined");
      toast.error("Invalid department data");
      return;
    }
  
    try {
      setLoading(true);
        await Api.patch(
        `/church/edit-dept/${currentDepartment.id}`,
        editFormData
      );
      
      setDepartments(departments.map(dept =>
        dept.id === currentDepartment.id ? { ...dept, ...editFormData } : dept
      ));
      
      toast.success("Department updated successfully!");
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update department");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!currentDepartment || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/church/delete-dept/${currentDepartment.id}`);
        setDepartments(departments.filter(dept => dept.id !== currentDepartment.id));
        toast.success("Department deleted successfully!");
      } else if (actionType === "suspend") {
        const newStatus = !currentDepartment.isActive;
        await Api.patch(`/church/suspend-dept/${currentDepartment.id}`, {
          ...currentDepartment,
          type: currentDepartment.type,
          isActive: newStatus,
        });
        setDepartments(departments.map(dept => 
          dept.id === currentDepartment.id ? { ...dept, isActive: newStatus } : dept
        ));
        toast.success(`Department ${newStatus ? "activated" : "suspended"} successfully!`);
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${actionType} department`);
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentDepartment(null);
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
    <Box sx={{ 
      textAlign: "center", 
      py: 8,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <EmptyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
      <Typography 
        variant="h6" 
        color="textSecondary" 
        gutterBottom
        sx={{
          fontSize: isLargeScreen ? '1.25rem' : undefined
        }}
      >
        No departments found
      </Typography>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      ) : null}
      <Button
        variant="contained"
        onClick={() => navigate("/manage/department")}       
        sx={{
          bgcolor: "#1f2937",
          px: { xs: 2, sm: 2 }, 
          mt: 2,
          fontSize: isLargeScreen ? '0.875rem' : undefined,
          "&:hover": { bgcolor: "#111827" },
        }}
      >
        Create New Department
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{xs:12, md:8}}>
            <Typography 
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
              component="h1" 
              fontWeight={600}
              gutterBottom
              sx={{ 
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? '1.5rem' : undefined
              }}
            >
              All Departments
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }}
            >
              View and manage all departments and outreaches.
            </Typography>
          </Grid>
          <Grid size={{xs:12, md:4}} sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            alignItems: 'center'
          }}>
            <Button
              variant="contained"
              onClick={() => navigate("/manage/department")}
              size="medium"
              sx={{
                bgcolor: "#1f2937",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: isLargeScreen ? '1rem' : undefined,
                "&:hover": { bgcolor: "#111827" },
              }}
            >
              Create Department
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && departments.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#111827]"></div>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && departments.length === 0 && <EmptyState />}

        {/* Empty State */}
        {!loading && !error && departments.length === 0 && <EmptyState />}

        {/* Data Table */}
        {departments.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ 
              mb: 2, 
              color: "#4b5563", 
              textAlign: "right",
              fontSize: isLargeScreen ? '0.875rem' : undefined
            }}>
              {departmentCount} Department{departmentCount !== 1 ? "s" : ""} / 
              {outreachCount} Outreach{outreachCount !== 1 ? "es" : ""}
            </Typography>
            
            <TableContainer sx={{
              boxShadow: 2,
              borderRadius: 1,
              overflowX: "auto",
            }}>
              <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      width: columnWidths.name,
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Name</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      width: columnWidths.description,
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Description</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      width: columnWidths.type,
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Type</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      width: columnWidths.actions,
                      textAlign: "center",
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((dept) => (
                      <TableRow key={dept.id} sx={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: dept.isDeleted ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      }}>
                        <TableCell sx={{
                          textDecoration: dept.isDeleted ? 'line-through' : 'none',
                          color: dept.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.name,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          {dept.name}
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: dept.isDeleted ? 'line-through' : 'none',
                          color: dept.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.description,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          <Tooltip title={dept.description || "-"} arrow>
                            <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                              {truncateDescription(dept.description)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: dept.isDeleted ? 'line-through' : 'none',
                          color: dept.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.type,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          <Typography sx={{ 
                            textTransform: "capitalize",
                            fontSize: isLargeScreen ? '0.875rem' : undefined
                          }}>
                            {dept.type}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{
                          width: columnWidths.actions,
                          textAlign: "center",
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          <IconButton
                            aria-label="more"
                            onClick={(e) => handleMenuOpen(e, dept)}
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
                count={departments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: "1px solid #e0e0e0",
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: isLargeScreen ? '0.75rem' : undefined
                  }
                }}
              />
            </TableContainer>
          </>
        )}

        {/* Action Menu */}
        <Menu
          id="department-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              '& .MuiMenuItem-root': {
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }
            }
          }}
        >
          <MenuItem onClick={handleEditOpen} disabled={currentDepartment?.isDeleted}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem 
            onClick={() => showConfirmation("suspend")} 
            disabled={loading}
          >
             {!currentDepartment?.isDeleted ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: '1rem' }} />
                {loading && actionType === 'suspend' ? 'Suspending...' : 'Suspend'}
              </>
            ) : (
              <>
                <MdRefresh style={{ marginRight: 8, fontSize: '1rem' }} />              
                {loading && actionType === 'suspend' ? 'Activating...' : 'Activate'}
              </>
            )}
          </MenuItem>
          <MenuItem 
            onClick={() => showConfirmation("delete")} 
            disabled={loading}
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Department Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: isLargeScreen ? '1.25rem' : undefined }}>
            Edit Department
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Department Name"
                name="name"
                value={editFormData.name}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{
                  sx: { fontSize: isLargeScreen ? '0.875rem' : undefined }
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? '0.875rem' : undefined }
                }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                  Type
                </InputLabel>
                <Select
                  value={editFormData.type}
                  onChange={handleTypeChange}
                  label="Type"
                  sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}
                >
                  <MenuItem value="Department" sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                    Department
                  </MenuItem>
                  <MenuItem value="Outreach" sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                    Outreach
                  </MenuItem>
                </Select>
              </FormControl>
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
                  sx: { fontSize: isLargeScreen ? '0.875rem' : undefined }
                }}
                InputProps={{
                  sx: { fontSize: isLargeScreen ? '0.875rem' : undefined }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleEditClose} 
              sx={{ 
                border: 1, 
                color: "#111827",
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              sx={{ 
                bgcolor: "#111827", 
                "&:hover": { bgcolor: "#0f172a" },
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }}
              variant="contained"
              disabled={loading}
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
          <DialogTitle sx={{ fontSize: isLargeScreen ? '1.25rem' : undefined }}>
            {actionType === "delete"
              ? "Delete Department"
              : actionType === "suspend"
              ? currentDepartment?.isActive
                ? "Suspend Department"
                : "Activate Department"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
              {actionType === "delete"
                ? `Are you sure you want to delete "${currentDepartment?.name}"?`
                : `Are you sure you want to ${currentDepartment?.isActive ? "suspend" : "activate"} "${currentDepartment?.name}"?`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setConfirmModalOpen(false)} 
              sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedAction}
              sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}
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

export default ViewDepartment;