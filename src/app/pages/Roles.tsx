import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Church,
  GitBranch,
  Layers,
  Box,
  Info,
  Eye,
  Users,
  Copy,
  Loader2,
} from 'lucide-react';
import { PERMISSIONS, PERMISSION_CATEGORIES } from '../data/permissions';
import { AdminLevel, Role, Admin } from '../types';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { fetchRoles, createRole, editRole, deleteRole, fetchAdmins, fetchPermissionGroups } from '../api';
import { resolvePrimaryBranchId } from '../utils/scope';
import { deriveAssignablePermissions, buildRolePermissionPayload, mapBackendRolePermissions, type PermissionCatalogGroup } from '../utils/rolePermissionMapping';
import { hasPermission } from '../utils/adminPermissions';

type DialogMode = 'create' | 'edit' | 'view' | null;

const LEVEL_META: Record<AdminLevel, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  church: {
    label: 'Church Level',
    icon: <Church className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Permissions that apply across the entire church organization.',
  },
  branch: {
    label: 'Branch Level',
    icon: <GitBranch className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Anyone with this role can only perform these actions on the specific branch they are assigned to - not across the entire church.',
  },
  department: {
    label: 'Department / Outreach Level',
    icon: <Layers className="w-4 h-4" />,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Permissions scoped to a specific department or outreach. Departments handle internal operations (e.g., prayer team, sanctuary keepers) while outreaches cover external missions (e.g., prison outreach, community programs). Both function the same way.',
  },
  unit: {
    label: 'Unit Level',
    icon: <Box className="w-4 h-4" />,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Permissions scoped to a specific unit within a department or outreach.',
  },
};

export function Roles() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [roleName, setRoleName] = useState('');
  const [roleLevel, setRoleLevel] = useState<AdminLevel>('church');
  const [roleBranchId, setRoleBranchId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  /** Granular: which sub-actions are selected per permission */
  const [granularPerms, setGranularPerms] = useState<Record<string, string[]>>({});
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogGroup[]>([]);

  const canCreateRole = hasPermission(currentAdmin, 'manage-roles', 'create');
  const canEditRole = hasPermission(currentAdmin, 'manage-roles', 'edit');
  const canDeleteRole = hasPermission(currentAdmin, 'manage-roles', 'delete');

  const { showToast } = useToast();
  const primaryBranchId = resolvePrimaryBranchId(branches, currentAdmin);

  // Load from backend
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [rolesResult, adminsResult, permissionGroupsResult] = await Promise.allSettled([
        fetchRoles(primaryBranchId),
        fetchAdmins(),
        fetchPermissionGroups(),
      ]);

      if (rolesResult.status === 'fulfilled') {
        setRoles(rolesResult.value as Role[]);
      } else {
        console.error('Failed to load roles:', rolesResult.reason);
        setRoles([]);
      }

      if (adminsResult.status === 'fulfilled') {
        setAdmins(adminsResult.value as Admin[]);
      } else {
        console.error('Failed to load admins for role counts:', adminsResult.reason);
        setAdmins([]);
      }

      if (permissionGroupsResult.status === 'fulfilled') {
        setPermissionCatalog(permissionGroupsResult.value as PermissionCatalogGroup[]);
      } else {
        console.error('Failed to load permission groups:', permissionGroupsResult.reason);
        setPermissionCatalog([]);
      }

      setLoading(false);
    };
    loadData();
  }, [primaryBranchId]);

  // --- Derived ---
  const permissionLibrary = useMemo(() => {
    const levels: AdminLevel[] = ['church', 'branch', 'department', 'unit'];
    return Array.from(
      new Map(
        levels
          .flatMap((level) => deriveAssignablePermissions({ catalog: permissionCatalog, scopeLevel: level }))
          .map((permission) => [permission.id, permission])
      ).values()
    );
  }, [permissionCatalog]);

  const permissionById = useMemo(
    () => new Map(permissionLibrary.map((permission) => [permission.id, permission])),
    [permissionLibrary]
  );

  const filteredPermissions = useMemo(
    () => deriveAssignablePermissions({ catalog: permissionCatalog, scopeLevel: roleLevel }),
    [permissionCatalog, roleLevel]
  );

  const visibleSelectedPermissionCount = filteredPermissions.filter((permission) => selectedPermissions.includes(permission.id)).length;

  const filteredRoles = roles.filter(r => {
    if (!searchTerm) return true;
    return r.name.toLowerCase().includes(searchTerm.toLowerCase()) || LEVEL_META[r.level].label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const resolvePermissionDefinition = (permissionId: string) => (
    permissionById.get(permissionId) || PERMISSIONS.find((permission) => permission.id === permissionId)
  );

  const getRolePermissions = (permissionIds: string[]) => (
    permissionIds
      .map((permissionId) => resolvePermissionDefinition(permissionId))
      .filter((permission): permission is (typeof PERMISSIONS)[number] => Boolean(permission))
  );

  // --- Helpers ---
  const resetForm = () => {
    setRoleName('');
    setRoleLevel('church');
    setRoleBranchId('');
    setSelectedPermissions([]);
    setGranularPerms({});
  };

  /** Toggle a single sub-action for a permission */
  const toggleAction = (permId: string, actionId: string) => {
    setGranularPerms(prev => {
      const current = prev[permId] || [];
      const updated = current.includes(actionId)
        ? current.filter(a => a !== actionId)
        : [...current, actionId];
      const next = { ...prev, [permId]: updated };
      // Sync selectedPermissions: if any action is checked, include the permission
      if (updated.length > 0) {
        setSelectedPermissions(sp => sp.includes(permId) ? sp : [...sp, permId]);
      } else {
        setSelectedPermissions(sp => sp.filter(id => id !== permId));
        delete next[permId];
      }
      return next;
    });
  };

  /** Toggle all sub-actions for a permission */
  const toggleAllActions = (permId: string, actions: string[]) => {
    setGranularPerms(prev => {
      const current = prev[permId] || [];
      const allSelected = actions.every(a => current.includes(a));
      if (allSelected) {
        const next = { ...prev };
        delete next[permId];
        setSelectedPermissions(sp => sp.filter(id => id !== permId));
        return next;
      } else {
        setSelectedPermissions(sp => sp.includes(permId) ? sp : [...sp, permId]);
        return { ...prev, [permId]: [...actions] };
      }
    });
  };

  const togglePermission = (permissionId: string) => {
    const perm = filteredPermissions.find(p => p.id === permissionId);
    if (perm?.actions && perm.actions.length > 0) {
      // Toggle all actions
      toggleAllActions(permissionId, perm.actions.map(a => a.id));
    } else {
      setSelectedPermissions((prev) =>
        prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
      );
    }
  };

  const toggleAllInCategory = (category: string) => {
    const categoryPerms = filteredPermissions.filter((p) => p.category === category);
    const allSelected = categoryPerms.every((p) => selectedPermissions.includes(p.id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !categoryPerms.some((p) => p.id === id)));
      // Also clear granular
      setGranularPerms(prev => {
        const next = { ...prev };
        categoryPerms.forEach(p => delete next[p.id]);
        return next;
      });
    } else {
      const newIds = categoryPerms.map((p) => p.id).filter((id) => !selectedPermissions.includes(id));
      setSelectedPermissions((prev) => [...prev, ...newIds]);
      // Select all actions for each
      setGranularPerms(prev => {
        const next = { ...prev };
        categoryPerms.forEach(p => {
          if (p.actions && p.actions.length > 0) {
            next[p.id] = p.actions.map(a => a.id);
          }
        });
        return next;
      });
    }
  };

  const getAdminCountForRole = (roleId: string) => admins.filter((a) => a.roleId === roleId).length;

  // --- Handlers ---

  const openCreate = () => {
    if (!canCreateRole) {
      showToast('You do not have permission to create roles.', 'error');
      return;
    }
    resetForm();
    setSelectedRole(null);
    setDialogMode('create');
  };

  const openEdit = (role: Role) => {
    if (!canEditRole) {
      showToast('You do not have permission to edit roles.', 'error');
      return;
    }
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleLevel(role.level);
    setRoleBranchId((role as any).branchId || primaryBranchId || '');
    const mapped = mapBackendRolePermissions({
      permissions: (role as any).rawPermissions || role.permissions,
      permissionGroups: (role as any).rawPermissionGroups || [],
      scopeLevel: role.level,
      catalog: permissionCatalog,
    });
    setSelectedPermissions(mapped.permissions);
    setGranularPerms(mapped.granularPermissions);
    setDialogMode('edit');
  };

  const openView = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedRole(null);
    resetForm();
  };

  const handleCreate = async () => {
    if (!roleName.trim()) return;
    if (!canCreateRole) {
      showToast('You do not have permission to create roles.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildRolePermissionPayload({
        permissionIds: selectedPermissions,
        granularPermissions: granularPerms,
        catalog: permissionCatalog,
      });
      await createRole({
        name: roleName.trim(),
        scopeLevel: (roleLevel === 'unit' ? 'department' : roleLevel) as 'church' | 'branch' | 'department',
        branchId: roleBranchId || primaryBranchId || undefined,
        permissions: payload.permissions,
        permissionGroup: payload.permissionGroup,
      });
      closeDialog();
      showToast(`"${roleName.trim()}" role created successfully!`);
      const rolesData = await fetchRoles(primaryBranchId);
      setRoles(rolesData as Role[]);
    } catch (err: any) {
      console.error('Failed to create role:', err);
      showToast(err?.body?.message || err?.message || 'Failed to create role.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!roleName.trim() || !selectedRole) return;
    if (!canEditRole) {
      showToast('You do not have permission to edit roles.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildRolePermissionPayload({
        permissionIds: selectedPermissions,
        granularPermissions: granularPerms,
        catalog: permissionCatalog,
      });
      await editRole(selectedRole.id, {
        name: roleName.trim(),
        description: (selectedRole as any).description || undefined,
        scopeLevel: (roleLevel === 'unit' ? 'department' : roleLevel) as string,
        permissions: payload.permissions,
        permissionGroup: payload.permissionGroup,
      }, roleBranchId || (selectedRole as any).branchId || primaryBranchId);
      closeDialog();
      showToast(`"${roleName.trim()}" role updated successfully!`);
      const rolesData = await fetchRoles(primaryBranchId);
      setRoles(rolesData as Role[]);
    } catch (err: any) {
      console.error('Failed to update role:', err);
      showToast(err?.body?.message || err?.message || 'Failed to update role.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!canDeleteRole) {
      showToast('You do not have permission to delete roles.', 'error');
      return;
    }
    const name = deleteTarget.name;
    setSaving(true);
    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      showToast(`"${name}" role deleted successfully!`);
      const rolesData = await fetchRoles(primaryBranchId);
      setRoles(rolesData as Role[]);
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      showToast(err?.body?.message || err?.message || 'Failed to delete role.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (role: Role) => {
    if (!canCreateRole) {
      showToast('You do not have permission to duplicate roles.', 'error');
      return;
    }
    setSaving(true);
    try {
      const dupPayload = buildRolePermissionPayload({
        permissionIds: role.permissions,
        granularPermissions: role.granularPermissions,
        catalog: permissionCatalog,
      });
      await createRole({
        name: `${role.name} (Copy)`,
        scopeLevel: (role.level === 'unit' ? 'department' : role.level) as 'church' | 'branch' | 'department',
        branchId: (role as any).branchId || primaryBranchId || undefined,
        permissions: dupPayload.permissions,
        permissionGroup: dupPayload.permissionGroup,
      });
      showToast(`"${role.name}" duplicated!`);
      const rolesData = await fetchRoles(primaryBranchId);
      setRoles(rolesData as Role[]);
    } catch (err: any) {
      console.error('Failed to duplicate role:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Roles & Permissions"
        description="Create custom roles with specific permissions for different levels of church administration. Roles define what actions administrators can perform."
        action={
          canCreateRole
            ? {
                label: 'Create Role',
                onClick: openCreate,
                icon: <Plus className="w-4 h-4 mr-2" />,
              }
            : undefined
        }
      />

      <div className="p-4 md:p-6">

        {loading ? (
          <BibleLoader message="Loading roles..." />
        ) : (
        <>
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {(Object.keys(LEVEL_META) as AdminLevel[]).map((level) => {
            if (level === 'branch' && church.type === 'single') return null;
            const meta = LEVEL_META[level];
            const count = roles.filter((r) => r.level === level).length;
            return (
              <Card key={level}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${meta.color.split(' ')[0]}`}>
                    <span className={meta.color.split(' ')[1]}>{meta.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{meta.label.replace(' Level', '')} Roles</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role Cards */}
        {roles.length === 0 ? (
          <Card>
            <CardContent className="py-16 px-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles defined yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Roles haven't been set up because none have been created yet. Define your first role to control what your administrators can do and see within the church system.
              </p>
              {canCreateRole && (
                <Button onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Role
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search bar - only when roles exist */}
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search roles by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

          {filteredRoles.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <p className="text-gray-500">No roles match your search.</p>
            </CardContent></Card>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRoles.map((role) => {
              const meta = LEVEL_META[role.level];
              const rolePermissions = getRolePermissions(role.permissions);
              const permissionsByCategory = PERMISSION_CATEGORIES.map((category) => ({
                category,
                permissions: rolePermissions.filter((p) => p.category === category),
              })).filter((c) => c.permissions.length > 0);
              const adminCount = getAdminCountForRole(role.id);

              return (
                <Card key={role.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={meta.color}>{meta.label}</Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {adminCount} admin{adminCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Permission Summary */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Permissions ({role.permissions.length})
                        </p>
                        <div className="space-y-3">
                          {permissionsByCategory.slice(0, 3).map(({ category, permissions }) => (
                            <div key={category}>
                              <p className="text-xs font-medium text-gray-500 mb-1">{category}</p>
                              <div className="space-y-1">
                                {permissions.slice(0, 2).map((permission) => (
                                  <div key={permission.id} className="flex items-start gap-2 text-sm">
                                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                                    <span className="text-gray-700 text-xs">{permission.name}</span>
                                  </div>
                                ))}
                                {permissions.length > 2 && (
                                  <p className="text-xs text-gray-400 ml-3">
                                    +{permissions.length - 2} more
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          {permissionsByCategory.length > 3 && (
                            <p className="text-xs text-gray-400">
                              +{permissionsByCategory.length - 3} more categories
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openView(role)}>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        {canEditRole && (
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(role)}>
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        )}
                        {canCreateRole && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDuplicate(role)}
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Duplicate
                          </Button>
                        )}
                        {canDeleteRole && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(role)}
                            disabled={adminCount > 0}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {adminCount > 0 && (
                        <p className="text-xs text-gray-400 text-center">
                          Cannot delete - {adminCount} admin{adminCount !== 1 ? 's' : ''} assigned
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
          </>
        )}
        </>
        )}
      </div>

      {/* ==================== CREATE / EDIT DIALOG ==================== */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Create New Role' : 'Edit Role'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Define a role with specific permissions. Choose an access level first, then select which actions this role can perform.'
                : 'Update this role\'s name, access level, or permissions. Changes apply to all administrators assigned to this role.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Role Name */}
            <div className="space-y-2">
              <Label>Role Name *</Label>
              <Input
                placeholder="e.g., Head Accountant, Youth Leader, Branch Secretary"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Choose a clear, descriptive name so administrators understand this role at a glance
              </p>
            </div>

            {/* Access Level Selection */}
            <div className="space-y-3">
              <div>
                <Label>Access Level *</Label>
                <p className="text-xs text-gray-500 mt-1">
                  The access level determines which permissions are available for this role
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(LEVEL_META) as AdminLevel[]).map((level) => {
                  if (level === 'branch' && church.type === 'single') return null;
                  const meta = LEVEL_META[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setRoleLevel(level);
                        setSelectedPermissions([]);
                        setGranularPerms({});
                      }}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        roleLevel === level
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={roleLevel === level ? 'text-blue-600' : 'text-gray-500'}>
                          {meta.icon}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{meta.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Branch selector intentionally omitted - branch is resolved server-side from tenant context */}

            <Separator />

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Assign Permissions *</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the actions this role can perform at the{' '}
                    <strong>{LEVEL_META[roleLevel].label.toLowerCase()}</strong>
                  </p>
                </div>
                <Badge variant="outline">
                  {visibleSelectedPermissionCount} / {filteredPermissions.length} selected
                </Badge>
              </div>

              {filteredPermissions.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>No permissions are defined for this access level yet.</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const categoryPermissions = filteredPermissions.filter((p) => p.category === category);
                    if (categoryPermissions.length === 0) return null;
                    const allSelected = categoryPermissions.every((p) =>
                      selectedPermissions.includes(p.id)
                    );

                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{category}</h3>
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => toggleAllInCategory(category)}
                          >
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <div className="space-y-3 ml-2">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-start gap-3">
                              <Checkbox
                                id={permission.id}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={permission.id}
                                  className="cursor-pointer text-sm font-medium text-gray-900"
                                >
                                  {permission.name}
                                </Label>
                                <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                                {permission.actions && permission.actions.length > 0 && (
                                  <div className="space-y-1 mt-1">
                                    {permission.actions.map(action => (
                                      <div key={action.id} className="flex items-start gap-2">
                                        <Checkbox
                                          id={`${permission.id}-${action.id}`}
                                          checked={granularPerms[permission.id]?.includes(action.id) || false}
                                          onCheckedChange={() => toggleAction(permission.id, action.id)}
                                        />
                                        <Label
                                          htmlFor={`${permission.id}-${action.id}`}
                                          className="cursor-pointer text-xs text-gray-700"
                                        >
                                          {action.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={closeDialog} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={dialogMode === 'create' ? handleCreate : handleUpdate}
                disabled={saving || !roleName.trim() || selectedPermissions.length === 0}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? (dialogMode === 'create' ? 'Creating...' : 'Saving...') : (dialogMode === 'create' ? 'Create Role' : 'Save Changes')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW DIALOG ==================== */}
      <Dialog open={dialogMode === 'view'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedRole?.name}</DialogTitle>
                <DialogDescription>Role details and assigned permissions</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedRole && (() => {
            const meta = LEVEL_META[selectedRole.level];
            const rolePermissions = getRolePermissions(selectedRole.permissions);
            const permsByCategory = PERMISSION_CATEGORIES.map((cat) => ({
              category: cat,
              permissions: rolePermissions.filter((p) => p.category === cat),
            })).filter((c) => c.permissions.length > 0);
            const adminCount = getAdminCountForRole(selectedRole.id);

            return (
              <div className="space-y-5">
                {/* Meta */}
                <div className="flex flex-wrap gap-3">
                  <Badge className={meta.color}>{meta.label}</Badge>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {adminCount} administrator{adminCount !== 1 ? 's' : ''} assigned
                  </span>
                  <span className="text-sm text-gray-500">
                    Created{' '}
                    {new Date(selectedRole.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedRole.permissions.length}</p>
                    <p className="text-xs text-gray-600">Permissions</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{permsByCategory.length}</p>
                    <p className="text-xs text-gray-600">Categories</p>
                  </div>
                </div>

                {/* All Permissions */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">All Permissions</h4>
                  {permsByCategory.map(({ category, permissions }) => (
                    <div key={category}>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                        {category}
                      </p>
                      <div className="space-y-2">
                        {permissions.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                              <p className="text-xs text-gray-500">{perm.description}</p>
                              {perm.actions && perm.actions.length > 0 && (() => {
                                const grantedActions = selectedRole.granularPermissions?.[perm.id] || perm.actions.map(a => a.id);
                                return (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {perm.actions.map(action => {
                                      const granted = grantedActions.includes(action.id);
                                      return (
                                        <Badge key={action.id} variant="outline" className={`text-[10px] ${granted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200 line-through'}`}>
                                          {action.label}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {(canEditRole || canCreateRole) && (
                  <div className="flex gap-3 pt-3 border-t">
                    {canEditRole && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          closeDialog();
                          openEdit(selectedRole);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Role
                      </Button>
                    )}
                    {canCreateRole && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          closeDialog();
                          handleDuplicate(selectedRole);
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ==================== DELETE CONFIRMATION ==================== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                Are you sure you want to delete the{' '}
                <span className="font-semibold text-gray-900">"{deleteTarget?.name}"</span> role?
              </span>
              <span className="block mt-2 text-sm">
                This action cannot be undone. Make sure no administrators are currently assigned to this
                role before deleting.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {saving ? 'Deleting...' : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}





