import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
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
  TablePagination,
  Tooltip,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";

interface Branch {
  id: number | string;
  name: string;
  address: string;
}

interface Admin {
  id: number | string;
  name: string;
  email: string;
  title?: string;
  phone: string;
  isSuperAdmin: boolean;
  isSuspended?: boolean;
  branchId?: number | string;
  isDeleted?: boolean;
}

const ViewAdmins: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<number | string>("");
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  // Fetch admins and branches with error handling
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminsRes, branchesRes] = await Promise.all([
        Api.get("/church/view-admins"),
        Api.get("/church/get-branches"),
      ]);
      setAdmins(adminsRes.data.admins);
      setBranches(branchesRes.data.branches || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load admins. Please try again later.");
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // // Calculate counts
  // const superAdminCount = admins.filter(admin => admin.isSuperAdmin).length;
  // const regularAdminCount = admins.filter(admin => !admin.isSuperAdmin).length;
  // const suspendedCount = admins.filter(admin => admin.isSuspended).length;

  // Table column widths
  const columnWidths = {
    name: "25%",
    email: "30%",
    phone: "20%",
    superAdmin: "15%",
    actions: "10%"
  };

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, admin: Admin) => {
    setAnchorEl(event.currentTarget);
    setCurrentAdmin(admin);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEditOpen = () => {
    if (currentAdmin) {
      setIsSuperAdmin(currentAdmin.isSuperAdmin);
      setSelectedBranch(currentAdmin.branchId || "");
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentAdmin(null);
  };

  const showConfirmation = (action: string) => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  const handleEditSubmit = async () => {
    if (!currentAdmin?.id) {
      console.error("Admin ID is undefined");
      toast.error("Invalid admin data");
      return;
    }

    try {
      setLoading(true);
      await Api.patch(`/church/edit-admin?id=${currentAdmin.id}`, {
        isSuperAdmin,
        branchId: selectedBranch,
      });
      
      setAdmins(admins.map(admin =>
        admin.id === currentAdmin.id
          ? { ...admin, isSuperAdmin, branchId: selectedBranch }
          : admin
      ));
      
      toast.success("Admin updated successfully!");
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update admin");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!currentAdmin || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/church/delete-admin/${currentAdmin.id}`);
        setAdmins(admins.filter(admin => admin.id !== currentAdmin.id));
        toast.success("Admin deleted successfully!");
      } else if (actionType === "suspend") {
        const newStatus = !currentAdmin.isSuspended;
        await Api.patch(`/church/${newStatus ? 'suspend' : 'activate'}-admin/${currentAdmin.id}`);
        setAdmins(admins.map(admin => 
          admin.id === currentAdmin.id ? { ...admin, isSuspended: newStatus } : admin
        ));
        toast.success(`Admin ${newStatus ? "suspended" : "activated"} successfully!`);
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${actionType} admin`);
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentAdmin(null);
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
        No admins found
      </Typography>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      ) : null}
      <Button
        variant="contained"
        onClick={() => navigate("/manage/admin")}       
        sx={{
          backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
          px: { xs: 2, sm: 2 }, 
          mt: 2,
          color: "var(--color-text-on-primary)", // Ensure text color is set correctly
          fontSize: isLargeScreen ? '0.875rem' : undefined,
          "&:hover": {
            backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
            opacity: 0.9, // Add hover effect
          },
        }}
      >
        Create New Admin
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid  size={{xs:12, md:8}}>
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
              All Admins
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? '0.875rem' : undefined
              }}
            >
              View and manage all church admins.
            </Typography>
          </Grid>
          <Grid size={{xs:12, md:4}} sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            alignItems: 'center'
          }}>
            <Button
              variant="contained"
              onClick={() => navigate("/manage/admin")}
              size="medium"
              sx={{
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                fontWeight: 500,
                textTransform: "none",
                fontSize: isLargeScreen ? '1rem' : undefined,
                "&:hover": {
                  backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                  opacity: 0.9, // Add hover effect
                },
              }}
            >
              Create Admin
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && admins.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && admins.length === 0 && <EmptyState />}

        {/* Empty State */}
        {!loading && !error && admins.length === 0 && <EmptyState />}

        {/* Data Table */}
        {admins.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ 
              mb: 2, 
              color: "#4b5563", 
              textAlign: "right",
              fontSize: isLargeScreen ? '0.875rem' : undefined
            }}>
              {admins.length} Admin{admins.length !== 1 ? "s" : ""}  Created
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
                      width: columnWidths.superAdmin,
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}>Super Admin</TableCell>
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
                  {admins
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((admin) => (
                      <TableRow key={admin.id} sx={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: admin.isDeleted ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      }}>
                        <TableCell sx={{
                          textDecoration: admin.isDeleted ? 'line-through' : 'none',
                          color: admin.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.name,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          {admin.title ? `${admin.title} ` : ""}
                          {admin.name}
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: admin.isDeleted ? 'line-through' : 'none',
                          color: admin.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.email,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          <Tooltip title={admin.email || "-"} arrow>
                            <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                              {truncateText(admin.email)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: admin.isDeleted ? 'line-through' : 'none',
                          color: admin.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.phone,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          {admin.phone || "-"}
                        </TableCell>
                        <TableCell sx={{
                          textDecoration: admin.isDeleted ? 'line-through' : 'none',
                          color: admin.isDeleted ? 'gray' : 'inherit',
                          width: columnWidths.superAdmin,
                          fontSize: isLargeScreen ? '0.875rem' : undefined
                        }}>
                          {admin.isSuperAdmin ? "Yes" : "No"}
                        </TableCell>
                        {authData?.isSuperAdmin && (
                          <TableCell sx={{
                            width: columnWidths.actions,
                            textAlign: "center",
                            fontSize: isLargeScreen ? '0.875rem' : undefined
                          }}>
                            <IconButton
                              aria-label="more"
                              onClick={(e) => handleMenuOpen(e, admin)}
                              disabled={loading}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                bgcolor: '#E1E1E1',
                                '&:hover': { backgroundColor:"var(--color-primary)", color: '#f0f0f0' },
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
                count={admins.length}
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
          id="admin-menu"
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
          <MenuItem onClick={handleEditOpen} disabled={currentAdmin?.isDeleted}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem 
            onClick={() => showConfirmation("suspend")} 
            disabled={loading || currentAdmin?.isSuperAdmin}
          >
            {!currentAdmin?.isSuspended ? (
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
            disabled={loading || currentAdmin?.isSuperAdmin}
          >
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Admin Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: isLargeScreen ? '1.25rem' : undefined }}>
            Edit Admin
          </DialogTitle>
          <DialogContent>
            {currentAdmin && (
              <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {currentAdmin.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {currentAdmin.email}
                </Typography>

                <FormControl fullWidth>
                  <InputLabel id="branch-select-label" sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
                    Branch
                  </InputLabel>
                  <Select
                    labelId="branch-select-label"
                    id="branch-select"
                    value={selectedBranch}
                    label="Branch"
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: isLargeScreen ? '0.875rem' : undefined
                      }
                    }}
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {`${branch.name} - ${branch.address}`}
                      </MenuItem>
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
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }
                  }}
                />
              </Box>
            )}
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
                bgcolor: "var(--color-primary)",
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
              ? "Delete Admin"
              : actionType === "suspend"
              ? currentAdmin?.isSuspended
                ? "Activate Admin"
                : "Suspend Admin"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
              {actionType === "delete"
                ? `Are you sure you want to delete "${currentAdmin?.name}"?`
                : `Are you sure you want to ${currentAdmin?.isSuspended ? "activate" : "suspend"} "${currentAdmin?.name}"?`}
              {currentAdmin?.isSuperAdmin && 
                " Super admin cannot be modified."}
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
              disabled={loading || currentAdmin?.isSuperAdmin}              
            >
              {loading ? "Processing..." : actionType === "delete" ? "Delete" : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewAdmins;