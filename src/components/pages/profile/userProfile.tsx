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
  IconButton,
  Alert,
  InputAdornment,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowBack, 
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import DashboardManager from "../../shared/dashboardManager";
import { useSelector } from "react-redux";
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

interface Branch {
  id: string;
  name: string;
}

const ViewAdmin: React.FC = () => {
  const authData = useSelector((state: RootState) => state?.auth?.authData);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const navigate = useNavigate();

  // Change Password Modal State
  const [openChangePass, setOpenChangePass] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Password visibility states
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);


  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (!authData?.id) {
          setError("No admin data available");
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await Api.get(`/church/an-admin/${authData.id}`);
        const adminData: Admin = response.data.admin;

        setAdmin({
          id: adminData.id,
          name: adminData.name || "",
          email: adminData.email,
          phone: adminData.phone || "",
          branches: adminData.branches || [],
          role: adminData.isSuperAdmin ? "Super Admin" : "Admin",
          profilePicture: adminData.profilePicture || adminData.logo,
          createdAt: adminData.createdAt || new Date().toISOString(),
          isSuperAdmin: adminData.isSuperAdmin,
          church_name: adminData.church_name,
          logo: adminData.logo,
          backgroundImg: adminData.backgroundImg,
        });
      } catch (err) {
        setError(
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Failed to fetch admin data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [authData]);

  const getAdminSince = () => {
    if (admin?.createdAt) {
      return new Date(admin.createdAt).toLocaleDateString();
    }
    return "N/A";
  };

  // Handle password change submission
  const handleChangePassword = async () => {
    setPassError("");
    setSuccessMsg("");

    if (!oldPassword || !newPassword) {
      setPassError("Please fill in all required fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);

    try {
      await Api.patch("/church/change-password", {
        oldPassword,
        newPassword,
      });

      setSuccessMsg("Password changed successfully!");
      setTimeout(() => {
        setOpenChangePass(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      setPassError(
        err.response?.data?.message || "Failed to change password. Please check your current password."
      );
    } finally {
      setSubmitting(false);
    }
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
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography
                variant="h5"
                component="h1"
                fontWeight={600}
                gutterBottom
                sx={{ color: "#f6f4fe" }}
              >
                Admin Profile
              </Typography>
              <Typography variant="body2" color="gray">
                View and manage your profile information.
              </Typography>
            </Grid>
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
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

              {/* CHANGE PASSWORD BUTTON */}
              <Button
                variant="outlined"
                onClick={() => setOpenChangePass(true)}
                sx={{
                  mt: 3,
                  borderColor: "#8b5cf6",
                  color: "#8b5cf6",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#7c4dff",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                  },
                }}
              >
                Change Password
              </Button>
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
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#f6f4fe" }}>
                Personal Information
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
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

                <Grid size={{ xs: 12, md: 6 }}>
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
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#f6f4fe" }}>
                Account Information
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="gray">
                      Admin Since
                    </Typography>
                    <Typography variant="body1" color="#f6f4fe">
                      {getAdminSince()}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
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

      {/* ENHANCED CHANGE PASSWORD MODAL - Dark Theme + Eye Icons */}
      <Dialog
        open={openChangePass}
        onClose={() => !submitting && setOpenChangePass(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#2c2c2c",
            color: "#e0e0e0",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: "#ffffff", fontWeight: 600 }}>
          Change Password
          <IconButton
            onClick={() => setOpenChangePass(false)}
            disabled={submitting}
            sx={{ position: "absolute", right: 8, top: 8, color: "#b0b0b0" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: "#2c2c2c" }}>
          {passError && <Alert severity="error" sx={{ mb: 2, backgroundColor: "#442222", color: "#ff6b6b" }}>{passError}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 2, backgroundColor: "#1a3d2e", color: "#90ee90" }}>{successMsg}</Alert>}

          <TextField
            label="Current Password"
            type={showOldPass ? "text" : "password"}
            fullWidth
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={submitting}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowOldPass(!showOldPass)}
                    edge="end"
                    sx={{ color: "#aaa" }}
                  >
                    {showOldPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ style: { color: "#bbb" } }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "#e0e0e0",
                "& fieldset": { borderColor: "#555" },
                "&:hover fieldset": { borderColor: "#777" },
                "&.Mui-focused fieldset": { borderColor: "#f6f4fe" },
              },
            }}
          />

          <TextField
            label="New Password"
            type={showNewPass ? "text" : "password"}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={submitting}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPass(!showNewPass)}
                    edge="end"
                    sx={{ color: "#aaa" }}
                  >
                    {showNewPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ style: { color: "#bbb" } }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "#e0e0e0",
                "& fieldset": { borderColor: "#555" },
                "&:hover fieldset": { borderColor: "#777" },
                "&.Mui-focused fieldset": { borderColor: "#f6f4fe" },
              },
            }}
          />

          <TextField
            label="Confirm New Password"
            type={showConfirmPass ? "text" : "password"}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            error={!!confirmPassword && newPassword !== confirmPassword}
            helperText={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    edge="end"
                    sx={{ color: "#aaa" }}
                  >
                    {showConfirmPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ style: { color: "#bbb" } }}
            FormHelperTextProps={{ style: { color: "#ff6b6b" } }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "#e0e0e0",
                "& fieldset": { borderColor: "#555" },
                "&:hover fieldset": { borderColor: "#777" },
                "&.Mui-focused fieldset": { borderColor: "#f6f4fe" },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ backgroundColor: "#2c2c2c", px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenChangePass(false)}
            disabled={submitting}
            sx={{ color: "#aaa", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={
              submitting ||
              !oldPassword ||
              !newPassword ||
              newPassword !== confirmPassword
            }
            sx={{
              backgroundColor: "#f6f4fe",
              color: '#2c2c2c',
              "&:hover": { backgroundColor: "#777280" },
              textTransform: "none",
            }}
          >
            {submitting ? "Changing..." : "Change Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardManager>
  );
};

export default ViewAdmin;