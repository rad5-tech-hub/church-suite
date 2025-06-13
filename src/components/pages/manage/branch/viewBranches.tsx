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
  TablePagination,
  Tooltip,
  Menu,
  MenuItem,
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
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";

interface Branch {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isHeadQuarter: boolean;
  isActive: boolean;
  isDeleted?: boolean;
}

const ViewBranches: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState<Omit<Branch, "id" | "isHeadQuarter" | "isActive">>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  // Fetch branches with error handling
  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get("/church/get-branches");
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      setError("Failed to load branches. Please try again later.");
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Calculate counts
  const activeCount = branches.filter(branch => branch.isActive && !branch.isDeleted).length;
  const inactiveCount = branches.filter(branch => !branch.isActive && !branch.isDeleted).length;
  const hqCount = branches.filter(branch => branch.isHeadQuarter).length;

  // Table column widths
  const columnWidths = {
    name: "25%",
    email: "25%",
    phone: "15%",
    address: "25%",
    actions: "10%"
  };

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, branch: Branch) => {
    setAnchorEl(event.currentTarget);
    setCurrentBranch(branch);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEditOpen = () => {
    if (currentBranch) {
      setEditFormData({
        name: currentBranch.name,
        email: currentBranch.email,
        phone: currentBranch.phone,
        address: currentBranch.address,
      });
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentBranch(null);
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
    if (!currentBranch?.id) {
      console.error("Branch ID is undefined");
      toast.error("Invalid branch data");
      return;
    }
  
    try {
      setLoading(true);
      await Api.patch(
        `/church/edit-branch/${currentBranch.id}`,
        editFormData
      );
      
      setBranches(branches.map(branch =>
        branch.id === currentBranch.id ? { ...branch, ...editFormData } : branch
      ));
      
      toast.success("Branch updated successfully!");
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update branch");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!currentBranch || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/church/delete-branch/${currentBranch.id}`);
        setBranches(branches.filter(branch => branch.id !== currentBranch.id));
        toast.success("Branch deleted successfully!");
      } else if (actionType === "suspend") {
        const newStatus = !currentBranch.isActive;
        await Api.patch(`/church/${newStatus ? 'activate' : 'suspend'}-branch/${currentBranch.id}`);
        setBranches(branches.map(branch => 
          branch.id === currentBranch.id ? { ...branch, isActive: newStatus } : branch
        ));
        toast.success(`Branch ${newStatus ? "activated" : "suspended"} successfully!`);
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${actionType} branch`);
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentBranch(null);
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
    return text.length <= maxLength 
      ? text 
      : `${text.substring(0, maxLength)}...`;
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
        No branches found
      </Typography>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      ) : null}
      <Button
        variant="contained"
        onClick={() => navigate("/manage/branch")}       
        sx={{
          backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
          px: { xs: 2, sm: 2 }, 
          mt: 2,
          fontSize: isLargeScreen ? '0.875rem' : undefined,
          color: "var(--color-text-on-primary)", // Ensure text color is set correctly
          "&:hover": {
            backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
            opacity: 0.9, // Add hover effect
          },
        }}
      >
        Create New Branch
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
              All Branches
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }}
            >
              View and manage all church branches.
            </Typography>
          </Grid>
          <Grid size={{xs:12, md:4}} sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            alignItems: 'center'
          }}>
            <Button
              variant="contained"
              onClick={() => navigate("/manage/branch")}
              size="medium"
              sx={{
                backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                fontSize: isLargeScreen ? '1rem' : undefined,
                "&:hover": {
                  backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                  opacity: 0.9, // Add hover effect
                },
              }}
            >
              Create Branch
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && branches.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && branches.length === 0 && <EmptyState />}

        {/* Empty State */}
        {!loading && !error && branches.length === 0 && <EmptyState />}

        {/* Data Table */}
        {branches.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ 
              mb: 2, 
              color: "#4b5563", 
              textAlign: "right",
              fontSize: isLargeScreen ? '0.875rem' : undefined
            }}>
              {branches.length} Branch{branches.length !== 1 ? "es" : ""} • 
              {` ${activeCount} Active • ${inactiveCount} Inactive • ${hqCount} HQ`}
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
                      width: columnWidths.email,
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Email</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      width: columnWidths.phone,
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Phone</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      width: columnWidths.address,
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Address</TableCell>
                    {authData?.isSuperAdmin && (
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        width: columnWidths.actions,
                        textAlign: "center",
                        fontSize: isLargeScreen ? '0.875rem' : undefined
                      }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branches
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((branch) => (
                      <TableRow key={branch.id} sx={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: branch.isDeleted ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      }}>
                        <TableCell sx={{
                          textDecoration: branch.isDeleted ? 'line-through' : 'none',
                          color: branch.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.name,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          {branch.name}
                          {branch.isHeadQuarter && (
                            <Typography 
                              component="span" 
                              sx={{ 
                                ml: 1, 
                                fontSize: '0.75rem',
                                color: '#10b981',
                                fontWeight: 500
                              }}
                            >
                              (HQ)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: branch.isDeleted ? 'line-through' : 'none',
                          color: branch.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.email,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          <Tooltip title={branch.email || "-"} arrow>
                            <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                              {truncateText(branch.email)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: branch.isDeleted ? 'line-through' : 'none',
                          color: branch.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.phone,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          {branch.phone || "-"}
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: branch.isDeleted ? 'line-through' : 'none',
                          color: branch.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.address,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          <Tooltip title={branch.address || "-"} arrow>
                            <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                              {truncateText(branch.address)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        {authData?.isSuperAdmin && (
                          <TableCell sx={{
                            width: columnWidths.actions,
                            textAlign: "center",
                            fontSize: isLargeScreen ? '0.875rem' : undefined
                          }}>
                            <IconButton
                              aria-label="more"
                              onClick={(e) => handleMenuOpen(e, branch)}
                              disabled={loading || branch.isHeadQuarter}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                                "&:hover": {
                                  backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                                  opacity: 0.9, // Add hover effect
                                },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={branches.length}
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
          id="branch-menu"
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
          <MenuItem onClick={handleEditOpen} disabled={currentBranch?.isDeleted || currentBranch?.isHeadQuarter}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem 
            onClick={() => showConfirmation("suspend")} 
            disabled={loading || currentBranch?.isHeadQuarter}
          >
             {!currentBranch?.isDeleted ? (
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
            disabled={loading || currentBranch?.isHeadQuarter}
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Branch Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: isLargeScreen ? '1.25rem' : undefined }}>
            Edit Branch
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Branch Name"
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
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={editFormData.email}
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
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                type="number"
                value={editFormData.phone}
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
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={editFormData.address}
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
                color: "var(--color-primary)",
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              sx={{ 
                backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                "&:hover": {
                  backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                  opacity: 0.9, // Add hover effect
                },
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
              ? "Delete Branch"
              : actionType === "suspend"
              ? currentBranch?.isActive
                ? "Suspend Branch"
                : "Activate Branch"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
              {actionType === "delete"
                ? `Are you sure you want to delete "${currentBranch?.name}"?`
                : `Are you sure you want to ${currentBranch?.isActive ? "suspend" : "activate"} "${currentBranch?.name}"?`}
              {currentBranch?.isHeadQuarter && actionType === "delete" && 
                " Headquarters branch cannot be deleted."}
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
              disabled={loading || (actionType === "delete" && currentBranch?.isHeadQuarter)}              
            >
              {loading ? "Processing..." : actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewBranches;