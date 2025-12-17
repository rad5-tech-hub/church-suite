import React, { useState, useEffect, useCallback } from "react";
import { IoNotificationsOutline, IoPersonOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { FiLogOut, FiSend } from "react-icons/fi";
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
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Chip,
} from "@mui/material";
import Api from "../api/api";
import MobileNav from "../mobileNav/mobilenav";
import axios from "axios";
import { HelpOutlineRounded } from "@mui/icons-material";

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

interface NotificationType {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const issueTypes = [
  "Technical",
  "Financial",
  "Setup",
  "Billing",
  "Messaging",
  "Membership",
  "Reports",
  "Other",
];

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
    Reports: /^\/reports(\/|$)/,
    Settings: /^\/settings(\/|$)/,
  };

  const defaultRoutes: { [key: string]: string } = {
    Dashboard: "/dashboard",
    Manage: "/manage/view-admins",
    Membership: "/members/view-workers",
    Messages: "/messages/sms",
    Finance: "/finance/collections",
    Programs: "/programs",
    Reports: "/reports",
    Settings: "/settings",
  };

  const buttons = Object.keys(defaultRoutes);

  const buttonPermissions: { [key: string]: string[] } = {
    Dashboard: [],
    Manage: ["Branch", "Department", "Unit", "Admin"],
    Membership: ["Workers", "Members", "Followup"],
    Messages: ["Messaging", "Wallet"],
    Finance: ["Collection", "Finance"],
    Programs: ["Programs", "Attendance", "Followup"],
    Reports: ["Reports"],
    Settings: [],
  };

  const availableButtons = buttons.filter((label) => {
    const permissions = authData?.permission;
    if (!permissions || permissions.length === 0) return true;
    const requiredPermissions = buttonPermissions[label] || [];
    if (requiredPermissions.length === 0) return true;
    return permissions.some((p: string) => requiredPermissions.includes(p));
  });

  // State management
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);
  const notifOpen = Boolean(notifAnchor);
  const helpOpen = Boolean(helpAnchor);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [errorBranches, setErrorBranches] = useState<string>("");
  const [errorDepartments, setErrorDepartments] = useState<string>("");
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [tab, setTab] = useState<"unread" | "read">("unread");

  // Support form state
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const open = Boolean(anchorEl);
  const id = open ? "profile-popover" : undefined;

  // Sync active button with current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeLabel =
      buttons.find((label) => buttonRoutePatterns[label].test(currentPath)) || null;
    setActiveButton(activeLabel);
  }, [location.pathname, buttons]);

  // Fetch branches
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

  // Fetch departments
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

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotif(true);
      const res = await Api.get("/tenants/get-notifications");
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error("Notification Error:", error);
      setNotifications([]);
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);
  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Handlers
  const handleBranchSelect = (event: SelectChangeEvent<string>) => {
    const branchId = event.target.value;
    setCurrentBranchId(branchId);
    setCurrentDepartmentId("");
    setDepartments([]);

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

  const handleProfileClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setErrorBranches("");
    setErrorDepartments("");
  };

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
    navigate("/");
  };

  const handleButtonClick = (label: string) => {
    if (label === "Manage") {
      const manageRoutes: { [key: string]: string } = {
        Branch: "/manage/view-branches",
        Department: "/manage/view-departments",
        Unit: "/manage/view-units",
        Admin: "/manage/view-admins",
      };
      const perm = authData?.permission?.find((p: string) =>
        buttonPermissions.Manage.includes(p)
      );
      navigate(perm ? manageRoutes[perm] : "/manage/view-admins");
    } else if (label === "Membership") {
      const membershipRoutes: { [key: string]: string } = {
        Workers: "/members/view-workers",
        Members: "/members/view-members",
        Followup: "/members/view-followup",
      };
      const perm = authData?.permission?.find((p: string) =>
        buttonPermissions.Membership.includes(p)
      );
      navigate(perm ? membershipRoutes[perm] : "/members/view-workers");
    } else if (label === "Messages") {
      const messagesRoutes: { [key: string]: string } = {
        Messaging: "/messages/sms",
        Wallet: "/messages/wallets",
      };
      const perm = authData?.permission?.find((p: string) =>
        buttonPermissions.Messages.includes(p)
      );
      navigate(perm ? messagesRoutes[perm] : "/messages/sms");
    } else if (label === "Finance") {
      const financeRoutes: { [key: string]: string } = {
        Collection: "/finance/collections",
        Finance: "/finance/accounts",
      };
      const perm = authData?.permission?.find((p: string) =>
        buttonPermissions.Finance.includes(p)
      );
      navigate(perm ? financeRoutes[perm] : "/finance/collections");
    } else if (label === "Programs") {
      navigate("/programs");
    } else {
      navigate(defaultRoutes[label]);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);
  const filteredNotifications = tab === "unread" ? unreadNotifications : readNotifications;
  const unreadCount = unreadNotifications.length;

  const markAsRead = async (notificationId: string) => {
    try {
      await Api.patch(`/tenants/mark-read/${notificationId}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = unreadNotifications.map((n) =>
        Api.patch(`/tenants/mark-read/${n.id}`)
      );
      await Promise.all(promises);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotifClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
  };

  const handleHelpClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHelpAnchor(event.currentTarget);
  };

  const handleHelpClose = () => {
    setHelpAnchor(null);
    setSelectedIssues([]);
    setMessage("");
    setSubmitSuccess(false);
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  const handleSubmitFeedback = async () => {
    if (selectedIssues.length === 0 || !message.trim()) return;

    setSubmitting(true);
    try {
      await Api.post("/support/ticket", {
        issues: selectedIssues,
        message: message.trim(),
        churchId: authData?.churchId,
        userId: authData?.id,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        handleHelpClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit support ticket:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <header className="w-full h-16 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center gap-4 lg:gap-14 w-full lg:w-auto justify-between lg:justify-start">
        <Tooltip title={authData?.church_name || ""} arrow>
          {authData?.logo ? (
            <img
              src={authData.logo}
              alt={`${authData?.church_name || "Church"} logo`}
              className="h-16 w-16 object-contain rounded-3xl"
            />
          ) : (
            <div className="h-14 w-14 flex items-center justify-center bg-[var(--color-text-on-primary)] rounded-full text-[var(--color-primary)] font-bold text-2xl">
              {authData?.church_name?.charAt(0).toUpperCase() || "C"}
            </div>
          )}
        </Tooltip>

        <Box
          sx={{
            display: { xs: "none", md: "block" },
            overflowX: "auto",
            whiteSpace: "nowrap",

            /* Firefox */
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.15) transparent",

            /* WebKit (Chrome, Edge, Safari) */
            "&::-webkit-scrollbar": {
              height: "2px", // VERY thin
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.7)", // dark thumb
              borderRadius: "9999px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "rgba(0, 0, 0, 0.15)", // subtle dark track
            },

            flexGrow: 1,
            maxWidth: { lg: "calc(100vw - 500px)" },
          }}
        >
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
            {availableButtons.map((label, index) => (
              <Button
                key={label}
                onClick={() => handleButtonClick(label)}
                sx={{
                  color: activeButton === label ? "#160F38" : "[var(--color-primary)]",
                  backgroundColor: activeButton === label ? "#F6F4FE" : "[var(--color-text-on-primary)]",
                  textTransform: "none",
                  padding: "12px 18px",
                  fontSize: "0.875rem",
                  borderRadius: "9999px !important",
                  ...(index === 0 && {
                    borderTopLeftRadius: "9999px !important",
                    borderBottomLeftRadius: "9999px !important",
                  }),
                  ...(index === availableButtons.length - 1 && {
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
        {/* Help / Support Button */}
        <button
          className="relative bg-[#4d4d4e8e] p-2.5 sm:p-3 rounded-full hover:bg-[#5d5d6e8e] transition flex-shrink-0"
          onClick={handleHelpClick}
          title="Get Help / Submit Feedback"
        >
          <HelpOutlineRounded className="text-xl sm:text-2xl text-[#cfcfdb8e]" />
        </button>

        {/* Notifications Button */}
        <button
          className="relative bg-[#4d4d4e8e] p-2.5 sm:p-3 rounded-full hover:bg-[#5d5d6e8e] transition flex-shrink-0"
          onClick={handleNotifClick}
        >
          <IoNotificationsOutline className="text-xl sm:text-2xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center font-medium">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Popover */}
        <Popover
          open={notifOpen}
          anchorEl={notifAnchor}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { width: 380, maxHeight: 500, p: 0 } }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", bgcolor: "background.paper" }}>
              <Button fullWidth onClick={() => setTab("unread")} sx={{ py: 1.5, borderRadius: 0, color: tab === "unread" ? "primary.main" : "text.secondary", fontWeight: tab === "unread" ? 600 : 400, borderBottom: tab === "unread" ? 2 : 0, borderColor: "primary.main" }}>
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </Button>
              <Button fullWidth onClick={() => setTab("read")} sx={{ py: 1.5, borderRadius: 0, color: tab === "read" ? "primary.main" : "text.secondary", fontWeight: tab === "read" ? 600 : 400, borderBottom: tab === "read" ? 2 : 0, borderColor: "primary.main" }}>
                Read
              </Button>
            </Box>
          </Box>

          {tab === "unread" && unreadCount > 0 && (
            <Box sx={{ px: 2, py: 1, textAlign: "right" }}>
              <Button size="small" onClick={markAllAsRead} sx={{ textTransform: "none", fontSize: "0.8rem" }}>
                Mark all as read
              </Button>
            </Box>
          )}

          <Divider />

          {loadingNotif ? (
            <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={24} /></Box>
          ) : (
            <List sx={{ maxHeight: 360, overflowY: "auto", p: 0 }}>
              {filteredNotifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body2">
                    {tab === "unread" ? "No unread notifications" : "No read notifications yet"}
                  </Typography>
                </Box>
              ) : (
                filteredNotifications.map((n) => (
                  <ListItem key={n.id} component="div" onClick={() => !n.isRead && markAsRead(n.id)}
                    sx={{
                      py: 1.5, px: 2, backgroundColor: n.isRead ? "transparent" : "#f5f0ff",
                      borderLeft: n.isRead ? "none" : "3px solid", borderColor: "primary.main",
                      cursor: n.isRead ? "default" : "pointer",
                      "&:hover": { backgroundColor: n.isRead ? "transparent" : "#ede7ff" },
                      transition: "background 0.2s",
                    }}
                  >
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: n.isRead ? 500 : 700, color: n.isRead ? "text.secondary" : "text.primary" }}>{n.title}</Typography>}
                      secondary={
                        <>
                          <Typography variant="body2" sx={{ color: n.isRead ? "text.disabled" : "text.primary", mt: 0.5 }}>{n.message}</Typography>
                          <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "text.disabled" }}>
                            {new Date(n.createdAt).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                    {!n.isRead && <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "primary.main", alignSelf: "flex-start", mt: 1.5 }} />}
                  </ListItem>
                ))
              )}
            </List>
          )}
        </Popover>

        {/* Help / Support Form Popover */}
        <Popover
          open={helpOpen}
          anchorEl={helpAnchor}
          onClose={handleHelpClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { width: 420, p: 3, borderRadius: 3, boxShadow: 8 } }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tell us what you're experiencing. We'll get back to you as soon as possible.
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 500 }}>
            Issue Type (select all that apply)
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {issueTypes.map((issue) => (
              <Chip
                key={issue}
                label={issue}
                onClick={() => toggleIssue(issue)}
                variant={selectedIssues.includes(issue) ? "filled" : "outlined"}
                sx={{
                  borderRadius: "16px",
                  fontWeight: selectedIssues.includes(issue) ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: selectedIssues.includes(issue) ? "#4d4d4e8e" : "transparent",
                  color: selectedIssues.includes(issue) ? "white" : "inherit",
                  "&:hover": {
                    backgroundColor: selectedIssues.includes(issue) ? "#5d5d6e" : "#f0f0f0",
                  },
                }}
              />
            ))}
          </Box>

          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Describe your issue or feedback in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button onClick={handleHelpClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitFeedback}
              sx={{
                py: 1,
                backgroundColor: "#161616",
                px: { xs: 5, sm: 2 },
                borderRadius: 50,
                fontWeight: "semibold",
                color: "#F6F4FE",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": { backgroundColor: "#2C2C2C", opacity: 0.9 },
              }}
              disabled={submitting || selectedIssues.length === 0 || !message.trim()}
              startIcon={submitting ? <CircularProgress size={16} /> : submitSuccess ? null : <FiSend />}
            >
              {submitSuccess ? "Sent!" : submitting ? "Sending..." : "Send Request"}
            </Button>
          </Box>

          {submitSuccess && (
            <Typography variant="body2" color="success.main" sx={{ mt: 2, textAlign: "center" }}>
              Thank you! Your message has been sent.
            </Typography>
          )}
        </Popover>

        {/* Profile Section */}
        <div className="relative text-[var(--color-text-on-primary)]">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleProfileClick}
            title={`${authData?.name || ""} ${authData?.email || ""}`}
          >
            <div className="p-2 border border-[var(--color-text-on-primary)] rounded-full flex-shrink-0">
              <BsPerson className="text-lg sm:text-xl" aria-label="Person" />
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
                  navigate("/profile");
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

              {((authData?.branches?.length ?? 0) > 1 || authData?.isHeadQuarter) && (
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
                </Box>
              )}

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
                </Box>
              )}
            </Box>
          </Popover>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        open={openLogoutModal}
        onClose={handleCloseLogoutModal}
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(3px)",
        }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: 400 },
            maxWidth: "95vw",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
          }}
        >
          <Typography id="logout-modal-title" variant="h6" component="h2">
            Confirm Logout
          </Typography>
          <Typography id="logout-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to logout?
          </Typography>
          <Box
            sx={{
              mt: 4,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCloseLogoutModal}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmLogout}
              sx={{ width: { xs: "100%", sm: "auto" } }}
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