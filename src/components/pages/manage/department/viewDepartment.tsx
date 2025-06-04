
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
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";

interface Department {
  id: string;
  name: string;
  description: string | null;
  type: "Department" | "Outreach";
  isActive: boolean;
  isDeleted?: boolean; // Added isDeleted property
}

const ViewDepartment: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
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

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const response = await Api.get("/church/get-departments");
        setDepartments(response.data.departments || []);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Failed to load departments");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Calculate counts for departments and outreaches
  const departmentCount = departments.filter(dept => dept.type === "Department").length;
  const outreachCount = departments.filter(dept => dept.type === "Outreach").length;

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, department: Department) => {
    setAnchorEl(event.currentTarget);
    setCurrentDepartment(department);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);    
  };

  // Handle edit modal open
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

  // Handle edit modal close
  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentDepartment(null);
  };

  // Handle confirmation modal for suspend or delete
  const showConfirmation = (action: string) => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  // Handle form input changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle type select change
  const handleTypeChange = (e: SelectChangeEvent<"Department" | "Outreach">) => {
    setEditFormData(prev => ({ ...prev, type: e.target.value as "Department" | "Outreach" }));
  };

  // Handle edit action
  const handleEditSubmit = async () => {
    if (!currentDepartment || !currentDepartment.id) {
      console.error("currentDepartment or its ID is undefined");
      return;
    }
  
    try {
      setLoading(true);
      const payload = {
        ...editFormData,
        type: editFormData.type.toLowerCase() as "department" | "outreach",
      };
  
      console.log("Payload:", payload);
  
      const response = await Api.patch(`/church/edit-dept/${currentDepartment.id}`, payload);
      console.log("API Response:", response.data);
  
      setDepartments(departments.map(dept =>
        dept.id === currentDepartment.id ? { ...dept, ...editFormData } : dept
      ));
  
      toast.success("Department updated successfully!");
      handleEditClose();
    } catch (error) {
      console.error("Department update error:", error);
      toast.error("Failed to update department");
    } finally {
      setLoading(false);
    }
  };

  // Handle suspend or delete actions
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
          type: currentDepartment.type.toLowerCase() as "Department" | "Outreach",
          isActive: newStatus,
        });
        setDepartments(departments.map(dept => 
          dept.id === currentDepartment.id ? { ...dept, isActive: newStatus } : dept
        ));
        toast.success(`Department ${newStatus ? "activated" : "suspended"} successfully!`);
      }
    } catch (error) {
      console.error(`${actionType} error:`, error);
      toast.error(`Failed to ${actionType} department`);
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentDepartment(null);
    }
  };

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Truncate description for display
  const truncateDescription = (description: string | null, maxLength: number = 50): string => {
    if (!description) return "-";
    if (description.length <= maxLength) return description;
    return `${description.substring(0, maxLength)}...`;
  };

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, bgcolor: "#f5f5f5", minHeight: "100%" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", lg: "center" },
            mb: { xs: 4, sm: 6 },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: "#1f2937",
                fontSize: { xs: "1.8rem", sm: "2rem" },
              }}
            >
              All Departments
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: "#4b5563",
                fontSize: { xs: "1rem", sm: "1rem" },
              }}
            >
              View and manage all departments and outreaches.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/manage/department")}
            sx={{
              bgcolor: "#1f2937",
              px: { xs: 2, sm: 2 },
              py: 1,
              borderRadius: 1,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: { xs: "1rem", sm: "1rem" },
              "&:hover": {
                bgcolor: "#111827",
              },
            }}
          >
            Create Department
          </Button>
        </Box>

        {loading && departments.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#111827]"></div>
            </div>
          </Box>
        ) : departments.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No departments found
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/manage/department")}
              sx={{ mt: 2 }}
            >
              Create New Department
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ mb: 2, color: "#4b5563", textAlign: "right" }}>
              {departmentCount} Department{departmentCount !== 1 ? "s" : ""}/
              {outreachCount} Outreach{outreachCount !== 1 ? "es" : ""}
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
                    <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((dept) => (
                      <TableRow key={dept.id} sx={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: dept.isDeleted ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}>
                        <TableCell sx={{
                              textDecoration: dept.isDeleted ? 'line-through' : 'none',
                              color: dept.isDeleted ? 'gray' : 'inherit',
                            }}>{dept.name}</TableCell>
                        <TableCell sx={{
                              textDecoration: dept.isDeleted ? 'line-through' : 'none',
                              color: dept.isDeleted ? 'gray' : 'inherit',
                              maxWidth: 300
                            }}>
                          <Tooltip title={dept.description || "-"} arrow>
                            <Typography>{truncateDescription(dept.description)}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{
                              textDecoration: dept.isDeleted ? 'line-through' : 'none',
                              color: dept.isDeleted ? 'gray' : 'inherit',
                            }}>
                          <Typography sx={{ textTransform: "capitalize" }}>
                            {dept.type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="more"
                            aria-controls="department-menu"
                            aria-haspopup="true"
                            onClick={(e) => handleMenuOpen(e, dept)}
                            disabled={loading}
                          >
                            <MoreVertIcon />
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
                  bgcolor: "#f5f5f5",
                  borderTop: "1px solid #e0e0e0",
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
        >
          <MenuItem onClick={handleEditOpen}  disabled={currentDepartment?.isDeleted }>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")} disabled={loading}>
            <BlockIcon sx={{ mr: 1, fontSize: "1rem" }} />
            {currentDepartment?.isActive
              ? loading && actionType === "suspend"
                ? "Suspending..."
                : "Suspend"
              : loading && actionType === "suspend"
              ? "Activating..."
              : "Activate"}
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("delete")} disabled={loading}>
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            {loading && actionType === "delete" ? "Deleting..." : "Delete"}
          </MenuItem>
        </Menu>

        {/* Edit Department Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Department</DialogTitle>
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
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select
                  value={editFormData.type}
                  onChange={handleTypeChange}
                  label="Type"
                >
                  <MenuItem value="Department">Department</MenuItem>
                  <MenuItem value="Outreach">Outreach</MenuItem>
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
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditClose}
              sx={{ border: 1, color: "#111827" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              sx={{
                bgcolor: "#111827",
                "&:hover": { bgcolor: "#0f172a" },
              }}
              variant="contained"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Modal for Suspend/Delete */}
        <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="xs">
          <DialogTitle>
            {actionType === "delete"
              ? "Delete Department"
              : actionType === "suspend"
              ? currentDepartment?.isActive
                ? "Suspend Department"
                : "Activate Department"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {actionType === "delete"
                ? `Are you sure you want to delete the department "${currentDepartment?.name}"? This action cannot be undone.`
                : `Are you sure you want to ${currentDepartment?.isActive ? "suspend" : "activate"} the department "${currentDepartment?.name}"?`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedAction}
              color={actionType === "delete" ? "error" : "primary"}
              variant="contained"
              disabled={loading}              
            >
              {loading && actionType === "delete"
                ? "Deleting..."
                : actionType === "delete"
                ? "Delete"
                : loading && actionType === "suspend"
                ? currentDepartment?.isActive
                  ? "Suspending..."
                  : "Activating..."
                : currentDepartment?.isActive
                ? "Suspend"
                : "Activate"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewDepartment;
