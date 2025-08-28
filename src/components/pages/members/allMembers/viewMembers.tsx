import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../../shared/dashboardManager";
import { RootState } from "../../../reduxstore/redux";
import { useSelector } from "react-redux";
import MemberModal from "../../members/allMembers/members";
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
  Menu,
  useTheme,
  useMediaQuery,
  Grid,
  Tooltip,
  CircularProgress,
  TextField,
  Drawer,
  Divider,
  Select as MuiSelect,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  AttachFile,
  PersonOutline,
  SentimentVeryDissatisfied as EmptyIcon,
} from "@mui/icons-material";
import { MdOutlineFileUpload, MdRefresh } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { IoMdClose } from "react-icons/io";
import { PiDownloadThin } from "react-icons/pi";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";
import Api from "../../../shared/api/api";
import { toast, ToastContainer } from "react-toastify";

// Type Definitions
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

interface Department {
  id: string;
  name: string;
}

interface Pagination {
  hasNextPage: boolean;
  nextPage: string | null;
}

interface FetchMembersResponse {
  success: boolean;
  pagination: Pagination;
  data: Member[];
}

interface CustomPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (direction: "next" | "prev") => void;
  currentPage: number;
  isLargeScreen: boolean;
  isLoading: boolean;
}

// Custom Pagination Component
const CustomPagination: React.FC<CustomPaginationProps> = ({
  hasNextPage,
  hasPrevPage,
  onPageChange,
  currentPage,
  isLargeScreen,
  isLoading,
}) => (
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
    <Typography sx={{ fontSize: isLargeScreen ? "0.75rem" : "0.875rem", color: "#777280" }}>
      Page {currentPage}
    </Typography>
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        onClick={() => onPageChange("prev")}
        disabled={!hasPrevPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: !hasPrevPage || isLoading ? "#4d4d4e8e" : "#F6F4FE",
          color: !hasPrevPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      <Button
        onClick={() => onPageChange("next")}
        disabled={!hasNextPage || isLoading}
        sx={{
          minWidth: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: !hasNextPage || isLoading ? "#4d4d4e8e" : "#F6F4FE",
          color: !hasNextPage || isLoading ? "#777280" : "#160F38",
          "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          "&:disabled": { backgroundColor: "#4d4d4e8e", color: "#777280" },
        }}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </Box>
  </Box>
);

const ViewMembers: React.FC = () => {
  // Hooks
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authData = useSelector((state: RootState) => state.auth?.authData);

  // State
  const [state, setState] = useState({
    members: [] as Member[],
    filteredMembers: [] as Member[],
    filteredNames: [] as Member[],
    departments: [] as Department[],
    pagination: { hasNextPage: false, nextPage: null } as Pagination,
    pageHistory: [] as string[],
    currentPage: 1,
    page: 0,
    searchName: "",
    searchDepartment: "" as string,
    searchAddress: "" as string,
    loading: true,
    exportLoading: false,
    isLoading: false,
    isSearching: false,
    error: null as string | null,
    confirmModalOpen: false,
    isModalOpen: false,
    isDrawerOpen: false,
    isNameDropdownOpen: false,
    openDialog: false,
    selectedFile: null as File | null,
    isDragging: false,
    currentMember: null as Member | null,
    actionType: null as string | null,
    anchorEl: null as HTMLElement | null,
  });

  // State Handlers
  const handleStateChange = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      setState((prev) => {
        const newState = { ...prev, [key]: value };
        if (key === "searchName") {
          const searchTerm = (value as string).toLowerCase();
          newState.filteredNames = prev.members.filter((member) =>
            member.name.toLowerCase().includes(searchTerm)
          );
          newState.isNameDropdownOpen = !!searchTerm && newState.filteredNames.length > 0;
        }
        return newState;
      });
    },
    []
  );

    // Data Fetching Handlers
  const fetchMembers = useCallback(async (url: string | null = "/member/all-members") => {
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      const apiUrl = url || "/member/all-members";
      const response = await Api.get<FetchMembersResponse>(apiUrl);
      
      const data = {
        members: response.data.data || [],
        pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
      };

      setState((prev) => ({
        ...prev,
        members: data.members,
        filteredMembers: data.members,
        filteredNames: data.members,
        pagination: data.pagination,
        loading: false,
      }));

      return data; // Return the data for use in refreshMembers
    } catch (error) {
      console.error("Failed to fetch members:", error);
      handleStateChange("error", "Failed to load members. Please try again later.");
      handleStateChange("loading", false);
      toast.error("Failed to load members");
      return { members: [], pagination: { hasNextPage: false, nextPage: null } }; // Return default values on error
    }
  }, [handleStateChange]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await Api.get("/church/get-departments");
      handleStateChange("departments", response.data.departments || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    }
  }, [handleStateChange]);

  const refreshMembers = useCallback(async () => {
    try {
      const data = await fetchMembers();
      setState((prev) => ({
        ...prev,
        members: data.members,
        filteredMembers: data.members,
        pagination: data.pagination,
        currentPage: 1,
        pageHistory: [],
        loading: false,
      }));
    } catch (error) {
      handleStateChange("loading", false);
    }
  }, [fetchMembers, handleStateChange]);

  // Search Handlers
  const searchMembers = useCallback(async () => {
    handleStateChange("isSearching", true);
    handleStateChange("currentPage", 1);
    handleStateChange("pageHistory", []);
    
    try {
      const params = new URLSearchParams();
      if (state.searchName) params.append("name", state.searchName);
      if (state.searchDepartment) params.append("departmentId", state.searchDepartment);
      if (state.searchAddress) params.append("address", state.searchAddress);

      const response = await Api.get<FetchMembersResponse>(`/member/search?${params.toString()}`);
      
      setState((prev) => ({
        ...prev,
        filteredMembers: response.data.data || [],
        pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
        page: 0,
        isDrawerOpen: false,
        isSearching: false,
      }));
      
      toast.success("Search completed successfully!", {
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error) {
      console.error("Error searching members:", error);
      toast.warn("Server search failed, applying local filter", {
        position: isMobile ? "top-center" : "top-right",
      });

      let filtered = [...state.members];
      if (state.searchName) {
        filtered = filtered.filter((member) =>
          member.name.toLowerCase().includes(state.searchName.toLowerCase())
        );
      }
      if (state.searchDepartment) {
        filtered = filtered.filter((member) =>
          state.departments.some(
            (dept) =>
              dept.id === state.searchDepartment &&
              member.name.toLowerCase().includes(dept.name.toLowerCase())
          )
        );
      }
      if (state.searchAddress) {
        filtered = filtered.filter((member) =>
          member.address.toLowerCase().includes(state.searchAddress.toLowerCase())
        );
      }
      
      setState((prev) => ({
        ...prev,
        filteredMembers: filtered,
        pagination: { hasNextPage: false, nextPage: null },
        currentPage: 1,
        pageHistory: [],
        isDrawerOpen: false,
        isSearching: false,
      }));
    }
  }, [state.members, state.searchName, state.searchDepartment, state.searchAddress, state.departments, isMobile, handleStateChange]);

  const searchMembersWithPagination = useCallback(
    async (url: string, searchName: string, searchDepartment: string, searchAddress: string) => {
      try {
        const params = new URLSearchParams();
        if (searchName) params.append("name", searchName);
        if (searchDepartment) params.append("departmentId", searchDepartment);
        if (searchAddress) params.append("address", searchAddress);

        const fullUrl = url.includes("?") ? `${url}&${params.toString()}` : `${url}?${params.toString()}`;
        const response = await Api.get<FetchMembersResponse>(fullUrl);
        
        return {
          members: response.data.data || [],
          pagination: response.data.pagination || { hasNextPage: false, nextPage: null },
        };
      } catch (error) {
        console.error("Error searching members with pagination:", error);
        throw error;
      }
    },
    []
  );

  // Pagination Handlers
  const handlePageChange = useCallback(
    async (direction: "next" | "prev") => {
      handleStateChange("loading", true);
      handleStateChange("error", null);
      try {
        const url =
          direction === "next"
            ? state.pagination.nextPage
            : state.pageHistory.length > 0
            ? state.pageHistory[state.pageHistory.length - 2] || "/member/all-members"
            : null;
            
        if (!url) throw new Error(direction === "next" ? "No next page available" : "No previous page available");
        
        const data = state.searchName || state.searchDepartment || state.searchAddress
          ? await searchMembersWithPagination(url, state.searchName, state.searchDepartment, state.searchAddress)
          : await fetchMembers(url);
          
        setState((prev) => ({
          ...prev,
          filteredMembers: data.members,
          pagination: data.pagination,
          pageHistory: direction === "next" ? [...prev.pageHistory, url] : prev.pageHistory.slice(0, -1),
          currentPage: direction === "next" ? prev.currentPage + 1 : prev.currentPage - 1,
          loading: false,
        }));
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to load page";
        console.error(`Error fetching ${direction} page:`, error);
        handleStateChange("error", errorMessage);
        handleStateChange("loading", false);
        toast.error(errorMessage, { position: isMobile ? "top-center" : "top-right" });
      }
    },
    [
      state.pagination.nextPage,
      state.pageHistory,
      state.searchName,
      state.searchDepartment,
      state.searchAddress,
      fetchMembers,
      handleStateChange,
      isMobile,
    ]
  );

  // Action Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: Member) => {
    setState((prev) => ({ ...prev, anchorEl: event.currentTarget, currentMember: member }));
  };

  const handleMenuClose = () => setState((prev) => ({ ...prev, anchorEl: null }));

  const showConfirmation = (action: string) => {
    setState((prev) => ({ ...prev, actionType: action, confirmModalOpen: true }));
    handleMenuClose();
  };

  const handleConfirmedAction = async () => {
    if (!state.currentMember || !state.actionType) return;

    try {
      setState((prev) => ({ ...prev, loading: true }));
      if (state.actionType === "delete") {
        await Api.delete(`/member/delete-member/${state.currentMember.id}`);
        setState((prev) => ({
          ...prev,
          members: prev.members.filter((member) => member.id !== state.currentMember!.id),
          filteredMembers: prev.filteredMembers.filter(
            (member) => member.id !== state.currentMember!.id
          ),
        }));
        toast.success("Member deleted successfully!");
      } else if (state.actionType === "suspend") {
        await Api.patch(`/member/suspend-member/${state.currentMember.id}`);
        toast.success("Member suspended successfully!");
        fetchMembers();
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(`Failed to ${state.actionType} member`);
    } finally {
      setState((prev) => ({
        ...prev,
        loading: false,
        confirmModalOpen: false,
        actionType: null,
        currentMember: null,
      }));
    }
  };

  // File Import/Export Handlers
  const handleExportExcel = async () => {
    setState((prev) => ({ ...prev, exportLoading: true }));
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
      setState((prev) => ({ ...prev, exportLoading: false }));
    }
  };

  const handleImportExcel = () => {
    setState((prev) => ({ ...prev, openDialog: true }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setState((prev) => ({ ...prev, selectedFile: file }));
    } else {
      toast.error("Please select a valid Excel file (.xlsx or .xls)", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setState((prev) => ({ ...prev, selectedFile: null }));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, isDragging: false }));
    const file = event.dataTransfer.files?.[0];
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setState((prev) => ({ ...prev, selectedFile: file }));
    } else {
      toast.error("Please drop a valid Excel file (.xlsx or .xls)", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setState((prev) => ({ ...prev, selectedFile: null }));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, isDragging: true }));
  };

  const handleDragLeave = () => {
    setState((prev) => ({ ...prev, isDragging: false }));
  };

  const handleUpload = async () => {
    if (!state.selectedFile) {
      toast.error("Please select an Excel file to upload", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const formData = new FormData();
      formData.append("file", state.selectedFile);
      const branchIdParam = authData?.branchId ? `&branchId=${authData.branchId}` : "";
      await Api.post(`/member/import?churchId=${authData?.churchId}${branchIdParam}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Excel file uploaded successfully!", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
      setState((prev) => ({ ...prev, openDialog: false, selectedFile: null }));
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
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCloseDialog = () => {
    setState((prev) => ({ ...prev, openDialog: false, selectedFile: null, isDragging: false }));
  };

  // UI Components
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
      {state.error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {state.error}
        </Typography>
      ) : null}
      <Button
        variant="contained"
        onClick={() => setState((prev) => ({ ...prev, isModalOpen: true }))}
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
      <Box sx={{ display: "flex", flexDirection: "column", px: 2, pb: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
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
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Department
          </Typography>
          <MuiSelect
            value={state.searchDepartment}
            onChange={(e) => handleStateChange("searchDepartment", e.target.value as string)}
            displayEmpty
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "8px",
              color: state.searchDepartment ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Department";
              const dept = state.departments.find((d) => d.id === selected);
              return dept ? dept.name : "Select Department";
            }}
          >
            <MenuItem value="">All</MenuItem>
            {state.departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </MuiSelect>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Address
          </Typography>
          <MuiSelect
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
          </MuiSelect>
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
    <Box sx={{ display: "flex", width: "100%", mb: 3 }}>
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
            Department
          </Typography>
          <MuiSelect
            value={state.searchDepartment}
            onChange={(e) => handleStateChange("searchDepartment", e.target.value as string)}
            displayEmpty
            sx={{
              color: state.searchDepartment ? "#F6F4FE" : "#777280",
              fontWeight: 500,
              fontSize: "14px",
              ".MuiSelect-select": { padding: "4px 8px", pr: "24px !important" },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
              "& .MuiSelect-icon": { display: "none" },
            }}
            renderValue={(selected) => {
              if (!selected) return "Select Department";
              const dept = state.departments.find((d) => d.id === selected);
              return dept ? dept.name : "Select Department";
            }}
          >
            <MenuItem value="">None</MenuItem>
            {state.departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </MuiSelect>
        </Box>
        <Divider sx={{ height: 30, backgroundColor: "#F6F4FE" }} orientation="vertical" />
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: "160px", padding: "4px 8px" }}>
          <Typography variant="caption" sx={{ color: "#F6F4FE", fontWeight: 500, fontSize: "11px", ml: "8px" }}>
            Address
          </Typography>
          <MuiSelect
            value={state.searchAddress}
            onChange={(e) => handleStateChange("searchAddress", e.target.value as string)}
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
        <Box sx={{ ml: "auto", pr: "8px" }}>
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

  // Table column widths
  const columnWidths = {
    snumber: "3%",
    name: "25%",
    contact: "15%",
    address: "25%",
    whatsapp: "15%",
    actions: "17%",
  };

  // Effects
  useEffect(() => {
    fetchMembers();
    fetchDepartments();
  }, [fetchMembers, fetchDepartments]);

  // Main Render
  return (
    <DashboardManager>
      <ToastContainer />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 7 }}>
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
            <Box sx={{ mt: 2 }}>
              {isMobile ? (
                <>
                  <Box sx={{ display: "flex", width: "100%" }}>
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
                            "&:hover": { backgroundColor: "#E61E4D" },
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
                  {renderMobileFilters()}
                </>
              ) : (
                renderDesktopFilters()
              )}
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
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
                disabled={state.isLoading}
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
                  minWidth: "max-content",
                }}
              >
                Upload Workers <MdOutlineFileUpload className="ml-1" />
              </Button>
              <Button
                variant="contained"
                onClick={() => setState((prev) => ({ ...prev, isModalOpen: true }))}
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
                  minWidth: "max-content",
                }}
              >
                Add Worker +
              </Button>
            </Box>
          </Grid>
        </Grid>

        {state.loading && state.filteredMembers.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
          </Box>
        )}

        {state.error && !state.loading && state.filteredMembers.length === 0 && <EmptyState />}
        {!state.loading && !state.error && state.filteredMembers.length === 0 && <EmptyState />}

        {state.filteredMembers.length > 0 && (
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
                  {state.members.map((member, index) => (
                      <TableRow
                        key={member.id}
                        sx={{
                          "& td": { border: "none" },
                          backgroundColor: member.isDeleted ? "rgba(0, 0, 0, 0.04)" : "#4d4d4e8e",
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
                            textDecoration: member.isDeleted ? "line-through" : "none",
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
                            textDecoration: member.isDeleted ? "line-through" : "none",
                          }}
                        >
                          {member.phoneNo || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.address,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "#F6F4FE",
                            textDecoration: member.isDeleted ? "line-through" : "none",
                            maxWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Tooltip title={member.address && member.address.length > 30 ? member.address : ""} placement="top" arrow>
                            <span>{member.address && member.address.length > 30 ? `${member.address.slice(0, 30)}...` : member.address || "N/A"}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          sx={{
                            width: columnWidths.whatsapp,
                            fontSize: isLargeScreen ? "0.875rem" : undefined,
                            color: member.isDeleted ? "gray" : "#F6F4FE",
                            textDecoration: member.isDeleted ? "line-through" : "none",
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
                            disabled={state.loading}
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
            <CustomPagination
              hasNextPage={state.pagination.hasNextPage}
              hasPrevPage={state.currentPage > 1}
              onPageChange={handlePageChange}
              currentPage={state.currentPage}
              isLargeScreen={isLargeScreen}
              isLoading={state.loading}
            />
            </TableContainer>
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
                  disabled={state.exportLoading}
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
                  {state.exportLoading ? (
                    <>
                      <CircularProgress
                        size={18}
                        sx={{ color: "var(--color-text-on-primary)", mr: 1 }}
                      />
                      Downloading...
                    </>
                  ) : (
                    <span className="flex items-center gap-1 "> Download Workers <PiDownloadThin /></span>
                  )}
                </Button>
              </Tooltip>
            </Box>
          </>
        )}

        <Menu
          id="member-menu"
          anchorEl={state.anchorEl}
          keepMounted
          open={Boolean(state.anchorEl)}
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
            onClick={() => navigate(`/members/view/${state.currentMember?.id}`)}
            disabled={state.currentMember?.isDeleted}
          >
            <PersonOutline style={{ marginRight: 8, fontSize: "1rem" }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("suspend")}>
            {!state.currentMember?.isDeleted ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: "1rem" }} />
                {state.loading && state.actionType === "suspend" ? "Suspending..." : "Suspend"}
              </>
            ) : (
              <>
                <MdRefresh style={{ marginRight: 8, fontSize: "1rem" }} />
                {state.loading && state.actionType === "suspend" ? "Activating..." : "Activate"}
              </>
            )}
          </MenuItem>
          <MenuItem onClick={() => showConfirmation("delete")} disabled={state.loading}>
            <AiOutlineDelete style={{ marginRight: "8px", fontSize: "1rem" }} />
            Delete
          </MenuItem>
        </Menu>

        <Dialog
          open={state.confirmModalOpen}
          onClose={() => setState((prev) => ({ ...prev, confirmModalOpen: false }))}
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontSize: isLargeScreen ? "1.25rem" : undefined }}>
            {state.actionType === "delete" ? "Delete Worker" : "Suspend Worker"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
              Are you sure you want to {state.actionType} {state.currentMember?.name}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setState((prev) => ({ ...prev, confirmModalOpen: false }))}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedAction}
              sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}
              color={state.actionType === "delete" ? "error" : "warning"}
              variant="contained"
              disabled={state.loading}
            >
              {state.loading ? "Processing..." : state.actionType === "delete" ? "Delete" : "Suspend"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={state.openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Import Excel File</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                border: `2px dashed ${state.isDragging ? theme.palette.primary.main : theme.palette.grey[400]}`,
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                bgcolor: state.isDragging ? theme.palette.grey[100] : "transparent",
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
              {state.selectedFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected file: {state.selectedFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={state.isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={state.isLoading || !state.selectedFile}
              sx={{
                backgroundColor: "#777280",
                color: "var(--color-text-on-primary)",
                "&:hover": { backgroundColor: "#777280", opacity: 0.9 },
              }}
            >
              {state.isLoading ? (
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

        <MemberModal
          open={state.isModalOpen}
          onClose={() => {setState((prev) => ({ ...prev, isModalOpen: false })); refreshMembers();}}
          onSuccess={fetchMembers}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewMembers;