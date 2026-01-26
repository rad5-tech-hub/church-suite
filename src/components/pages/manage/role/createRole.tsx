import React, { useState, useEffect } from "react";
import Api from "../../../shared/api/api";
import { usePageToast } from "../../../hooks/usePageToast";
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

interface DepartmentFormData {
  name: string;
  type: "department" | "church" | "branch" | 'unit';
  description?: string;
  branchId?: string;
  permissionGroup: string[];
  permissions: string[];
}

interface Branch {
  id: string;
  address: string;
  name: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: Array<{
    id: string;
    name: string;
    description: string;
    order: number;
  }>;
}

interface Errors {
  name: string;
  branchId: string;
}

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateRoleModel: React.FC<DepartmentModalProps> = ({ open, onClose, onSuccess }) => {
  const initialFormData: DepartmentFormData = {
    name: "",
    type: "church",
    branchId: "",
    permissionGroup: [],
    permissions: [],
  };

  const initialErrors: Errors = {
    name: "",
    branchId: "",
  };

  const [formData, setFormData] = useState<DepartmentFormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const authData = useSelector((state: RootState & { auth?: { authData?: any } }) => state.auth?.authData);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  usePageToast("create-department");
  const isSuperAdmin = authData?.isSuperAdmin === true;
  const isHeadQuarter = authData?.isHeadQuarter === true;

  const MAX_CHARS = 256;

  // Character limit handler
  const handleDescriptionChange = (value: string) => {
    if (value.length <= MAX_CHARS) {
      setFormData((prev) => ({ ...prev, description: value }));
      setCharCount(value.length);
    }
  };

  // Reset on open
  useEffect(() => {
    if (open) {
      const defaultBranchId = isSuperAdmin ? authData?.branchId || "" : "";
      setFormData({
        ...initialFormData,
        branchId: defaultBranchId,
      });
      setCharCount(0);
      fetchBranches();
      fetchPermissionGroups();
    }
  }, [open, isSuperAdmin, authData?.branchId]);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await Api.get("/church/get-branches");
      setBranches(response.data.branches || []);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchPermissionGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await Api.get("/tenants/permission-groups");
      setPermissionGroups(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching permission groups:", error);
      showPageToast("Failed to load permission groups", "error");
    } finally {
      setGroupsLoading(false);
    }
  };

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
        // check **all** permissions of the group
        newPerms = Array.from(new Set([...prev.permissions, ...permIds]));
      } else {
        // un-check **all** permissions that belong to this group
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

      // auto-select the group when any permission is checked
      const owningGroup = permissionGroups.find((g) =>
        g.permissions.some((p) => p.id === permissionId)
      );

      const newGroups = owningGroup && checked && !prev.permissionGroup.includes(owningGroup.id)
        ? [...prev.permissionGroup, owningGroup.id]
        : prev.permissionGroup;

      return { ...prev, permissions: newPerms, permissionGroup: newGroups };
    });
  };

  const handleAddDepartment = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        scopeLevel: formData.type,
      };

      if (formData.branchId) {
        payload.branchId = formData.branchId;
      }

      // === ALWAYS send all selected groups ===
      if (formData.permissionGroup.length > 0) {
        payload.permissionGroup = [...formData.permissionGroup];
      }

      // === Collect permissions ONLY from PARTIAL groups ===
      const partialGroupPermissions: string[] = [];

      for (const groupId of formData.permissionGroup) {
        const group = permissionGroups.find((g) => g.id === groupId);
        if (!group) continue;

        const groupPermissionIds = group.permissions.map((p) => p.id);

        // Count how many permissions are checked in THIS group
        const checkedPermsInGroup = groupPermissionIds.filter((id) =>
          formData.permissions.includes(id)
        );

        const isFullyChecked = checkedPermsInGroup.length === groupPermissionIds.length;

        // SKIP if fully checked - don't add its permissions
        if (isFullyChecked) {
          continue; // ← Skip this group entirely
        }

        // PARTIAL: Add only the checked permissions from this group
        partialGroupPermissions.push(...checkedPermsInGroup);
      }

      // Only add permissions array if there are partial groups
      if (partialGroupPermissions.length > 0) {
        payload.permissions = partialGroupPermissions;
      }

      console.log("=== DEBUG ===");
      console.log("Selected Groups:", formData.permissionGroup);
      console.log("All Checked Permissions:", formData.permissions);
      console.log("Partial Group Permissions Only:", partialGroupPermissions);
      console.log("Final Payload:", JSON.stringify(payload, null, 2));

      const response = await Api.post("/tenants/create-role", payload);

      showPageToast(
        response.data.message || `Role "${formData.name}" created successfully!`,
        "success"
      );

      setFormData(initialFormData);
      setErrors(initialErrors);
      setCharCount(0);
      onSuccess?.();
      setTimeout(onClose, 3000);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create role";
      showPageToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setCharCount(0);
    setBranches([]);
    setPermissionGroups([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md"  sx={{ "& .MuiDialog-paper": { borderRadius: 2, bgcolor: "var(--color-primary)", py: 3, px: 2 } }}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600} sx={{ color: "var(--color-text-primary)" }}>
            Create New Role
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
                      sx: { fontSize: isLargeScreen ? "1rem" : undefined, color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" } },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        color: "var(--color-text-primary)",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                        "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
                        "& .MuiAutocomplete-clearIndicator": { color: "var(--color-text-primary)" },
                        "& .MuiAutocomplete-popupIndicator": { color: "var(--color-text-primary)" },
                      },
                      endAdornment: (
                        <>
                          {branchesLoading ? <CircularProgress size={16} sx={{ mr: 1, color: "var(--color-text-primary)" }} /> : null}
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
              sx: { color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" }, fontSize: isLargeScreen ? "1rem" : undefined },
            }}
            InputProps={{
              sx: {
                color: "var(--color-text-primary)",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
                fontSize: isLargeScreen ? "1rem" : undefined,
              },
            }}
          />

        {/* Type Select */}
        <FormControl fullWidth size="medium">
        <InputLabel
            id="type-label"
            sx={{
            fontSize: isLargeScreen ? "1rem" : undefined,
            color: "var(--color-text-primary)",
            "&.Mui-focused": { color: "var(--color-text-primary)" },
            }}
        >
            Access Level *
        </InputLabel>

        <Select
            labelId="type-label"
            name="type"
            value={formData.type}
            onChange={handleSelectChange}
            label="Type *"
            disabled={loading}
            sx={{
            color: "var(--color-text-primary)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#777280" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-text-primary)" },
            "& .MuiSelect-select": { color: "var(--color-text-primary)" },
            "& .MuiSelect-icon": { color: "var(--color-text-primary)" },
            fontSize: isLargeScreen ? "1rem" : undefined,
            }}
        >
            {authData.role === 'branch' &&<MenuItem value="branch">{!(authData?.isHeadQuarter === false && (authData?.branches?.length ?? 0) === 1)  ? 'Branch' : 'Church'}</MenuItem>}
            <MenuItem value="department">Department</MenuItem>
            <MenuItem value="unit">Unit</MenuItem>
        </Select>
        </FormControl>

        <Box>
            <Typography variant="subtitle2" sx={{ color: "var(--color-text-primary)", mb: 1 }}>
            Permission Groups *
            </Typography>

            {groupsLoading ? (
            <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={20} sx={{ color: "var(--color-text-primary)" }} />
            </Box>
            ) : (
            <Grid container spacing={2}>
                {permissionGroups.map((group) => {
                const isGroupSelected = formData.permissionGroup.includes(group.id);
                const groupPermIds = group.permissions.map((p) => p.id);
                const allPermsChecked = groupPermIds.every((id) =>
                    formData.permissions.includes(id)
                );
                const somePermsChecked = groupPermIds.some((id) =>
                    formData.permissions.includes(id)
                );

                return (
                    <Grid size={{ xs: 12, md: 6 }} key={group.id}>
                    <Box
                        sx={{
                        border: `1px solid ${isGroupSelected ? "var(--color-text-primary)" : "#777280"}`,
                        borderRadius: 2,
                        p: 2,
                        bgcolor: isGroupSelected ? "#4d4d4e8e" : "transparent",
                        transition: "all 0.2s",
                        }}
                    >
                        {/* ---------- GROUP CHECKBOX ---------- */}
                        <FormControlLabel
                        control={
                            <Checkbox
                            checked={isGroupSelected}
                            indeterminate={!isGroupSelected && somePermsChecked}
                            onChange={(e) => handlePermissionGroupChange(group.id, e.target.checked)}
                            sx={{
                                color: "var(--color-text-primary)",
                                "&.Mui-checked": { color: "var(--color-text-primary)" },
                                "&.Mui-indeterminate": { color: "var(--color-text-primary)" },
                            }}
                            />
                        }
                        label={
                            <Box>
                            <Typography sx={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                                {group.name}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#aaa", fontSize: "0.8rem" }}
                            >
                                {group.description}
                            </Typography>
                            </Box>
                        }
                        sx={{ alignItems: "flex-start", m: 0 }}
                        />

                        {/* ---------- PERMISSIONS (shown only when group is selected) ---------- */}
                        {isGroupSelected && (
                        <Box
                            sx={{
                            mt: 2,
                            pl: 4,
                            // optional slide-in animation
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
                                    onChange={(e) =>
                                    handlePermissionChange(perm.id, e.target.checked)
                                    }
                                    size="small"
                                    sx={{
                                    color: "#90EE90",
                                    "&.Mui-checked": { color: "#90EE90" },
                                    }}
                                />
                                }
                                label={
                                <Typography sx={{ fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                                    {perm.name}
                                </Typography>
                                }
                                sx={{ m: 0, mb: 0.5 }}
                            />
                            ))}

                            {/* ---------- SELECT / DESELECT ALL (optional) ---------- */}
                            {group.permissions.length > 1 && (
                            <Box sx={{ mt: 1 }}>
                                <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                    if (allPermsChecked) {
                                    // deselect all
                                    setFormData((prev) => ({
                                        ...prev,
                                        permissions: prev.permissions.filter(
                                        (id) => !groupPermIds.includes(id)
                                        ),
                                    }));
                                    } else {
                                    // select all + ensure group stays checked
                                    setFormData((prev) => ({
                                        ...prev,
                                        permissions: Array.from(
                                        new Set([...prev.permissions, ...groupPermIds])
                                        ),
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
                sx: { color: "var(--color-text-primary)", "&.Mui-focused": { color: "var(--color-text-primary)" }, fontSize: isLargeScreen ? "1rem" : undefined },
            }}
            InputProps={{
                sx: {
                color: "var(--color-text-primary)",
                "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: charCount >= MAX_CHARS ? "#ff9800" : "#777280",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: charCount >= MAX_CHARS ? "#ff9800" : "var(--color-text-primary)",
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
          onClick={handleAddDepartment}
          disabled={loading || formData.permissionGroup.length === 0}
          sx={{
            py: 1,
            backgroundColor: "var(--color-text-primary)",
            px: { xs: 2, sm: 2 },
            borderRadius: 50,
            color: "var(--color-primary)",
            fontWeight: "semibold",
            textTransform: "none",
            fontSize: { xs: "1rem", sm: "1rem" },
            "&:hover": { backgroundColor: "var(--color-text-primary)", opacity: 0.9 },
          }}
        >
          {loading ? (
            <Box display="flex" alignItems="center" color="#777280">
              <CircularProgress size={18} sx={{ color: "#777280", mr: 1 }} />
              Creating...
            </Box>
          ) : (
            "Create Role"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoleModel;