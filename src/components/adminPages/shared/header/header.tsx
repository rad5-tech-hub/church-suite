import React from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { TbMenuDeep } from "react-icons/tb";
interface HeaderProps {
  toggleSidebar: () => void; // Function to toggle the sidebar
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="w-full h-16 bg-[#111827] text-white flex items-center justify-between px-6 shadow-md">
      {/* Left Section: Logo or Menu */}
      <div className="flex items-center gap-4">
        <button className="text-xl lg:hidden" onClick={toggleSidebar}>
          <TbMenuDeep className="text-xl" />
        </button>
        <h1 className="text-xl font-bold"></h1>
      </div>

      {/* Right Section: Notifications and Profile */}
      <div className="flex items-center gap-6">
        <button className="relative">
          <IoNotificationsOutline className="text-2xl" />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 border border-gray-400 rounded-full">
            <BsPerson className="text-xl" />
          </div>
          <span className="hidden lg:block text-sm font-medium">John Doe</span>
        </div>
      </div>
    </header>
  );
};

export default Header;