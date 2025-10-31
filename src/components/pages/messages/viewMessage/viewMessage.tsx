import React, { useState } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import {
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import MessageModal from "../createMessage/message";
import { Chat } from "@mui/icons-material";

const ViewBranches: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [isModalOpen, setIsModalOpen] = useState(false);

  const EmptyState = () => (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Chat style={{ fontSize: 60, color: "rgba(255, 255, 255, 0.1)", marginBottom: 16 }} />
      <Typography
        variant="h6"
        color="rgba(255, 255, 255, 0.6)"
        gutterBottom
        sx={{
          fontSize: isLargeScreen ? "1.25rem" : undefined,
        }}
      >
        Message History Pending
      </Typography>
      <Button
        variant="contained"
        onClick={() => setIsModalOpen(true)}
        sx={{
          backgroundColor: "#363740",
          px: { xs: 2, sm: 2 },
          mt: 2,
          fontSize: isLargeScreen ? "0.875rem" : undefined,
          color: "var(--color-text-on-primary)",
          "&:hover": {
            backgroundColor: "#363740",
            opacity: 0.9,
          },
        }}
        aria-label="Send new messages"
      >
        Send Messages
      </Button>
    </Box>
  );

  return (
    <DashboardManager> 
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h3" : "h5"}
              component="h3"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.5rem" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span className="text-[#F6F4FE]"> Message Histories</span>
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-end", md: "flex-end" },
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={() => setIsModalOpen(true)}
              size="medium"
              sx={{
                backgroundColor: "#363740",
                px: { xs: 2, sm: 3 },
                py: 1,
                borderRadius: 50,
                fontWeight: 500,
                textTransform: "none",
                color: "var(--color-text-on-primary)",
                fontSize: isLargeScreen ? "1rem" : undefined,
                "&:hover": {
                  backgroundColor: "#363740",
                  opacity: 0.9,
                },
              }}
            >
              Send SMS Message
            </Button>
          </Grid>
        </Grid>

        <EmptyState />

        <MessageModal 
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </Box>
    </DashboardManager>
  );
};

export default ViewBranches;