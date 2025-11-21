import React, { useState } from "react";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";

interface DashboardManagerProps {
  children: React.ReactNode;
}

const AdminDashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden"> {/* ← 1. Critical: Block all overflow at root */}
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden"> {/* ← 2. Also block here */}
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Page Content - This is the only place that should scroll vertically */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <div className="p-6"> {/* ← Move padding here so it doesn't cause overflow */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardManager;