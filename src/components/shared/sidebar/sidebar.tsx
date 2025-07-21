import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdClose } from "react-icons/md";
import { HiUsers } from "react-icons/hi2";
import { LuLayoutDashboard, LuMail, LuChurch, LuSettings } from "react-icons/lu";
import { LiaDonateSolid } from "react-icons/lia";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import { QrCodeScannerOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { FaPeopleRoof } from "react-icons/fa6";

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
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [primaryColor, setPrimaryColor] = useState("#111827");

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
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[color-mix(in_srgb,_var(--color-primary),_white_50%)] scrollbar-track-transparent">
          <ul className="space-y-4">
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
                  Registrar
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
                      to="/attendance/service"
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
    </>
  );
};

export default Sidebar;