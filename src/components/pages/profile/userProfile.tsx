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
  Email as EmailIcon, 
  ArrowBack
} from "@mui/icons-material";
import DashboardManager from "../../shared/dashboardManager";
import { useSelector} from "react-redux";
import { RootState } from "../../reduxstore/redux";
import axios from "axios";
import Api from "../../shared/api/api";
import { useNavigate } from "react-router-dom";

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profilePicture?: string;
  createdAt?: string;
  isSuperAdmin?: boolean;
  church_name?: string;
  logo?: string;
  backgroundImg?: string;
  branches?: Branch[];
}

interface Branch{
  id: string;
  name: string;
}

const ViewAdmin: React.FC = () => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (authData) {
          const adminData: Admin = {
            id: authData.id,
            name: authData.name || '',
            email: authData.email,
            phone: '', // Add phone number if available in your auth data
            role: authData.isSuperAdmin ? 'Super Admin' : 'Admin',
            profilePicture: authData.logo, // Using logo as profile picture
            createdAt: new Date(authData.iat * 1000).toISOString(), // Convert iat to ISO string
            isSuperAdmin: authData.isSuperAdmin,
            church_name: authData.church_name,
            logo: authData.logo,
            backgroundImg: authData.backgroundImg
          };
          setAdmin(adminData); 
        } else {
          setError("No admin data available");
        }
        if (authData?.id) {
          setLoading(true);
          const response = await Api.get(`/church/an-admin/${authData.id}`); // Fetch admin data using the ID
          const adminData: Admin = response.data.admin;
          setAdmin({
            id: adminData.id,
            name: adminData.name || '',
            email: adminData.email,
            phone: adminData.phone || '',
            branches: adminData.branches,
            role: adminData.isSuperAdmin ? 'Super Admin' : 'Admin',
            profilePicture: adminData.profilePicture || adminData.logo, // Use profilePicture or fallback to logo
            createdAt: adminData.createdAt || new Date().toISOString(),
            isSuperAdmin: adminData.isSuperAdmin,
            church_name: adminData.church_name,
            logo: adminData.logo,
            backgroundImg: adminData.backgroundImg,
          });
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to parse admin data");
        setError(
          (axios.isAxiosError(err) && err.response?.data?.message) || "Failed to fetch admin data"
        );
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [authData]);

  const getAdminSince = () => {
    if (admin?.createdAt) {
      const joinDate = new Date(admin.createdAt);
      return joinDate.toLocaleDateString();
    }
    return "N/A";
  };

  if (loading) {
    return (
      <DashboardManager>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
            minHeight: "100vh",
          }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-gray-600"></div>
        </Box>
      </DashboardManager>
    );
  }

  if (error) {
    return (
      <DashboardManager>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Box>
      </DashboardManager>
    );
  }

  if (!admin) {
    return (
      <DashboardManager>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="gray">
            No admin data available.
          </Typography>
        </Box>
      </DashboardManager>
    );
  }

  return (
    <DashboardManager>
      <Container>
        <Box sx={{ py: 3, mx: "auto" }}>
          <Grid container spacing={2} sx={{ mb: 5 }}>
            <Grid size={{xs:12, md:8}}>
              <Typography 
                variant="h5"
                component="h1" 
                fontWeight={600}
                gutterBottom
                sx={{ 
                  color: '#f6f4fe',
                }}
              >
                Admin Profile
              </Typography>
              <Typography 
                variant="body2" 
                color="gray"
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
            <Box 
              sx={{ 
                mb: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                paddingY: 4,
                paddingX: 2,
                borderRadius: 2,
              }}
            >
              <Avatar
                src={admin.profilePicture || ""}
                alt={admin.name}
                sx={{ width: 100, height: 100, mb: 1 }}
              />
              <Typography variant="h5" fontWeight="bold" color="#f6f4fe">
                {admin.name}
              </Typography>
              <Typography variant="body1" color="gray">
                {admin.isSuperAdmin ? "Super Admin" : "Admin"}
              </Typography>
              {admin.church_name && (
                <Typography variant="body1" color="gray">
                  {admin.church_name}
                </Typography>
              )}
              <Typography variant="body1" color="gray">
                Admin since: {getAdminSince()}
              </Typography>
              <Box sx={{ textAlign: "center", mt: 2, display: 'flex',gap: 1, flexDirection:'column', justifyContent: 'center', alignItems: 'center'}}>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{ 
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                paddingY: 4,
                paddingX: 2,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f6f4fe' }}>
                Personal Information
              </Typography>
              
              <Grid container spacing={4}>
                <Grid size={{xs:12, md:6}}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="gray">
                      Full Name
                    </Typography>
                    <Typography variant="body1" color="#f6f4fe">
                      {admin.name || "N/A"}
                    </Typography>
                  </Box>                              
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="gray">
                      Role
                    </Typography>
                    <Typography variant="body1" color="#f6f4fe">
                      {admin.isSuperAdmin ? "Super Admin" : "Admin"}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{xs:12, md:6}}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="gray">
                      Phone Number
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PhoneIcon sx={{ mr: 1, color: "#f6f4fe", fontSize: "1rem" }} />
                      <Typography variant="body1" color="#f6f4fe">
                        {admin.phone || "not provided"}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="gray">
                      Email Address
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <EmailIcon sx={{ mr: 1, color: "#f6f4fe", fontSize: "1rem" }} />
                      <Typography variant="body1" color="#f6f4fe">
                        {admin.email || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{ 
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                paddingY: 4,
                paddingX: 2,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f6f4fe' }}>
                Account Information
              </Typography>
              
              <Grid container spacing={4}>
                <Grid size={{xs:12, md:6}}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="gray">
                      Admin Since
                    </Typography>
                    <Typography variant="body1" color="#f6f4fe">
                      {getAdminSince()}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{xs:12, md:6}}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="gray">
                      Account Status
                    </Typography>
                    <Typography variant="body1" color="#f6f4fe">
                      Active
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

export default ViewAdmin;