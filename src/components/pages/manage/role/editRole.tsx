import React, { useState, useEffect } from "react";
import Api from "../../../shared/api/api";
import { showPageToast } from "../../../util/pageToast";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  SelectChangeEvent,
  FormHelperText,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Grid,
} from "@mui/material";
import { Close } from "@mui/icons-material";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type ScopeLevel = "church" | "branch" | "department" | "unit";

interface Role {
  id: string;
  name: string;
  description?: string;
  scopeLevel: ScopeLevel;
}

interface Branch {
  id: string;
  name: string;
  address: string;
}

// Permission Group as returned by /tenants/permission-groups
interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: Array<{
    id: string;
    name: string;
  }>;
}

// Role + permissions as returned by /tenants/get-role/{id}
interface RolePermissionsResponse {
  role: {
    id: string;
    name: string;
    description?: string;
    scopeLevel: ScopeLevel;
    permissions: Array<{
      id: string;
      name: string;
      group: { id: string; name: string };
    }>;
    permissionGroups: Array<{ id: string; name: string }>;
  };
}

interface Errors {
  name: string;
  branchId: string;
}

interface EditRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  role: Role;
  branchId: string;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  open,
  onClose,
  onSuccess,
  role,
  branchId,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "church" as ScopeLevel,
    description: "",
    branchId: "",
    permissionGroup: [] as string[],
    permissions: [] as string[],
  });

  const [errors, setErrors] = useState<Errors>({ name: "", branchId: "" });
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const authData = useSelector(
    (state: RootState & { auth?: { authData?: any } }) => state.auth?.authData
  );
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const isHeadQuarter = authData?.isHeadQuarter === true;

  const MAX_CHARS = 256;

  // ──────────────────────────────────────────────────────────────
  // Effects
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open && role) {
      setFormData({
        name: role.name,
        type: role.scopeLevel,
        description: role.description || "",
        branchId: branchId,
        permissionGroup: [],
        permissions: [],
      });
      setCharCount(role.description?.length || 0);
      if (isHeadQuarter) fetchBranches();
      fetchPermissionGroups();
      fetchRolePermissions();
    }
  }, [open, role, branchId, isHeadQuarter]);

  // ──────────────────────────────────────────────────────────────
  // API Calls
  // ──────────────────────────────────────────────────────────────

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const { data } = await Api.get<{ branches: Branch[] }>("/church/get-branches");
      setBranches(data.branches || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchPermissionGroups = async () => {
    try {
      setGroupsLoading(true);
      const { data } = await Api.get<{ data: PermissionGroup[] }>("/tenants/permission-groups");
      setPermissionGroups(data.data || []);
    } catch (error) {
      showPageToast("Failed to load permission groups", "error");
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const { data } = await Api.get<RolePermissionsResponse>(`/tenants/get-role/${role.id}`);
      const { permissionGroups, permissions } = data.role;

      const groupIds = permissionGroups.map((g) => g.id);
      const permIds = permissions.map((p) => p.id);

      setFormData((prev) => ({
        ...prev,
        permissionGroup: groupIds,
        permissions: permIds,
      }));
    } catch (err) {
      console.error("Failed to load role permissions", err);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const newErrors: Errors = { name: "", branchId: "" };

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (isHeadQuarter && !formData.branchId) {
      newErrors.branchId = "Please select a branch";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────

  const handleDescriptionChange = (value: string) => {
    if (value.length <= MAX_CHARS) {
      setFormData((prev) => ({ ...prev, description: value }));
      setCharCount(value.length);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "description") {
      handleDescriptionChange(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name as keyof Errors]: "" }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name as keyof Errors]: "" }));
  };

  const handlePermissionGroupChange = (groupId: string, checked: boolean) => {
    setFormData((prev) => {
      const group = permissionGroups.find((g) => g.id === groupId);
      const permIds = group?.permissions.map((p) => p.id) ?? [];

      const newGroups = checked
        ? [...prev.permissionGroup, groupId]
        : prev.permissionGroup.filter((id) => id !== groupId);

      let newPerms = prev.permissions;
      if (checked) {
        newPerms = Array.from(new Set([...prev.permissions, ...permIds]));
      } else {
        newPerms = prev.permissions.filter((id) => !permIds.includes(id));
      }

      return { ...prev, permissionGroup: newGroups, permissions: newPerms };
    });
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => {
      const newPerms = checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter((id) => id !== permissionId);

      const owningGroup = permissionGroups.find((g) =>
        g.permissions.some((p) => p.id === permissionId)
      );

      const newGroups = owningGroup && checked && !prev.permissionGroup.includes(owningGroup.id)
        ? [...prev.permissionGroup, owningGroup.id]
        : prev.permissionGroup;

      return { ...prev, permissions: newPerms, permissionGroup: newGroups };
    });
  };

  const handleUpdateRole = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        scopeLevel: formData.type,
      };

      // === ALWAYS send all selected groups ===
      if (formData.permissionGroup.length > 0) {
        payload.permissionGroup = [...formData.permissionGroup];
      }

      // === Only collect permissions from PARTIAL groups ===
      const partialGroupPermissions: string[] = [];

      for (const groupId of formData.permissionGroup) {
        const group = permissionGroups.find((g) => g.id === groupId);
        if (!group) continue;

        const groupPermissionIds = group.permissions.map((p) => p.id);

        // Get checked permissions for THIS group
        const checkedPermsInGroup = groupPermissionIds.filter((id) =>
          formData.permissions.includes(id)
        );

        const isFullyChecked =
          checkedPermsInGroup.length === groupPermissionIds.length;

        // SKIP if fully checked - don't add its permissions
        if (isFullyChecked) {
          continue;
        }

        // PARTIAL: Add only the checked permissions from this group
        partialGroupPermissions.push(...checkedPermsInGroup);
      }

      // Only add permissions array if there are partial groups
      if (partialGroupPermissions.length > 0) {
        payload.permissions = partialGroupPermissions;
      }    

      await Api.patch(`/tenants/edit-role/${role.id}?branchId=${branchId}`, payload);

      showPageToast(`Role "${formData.name}" updated successfully!`, "success");
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (error: any) {
      console.error("Role update error:", error);
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to update role.";
      showPageToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      type: "church",
      description: "",
      branchId: "",
      permissionGroup: [],
      permissions: [],
    });
    setErrors({ name: "", branchId: "" });
    setCharCount(0);
    onClose();
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="md"
      sx={{ "& .MuiDialog-paper": { borderRadius: 2, bgcolor: "#2C2C2C", py: 3, px: 2 } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600} sx={{ color: "#F6F4FE" }}>
            Edit Role
          </Typography>
          <IconButton onClick={handleCancel}>
            <Close sx={{ color: "#B0B0B0" }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 2 }}>
          {/* Branch Autocomplete */}
          {isHeadQuarter && (
            <FormControl fullWidth size="medium" error={!!errors.branchId}>
              <Autocomplete
                disablePortal
                options={branches.map((b) => ({ label: b.name, value: b.id, address: b.address }))}
                value={
                  formData.branchId
                    ? {
                        label: branches.find((b) => b.id === formData.branchId)?.name || "",
                        value: formData.branchId,
                        address: branches.find((b) => b.id === formData.branchId)?.address || "",
                      }
                    : null
                }
                onChange={(_, v) =>
                  handleSelectChange({ target: { name: "branchId", value: v?.value || "" } } as any)
                }
                getOptionLabel={(o) =>
                  o && typeof o === "object" ? `${o.label}${o.address ? ` — ${o.address}` : ""}` : ""
                }
                loading={branchesLoading}
                renderOption={(props, option) => (
                  <li {...props} key={option.value}>
                    <Box>
                      <Typography sx={{ fontWeight: 500 }}>{option.label}</Typography>
                      {option.address && (
                        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#aaa" }}>
                          {option.address}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Branch *"
                    variant="outlined"
                    placeholder="Select a branch"
                    InputLabelProps={{
                      sx: { fontSize: isLargeScreen ? "1rem" : undefined, color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" } },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        color: "#F6F4FE",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                        "& .MuiSelect-icon": { color: "#F6F4FE" },
                      },
                      endAdornment: (
                        <>
                          {branchesLoading ? <CircularProgress size={16} sx={{ mr: 1, color: "#F6F4FE" }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              {errors.branchId && <FormHelperText error>{errors.branchId}</FormHelperText>}
            </FormControl>
          )}

          {/* Role Name */}
          <TextField
            fullWidth
            label="Role Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            variant="outlined"
            placeholder="e.g. Ministry Direct"
            disabled={loading}
            size="medium"
            error={!!errors.name}
            helperText={errors.name}
            InputLabelProps={{
              sx: { color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" }, fontSize: isLargeScreen ? "1rem" : undefined },
            }}
            InputProps={{
              sx: {
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
          />

          {/* Access Level */}
          <FormControl fullWidth size="medium">
            <InputLabel
              id="type-label"
              sx={{
                fontSize: isLargeScreen ? "1rem" : undefined,
                color: "#F6F4FE",
                "&.Mui-focused": { color: "#F6F4FE" },
              }}
            >
              Access Level *
            </InputLabel>
            <Select
              labelId="type-label"
              name="type"
              value={formData.type}
              onChange={handleSelectChange}
              label="Access Level *"
              disabled={loading}
              sx={{
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#F6F4FE" },
                "& .MuiSelect-select": { color: "#F6F4FE" },
                "& .MuiSelect-icon": { color: "#F6F4FE" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              }}
            >              
              { authData.role === 'branch' && <MenuItem value="branch">{!(authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1) ? 'Branch' : 'Church'}</MenuItem>}
              <MenuItem value="department">Department</MenuItem>
              <MenuItem value="unit">Unit</MenuItem>
            </Select>
          </FormControl>

          {/* Permission Groups */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: "#F6F4FE", mb: 1 }}>
              Permission Groups *
            </Typography>

            {groupsLoading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={20} sx={{ color: "#F6F4FE" }} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {permissionGroups.map((group) => {
                  const isGroupSelected = formData.permissionGroup.includes(group.id);
                  const groupPermIds = group.permissions.map((p) => p.id);
                  const allPermsChecked = groupPermIds.every((id) => formData.permissions.includes(id));
                  const somePermsChecked = groupPermIds.some((id) => formData.permissions.includes(id));

                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={group.id}>
                      <Box
                        sx={{
                          border: `1px solid ${isGroupSelected ? "#F6F4FE" : "#777280"}`,
                          borderRadius: 2,
                          p: 2,
                          bgcolor: isGroupSelected ? "#4d4d4e8e" : "transparent",
                          transition: "all 0.2s",
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isGroupSelected}
                              indeterminate={!isGroupSelected && somePermsChecked}
                              onChange={(e) => handlePermissionGroupChange(group.id, e.target.checked)}
                              sx={{
                                color: "#F6F4FE",
                                "&.Mui-checked": { color: "#F6F4FE" },
                                "&.Mui-indeterminate": { color: "#F6F4FE" },
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontWeight: 600, color: "#F6F4FE" }}>
                                {group.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#aaa", fontSize: "0.8rem" }}>
                                {group.description}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: "flex-start", m: 0 }}
                        />

                        {isGroupSelected && (
                          <Box
                            sx={{
                              mt: 2,
                              pl: 4,
                              opacity: isGroupSelected ? 1 : 0,
                              maxHeight: isGroupSelected ? 500 : 0,
                              overflow: "hidden",
                              transition: "opacity 0.2s ease, max-height 0.3s ease",
                            }}
                          >
                            {group.permissions.map((perm) => (
                              <FormControlLabel
                                key={perm.id}
                                control={
                                  <Checkbox
                                    checked={formData.permissions.includes(perm.id)}
                                    onChange={(e) => handlePermissionChange(perm.id, e.target.checked)}
                                    size="small"
                                    sx={{
                                      color: "#90EE90",
                                      "&.Mui-checked": { color: "#90EE90" },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ fontSize: "0.875rem", color: "#F6F4FE" }}>
                                    {perm.name}
                                  </Typography>
                                }
                                sx={{ m: 0, mb: 0.5 }}
                              />
                            ))}

                            {group.permissions.length > 1 && (
                              <Box sx={{ mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => {
                                    if (allPermsChecked) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        permissions: prev.permissions.filter((id) => !groupPermIds.includes(id)),
                                      }));
                                    } else {
                                      setFormData((prev) => ({
                                        ...prev,
                                        permissions: Array.from(new Set([...prev.permissions, ...groupPermIds])),
                                      }));
                                    }
                                  }}
                                  sx={{
                                    color: allPermsChecked ? "#ff9800" : "#90EE90",
                                    textTransform: "none",
                                    fontSize: "0.75rem",
                                    p: 0,
                                  }}
                                >
                                  {allPermsChecked ? "Deselect all" : "Select all"}
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* Description */}
          <TextField
            fullWidth
            label="Description (Optional)"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            variant="outlined"
            placeholder="Enter role description"
            multiline
            rows={4}
            disabled={loading}
            size="medium"
            inputProps={{ maxLength: MAX_CHARS }}
            InputLabelProps={{
              sx: { color: "#F6F4FE", "&.Mui-focused": { color: "#F6F4FE" }, fontSize: isLargeScreen ? "1rem" : undefined },
            }}
            InputProps={{
              sx: {
                color: "#F6F4FE",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: charCount >= MAX_CHARS ? "#ff9800" : "#777280",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: charCount >= MAX_CHARS ? "#ff9800" : "#F6F4FE",
                },
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
            helperText={
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "#aaa", fontSize: "12px" }}>
                  Max {MAX_CHARS} characters
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: charCount >= MAX_CHARS ? "#ff9800" : "#90EE90",
                    fontSize: "13px",
                    fontWeight: 600,
                    minWidth: 60,
                    textAlign: "right",
                  }}
                >
                  {charCount}/{MAX_CHARS}
                </Typography>
              </Box>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={handleUpdateRole}
          disabled={loading || formData.permissionGroup.length === 0}
          sx={{
            py: 1,
            backgroundColor: "#F6F4FE",
            px: { xs: 2, sm: 2 },
            borderRadius: 50,
            color: "#2C2C2C",
            fontWeight: "semibold",
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1rem" },
            "&:hover": { backgroundColor: "#F6F4FE", opacity: 0.9 },
          }}
        >
          {loading ? (
            <Box display="flex" alignItems="center" color="#777280">
              <CircularProgress size={18} sx={{ color: "#777280", mr: 1 }} />
              Updating...
            </Box>
          ) : (
            "Update Role"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditRoleModal;