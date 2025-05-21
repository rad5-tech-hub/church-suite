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

// Interface for component props
interface HeaderProps {
  toggleSidebar: () => void; // Function to toggle the sidebar
}

// Component Code
const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleProfileClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "profile-popover" : undefined;
;

  return (
    <header className="w-full h-16 bg-[#111827] text-white flex items-center justify-between px-6 shadow-md">
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
            <div className="p-2 border border-gray-400 rounded-full" title={`${authData?.name || ''} ${authData?.email || ''}`}>
              <BsPerson className="text-xl" aria-label="Person" />
            </div>
            <span className="hidden lg:block text-sm font-medium">
              <span className="block">{authData?.name || ""}</span> {/* Name on one row */}
              <span className="block text-[10px] text-gray-100">{authData?.email || ""}</span> {/* Email on another row */}
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
                onClick={() => {
                  console.log("Logout clicked");
                  handleClose();
                }}
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
                  console.log("Settings clicked");
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
    </header>
  );
};

export default Header;