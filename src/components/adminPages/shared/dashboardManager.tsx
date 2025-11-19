import React, { useState } from "react";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";

interface DashboardManagerProps {
  children: React.ReactNode;
}

const AdminDashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Dynamic Body */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminDashboardManager;