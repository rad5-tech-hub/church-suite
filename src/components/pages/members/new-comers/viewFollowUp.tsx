import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Menu,
  MenuItem,
  TablePagination,
  useTheme,
  useMediaQuery,
  Grid,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  SentimentVeryDissatisfied as EmptyIcon,
  PersonOutline,
} from "@mui/icons-material";
import { AiOutlineDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";

// Types
interface FollowUp {
  id: string;
  name: string;
  sex: string;
  phoneNo: string;
  address: string;
  timer: number;
  whatappNo: string;
  birthMonth: string;
  birthDay: string;
  maritalStatus: string;
  isActive: boolean;
  isDeleted: boolean;
}

// Table column widths
interface TableColumnWidths {
  name: string;
  phoneNo: string;
  address: string;
  sex: string;
  actions: string;
}

// Constants
const TABLE_COLUMN_WIDTHS: TableColumnWidths = {
  name: "25%",
  phoneNo: "25%",
  address: "25%",
  sex: "15%",
  actions: "10%",
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

// Components
const EmptyState: React.FC<{
  error: string | null;
  onAddFollowUp: () => void;
  isLargeScreen: boolean;
}> = ({ error, onAddFollowUp, isLargeScreen }) => (
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
      sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}
    >
      No Newcomers found
    </Typography>
    {error && (
      <Typography color="error" sx={{ mb: 2 }}>
        {error}
      </Typography>
    )}
    <Button
      variant="contained"
      onClick={onAddFollowUp}
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
      Add Newcomer
    </Button>
  </Box>
);

const FollowUpRow: React.FC<{
  followUp: FollowUp;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, followUp: FollowUp) => void;
  isLargeScreen: boolean;
  loading: boolean;
}> = React.memo(({ followUp, onMenuOpen, isLargeScreen, loading }) => (
  <TableRow
    sx={{
      borderBottom: "1px solid #e5e7eb",
      backgroundColor: followUp.isDeleted ? "rgba(0, 0, 0, 0.04)" : "inherit",
      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
    }}
  >
    <TableCell
      sx={{
        width: TABLE_COLUMN_WIDTHS.name,
        fontSize: isLargeScreen ? "0.875rem" : undefined,
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: followUp.isDeleted ? "gray" : "inherit",
        textDecoration: followUp.isDeleted ? "line-through" : "none",
      }}
    >
      <Box
        sx={{
          width: 15,
          height: 15,
          borderRadius: 1,
          bgcolor:
            followUp.timer === 1
              ? "warning.main"
              : followUp.timer === 2
              ? "primary.main"
              : "success.main",
        }}
      />
      <Box>{followUp.name}</Box>
    </TableCell>
    <TableCell
      sx={{
        width: TABLE_COLUMN_WIDTHS.phoneNo,
        fontSize: isLargeScreen ? "0.875rem" : undefined,
        color: followUp.isDeleted ? "gray" : "inherit",
        textDecoration: followUp.isDeleted ? "line-through" : "none",
      }}
    >
      {followUp.phoneNo || "N/A"}
    </TableCell>
    <TableCell
      sx={{
        width: TABLE_COLUMN_WIDTHS.address,
        fontSize: isLargeScreen ? "0.875rem" : undefined,
        color: followUp.isDeleted ? "gray" : "inherit",
        textDecoration: followUp.isDeleted ? "line-through" : "none",
      }}
    >
      {followUp.address || "N/A"}
    </TableCell>
    <TableCell
      sx={{
        width: TABLE_COLUMN_WIDTHS.sex,
        fontSize: isLargeScreen ? "0.875rem" : undefined,
        color: followUp.isDeleted ? "gray" : "inherit",
        textDecoration: followUp.isDeleted ? "line-through" : "none",
      }}
    >
      {followUp.sex || "N/A"}
    </TableCell>
    <TableCell
      sx={{
        width: TABLE_COLUMN_WIDTHS.actions,
        textAlign: "center",
        fontSize: isLargeScreen ? "0.875rem" : undefined,
      }}
    >
      <IconButton
        aria-label="more"
        onClick={(e) => onMenuOpen(e, followUp)}
        disabled={loading || followUp.isDeleted}
        sx={{
          borderRadius: 1,
          backgroundColor: "#e1e1e1",
          "&:hover": {
            backgroundColor: "var(--color-primary)",
            opacity: 0.9,
            color: "#ffffff",
          },
        }}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </TableCell>
  </TableRow>
));

const ActionMenu: React.FC<{
  anchorEl: HTMLElement | null;
  currentFollowUp: FollowUp | null;
  onClose: () => void;
  onAction: (action: string) => void;
  onView: () => void;
  isLargeScreen: boolean;
  loading: boolean;
}> = ({ anchorEl, onClose, onAction, onView, isLargeScreen, loading }) => (
  <Menu
    id="followup-menu"
    anchorEl={anchorEl}
    keepMounted
    open={Boolean(anchorEl)}
    onClose={onClose}
    anchorOrigin={{ vertical: "top", horizontal: "right" }}
    transformOrigin={{ vertical: "top", horizontal: "right" }}
    PaperProps={{
      sx: { "& .MuiMenuItem-root": { fontSize: isLargeScreen ? "0.875rem" : undefined } },
    }}
  >
    <MenuItem onClick={onView} disabled={loading}>
      <PersonOutline style={{ marginRight: 8, fontSize: "1rem" }} />
      Profile
    </MenuItem>
    <MenuItem onClick={() => onAction("delete")} disabled={loading}>
      <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
      Delete
    </MenuItem>
  </Menu>
);

const ConfirmationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: string | null;
  followUpName: string | undefined;
  isLargeScreen: boolean;
  loading: boolean;
}> = ({ open, onClose, onConfirm, followUpName, isLargeScreen, loading }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs">
    <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
      Delete Newcomer
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
        Are you sure you want to delete {followUpName}?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }} disabled={loading}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
        color="error"
        variant="contained"
        disabled={loading}
      >
        {loading ? "Processing..." : "Delete"}
      </Button>
    </DialogActions>
  </Dialog>
);

// Main Component
const ViewFollowUp: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // State management
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUp | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  // Fetch follow-up data
  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get("/member/get-follow-up");
      setFollowUps(response.data.results || []);
    } catch (error) {
      console.error("Failed to fetch Newcomers:", error);
      setError("Failed to load Newcomers. Please try again later.");
      toast.error("Failed to load Newcomers", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  // Initial data fetch
  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Handle Excel export
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await Api.get("/member/export-followup", {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = "newcomers_export.xlsx";
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
      console.error("Failed to export Newcomers:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to export Excel file. Please try again.";
      toast.error(errorMessage, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Action handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, followUp: FollowUp) => {
    setAnchorEl(event.currentTarget);
    setCurrentFollowUp(followUp);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const showConfirmation = useCallback(
    (action: string) => {
      setActionType(action);
      setConfirmModalOpen(true);
      handleMenuClose();
    },
    [handleMenuClose]
  );

  const handleConfirmedAction = useCallback(async () => {
    if (!currentFollowUp || !actionType) return;

    try {
      setLoading(true);
      if (actionType === "delete") {
        await Api.delete(`/member/delete-followup/${currentFollowUp.id}`);
        setFollowUps(followUps.filter((followUp) => followUp.id !== currentFollowUp.id));
        toast.success("Newcomer deleted successfully!", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${actionType} Newcomer`, {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
      setConfirmModalOpen(false);
      setActionType(null);
      setCurrentFollowUp(null);
    }
  }, [currentFollowUp, actionType, followUps, isMobile]);

  // Pagination handlers
  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Navigation handlers
  const handleAddFollowUp = useCallback(() => {
    navigate("/register/followup");
  }, [navigate]);

  const handleViewFollowUp = useCallback(() => {
    if (currentFollowUp) {
      navigate(`/view/single-follower/${currentFollowUp.id}`);
      handleMenuClose();
    }
  }, [currentFollowUp, navigate, handleMenuClose]);

  // Paginated data
  const paginatedFollowUps = useMemo(() => {
    return followUps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [followUps, page, rowsPerPage]);

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
              sx={{ color: theme.palette.text.primary, fontSize: isLargeScreen ? "1.5rem" : undefined }}
            >
              All Newcomers
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
            >
              View and manage all Newcomer records.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center" }}
          >
            <Button
              variant="contained"
              onClick={handleAddFollowUp}
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
              Add Newcomer
            </Button>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && followUps.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
          </Box>
        )}

        {/* Error or Empty State */}
        {!loading && (error || followUps.length === 0) && (
          <EmptyState error={error} onAddFollowUp={handleAddFollowUp} isLargeScreen={isLargeScreen} />
        )}

        {/* Data Table */}
        {followUps.length > 0 && (
          <TableContainer sx={{ boxShadow: 2, borderRadius: 1, overflowX: "auto" }}>
            <Table sx={{ minWidth: { xs: "auto", sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: TABLE_COLUMN_WIDTHS.name,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: TABLE_COLUMN_WIDTHS.phoneNo,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    }}
                  >
                    Phone Number
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: TABLE_COLUMN_WIDTHS.address,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    }}
                  >
                    Address
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: TABLE_COLUMN_WIDTHS.sex,
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    }}
                  >
                    Gender
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: TABLE_COLUMN_WIDTHS.actions,
                      textAlign: "center",
                      fontSize: isLargeScreen ? "0.875rem" : undefined,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedFollowUps.map((followUp) => (
                  <FollowUpRow
                    key={followUp.id}
                    followUp={followUp}
                    onMenuOpen={handleMenuOpen}
                    isLargeScreen={isLargeScreen}
                    loading={loading}
                  />
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              component="div"
              count={followUps.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: "1px solid #e0e0e0",
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
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
              <Tooltip title="Export Newcomers data to Excel sheet" placement="top" arrow>
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
        )}

        {/* Action Menu */}
        <ActionMenu
          anchorEl={anchorEl}
          currentFollowUp={currentFollowUp}
          onClose={handleMenuClose}
          onAction={showConfirmation}
          onView={handleViewFollowUp}
          isLargeScreen={isLargeScreen}
          loading={loading}
          />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirmedAction}
          actionType={actionType}
          followUpName={currentFollowUp?.name}
          isLargeScreen={isLargeScreen}
          loading={loading}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewFollowUp;