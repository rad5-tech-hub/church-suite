import React from "react";
import { Link, useLocation } from "react-router-dom";
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
      {/* Sidebar - Supports Light & Dark Mode */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 flex flex-col shadow-xl transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-all duration-300 lg:translate-x-0 lg:static z-40
          bg-white dark:bg-gray-900 
          text-gray-800 dark:text-gray-100
          border-r border-gray-200 dark:border-gray-800`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between py-6 px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <LuChurch className="text-white text-2xl" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">churchset</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                Rad5 Venture
              </span>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 lg:hidden"
          >
            <MdOutlineClose className="text-2xl" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {[
              { to: "/admin-dashboard", icon: LuLayoutDashboard, label: "Dashboard" },
              { to: "/manage/churches", icon: LuChurch, label: "Manage Churches" },
              { to: "/billing/subscriptions", icon: LuCreditCard, label: "Subscriptions & Plans" },
              { to: "/activation", icon: LuCircleCheck, label: "Activation Center" },
              { to: "/support", icon: LuMessageCircleQuestion, label: "Support Center" },
              { to: "/logs", icon: LuHistory, label: "Activity Logs" },
              { to: "/settings", icon: LuSettings, label: "Settings" },
            ].map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 font-medium px-4 py-3 rounded-xl transition-all duration-200
                      ${
                        active
                          ? "text-white shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
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
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;