import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
import { RootState } from "../../../reduxstore/redux";
import { useSelector } from "react-redux";
import MemberModal from "./members";
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
  MenuItem,
  TablePagination,
  Menu,
  useTheme,
  useMediaQuery,
  Grid,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,  
} from "@mui/icons-material";
import { MdOutlineFileUpload } from "react-icons/md";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import { MdRefresh } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { FiSettings } from "react-icons/fi";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { PiDownloadThin } from "react-icons/pi";

interface Member {
  id: string;
  memberId: string;
  name: string;
  address: string;
  phoneNo: string;
  sex: string;
  whatappNo: string;
  isDeleted?: boolean;
}

const ViewMembers: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  

  // Fetch members from API
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get("/member/all-members");
      setMembers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      setError("Failed to load members. Please try again later.");
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle Excel export
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await Api.get("/member/export", {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = "members_export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel file exported successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error: any) {
      console.error("Failed to export members:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to export Excel file. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Table column widths
  const columnWidths = {
    snumber: '3%',
    name: "25%",
    contact: "15%",
    address: "25%",
    whatsapp: "15%",
    actions: "17%",
  };

  // Action handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: Member) => {
    setAnchorEl(event.currentTarget);
    setCurrentMember(member);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const showConfirmation = (action: string) => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  };

  const handleConfirmedAction = async () => {
    if (!currentMember || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/member/delete-member/${currentMember.id}`);
        setMembers(members.filter((member) => member.id !== currentMember.id));
        toast.success("Member deleted successfully!");
      } else if (actionType === "suspend") {
        await Api.patch(`/member/suspend-member/${currentMember.id}`);
        toast.success("Member suspended successfully!");
        fetchMembers();
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${actionType} member`);
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentMember(null);
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
        No Workers found
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
          borderRadius: 50,
          py: 1,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": {
            backgroundColor: "#363740",
            opacity: 0.9,
          },
        }}
      >
        Add New Worker
      </Button>
    </Box>
  );

    // Handle Excel import
    const handleImportExcel = () => {
      setOpenDialog(true);
    };
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (
        file &&
        (file.type === "application/vnd.ms-excel" ||
          file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      ) {
        setSelectedFile(file);
      } else {
        toast.error("Please select a valid Excel file (.xlsx or .xls)", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        setSelectedFile(null);
      }
    };
  
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (
        file &&
        (file.type === "application/vnd.ms-excel" ||
          file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      ) {
        setSelectedFile(file);
      } else {
        toast.error("Please drop a valid Excel file (.xlsx or .xls)", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        setSelectedFile(null);
      }
    };
  
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(true);
    };
  
    const handleDragLeave = () => {
      setIsDragging(false);
    };
  
    const handleUpload = async () => {
      if (!selectedFile) {
        toast.error("Please select an Excel file to upload", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        return;
      }
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
        await Api.post(`/member/import?churchId=${authData?.churchId}${branchIdParam}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Excel file uploaded successfully!", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
        setOpenDialog(false);
        setSelectedFile(null);
        setTimeout(() => {
          fetchMembers();
        }, 1500);
      } catch (error: any) {
        console.error("Error uploading file:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to upload Excel file. Please try again.";
        toast.error(errorMessage, {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleCloseDialog = () => {
      setOpenDialog(false);
      setSelectedFile(null);
      setIsDragging(false);
    };

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 8 }}>
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
              <span className="text-[#777280]">Members</span>{" "}
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />{" "}
              <span className="text-[#F6F4FE]">Worker</span>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
            
            </Typography>
          </Grid>
          <Grid          
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              xs:12,
              md:4,
              mt: { xs: 2, md: 0 } // Add some top margin on mobile if needed
            }}
          >
            <Box sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant="contained"
                onClick={handleImportExcel}
                disabled={isLoading}
                sx={{
                  py: 1,
                  backgroundColor: "#363740",
                  px: { xs: 3, sm: 3 },
                  borderRadius: 50,
                  fontWeight: "semibold",
                  textTransform: "none",
                  color: "var(--color-text-on-primary)",
                  fontSize: { xs: "1rem", sm: "1rem" },
                  "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
                  width: { xs: "100%", sm: "auto" },
                  minWidth: 'max-content'
                }}
              >
                Upload Workers <MdOutlineFileUpload className="ml-1" />
              </Button>
            
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
                  fontSize: { xs: "1rem", sm: "1rem" },
                  "&:hover": {
                    backgroundColor: "#363740",
                    opacity: 0.9,
                  },
                  width: { xs: "100%", sm: "auto" },
                  minWidth: 'max-content'
                }}              
              >
                Add Worker +
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && members.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && members.length === 0 && <EmptyState />}

        {/* Empty State */}
        {!loading && !error && members.length === 0 && <EmptyState />}

        {/* Data Table */}
        {members.length > 0 && (
          <>
            <TableContainer
              sx={{
                boxShadow: 2,
                borderRadius: 1,
                overflowX: "auto",
              }}
            >
              <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
                <TableHead>
                  <TableRow sx={{ "& th": { border: "none", backgroundColor: "transparent" } }}>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.snumber,
                        color: "#777280",
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.name,
                        color: "#777280",
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#777280",
                        width: columnWidths.contact,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Phone Number
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#777280",
                        width: columnWidths.address,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Address
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#777280",
                        width: columnWidths.whatsapp,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Whatsapp Number
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "#777280",
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
                  {members
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((member, index) => (
                      <TableRow
                        key={member.id}
                        sx={{         
                          "& td": { border: "none" },                 
                          backgroundColor: member.isDeleted
                          ? "rgba(0, 0, 0, 0.04)" : "#4d4d4e8e",
                          borderRadius: "4px",
                          "&:hover": {
                            backgroundColor: "#4d4d4e8e",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                          transition: "all 0.2s ease",
                          mb: 2,
                        }}
                      >
                        <TableCell
                          sx={{
                            width: columnWidths.snumber,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "#F6F4FE",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {(index + 1).toString().padStart(2, "0")}
                        </TableCell>
                        <TableCell
                          sx={{
                            textDecoration: member.isDeleted ? "line-through" : "none",
                            color: member.isDeleted ? "gray" : "#F6F4FE",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            py: 2,
                            flex: 1,
                          }}
                        >
                          <Box className="py-2 px-3 rounded-full bg-[#F6F4FE] text-[#160F38] font-bold text-lg mr-2">
                            {member.name.split(" ").map((name) => name.charAt(0)).join("")}
                          </Box>
                          <Box>
                            {member.name}
                            <br />
                            <span className="text-[13px] text-[#777280]">{member.sex || "-"}</span>
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.contact,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "#F6F4FE",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {member.phoneNo || "N/A"}                            
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.address,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "#F6F4FE",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >                          
                          {member.address || "N/A"}                            
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.whatsapp,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "#F6F4FE",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {member.whatappNo}
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
                            onClick={(e) => handleMenuOpen(e, member)}
                            disabled={loading}
                            sx={{
                              borderRadius: 1,
                              backgroundColor: "#e1e1e1",
                              "&:hover": {
                                backgroundColor: "var(--color-primary)",
                                opacity: 0.9,
                                color: "#e1e1e1",
                              },
                            }}
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
                count={members.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{  
                  color: '#F6F4FE',
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    {
                      fontSize: isLargeScreen ? "0.75rem" : undefined,
                    },
                }}
              />
              <Box
                sx={{
                  p: 3,
                  display: "flex",
                  justifyContent: "flex-end",
                  width: "100%",
                }}
              >
                <Tooltip title="Download Workers Data" placement="top" arrow>
                  <Button
                    onClick={handleExportExcel}
                    disabled={exportLoading}
                    size="medium"
                    sx={{
                      backgroundColor: "#363740",
                      px: { xs: 2, sm: 2 },
                      py: 1,
                      borderRadius: 1,
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
                    {exportLoading ? (
                      <>
                        <CircularProgress
                          size={18}
                          sx={{ color: "var(--color-text-on-primary)", mr: 1 }}
                        />
                        Downloading...
                      </>
                    ) : (
                      <span className="flex items-center gap-1 "> Download Workers <PiDownloadThin/></span>
                    )}
                  </Button>
                </Tooltip>
              </Box>
            </TableContainer>
          </>
        )}

        {/* Action Menu */}
        <Menu
          id="member-menu"
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
          <MenuItem
            onClick={() => navigate(`/members/view/${currentMember?.id}`)}
            disabled={currentMember?.isDeleted}
          >
            <FiSettings style={{ marginRight: 8, fontSize: "1rem" }} />
            Settings
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")}>
            {!currentMember?.isDeleted ? (
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

        {/* Confirmation Modal */}
        <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="xs">
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {actionType === "delete" ? "Delete Worker" : "Suspend Worker"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              Are you sure you want to {actionType} {currentMember?.name}?
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
              color={actionType === "delete" ? "error" : "warning"}
              variant="contained"
              disabled={loading}
            >
              {loading ? "Processing..." : actionType === "delete" ? "Delete" : "Suspend"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {/* Import Excel Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Import Excel File</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.grey[400]}`,
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              bgcolor: isDragging ? theme.palette.grey[100] : "transparent",
              transition: "all 0.2s",
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Drag and drop your Excel file here or
            </Typography>
            <Button
              variant="contained"
              component="label"
              sx={{
                mt: 2,
                backgroundColor: "#777280",
                color: "var(--color-text-on-primary)",
                "&:hover": { backgroundColor: "#777280", opacity: 0.9 },
              }}
            >
              Select File
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Selected file: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={isLoading || !selectedFile}
            sx={{
              backgroundColor: "#777280",
              color: "var(--color-text-on-primary)",
              "&:hover": { backgroundColor: "#777280", opacity: 0.9 },
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* member-workermodal */}
      <MemberModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMembers}
      />
    </DashboardManager>
  );
};

export default ViewMembers;