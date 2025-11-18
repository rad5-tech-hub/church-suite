import React, { useState } from "react";
import { Box, CssBaseline } from "@mui/material";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";
import { useLocation } from "react-router-dom";

// Interface for component props
interface DashboardManagerProps {
  children: React.ReactNode;
}

// Component Code
const DashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Check if current path is '/dashboard'
  const isDashboardPath = location.pathname === '/dashboard';

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",             // ✅ allow children to define full height
          background: "linear-gradient(135deg, #0d1421 0%, #1a1a2e 20%, #16213e 40%, #201339 80%, #533483 105%, #201339 200%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",           // ✅ allows scrolling
          }}
        >
          <Header toggleSidebar={toggleSidebar} />

          <Box sx={{ display: "flex", flex: 1 }}>
            {!isDashboardPath && (
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Sidebar />
              </Box>
            )}

            <Box
              component="main"
              sx={{
                flex: 1,
                p: { xs: 1, sm: 1 },
                pb: { xs: "84px", sm: "92px", md: "24px" },
                overflowY: "auto",          // ✅ ONLY the main content scrolls
                backgroundColor: "var(--color-primary)", // ✅ use CSS var properly
                borderRadius: 2,            // optional: if you want separation
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default DashboardManager;