import React, { useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { TbMenuDeep } from "react-icons/tb";
import { FiLogOut } from "react-icons/fi";
import { ChevronDownIcon } from "@heroicons/react/24/outline"; // Optional: for better dropdown arrow

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="w-full h-16 bg-white text-gray-800 border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30">
      {/* Left: Mobile Menu */}
      <div className="flex items-center gap-4">
        <button
          className="text-2xl text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition lg:hidden"
          onClick={toggleSidebar}
        >
          <TbMenuDeep />
        </button>
        {/* Optional: Small logo or page title */}
        <h2 className="text-lg font-semibold hidden sm:block">Dashboard</h2>
      </div>

      {/* Right: Notifications + Profile Dropdown */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button className="relative text-gray-600 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-lg">
          <IoNotificationsOutline className="text-2xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-medium">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              JD
            </div>
            <span className="hidden lg:block font-medium text-gray-800">John Doe</span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-600 hidden lg:block transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop (closes on click outside) */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-500">john@example.com</p>
                </div>
                <button
                  onClick={() => {
                    // Handle logout logic here
                    console.log("Logging out...");
                    // e.g., clear auth, redirect to login
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition"
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