import React from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { TbMenuDeep } from "react-icons/tb";

// Interface for component props
interface HeaderProps {
  toggleSidebar: () => void; // Function to toggle the sidebar
}

// Component Code
const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
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
        <div className="flex items-center gap-2">
          <div className="p-2 border border-gray-400 rounded-full">
            <BsPerson className="text-xl" aria-label="Person" />
          </div>
          <span className="hidden lg:block text-sm font-medium">John Doe</span>
        </div>
      </div>
    </header>
  );
};

export default Header;