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
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const authData = useSelector((state: RootState) => state.auth?.authData);

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
          <CircularProgress sx={{ color: "var(--color-text-muted)" }} />
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
            sx={{ 
              mt: 2,
              color: "var(--color-text-primary)",
              "&:hover": { bgcolor: "var(--color-surface-glass)" }
            }}
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
              color: "var(--color-text-primary)",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { bgcolor: "var(--color-surface-glass)" },
            }}
          >
            Back
          </Button>
        </Box>

        {/* Role Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              backgroundColor: "var(--color-surface-glass)",
              p: 2,
              borderRadius: 2,
              display: "flex",
            }}
          >
            <PiRankingFill size={36} className="text-[var(--color-text-primary)]" />
          </Box>
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: "var(--color-text-primary)",
                fontSize: { xs: "1.6rem", md: "2rem" },
              }}
            >
              {role.name}{" "}
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}> - </span>{" "}
              <Chip
                label={
                  role.scopeLevel === 'branch'
                    ? (!(authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1)
                        ? 'Branch'
                        : 'Church')
                    : role.scopeLevel
                }
                size="small"
                sx={{
                  bgcolor: "var(--color-surface-glass)",
                  color: "var(--color-text-primary)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  height: 28,
                }}
              />
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "var(--color-text-muted)",
                mt: 1,
                fontSize: "1rem",
                lineHeight: 1.6,
                maxWidth: "800px",
              }}
            >
              {role.description || "No description provided."}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4, borderColor: "var(--color-border-subtle)" }} />

        {/* Permissions Section */}
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ color: "var(--color-text-primary)", mb: 3 }}
        >
          Permissions
        </Typography>

        {Object.keys(groupedPermissions || {}).length === 0 ? (
          <Typography color="var(--color-text-muted)" fontStyle="italic">
            No permissions assigned.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {Object.entries(groupedPermissions!).map(([groupName, perms]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={groupName}>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "var(--color-surface-glass)",
                    border: "1px solid var(--color-border-glass)",
                    height: "100%",
                    transition: "all 0.25s ease",
                    "&:hover": { bgcolor: "var(--color-surface)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
                  }}
                >
                  {/* Group Title */}
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ color: "var(--color-text-primary)", mb: 1.5 }}
                  >
                    {groupName}
                  </Typography>

                  {/* Permissions List */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {perms.map((perm) => (
                      <Chip
                        key={perm}
                        label={perm}
                        size="small"
                        sx={{
                          bgcolor: "var(--color-surface)",
                          color: "var(--color-text-primary)",                    
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          height: 24,
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