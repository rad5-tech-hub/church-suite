import React, { useState, useEffect, useMemo } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import {
  Box,
  Button,
  Card,
  CardContent,
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
  SelectChangeEvent,
  Menu,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Close,
} from "@mui/icons-material";
import { PiChurch } from "react-icons/pi";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import Api from "../../../shared/api/api";
import { toast, ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import DepartmentModal from "./department"; // Corrected import path
import { useNavigate } from "react-router-dom";

interface Department {
  id: string;
  name: string;
  description: string | null;
  type: "Department" | "Outreach";
  isActive: boolean;
  isDeleted?: boolean;
}

interface AuthData {
  isHeadquarter?: boolean;
  isSuperAdmin?: boolean;
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

const ViewDepartment: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData as AuthData | undefined);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [actionType, setActionType] = useState<"delete" | "suspend" | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState<Omit<Department, "id">>({
    name: "",
    description: "",
    type: "Department",
    isActive: true,
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const navigate = useNavigate();

  // Fetch departments with error handling
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get("/church/get-departments");
      setDepartments(response.data.departments || []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to load departments. Please try again later.";
      console.error("Failed to fetch departments:", error);
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle search to apply filters and reset pagination
  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 500); // Simulate a brief loading state
    setPage(0);
    toast.success("Filters applied successfully!", { position: "top-right" });
  };

  // Filter departments based on search and type
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        typeFilter === "" ||
        (typeFilter === "Department" && dept.type === "Department") ||
        (typeFilter === "Outreach" && dept.type === "Outreach");
      return matchesSearch && matchesType;
    });
  }, [departments, searchTerm, typeFilter]);

  // Calculate counts
  // const activeCount = filteredDepartments.filter((dept) => dept.isActive).length;
  // const inactiveCount = filteredDepartments.filter((dept) => !dept.isActive).length;
  // const departmentCount = filteredDepartments.filter((dept) => dept.type === "Department").length;
  // const outreachCount = filteredDepartments.filter((dept) => dept.type === "Outreach").length;

  // Action handlers
  // const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, department: Department) => {
  //   setAnchorEl(event.currentTarget);
  //   setCurrentDepartment(department);
  // };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEditOpen = () => {
    if (currentDepartment) {
      setEditFormData({
        name: currentDepartment.name,
        description: currentDepartment.description || "",
        type: currentDepartment.type,
        isActive: currentDepartment.isActive,
      });
      setNameError(null);
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const showConfirmation = (action: "delete" | "suspend") => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCurrentDepartment(null);
    setNameError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setNameError(value.trim() ? null : "Department name is required");
    }
  };

  const handleTypeChange = (e: SelectChangeEvent<"Department" | "Outreach">) => {
    setEditFormData((prev) => ({ ...prev, type: e.target.value as "Department" | "Outreach" }));
  };

  const handleEditSubmit = async () => {
    if (!currentDepartment?.id) {
      toast.error("Invalid department data", { position: "top-right" });
      return;
    }
    if (!editFormData.name.trim()) {
      setNameError("Department name is required");
      return;
    }

    try {
      setLoading(true);
      await Api.patch(`/church/edit-dept/${currentDepartment.id}`, {
        ...editFormData,
        description: editFormData.description || null,
      });
      setDepartments(
        departments.map((dept) =>
          dept.id === currentDepartment.id ? { ...dept, ...editFormData } : dept
        )
      );
      toast.success("Department updated successfully!", { position: "top-right" });
      handleEditClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update department";
      console.error("Update error:", error);
      toast.error(errorMessage, { position: "top-right" });
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
        setDepartments(departments.filter((dept) => dept.id !== currentDepartment.id));
        toast.success("Department deleted successfully!", { position: "top-right" });
      } else if (actionType === "suspend") {
        const newStatus = !currentDepartment.isActive;
        await Api.patch(`/church/suspend-dept/${currentDepartment.id}`, {
          isActive: newStatus,
        });
        setDepartments(
          departments.map((dept) =>
            dept.id === currentDepartment.id ? { ...dept, isActive: newStatus } : dept
          )
        );
        toast.success(`Department ${newStatus ? "activated" : "suspended"} successfully!`, {
          position: "top-right",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${actionType} department`;
      console.error("Action error:", error);
      toast.error(errorMessage, { position: "top-right" });
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
  // const truncateDescription = (description: string | null, maxLength = 25) => {
  //   if (!description) return "-";
  //   return description.length <= maxLength
  //     ? description
  //     : `${description.substring(0, maxLength)}...`;
  // };

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
        No departments found
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => setIsModalOpen(true)}
        sx={{
          backgroundColor: "#363740",
          px: { xs: 2, sm: 2 },
          py: 1,
          mt: 2,
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
        Create New Department
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
              variant={isMobile ? "h5" : "h5"}
              component="h4"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.1rem" : undefined,
                display: "flex",
                alignItems: "center",
                marginBottom: 2,
                gap: 1,                
              }}
            >
              <span className="text-[#777280]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Department</span>
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
                  width: "100%",
                  gap: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, padding: "4px 16px" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                  >
                    Name
                  </Typography>
                  <TextField
                    variant="standard"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      "& .MuiInputBase-input": { color: "#F6F4FE", fontWeight: 500, fontSize: "14px", py: "4px" },
                      flex: 1,
                    }}
                    InputProps={{ disableUnderline: true }}
                  />
                </Box>
                <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: { xs: "120px", sm: "160px" }, padding: "4px 8px" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}
                  >
                    Type
                  </Typography>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    displayEmpty
                    sx={{
                      color: typeFilter ? "#F6F4FE" : "#777280",
                      fontWeight: 500,
                      fontSize: "14px",
                      ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                      ".MuiOutlinedInput-notchedOutline": { border: "none" },
                      "& .MuiSelect-icon": { display: "none" },
                    }}
                    renderValue={(selected) => selected || "Select Type"}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Department">Department</MenuItem>
                    <MenuItem value="Outreach">Outreach</MenuItem>
                  </Select>
                </Box>
                <Box sx={{ display: "flex", gap: "8px", pr: "8px" }}>
                  <Button
                    onClick={handleSearch}
                    aria-label="Search departments"
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
              disabled={!authData?.isSuperAdmin}
            >
              Create Department +
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && departments.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && departments.length === 0 && <EmptyState />}

        {/* Empty State */}
        {!loading && !error && filteredDepartments.length === 0 && <EmptyState />}

        {/* Data Cards */}
        {filteredDepartments.length > 0 && (
          <>         
            <Grid container spacing={2}>
              {filteredDepartments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((dept) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={dept.id}>
                    <Card
                      component="div"
                      onClick={() => {
                        navigate(`/departments/${dept.id}`);
                      }}
                      sx={{
                        borderRadius: '10.267px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        boxShadow: '0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)',
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        opacity: dept.isDeleted ? 0.7 : 1,
                        "&:hover": {
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{marginBottom: 3, display: 'flex', justifyContent: 'space-between'}}>
                          <Box>
                            <IconButton sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#E1E1E1',
                              display: 'flex',
                              flexDirection: 'column',                           
                              borderRadius: 1,
                              textAlign: 'center'
                            }}>
                              <PiChurch  size={30}/>
                              <span className="text-[10px]">
                                Department
                              </span>
                            </IconButton>
                          </Box>
                          <Box>
                            <IconButton
                              aria-label="Department actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentDepartment(dept);
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
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                              textDecoration: dept.isDeleted ? "line-through" : "none",
                              color: dept.isDeleted ? "gray" : "#E1E1E1",
                            }}
                          >
                            {dept.name}
                            {dept.type === "Outreach" && (
                              <Typography
                                component="span"
                                sx={{
                                  ml: 1,
                                  fontSize: "0.75rem",
                                  color: "#10b981",
                                  fontWeight: 500,
                                }}
                              >
                                (Outreach)
                              </Typography>
                            )}
                          </Typography>

                          {/* {authData?.isSuperAdmin && (
                            <IconButton
                              aria-label="Department actions"
                              aria-controls="department-menu"
                              onClick={(e) => handleMenuOpen(e, dept)}
                              disabled={loading}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                backgroundColor: "#E1E1E1",
                                "&:hover": {
                                  backgroundColor: "var(--color-primary)",
                                  color: "var(--color-text-on-primary)",
                                },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          )} */}
                        </Box>

                        <Box mt={2}>
                          {dept.description && (
                            <Box display="flex" alignItems="flex-start" mb={1}>
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: dept.isDeleted ? "line-through" : "none",
                                  color: dept.isDeleted ? "gray" : "#777280",
                                }}
                              >                            
                                <span>{dept.description}</span>
                                {/* <span>{truncateDescription(dept.description)}</span> */}                              
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>

            {/* Custom Pagination */}
            <CustomPagination
              count={filteredDepartments.length}
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
          id="department-menu"
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
          <MenuItem onClick={handleEditOpen} disabled={currentDepartment?.isDeleted || loading}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")} disabled={loading}>
            {currentDepartment?.isActive ? (
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

        {/* Edit Department Modal */}
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
                  Edit Department
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
                label="Department Name"
                name="name"
                value={editFormData.name}
                onChange={handleEditChange}
                margin="normal"
                variant="outlined"
                error={!!nameError}
                helperText={nameError}
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
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined, color: "#F6F4FE" }}>
                  Type
                </InputLabel>
                <Select
                  value={editFormData.type}
                  onChange={handleTypeChange}
                  label="Type"
                  sx={{
                    fontSize: isLargeScreen ? "1rem" : undefined,                
                    color: "#F6F4FE",
                    outlineColor: "#777280",
                    borderColor: "#777280",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#777280",
                    },
                    "& .MuiSelect-select": {
                        borderColor: "#777280",
                        color: "#F6F4FE",
                    },              
                  }}
                >
                  <MenuItem value="Department" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                    Department
                  </MenuItem>
                  <MenuItem value="Outreach" sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
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
              disabled={loading || !!nameError}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Department Modal */}
        <DepartmentModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchDepartments}
        />

        {/* Confirmation Modal */}
        <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="xs">
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {actionType === "delete"
              ? "Delete Department"
              : actionType === "suspend"
              ? currentDepartment?.isActive
                ? "Suspend Department"
                : "Activate Department"
              : ""}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              {actionType === "delete"
                ? `Are you sure you want to delete "${currentDepartment?.name}"?`
                : `Are you sure you want to ${currentDepartment?.isActive ? "suspend" : "activate"} "${currentDepartment?.name}"?`}
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

export default ViewDepartment;