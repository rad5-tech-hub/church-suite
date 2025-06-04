import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BlockIcon from "@mui/icons-material/Block";
import { AiOutlineDelete } from "react-icons/ai";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { RootState } from "../../../reduxstore/redux";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";

interface Branch {
  id: number | string;
  name: string;
  address: string;
}

interface Admin {
  [x: string]: any;
  id: number | string;
  name: string;
  email: string;
  phone: string;
  isSuperAdmin: boolean;
  isSuspended?: boolean;
  branchId?: number | string;
  isDeleted?: boolean; // Added property
}

const ViewAdmins: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | string>("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; message: string } | null>(null);

  // Fetch admins and branches from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminsRes, branchesRes] = await Promise.all([
          Api.get("/church/view-admins"),
          Api.get("/church/get-branches"),
        ]);
        setAdmins(adminsRes.data.admins);
        setBranches(branchesRes.data.branches || []);       
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load admins");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, admin: Admin) => {
    setAnchorEl(event.currentTarget);
    setSelectedAdmin(admin);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle edit modal open
  const handleEditModalOpen = () => {
    if (selectedAdmin) {
      setIsSuperAdmin(selectedAdmin.isSuperAdmin);
      setSelectedBranch(selectedAdmin.branchId || "");
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!selectedAdmin) return;
    try {
      await Api.patch(`/church/edit-admin?id=${selectedAdmin.id}`, {
        isSuperAdmin,
        branchId: selectedBranch,
      });
      setAdmins(admins.map(admin =>
        admin.id === selectedAdmin.id
          ? { ...admin, isSuperAdmin, branchId: selectedBranch }
          : admin
      ));
      toast.success("Admin updated successfully");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Failed to update admin");
    }
  };

  // Show confirmation dialog
  const showConfirmation = (action: string) => {
    let message = "";
    if (action === 'suspend') {
      message = "Are you sure you want to suspend this admin?";
    } else if (action === 'delete') {
      message = "Are you sure you want to delete this admin? This action cannot be undone.";
    }
    setConfirmAction({ type: action, message });
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    if (!selectedAdmin || !confirmAction) return;
    setIsLoading(true);
    try {
      if (confirmAction.type === 'suspend') {
        await Api.patch(`/church/suspend-admin/${selectedAdmin.id}`);
        setAdmins(prev =>
          prev.map(admin =>
            admin.id === selectedAdmin.id ? { ...admin, isSuspended: true } : admin
          )
        );
        toast.success("Admin suspended successfully");
      } else if (confirmAction.type === 'delete') {
        await Api.delete(`/church/delete-admin/${selectedAdmin.id}`);
        setAdmins(prev => prev.filter(admin => admin.id !== selectedAdmin.id));
        toast.success("Admin deleted successfully");
      }
    } catch (error) {
      console.error(`Error ${confirmAction.type} admin:`, error);
      toast.error(`Failed to ${confirmAction.type} admin`);
    } finally {
      setIsLoading(false);
      setConfirmModalOpen(false);
      setConfirmAction(null);
    }
  };

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 1, sm: 1 }, bgcolor: "#f5f5f5", minHeight: "100%" }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
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
              All Admins
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: "#4b5563",
                fontSize: { xs: "1rem", sm: "1rem" },
              }}
            >
              View and manage all Admins.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/manage/admin")}
            sx={{
              bgcolor: "#1f2937",
              px: { xs: 2, sm: 2 },
              py: 1,
              borderRadius: 1,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: { xs: "1rem", sm: "1rem" },
            }}
          >
            Create Admin
          </Button>
        </Box>

        {/* Admins Count and Table */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="text-center text-white">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#111827]"></div>
              </div>
            </div>
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ mb: 2, color: "#4b5563", textAlign: "right" }}>
              {admins.length ? `${admins.length} Admin${admins.length > 1 ? 's' : ''} created` : "No Admins found"}
            </Typography>
            <Paper sx={{ boxShadow: 2, borderRadius: 1 }}>
              <TableContainer sx={{ overflowX: "auto", bgcolor: "#f5f5f5" }}>
                <Table sx={{ minWidth: { xs: "auto", sm: 650 }, width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Super Admin</TableCell>
                      {authData?.isSuperAdmin && <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((admin) => (
                        <TableRow
                          key={admin.id}
                          sx={{
                            borderBottom: "1px solid #e5e7eb",
                            backgroundColor: admin.isDeleted ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              textDecoration: admin.isDeleted ? 'line-through' : 'none',
                              color: admin.isDeleted ? 'gray' : 'inherit',
                            }}
                          >
                            {admin.name}
                          </TableCell>
                          <TableCell
                            sx={{
                              textDecoration: admin.isDeleted ? 'line-through' : 'none',
                              color: admin.isDeleted ? 'gray' : 'inherit',
                            }}
                          >
                            {admin.email}
                          </TableCell>
                          <TableCell
                            sx={{
                              textDecoration: admin.isDeleted ? 'line-through' : 'none',
                              color: admin.isDeleted ? 'gray' : 'inherit',
                            }}
                          >
                            {admin.phone}
                          </TableCell>
                          <TableCell
                            sx={{
                              textDecoration: admin.isDeleted ? 'line-through' : 'none',
                              color: admin.isDeleted ? 'gray' : 'inherit',
                            }}>{admin.isSuperAdmin ? "Yes" : "No"}</TableCell>
                          {authData?.isSuperAdmin && (
                            <TableCell>
                              <IconButton
                                aria-label="more"
                                aria-controls="admin-menu"
                                aria-haspopup="true"
                                onClick={(e) => handleMenuOpen(e, admin)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={admins.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  bgcolor: "#f5f5f5",
                  borderTop: '1px solid #e0e0e0',
                }}
              />
            </Paper>
          </>
        )}

        {/* Edit Admin Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          aria-labelledby="edit-admin-modal"
          aria-describedby="modal-to-edit-admin-details"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '500px' },
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  Edit Admin
                </Typography>
                {selectedAdmin && (
                  <Typography variant="subtitle1" color="text.secondary">
                    <div>{selectedAdmin.name}</div>
                    <div className="text-xs">{selectedAdmin.email}</div>
                  </Typography>
                )}
              </Box>
              <IconButton onClick={() => setEditModalOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            {selectedAdmin && (
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="branch-select-label">Branch</InputLabel>
                  <Select
                    labelId="branch-select-label"
                    id="branch-select"
                    value={selectedBranch}
                    label="Branch"
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    {branches.map((branch) => (
                      <SelectMenuItem key={branch.id} value={branch.id}>
                        {`${branch.name} - ${branch.address}`}
                      </SelectMenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSuperAdmin}
                      onChange={(e) => setIsSuperAdmin(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Super Admin?"
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setEditModalOpen(false)}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    disabled={isLoading}
                    onClick={handleEditSubmit}
                    sx={{ textTransform: 'none', bgcolor: '#1f2937' }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Modal>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {confirmAction?.type === 'suspend' ? 'Suspend Admin' : 'Delete Admin'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {confirmAction?.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmedAction} 
              color={confirmAction?.type === 'delete' ? "error" : "primary"}
              autoFocus
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Menu */}
        <Menu
          id="admin-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleEditModalOpen} disabled={selectedAdmin?.isDeleted }>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <MdOutlineEdit style={{ fontSize: '1rem' }} />
            </Box>
            Edit
          </MenuItem>
          {selectedAdmin?.isDeleted ? (
            <MenuItem
              onClick={() => showConfirmation('activate')}
              disabled={selectedAdmin?.isSuperAdmin || isLoading}
            >
              <MdRefresh style={{ marginRight: 8, fontSize: '1rem' }} />
              {isLoading ? 'Activating...' : 'Activate'}
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => showConfirmation('suspend')}
              disabled={selectedAdmin?.isSuperAdmin || isLoading}
            >
              <BlockIcon sx={{ mr: 1, fontSize: '1rem' }} />
              {isLoading ? 'Suspending...' : 'Suspend'}
            </MenuItem>
          )}
          <MenuItem
            onClick={() => showConfirmation('delete')}
            disabled={selectedAdmin?.isSuperAdmin}
          >
            <AiOutlineDelete style={{ marginRight: '8px', fontSize: '1rem' }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </DashboardManager>
  );
};

export default ViewAdmins;