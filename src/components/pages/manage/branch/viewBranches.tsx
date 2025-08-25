import React, { useState, useEffect } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import { Navigate } from "react-router-dom";
import BranchModal from "./branch";
import {
  Box,
  Button,
  CardContent,
  Card,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  Divider,
  Select as MuiSelect,
  MenuItem,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Grid,
} from "@mui/material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { 
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Close,
} from "@mui/icons-material";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { toast, ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { TbArrowFork } from "react-icons/tb";

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

interface CustomPaginationProps {
  count: number;
  rowsPerPage: number;
  page: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLargeScreen: boolean;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  count,
  rowsPerPage,
  page,
  onPageChange,
  isLargeScreen,
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        py: 2,
        px: { xs: 2, sm: 3 },
        color: "#777280",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          sx={{
            fontSize: isLargeScreen ? "0.75rem" : "0.875rem",
            color: "#777280",
          }}
        >
          {`${page * rowsPerPage + 1}–${Math.min(
            (page + 1) * rowsPerPage,
            count
          )} of ${count}`}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          onClick={() => onPageChange(null, page - 1)}
          disabled={isFirstPage}
          sx={{
            minWidth: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: isFirstPage ? "#4d4d4e8e" : "#F6F4FE",
            color: isFirstPage ? "#777280" : "#160F38",
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
          }}
        >
          <ChevronLeft />
        </Button>
        <Button
          onClick={() => onPageChange(null, page + 1)}
          disabled={isLastPage}
          sx={{
            minWidth: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: isLastPage ? "#4d4d4e8e" : "#F6F4FE",
            color: isLastPage ? "#777280" : "#160F38",
            "&:hover": {
              backgroundColor: "#F6F4FE",
              opacity: 0.9,
            },
            "&:disabled": {
              backgroundColor: "#4d4d4e8e",
              color: "#777280",
            },
          }}
        >
          <ChevronRight />
        </Button>
      </Box>
    </Box>
  );
};

const ViewBranches: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);;
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

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

  if (authData?.isHeadQuarter === false) {
    return <Navigate to="/manage/view-admins" replace />;
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  // Handle search to apply filters and reset pagination
  const handleSearch = () => {
    setIsSearching(true);
    setPage(0); // Reset to first page when applying filters
    // Filtering is handled by filteredBranches, so no additional API call is needed
    toast.success("Filters applied successfully!", {
      position: isMobile ? "top-center" : "top-right",
    });
    setIsSearching(false);
  };

  // Filter branches based on search and location
  const filteredBranches = branches.filter((branch) => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation =
      locationFilter === "" ||
      (locationFilter === "branch" && !branch.isHeadQuarter) ||
      (locationFilter === "hq" && branch.isHeadQuarter);
    return matchesSearch && matchesLocation;
  });

  // Calculate counts
  // const activeCount = filteredBranches.filter((branch) => branch.isActive && !branch.isDeleted).length;
  // const inactiveCount = filteredBranches.filter((branch) => !branch.isActive && !branch.isDeleted).length;
  // const hqCount = filteredBranches.filter((branch) => branch.isHeadQuarter).length;

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
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    if (!currentBranch?.id) {
      console.error("Branch ID is undefined");
      toast.error("Invalid branch data");
      return;
    }

    try {
      setLoading(true);
      await Api.patch(`/church/edit-branch/${currentBranch.id}`, editFormData);

      setBranches(
        branches.map((branch) =>
          branch.id === currentBranch.id ? { ...branch, ...editFormData } : branch
        )
      );

      toast.success("Branch updated successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
      handleEditClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update branch", {
        position: isMobile ? "top-center" : "top-right",
      });
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
        setBranches(branches.filter((branch) => branch.id !== currentBranch.id));
        toast.success("Branch deleted successfully!", {
          position: isMobile ? "top-center" : "top-right",
        });
      } else if (actionType === "suspend") {
        const newStatus = !currentBranch.isActive;
        await Api.patch(`/church/${newStatus ? "activate" : "suspend"}-branch/${currentBranch.id}`);
        setBranches(
          branches.map((branch) =>
            branch.id === currentBranch.id ? { ...branch, isActive: newStatus } : branch
          )
        );
        toast.success(`Branch ${newStatus ? "activated" : "suspended"} successfully!`, {
          position: isMobile ? "top-center" : "top-right",
        });
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${actionType} branch`, {
        position: isMobile ? "top-center" : "top-right",
      });
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
      <EmptyIcon sx={{ fontSize: 60, color: "rgba(255, 255, 255, 0.1)", mb: 2 }} />
      <Typography
        variant="h6"
        color="rgba(255, 255, 255, 0.1)"
        gutterBottom
        sx={{
          fontSize: isLargeScreen ? "1.25rem" : undefined,
        }}
      >
        No branches found
      </Typography>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      <Button
        variant="contained"
        onClick={() => setIsModalOpen(true)}
        sx={{
          backgroundColor: "#363740",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": {
            backgroundColor: "#363740",
            opacity: 0.9,
          },                              
        }}
      >
        Create New Branch
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <ToastContainer />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.1rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]"> Branch</span>
            </Typography>
            <Box>
              <Box
                sx={{
                  border: "1px solid #4d4d4e8e",
                  borderRadius: "32px",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#4d4d4e8e",
                  padding: "4px",
                  width: "fit-content",
                  gap: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", padding: "4px 16px" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                  >
                    Where?
                  </Typography>
                  <TextField
                    variant="standard"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      color: "#F6F4FE",
                      "& .MuiInputBase-input": { color: "#F6F4FE", fontWeight: 500, fontSize: "14px", py: "4px" },
                      flex: 1,
                    }}
                    InputProps={{ disableUnderline: true }}
                  />
                </Box>
                <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                <Box sx={{ display: "flex", flexDirection: "column", padding: "4px 8px" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                  >
                    Location
                  </Typography>
                  <MuiSelect
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    displayEmpty
                    sx={{
                      color: locationFilter ? "#F6F4FE" : "#777280",
                      fontWeight: 500,
                      fontSize: "14px",
                      ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                      ".MuiOutlinedInput-notchedOutline": { border: "none" },
                      "& .MuiSelect-icon": { display: "none" },
                    }}
                    renderValue={(selected) => selected || "Select Location"}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="branch">Branch</MenuItem>
                    <MenuItem value="hq">Headquarters</MenuItem>
                  </MuiSelect>
                </Box>
                <Box sx={{ pr: "8px" }}>
                  <Button
                    onClick={handleSearch}
                    sx={{
                      backgroundColor: "transparent",
                      border: "1px solid #777280",
                      color: "white",       
                      borderRadius: "50%",
                      minWidth: "48px",
                      height: "48px",
                      padding: 0,
                      "&:hover": { backgroundColor: "#777280" },
                    }}
                    disabled={loading || isSearching}
                  >
                    {isSearching ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SearchIcon sx={{ fontSize: "20px" }} />
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 7 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-end", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => setIsModalOpen(true)}
              size="medium"
              sx={{
                backgroundColor: "#363740",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": {
                  backgroundColor: "#363740",
                  opacity: 0.9,
                },
              }}
            >
              Create Branch +
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && branches.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && branches.length === 0 && <EmptyState />}

        {/* Empty State */}
        {!loading && !error && filteredBranches.length === 0 && <EmptyState />}

        {/* Data Table */}
        {filteredBranches.length > 0 && (
          <>           
            <Grid container spacing={2}>
              {filteredBranches
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((branch) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={branch.id}>
                    <Card                
                      sx={{
                        borderRadius: '10.267px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        boxShadow: '0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)',
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        opacity: branch.isDeleted ? 0.7 : 1,
                        "&:hover": {                        
                          backgroundColor: 'rgba(255, 255, 255, 0.)',
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <IconButton sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#777280',
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '15px',
                              borderRadius: 1,
                              textAlign: 'center'
                            }}>                            
                              <span className="border-2 rounded-md border-[#777280] p-1 ">
                                <TbArrowFork  size={30}/>
                              </span>
                            </IconButton>
                          </Box>
                          <Box>
                            <IconButton
                              onClick={(e) => {
                                setCurrentBranch(branch);
                                setAnchorEl(e.currentTarget);
                              }}
                              sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                color: '#777280',                                
                                padding: '8px',
                                borderRadius: 1,
                                textAlign: 'center'
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton> 
                          </Box>
                        </Box>
                        <Box display="flex" flexDirection={"column"} justifyContent="space-between" alignItems="flex-start">                                              
                          
                          <Typography
                            variant="body2"
                            sx={{
                              textDecoration: branch.isDeleted ? "line-through" : "none",
                              color: branch.isDeleted ? "gray" : "#777280",
                            }}
                          >
                            {branch.name}
                          </Typography>      
                          
                          {branch.address && (                          
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              sx={{
                                textDecoration: branch.isDeleted ? "line-through" : "none",
                                color: branch.isDeleted ? "gray" : "#E1E1E1",
                                
                              }}
                            >
                              {branch.address}         
                            </Typography>
                            
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>


            {/* Custom Pagination */}
            <CustomPagination
              count={filteredBranches.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              isLargeScreen={isLargeScreen}
            />            
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
              "& .MuiMenuItem-root": {
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              },
            },
          }}
        >
          <MenuItem onClick={handleEditOpen} disabled={currentBranch?.isDeleted || currentBranch?.isHeadQuarter}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")} disabled={loading || currentBranch?.isHeadQuarter}>
            {currentBranch?.isActive ? (
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
          <MenuItem onClick={() => showConfirmation("delete")} disabled={loading || currentBranch?.isHeadQuarter}>
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Edit Branch Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth 
          sx={{
            "& .MuiDialog-paper": {
              borderRadius:  2,
              bgcolor: '#2C2C2C',
              color: "#F6F4FE",
            },
          }}
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Edit Branch
              </Typography>
              <IconButton onClick={handleEditClose}>
                <Close className="text-gray-300"/>
              </IconButton>
            </Box>
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
                InputProps={{                 
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
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
                InputProps={{                 
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
              />
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                type="tel"
                value={editFormData.phone}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                InputProps={{                 
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
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
                InputProps={{                 
                  sx: {
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    fontSize: isLargeScreen ? "1rem" : undefined,
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: isLargeScreen ? "1rem" : undefined,
                    color: "#F6F4FE",                    
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },                    
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditSubmit}
              sx={{
                py: 1,
                backgroundColor: "#F6F4FE",
                px: { xs: 6, sm: 2 },
                borderRadius: 50,
                color: "#2C2C2C",
                fontWeight: "semibold",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "#F6F4FE",
                  opacity: 0.9,
                },
              }}
              variant="contained"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Branch Modal */}
         <BranchModal
          open={isModalOpen}
          onClose={() => {setIsModalOpen(false), fetchBranches()}}
          onSuccess={fetchBranches}
        />

        {/* Confirmation Modal */}
        <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="xs">
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {actionType === "delete"
              ? "Delete Branch"
              : actionType === "suspend"
              ? currentBranch?.isActive
                ? "Suspend Branch"
                : "Activate Branch"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {actionType === "delete"
                ? `Are you sure you want to delete "${currentBranch?.name}"?`
                : `Are you sure you want to ${currentBranch?.isActive ? "suspend" : "activate"} "${currentBranch?.name}"?`}
              {currentBranch?.isHeadQuarter && actionType === "delete" && " Headquarters branch cannot be deleted."}
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