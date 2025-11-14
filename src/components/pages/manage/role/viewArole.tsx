import React, { useState, useEffect } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { showPageToast } from "../../../util/pageToast";
import { PiRankingFill } from "react-icons/pi";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";

interface Permission {
  id: string;
  name: string;
  group: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
  scopeLevel: string;
  permissions: Permission[];
  permissionGroups: any[];
}

const ViewRole: React.FC = () => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const navigate = useNavigate();
  const { roleId } = useParams<{roleId: string }>(); // Get roleId from URL params
  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!roleId) return;

      setLoading(true);
      setError(null);
      try {
        const response = await Api.get<{ message: string; role: Role }>(
          `/tenants/get-role/${roleId}`
        );
        setRole(response.data.role);
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to load role";
        showPageToast(msg, "error");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [roleId]);

  // Group permissions by group name
  const groupedPermissions = role?.permissions.reduce((acc, perm) => {
    const groupName = perm.group.name;
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(perm.name);
    return acc;
  }, {} as Record<string, string[]>);

  if (loading) {
    return (
      <DashboardManager>
        <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "#777280" }} />
        </Box>
      </DashboardManager>
    );
  }

  if (error || !role) {
    return (
      <DashboardManager>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="error" variant="h6">
            {error || "Role not found"}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Box>
      </DashboardManager>
    );
  }

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: "#F6F4FE",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            Back
          </Button>
        </Box>

        {/* Role Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.06)",
              p: 2,
              borderRadius: 2,
              display: "flex",
            }}
          >
            <PiRankingFill size={36} className="text-[var(--color-text-on-primary)]" />
          </Box>
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: "#F6F4FE",
                fontSize: isLargeScreen ? "2rem" : "1.6rem",
              }}
            >
              {role.name} <span className="text-sm"> - </span> 
               <Chip
                label={role.scopeLevel === 'branch' 
                  ? (!(authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1) 
                      ? 'Branch' 
                      : 'Church'
                    )
                  : role.scopeLevel
                }
                size="small"
                sx={{
                  bgcolor: "#4d4d4e8e",
                  color: "#90EE90",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  color: "#ccc",                
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  maxWidth: "800px",
                }}
              >
                {role.description || "No description provided."}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.1)" }} />

        {/* Permissions Section */}
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ color: "#F6F4FE", mb: 3 }}
        >
          Permissions
        </Typography>

        {Object.keys(groupedPermissions || {}).length === 0 ? (
          <Typography color="var(--color-text-on-primary)" fontStyle="italic">
            No permissions assigned.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {Object.entries(groupedPermissions!).map(([groupName, perms]) => (
              <Grid size={{xs:12, sm:6, md:4}} key={groupName}>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    height: "100%",
                    transition: "0.2s",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {/* Group Title */}
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ color: "#90EE90", mb: 1.5 }}
                  >
                    {groupName}
                  </Typography>

                  {/* Permissions List */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {perms.map((perm) => (
                      <Chip
                        key={perm}
                        label={perm}
                        size="small"
                        sx={{
                          bgcolor: "rgba(144, 238, 144, 0.15)",
                          color: "#90EE90",
                          fontWeight: 500,
                          fontSize: "0.7rem",
                          height: 22,
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </DashboardManager>
  );
};

export default ViewRole;