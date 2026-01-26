import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import {
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineWork,
  MdOutlineBadge,
} from "react-icons/md";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { BsBuilding } from "react-icons/bs";
import { AiOutlineTeam } from "react-icons/ai";

interface Branch {
  id: string | number;
  name: string;
  address: string;      // add this to match ViewAdmins.tsx
}

interface Department {
  id: string;
  name: string;
  type?: string;
  branchId?: string | number;
}

interface Unit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
}

interface Role {
  id: string;
  name: string;
}

interface ViewAdminData {
  id: string;
  name: string;
  email: string;
  phone: string;
  title?: string;
  scopeLevel: string;
  isSuperAdmin: boolean;
  isActive?: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  branches?: Branch[];
  departments?: Department[];
  units?: Unit[];
  roles?: Role[];
}

interface ViewAdminDialogProps {
  open: boolean;
  onClose: () => void;
  adminData: ViewAdminData | null;
}

const ViewAdminDialog: React.FC<ViewAdminDialogProps> = ({
  open,
  onClose,
  adminData,
}) => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));

  if (!adminData) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) => (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "8px",
          backgroundColor: "var(--color-surface-glass)",
          color: "var(--color-text-primary)",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "var(--color-text-muted)",
            fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
            fontWeight: 500,
            display: "block",
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            color: "var(--color-text-primary)",
            fontSize: isLargeScreen ? "0.875rem" : "0.95rem",
            fontWeight: 500,
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

  const getScopeLevelLabel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      branch: "Branch",
      department: "Department",
      unit: "Unit",
      church: "Church",
    };
    return levelMap[level.toLowerCase()] || level;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          bgcolor: "var(--color-primary)",
          color: "var(--color-text-primary)",
          borderRadius: "16px",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 2,
          pt: 3,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "var(--color-text-secondary)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            {adminData.name
              .split(" ")
              .map((n) => n.charAt(0))
              .join("")}
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: isLargeScreen ? "1.25rem" : "1.35rem",
                color: "var(--color-text-primary)",
              }}
            >
              {adminData.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              {adminData.isSuperAdmin && (
                <Chip
                  label="Super Admin"
                  size="small"
                  sx={{
                    backgroundColor: "#FFD700",
                    color: "#000",
                    fontWeight: 600,
                    fontSize: isLargeScreen ? "0.7rem" : "0.75rem",
                    height: 24,
                  }}
                />
              )}
              <Chip
                label={adminData.isActive ? "Active" : "Inactive"}
                size="small"
                sx={{
                  backgroundColor: adminData.isActive
                    ? "#4CAF50"
                    : "#F44336",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: isLargeScreen ? "0.7rem" : "0.75rem",
                  height: 24,
                }}
              />
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "var(--color-text-muted)",
            "&:hover": {
              backgroundColor: "var(--color-surface-glass)",
              color: "var(--color-text-primary)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: "var(--color-border-glass)" }} />

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "var(--color-text-primary)",
                fontWeight: 600,
                mb: 2,
                fontSize: isLargeScreen ? "0.95rem" : "1rem",
              }}
            >
              Basic Information
            </Typography>

            <InfoRow
              icon={<MdOutlineEmail size={20} />}
              label="Email Address"
              value={adminData.email}
            />

            <InfoRow
              icon={<MdOutlinePhone size={20} />}
              label="Phone Number"
              value={adminData.phone}
            />

            {adminData.title && (
              <InfoRow
                icon={<MdOutlineWork size={20} />}
                label="Title"
                value={adminData.title}
              />
            )}

            <InfoRow
              icon={<MdOutlineBadge size={20} />}
              label="Access Level"
              value={getScopeLevelLabel(adminData.scopeLevel)}
            />
          </Grid>

          {/* Assignment & Roles */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "var(--color-text-primary)",
                fontWeight: 600,
                mb: 2,
                fontSize: isLargeScreen ? "0.95rem" : "1rem",
              }}
            >
              Assignment & Roles
            </Typography>

            {/* Branches */}
            {adminData.branches && adminData.branches.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <HiOutlineOfficeBuilding
                    size={20}
                    color="var(--color-text-muted)"
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-muted)",
                      fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Branches
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {adminData.branches.map((branch) => (
                    <Chip
                      key={branch.id}
                      label={branch.name}
                      size="small"
                      sx={{
                        backgroundColor: "var(--color-surface-glass)",
                        color: "var(--color-text-primary)",
                        fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Departments */}
            {adminData.departments && adminData.departments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <BsBuilding size={18} color="var(--color-text-muted)" />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-muted)",
                      fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Departments
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {adminData.departments.map((dept) => (
                    <Chip
                      key={dept.id}
                      label={dept.name}
                      size="small"
                      sx={{
                        backgroundColor: "var(--color-surface-glass)",
                        color: "var(--color-text-primary)",
                        fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Units */}
            {adminData.units && adminData.units.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <AiOutlineTeam size={20} color="var(--color-text-muted)" />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-muted)",
                      fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Units
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {adminData.units.map((unit) => (
                    <Chip
                      key={unit.id}
                      label={unit.name}
                      size="small"
                      sx={{
                        backgroundColor: "var(--color-surface-glass)",
                        color: "var(--color-text-primary)",
                        fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Roles */}
            {adminData.roles && adminData.roles.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--color-text-muted)",
                    fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                    fontWeight: 500,
                    display: "block",
                    mb: 1,
                  }}
                >
                  Assigned Roles
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {adminData.roles.map((role) => (
                    <Chip
                      key={role.id}
                      label={role.name}
                      size="small"
                      sx={{
                        backgroundColor: "#4CAF50",
                        color: "#fff",
                        fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Empty state for assignments */}
            {(!adminData.branches || adminData.branches.length === 0) &&
              (!adminData.departments || adminData.departments.length === 0) &&
              (!adminData.units || adminData.units.length === 0) &&
              (!adminData.roles || adminData.roles.length === 0) && (
                <Typography
                  sx={{
                    color: "var(--color-text-muted)",
                    fontStyle: "italic",
                    fontSize: isLargeScreen ? "0.85rem" : "0.9rem",
                  }}
                >
                  No assignments or roles
                </Typography>
              )}
          </Grid>

          {/* Activity Information */}
          <Grid  size={{ xs: 12 }}>
            <Divider sx={{ borderColor: "var(--color-border-glass)", my: 1 }} />
            <Typography
              variant="subtitle2"
              sx={{
                color: "var(--color-text-primary)",
                fontWeight: 600,
                mb: 2,
                mt: 2,
                fontSize: isLargeScreen ? "0.95rem" : "1rem",
              }}
            >
              Activity Information
            </Typography>

            <Grid container spacing={2}>
              <Grid  size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    backgroundColor: "var(--color-surface-glass)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-muted)",
                      fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      fontWeight: 500,
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Created At
                  </Typography>
                  <Typography
                    sx={{
                      color: "var(--color-text-primary)",
                      fontSize: isLargeScreen ? "0.85rem" : "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(adminData.createdAt)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    backgroundColor: "var(--color-surface-glass)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-muted)",
                      fontSize: isLargeScreen ? "0.75rem" : "0.8rem",
                      fontWeight: 500,
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Last Login
                  </Typography>
                  <Typography
                    sx={{
                      color: "var(--color-text-primary)",
                      fontSize: isLargeScreen ? "0.85rem" : "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {adminData.lastLoginAt
                      ? formatDate(adminData.lastLoginAt)
                      : "Never"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAdminDialog;