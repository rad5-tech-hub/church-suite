import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Avatar, 
  Grid, 
  Button, 
  Divider,
  Container,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { 
  Phone as PhoneIcon, 
} from "@mui/icons-material";
import { IoArrowRedoOutline } from "react-icons/io5";
import Api from "../../../shared/api/api";
import { useNavigate, useParams } from "react-router-dom";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import DashboardManager from "../../../shared/dashboardManager";

interface followUp {
  id: string;
  name: string;
  address: string;
  phoneNo: string;
  sex: string;
  timer: number;
  birthMonth: string;
  birthDay: string;
  profilePicture?: string;
}

const ViewSingleFollowUp: React.FC = () => {
  const  navigate = useNavigate();
  const { followUpId } = useParams<{ followUpId: string }>();
  const [followUp, setfollowUp] = useState<followUp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    const fetchfollowUp = async () => {
      try {
        setLoading(true);
        const response = await Api.get(`/member/get-a-follow-up/${followUpId}`);
        setfollowUp(response.data.data);
      } catch (err) {
        console.error("Failed to fetch followUp data:", err);
        setError("Failed to load followUp data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchfollowUp();
  }, [followUpId]);

  if (loading) {
    return (
      <DashboardManager>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center", // Center the spinner vertically
            py: 4,
            minHeight: "100vh", // Ensure full screen height
          }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
        </Box>
      </DashboardManager>
    );
  }

  if (error || !followUp) {
    return (
      <DashboardManager>
        <Box sx={{ textAlign: "center", py: 4 }}>          
            <Box sx={{ 
                textAlign: "center", 
                py: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <EmptyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
                <Typography 
                  variant="h6" 
                  color="textSecondary" 
                  gutterBottom
                  sx={{
                    fontSize: '1.25rem'
                  }}
                >
                   This New Comer not found!
                </Typography>
                {error ? (
                  <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                ) : null}
                <Button
                  variant="contained"
                  onClick={() => navigate("/view/followup")}       
                  sx={{
                    backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                    px: { xs: 2, sm: 2 }, 
                    mt: 2,
                    fontSize: '0.875rem',
                    color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                    "&:hover": {
                      backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                      opacity: 0.9, // Add hover effect
                    },
                  }}
                >
                  View All New Comers
                </Button>
            </Box>
        </Box>
      </DashboardManager>
    );
  }
 

  return (
    <DashboardManager>
      <Container>
        <Box sx={{ py: 2, mx: "auto" }}>
          <Grid container spacing={2} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography 
                variant={isMobile ? "h5" : isLargeScreen ? "h5" : "h4"}
                component="h1" 
                fontWeight={600}
                gutterBottom
                sx={{ 
                  color: theme.palette.text.primary,
                  fontSize: isLargeScreen ? '1.7rem' : undefined
                }}
              >
                A New Comer Profile
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: isLargeScreen ? '0.875rem' : undefined
                }}
              >
                View and manage your profile information.
              </Typography>
            </Grid>
            <Grid 
              size={{ xs: 12, md: 4 }} 
              sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                alignItems: 'center'
              }}
            >
              <Button
                variant="contained"
                startIcon={<IoArrowRedoOutline/>}
                onClick={() =>{navigate('/view/followup')}}
                size="medium"
                sx={{
                  backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable               
                  borderRadius: 1,
                  fontWeight: 500,
                  textTransform: "none",
                  color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                  fontSize: isLargeScreen ? '1rem' : undefined,
                  "&:hover": {
                    backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                    opacity: 0.9, // Add hover effect
                  },
                }}
              >
                Move To Worker
              </Button>
            </Grid>
          </Grid>

          <Box>
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Avatar
                    src={followUp.profilePicture || ""}
                    alt={followUp.name}
                    sx={{ 
                      width: 100, 
                      height: 100,
                      mx: { xs: 'auto', sm: 0 }, // Center on mobile, left align on larger screens
                      mb: { xs: 1, sm: 0 } // Add bottom margin only on mobile
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ 
                      textAlign: { xs: 'center', sm: 'left' },
                      fontSize: isLargeScreen ? '1.5rem' : undefined
                    }}
                  >
                    {followUp.name}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="textSecondary"
                    sx={{ 
                      textAlign: { xs: 'center', sm: 'left' },
                      fontSize: isLargeScreen ? '0.875rem' : undefined,
                      display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, alignItems: 'center'
                    }}
                  >
                    {followUp.sex === "male" ? "Male" : "Female"} • 
                    <Box>
                        <Box
                            sx={{
                                width: 15,
                                height: 15,
                                borderRadius: 1,
                                bgcolor:
                                followUp.timer === 1
                                    ? "warning.main"
                                    : followUp.timer === 2
                                    ? "primary.main"
                                    : "success.main", // Dynamically set the background color
                            }}
                        />
                    </Box> {followUp.timer} {followUp.timer > 1 ? 'Times' : 'Time'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Personal Information
            </Typography>
            
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1">
                    {followUp.name|| "N/A"}
                  </Typography>
                </Box>                              
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Gender
                  </Typography>
                  <Typography variant="body1">
                    {followUp.sex === "male" ? "Male" : "Female"}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Phone Number
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PhoneIcon sx={{ mr: 1, color: "var(--color-primary)", fontSize: "1rem" }} />
                    <Typography variant="body1">
                      {followUp.phoneNo || "N/A"}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Birth Date
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body1">
                            {followUp.birthDay} - {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][parseInt(followUp.birthMonth, 10) - 1] || "N/A"}
                        </Typography>
                    </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Address
                        </Typography>
                        <Typography variant="body1">                      
                            {followUp.address || ""}
                        </Typography>
                    </Box>              
               </Grid>
            </Grid>
            
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default ViewSingleFollowUp;