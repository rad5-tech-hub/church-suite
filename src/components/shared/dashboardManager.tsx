import React, { useState, useEffect } from "react";
import { Box, CssBaseline, Fab, Tooltip, IconButton, Paper, Typography } from "@mui/material";
import { Share as ShareIcon, Close } from "@mui/icons-material";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";
import ShareModal from "./share/sharemodal";
import { useLocation } from "react-router-dom";

interface DashboardManagerProps {
  children: React.ReactNode;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showTooltipPopup, setShowTooltipPopup] = useState(false);
  const location = useLocation();
  const hiddenSidebarPaths = ["/dashboard", "/reports", "/programs", "/settings", "/profile"];

  const hideSidebar = hiddenSidebarPaths.includes(location.pathname);

  // Check if tooltip has been dismissed in this session
  useEffect(() => {
    const tooltipDismissed = sessionStorage.getItem("shareTooltipDismissed");
    if (!tooltipDismissed) {
      // Show tooltip after 2 seconds
      const timer = setTimeout(() => {
        setShowTooltipPopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseTooltip = () => {
    setShowTooltipPopup(false);
    sessionStorage.setItem("shareTooltipDismissed", "true");
  };

  const handleShareClick = () => {
    setShowTooltipPopup(false);
    sessionStorage.setItem("shareTooltipDismissed", "true");
    setIsShareModalOpen(true);
  };

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
              position: "relative",
            }}
          >
            {children}
          </Box>
        </Box>

        {/* Informative Tooltip Popup */}
        {showTooltipPopup && (
          <Box
            sx={{
              position: "fixed",
              bottom: { xs: 160, md: 100 },
              right: { xs: 16, md: 24 },
              zIndex: 1001,
            }}
          >
            <Paper
              sx={{
                position: "relative",
                maxWidth: 280,
                p: 2,
                backgroundColor: "var(--color-surface)",
                borderRadius: 2,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                animation: "pulseBox 2s ease-in-out infinite, slideInRight 0.5s ease-out",
                "@keyframes slideInRight": {
                  from: {
                    opacity: 0,
                    transform: "translateX(20px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateX(0)",
                  },
                },
                "@keyframes pulseBox": {
                  "0%, 100%": {
                    transform: "scale(1)",
                  },
                  "50%": {
                    transform: "scale(1.03)",
                  },
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Typography
                  sx={{
                    color: "var(--color-text-primary)",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    pr: 1,
                  }}
                >
                  💡 Share ChurchSet!
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleCloseTooltip}
                  sx={{
                    color: "var(--color-text-muted)",
                    padding: "2px",
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Typography
                sx={{
                  color: "var(--color-text-muted)",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                }}
              >
                Love ChurchSet? Help other churches discover us by sharing with fellow ministry leaders!
              </Typography>

              {/* Arrow Pointer */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: { xs: -12, md: -10 },
                  right: { xs: 18, md: 20 },
                  width: 0,
                  height: 0,
                  borderLeft: "12px solid transparent",
                  borderRight: "12px solid transparent",
                  borderTop: "12px solid var(--color-surface)",
                  animation: "bounce 1.5s ease-in-out infinite",
                  "@keyframes bounce": {
                    "0%, 100%": {
                      transform: "translateY(0)",
                    },
                    "50%": {
                      transform: "translateY(-5px)",
                    },
                  },
                }}
              />
            </Paper>
          </Box>
        )}

        {/* Floating Share Button with Glow Effect */}
        <Tooltip title="Share ChurchSet with others" placement="left" arrow>
          <Fab
            color="primary"
            onClick={handleShareClick}
            sx={{
              position: "fixed",
              bottom: { xs: 90, md: 24 },
              right: { xs: 16, md: 24 },
              backgroundColor: "var(--color-text-primary)",
              color: "var(--color-primary)",
              width: { xs: 50, md: 60 },
              height: { xs: 50, md: 60 },
              boxShadow: showTooltipPopup
                ? "0 0 0 0 rgba(54, 55, 64, 1)"
                : "0 4px 20px rgba(0, 0, 0, 0.3)",
              "&:hover": {
                backgroundColor: "#363740",
                transform: "scale(1.05)",
              },
              transition: "all 0.3s ease",
              zIndex: 1000,
              animation: showTooltipPopup ? "pulse 2s infinite" : "none",
              "@keyframes pulse": {
                "0%": {
                  boxShadow: "0 0 0 0 rgba(54, 55, 64, 0.7)",
                },
                "70%": {
                  boxShadow: "0 0 0 20px rgba(54, 55, 64, 0)",
                },
                "100%": {
                  boxShadow: "0 0 0 0 rgba(54, 55, 64, 0)",
                },
              },
            }}
          >
            <ShareIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
          </Fab>
        </Tooltip>

        {/* Share Modal */}
        <ShareModal
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      </Box>
    </>
  );
};

export default DashboardManager;