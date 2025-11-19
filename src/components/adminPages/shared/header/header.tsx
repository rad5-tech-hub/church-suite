import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoNotificationsOutline } from "react-icons/io5";
import { TbMenuDeep } from "react-icons/tb";
import { FiLogOut } from "react-icons/fi";
import { LuChevronDown } from "react-icons/lu"; // ← Best dropdown chevron

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Map routes to nice page titles
  const getPageTitle = () => {
    const path = location.pathname;

    if (path.startsWith("/admin-dashboard")) return "Dashboard";
    if (path.startsWith("/manage/churches")) return "Manage Churches";
    if (path.startsWith("/billing") || path.startsWith("/subscriptions")) return "Billing & Plans";
    if (path.startsWith("/activation")) return "Activation Center";
    if (path.startsWith("/support")) return "Support Center";
    if (path.startsWith("/logs")) return "Activity Logs";
    if (path.startsWith("/settings")) return "Settings";

    return "churchset"; // fallback
  };

  const handleLogout = () => {
    // Add your logout logic here (clear tokens, etc.)
    localStorage.removeItem("authToken"); // example
    navigate("/login");
  };

  return (
    <header className="w-full h-16 bg-white text-gray-800 border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30">
      {/* Left: Mobile Menu + Dynamic Title */}
      <div className="flex items-center gap-4">
        <button
          className="text-2xl text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition lg:hidden"
          onClick={toggleSidebar}
        >
          <TbMenuDeep />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 hidden sm:block">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
          <IoNotificationsOutline className="text-2xl text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition-all duration-200"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              JD
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <span className="font-medium text-gray-800">John Doe</span>
              <LuChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20">
                <div className="px-4 py-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600">john@example.com</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiLogOut className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;