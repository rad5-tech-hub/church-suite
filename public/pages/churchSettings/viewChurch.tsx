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
  Chip,
} from "@mui/material";
import { ArrowBack, SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { 
  Phone as PhoneIcon, 
  Email as EmailIcon, 
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import DashboardManager from "../../shared/dashboardManager";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";
import axios from "axios";
import Api from "../../shared/api/api";
import ChangeColorButton from "./setting";

interface Church {
  id: string;
  name: string;
  logo: string;
  backgroundImage: string;
  address: string;
  churchPhone: string;
  churchEmail: string;
  isHeadQuarter: boolean;
  isDeleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isSuperAdmin?: boolean;
}

const ViewAdmin: React.FC = () => {
  const authData = useSelector((state: RootState) => state.auth?.authData);
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const  navigate = useNavigate();
    
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
  
      // Fetch updated church data after successful update
      const response = await Api.get(`/church/get-church`);
      const updatedChurch: Church = response.data.data;
  
      setChurch(updatedChurch);
      setEditDialogOpen(false);
    } catch (err: any) {
      setEditError(
        (axios.isAxiosError(err) && err.response?.data?.message) || "Failed to update profile"
      );
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const fetchChurchData = async () => {
      try {
        setLoading(true);
        
        // Fetch church data
        const churchResponse = await Api.get(`/church/get-church`);
        const churchData: Church = churchResponse.data.data;
        
        setChurch({
          id: churchData.id,
          name: churchData.name,
          logo: churchData.logo,
          backgroundImage: churchData.backgroundImage,
          address: churchData.address,
          churchPhone: churchData.churchPhone,
          churchEmail: churchData.churchEmail,
          isHeadQuarter: churchData.isHeadQuarter,
          isDeleted: churchData.isDeleted,
          isActive: churchData.isActive,
          createdAt: churchData.createdAt,
          updatedAt: churchData.updatedAt,
          isSuperAdmin: churchData.isSuperAdmin,
        });

        setEditForm({
          name: churchData.name,
          phoneNo: churchData.churchPhone || '',
          email: churchData.churchEmail
        });
        
        setLoading(false);
      } catch (err) {
        setError(
          (axios.isAxiosError(err) && err.response?.data?.message) || 
          "Failed to fetch church data"
        );
        setLoading(false);
      }
    };

    fetchChurchData();
  }, [authData]);

  const handleEditClick = () => {
    if (church) {
      setEditForm({
        name: church.name,
        phoneNo: church.churchPhone || '',
        email: church.churchEmail
      });
    }
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
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

  if (error || !church) {
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
                    Church Data not available!
                </Typography>
                {error ? (
                  <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                ) : null}
                <Button
                  variant="contained"
                  onClick={() => navigate(-1)}       
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
                <ArrowBack className="mr-1"/>  Back
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
                Church Profile
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: isLargeScreen ? '0.875rem' : undefined
                }}
              >
                View and manage your church profile information.
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
                  backgroundColor: "var(--color-primary)",
                  borderRadius: 1,
                  fontWeight: 500,
                  textTransform: "none",
                  fontSize: isLargeScreen ? '1rem' : undefined,
                  color: "var(--color-text-on-primary)",
                  "&:hover": {
                    backgroundColor: "var(--color-primary)",
                    opacity: 0.9,
                  },
                }}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>
          <Box>
            <Box sx={{ 
              mb: 4, 
              display: 'flex', 
              gap: 2,
              flexDirection: { md: 'row', xs: 'column' },
              alignItems: { md: 'center', xs: 'flex-start' }
            }}>
              {/* First section - 30% on md, full width on xs */}
              <Box sx={{ 
                width: { md: '30%', xs: '100%' },
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid size={{xs:12}}>
                    <Avatar
                      src={church.logo || ""}
                      alt={church.name}
                      sx={{ 
                        width: 100, 
                        height: 100,
                        mx: { xs: 'auto', sm: 0 },
                        mb: { xs: 1, sm: 0 }
                      }}
                    />
                  </Grid>
                  <Grid size={{xs:12}}>
                    <Typography 
                      variant="h5" 
                      fontWeight="bold"
                      sx={{ 
                        textAlign: { xs: 'center', sm: 'left' },
                        fontSize: isLargeScreen ? '1.5rem' : undefined
                      }}
                    >
                      {church.name}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="textSecondary"
                      sx={{ 
                        textAlign: { xs: 'center', sm: 'left' },
                        fontSize: isLargeScreen ? '0.875rem' : undefined
                      }}
                    >
                      {church.isHeadQuarter ? "HeadQuater" : "Not Headquater"}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="textSecondary"
                      sx={{ 
                        textAlign: { xs: 'center', sm: 'left' },
                        fontSize: isLargeScreen ? '0.875rem' : undefined
                      }}
                    >
                      Created: {formatDate(church.createdAt || '')}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Second section - 70% on md, full width on xs */}
              <Box sx={{ 
                width: { md: '70%', xs: '100%' },
                display: 'flex',
                justifyContent: { md: 'flex-end', xs: 'center' }
              }}>
                <figure>
                  <Avatar
                    src={church.backgroundImage || ""}
                    alt="Church Background"
                    variant="rounded"
                    sx={{ 
                      width: { md: 'auto', xs: '100%' }, 
                      height: 'auto',
                      borderRadius: 1,
                      boxShadow: 3,
                      objectFit: 'cover'
                    }}
                  />
                  <figcaption className="text-gray-500 text-sm m-1"> Banner Image</figcaption>
                </figure>                
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Church Information
            </Typography>
            
            <Grid container spacing={4}>
              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Church Name
                  </Typography>
                  <Typography variant="body1">
                    {church.name || "N/A"}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Address
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LocationIcon sx={{ mr: 1, color: "var(--color-primary)", fontSize: "1rem" }} />
                    <Typography variant="body1">
                      {church.address || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {church.isActive ? (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Active" 
                        color="success" 
                        size="small"
                      />
                    ) : (
                      <Chip 
                        icon={<CancelIcon />} 
                        label="Inactive" 
                        color="error" 
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              
              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Church Phone
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PhoneIcon sx={{ mr: 1, color: "var(--color-primary)", fontSize: "1rem" }} />
                    <Typography variant="body1">
                      {church.churchPhone || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Church Email
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <EmailIcon sx={{ mr: 1, color: "var(--color-primary)", fontSize: "1rem" }} />
                    <Typography variant="body1">
                      {church.churchEmail || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                   IsHeadquarter?
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <HomeIcon sx={{ mr: 1, color: "var(--color-primary)", fontSize: "1rem" }} />
                    <Typography variant="body1">
                      {church.isHeadQuarter ? "Yes" : "No"}
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
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(church.createdAt || '')}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Account Status
                  </Typography>
                  <Chip 
                    label={church.isActive ? "Active" : "Inactive"} 
                    color={church.isActive ? "success" : "error"} 
                    size="small"
                    icon={church.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                  />
                </Box>
              </Grid>

              <Grid size={{xs:12, md:6}}>
                <Box sx={{ mb: 3 }}>
                  <ChangeColorButton/>
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
          Edit Church Profile
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
              label="Church Name"
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
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
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