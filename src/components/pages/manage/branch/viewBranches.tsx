import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
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
  TextField,
  TablePagination,
  IconButton,  
  Menu,
  MenuItem,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import BlockIcon from "@mui/icons-material/Block";
import { AiOutlineDelete } from "react-icons/ai";
import CloseIcon from "@mui/icons-material/Close";
import Api from "../../../shared/api/api";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { toast } from "react-toastify";

interface Branch {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isHeadQuarter: boolean;
  isActive: boolean;
  isDeleted?: boolean; // Added isDeleted property
}

const ViewBranches: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; message: string } | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  // Fetch branches from the API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const response = await Api.get(`/church/get-branches`);
        setBranches(response.data.branches);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
        toast.error("Failed to load branches. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, branch: Branch) => {
    setAnchorEl(event.currentTarget);
    setSelectedBranch(branch);
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
    if (selectedBranch) {
      setFormData({
        name: selectedBranch.name,
        email: selectedBranch.email,
        phone: selectedBranch.phone,
        address: selectedBranch.address,     
      });
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!selectedBranch) return;
    try {
      await Api.patch(`/church/edit-branch/${selectedBranch.id}`, formData);
      setBranches(branches.map(branch =>
        branch.id === selectedBranch.id ? { ...branch, ...formData } : branch
      ));
      setEditModalOpen(false);
      toast.success("Branch updated successfully");
    } catch (error) {
      console.error("Error updating branch:", error);
      toast.error("Failed to update branch");
    }
  };

  // Show confirmation dialog
  const showConfirmation = (action: string) => {
    let message = "";
    if (action === 'delete') {
      message = "Are you sure you want to delete this branch? This action cannot be undone.";
    } else if (action === 'suspend') {
      message = `Are you sure you want to ${selectedBranch?.isActive ? 'suspend' : 'activate'} this branch?`;
    }
    setConfirmAction({ type: action, message });
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    if (!selectedBranch || !confirmAction) return;
    setLoading(true);
    setActionType(confirmAction.type);
    try {
      if (confirmAction.type === 'delete') {
        await Api.delete(`/church/delete-branch/${selectedBranch.id}`);
        setBranches(branches.filter(branch => branch.id !== selectedBranch.id));
        toast.success("Branch deleted successfully");
      } else if (confirmAction.type === 'suspend') {
        const newStatus = !selectedBranch.isActive;
        await Api.patch(`/church/${newStatus ? 'activate' : 'suspend'}-branch/${selectedBranch.id}`);
        setBranches(branches.map(branch => 
          branch.id === selectedBranch.id ? { ...branch, isActive: newStatus } : branch
        ));
        toast.success(`Branch ${newStatus ? 'activated' : 'suspended'} successfully`);
      }
    } catch (error) {
      console.error(`Error ${confirmAction.type} branch:`, error);
      toast.error(`Failed to ${confirmAction.type} branch`);
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setConfirmAction(null);
      setActionType(null);
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
              All Branches
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                color: "#4b5563",
                fontSize: { xs: "1rem", sm: "1rem" },
              }}
            >
              View and manage all branches
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate("/manage/branch")}
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
            Create Branch
          </Button>
        </Box>

        {/* Branches Count and Table */}
        {loading ? (
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
              {branches.length ? `${branches.length} Branch${branches.length > 1 ? 'es' : ''}` : "No Branches found"}
            </Typography>
            <Paper sx={{ boxShadow: 2, borderRadius: 1 }}>
              <TableContainer sx={{ overflowX: "auto", bgcolor: "#f5f5f5" }}>
                <Table sx={{ minWidth: { xs: "auto", sm: 650 }, width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Address</TableCell>                                    
                      {authData?.isSuperAdmin && <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {branches
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((branch) => (
                        <TableRow
                          key={branch.id}
                          sx={{
                            borderBottom: "1px solid #e5e7eb",
                            backgroundColor: branch.isDeleted ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              textDecoration: branch.isDeleted ? 'line-through' : 'none',
                              color: branch.isDeleted ? 'gray' : 'inherit',
                            }}
                          >{branch.name}</TableCell>
                          <TableCell
                             sx={{
                              textDecoration: branch.isDeleted ? 'line-through' : 'none',
                              color: branch.isDeleted ? 'gray' : 'inherit',
                            }}
                          >{branch.email || "-"}</TableCell>
                          <TableCell
                             sx={{
                              textDecoration: branch.isDeleted ? 'line-through' : 'none',
                              color: branch.isDeleted ? 'gray' : 'inherit',
                            }}
                          >{branch.phone || "-"}</TableCell>
                          <TableCell
                             sx={{
                              textDecoration: branch.isDeleted ? 'line-through' : 'none',
                              color: branch.isDeleted ? 'gray' : 'inherit',
                            }}
                          >{branch.address || "-"}</TableCell>                                              
                          {authData?.isSuperAdmin && (
                            <TableCell>
                              <IconButton
                                aria-label="more"
                                aria-controls="branch-menu"
                                aria-haspopup="true"
                                onClick={(e) => handleMenuOpen(e, branch)}
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
                count={branches.length}
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

        {/* Edit Branch Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          aria-labelledby="edit-branch-modal"
          aria-describedby="modal-to-edit-branch-details"
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
              <Typography variant="h6" component="h2" gutterBottom>
                Edit Branch
              </Typography>
              <IconButton onClick={() => setEditModalOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
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
                  disabled={loading}
                  onClick={handleEditSubmit}
                  sx={{ textTransform: 'none', bgcolor: '#1f2937' }}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
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
            {confirmAction?.type === 'delete' ? 'Delete Branch' : 
             confirmAction?.type === 'suspend' ? (selectedBranch?.isActive ? 'Suspend Branch' : 'Activate Branch') : ''}
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
              color={confirmAction?.type === 'delete' ? 'error' : 'primary'}
              autoFocus
              disabled={loading}
            >
              {loading && actionType === confirmAction?.type ? 
                `${confirmAction?.type === 'delete' ? 'Deleting' : 
                  confirmAction?.type === 'suspend' ? (selectedBranch?.isActive ? 'Suspending' : 'Activating') : ''}...` : 
                confirmAction?.type === 'delete' ? 'Delete' : 
                confirmAction?.type === 'suspend' ? (selectedBranch?.isActive ? 'Suspend' : 'Activate') : ''}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Menu */}
        <Menu
          id="branch-menu"
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
          <MenuItem onClick={handleEditModalOpen} disabled={selectedBranch?.isDeleted }>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: '1rem' }} />
             Edit
          </MenuItem>
          <MenuItem
            onClick={() => showConfirmation('suspend')}
            disabled={selectedBranch?.isHeadQuarter || loading}
          >
            {!selectedBranch?.isDeleted ? (
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
            onClick={() => showConfirmation('delete')}
            disabled={selectedBranch?.isHeadQuarter || loading}
          >
            <AiOutlineDelete style={{ marginRight: '8px', fontSize: '1rem' }} />
            {loading && actionType === 'delete' 
              ? 'Deleting...' 
              : selectedBranch?.isHeadQuarter
              ? 'Cannot delete HQ' 
              : 'Delete'}
          </MenuItem>
        </Menu>
      </Box>
    </DashboardManager>
  );
};

export default ViewBranches;