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
      <Chat sx={{ fontSize: 60, color: "var(--color-text-muted)" }} />
      <Typography
        variant="h6"
        color="var(--color-text-primary)"
        sx={{ fontSize: isLargeScreen ? "1.25rem" : "1.1rem", fontWeight: 500 }}
      >
        Message History Pending
      </Typography>

      {smsActive && (
        <Typography
          variant="body2"
          sx={{
            color: "var(--color-text-muted)",          
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          {churchName}
        </Typography>
      )}

      <Tooltip
        title={<span dangerouslySetInnerHTML={{ __html: tooltipMessage }} />}
        placement="left"
        arrow
        disableHoverListener={smsActive}
        disableFocusListener={smsActive}
        disableTouchListener={smsActive}
      >
        <span>
          <Button
            variant="contained"
            onClick={() => smsActive && setIsModalOpen(true)}
            disabled={!smsActive}
            sx={{
              backgroundColor: "var(--color-text-primary)",
              px: { xs: 3, sm: 4 },
              py: 1.2,
              borderRadius: 50,
              fontWeight: 500,
              textTransform: "none",
              color: "var(--color-primary)",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              "&:hover": { backgroundColor: "#363740", opacity: 0.9 },
              "&.Mui-disabled": {
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-muted)",
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-text-muted)] mx-auto"></div>
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
                color: "var(--color-text-primary)",
                fontSize: { xs: "1.3rem", sm: "1.5rem" },
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Message Histories
              {smsActive && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    fontWeight: 400,
                    color: "var(--color-text-muted)",
                    ml: 1,
                  }}
                >
                  - {churchName}
                </Typography>
              )}
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
            <Tooltip
              title={<span dangerouslySetInnerHTML={{ __html: tooltipMessage }} />}
              placement="left"
              arrow
              disableHoverListener={smsActive}
              disableFocusListener={smsActive}
              disableTouchListener={smsActive}
            >
              <span>
                <Button
                  variant="contained"
                  onClick={() => smsActive && setIsModalOpen(true)}
                  disabled={!smsActive}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    backgroundColor: "var(--color-text-primary)",
                    px: { xs: 2.5, sm: 3 },
                    py: 1,
                    borderRadius: 50,
                    fontWeight: 500,
                    textTransform: "none",
                    color: "var(--color-primary)",
                    minWidth: { xs: "140px", sm: "180px" },
                    "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
                    "&.Mui-disabled": {
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text-muted)",
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