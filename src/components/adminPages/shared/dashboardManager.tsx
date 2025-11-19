import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";
import { LuMoon, LuSun } from "react-icons/lu";

interface DashboardManagerProps {
  children: React.ReactNode;
}

const AdminDashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newMode;
    });
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      {/* Global Dark Mode Tailwind Support */}
      <div className={`flex h-screen ${isDarkMode ? "dark" : ""}`}>
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          {/* Header */}
          <Header toggleSidebar={toggleSidebar} />

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {children}
          </main>
        </div>
      </div>

      {/* Theme Toggle Button - Fixed Bottom Right */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-4 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 hover:scale-110 transition-all duration-300"
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <LuSun className="w-6 h-6 text-yellow-500" />
        ) : (
          <LuMoon className="w-6 h-6 text-indigo-600" />
        )}
      </button>
    </>
  );
};

export default AdminDashboardManager;