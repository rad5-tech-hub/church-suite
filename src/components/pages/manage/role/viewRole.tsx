import React, { useState, useEffect, useCallback } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import { useNavigate } from "react-router-dom";
import CreateRoleModel from "./createRole";
import EditRoleModal from "./editRole";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
} from "@mui/material";
import { MoreVert as MoreVertIcon, Close, Visibility } from "@mui/icons-material";
import { MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { SentimentVeryDissatisfied as EmptyIcon } from "@mui/icons-material";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { PiRankingFill } from "react-icons/pi";
import { LiaLongArrowAltRightSolid } from "react-icons/lia";

interface Role {
  id: string;
  name: string;
  description: string;
  scopeLevel: "department" | "church" | "branch" | 'unit';
  createdAt: string;
}

interface State {
  roles: Role[];
  loading: boolean;
  error: string | null;
  createModalOpen: boolean;
  editModalOpen: boolean;
  confirmDeleteOpen: boolean;
  selectedRole: Role | null;
  anchorEl: HTMLElement | null; 
}

const initialState: State = {
  roles: [],
  loading: false,
  error: null,
  createModalOpen: false,
  editModalOpen: false,
  confirmDeleteOpen: false,
  selectedRole: null,
  anchorEl: null,
};

const ViewRoles: React.FC = () => {
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);
  usePageToast("view-roles");

  const [state, setState] = useState<State>(initialState);

  const handleStateChange = useCallback(
    <K extends keyof State>(key: K, value: State[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const fetchRoles = useCallback(async () => {
    if (!authData?.branchId) return;
    handleStateChange("loading", true);
    handleStateChange("error", null);
    try {
      const response = await Api.get<{ message: string; data: Role[] }>(
        `/tenants/all-roles?branchId=${authData.branchId}`
      );
      handleStateChange("roles", response.data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
      const msg = error.response?.data?.message || "Failed to load roles";
      showPageToast(msg, "error");
      handleStateChange("error", msg);
    } finally {
      handleStateChange("loading", false);
    }
  }, [authData?.branchId, handleStateChange]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async () => {
    if (!state.selectedRole) return;
    try {
      handleStateChange("loading", true);
      await Api.delete(`/tenants/delete-role/${state.selectedRole.id}`);
      setState((prev) => ({
        ...prev,
        roles: prev.roles.filter((r) => r.id !== prev.selectedRole!.id),
        confirmDeleteOpen: false,
        selectedRole: null,
      }));
      showPageToast("Role deleted successfully", "success");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete role";
      showPageToast(msg, "error");
    } finally {
      handleStateChange("loading", false);
    }
  };

  const handleEditSuccess = () => {
    fetchRoles();
    handleStateChange("editModalOpen", false);
  };

  const EmptyState = () => (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <EmptyIcon sx={{ fontSize: 60, color: "var(--color-text-muted)", opacity: 0.4 }} />
      <Typography variant="h6" color="var(--color-text-muted)">
        No roles found
      </Typography>
      <Button
        variant="contained"
        onClick={() => handleStateChange("createModalOpen", true)}
        sx={{
          backgroundColor: "var(--color-text-primary)",
          color: "var(--color-primary)",
          "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
        }}
      >
        Create Role
      </Button>
    </Box>
  );

  return (
    <DashboardManager>
      <Box sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography
            variant="h5"
            component="h4"
            fontWeight={600}
            sx={{
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span style={{ color: "var(--color-text-muted)" }}>Manage</span>{" "}
            <LiaLongArrowAltRightSolid style={{ color: "var(--color-text-primary)" }} />{" "}
            <span style={{ color: "var(--color-text-primary)" }}>Roles</span>
          </Typography>

          <Button
            variant="contained"
            onClick={() => handleStateChange("createModalOpen", true)}
            sx={{
              backgroundColor: "var(--color-text-primary)",
              color: "var(--color-primary)",
              px: 3,
              py: 1,
              borderRadius: 50,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
            }}
          >
            Create Role +
          </Button>
        </Box>

        {/* Loading */}
        {state.loading && state.roles.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--color-text-muted)" }} />
          </Box>
        )}

        {/* Error or Empty */}
        {state.error && !state.loading && state.roles.length === 0 && <EmptyState />}
        {!state.loading && !state.error && state.roles.length === 0 && <EmptyState />}

        {/* Roles Grid */}
        {state.roles.length > 0 && (
          <Grid container spacing={3}>
            {state.roles.map((role) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={role.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    bgcolor: "var(--color-surface-glass)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    height: "100%",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "var(--color-surface)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Box>
                        <IconButton
                          sx={{
                            backgroundColor: "var(--color-surface-glass)",
                            color: "var(--color-text-primary)",
                            display: "flex",
                            flexDirection: "column",
                            padding: "15px",
                            borderRadius: 1,
                          }}
                        >
                          <span className="border-2 rounded-md border-[var(--color-border-glass)] p-1">
                            <PiRankingFill size={30} className="text-[var(--color-text-secondary)]" />
                          </span>
                        </IconButton>
                      </Box>
                      <Box>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStateChange("selectedRole", role);
                            handleStateChange("anchorEl", e.currentTarget);
                          }}
                          sx={{
                            bgcolor: "var(--color-surface-glass)",
                            borderRadius: 1,
                            color: "var(--color-text-primary)",
                            "&:hover": { bgcolor: "var(--color-surface)" },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Name + Badge */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ color: "var(--color-text-primary)", fontSize: "1.1rem" }}
                      >
                        {role.name}
                      </Typography>
                      <Chip
                        label={
                          role.scopeLevel === 'branch' 
                            ? (!(authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1) 
                                ? 'Branch' 
                                : 'Church'
                              )
                            : role.scopeLevel
                        }
                        size="small"
                        sx={{
                          bgcolor: "var(--color-surface-glass)",
                          color: "var(--color-text-primary)",
                          fontWeight: 500,
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--color-text-muted)",
                        mb: 2,
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {role.description || "No description"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ==================== ACTION MENU ==================== */}
        <Menu
          anchorEl={state.anchorEl}
          open={Boolean(state.anchorEl)}
          onClose={() => handleStateChange("anchorEl", null)}
          PaperProps={{
            sx: {           
              mt: 1,
              bgcolor: "var(--color-primary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-glass)",
              "& .MuiMenuItem-root": {
                fontSize: "0.875rem",
                "&:hover": { bgcolor: "var(--color-surface-glass)" },
              },
            },
          }}
        >
          <MenuItem onClick={() => {
            navigate(`/manage/view-role/${state.selectedRole?.id}`);
            handleStateChange("anchorEl", null);
          }}>
            <Visibility sx={{ mr: 1, fontSize: 20 }} />
            View
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleStateChange("editModalOpen", true);
              handleStateChange("anchorEl", null);
            }}
          >
            <MdOutlineEdit style={{ marginRight: 8, fontSize: 18 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleStateChange("confirmDeleteOpen", true);
              handleStateChange("anchorEl", null);
            }}
            sx={{ color: "#ff6b6b" }}
          >
            <AiOutlineDelete style={{ marginRight: 8, fontSize: 18 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Create Modal */}
        <CreateRoleModel
          open={state.createModalOpen}
          onClose={() => handleStateChange("createModalOpen", false)}
          onSuccess={fetchRoles}
        />

        {/* Edit Modal */}
        {state.selectedRole && (
          <EditRoleModal
            open={state.editModalOpen}
            onClose={() => {
              handleStateChange("editModalOpen", false);
              handleStateChange("selectedRole", null);
            }}
            role={state.selectedRole}
            onSuccess={handleEditSuccess}
            branchId={authData?.branchId || ""}
          />
        )}

        {/* Delete Confirmation */}
        <Dialog
          open={state.confirmDeleteOpen}
          onClose={() => {
            handleStateChange("confirmDeleteOpen", false);
            handleStateChange("selectedRole", null);
          }}
          maxWidth="xs"
          fullWidth
          sx={{
            "& .MuiPaper-root": {
              bgcolor: "var(--color-primary)",
              color: "var(--color-text-primary)",
            }
          }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Delete Role
              </Typography>
              <IconButton
                onClick={() => {
                  handleStateChange("confirmDeleteOpen", false);
                  handleStateChange("selectedRole", null);
                }}
                sx={{ color: "var(--color-text-primary)" }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{state.selectedRole?.name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                handleStateChange("confirmDeleteOpen", false);
                handleStateChange("selectedRole", null);
              }}
              sx={{ color: "var(--color-text-primary)" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={state.loading}
            >
              {state.loading ? <CircularProgress size={20} /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardManager>
  );
};

export default ViewRoles;