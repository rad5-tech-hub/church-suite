import React, { useState, useEffect, useCallback } from "react";
import { IoNotificationsOutline, IoPersonOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { FiLogOut } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "../../reduxstore/redux";
import { clearAuth, setAuthData } from "../../reduxstore/authstore";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Popover,
  Tooltip,
  Typography,
  Modal,
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import Api from "../api/api";
import MobileNav from "../mobileNav/mobilenav";
import axios from "axios";

interface HeaderProps {
  toggleSidebar: () => void;
}

interface Branch {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

const Header: React.FC<HeaderProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const authData = useSelector((state: RootState) => state.auth?.authData);

  // Navigation button configuration
  const buttonRoutePatterns: { [key: string]: RegExp } = {
    Dashboard: /^\/dashboard(\/|$)/,
    Manage: /^\/manage(\/|$)/,
    Membership: /^\/members(\/|$)/,
    Messages: /^\/messages(\/|$)/,
    Finance: /^\/finance(\/|$)/,
    Programs: /^\/programs(\/|$)/,
    Settings: /^\/settings(\/|$)/,
  };

  const defaultRoutes: { [key: string]: string } = {
    Dashboard: "/dashboard",
    Manage: "/manage/view-admins",
    Membership: "/members/view-workers",
    Messages: "/messages",
    Finance: "/finance/collections",
    Programs: "/programs",
    Settings: "/settings",
  };

  const buttons = Object.keys(defaultRoutes);

  // State management
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [errorBranches, setErrorBranches] = useState<string>("");
  const [errorDepartments, setErrorDepartments] = useState<string>("");

  const open = Boolean(anchorEl);
  const id = open ? "profile-popover" : undefined;

  // Sync active button with current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeLabel = buttons.find((label) => buttonRoutePatterns[label].test(currentPath)) || null;
    setActiveButton(activeLabel);
  }, [location.pathname, buttons]);

  // Fetch branches when popover opens
  const fetchBranches = useCallback(async () => {
    if (!authData?.id || !open) return;

    try {
      setLoadingBranches(true);
      setErrorBranches("");

      let branchesData: Branch[] = [];
      if (authData.isSuperAdmin && authData.isHeadQuarter) {
        const response = await Api.get("/church/get-branches");
        branchesData = response.data.branches || [];
      } else {
        const response = await Api.get(`/church/an-admin/${authData.id}`);
        branchesData = response.data.admin?.branches || [];
      }

      setBranches(branchesData);
      const newBranchId = authData.branchId || branchesData[0]?.id || "";
      setCurrentBranchId(newBranchId);

      // Update authData with the selected branch and reset department if changed
      if (authData && newBranchId !== authData.branchId) {
        dispatch(
          setAuthData({
            ...authData,
            branchId: newBranchId,
            department: "",
          })
        );
      }
    } catch (err) {
      setErrorBranches(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to fetch branches"
      );
      setBranches([]);
      setCurrentBranchId("");
    } finally {
      setLoadingBranches(false);
    }
  }, [authData, open, dispatch]);

  // Fetch departments when branch or role changes
  const fetchDepartments = useCallback(async () => {
    if (!currentBranchId || authData?.role !== "department") return;

    try {
      setLoadingDepartments(true);
      setErrorDepartments("");

      const response = await Api.get(`/church/get-departments?branchId=${currentBranchId}`);
      const departmentsData: Department[] = response.data.departments || [];
      setDepartments(departmentsData);

      const newDepartmentId = authData?.department || departmentsData[0]?.id || "";
      setCurrentDepartmentId(newDepartmentId);

      // Update authData with the selected department if changed
      if (authData && newDepartmentId && newDepartmentId !== authData.department) {
        dispatch(
          setAuthData({
            ...authData,
            department: newDepartmentId,
          })
        );
      }
    } catch (err) {
      setErrorDepartments(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to fetch departments"
      );
      setDepartments([]);
      setCurrentDepartmentId("");
    } finally {
      setLoadingDepartments(false);
    }
  }, [currentBranchId, authData, dispatch]);

  // Trigger branch fetching when popover opens
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Trigger department fetching when branch or role changes
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Handle branch selection
  const handleBranchSelect = (event: SelectChangeEvent<string>) => {
    const branchId = event.target.value;
    setCurrentBranchId(branchId);
    setCurrentDepartmentId(""); // Reset department when branch changes
    setDepartments([]); // Clear departments until new ones are fetched

    if (authData) {
      dispatch(
        setAuthData({
          ...authData,
          branchId: branchId,
          department: "",
        })
      );
    }
  };

  // Handle department selection
  const handleDepartmentSelect = (event: SelectChangeEvent<string>) => {
    const departmentId = event.target.value;
    if (!authData || departmentId === currentDepartmentId) return;

    setCurrentDepartmentId(departmentId);

    dispatch(
      setAuthData({
        ...authData,
        department: departmentId || "",
      })
    );
  };

  // Handle profile popover
  const handleProfileClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setErrorBranches("");
    setErrorDepartments("");
  };

  // Handle logout modal
  const handleOpenLogoutModal = () => {
    setOpenLogoutModal(true);
    handleClose();
  };

  const handleCloseLogoutModal = () => {
    setOpenLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    handleCloseLogoutModal();
    store.dispatch(clearAuth());
    navigate("/login");
  };

// Handle navigation button click
  const handleButtonClick = (label: string) => {
    if (label === "Manage") {
      if (authData?.role === "branch") {
        navigate("/manage/view-admins");
      } else if (authData?.role === "department") {
        navigate("/manage/view-departments");
      } else if (authData?.role === "unit") {
        navigate("/manage/view-units");
      } 
    } else {
      navigate(defaultRoutes[label]);
    }
  };


  return (
    <header className="w-full h-16 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center gap-4 lg:gap-17">
        <Tooltip title={authData?.church_name || ""} arrow>
          {authData?.logo ? (
            <img
              src={authData.logo}
              alt={`${authData?.church_name || "Church"} logo`}
              className="h-16 w-16 object-contain rounded-full"
            />
          ) : (
            <div className="h-16 w-16 flex items-center justify-center bg-gray-300 rounded-full text-gray-600 font-bold text-lg">
              {authData?.church_name?.charAt(0).toUpperCase() || "C"}
            </div>
          )}
        </Tooltip>

        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <ButtonGroup
            sx={{
              backgroundColor: "#4d4d4e8e",
              borderRadius: "9999px",
              padding: "0.5px",
              boxShadow: "none",
              "& .MuiButtonGroup-grouped": { border: "none" },
            }}
            size="large"
            aria-label="Navigation buttons"
          >
            {buttons.map((label, index) => (
              <Button
                key={label}
                onClick={() => handleButtonClick(label)}
                sx={{
                  color: activeButton === label ? "#160F38" : "#777280",
                  backgroundColor: activeButton === label ? "#F6F4FE" : "#363740",
                  textTransform: "none",
                  padding: "12px 18px",
                  fontSize: "0.875rem",
                  borderRadius: "9999px !important",
                  ...(index === 0 && {
                    borderTopLeftRadius: "9999px !important",
                    borderBottomLeftRadius: "9999px !important",
                  }),
                  ...(index === buttons.length - 1 && {
                    borderTopRightRadius: "9999px !important",
                    borderBottomRightRadius: "9999px !important",
                  }),
                  "&:hover": {
                    backgroundColor: "#F6F4FE",
                    color: "#160F38",
                  },
                  transition: "all 0.3s ease",
                  fontWeight: 600,
                }}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative bg-[#4d4d4e8e] p-2 rounded-full" aria-label="Notifications">
          <IoNotificationsOutline className="text-2xl" />
          {/* <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span> */}
        </button>

        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleProfileClick}
            title={`${authData?.name || ""} ${authData?.email || ""}`}
          >
            <div className="p-2 border border-[var(--color-text-on-primary)] rounded-full">
              <BsPerson className="text-xl" aria-label="Person" />
            </div>
            <span className="hidden xl:block text-sm font-medium">
              <span className="block">{authData?.name || "User"}</span>
              <span className="block text-[10px]">{authData?.email || "No email"}</span>
            </span>
          </div>

          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{ sx: { p: 1, my: 1 } }}
          >
            <Box sx={{ m: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2,
                  py: 1,
                  "&:hover": { bgcolor: "#f5f5f5", borderRadius: 1 },
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigate("/settings");
                  handleClose();
                }}
              >
                <IoPersonOutline className="text-lg text-gray-700" />
                <Typography variant="body2" color="textSecondary">
                  Profile
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2,
                  py: 1,
                  "&:hover": { bgcolor: "#f5f5f5", borderRadius: 1 },
                  cursor: "pointer",
                }}
                onClick={handleOpenLogoutModal}
              >
                <FiLogOut className="text-lg text-gray-700" />
                <Typography variant="body2" color="textSecondary">
                  Logout
                </Typography>
              </Box>

              <Box sx={{ px: 2, py: 1, borderTop: "1px solid #eee", mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, color: "gray", fontWeight: 500 }}>
                  Switch Branch
                </Typography>
                <Select
                  value={currentBranchId}
                  onChange={handleBranchSelect}
                  fullWidth
                  size="small"
                  disabled={!branches.length}
                  sx={{ backgroundColor: "#f9f9f9", borderRadius: 1 }}
                  displayEmpty
                  renderValue={(value) =>
                    value
                      ? branches.find((b) => b.id === value)?.name || "Select Branch"
                      : "Select Branch"
                  }
                >
                  {loadingBranches ? (
                    <MenuItem disabled>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={12} />
                        <Typography variant="body2">Loading...</Typography>
                      </Box>
                    </MenuItem>
                  ) : errorBranches ? (
                    <MenuItem disabled>
                      <Typography variant="body2" color="error">
                        {errorBranches}
                      </Typography>
                    </MenuItem>
                  ) : branches.length === 0 ? (
                    <MenuItem disabled>
                      <Typography variant="body2">No branches available</Typography>
                    </MenuItem>
                  ) : (
                    branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errorBranches && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errorBranches}
                  </Typography>
                )}
              </Box>

              {authData?.role === "department" && (
                <Box sx={{ px: 2, py: 1, borderTop: "1px solid #eee", mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: "gray", fontWeight: 500 }}>
                    Select Department
                  </Typography>
                  <Select
                    value={currentDepartmentId}
                    onChange={handleDepartmentSelect}
                    fullWidth
                    size="small"
                    disabled={!currentBranchId || !departments.length}
                    sx={{ backgroundColor: "#f9f9f9", borderRadius: 1 }}
                    displayEmpty
                    renderValue={(value) =>
                      value
                        ? departments.find((d) => d.id === value)?.name || "Select Department"
                        : "Select Department"
                    }
                  >
                    {loadingDepartments ? (
                      <MenuItem disabled>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={12} />
                          <Typography variant="body2">Loading...</Typography>
                        </Box>
                      </MenuItem>
                    ) : errorDepartments ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="error">
                          {errorDepartments}
                        </Typography>
                      </MenuItem>
                    ) : departments.length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2">No departments available</Typography>
                      </MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errorDepartments && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errorDepartments}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Popover>
        </div>
      </div>

      <Modal
        open={openLogoutModal}
        onClose={handleCloseLogoutModal}
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: 400 },
            maxWidth: "95vw",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            borderRadius: 1,
          }}
        >
          <Typography id="logout-modal-title" variant="h6" component="h2">
            Confirm Logout
          </Typography>
          <Typography id="logout-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to logout?
          </Typography>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
            <Button
              variant="outlined"
              onClick={handleCloseLogoutModal}
              sx={{ borderColor: "gray", color: "#111827", width: { xs: "100%", sm: "auto" } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmLogout}
              sx={{
                backgroundColor: "#FB2C36",
                color: "white",
                "&:hover": { backgroundColor: "#FF6467" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Modal>

      <MobileNav activeButton={activeButton} handleButtonClick={handleButtonClick} />
    </header>
  );
};

export default Header;