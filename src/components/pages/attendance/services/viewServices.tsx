import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { RootState } from "../../../reduxstore/redux";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  recurrenceType: string;
}

interface Pagination {
  hasNextPage: boolean;
  nextCursor: string | null;
  nextPage: string | null;
}

const ViewServices: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<Pagination>({
    hasNextPage: false,
    nextCursor: null,
    nextPage: null,
  });
  const navigate = useNavigate();
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await Api.get("/church/get-events");
        setEvents(response.data.events || []);
        setPagination(response.data.pagination || { hasNextPage: false, nextCursor: null, nextPage: null });
      } catch (error) {
        console.error("Failed to fetch events:", error);
        toast.error("Failed to fetch events. Please try again.", {
          autoClose: 3000,
          position: isMobile ? "top-center" : "top-right",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Handle pagination (load more events)
  const handleLoadMore = async () => {
    if (!pagination.nextPage) return;
    setLoading(true);
    try {
      const response = await Api.get(pagination.nextPage);
      setEvents((prev) => [...prev, ...(response.data.events || [])]);
      setPagination(response.data.pagination || { hasNextPage: false, nextCursor: null, nextPage: null });
    } catch (error) {
      console.error("Failed to load more events:", error);
      toast.error("Failed to load more events. Please try again.", {
        autoClose: 3000,
        position: isMobile ? "top-center" : "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to attendance form
  const handleRecordAttendance = (eventId: string) => {
    navigate(`/manage/attendance?eventId=${eventId}`);
  };

  return (
    <DashboardManager>
      <Container sx={{ py: isMobile ? 2 : 3 }}>
        {/* Header Section */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 9 }}>
            <Typography
              variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
              component="h1"
              fontWeight={600}
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontSize: isLargeScreen ? "1.5rem" : undefined,
              }}
            >
              View Events
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isLargeScreen ? "0.8125rem" : undefined,
              }}
            >
              View events for {authData?.church_name || "your church"}.
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 12, md: "grow" }}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/manage/attendance")}
              size="medium"
              sx={{
                backgroundColor: "var(--color-primary)",
                px: { xs: 2, sm: 2 },
                py: 1,
                borderRadius: 1,
                fontWeight: "semibold",
                color: "var(--color-text-on-primary)",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
              }}
            >
              Record Attendance
            </Button>
          </Grid>
        </Grid>

        {/* Events Table */}
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table sx={{ minWidth: isMobile ? 300 : 650 }} aria-label="events table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", fontSize: isLargeScreen ? "1rem" : undefined }}>
                  Title
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: isLargeScreen ? "1rem" : undefined }}>
                  Description
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: isLargeScreen ? "1rem" : undefined }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: isLargeScreen ? "1rem" : undefined }}>
                  Recurrence
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: isLargeScreen ? "1rem" : undefined }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !events.length ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No events found.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      {event.title}
                    </TableCell>
                    <TableCell sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      {event.description}
                    </TableCell>
                    <TableCell sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      {new Date(event.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: isLargeScreen ? "0.875rem" : undefined }}>
                      {event.recurrenceType}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleRecordAttendance(event.id)}
                        sx={{
                          textTransform: "none",
                          fontSize: isLargeScreen ? "0.875rem" : undefined,
                          borderColor: "var(--color-primary)",
                          color: "var(--color-primary)",
                          "&:hover": {
                            borderColor: "var(--color-primary)",
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        Record Attendance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Load More Button */}
        {pagination.hasNextPage && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleLoadMore}
              disabled={loading}
              sx={{
                py: 1,
                px: { xs: 2, sm: 3 },
                borderRadius: 1,
                fontWeight: "semibold",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                textTransform: "none",
                fontSize: { xs: "1rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </Box>
        )}
      </Container>
    </DashboardManager>
  );
};

export default ViewServices;