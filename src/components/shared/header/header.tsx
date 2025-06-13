import React, { useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { TbMenuDeep } from "react-icons/tb";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import Popover from "@mui/material/Popover";
import { FiLogOut } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { store } from "../../reduxstore/redux";
import { clearAuth } from "../../reduxstore/authstore";
import { useNavigate } from "react-router-dom";

// Interface for component props
interface HeaderProps {
  toggleSidebar: () => void; // Function to toggle the sidebar
}

// Component Code
const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenLogoutModal = () => {
    setOpenLogoutModal(true);
    handleClose(); // Close the profile popover
  };

  const handleCloseLogoutModal = () => {
    setOpenLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    // Dispatch action to clear auth store    
    handleCloseLogoutModal();
    store.dispatch(clearAuth());
  };

  const open = Boolean(anchorEl);
  const id = open ? "profile-popover" : undefined;

  return (
    <header className="w-full h-16 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex items-center justify-between px-6 shadow-md">
      {/* Left Section: Menu Button */}
      <div className="flex items-center gap-4">
        <button
          className="text-xl lg:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <TbMenuDeep className="text-xl" />
        </button>
        <h1 className="text-xl font-bold"></h1>
      </div>

      {/* Right Section: Notifications and Profile */}
      <div className="flex items-center gap-6">
        <button className="relative" aria-label="Notifications">
          <IoNotificationsOutline className="text-2xl" />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile Section with Popover */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleProfileClick}
          >
            <div className="p-2 border border-[var(--color-text-on-primary)] rounded-full" title={`${authData?.name || ''} ${authData?.email || ''}`}>
              <BsPerson className="text-xl" aria-label="Person" />
            </div>
            <span className="hidden lg:block text-sm font-medium">
              <span className="block">{authData?.name || ""}</span> {/* Name on one row */}
              <span className="block text-[10px] ">{authData?.email || ""}</span> {/* Email on another row */}
            </span>
          </div>

          {/* Material-UI Popover */}
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
              {/* Logout Option */}
              <div
                className="flex items-center gap-2 px-5 py-2 m-1 cursor-pointer hover:bg-gray-100 rounded-md"
                onClick={handleOpenLogoutModal}
              >
                <FiLogOut className="text-lg text-gray-700" />
                <Typography variant="body2" className="text-gray-700">
                  Logout
                </Typography>
              </div>

              {/* Settings Option */}
              <div
                className="flex items-center gap-2  px-5 py-2 m-1 hover:bg-gray-100 rounded-md cursor-pointer"
                onClick={() => {
                  navigate('/settings');
                  handleClose();
                }}
              >
                <IoSettingsOutline className="text-lg text-gray-700" />
                <Typography variant="body2" className="text-gray-700">
                  Settings
                </Typography>
              </div>
            </div>
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
            position: "relative",
            width: {
              xs: "90%",   // 90% width on extra small screens (mobile)
              sm: "400px",  // fixed 400px on small screens and up
            },
            maxWidth: "95vw", // Ensure it doesn't touch screen edges
            bgcolor: "background.paper",
            boxShadow: 24,
            p: {
              xs: 2,       // Smaller padding on mobile
              sm: 4,       // Larger padding on larger screens
            },
            border: "none",
            borderRadius: 1,
            mx: "auto",    // Center horizontally
            my: "auto",    // Center vertically
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
                xs: "column", // Stack buttons vertically on mobile
                sm: "row",    // Side by side on larger screens
              }
            }}
          >
            <Button 
              variant="outlined" 
              onClick={handleCloseLogoutModal}
              sx={{
                borderColor: 'gray',
                color: '#111827',
                '&:hover': {
                  borderColor: 'darkgray',
                },
                width: {
                  xs: '100%', // Full width on mobile
                  sm: 'auto', // Auto width on larger screens
                }
              }}
              fullWidth // Ensures full width on mobile
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmLogout}
              sx={{
                backgroundColor: '#111827',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1f2937',
                },
                border: 'none',
                boxShadow: 'none',
                width: {
                  xs: '100%', // Full width on mobile
                  sm: 'auto', // Auto width on larger screens
                }
              }}
              fullWidth // Ensures full width on mobile
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Modal>
    </header>
  );
};

export default Header;