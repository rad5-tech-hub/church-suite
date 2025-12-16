import React, { useEffect, useState } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import {
  Box,
  Button,
  Typography,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Chat } from "@mui/icons-material";
import MessageModal from "../createMessage/message";
import Api from "../../../shared/api/api";

interface ChurchData {
  name: string;
  smsActive: boolean;
  branch: Array<{ id: string; name: string; isHq: boolean }>;
}

const ViewSms: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [church, setChurch] = useState<ChurchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch church data
  useEffect(() => {
    const fetchChurch = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await Api.get<{ message: string; data: ChurchData }>("/church/get-church");
        setChurch(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load church data");
      } finally {
        setLoading(false);
      }
    };

    fetchChurch();
  }, []);

  const churchName = church?.name || "your church";
  const smsActive = church?.smsActive === true;

  const tooltipMessage = `Please wait — SMS setup for **${churchName}** is in progress. It will be ready within 2 working days of church creation.`;

  const EmptyState = () => (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Chat sx={{ fontSize: 60, color: "rgba(255, 255, 255, 0.1)" }} />
      <Typography
        variant="h6"
        color="rgba(255, 255, 255, 0.6)"
        sx={{ fontSize: isLargeScreen ? "1.25rem" : "1.1rem", fontWeight: 500 }}
      >
        Message History Pending
      </Typography>

      <Tooltip title={<span dangerouslySetInnerHTML={{ __html: tooltipMessage }} />} placement="bottom" arrow>
        <span>
          <Button
            variant="contained"
            onClick={() => smsActive && setIsModalOpen(true)}
            disabled={!smsActive}
            sx={{
              backgroundColor: "#363740",
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: 50,
              fontWeight: 500,
              textTransform: "none",
              color: "var(--color-text-on-primary)",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
              "&.Mui-disabled": {
                backgroundColor: "#4d4d4e8e",
                color: "#777280",
              },
            }}
          >
            Send SMS Message
          </Button>
        </span>
      </Tooltip>
    </Box>
  );

  if (loading) {
    return (
      <DashboardManager>
        <Box sx={{ py: 8, textAlign: "center" }}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#F6F4FE] mx-auto"></div>
        </Box>
      </DashboardManager>
    );
  }

  if (error) {
    return (
      <DashboardManager>
        <Box sx={{ py: 8, textAlign: "center", color: "#EF4444" }}>
          <Typography>{error}</Typography>
        </Box>
      </DashboardManager>
    );
  }

  return (
    <DashboardManager>
      <Box sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, minHeight: "100%" }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h3"
              fontWeight={600}
              sx={{
                color: "#F6F4FE",
                fontSize: { xs: "1.3rem", sm: "1.5rem" },
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Message Histories
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-end", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Tooltip title={<span dangerouslySetInnerHTML={{ __html: tooltipMessage }} />} placement="left" arrow>
              <span>
                <Button
                  variant="contained"
                  onClick={() => smsActive && setIsModalOpen(true)}
                  disabled={!smsActive}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    backgroundColor: "#363740",
                    px: { xs: 2.5, sm: 3 },
                    py: 1,
                    borderRadius: 50,
                    fontWeight: 500,
                    textTransform: "none",
                    color: "var(--color-text-on-primary)",
                    minWidth: { xs: "140px", sm: "180px" },
                    "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
                    "&.Mui-disabled": {
                      backgroundColor: "#4d4d4e8e",
                      color: "#777280",
                    },
                  }}
                >
                  Send SMS Message
                </Button>
              </span>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Empty State */}
        <EmptyState />

        {/* Modal */}
        <MessageModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </Box>
    </DashboardManager>
  );
};

export default ViewSms;