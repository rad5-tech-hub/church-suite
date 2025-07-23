import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdClose} from "react-icons/md";
import { BiSupport } from "react-icons/bi";
import { HiUsers } from "react-icons/hi2";
import { LuLayoutDashboard, LuMail, LuChurch, LuSettings } from "react-icons/lu";
import { LiaDonateSolid } from "react-icons/lia";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import { QrCodeScannerOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { FaPeopleRoof } from "react-icons/fa6";
import { FiLogOut } from "react-icons/fi";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { store } from "../../reduxstore/redux";
import { clearAuth } from "../../reduxstore/authstore";
import Typography from "@mui/material/Typography";
// import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

// Color utility functions
const isDarkColor = (color: string): boolean => {
  // Remove any non-hex characters
  const hex = color.replace(/[^0-9A-F]/gi, '');
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

const getActiveBgColor = (color: string) => {
  return isDarkColor(color)
    ? "bg-[color-mix(in_srgb,_var(--color-primary),_white_20%)]"
    : "bg-[color-mix(in_srgb,_var(--color-primary),_black_20%)]";
};

const getHoverBgColor = (color: string) => {
  return isDarkColor(color)
    ? "hover:bg-[color-mix(in_srgb,_var(--color-primary),_white_10%)]"
    : "hover:bg-[color-mix(in_srgb,_var(--color-primary),_black_10%)]";
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#111827");
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);

  // Watch for changes in CSS variable
  useEffect(() => {
    const updateColor = () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim();
      setPrimaryColor(color || "#111827");
    };

    // Initial update
    updateColor();

    // Watch for changes
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const handleOpenLogoutModal = () => {
    setOpenLogoutModal(true);
  };

  const handleCloseLogoutModal = () => {
    setOpenLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    // Dispatch action to clear auth store    
    handleCloseLogoutModal();
    store.dispatch(clearAuth());
  };

  // Get dynamic class names based on current primary color
  const activeBgClass = getActiveBgColor(primaryColor);
  const hoverBgClass = getHoverBgColor(primaryColor);

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex flex-col transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 lg:translate-x-0 lg:static z-40`}
      >
        {/* Name Section with Logo */}
        <div className="flex items-center justify-between py-4 px-4 border-b border-[color-mix(in_srgb,_var(--color-primary),_black_30%)]">
          <div className="flex items-center gap-3">
            <img
              src={authData?.logo || undefined}
              alt={`${authData?.church_name} logo`}
              className="h-8 w-8 object-contain rounded-full"
            />
            <Tooltip title={authData?.church_name || ""} arrow>
              <h1 className="text-xl font-bold">
                {authData?.church_name || ""}
              </h1>
            </Tooltip>
          </div>
          <button
            className="text-gray-300 hover:text-white lg:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[color-mix(in_srgb,_var(--color-primary),_white_50%)] scrollbar-track-transparent flex flex-col h-full">
          {/* Main Navigation Links - takes up available space */}
          <ul className="space-y-4 flex-grow">
            {/* Dashboard */}
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 font-semibold px-4 py-2 rounded-md transition-colors ${
                    isActive ? `active ${activeBgClass}` : hoverBgClass
                  }`
                }
              >
                <LuLayoutDashboard className="text-2xl" />
                Dashboard
              </NavLink>
            </li>

            {/* Manage Church */}
            <li>
              <button
                onClick={() => toggleDropdown("manageChurch")}
                className={`flex items-center justify-between w-full gap-3 px-4 py-2 rounded-md transition-colors ${hoverBgClass.replace('hover:', '')}`}
                aria-label="Manage Church"                                
              >
                <span className="flex items-center gap-3 font-semibold" title="Manage Church">
                  <LuChurch className="text-2xl" />
                  Manage
                </span>
                <span>{activeDropdown === "manageChurch" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "manageChurch" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/manage/view-admins"                   
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Admin
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/manage/view-branches"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Branch
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/manage/view-Departments"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Department
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/manage/viewUnits"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Unit
                    </NavLink>
                  </li>                
                </ul>
              )}
            </li>

            {/* Members */}
            <li>
              <button
                onClick={() => toggleDropdown("members")}
                className={`flex items-center justify-between w-full gap-3 px-4 py-2 rounded-md transition-colors ${hoverBgClass.replace('hover:', '')}`}
                aria-label="Members"
              >
                <span className="flex items-center font-semibold gap-3">
                  <HiUsers className="text-2xl" />
                  Register
                </span>
                <span>{activeDropdown === "members" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "members" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/members/view-members"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Workers
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/view/followup"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Newcomers
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* Auto Messages */}
            <li>
              <button
                onClick={() => toggleDropdown("autoMessages")}
                className={`flex items-center justify-between w-full gap-3 px-4 py-2 rounded-md transition-colors ${hoverBgClass.replace('hover:', '')}`}
                aria-label="Auto Messages"
              >
                <span className="flex items-center font-semibold gap-3">
                  <LuMail className="text-2xl" />
                  Messages
                </span>
                <span>{activeDropdown === "autoMessages" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "autoMessages" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/auto-messages/new-month"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      New Month
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/auto-messages/birthday"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Birthday
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/auto-messages/first-timer"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      First/Second Timer
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* Attendance */}
            <li>
              <button
                onClick={() => toggleDropdown("attendance")}
                className={`flex items-center justify-between w-full gap-3 px-4 py-2 rounded-md transition-colors ${hoverBgClass.replace('hover:', '')}`}
                aria-label="Attendance"
              >
                <span className="flex items-center font-semibold gap-3">
                  <FaPeopleRoof className="text-2xl" />                
                  Attendance
                </span>
                <span>{activeDropdown === "attendance" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "attendance" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/attendance/viewServices"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Program
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/attendance/record"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Records
                    </NavLink>
                  </li>
                  {/* <li>
                    <NavLink
                      to="/auto-messages/first-timer"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      First/Second Timer
                    </NavLink>
                  </li> */}
                </ul>
              )}
            </li>

            {/* Finance */}
            <li>
              <button
                onClick={() => toggleDropdown("finance")}
                className={`flex items-center justify-between w-full gap-3 px-4 py-2 rounded-md transition-colors ${hoverBgClass.replace('hover:', '')}`}
                aria-label="Finance"
              >
                <span className="flex items-center font-semibold gap-3">
                  <LiaDonateSolid className="text-2xl" />
                  Finance
                </span>
                <span>{activeDropdown === "finance" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "finance" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/finance/categories"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Finance Categories
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/finance/qr-code"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Generate QR-CODE
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/finance/budget"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md transition-colors ${
                          isActive ? `active ${activeBgClass}` : hoverBgClass
                        }`
                      }
                    >
                      Budget Planning
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* QRcode */}
            <li>
              <NavLink
                to="/qrcodes"
                className={({ isActive }) =>
                  `flex items-center gap-3 font-semibold px-4 py-2 rounded-md transition-colors ${
                    isActive ? `active ${activeBgClass}` : hoverBgClass
                  }`
                }
              >
                <QrCodeScannerOutlined className="text-2xl" />
                QR-CODES
              </NavLink>
            </li>

            {/* setting */}
            <li>
              <NavLink
                to="/church/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 font-semibold px-4 py-2 rounded-md transition-colors ${
                    isActive ? `active ${activeBgClass}` : hoverBgClass
                  }`
                }
              >
                <LuSettings className="text-2xl" />
                Settings
              </NavLink>
            </li>
          </ul>
            {/* Support/Logout Links - pushed to bottom */}
            <ul className="mt-5 space-y-4 pb-4">
              <li>
               <NavLink
                  to="/church/settings"
                  className={({ isActive }) =>
                    `flex items-center gap-3 font-semibold px-4 py-2 rounded-md transition-colors ${
                      isActive ? `active ${activeBgClass}` : hoverBgClass
                    }`
                  }
                >
                  <BiSupport className="text-2xl" />
                  Contact Support
                </NavLink>
              </li>
              <li className="mt-6">
                <button 
                  onClick={handleOpenLogoutModal}
                  className="flex items-center gap-3 font-semibold px-4 py-2 rounded-md transition-colors w-full text-left hover:bg-red-500 dark:hover:bg-red-700"
                >
                  <FiLogOut className="text-2xl" />
                  Log Out
                </button>
              </li>
            </ul>
        </nav>     
      </div>

      {/* Overlay for Off-Canvas Sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-50 opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
          data-testid="overlay"
        ></div>
      )}


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
                backgroundColor: '#FB2C36',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#FF6467',
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
    </>
  );
};

export default Sidebar;