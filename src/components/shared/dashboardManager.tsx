import React, { useState } from "react";
import { Box, CssBaseline } from "@mui/material";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";

// Interface for component props
interface DashboardManagerProps {
  children: React.ReactNode;
}

// Component Code
const DashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          height: "100vh", // Full viewport height
          bgcolor: "#f5f5f5", // Equivalent to bg-gray-100
          overflow: "hidden", // Prevent body overflow
        }}
      >
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100vh", // Ensure it takes full height
            overflow: "hidden", // Prevent overflow in this container
          }}
        >
          {/* Header */}
          <Header toggleSidebar={toggleSidebar} />

          {/* Dynamic Body */}
          <Box
            component="main"
            sx={{
              flex: 1,
              p: { xs: 2, sm: 3 },
              overflowY: "auto", // Scroll only this area
              bgcolor: "#f5f5f5", // Match background
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default DashboardManager;