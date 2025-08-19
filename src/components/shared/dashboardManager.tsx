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
          height: "100vh", // Full viewport height
         background: "linear-gradient(135deg, #0d1421 0%, #1a1a2e 20%, #16213e 40%, #201339 80%, #533483 105%, #201339 200%)",
          overflow: "hidden", // Prevent body overflow
        }}
      >        

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
            sx={{            
              display: "flex",              
              flex: 1, // Take remaining height after header
              overflow: "hidden", // Prevent overflow in this container
            }}>

            {/* Sidebar */}
            {!isDashboardPath && (
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Sidebar />
              </Box>
            )}
            
            <Box
              component="main"
              sx={{
                flex: 1,
                p: { xs: 2, sm: 3 },
                pb: { xs: '84px', sm: '92px', md: '24px' },
                overflowY: "auto", // Scroll only this area
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