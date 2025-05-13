import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { HiOutlineUsers } from "react-icons/hi2";
import { LuLayoutDashboard, LuMail, LuChurch } from "react-icons/lu";
import { LiaDonateSolid } from "react-icons/lia";
import { BiPencil } from "react-icons/bi";
import { MdOutlineClose } from "react-icons/md";

// Interface for component props
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

// Component Code
const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [logo, setLogo] = useState<string>("https://img.freepik.com/free-vector/logo-with-vintage-luxury-style_23-2147839655.jpg");
  const [background, setBackground] = useState<string>("https://img.freepik.com/free-vector/hotel-horizontal-banner-template-with-photo_52683-65998.jpg");

  // Toggle dropdown menu
  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  // Handle logo image upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogo(URL.createObjectURL(file));
    }
  };

  // Handle background image upload
  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackground(URL.createObjectURL(file));
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#111827] text-white flex flex-col transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 lg:translate-x-0 lg:static z-40`}
      >
        {/* Name Section */}
        <div className="flex items-center justify-between py-4 px-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">ChurchSuite</h1>
          <button
            className="text-gray-300 hover:text-white lg:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <MdOutlineClose className="text-2xl" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          <ul className="space-y-4">
            {/* Dashboard */}
            <li>
              <Link
                to="/dashboard"
                className="flex items-center gap-3 font-semibold text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
              >
                <LuLayoutDashboard className="text-2xl" />
                Dashboard
              </Link>
            </li>

            {/* Manage Church */}
            <li>
              <button
                onClick={() => toggleDropdown("manageChurch")}
                className="flex items-center justify-between w-full gap-3 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                aria-label="Manage Church"
              >
                <span className="flex items-center gap-3 font-semibold" title="Manage Church">
                  <LuChurch className="text-2xl" />
                  Manage
                </span>
                <span>{activeDropdown === "manageChurch" ? <MdOutlineKeyboardArrowUp /> : <MdOutlineKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "manageChurch" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <Link
                      to="/manage-church/branch"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Branch
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/manage-church/department"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Department
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/manage-church/admin"
                      className="block text-gray-Sent by Adedoyin Oluwakemi Adeyemi at 12:49 PM WAT on Tuesday, May 13, 2025-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Admin
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Members */}
            <li>
              <button
                onClick={() => toggleDropdown("members")}
                className="flex items-center justify-between w-full gap-3 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                aria-label="Members"
              >
                <span className="flex items-center font-semibold gap-3">
                  <HiOutlineUsers className="text-2xl" />
                  Members
                </span>
                <span>{activeDropdown === "members" ? <MdOutlineKeyboardArrowUp /> : <MdOutlineKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "members" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <Link
                      to="/members/list"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Members
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/members/qr-code"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Generate QR-CODE
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Auto Messages */}
            <li>
              <button
                onClick={() => toggleDropdown("autoMessages")}
                className="flex items-center justify-between w-full gap-3 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                aria-label="Auto Messages"
              >
                <span className="flex items-center font-semibold gap-3">
                  <LuMail className="text-2xl" />
                  Auto Messages
                </span>
                <span>{activeDropdown === "autoMessages" ? <MdOutlineKeyboardArrowUp /> : <MdOutlineKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "autoMessages" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <Link
                      to="/auto-messages/new-month"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      New Month
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auto-messages/birthday"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Birthday
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auto-messages/first-timer"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      First/Second Timer
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Finance */}
            <li>
              <button
                onClick={() => toggleDropdown("finance")}
                className="flex items-center justify-between w-full gap-3 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                aria-label="Finance"
              >
                <span className="flex items-center font-semibold gap-3">
                  <LiaDonateSolid className="text-2xl" />
                  Finance
                </span>
                <span>{activeDropdown === "finance" ? <MdOutlineKeyboardArrowUp /> : <MdOutlineKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "finance" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <Link
                      to="/finance/categories"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Finance Categories
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/finance/qr-code"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Generate QR-CODE
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/finance/budget"
                      className="block text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
                    >
                      Budget Planning
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>

        {/* Logo and Background Image Section */}
        <div
          className="relative h-40 rounded-t-xl"
          style={{
            backgroundImage: `url('${background}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Pencil Icon for Editing Background */}
          <label
            htmlFor="background-upload"
            className="absolute text-center top-0 right-0 bg-white text-gray-700 p-1 rounded-full shadow-md hover:bg-gray-100 cursor-pointer"
            aria-label="Upload Background"
          >
            <BiPencil className="text-lg" />
            <input
              type="file"
              id="background-upload"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundUpload}
            />
          </label>

          {/* Logo */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <img
              src={logo}
              alt="ChurchSuite Logo"
              className="h-16 w-16 object-contain rounded-full border-2 border-white"
            />

            {/* Pencil Icon for Editing Logo */}
            <label
              htmlFor="logo-upload"
              className="absolute bottom-0 right-0 bg-white text-gray-700 p-1 rounded-full shadow-md hover:bg-gray-100 cursor-pointer"
              aria-label="Upload Logo"
            >
              <BiPencil className="text-sm" />
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
          </div>
        </div>
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