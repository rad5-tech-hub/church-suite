import React, { useState, useEffect } from "react";
import { IoNotificationsOutline, IoPersonOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import Popover from "@mui/material/Popover";
import { FiLogOut } from "react-icons/fi";
import { Tooltip } from "@mui/material";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { store } from "../../reduxstore/redux";
import { clearAuth } from "../../reduxstore/authstore";
import MobileNav from "../mobileNav/mobilenav";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Map button labels to route patterns
  const buttonRoutePatterns: { [key: string]: RegExp } = {
    Dashboard: /^\/dashboard(\/|$)/,
    Manage: /^\/manage(\/|$)/,
    Membership: /^\/members(\/|$)/,
    Message: /^\/message(\/|$)/,
    Finance: /^\/finance(\/|$)/,
    Programs: /^\/programs(\/|$)/,
    Settings: /^\/settings(\/|$)/,
  };

  const buttons = [
    "Dashboard",
    "Manage",
    "Membership",
    "Message",
    "Finance",
    "Programs",
    "Settings",
  ];

  // Default routes for each button
  const defaultRoutes: { [key: string]: string } = {
    Dashboard: "/dashboard",
    Manage: "/manage/view-admins",
    Membership: "/members/view-workers",
    Message: "/message",
    Finance: "/finance",
    Programs: "/programs",
    Settings: "/settings",
  };

  // Sync activeButton with current route
  useEffect(() => {
    const currentPath = location.pathname;

    // Find the first button whose route pattern matches the current path
    const activeLabel =
      Object.keys(buttonRoutePatterns).find((label) =>
        buttonRoutePatterns[label].test(currentPath)
      ) || null;

    setActiveButton(activeLabel);
  }, [location.pathname]);

  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);

  const handleProfileClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
    navigate("/login");
  };

  const handleButtonClick = (label: string) => {
    navigate(defaultRoutes[label]);
    // Don't set activeButton manually — useEffect handles it
  };

  const open = Boolean(anchorEl);
  const id = open ? "profile-popover" : undefined;

  return (
    <header className="w-full h-16 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center lg:gap-17 gap-4">
        <Tooltip title={authData?.church_name || ""} arrow>
          {authData?.logo ? (
            <img
              src={authData?.logo || undefined}
              alt={`${authData?.church_name} logo`}
              className="h-16 w-16 object-contain rounded-full"
            />
          ) : (
            <div className="h-16 w-16 flex items-center justify-center bg-gray-300 rounded-full text-gray-600 font-bold text-lg">
              {authData?.church_name
                ? authData.church_name.charAt(0).toUpperCase()
                : "C"}
            </div>
          )}
        </Tooltip>

        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <ButtonGroup
            sx={{
              backgroundColor: "#4d4d4e8e",
              border: "none",
              borderRadius: "9999px",
              padding: "0.5px",
              overflow: "hidden",
              boxShadow: "none",
              "& .MuiButtonGroup-grouped": {
                border: "none",
                "&:not(:last-of-type)": {
                  borderRight: "none",
                },
              },
            }}
            size="large"
            aria-label="Large button group"
          >
            {buttons.map((label, index) => (
              <Button
                key={label}
                onClick={() => handleButtonClick(label)}
                sx={{
                  color: activeButton === label ? "#160F38" : "#777280",
                  backgroundColor:
                    activeButton === label ? "#F6F4FE" : "#363740",
                  border: "none",
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
                    borderRadius: "9999px",
                    color: "#160F38",
                  },
                  transition: "all 0.3s ease",
                  fontWeight: "600",
                }}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="relative bg-[#4d4d4e8e] p-2 rounded-full"
          aria-label="Notifications"
        >
          <IoNotificationsOutline className="text-2xl" />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </button>

        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleProfileClick}
          >
            <div
              className="p-2 border border-[var(--color-text-on-primary)] rounded-full"
              title={`${authData?.name || ""} ${authData?.email || ""}`}
            >
              <BsPerson className="text-xl" aria-label="Person" />
            </div>
            <span className="hidden xl:block text-sm font-medium">
              <span className="block">{authData?.name || ""}</span>
              <span className="block text-[10px]">{authData?.email || ""}</span>
            </span>
          </div>

          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <div className="m-1 my-2">
              <div
                className="flex items-center gap-2 px-5 py-2 m-1 hover:bg-gray-100 rounded-md cursor-pointer"
                onClick={() => {
                  navigate("/settings");
                  handleClose();
                }}
              >
                <IoPersonOutline className="text-lg text-gray-700" />
                <Typography variant="body2" className="text-gray-700">
                  Profile
                </Typography>
              </div>
              <div
                className="flex items-center gap-2 px-5 py-2 m-1 cursor-pointer hover:bg-gray-100 rounded-md"
                onClick={handleOpenLogoutModal}
              >
                <FiLogOut className="text-lg text-gray-700" />
                <Typography variant="body2" className="text-gray-700">
                  Logout
                </Typography>
              </div>
            </div>
          </Popover>
        </div>
      </div>

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
            position: "relative",
            width: {
              xs: "90%",
              sm: "400px",
            },
            maxWidth: "95vw",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: {
              xs: 2,
              sm: 4,
            },
            border: "none",
            borderRadius: 1,
            mx: "auto",
            my: "auto",
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
              display: "flex",
              justifyContent: "flex-end",
              mt: 3,
              gap: 2,
              flexDirection: {
                xs: "column",
                sm: "row",
              },
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCloseLogoutModal}
              sx={{
                borderColor: "gray",
                color: "#111827",
                "&:hover": {
                  borderColor: "darkgray",
                },
                width: {
                  xs: "100%",
                  sm: "auto",
                },
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmLogout}
              sx={{
                backgroundColor: "#FB2C36",
                color: "white",
                "&:hover": {
                  backgroundColor: "#FF6467",
                },
                border: "none",
                boxShadow: "none",
                width: {
                  xs: "100%",
                  sm: "auto",
                },
              }}
              fullWidth
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Modal>

      <MobileNav
        activeButton={activeButton}
        handleButtonClick={handleButtonClick}
      />
    </header>
  );
};

export default Header;
