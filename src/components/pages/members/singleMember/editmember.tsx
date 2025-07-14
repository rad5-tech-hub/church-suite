import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Grid, 
  Button, 
  TextField, 
  MenuItem, 
  Divider,
  InputAdornment,
  Container
} from '@mui/material';
import { toast } from "react-toastify";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import { 
  Phone as PhoneIcon,  
  WhatsApp as WhatsAppIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Api from '../../../shared/api/api';
import DashboardManager from '../../../shared/dashboardManager';
import { BsPerson } from 'react-icons/bs';

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
  profilePicture?: string;
  memberSince?: string;
}

const ageRanges = [
  { label: "12-18", from: 12, to: 18 },
  { label: "19-25", from: 19, to: 25 },
  { label: "26-35", from: 26, to: 35 },
  { label: "36-45", from: 36, to: 45 },
  { label: "46-55", from: 46, to: 55 },
  { label: "56+", from: 56, to: null },
  { label: "Custom", from: null, to: null },
];

const EditMember: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('');
  const [showCustomAgeInputs, setShowCustomAgeInputs] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [addressParts, setAddressParts] = useState({
    street: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const response = await Api.get(`/member/a-member/${memberId}`);
        const memberData = response.data.member;
        setMember(memberData);
        
        // Parse address
        const addressArray = memberData.address?.split('\n') || [];
        const cityState = addressArray[1]?.split(',') || [];
        
        setAddressParts({
          street: addressArray[0] || '',
          city: cityState[0] || '',
          state: cityState[1]?.trim() || memberData.state || ''
        });

        // Initialize form data
        setFormData({
          ...memberData,
          phoneNo: memberData.phoneNo,
          whatappNo: memberData.whatappNo,
          email: memberData.email
        });

        // Set initial age range selection
        const foundRange = ageRanges.find(range => 
          range.from === memberData.ageFrom && range.to === memberData.ageTo
        );
        
        if (foundRange) {
          setSelectedAgeRange(foundRange.label);
          setShowCustomAgeInputs(false);
        } else {
          setSelectedAgeRange('Custom');
          setShowCustomAgeInputs(true);
        }

      } catch (err) {
        console.error("Failed to fetch worker data:", err);
        setError(`Failed to fetch worker data. Please Reload this Page!`);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressParts(prev => ({ ...prev, [name]: value }));
  };

  const handleAgeRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedAgeRange(value);
    
    if (value === 'Custom') {
      setShowCustomAgeInputs(true);
      return;
    }
    
    setShowCustomAgeInputs(false);
    const selectedRange = ageRanges.find(range => range.label === value);
    
    if (selectedRange) {
      setFormData(prev => ({
        ...prev,
        ageFrom: selectedRange.from || 0,
        ageTo: selectedRange.to || 0
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullAddress = `${addressParts.street}\n${addressParts.city}, ${addressParts.state}`;
      const updatedMember = {
        ...formData,
        address: fullAddress
      };

      await Api.patch(`/member/edit-member/${memberId}`, updatedMember);
      toast.success(('Edited Member Successfully'),{
        autoClose: 3000,
      })
      setTimeout(() => {
        navigate(`/members/view${memberId}`, { state: { refresh: true } });        
      }, 1500);
    } catch (err) {             
        toast.error((err as any)?.message || "Failed to Edit Member. Please try again.", {
            autoClose: 3000,          
        });
    } finally {
      setSaving(false);
    }
  };

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


  return (
    <DashboardManager>
      <Container sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{xs:12, md:8}}>
            <Typography 
              variant="h5" 
              fontWeight={600}
              gutterBottom
              sx={{ color: 'text.primary' }}
            >
              Edit Member Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update member information below
            </Typography>
          </Grid>
          <Grid 
            size={{xs:12, md:4}}
            sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
              gap: 2
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate((`/members/view/${member?.id}`))}
              sx={{ textTransform: "none",
                borderColor: 'var(--color-primary)',
                color: "var(--color-primary)", // Ensure text color is set correctly
               }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
              sx={{ 
                color: "var(--color-text-on-primary)", // Ensure text color is set correctly
                textTransform: "none",
                backgroundColor: "var(--color-primary)", // Correctly reference the CSS variable
                "&:hover": {
                  backgroundColor: "var(--color-primary)", // Ensure hover uses the same variable
                  opacity: 0.9, // Add hover effect
                },
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Grid>
        </Grid>

        <Box>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{xs:12, sm:2}} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Avatar
                  src={member.profilePicture || ""}
                  alt={member.name}
                  sx={{ 
                    width: 100, 
                    height: 100,
                    mx: { xs: 'auto', sm: 0 },
                    mb: { xs: 2, sm: 0 }
                  }}
                />
              </Grid>
              <Grid size={{xs:12, sm:8}}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2,  flexDirection: { md: 'row', xs: 'column' } }}>
                  <TextField
                    select
                    fullWidth
                    label="Gender"
                    name="sex"
                    value={formData.sex || ''}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </TextField>
                  
                  <TextField
                    fullWidth
                    select
                    label="Age Range"
                    value={selectedAgeRange}
                    onChange={handleAgeRangeChange}
                  >
                    {ageRanges.map((range) => (
                      <MenuItem key={range.label} value={range.label}>
                        {range.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {showCustomAgeInputs && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { md: 'row', xs: 'column' } }}>
                    <TextField
                      fullWidth
                      label="Age From"
                      name="ageFrom"
                      type="number"
                      value={formData.ageFrom ?? ""}
                      onChange={handleNumberChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BsPerson style={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        inputProps: {
                          min: 0,
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Age To"
                      name="ageTo"
                      type="number"
                      value={formData.ageTo ?? ""}
                      onChange={handleNumberChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BsPerson style={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        inputProps: {
                          min: formData.ageFrom ?? 0,
                        },
                      }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Contact Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNo"
                type="number"                                
                value={formData.phoneNo || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: "var(--color-primary)" }} />
                }}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="WhatsApp Number"
                name="whatappNo"
                type="number"                
                value={formData.whatappNo || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <WhatsAppIcon sx={{ mr: 1, color: "#25D366" }} />
                }}
                sx={{ mb: 3 }}
              />
            </Grid>
            <Grid size={{xs:12, md:6}}>              
              <TextField
                select
                fullWidth
                label="Marital Status"
                name="maritalStatus"
                value={formData.maritalStatus || ''}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
              >
                <MenuItem value="single">Single</MenuItem>
                <MenuItem value="married">Married</MenuItem>
                <MenuItem value="divorced">Divorced</MenuItem>
                <MenuItem value="widowed">Widowed</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Address Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Street Address"
                name="street"
                value={addressParts.street}
                onChange={handleAddressChange}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="City"
                name="city"
                value={addressParts.city}
                onChange={handleAddressChange}
                sx={{ mb: 3 }}
              />
            </Grid>
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={addressParts.state}
                onChange={handleAddressChange}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Nationality"
                name="nationality"
                value={formData.nationality || ''}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Membership Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{xs:12, md:6}}>
              <TextField
                fullWidth
                label="Years of Membership"
                name="memberFor"
                type="number"
                value={formData.memberFor || ''}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
              />
            </Grid>
            <Grid size={{xs:12, md:6}}>
              <TextField
                select
                fullWidth
                label="Membership Status"
                name="isActive"
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    isActive: e.target.value === 'active'
                  }));
                }}
                sx={{ mb: 3 }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </DashboardManager>
  );
};

export default EditMember;