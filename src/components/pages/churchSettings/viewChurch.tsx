/*  ViewChurch.tsx  */
import React, { useEffect, useState, useRef } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowBack,
  Edit as EditIcon,
  PhotoCamera as CameraIcon,
  CloudUpload as UploadIcon,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import DashboardManager from "../../shared/dashboardManager";
import Api from "../../shared/api/api";
import { useNavigate } from "react-router-dom";
import { showPageToast } from "../../util/pageToast";
import { useDispatch, useSelector } from "react-redux";
import { setAuthData, AuthState } from "../../reduxstore/authstore"; // ← YOUR STORE

interface Church {
  id: string;
  name: string;
  logo: string | null;
  backgroundImage: string | null;
  address: string;
  churchPhone: string;
  churchEmail: string;
  isHeadQuarter: boolean;
  smsActive: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
export default function ViewChurch() {
  const dispatch = useDispatch();
  const authData = useSelector((state: { auth: AuthState }) => state.auth.authData);

  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ----- edit text dialog ----- */
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    churchName: "",
    address: "",
    phone: "",
    email: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  /* ----- file uploads ----- */
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up("lg"));
  const navigate = useNavigate();

  /* ---------------------------------------------------------------- */
  /*  FETCH CHURCH                                                    */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await Api.get<{ data: any }>("/church/get-church");
        const d = res.data.data;

        const data: Church = {
          id: d.id,
          name: d.name,
          logo: d.logo,
          backgroundImage: d.backgroundImage,
          address: d.address,
          churchPhone: d.churchPhone,
          churchEmail: d.churchEmail,
          isHeadQuarter: d.isHeadQuarter,
          smsActive: d.smsActive ?? false,
          createdAt: d.createdAt,
        };

        setChurch(data);
        setEditForm({
          churchName: data.name,
          address: data.address,
          phone: data.churchPhone,
          email: data.churchEmail,
        });
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Failed to load church");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const since = () => {
    if (!church?.createdAt) return "N/A";
    return new Date(church.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ---------------------------------------------------------------- */
  /*  UPDATE AUTH DATA HELPER                                         */
  /* ---------------------------------------------------------------- */
  const updateAuthData = (updatedChurch: Partial<Church>) => {
    if (!authData) return;

    const newAuthData = {
      ...authData,
      church_name: updatedChurch.name ?? authData.church_name,
      logo: updatedChurch.logo ?? authData.logo,
      backgroundImg: updatedChurch.backgroundImage ?? authData.backgroundImg,
      // Add more fields if needed
    };

    dispatch(setAuthData(newAuthData));
  };

  /* ---------------------------------------------------------------- */
  /*  FILE UPLOAD – updates church + auth                             */
  /* ---------------------------------------------------------------- */
  const upload = async (file: File, type: "logo" | "backgroundImage") => {
    const fd = new FormData();
    fd.append(type, file);

    try {
      type === "logo" ? setUploadingLogo(true) : setUploadingBg(true);
      const r = await Api.patch("/church/edit-church", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedChurch = r.data.church;
      setChurch((p) => p && { ...p, ...updatedChurch });

      // UPDATE AUTH DATA
      updateAuthData(updatedChurch);

      showPageToast(`${type === "logo" ? "Logo" : "Background"} updated`, "success");
    } catch (e: any) {
      showPageToast(e?.response?.data?.message ?? `Failed to upload ${type}`, "error");
    } finally {
      type === "logo" ? setUploadingLogo(false) : setUploadingBg(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "backgroundImage") => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      showPageToast("Select an image file", "error");
      return;
    }
    upload(f, type);
    e.target.value = "";
  };

  /* ---------------------------------------------------------------- */
  /*  TEXT EDIT – updates church + auth                                */
  /* ---------------------------------------------------------------- */
  const saveText = async () => {
    // 1. Build payload with ONLY changed fields
    const payload: Record<string, string> = {};

    if (editForm.churchName !== church?.name) {
      payload.churchName = editForm.churchName;
    }
    if (editForm.address !== church?.address) {
      payload.address = editForm.address;
    }
    if (editForm.phone !== church?.churchPhone) {
      payload.churchPhone = editForm.phone;
    }
    if (editForm.email !== church?.churchEmail) {
      payload.churchEmail = editForm.email;
    }

    // 2. If nothing changed → just close dialog
    if (Object.keys(payload).length === 0) {
      setEditOpen(false);
      return;
    }

    try {
      setEditLoading(true);

      // 3. Send only the changed fields
      const r = await Api.patch("/church/edit-church", payload);

      const updatedChurch = r.data.church;

      // 4. Update local UI state
      setChurch((p) => p && { ...p, ...updatedChurch });

      // 5. Update Redux authData
      updateAuthData(updatedChurch);

      setEditOpen(false);
      showPageToast("Church info updated", "success");
    } catch (e: any) {
      showPageToast(e?.response?.data?.message ?? "Update failed", "error");
    } finally {
      setEditLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  RENDER – LOADING / ERROR                                         */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <DashboardManager>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
          <CircularProgress sx={{ color: "var(--color-text-primary)" }} />
        </Box>
      </DashboardManager>
    );
  }

  if (error || !church) {
    return (
      <DashboardManager>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || "No church data"}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ bgcolor: "var(--color-text-primary)", color: "var(--color-primary)", "&:hover": { opacity: 0.9 } }}
          >
            Back
          </Button>
        </Box>
      </DashboardManager>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  MAIN UI                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <DashboardManager>
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>

          {/* ----- Header ----- */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h5" fontWeight={600} sx={{ color: "var(--color-text-primary)" }}>
                Church Profile
              </Typography>
              <Typography variant="body2" color="var(--color-text-secondary)" sx={{ fontSize: isLarge ? "0.875rem" : undefined }}>
                View and manage your church information.
              </Typography>
            </Grid>            
          </Grid>

          {/* ----- COVER + LOGO ----- */}
          <Box
            sx={{
              position: "relative",
              height: { xs: 180, sm: 220, md: 260 },
              borderRadius: 2,
              overflow: "visible",
              mb: { xs: 7, sm: 8, md: 9 },
              bgcolor: "var(--color-surface-glass)",
            }}
          >
            {church.backgroundImage ? (
              <Box
                component="img"
                src={church.backgroundImage}
                alt="Cover"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.7)",
                  borderRadius: 2,
                }}
              />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  bgcolor: "grey.800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                }}
              >
                <Typography color="grey.500">No background</Typography>
              </Box>
            )}

            <IconButton
              onClick={() => bgRef.current?.click()}
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                bgcolor: "var(--color-text-primary)",
                color: "var(--color-primary)",
                "&:hover": { bgcolor: "var(--color-text-primary)" },
              }}
              disabled={uploadingBg}
            >
              {uploadingBg ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            </IconButton>
            <input ref={bgRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e, "backgroundImage")} />

            <Avatar
              src={church.logo || undefined}
              alt={church.name}
              sx={{
                position: "absolute",
                bottom: "-20%",
                left: { xs: "50%", sm: 32 },
                transform: { xs: "translateX(-50%)", sm: "none" },
                width: { xs: 100, sm: 120, md: 140 },
                height: { xs: 100, sm: 120, md: 140 },
                border: "4px solid #1a1a1a",
                boxShadow: 3,
                bgcolor: "background.paper",
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                fontWeight: 600,
              }}
            >
              {(!church.logo) && church.name[0].toUpperCase()}
            </Avatar>

            <IconButton
              onClick={() => logoRef.current?.click()}
              sx={{
                position: "absolute",
                bottom: "-17%",
                left: { xs: "50%", sm: 42 },
                transform: { xs: "translateX(-50%)", sm: "none" },
                bgcolor: "var(--color-text-primary)",
                color: "var(--color-primary)",
                width: 36,
                height: 36,
                "&:hover": { opacity: 0.9 },
              }}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? <CircularProgress size={16} color="inherit" /> : <CameraIcon fontSize="small" />}
            </IconButton>
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e, "logo")} />
          </Box>

          {/* ----- PROFILE CARD ----- */}
          <Box sx={{ bgcolor: "var(--color-surface-glass)", borderRadius: 2, p: { xs: 3, sm: 4 }, mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="var(--color-text-primary)">
                {church.name}
              </Typography>
              <IconButton onClick={() => setEditOpen(true)} sx={{ color: "var(--color-text-primary)" }}>
                <EditIcon />
              </IconButton>
            </Box>

            <Typography variant="body1" color="var(--color-text-secondary)" sx={{ mb: 1 }}>
              {church.isHeadQuarter ? "Headquarters" : "Branch"}
            </Typography>

            <Typography variant="body1" color="var(--color-text-secondary)">
              Church since: {since()}
            </Typography>
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

          {/* ----- CHURCH INFO ----- */}
          <Box sx={{ bgcolor: "var(--color-surface-glass)", borderRadius: 2, p: { xs: 3, sm: 4 }, mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" color="var(--color-text-primary)" sx={{ mb: 3 }}>
              Church Information
            </Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Church Name" value={church.name} />
                <InfoRow label="Address" value={church.address} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow icon={<PhoneIcon />} label="Phone" value={church.churchPhone} />
                <InfoRow icon={<EmailIcon />} label="Email" value={church.churchEmail} />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

          {/* ----- ACCOUNT INFO + SMS + COLOR PICKER ----- */}
          <Box sx={{ bgcolor: "var(--color-surface-glass)", borderRadius: 2, p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" fontWeight="bold" color="var(--color-text-primary)" sx={{ mb: 3 }}>
              Account Information
            </Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Created On" value={since()} />
                <InfoRow
                  label="SMS Service"
                  value={church.smsActive ? "Active" : "Inactive"}
                  icon={church.smsActive ? <CheckCircle sx={{ color: "#10B981" }} /> : <Cancel sx={{ color: "#EF4444" }} />}
                  color={church.smsActive ? "#10B981" : "#EF4444"}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Status" value="Active" color="#10B981" />
              </Grid>
            </Grid>

          </Box>
        </Box>
      </Container>

      {/* ----- EDIT TEXT DIALOG ----- */}
      <Dialog open={editOpen} onClose={() => !editLoading && setEditOpen(false)} maxWidth="sm" fullWidth sx={{
        '& .MuiDialog-paper': { borderRadius: 2, bgcolor: 'var(--color-primary)' },
      }}>
        <DialogTitle sx={{ color: "var(--color-text-primary)", fontWeight: 600 }}>Edit Church</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth margin="normal" label="Church Name"
            value={editForm.churchName}
            onChange={(e) => setEditForm({ ...editForm, churchName: e.target.value })}
            InputProps={{ sx: textFieldSx }} InputLabelProps={{ sx: labelSx }} />
          <TextField fullWidth margin="normal" label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            InputProps={{ sx: textFieldSx }} InputLabelProps={{ sx: labelSx }} />
          <TextField fullWidth margin="normal" label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            InputProps={{ sx: textFieldSx }} InputLabelProps={{ sx: labelSx }} />
          <TextField fullWidth margin="normal" label="Email" type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            InputProps={{ sx: textFieldSx }} InputLabelProps={{ sx: labelSx }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} sx={{color: 'var(--color-text-muted)'}} disabled={editLoading}>Cancel</Button>
          <Button onClick={saveText} variant="contained" disabled={editLoading}
            sx={{
              py: 1, backgroundColor: 'var(--color-text-primary)', px: 2, borderRadius: 50,
              color: 'var(--color-primary)', fontWeight: 'semibold', textTransform: 'none',
              '&:hover': { backgroundColor: 'var(--color-text-primary)', opacity: 0.9 },
            }}>
            {editLoading ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardManager>
  );
}

/* ------------------------------------------------------------------ */
/*  REUSABLE INFO ROW                                                 */
/* ------------------------------------------------------------------ */
const InfoRow: React.FC<{ icon?: React.ReactNode; label: string; value: string; color?: string }> = ({
  icon, label, value, color,
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" color="var(--color-text-secondary)" sx={{ mb: 0.5 }}>{label}</Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon && <Box sx={{ color: color ?? "var(--color-text-primary)" }}>{icon}</Box>}
      <Typography variant="body1" sx={{ color: color ?? "var(--color-text-primary)" }}>{value}</Typography>
    </Box>
  </Box>
);

/* Shared TextField Styles */
const textFieldSx = {
  color: 'var(--color-text-primary)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#777280' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#777280' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#777280' },
};
const labelSx = {
  color: 'var(--color-text-primary)',
  '&.Mui-focused': { color: 'var(--color-text-primary)' },
};