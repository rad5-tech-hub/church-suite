import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdClose } from "react-icons/md";
import { HiUsers } from "react-icons/hi2";
import { LuLayoutDashboard, LuMail, LuChurch, LuSettings } from "react-icons/lu";
import { LiaDonateSolid } from "react-icons/lia";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const authData = useSelector((state: RootState) => state.auth?.authData);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#111827] text-white flex flex-col transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 lg:translate-x-0 lg:static z-40`}
      >
        {/* Name Section with Logo */}
        <div className="flex items-center justify-between py-4 px-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src={authData?.logo}
              alt={`${authData?.church_name} logos`}
              className="h-8 w-8 object-contain rounded-full"
            />
            <h1
              className="text-xl font-bold truncate max-w-[120px]"
              title={authData?.church_name || ""}
            >
              {authData?.church_name || ""}
            </h1>
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
        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          <ul className="space-y-4">
            {/* Dashboard */}
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 font-semibold px-4 py-2 rounded-md ${
                    isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
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
                className="flex items-center justify-between w-full gap-3 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md"
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
                      to="/manage/admin"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`
                      }
                    >
                      Admin
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/manage/branch"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`
                      }
                    >
                      Branch
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/manage/department"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`
                      }
                    >
                      Department
                    </NavLink>
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
                  <HiUsers className="text-2xl" />
                  Members
                </span>
                <span>{activeDropdown === "members" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "members" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/members/member"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`
                      }
                    >
                      Members
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/members/qr-code"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`
                      }
                    >
                      Generate QR-CODE
                    </NavLink>
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
                <span>{activeDropdown === "autoMessages" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "autoMessages" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/auto-messages/new-month"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
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
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
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
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`
                      }
                    >
                      First/Second Timer
                    </NavLink>
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
                <span>{activeDropdown === "finance" ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</span>
              </button>
              {activeDropdown === "finance" && (
                <ul className="mt-2 space-y-1 pl-8">
                  <li>
                    <NavLink
                      to="/finance/categories"
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
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
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
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
                        `block px-4 py-2 rounded-md ${
                          isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`
                      }
                    >
                      Budget Planning
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* setting */}
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 font-semibold px-4 py-2 rounded-md ${
                    isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`
                }
              >
                <LuSettings className="text-2xl" />
                Setting
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