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
  PersonAdd as PersonAddIcon,
  Phone as PhoneIcon,
  Block as BlockIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import { MdRefresh } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { FiSettings } from "react-icons/fi";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";

interface Member {
  id: string;
  memberId: string;
  name: string;
  sex: string;
  phoneNo: string;
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
    name: "25%",
    contact: "25%",
    sex: "15%",
    branch: "15%",
    actions: "20%",
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
      <EmptyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
      <Typography
        variant="h6"
        color="textSecondary"
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
        onClick={() => navigate("/members/member")}
        sx={{
          backgroundColor: "var(--color-primary)",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": {
            backgroundColor: "var(--color-primary)",
            opacity: 0.9,
          },
        }}
      >
        Add New Worker
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
              component="h1"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.5rem" : undefined,
              }}
            >
              All Workers
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.875rem" : undefined,
              }}
            >
              View and manage all church workers.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/members/member")}
              size="medium"
              sx={{
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
              }}
              startIcon={<PersonAddIcon />}
            >
              Add Worker
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && members.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
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
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.name,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.contact,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Contact
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.sex,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Gender
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: columnWidths.branch,
                        fontSize: isLargeScreen ? "0.875rem" : undefined,
                      }}
                    >
                      Branch
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
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
                    .map((member) => (
                      <TableRow
                        key={member.id}
                        sx={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: member.isDeleted
                            ? "rgba(0, 0, 0, 0.04)"
                            : "inherit",
                          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                        }}
                      >
                        <TableCell
                          sx={{
                            width: columnWidths.name,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "inherit",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {member.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.contact,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "inherit",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                fontSize: isLargeScreen ? "0.875rem" : undefined,
                                color: member.isDeleted
                                  ? "gray"
                                  : "text.secondary",
                                textDecoration: member.isDeleted
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              <PhoneIcon
                                sx={{
                                  fontSize: "1rem",
                                  marginRight: 1,
                                  color: "var(--color-primary)",
                                }}
                              />
                              {member.phoneNo || "N/A"}
                            </Typography>
                            <Typography
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                fontSize: isLargeScreen ? "0.875rem" : undefined,
                                color: member.isDeleted
                                  ? "gray"
                                  : "text.secondary",
                                textDecoration: member.isDeleted
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              <WhatsAppIcon
                                sx={{
                                  fontSize: "1rem",
                                  marginRight: 1,
                                  color: "#25D366",
                                }}
                              />
                              {member.whatappNo || "N/A"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.sex,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "inherit",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {member.sex}
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.branch,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "inherit",
                            textDecoration: member.isDeleted
                              ? "line-through"
                              : "none",
                          }}
                        >
                          Main Branch
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
                  borderTop: "1px solid #e0e0e0",
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
                <Tooltip title="Export workers data to Excel sheet" placement="top" arrow>
                  <Button
                    onClick={handleExportExcel}
                    disabled={exportLoading}
                    size="medium"
                    sx={{
                      backgroundColor: "var(--color-primary)",
                      px: { xs: 2, sm: 2 },
                      py: 1,
                      borderRadius: 1,
                      fontWeight: 500,
                      textTransform: "none",
                      color: "var(--color-text-on-primary)",
                      fontSize: isLargeScreen ? "1rem" : undefined,
                      "&:hover": {
                        backgroundColor: "var(--color-primary)",
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
                        Exporting...
                      </>
                    ) : (
                      "Export Excel"
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
    </DashboardManager>
  );
};

export default ViewMembers;