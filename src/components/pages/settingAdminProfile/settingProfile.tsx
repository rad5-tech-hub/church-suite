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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { 
  Phone as PhoneIcon, 
  Email as EmailIcon, 
  Edit as EditIcon
} from "@mui/icons-material";
import DashboardManager from "../../shared/dashboardManager";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import axios from "axios";
import Api from "../../shared/api/api";

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
}

const ViewAdmin: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
    
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNo: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    phoneNo: '',
    email: '',
  });


  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: '',
      phoneNo: '',
      email: '',
    };

    if (!editForm.name.trim()) {
      newErrors.name = 'Full name is required';
      valid = false;
    }

    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'Enter a valid email';
      valid = false;
    }

    if (editForm.phoneNo && !/^[0-9]{10,15}$/.test(editForm.phoneNo)) {
      newErrors.phoneNo = 'Phone number is not valid';
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateForm()) {
      return;
    }
  
    try {
      setEditLoading(true);
      setEditError(null);
  
      await Api.patch("/church/edit-admin", editForm);
  
      // Fetch updated admin data after successful update
      const response = await Api.get(`/church/an-admin/${authData?.id}`);
      const updatedAdmin: Admin = response.data.admin;
  
      setAdmin({
        id: updatedAdmin.id,
        name: updatedAdmin.name || '',
        email: updatedAdmin.email,
        phone: updatedAdmin.phone || '',
        role: updatedAdmin.isSuperAdmin ? 'Super Admin' : 'Admin',
        profilePicture: updatedAdmin.profilePicture || updatedAdmin.logo,
        createdAt: updatedAdmin.createdAt || new Date().toISOString(),
        isSuperAdmin: updatedAdmin.isSuperAdmin,
        church_name: updatedAdmin.church_name,
        logo: updatedAdmin.logo,
        backgroundImg: updatedAdmin.backgroundImg,
      });
  
      setEditDialogOpen(false);
    } catch (err: any) {
      setEditError(
        (axios.isAxiosError(err) && err.response?.data?.message) || "Failed to update admin profile"
      );
    } finally {
      setEditLoading(false);
    }
  };

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
          setEditForm({
            name: adminData.name,
            phoneNo: adminData.phone || '',
            email: adminData.email
          });
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

  const handleEditClick = () => {
    if (admin) {
        setEditForm({
        name: admin.name,
        phoneNo: admin.phone,
        email: admin.email
      });
    }
    setEditDialogOpen(true);
  };

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
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[var(--color-primary)]"></div>
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
          <Typography variant="h6" color="textSecondary">
            No admin data available.
          </Typography>
        </Box>
      </DashboardManager>
    );
  }

  return (
    <DashboardManager>
      <Container>
        <Box sx={{ py: 2, mx: "auto" }}>
          <Grid container spacing={2} sx={{ mb: 5 }}>
            <Grid size={{xs:12, md:8}}>
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
                Admin Profile
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
              size={{xs:12, md:4}}
              sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                alignItems: 'center'
              }}
            >
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                size="medium"
                sx={{
                  backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable                
                  borderRadius: 1,
                  fontWeight: 500,
                  textTransform: "none",
                  fontSize: isLargeScreen ? '1rem' : undefined,
                  color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                  "&:hover": {
                    backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                    opacity: 0.9, // Add hover effect
                  },
                }}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>

          <Box>
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{xs:12}}>
                  <Avatar
                    src={admin.profilePicture || ""}
                    alt={admin.name}
                    sx={{ 
                      width: 100, 
                      height: 100,
                      mx: { xs: 'auto', sm: 0 },
                      mb: { xs: 1, sm: 0 }
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, md:8}}>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ 
                      textAlign: { xs: 'center', sm: 'left' },
                      fontSize: isLargeScreen ? '1.5rem' : undefined
                    }}
                  >
                    {admin.name}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="textSecondary"
                    sx={{ 
                      textAlign: { xs: 'center', sm: 'left' },
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}
                  >
                    {admin.isSuperAdmin ? "Super Admin" : "Admin"}
                  </Typography>
                  {admin.church_name && (
                    <Typography 
                      variant="body1" 
                      color="textSecondary"
                      sx={{ 
                        textAlign: { xs: 'center', sm: 'left' },
                        fontSize: isLargeScreen ? '0.875rem' : undefined
                      }}
                    >
                      {admin.church_name}
                    </Typography>
                  )}
                  <Typography 
                    variant="body1" 
                    color="textSecondary"
                    sx={{ 
                      textAlign: { xs: 'center', sm: 'left' },
                      fontSize: isLargeScreen ? '0.875rem' : undefined
                    }}
                  >
                    Admin since: {getAdminSince()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Personal Information
            </Typography>
            
            <Grid container spacing={4}>
              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1">
                    {admin.name || "N/A"}
                  </Typography>
                </Box>                              
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Role
                  </Typography>
                  <Typography variant="body1">
                    {admin.isSuperAdmin ? "Super Admin" : "Admin"}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Phone Number
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PhoneIcon sx={{ mr: 1, color: "var(--color-primary)", fontSize: "1rem" }} />
                    <Typography variant="body1">
                      {admin.phone || "not provided"}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Email Address
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <EmailIcon sx={{ mr: 1, color: "#1f2937", fontSize: "1rem" }} />
                    <Typography variant="body1">
                      {admin.email || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Account Information
            </Typography>
            
            <Grid container spacing={4}>
              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Admin Since
                  </Typography>
                  <Typography variant="body1">
                    {getAdminSince()}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Account Status
                  </Typography>
                  <Typography variant="body1">
                    Active
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle
        sx={{
            bgcolor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
        }}
        >
        Edit Admin Profile
        </DialogTitle>
        <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 3 }}>
            {editError && (
            <Typography color="error" sx={{ mb: 2 }}>
                {editError}
            </Typography>
            )}
            <TextField
            fullWidth
            margin="normal"
            name="name"
            label="Full Name"
            value={editForm.name}
            onChange={handleInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            />
            <TextField
            fullWidth
            margin="normal"
            name="phoneNo"
            label="Phone Number"
            value={editForm.phoneNo}
            onChange={handleInputChange}
            error={!!formErrors.phoneNo}
            helperText={formErrors.phoneNo}
            />
            <TextField
            fullWidth
            margin="normal"
            name="email"
            label="Email Address"
            type="email"
            value={editForm.email}
            onChange={handleInputChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
            />
        </DialogContent>
        <DialogActions
            sx={{
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 3,
            py: 2,
            }}
        >
            <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
            Cancel
            </Button>
            <Button
            type="submit"
            variant="contained"
            disabled={editLoading}
            sx={{
              backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
              color: "var(--color-text-on-primary)", // Ensure text color is set correctly
              "&:hover": {
                backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                opacity: 0.9, // Add hover effect
              },
            }}
            >
            {editLoading ? 'Saving' : "Save Changes"}
            </Button>
        </DialogActions>
        </form>
    </Dialog>
    </DashboardManager>
  );
};

export default ViewAdmin;