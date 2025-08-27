import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
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
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Grid,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  TextField,
  Select as MuiSelect,
  Divider,
} from '@mui/material';
import { MoreVert as MoreVertIcon, SentimentVeryDissatisfied as EmptyIcon, PersonOutline, ChevronRight, ChevronLeft, Search, AttachFile } from '@mui/icons-material';
import { LiaLongArrowAltRightSolid } from 'react-icons/lia';
import { AiOutlineDelete } from 'react-icons/ai';
import { PiDownloadThin } from 'react-icons/pi';
import { toast, ToastContainer } from 'react-toastify';
import { IoMdClose } from 'react-icons/io';
import Select from '@mui/material/Select';
import DashboardManager from '../../../shared/dashboardManager';
import Api from '../../../shared/api/api';
import { RootState } from '../../../reduxstore/redux';
import RegistrationModal from './followUp';
import { MdOutlineFileUpload } from 'react-icons/md';

// Types
interface FollowUp {
  id: string;
  name: string;
  sex: string;
  phoneNo: string;
  address: string;
  timer: number;
  birthMonth: string;
  birthDay: string;
  maritalStatus: string;
  isActive: boolean;
  isDeleted: boolean;
}

interface TableColumnWidths {
  snumber: string;
  name: string;
  contact: string;
  address: string;
  actions: string;
}

// Constants
const TABLE_COLUMN_WIDTHS: TableColumnWidths = {
  snumber: '3%',
  name: '25%',
  contact: '15%',
  address: '25%',
  actions: '17%',
};

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

// Components
interface EmptyStateProps {
  error: string | null;
  onAddFollowUp: () => void;
  isLargeScreen: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ error, onAddFollowUp, isLargeScreen }) => (
  <Box sx={{ textAlign: 'center', py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <EmptyIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
    <Typography variant="h6" color="#F6F4FE" sx={{ fontSize: isLargeScreen ? '1.25rem' : undefined }}>
      No Newcomers found
    </Typography>
    {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
    <Button
      variant="contained"
      onClick={onAddFollowUp}
      sx={{
        backgroundColor: '#363740',
        px: { xs: 2, sm: 2 },
        mt: 2,
        borderRadius: 50,
        py: 1,
        fontSize: isLargeScreen ? '0.875rem' : undefined,
        color: 'var(--color-text-on-primary)',
        '&:hover': { backgroundColor: '#363740', opacity: 0.9 },
      }}
    >
      Add Newcomer
    </Button>
  </Box>
);

interface FollowUpRowProps {
  followUp: FollowUp;
  index: number;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, followUp: FollowUp) => void;
  isLargeScreen: boolean;
  loading: boolean;
}

const FollowUpRow: React.FC<FollowUpRowProps> = React.memo(({ followUp, index, onMenuOpen, isLargeScreen, loading }) => (
  <TableRow
    sx={{
      backgroundColor: followUp.isDeleted ? 'rgba(0, 0, 0, 0.04)' : '#4d4d4e8e',
      '&:hover': {
        backgroundColor: '#4d4d4e8e',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      },
      transition: 'all 0.2s ease',
      mb: 1,
    }}
  >
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.snumber, fontSize: isLargeScreen ? '0.875rem' : undefined, color: followUp.isDeleted ? 'gray' : '#F6F4FE', textDecoration: followUp.isDeleted ? 'line-through' : 'none' }}>
      {(index + 1).toString().padStart(2, '0')}
    </TableCell>
    <TableCell sx={{ color: followUp.isDeleted ? 'gray' : '#F6F4FE', display: 'flex', alignItems: 'center', gap: 1, fontSize: isLargeScreen ? '0.875rem' : undefined, py: 2 }}>
      <Box className="py-2 px-3 rounded-full bg-[#F6F4FE] text-[#160F38] font-bold text-lg mr-2">
        {followUp.name.split(' ').map((name) => name.charAt(0)).join('')}
      </Box>
      <Box>
        {followUp.name}
        <Typography component="span" sx={{ display: 'block', fontSize: '13px', color: '#777280' }}>
          {followUp.sex || '-'}
        </Typography>
      </Box>
    </TableCell>
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.contact, fontSize: isLargeScreen ? '0.875rem' : undefined, color: followUp.isDeleted ? 'gray' : '#F6F4FE', textDecoration: followUp.isDeleted ? 'line-through' : 'none' }}>
      {followUp.phoneNo || 'N/A'}
    </TableCell>
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.address, fontSize: isLargeScreen ? '0.875rem' : undefined, color: followUp.isDeleted ? 'gray' : '#F6F4FE', textDecoration: followUp.isDeleted ? 'line-through' : 'none' }}>
      {followUp.address || 'N/A'}
    </TableCell>
    <TableCell sx={{ width: TABLE_COLUMN_WIDTHS.actions, textAlign: 'center', fontSize: isLargeScreen ? '0.875rem' : undefined }}>
      <IconButton
        onClick={(e) => onMenuOpen(e, followUp)}
        disabled={loading || followUp.isDeleted}
        sx={{ borderRadius: 1, backgroundColor: '#e1e1e1', '&:hover': { backgroundColor: 'var(--color-primary)', opacity: 0.9, color: '#ffffff' } }}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </TableCell>
  </TableRow>
));

interface ActionMenuProps {
  anchorEl: HTMLElement | null;
  currentFollowUp: FollowUp | null;
  onClose: () => void;
  onAction: (action: string) => void;
  onView: () => void;
  isLargeScreen: boolean;
  loading: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ anchorEl, onClose, onAction, onView, isLargeScreen, loading }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    PaperProps={{ sx: { '& .MuiMenuItem-root': { fontSize: isLargeScreen ? '0.875rem' : undefined } } }}
  >
    <MenuItem onClick={onView} disabled={loading}>
      <PersonOutline sx={{ mr: 1, fontSize: '1rem' }} />
      Profile
    </MenuItem>
    <MenuItem onClick={() => onAction('delete')} disabled={loading}>
      <AiOutlineDelete style={{ marginRight: '8px', fontSize: '1rem' }} />
      Delete
    </MenuItem>
  </Menu>
);

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: string | null;
  followUpName: string | undefined;
  isLargeScreen: boolean;
  loading: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ open, onClose, onConfirm, followUpName, isLargeScreen, loading }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs">
    <DialogTitle sx={{ fontSize: isLargeScreen ? '1.25rem' : undefined }}>
      Delete Newcomer
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}>
        Are you sure you want to delete {followUpName}?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }} disabled={loading}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        disabled={loading}
        sx={{ fontSize: isLargeScreen ? '0.875rem' : undefined }}
      >
        {loading ? 'Processing...' : 'Delete'}
      </Button>
    </DialogActions>
  </Dialog>
);

// Main Component
const ViewFollowUp: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const authData = useSelector((state: RootState) => state.auth?.authData);

  // State
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openExcelDialog, setOpenExcelDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<{
    isDrawerOpen: boolean;
    searchName: string;
    searchType: string;
    searchAddress: string;
    isNameDropdownOpen: boolean;
    filteredNames: FollowUp[];
    types: { id: string; name: string }[];
    members: FollowUp[];
    isSearching: boolean;
  }>({
    isDrawerOpen: false,
    searchName: '',
    searchType: '',
    searchAddress: '',
    isNameDropdownOpen: false,
    filteredNames: [],
    types: [],
    members: [],
    isSearching: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data fetching
  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await Api.get('/member/get-follow-up');
      setFollowUps(response.data.results || []);
      setState((prev:any) => ({
        ...prev,
        members: response.data.results || [],
        filteredNames: response.data.results || [],
        types: [...new Set((response.data.results || []).map((m: FollowUp) => m.phoneNo))].map((type, index) => ({
          id: index.toString(),
          name: type,
        })),
      }));
    } catch (error) {
      console.error('Failed to fetch Newcomers:', error);
      setError('Failed to load Newcomers. Please try again later.');
      toast.error('Failed to load Newcomers', {
        autoClose: 3000,
        position: isMobile ? 'top-center' : 'top-right',
      });
    } finally {
      setLoading(false);
    }
  }, [isMobile]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Export to Excel
  const handleExportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      const response = await Api.get('/member/export-followup', { responseType: 'blob' });
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'newcomers_export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel file exported successfully!', {
        autoClose: 3000,
        position: isMobile ? 'top-center' : 'top-right',
      });
    } catch (error: any) {
      console.error('Failed to export Newcomers:', error);
      toast.error(error.response?.data?.message || 'Failed to export Excel file. Please try again.', {
        autoClose: 3000,
        position: isMobile ? 'top-center' : 'top-right',
      });
    } finally {
      setExportLoading(false);
    }
  }, [isMobile]);

  // Action handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, followUp: FollowUp) => {
    setAnchorEl(event.currentTarget);
    setCurrentFollowUp(followUp);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const showConfirmation = useCallback((action: string) => {
    setActionType(action);
    setConfirmModalOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleConfirmedAction = useCallback(async () => {
    if (!currentFollowUp || !actionType) return;

    try {
      setLoading(true);
      if (actionType === 'delete') {
        await Api.delete(`/followUp/delete-followup/${currentFollowUp.id}`);
        setFollowUps(followUps.filter((followUp) => followUp.id !== currentFollowUp.id));
        toast.success('Newcomer deleted successfully!', {
          autoClose: 3000,
          position: isMobile ? 'top-center' : 'top-right',
        });
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error(`Failed to ${actionType} Newcomer`, {
        autoClose: 3000,
        position: isMobile ? 'top-center' : 'top-right',
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

  // Modal handler
  const handleAddFollowUp = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleViewFollowUp = useCallback(() => {
    if (currentFollowUp) {
      window.location.href = `/view/single-follower/${currentFollowUp.id}`;
      handleMenuClose();
    }
  }, [currentFollowUp, handleMenuClose]);

  // Paginated data
  const paginatedFollowUps = useMemo(() => {
    return followUps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [followUps, page, rowsPerPage]);

  const handleImportExcel = () => {
    setOpenExcelDialog(true);
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
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(
        `/member/import-followup?churchId=${authData?.churchId}${branchIdParam}`,
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Excel file uploaded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });

      setOpenExcelDialog(false);
      setSelectedFile(null);
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

  const handleCloseExcelDialog = () => {
    setOpenExcelDialog(false);
    setSelectedFile(null);
    setIsDragging(false);
  };

  const handleStateChange = useCallback((key: string, value: any) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'searchName' && {
        filteredNames: value
          ? prev.members.filter((member) =>
              member.name.toLowerCase().includes(value.toLowerCase())
            )
          : prev.members,
      }),
    }));
  }, []);

  const searchMembers = useCallback(async () => {
    setState((prev) => ({ ...prev, isSearching: true }));
    try {
      const response = await Api.get('/member/get-follow-up', {
        params: {
          name: state.searchName,
          type: state.searchType,
          address: state.searchAddress,
        },
      });
      setFollowUps(response.data.results || []);
      setState((prev) => ({
        ...prev,
        members: response.data.results || [],
        filteredNames: state.searchName
          ? (response.data.results || []).filter((member: FollowUp) =>
              member.name.toLowerCase().includes(state.searchName.toLowerCase())
            )
          : response.data.results || [],
      }));
    } catch (error) {
      console.error('Failed to search Newcomers:', error);
      toast.error('Failed to search Newcomers', {
        autoClose: 3000,
        position: isMobile ? 'top-center' : 'top-right',
      });
    } finally {
      setState((prev) => ({ ...prev, isSearching: false }));
    }
  }, [state.searchName, state.searchType, state.searchAddress, isMobile]);

  // Filter components
  const renderMobileFilters = () => (
    <Drawer
      anchor="top"
      open={state.isDrawerOpen}
      onClose={() => setState((prev) => ({ ...prev, isDrawerOpen: false }))}
      sx={{
        "& .MuiDrawer-paper": {
          backgroundColor: "#2C2C2C",
          color: "#F6F4FE",
          padding: 2,
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton
          onClick={() => setState((prev) => ({ ...prev, isDrawerOpen: false }))}
          sx={{ color: "#F6F4FE" }}
        >
          <IoMdClose />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", px: 2, pb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}>
            Who?
          </Typography>
          <TextField
            value={state.searchName}
            onChange={(e) => handleStateChange("searchName", e.target.value)}
            placeholder="Search by name"
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              "& .MuiInputLabel-root": { color: "#F6F4FE" },
              "& .MuiOutlinedInput-root": {
                color: "#F6F4FE",
                "& fieldset": { borderColor: "transparent" },
              },
            }}
            onFocus={() => state.searchName && handleStateChange("isNameDropdownOpen", true)}
            onBlur={() => setTimeout(() => handleStateChange("isNameDropdownOpen", false), 200)}
          />
          {state.isNameDropdownOpen && state.filteredNames.length > 0 && (
            <Box
              sx={{
                maxHeight: "200px",
                overflowY: "auto",
                backgroundColor: "#2C2C2C",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                mt: 1,
              }}
            >
              {state.filteredNames.map((member, index) => (
                <Box
                  key={member.id}
                  sx={{
                    padding: "8px 16px",
                    color: "#F6F4FE",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#4d4d4e8e" },
                    borderBottom:
                      index < state.filteredNames.length - 1 ? "1px solid #777280" : "none",
                  }}
                  onClick={() => {
                    handleStateChange("searchName", member.name);
                    handleStateChange("isNameDropdownOpen", false);
                  }}
                >
                  {member.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}>
            Type
          </Typography>
          <Select
            value={state.searchType}
            onChange={(e) => handleStateChange("searchType", e.target.value as string)}
            displayEmpty
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: state.searchType ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Type";
              const type = state.types.find((d) => d.id === selected);
              return type ? type.name : "Select Type";
            }}
          >
            <MenuItem value="">All</MenuItem>
            {state.types.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", mb: 1 }}>
            Address
          </Typography>
          <Select
            value={state.searchAddress}
            onChange={(e) => handleStateChange("searchAddress", e.target.value as string)}
            displayEmpty
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: state.searchAddress ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => (selected ? selected : "Select Address")}
          >
            <MenuItem value="">All</MenuItem>
            {[...new Set(state.members.map((m) => m.address))].map((address) => (
              <MenuItem key={address} value={address}>
                {address}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            onClick={searchMembers}
            sx={{
              backgroundColor: "#F6F4FE",
              color: "#4d4d4e8e",
              borderRadius: "24px",
              py: 1,
              px: 3,
              minWidth: "auto",
              "&:hover": { backgroundColor: "#F6F4FE", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },
            }}
            startIcon={<Search />}
            disabled={state.isSearching}
          >
            {state.isSearching ? <CircularProgress size={20} color="inherit" /> : "Search"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );

  const renderDesktopFilters = () => (
    <Box sx={{ display: "flex", width: "100%", mb: 3}}>
      <Box
        sx={{
          border: "1px solid #4d4d4e8e",
          borderRadius: "32px",
          display: "flex",
          alignItems: "center",
          backgroundColor: "#4d4d4e8e",
          padding: "4px",
          width: "100%",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "200px", padding: "4px 16px", position: "relative" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Who?
          </Typography>
          <TextField
            value={state.searchName}
            onChange={(e) => handleStateChange("searchName", e.target.value)}
            placeholder="Search by name"
            variant="standard"
            sx={{
              "& .MuiInputBase-input": {
                color: state.searchName ? "#F6F4FE" : "#777280",
                fontWeight: 500,
                fontSize: "14px",
                padding: "4px 8px",
              },
              "& .MuiInput-underline:before": { borderBottom: "none" },
              "& .MuiInput-underline:after": { borderBottom: "none" },
              "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
            }}
            onFocus={() => state.searchName && handleStateChange("isNameDropdownOpen", true)}
            onBlur={() => setTimeout(() => handleStateChange("isNameDropdownOpen", false), 200)}
          />
          {state.isNameDropdownOpen && state.filteredNames.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                maxHeight: "200px",
                overflowY: "auto",
                backgroundColor: "#2C2C2C",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                zIndex: 1300,
                mt: 1,
              }}
            >
              {state.filteredNames.map((member, index) => (
                <Box
                  key={member.id}
                  sx={{
                    padding: "8px 16px",
                    color: "#F6F4FE",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#4d4d4e8e" },
                    borderBottom:
                      index < state.filteredNames.length - 1 ? "1px solid #777280" : "none",
                  }}
                  onClick={() => {
                    handleStateChange("searchName", member.name);
                    handleStateChange("isNameDropdownOpen", false);
                  }}
                >
                  {member.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Type
          </Typography>
          <Select
            value={state.searchType}
            onChange={(e) => handleStateChange("searchType", e.target.value as string)}
            displayEmpty
            sx={{
              color: "#F6F4FE",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Type";
              const type = state.types.find((d) => d.id === selected);
              return type ? type.name : "Select Type";
            }}
          >
            <MenuItem value="">All</MenuItem>
            {state.types.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Address
          </Typography>
          <MuiSelect
            value={state.searchAddress}
            onChange={(e: any) => handleStateChange("searchAddress", e.target.value as string)}
            displayEmpty
            sx={{
              color: state.searchAddress ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => (selected ? selected : "Select Address")}
          >
            <MenuItem value="">All</MenuItem>
            {[...new Set(state.members.map((m) => m.address))].map((address) => (
              <MenuItem key={address} value={address}>
                {address}
              </MenuItem>
            ))}
          </MuiSelect>
        </Box>
        <Box>
          <Button
            onClick={searchMembers}
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
            disabled={state.isSearching}
          >
            {state.isSearching ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Search sx={{ fontSize: "20px" }} />
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <DashboardManager>
      <ToastContainer />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: '100%' }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant={isMobile ? 'h5' : 'h5'}
              component="h4"
              sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.primary, fontSize: isLargeScreen ? '1.1rem' : undefined }}
            >
              <span className="text-[#777280]">Members</span>
              <LiaLongArrowAltRightSolid className="text-[#F6F4FE]" />
              <span className="text-[#F6F4FE]">Newcomers</span>
            </Typography>
            {isMobile ? (
              <Box sx={{ display: "flex", width: "100%", mt: 2 }}>
                <Box
                  sx={{
                    border: "1px solid #4d4d4e8e",
                    borderRadius: "32px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#4d4d4e8e",
                    padding: "4px",
                    width: "100%",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                    "&:hover": { boxShadow: "0 2px 4px rgba(0,0,0,0.12)" },
                  }}
                >
                  <Box sx={{ flex: 1, padding: "4px 8px" }}>
                    <TextField
                      value={state.searchName}
                      onChange={(e) => handleStateChange("searchName", e.target.value)}
                      placeholder="Search by name"
                      variant="standard"
                      sx={{
                        "& .MuiInputBase-input": {
                          color: state.searchName ? "#F6F4FE" : "#777280",
                          fontSize: "14px",
                          padding: "4px 8px",
                        },
                        "& .MuiInput-underline:before": { borderBottom: "none" },
                        "& .MuiInput-underline:after": { borderBottom: "none" },
                        "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                          borderBottom: "none",
                        },
                      }}
                      onFocus={() => state.searchName && handleStateChange("isNameDropdownOpen", true)}
                      onBlur={() => setTimeout(() => handleStateChange("isNameDropdownOpen", false), 200)}
                    />
                    {state.isNameDropdownOpen && state.filteredNames.length > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: "200px",
                          overflowY: "auto",
                          backgroundColor: "#2C2C2C",
                          borderRadius: "8px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          zIndex: 1300,
                          mt: 1,
                        }}
                      >
                        {state.filteredNames.map((member, index) => (
                          <Box
                            key={member.id}
                            sx={{
                              padding: "8px 16px",
                              color: "#F6F4FE",
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "#4d4d4e8e" },
                              borderBottom:
                                index < state.filteredNames.length - 1 ? "1px solid #777280" : "none",
                            }}
                            onClick={() => {
                              handleStateChange("searchName", member.name);
                              handleStateChange("isNameDropdownOpen", false);
                            }}
                          >
                            {member.name}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
                  <IconButton
                    onClick={() => setState((prev) => ({ ...prev, isDrawerOpen: true }))}
                    sx={{ color: "#777280", "&:hover": { color: "#F6F4FE" } }}
                  >
                    <AttachFile sx={{ color: "#F6F4FE", fontSize: "20px" }} />
                  </IconButton>
                  <Box sx={{ pr: "8px" }}>
                    <Button
                      onClick={searchMembers}
                      sx={{
                        backgroundColor: "transparent",
                        border: "1px solid #777280",
                        color: "white",
                        borderRadius: "50%",
                        minWidth: "48px",
                        height: "48px",
                        padding: 0,
                        "&:hover": { backgroundColor: "transparent" },
                      }}
                      disabled={state.isSearching}
                    >
                      {state.isSearching ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Search sx={{ fontSize: "20px" }} />
                      )}
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              renderDesktopFilters()
            )}
            {isMobile && renderMobileFilters()}
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              mt: { xs: 2, md: 0 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
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
                Upload Newcomers <MdOutlineFileUpload className="ml-1" />
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
                Add Newcomer +
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && followUps.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: '#777280' }} />
          </Box>
        )}

        {/* Empty/Error State */}
        {!loading && (error || followUps.length === 0) && (
          <EmptyState error={error} onAddFollowUp={handleAddFollowUp} isLargeScreen={isLargeScreen} />
        )}

        {/* Table */}
        {followUps.length > 0 && (
          <>
            <TableContainer sx={{ boxShadow: 2, borderRadius: 1, overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 'auto', sm: 650 }, '& td, & th': { border: 'none' } }}>
                <TableHead>
                  <TableRow>
                    {(['snumber', 'name', 'contact', 'address', 'actions'] as const).map((key) => (
                      <TableCell
                        key={key}
                        sx={{
                          fontWeight: 600,
                          width: TABLE_COLUMN_WIDTHS[key],
                          fontSize: isLargeScreen ? '0.875rem' : undefined,
                          color: '#777280',
                          textAlign: key === 'actions' ? 'center' : 'left',
                          ...(key === 'address' && {
                            maxWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }),
                        }}
                      >
                        {key === 'address' ? (
                          <Tooltip
                            title={(key.charAt(0).toUpperCase() + key.slice(1)).length > 30 ? key.charAt(0).toUpperCase() + key.slice(1) : ''}
                            placement="top"
                            arrow
                          >
                            <span>
                              {(key.charAt(0).toUpperCase() + key.slice(1)).length > 30
                                ? `${(key.charAt(0).toUpperCase() + key.slice(1)).slice(0, 30)}...`
                                : key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          </Tooltip>
                        ) : key === 'snumber' ? (
                          '#'
                        ) : (
                          key.charAt(0).toUpperCase() + key.slice(1)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedFollowUps.map((followUp, index) => (
                    <FollowUpRow
                      key={followUp.id}
                      followUp={followUp}
                      index={page * rowsPerPage + index}
                      onMenuOpen={handleMenuOpen}
                      isLargeScreen={isLargeScreen}
                      loading={loading}
                    />
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                count={followUps.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                isLargeScreen={isLargeScreen}
              />
            </TableContainer>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="Download Newcomers Data" placement="top" arrow>
                <Button
                  onClick={handleExportExcel}
                  disabled={exportLoading}
                  size="medium"
                  sx={{
                    backgroundColor: '#363740',
                    px: { xs: 2, sm: 2 },
                    py: 1,
                    borderRadius: 1,
                    fontWeight: 500,
                    textTransform: 'none',
                    color: 'var(--color-text-on-primary)',
                    fontSize: isLargeScreen ? '1rem' : undefined,
                    '&:hover': { backgroundColor: '#363740', opacity: 0.9 },
                  }}
                >
                  {exportLoading ? (
                    <span className='text-gray-500'>
                      <CircularProgress size={18} sx={{ color: 'var(--color-text-on-primary)', mr: 1 }} />
                      Downloading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">Download Newcomers <PiDownloadThin /></span>
                  )}
                </Button>
              </Tooltip>
            </Box>
          </>
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

        {/* Registration Modal */}
        <RegistrationModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchFollowUps();
            setIsModalOpen(false);
          }}
        />
      </Box>
      {/* Excel Import Dialog */}
      <Dialog open={openExcelDialog} onClose={handleCloseExcelDialog} maxWidth="sm" fullWidth>
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
                "&:hover": {
                  backgroundColor: "#777280",
                  opacity: 0.9,
                },
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
          <Button onClick={handleCloseExcelDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={isLoading || !selectedFile}
            sx={{
              backgroundColor: "#777280",
              color: "var(--color-text-on-primary)",
              "&:hover": {
                backgroundColor: "#777280",
                opacity: 0.9,
              },
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
    </DashboardManager>
  );
};

export default ViewFollowUp;