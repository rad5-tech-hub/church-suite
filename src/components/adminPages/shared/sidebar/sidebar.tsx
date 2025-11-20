import React from "react";
import { Link, useLocation } from "react-router-dom"; // Added useLocation for active state
import { MdOutlineClose } from "react-icons/md";
import {
  LuLayoutDashboard,
  LuChurch,
  LuSettings,
  LuHistory,
  LuCreditCard,
  LuCircleCheck,
  LuMessageCircleQuestion,
} from "react-icons/lu";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Sidebar - Light Theme */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white text-gray-800 flex flex-col shadow-xl transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 lg:translate-x-0 lg:static z-40`}
      >
        {/* Logo / Name Section */}
        <div className="flex items-center justify-between py-6 px-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <LuChurch className="text-white text-2xl" />
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">churchset</h1>
              <span className="text-xs text-gray-500 -mt-0.5">Rad5 Venture</span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            className="text-gray-500 hover:text-gray-700 lg:hidden"
            onClick={toggleSidebar}
          >
            <MdOutlineClose className="text-2xl" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {[
              { to: "/admin-dashboard", icon: LuLayoutDashboard, label: "Dashboard" },
              { to: "/admin-manage/churches", icon: LuChurch, label: "Manage Churches" },
              { to: "/billing/subscriptions", icon: LuCreditCard, label: "Subscriptions & Plans" },
              { to: "/admin-activations", icon: LuCircleCheck, label: "Activation Center" },
              { to: "/admin-supports", icon: LuMessageCircleQuestion, label: "Support Center" },
              { to: "/logs", icon: LuHistory, label: "Activity Logs" },
              { to: "/settings", icon: LuSettings, label: "Settings" },
            ].map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 font-medium px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? "text-white shadow-md bg-gradient-to-br from-purple-500 to-indigo-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="text-xl flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;