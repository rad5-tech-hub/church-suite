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
  Select,
  MenuItem,
  Tooltip,
  SelectChangeEvent,
  Menu,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Close,
} from "@mui/icons-material";
import { PiChurch } from "react-icons/pi";
import { MdRefresh, MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import UnitModal from "./unit";

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

const ViewUnit: React.FC = () => {
  // State Management
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [actionType, setActionType] = useState<"delete" | "suspend" | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editFormData, setEditFormData] = useState<Omit<Unit, "id" | "isActive" | "isDeleted">>({
    name: "",
    description: "",
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  // Theme and Media Queries
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Data Fetching
  const fetchDepartments = async () => {
    setLoading(true);
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

  const fetchUnits = async (departmentId: string) => {
    if (!departmentId) {
      setUnits([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get(`/church/a-department/${departmentId}`);
      setUnits(response.data.department.units || []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to load units. Please try again later.";
      console.error("Failed to fetch units:", error);
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right" });
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

  // Search and Filtering
  const handleSearch = () => {
    setIsSearching(true);
    setPage(0);
    toast.success("Filters applied successfully!", { position: "top-right" });
    setTimeout(() => {
      setIsSearching(false);
    }, 200);
  };

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [units, searchTerm]);

  // Action Handlers
  const handleMenuClose = () => setAnchorEl(null);

  const handleEditOpen = () => {
    if (currentUnit) {
      setEditFormData({
        name: currentUnit.name,
        description: currentUnit.description || "",
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
    setCurrentUnit(null);
    setNameError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setNameError(value.trim() ? null : "Unit name is required");
    }
  };

  const handleDepartmentChange = (e: SelectChangeEvent<string>) => {
    setSelectedDepartmentId(e.target.value);
    setPage(0);
  };

  const handleEditSubmit = async () => {
    if (!currentUnit?.id) {
      toast.error("Invalid unit data", { position: "top-right" });
      return;
    }
    if (!editFormData.name.trim()) {
      setNameError("Unit name is required");
      return;
    }

    try {
      setLoading(true);
      await Api.patch(`/church/edit-unit/${currentUnit.id}`, {
        ...editFormData,
        description: editFormData.description || null,
      });
      setUnits(
        units.map((unit) =>
          unit.id === currentUnit.id ? { ...unit, ...editFormData } : unit
        )
      );
      toast.success("Unit updated successfully!", { position: "top-right" });
      handleEditClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update unit";
      console.error("Update error:", error);
      toast.error(errorMessage, { position: "top-right" });
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
        toast.success("Unit deleted successfully!", { position: "top-right" });
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
        toast.success(`Unit ${newStatus ? "activated" : "suspended"} successfully!`, {
          position: "top-right",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${actionType} unit`;
      console.error("Action error:", error);
      toast.error(errorMessage, { position: "top-right" });
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentUnit(null);
    }
  };

  // Pagination
  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper Functions
  const truncateDescription = (description: string | null, maxLength = 25) => {
    if (!description) return "-";
    return description.length <= maxLength
      ? description
      : `${description.substring(0, maxLength)}...`;
  };

  // Empty State Component
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
        {selectedDepartmentId
          ? "No units found for this department"
          : "Please select a department to view units"}
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {error ? (
        <Button
          variant="contained"
          onClick={() => setIsModalOpen(true)}
          sx={{
            px: { xs: 2, sm: 2 },
            py: 1,
            mt: 2,
            borderRadius: 50,
            backgroundColor: "#363740",
            fontWeight: 500,
            textTransform: "none",
            color: "#FFFFFF",
            fontSize: isLargeScreen ? "1rem" : undefined,
            "&:hover": {
              backgroundColor: "#363740",
              opacity: 0.9,
            },
          }}
        >
          Create New Unit
        </Button>
      ) : (
        <Select
          value={selectedDepartmentId}
          onChange={handleDepartmentChange}
          displayEmpty
          sx={{
            backgroundColor: "#F6F4FE",
            color: "#363740",
            fontWeight: 500,
            fontSize: isLargeScreen ? "1rem" : "0.875rem",
            borderRadius: "50px",
            mt: 2,
            px: { xs: 2, sm: 2 },
            py: 1,
            "& .MuiSelect-select": { py: 1 },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#363740" },
          }}
          renderValue={(selected) =>
            selected
              ? departments.find((dept) => dept.id === selected)?.name || "Select Department"
              : "Select Department"
          }
        >
          <MenuItem value="" disabled>
            {departments.length ? "Select Department" : "Loading..."}
          </MenuItem>
          {departments.map((dept) => (
            <MenuItem key={dept.id} value={dept.id}>
              {dept.name}
            </MenuItem>
          ))}
        </Select>
      )}
    </Box>
  );

  return (
    <DashboardManager>
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
                gap: 1,
              }}
            >
              <span className="text-[#777280]">Manage</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Unit</span>
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
                    Department
                  </Typography>
                  <Select
                    value={selectedDepartmentId}
                    onChange={handleDepartmentChange}
                    displayEmpty
                    sx={{
                      color: selectedDepartmentId ? "#F6F4FE" : "#777280",
                      fontWeight: 500,
                      fontSize: "14px",
                      ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
                      ".MuiOutlinedInput-notchedOutline": { border: "none" },
                      "& .MuiSelect-icon": { display: "none" },
                    }}
                    renderValue={(selected) =>
                      selected
                        ? departments.find((dept) => dept.id === selected)?.name || "Select Department"
                        : "Select Department"
                    }
                  >
                    <MenuItem value="" disabled>
                      {departments.length ? "Select Department" : "Loading..."}
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box sx={{ display: "flex", gap: "8px", pr: "8px" }}>
                  <Button
                    onClick={handleSearch}
                    aria-label="Search units"
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
              justifyContent: { xs: "flex-start", md: "flex-end" },
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
                color: "#F6F4FE",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": {
                  backgroundColor: "#363740",
                  opacity: 0.9,
                },
              }}
              // disabled={!authData?.isSuperAdmin || !selectedDepartmentId}              
            >
              Create Unit +
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {/* Error or Empty State */}
        {!loading && (error || filteredUnits.length === 0 || !selectedDepartmentId) && <EmptyState />}

        {/* Data Cards */}
        {filteredUnits.length > 0 && (
          <>
            <Grid container spacing={2}>
              {filteredUnits
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((unit) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={unit.id}>
                    <Card
                      sx={{
                        borderRadius: '10.267px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        boxShadow: '0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)',
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        opacity: unit.isDeleted ? 0.7 : 1,
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <IconButton sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#E1E1E1',
                              display: 'flex',
                              flexDirection: 'column',
                              paddingX: '15px',
                              borderRadius: 1,
                              textAlign: 'center'
                            }}>
                              <PiChurch size={30} />
                              <span className="text-[10px]">
                                unit
                              </span>
                            </IconButton>
                          </Box>
                          <Box>
                            <IconButton
                              aria-label="Department actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentUnit(unit);
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
                              textDecoration: unit.isDeleted ? "line-through" : "none",
                              color: unit.isDeleted ? "gray" : "#E1E1E1",
                            }}
                          >
                            {unit.name}
                          </Typography>
                        </Box>
                        <Box mt={2}>
                          {unit.description && (
                            <Box display="flex" alignItems="flex-start" mb={1}>
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: unit.isDeleted ? "line-through" : "none",
                                  color: unit.isDeleted ? "gray" : "#777280",
                                }}
                              >
                                <Tooltip title={unit.description} arrow>
                                  <span>{truncateDescription(unit.description)}</span>
                                </Tooltip>
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
              count={filteredUnits.length}
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
          <MenuItem onClick={handleEditOpen} disabled={currentUnit?.isDeleted || loading}>
            <MdOutlineEdit style={{ marginRight: 8, fontSize: "1rem" }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")} disabled={loading}>
            {currentUnit?.isActive ? (
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
                <Typography
                  variant={isMobile ? "h5" : "h5"}
                  component="h1"
                  fontWeight={600}
                  sx={{           
                    fontSize: isLargeScreen ? '1.5rem' : undefined,
                  }}
                >
                 Edit Unit
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
                label="Unit Name"
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
                fontWeight: "semibold",
                color: "#2C2C2C",
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

        {/* Create Unit Modal */}
        <UnitModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchUnits(selectedDepartmentId)}
        />

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