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
  Tooltip,
} from "@mui/material";
import { 
  Phone as PhoneIcon, 
  Email as EmailIcon, 
  WhatsApp as WhatsAppIcon,
  ArrowBack,
} from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { useNavigate, useParams } from "react-router-dom";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import DashboardManager from "../../../shared/dashboardManager";

interface Member {
  id: string;
  name: string;
  address: string;
  whatappNo: string;
  phoneNo: string;
  sex: string;
  birthMonth: string;
  birthDay: string;
  ageFrom: number;
  ageTo: number;
  state: string;
  LGA: string;
  nationality: string;
  maritalStatus: string;
  memberFor: number;
  branchId: string | null;
  isActive: boolean;
  email?: string;
  profilePicture?: string;
  memberSince?: string;
}

const ViewSingleMember: React.FC = () => {
  const  navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const response = await Api.get(`/member/a-member/${memberId}`);
        setMember(response.data.member);
      } catch (err) {
        console.error("Failed to fetch member data:", err);
        setError("Failed to load member data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

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
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#777280]"></div>
        </Box>
      </DashboardManager>
    );
  }

  if (error || !member) {
    return (
      <DashboardManager>
        <Box sx={{ textAlign: "center", py: 4 }}>          
            <Box sx={{ 
                textAlign: "center", 
                py: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: 'gray.300'
              }}>
                <EmptyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
                <Typography 
                  variant="h6" 
                   
                  gutterBottom
                  sx={{
                    fontSize: '1.25rem'
                  }}
                >
                    Member not found!
                </Typography>
                {error ? (
                  <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                ) : null}
                <Button
                  variant="contained"
                  onClick={() => navigate("/manage/view-members")}       
                  sx={{
                    backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                    px: { xs: 2, sm: 2 }, 
                    color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                    mt: 2,
                    fontSize: '0.875rem',
                    "&:hover": {
                      backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                      opacity: 0.9, // Add hover effect
                    },
                  }}
                >
                  View All Members
                </Button>
            </Box>
        </Box>
      </DashboardManager>
    );
  }

  const getYearsOfMembership = () => {
    if (member.memberFor) return `${member.memberFor} years`;
    if (member.memberSince) {
      const joinDate = new Date(member.memberSince);
      const today = new Date();
      const years = today.getFullYear() - joinDate.getFullYear();
      return years > 0 ? `${years} years` : "Less than a year";
    }
    return "N/A";
  };

  // Parse address into components
  const addressParts = member.address?.split('\n') || [];
  const cityState = addressParts[1]?.split(',') || [];
  const city = cityState[0] || '';
  const stateFromAddress = cityState[1] || '';

  return (
    <DashboardManager>
      <Container>
        <Box sx={{ py: 2, mx: "auto",
         }}>
          <Grid container spacing={2} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography 
                variant="h5"
                component="h1" 
                fontWeight={600}
                gutterBottom
                
                sx={{ 
                  color: "#E1E1E1", // Ensure text color is set correctly
                }}
              >
                Member's Profile
              </Typography>
              <Typography 
                variant="body2" 
                color="#E1E1E1"
                sx={{
                  fontSize: isLargeScreen ? '0.875rem' : undefined
                  
                }}
              >
                View and manage your profile information.
              </Typography>
            </Grid>
            <Grid 
                size={{xs:12, md:4}}
                sx={{ 
                  display: 'flex', 
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  alignItems: 'center'
                }}
              >
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)} // go back one page
                size="medium"
                sx={{
                  backgroundColor: "var(--color-primary)",
                  borderRadius: 1,
                  fontWeight: 500,
                  textTransform: "none",
                  fontSize: isLargeScreen ? "1rem" : undefined,
                  color: "var(--color-text-on-primary)",
                  "&:hover": {
                    backgroundColor: "var(--color-primary)",
                    opacity: 0.9,
                  },
                }}
              >
                Back
              </Button>
            </Grid>
          </Grid>

          <Box>
            <Box sx={{ mb: 4, backgroundColor: "rgba(255, 255, 255, 0.06)",
              boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
              borderRadius: 2,
              p: 2,
            }}>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Avatar
                    src={member.profilePicture || ""}
                    alt={member.name}
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
                      color: '#E1E1E1',
                      fontSize: isLargeScreen ? '1.4rem' : undefined
                    }}
                  >
                    {member.name}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    
                    sx={{ 
                      textAlign: { xs: 'center', sm: 'left' },
                      color: '#E1E1E1',
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}
                  >
                    {member.sex === "male" ? "Male" : "Female"} • {member.ageFrom}-{member.ageTo} years
                  </Typography>
                  <Typography 
                    variant="body1" 
                    
                    sx={{ 
                      textAlign: { xs: 'center', sm: 'left' },
                      color: '#777280',
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}
                  >
                    {city}, {stateFromAddress || member.state}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4, backgroundColor: "rgba(255, 255, 255, 0.06)",
              boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
              borderRadius: 2,
              p: 2}}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2,color: '#E1E1E1'}}>
                Personal Information
              </Typography>
              
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3 ,  color: '#E1E1E1'}}>
                    <Typography variant="subtitle2">
                      Full Name
                    </Typography>
                    <Typography variant="body1">
                      {member.name|| "N/A"}
                    </Typography>
                  </Box>                              
                  
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2">
                      Gender
                    </Typography>
                    <Typography variant="body1">
                      {member.sex === "male" ? "Male" : "Female"}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2">
                      Phone Number
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PhoneIcon sx={{ mr: 1, fontSize: "1rem" }} />
                      <Typography variant="body1">
                        {member.phoneNo || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2" >
                      WhatsApp
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <WhatsAppIcon sx={{ mr: 1, color: "#25D366", fontSize: "1rem" }} />
                      <Typography variant="body1">
                        {member.whatappNo || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {member.email && (
                    <Box sx={{ mb: 3,  color: '#E1E1E1' }}>
                      <Typography variant="subtitle2">
                        Email Address
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EmailIcon sx={{ mr: 1, color: "#1f2937", fontSize: "1rem" }} />
                        <Typography variant="body1">
                          {member.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4, backgroundColor: "rgba(255, 255, 255, 0.06)",
              boxShadow: "0 1.272px 15.267px 0 rgba(0, 0, 0, 0.05)",
              borderRadius: 2,
              p: 2}}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#E1E1E1' }}>
                Address
              </Typography>
              
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2" >
                      Street Address
                    </Typography>
                    <Typography variant="body1">
                        <Tooltip title={member.address && member.address.length > 30 ? member.address : ""} placement="top" arrow>
                          <span>{member.address && member.address.length > 30 ? `${member.address.slice(0, 30)}...` : member.address || "N/A"}</span>
                        </Tooltip>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2" >
                      City
                    </Typography>
                    <Typography variant="body1">
                      {city || "N/A"}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2" >
                      State
                    </Typography>
                    <Typography variant="body1">
                      {stateFromAddress || member.state || "N/A"}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2" >
                      Country
                    </Typography>
                    <Typography variant="body1">
                      {member.nationality || "Nigeria"}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2" >
                      Marital Status
                    </Typography>
                    <Typography variant="body1">
                      {member.maritalStatus || "N/A"}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3, color: '#E1E1E1' }}>
                    <Typography variant="subtitle2" >
                      Years of Membership
                    </Typography>
                    <Typography variant="body1">
                      {getYearsOfMembership()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid> 
            </Box>           
          </Box>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default ViewSingleMember;