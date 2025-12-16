import React, { useState } from "react";
import { Box, CssBaseline } from "@mui/material";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";
import { useLocation } from "react-router-dom";

interface DashboardManagerProps {
  children: React.ReactNode;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const hiddenSidebarPaths = ["/dashboard", "/reports", "/programs", "/settings","/profile"];

  const hideSidebar = hiddenSidebarPaths.includes(location.pathname);

  return (
    <>
      <CssBaseline />

      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0d1421 0%, #1a1a2e 20%, #16213e 40%, #201339 80%, #533483 105%, #201339 200%)",
        }}
      >
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
          
          {!hideSidebar && (
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Sidebar />
            </Box>
          )}

          <Box
            component="main"
            sx={{
              flex: 1,
              p: { xs: 1, sm: 1 },
              pb: { xs: "80px", sm: "90px", md: "24px" },
              overflowY: "auto",
              backgroundColor: "var(--color-primary)",
              borderRadius: 2,
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
