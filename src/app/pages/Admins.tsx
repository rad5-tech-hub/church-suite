import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ShieldBan,
  ShieldCheck,
  KeyRound,
  MoreHorizontal,
  Layers,
  Mail,
  AlertTriangle,
  CheckCircle,
  Info,
  Church,
  GitBranch,
  Box,
  Settings2,
  RotateCcw,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  Search,
  Camera,
  Upload,
} from 'lucide-react';
import { PERMISSIONS, PERMISSION_CATEGORIES } from '../data/permissions';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Admin, AdminLevel, Role, Department, Unit } from '../types';
import {
  fetchAdmins,
  saveAdmins,
  fetchRoles,
  fetchDepartments,
  fetchUnits,
  createAdminUser,
  resetAdminPassword,
  deleteAdminUser,
} from '../api';

type DialogMode = 'create' | 'edit' | null;
type ActionMode = 'delete' | 'suspend' | 'activate' | 'reset-password' | null;

const ACCESS_LEVEL_INFO: Record<AdminLevel, { label: string; icon: React.ReactNode; description: string }> = {
  church: {
    label: 'Church',
    icon: <Church className="w-4 h-4" />,
    description: 'Full access across the entire church organization. Best for senior pastors and general overseers.',
  },
  branch: {
    label: 'Branch',
    icon: <GitBranch className="w-4 h-4" />,
    description: 'Access limited to a specific branch location. Best for branch pastors and branch administrators.',
  },
  department: {
    label: 'Department / Outreach',
    icon: <Layers className="w-4 h-4" />,
    description: 'Access limited to a specific department or outreach. Departments handle internal church operations (e.g., prayer, sanctuary cleaning) while outreaches handle external missions (e.g., prison ministry, community feeding).',
  },
  unit: {
    label: 'Unit',
    icon: <Box className="w-4 h-4" />,
    description: 'Access limited to a specific unit within a department. Best for unit leaders and team heads.',
  },
};

export function Admins() {
  const { church, branches } = useChurch();
  const { currentAdmin: loggedInAdmin } = useAuth();

  // Data from backend
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);


  // Temp password dialog
  const [tempPasswordDialog, setTempPasswordDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [tempPasswordEmail, setTempPasswordEmail] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [tempPasswordContext, setTempPasswordContext] = useState<'created' | 'reset' | 'view'>('created');

  // Menu open state per admin
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLevel, setFormLevel] = useState<AdminLevel>('church');
  const [formBranchIds, setFormBranchIds] = useState<string[]>([]);
  const [formDepartmentIds, setFormDepartmentIds] = useState<string[]>([]);
  const [formUnitIds, setFormUnitIds] = useState<string[]>([]);
  const [formRoleId, setFormRoleId] = useState('');
  const [formCustomPermissions, setFormCustomPermissions] = useState<string[]>([]);
  const [showCustomizePermissions, setShowCustomizePermissions] = useState(false);
  const [formProfilePicture, setFormProfilePicture] = useState<string | undefined>(undefined);
  const adminPicInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsData, rolesData, deptsData, unitsData] = await Promise.all([
        fetchAdmins(),
        fetchRoles(branches[0]?.id),
        fetchDepartments(),
        fetchUnits(),
      ]);
      // API already scopes by tenant — no client-side churchId filter needed
      setAdmins(adminsData as Admin[]);
      setRoles(rolesData as Role[]);
      setDepartments(deptsData as Department[]);
      setUnits(unitsData as Unit[]);
    } catch (err) {
      console.error('Failed to load admins data:', err);
    } finally {
      setLoading(false);
    }
  }, [church.id, branches]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close menu on outside click
  useEffect(() => {
    if (openMenuId) {
      const handler = () => setOpenMenuId(null);
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [openMenuId]);

  // Auto-load role permissions when role changes
  useEffect(() => {
    if (formRoleId) {
      const role = roles.find((r) => r.id === formRoleId);
      if (role) {
        setFormCustomPermissions([...role.permissions]);
      }
    } else {
      setFormCustomPermissions([]);
      setShowCustomizePermissions(false);
    }
  }, [formRoleId, roles]);



  // --- Derived data ---
  const filteredAdmins = admins.filter(a => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.phone && a.phone.includes(q));
  });
  const rolesForLevel = roles.filter((r) => r.level === formLevel);
  const departmentsForSelection = formBranchIds.length > 0
    ? departments.filter((d) => d.branchId && formBranchIds.includes(d.branchId))
    : departments;
  const unitsForSelection = formDepartmentIds.length > 0
    ? units.filter((u) => formDepartmentIds.includes(u.departmentId))
    : units;

  const availablePermissionsForLevel = PERMISSIONS.filter((p) => p.level.includes(formLevel));
  const selectedRolePreset = roles.find((r) => r.id === formRoleId);
  const presetPermissionIds = selectedRolePreset?.permissions ?? [];

  const isCustomized =
    formRoleId &&
    formCustomPermissions.length > 0 &&
    (formCustomPermissions.length !== presetPermissionIds.length ||
      !presetPermissionIds.every((id) => formCustomPermissions.includes(id)));

  const customAddedCount = formCustomPermissions.filter((id) => !presetPermissionIds.includes(id)).length;
  const customRemovedCount = presetPermissionIds.filter((id) => !formCustomPermissions.includes(id)).length;

  // --- Helpers ---
  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormLevel('church');
    setFormBranchIds([]);
    setFormDepartmentIds([]);
    setFormUnitIds([]);
    setFormRoleId('');
    setFormCustomPermissions([]);
    setShowCustomizePermissions(false);
    setFormProfilePicture(undefined);
  };

  const { showToast } = useToast();
  const showSuccess = showToast;

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? (roleId ? 'Unknown' : 'No role assigned');
  const getBranchName = (branchId?: string) => branches.find((b) => b.id === branchId)?.name ?? '';
  const getDeptName = (deptId?: string) => departments.find((d) => d.id === deptId)?.name ?? '';
  const getUnitName = (unitId?: string) => units.find((u) => u.id === unitId)?.name ?? '';

  const getLevelBadgeColor = (level: AdminLevel) => {
    switch (level) {
      case 'church': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'branch': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'department': return 'bg-green-100 text-green-800 border-green-200';
      case 'unit': return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getStatusBadge = (admin: Admin) => {
    if (admin.status === 'suspended') return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>;
    if (admin.isSuperAdmin) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Super Admin</Badge>;
    return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
  };

  const getScopeLabel = (admin: Admin) => {
    const parts: string[] = [];
    const bIds = admin.branchIds?.length ? admin.branchIds : admin.branchId ? [admin.branchId] : [];
    const dIds = admin.departmentIds?.length ? admin.departmentIds : admin.departmentId ? [admin.departmentId] : [];
    const uIds = admin.unitIds?.length ? admin.unitIds : admin.unitId ? [admin.unitId] : [];
    if (bIds.length > 0) parts.push(bIds.map(id => getBranchName(id)).filter(Boolean).join(', '));
    if (dIds.length > 0) parts.push(dIds.map(id => getDeptName(id)).filter(Boolean).join(', '));
    if (uIds.length > 0) parts.push(uIds.map(id => getUnitName(id)).filter(Boolean).join(', '));
    return parts.length > 0 ? parts.join(' > ') : 'Entire Church';
  };

  // --- Handlers ---

  const openCreate = () => {
    resetForm();
    setDialogMode('create');
  };

  const openEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormPhone(admin.phone || '');
    setFormLevel(admin.level);
    setFormBranchIds(admin.branchIds?.length ? [...admin.branchIds] : admin.branchId ? [admin.branchId] : []);
    setFormDepartmentIds(admin.departmentIds?.length ? [...admin.departmentIds] : admin.departmentId ? [admin.departmentId] : []);
    setFormUnitIds(admin.unitIds?.length ? [...admin.unitIds] : admin.unitId ? [admin.unitId] : []);
    setFormRoleId(admin.roleId);
    setFormProfilePicture(admin.profilePicture);
    if (admin.customPermissions && admin.customPermissions.length > 0) {
      setTimeout(() => {
        setFormCustomPermissions([...admin.customPermissions!]);
        setShowCustomizePermissions(true);
      }, 0);
    }
    setDialogMode('edit');
    setOpenMenuId(null);
  };

  const openAction = (admin: Admin, mode: ActionMode) => {
    setSelectedAdmin(admin);
    setActionMode(mode);
    setOpenMenuId(null);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedAdmin(null);
    resetForm();
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) return;
    setSaving(true);

    try {
      const adminRecord = {
        id: `admin-${Date.now()}`,
        churchId: church.id,
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        profilePicture: formProfilePicture,
        roleId: formRoleId || '',
        level: formLevel,
        isSuperAdmin: false,
        status: 'active',
        branchId: formLevel === 'branch' ? formBranchIds[0] || undefined : undefined,
        departmentId: ['department', 'unit'].includes(formLevel) ? formDepartmentIds[0] || undefined : undefined,
        unitId: formLevel === 'unit' ? formUnitIds[0] || undefined : undefined,
        branchIds: formLevel === 'branch' && formBranchIds.length > 0 ? formBranchIds : undefined,
        departmentIds: ['department', 'unit'].includes(formLevel) && formDepartmentIds.length > 0 ? formDepartmentIds : undefined,
        unitIds: formLevel === 'unit' && formUnitIds.length > 0 ? formUnitIds : undefined,
        customPermissions: showCustomizePermissions ? formCustomPermissions : undefined,
        createdAt: new Date().toISOString(),
      };

      // Create auth user on server (generates temp password)
      const result = await createAdminUser({
        email: formEmail.trim(),
        name: formName.trim(),
        admin: adminRecord,
      });

      // Add to local state
      // Reload admins list from API to get real server-assigned IDs
      const freshAdmins = await fetchAdmins();
      setAdmins(freshAdmins as Admin[]);

      setDialogMode(null);
      resetForm();

      // API sends a verification email — no temp password returned
      showSuccess('Administrator created successfully. A verification email has been sent.');
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      showSuccess(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formName.trim() || !formEmail.trim() || !selectedAdmin) return;
    setSaving(true);

    try {
      // Fetch ALL admins from server (not just filtered), update the specific one, save back
      const allAdmins = await fetchAdmins();
      const updatedAll = (allAdmins as Admin[]).map((a) =>
        a.id === selectedAdmin.id
          ? {
              ...a,
              name: formName.trim(),
              email: formEmail.trim(),
              phone: formPhone.trim() || undefined,
              profilePicture: formProfilePicture,
              roleId: formRoleId || a.roleId,
              level: formLevel,
              branchId: formLevel === 'branch' ? formBranchIds[0] || undefined : undefined,
              departmentId: ['department', 'unit'].includes(formLevel) ? formDepartmentIds[0] || undefined : undefined,
              unitId: formLevel === 'unit' ? formUnitIds[0] || undefined : undefined,
              branchIds: formLevel === 'branch' && formBranchIds.length > 0 ? formBranchIds : undefined,
              departmentIds: ['department', 'unit'].includes(formLevel) && formDepartmentIds.length > 0 ? formDepartmentIds : undefined,
              unitIds: formLevel === 'unit' && formUnitIds.length > 0 ? formUnitIds : undefined,
              customPermissions: showCustomizePermissions ? formCustomPermissions : undefined,
            }
          : a
      );
      await saveAdmins(updatedAll);
      // Update local state
      setAdmins(updatedAll);
      closeDialog();
      showSuccess(`"${formName.trim()}" updated successfully.`);
    } catch (err: any) {
      console.error('Failed to update admin:', err);
      showSuccess(`Error updating administrator: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    const name = selectedAdmin.name;

    try {
      await deleteAdminUser({
        authUserId: selectedAdmin.authUserId,
        adminId: selectedAdmin.id,
      });
      setAdmins(prev => prev.filter(a => a.id !== selectedAdmin.id));
      setActionMode(null);
      setSelectedAdmin(null);
      showSuccess(`"${name}" has been removed.`);
    } catch (err: any) {
      console.error('Failed to delete admin:', err);
      showSuccess(`Error deleting administrator: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    const newStatus = selectedAdmin.status === 'active' ? 'suspended' : 'active';
    const name = selectedAdmin.name;

    try {
      // Fetch ALL admins, update the specific one, save back
      const allAdmins = await fetchAdmins();
      const updatedAll = (allAdmins as Admin[]).map(a => a.id === selectedAdmin.id ? { ...a, status: newStatus } : a);
      await saveAdmins(updatedAll);
      // Update local state
      setAdmins(updatedAll as Admin[]);
      setActionMode(null);
      setSelectedAdmin(null);
      showSuccess(
        newStatus === 'suspended'
          ? `"${name}" has been suspended. They can no longer access the platform.`
          : `"${name}" has been reactivated.`
      );
    } catch (err: any) {
      console.error('Failed to toggle suspend:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;
    setSaving(true);

    try {
      const result = await resetAdminPassword({
        authUserId: selectedAdmin.authUserId,
        email: selectedAdmin.email,
        adminId: selectedAdmin.id,
      });

      // Update the local admin record with new temp password
      setAdmins(prev => prev.map(a => a.id === selectedAdmin.id ? { ...a, lastTempPassword: result.tempPassword } : a));

      setActionMode(null);
      const resetEmail = selectedAdmin.email;
      setSelectedAdmin(null);

      // Show temp password dialog
      setTempPassword(result.tempPassword);
      setTempPasswordEmail(resetEmail);
      setShowTempPassword(false);
      setCopiedPassword(false);
      setTempPasswordDialog(true);
      setTempPasswordContext('reset');
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      showSuccess(`Error resetting password: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewPassword = (admin: Admin) => {
    setOpenMenuId(null);
    if (admin.lastTempPassword) {
      setTempPassword(admin.lastTempPassword);
      setTempPasswordEmail(admin.email);
      setShowTempPassword(false);
      setCopiedPassword(false);
      setTempPasswordDialog(true);
      setTempPasswordContext('view');
    } else {
      showSuccess(`No temporary password stored for ${admin.name}. Use "Reset Password" to generate a new one.`);
    }
  };

  const copyTempPassword = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    });
  };

  const isFormValid =
    formName.trim() &&
    formEmail.trim() &&
    formRoleId &&
    (formLevel !== 'branch' || formBranchIds.length > 0) &&
    (formLevel !== 'department' || formDepartmentIds.length > 0) &&
    (formLevel !== 'unit' || (formDepartmentIds.length > 0 && formUnitIds.length > 0));

  return (
    <Layout>
      <PageHeader
        title="Administrators"
        description="Manage your church administrators, and control what they can access across your entire church from here."
        action={{
          label: 'Add Administrator',
          onClick: openCreate,
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
      />

      <div className="p-4 md:p-6">

        {loading ? (
          <BibleLoader message="Loading administrators..." />
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
                    <p className="text-xs text-gray-500">Total Admins</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {admins.filter((a) => a.status === 'active').length}
                    </p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ShieldBan className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {admins.filter((a) => a.status === 'suspended').length}
                    </p>
                    <p className="text-xs text-gray-500">Suspended</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <KeyRound className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {admins.filter((a) => a.isSuperAdmin).length}
                    </p>
                    <p className="text-xs text-gray-500">Super Admins</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admins Table */}
            {admins.length === 0 ? (
              <Card>
                <CardContent className="py-16 px-4 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No administrators yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Your administrator list is empty because no one has been added yet. Start by adding your first administrator to control access and manage roles across your church.
                  </p>
                  <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Administrator
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Search bar - only when admins exist */}
                <div className="mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              <Card>
                <CardContent className="p-0">
                  {/* Mobile cards */}
                  <div className="block md:hidden divide-y divide-gray-100">
                    {filteredAdmins.map((admin) => (
                      <div key={admin.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {admin.profilePicture ? (
                              <img src={admin.profilePicture} alt={admin.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                                {admin.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{admin.name}</p>
                              <p className="text-xs text-gray-500">{admin.email}</p>
                            </div>
                          </div>
                          <div className="relative">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === admin.id ? null : admin.id); }}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            {openMenuId === admin.id && (
                              <AdminActionsMenu
                                admin={admin}
                                onEdit={() => openEdit(admin)}
                                onSuspend={() => openAction(admin, admin.status === 'active' ? 'suspend' : 'activate')}
                                onDelete={() => openAction(admin, 'delete')}
                                onResetPassword={() => openAction(admin, 'reset-password')}
                                onViewPassword={() => handleViewPassword(admin)}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getLevelBadgeColor(admin.level)}>
                            {ACCESS_LEVEL_INFO[admin.level].label}
                          </Badge>
                          {getStatusBadge(admin)}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Role:</span> {getRoleName(admin.roleId)}
                          {admin.customPermissions && admin.customPermissions.length > 0 && (
                            <Badge className="ml-1 bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0">
                              Customized
                            </Badge>
                          )}
                          {' '}&middot;{' '}
                          <span className="font-medium">Scope:</span> {getScopeLabel(admin)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Administrator</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Access Level</TableHead>
                          <TableHead>Scope</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdmins.map((admin) => (
                          <TableRow key={admin.id} className={admin.status === 'suspended' ? 'opacity-60' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {admin.profilePicture ? (
                                  <img src={admin.profilePicture} alt={admin.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                                ) : (
                                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                                    {admin.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{admin.name}</p>
                                  <p className="text-xs text-gray-500">{admin.email}</p>
                                  {admin.phone && <p className="text-xs text-gray-400">{admin.phone}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{getRoleName(admin.roleId)}</span>
                              {admin.customPermissions && admin.customPermissions.length > 0 && (
                                <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0">
                                  Customized
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getLevelBadgeColor(admin.level)}>
                                {ACCESS_LEVEL_INFO[admin.level].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">{getScopeLabel(admin)}</span>
                            </TableCell>
                            <TableCell>{getStatusBadge(admin)}</TableCell>
                            <TableCell>
                              <div className="flex justify-end relative">
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === admin.id ? null : admin.id); }}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                                {openMenuId === admin.id && (
                                  <AdminActionsMenu
                                    admin={admin}
                                    onEdit={() => openEdit(admin)}
                                    onSuspend={() => openAction(admin, admin.status === 'active' ? 'suspend' : 'activate')}
                                    onDelete={() => openAction(admin, 'delete')}
                                    onResetPassword={() => openAction(admin, 'reset-password')}
                                    onViewPassword={() => handleViewPassword(admin)}
                                  />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              </>
            )}
          </>
        )}
      </div>

      {/* ==================== CREATE / EDIT DIALOG ==================== */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Add New Administrator' : 'Edit Administrator'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Create a new administrator and assign their access level and role. A temporary password will be generated for them to log in.'
                : "Update this administrator's details, access level, or role assignment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {formProfilePicture ? (
                    <img src={formProfilePicture} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                      {formName ? formName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <Camera className="w-5 h-5 text-gray-400" />}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => adminPicInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50"
                    title="Upload photo"
                  >
                    <Camera className="w-3 h-3 text-gray-600" />
                  </button>
                  <input
                    ref={adminPicInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 300 * 1024) { alert('Image must be under 300KB.'); return; }
                      const reader = new FileReader();
                      reader.onload = () => setFormProfilePicture(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Profile Photo</p>
                  <p className="text-xs text-gray-500">Optional. JPG, PNG, or WebP up to 300KB.</p>
                  {formProfilePicture && (
                    <button type="button" onClick={() => setFormProfilePicture(undefined)} className="text-xs text-red-500 hover:text-red-700 mt-1">
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name *</Label>
                <Input id="admin-name" placeholder="e.g., Pastor Jane Doe" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email Address *</Label>
                  <Input id="admin-email" type="email" placeholder="jane@church.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} disabled={dialogMode === 'edit'} />
                  {dialogMode === 'edit' && (
                    <p className="text-xs text-gray-400">Email cannot be changed after creation.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-phone">Phone Number</Label>
                  <Input id="admin-phone" type="tel" placeholder="+1 (555) 000-0000" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div className="space-y-3">
              <div>
                <Label>Access Level *</Label>
                <p className="text-xs text-gray-500 mt-1">This determines what parts of the church this administrator can manage</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(ACCESS_LEVEL_INFO) as AdminLevel[]).map((level) => {
                  if (level === 'branch' && church.type === 'single') return null;
                  const info = ACCESS_LEVEL_INFO[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => { setFormLevel(level); setFormRoleId(''); setFormBranchIds([]); setFormDepartmentIds([]); setFormUnitIds([]); }}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        formLevel === level ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={formLevel === level ? 'text-blue-600' : 'text-gray-500'}>{info.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{info.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional: Branch Selection (multi) */}
            {formLevel === 'branch' && church.type === 'multi' && (
              <div className="space-y-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                <Label>Select Branch(es) *</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {branches.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-purple-100/50 cursor-pointer">
                      <Checkbox
                        checked={formBranchIds.includes(b.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setFormBranchIds(prev => [...prev, b.id]);
                          else setFormBranchIds(prev => prev.filter(id => id !== b.id));
                        }}
                      />
                      <span className="text-sm text-gray-700">{b.name} {b.isHeadquarters ? '(HQ)' : ''}</span>
                    </label>
                  ))}
                </div>
                {formBranchIds.length > 1 && (
                  <p className="text-xs text-purple-700 font-medium">{formBranchIds.length} branches selected — this admin will manage all of them.</p>
                )}
                {formBranchIds.length <= 1 && (
                  <p className="text-xs text-purple-700">Select one or more branches. This administrator will have access to the selected branches and their departments/units.</p>
                )}
              </div>
            )}

            {/* Conditional: Department Selection (multi) */}
            {(formLevel === 'department' || formLevel === 'unit') && (
              <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-100">
                <Label>Select Department(s) / Outreach(es) *</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {departmentsForSelection.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-green-100/50 cursor-pointer">
                      <Checkbox
                        checked={formDepartmentIds.includes(d.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setFormDepartmentIds(prev => [...prev, d.id]);
                          else {
                            setFormDepartmentIds(prev => prev.filter(id => id !== d.id));
                            // Also remove any units belonging to this dept
                            const deptUnitIds = units.filter(u => u.departmentId === d.id).map(u => u.id);
                            setFormUnitIds(prev => prev.filter(id => !deptUnitIds.includes(id)));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{d.name} <span className="text-gray-400">({d.type})</span></span>
                    </label>
                  ))}
                </div>
                {formDepartmentIds.length > 1 && (
                  <p className="text-xs text-green-700 font-medium">{formDepartmentIds.length} departments selected.</p>
                )}
                {formDepartmentIds.length <= 1 && (
                  <p className="text-xs text-green-700">
                    {formLevel === 'department'
                      ? 'Select one or more departments/outreaches. This administrator will manage everything within them.'
                      : 'First select the department(s), then choose units below.'}
                  </p>
                )}
              </div>
            )}

            {/* Conditional: Unit Selection (multi) */}
            {formLevel === 'unit' && formDepartmentIds.length > 0 && (
              <div className="space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <Label>Select Unit(s) *</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {unitsForSelection.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-orange-100/50 cursor-pointer">
                      <Checkbox
                        checked={formUnitIds.includes(u.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setFormUnitIds(prev => [...prev, u.id]);
                          else setFormUnitIds(prev => prev.filter(id => id !== u.id));
                        }}
                      />
                      <span className="text-sm text-gray-700">{u.name}</span>
                    </label>
                  ))}
                </div>
                {formUnitIds.length > 1 && (
                  <p className="text-xs text-orange-700 font-medium">{formUnitIds.length} units selected.</p>
                )}
                {formUnitIds.length <= 1 && (
                  <p className="text-xs text-orange-700">Select one or more units. This administrator will manage members and activities within them.</p>
                )}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Assign Role <span className="text-red-500">*</span></Label>
              {rolesForLevel.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    No roles found for the <strong>{ACCESS_LEVEL_INFO[formLevel].label}</strong> level.
                    Create a role for this level first from the <strong>Roles & Permissions</strong> page.
                  </span>
                </div>
              ) : (
                <>
                  <Select value={formRoleId} onValueChange={setFormRoleId}>
                    <SelectTrigger><SelectValue placeholder="Choose a role..." /></SelectTrigger>
                    <SelectContent>
                      {rolesForLevel.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Roles determine what actions this administrator can perform.</p>
                </>
              )}
            </div>

            {/* Customize Permissions */}
            {formRoleId && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Customize Permissions
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">The selected role acts as a preset. You can fine-tune permissions for this specific administrator.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomizePermissions(!showCustomizePermissions)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      showCustomizePermissions ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {showCustomizePermissions ? 'Hide' : 'Customize'}
                  </button>
                </div>

                {showCustomizePermissions && (
                  <div className="space-y-4 mt-2">
                    <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${
                      isCustomized ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Settings2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCustomized ? 'text-amber-600' : 'text-gray-500'}`} />
                        <span className={isCustomized ? 'text-amber-800' : 'text-gray-600'}>
                          {isCustomized
                            ? `Customized: ${customAddedCount > 0 ? `+${customAddedCount} added` : ''}${customAddedCount > 0 && customRemovedCount > 0 ? ', ' : ''}${customRemovedCount > 0 ? `-${customRemovedCount} removed` : ''} from "${selectedRolePreset?.name}" preset`
                            : `Using "${selectedRolePreset?.name}" preset as-is (${presetPermissionIds.length} permissions)`}
                        </span>
                      </div>
                      {isCustomized && (
                        <button type="button" onClick={() => setFormCustomPermissions([...presetPermissionIds])} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 flex-shrink-0 ml-2">
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {PERMISSION_CATEGORIES.map((category) => {
                        const categoryPerms = availablePermissionsForLevel.filter((p) => p.category === category);
                        if (categoryPerms.length === 0) return null;
                        return (
                          <div key={category} className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{category}</p>
                            <div className="space-y-2 ml-1">
                              {categoryPerms.map((p) => {
                                const isInPreset = presetPermissionIds.includes(p.id);
                                const isChecked = formCustomPermissions.includes(p.id);
                                const wasAdded = isChecked && !isInPreset;
                                const wasRemoved = !isChecked && isInPreset;
                                return (
                                  <div key={p.id} className={`flex items-start gap-3 p-2 rounded-md transition-colors ${wasAdded ? 'bg-green-50' : wasRemoved ? 'bg-red-50' : ''}`}>
                                    <Checkbox
                                      id={`perm-${p.id}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        setFormCustomPermissions((prev) => checked ? [...prev, p.id] : prev.filter((id) => id !== p.id))
                                      }
                                    />
                                    <div className="flex-1">
                                      <Label htmlFor={`perm-${p.id}`} className="cursor-pointer text-sm font-medium text-gray-900 flex items-center gap-2">
                                        {p.name}
                                        {wasAdded && <span className="text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Added</span>}
                                        {wasRemoved && <span className="text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded">Removed</span>}
                                      </Label>
                                      <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t">
              <Button variant="outline" className="flex-1" onClick={closeDialog} disabled={saving}>Cancel</Button>
              <Button className="flex-1" disabled={!isFormValid || saving} onClick={dialogMode === 'create' ? handleCreate : handleUpdate}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {dialogMode === 'create' ? 'Create Administrator' : 'Save Changes'}
              </Button>
            </div>

            {/* Microcopy about email */}
            {dialogMode === 'create' && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  A secure temporary password will be generated when you click "Create Administrator".
                  You'll be shown the password so you can share it with the new admin. They can use it to log in right away.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== TEMP PASSWORD DIALOG ==================== */}
      <Dialog open={tempPasswordDialog} onOpenChange={setTempPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tempPasswordContext === 'created' ? (
                <><CheckCircle className="w-5 h-5 text-green-600" /> Administrator Created Successfully</>
              ) : tempPasswordContext === 'reset' ? (
                <><KeyRound className="w-5 h-5 text-blue-600" /> Password Reset Successful</>
              ) : (
                <><Eye className="w-5 h-5 text-gray-600" /> Stored Temporary Password</>
              )}
            </DialogTitle>
            <DialogDescription>
              {tempPasswordContext === 'created' ? (
                <>A temporary password has been generated for <strong>{tempPasswordEmail}</strong>. Share this password with the administrator so they can log in.</>
              ) : tempPasswordContext === 'reset' ? (
                <>A new temporary password has been generated for <strong>{tempPasswordEmail}</strong>. Their old password no longer works. Share this new password with them.</>
              ) : (
                <>This is the last temporary password generated for <strong>{tempPasswordEmail}</strong>. If it no longer works, use "Reset Password" to generate a new one.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Label className="text-xs text-gray-500 mb-2 block">Temporary Password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {showTempPassword ? tempPassword : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                </code>
                <Button variant="ghost" size="sm" onClick={() => setShowTempPassword(!showTempPassword)}>
                  {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={copyTempPassword}>
                  {copiedPassword ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {tempPasswordContext !== 'view' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Make sure to copy or write down this password before closing this dialog.
                  The administrator can change it after logging in.
                </p>
              </div>
            )}

            {tempPasswordContext === 'view' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  This is the last generated password. If the admin has already changed their password, this may no longer be valid.
                  Use "Reset Password" to generate a fresh one.
                </p>
              </div>
            )}

            <Button className="w-full" onClick={() => setTempPasswordDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== DELETE CONFIRMATION ==================== */}
      <AlertDialog open={actionMode === 'delete'} onOpenChange={(open) => !open && setActionMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Administrator
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                Are you sure you want to permanently remove{' '}
                <span className="font-semibold text-gray-900">"{selectedAdmin?.name}"</span> as an administrator?
              </span>
              <span className="block mt-2 text-sm">
                They will immediately lose all access to the platform. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Administrator
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== SUSPEND / ACTIVATE CONFIRMATION ==================== */}
      <AlertDialog open={actionMode === 'suspend' || actionMode === 'activate'} onOpenChange={(open) => !open && setActionMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionMode === 'suspend' ? <ShieldBan className="w-5 h-5 text-orange-500" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
              {actionMode === 'suspend' ? 'Suspend Administrator' : 'Reactivate Administrator'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionMode === 'suspend' ? (
                <span className="block">
                  Suspending <span className="font-semibold text-gray-900">"{selectedAdmin?.name}"</span> will immediately block their access. Their account and data will be preserved.
                </span>
              ) : (
                <span className="block">
                  Reactivating <span className="font-semibold text-gray-900">"{selectedAdmin?.name}"</span> will restore their access with their existing role and permissions.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleSuspend} disabled={saving} className={actionMode === 'suspend' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionMode === 'suspend' ? <><ShieldBan className="w-4 h-4 mr-2" />Suspend</> : <><ShieldCheck className="w-4 h-4 mr-2" />Reactivate</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== RESET PASSWORD CONFIRMATION ==================== */}
      <AlertDialog open={actionMode === 'reset-password'} onOpenChange={(open) => !open && setActionMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-500" />
              Reset Password
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                A new temporary password will be generated for{' '}
                <span className="font-semibold text-gray-900">{selectedAdmin?.email}</span>.
              </span>
              <span className="block mt-2 text-sm">
                Their current password will stop working immediately. You'll be shown the new temporary password to share with them.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <KeyRound className="w-4 h-4 mr-2" />
              Generate New Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

// --- Actions Dropdown Menu ---
function AdminActionsMenu({
  admin,
  onEdit,
  onSuspend,
  onDelete,
  onResetPassword,
  onViewPassword,
}: {
  admin: Admin;
  onEdit: () => void;
  onSuspend: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  onViewPassword: () => void;
}) {
  return (
    <div
      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={onEdit}>
        <Edit className="w-4 h-4" />
        Edit
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={onViewPassword}>
        <Eye className="w-4 h-4" />
        View Password
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={onResetPassword}>
        <KeyRound className="w-4 h-4" />
        Reset Password
      </button>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={onSuspend}>
        {admin.status === 'active' ? (
          <><ShieldBan className="w-4 h-4 text-orange-500" /><span className="text-orange-700">Suspend</span></>
        ) : (
          <><ShieldCheck className="w-4 h-4 text-green-500" /><span className="text-green-700">Reactivate</span></>
        )}
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}