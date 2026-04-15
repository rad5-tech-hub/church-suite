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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
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
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Admin, AdminLevel, Role, Department, Unit } from '../types';
import { getManageableAdminLevels, hasAdminManagementPermission } from '../utils/adminPermissions';
import {
  fetchAdmins,
  fetchAdmin,
  editAdmin,
  assignRoleToAdmin,
  suspendAdmin,
  fetchRoles,
  fetchDepartments,
  fetchUnits,
  createAdminUser,
  resetAdminPassword,
  deleteAdminUser,
  editRole,
  fetchPermissionGroups,
} from '../api';
import {
  buildRolePermissionPayload,
  deriveAssignablePermissions,
  type PermissionCatalogGroup,
} from '../utils/rolePermissionMapping';
import { groupPermissionsForDisplay } from '../utils/permissionCategoryDisplay';
import { friendlyError } from '../utils/friendlyError';

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
    description: 'Access limited to a specific branch location. Best for branch pastors and branch leaders.',
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

const ADMINS_PAGE_SIZE = 10;

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('ellipsis-left');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('ellipsis-right');
  pages.push(totalPages);

  return pages;
}

function uniquePermissionIds(permissionIds?: string[]) {
  return Array.from(new Set((permissionIds || []).filter(Boolean)));
}

function normalizeGranularPermissions(granularPermissions?: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(granularPermissions || {})
      .filter(([, actions]) => Array.isArray(actions) && actions.length > 0)
      .map(([permissionId, actions]) => [permissionId, Array.from(new Set(actions.filter(Boolean)))])
  );
}

function areGranularPermissionsEqual(
  left?: Record<string, string[]>,
  right?: Record<string, string[]>
) {
  const normalizedLeft = normalizeGranularPermissions(left);
  const normalizedRight = normalizeGranularPermissions(right);
  const permissionIds = new Set([...Object.keys(normalizedLeft), ...Object.keys(normalizedRight)]);

  return Array.from(permissionIds).every((permissionId) => {
    const leftActions = normalizedLeft[permissionId] || [];
    const rightActions = normalizedRight[permissionId] || [];
    return leftActions.length === rightActions.length && leftActions.every((actionId) => rightActions.includes(actionId));
  });
}

function deriveCustomPermissionsFromPreset(admin: Admin, roleMap: Map<string, Role>) {
  if (Array.isArray(admin.customPermissions)) {
    return uniquePermissionIds(admin.customPermissions);
  }

  const role = roleMap.get(admin.roleId);
  if (!role) {
    return admin.customPermissions;
  }

  const effectivePermissions = uniquePermissionIds(admin.permissions);
  const presetPermissions = uniquePermissionIds(role.permissions);
  const matchesPresetPermissions =
    effectivePermissions.length === presetPermissions.length &&
    presetPermissions.every((permissionId) => effectivePermissions.includes(permissionId));
  const matchesPresetGranularPermissions = areGranularPermissionsEqual(
    admin.granularPermissions,
    role.granularPermissions
  );

  return matchesPresetPermissions && matchesPresetGranularPermissions ? undefined : effectivePermissions;
}

export function Admins() {
  const { church, branches } = useChurch();
  const { currentAdmin: loggedInAdmin, refreshAdmin } = useAuth();

  // Data from backend
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogGroup[]>([]);
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
  const [resetApiMessage, setResetApiMessage] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
  const [formCustomGranularPerms, setFormCustomGranularPerms] = useState<Record<string, string[]>>({});
  const [showCustomizePermissions, setShowCustomizePermissions] = useState(false);
  const [formProfilePicture, setFormProfilePicture] = useState<string | undefined>(undefined);
  const adminPicInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const roleBranchIds = Array.from(new Set([
        ...branches.map((branch) => branch.id),
        ...(loggedInAdmin?.branchIds || []),
        loggedInAdmin?.branchId,
      ].filter(Boolean)));
      const [adminsData, roleResults, deptsData, unitsData, permissionCatalogData] = await Promise.all([
        roleBranchIds.length > 0 
          ? Promise.all([
              fetchAdmins(null),
              ...roleBranchIds.map((branchId) => fetchAdmins(branchId))
            ]) 
          : fetchAdmins(null),
        roleBranchIds.length > 0 ? Promise.all(roleBranchIds.map((branchId) => fetchRoles(branchId))) : Promise.resolve([]),
        fetchDepartments(),
        fetchUnits(),
        fetchPermissionGroups(),
      ]);
      const mergedRoles = Array.isArray(roleResults)
        ? Array.from(new Map((roleResults as any[]).flat().map((role: Role) => [role.id, role])).values())
        : [];
      const roleMap = new Map(mergedRoles.map((role: Role) => [role.id, role]));
      const mergedAdmins = Array.isArray(adminsData)
        ? Array.from(new Map((adminsData as any[]).flat().map((admin: Admin) => [admin.id, admin])).values())
            .map((admin: Admin) => ({
              ...admin,
              customPermissions: deriveCustomPermissionsFromPreset(admin, roleMap),
            }))
        : [];
      setAdmins(mergedAdmins as Admin[]);
      setRoles(mergedRoles as Role[]);
      setDepartments(deptsData as unknown as Department[]);
      setUnits(unitsData as unknown as Unit[]);
      setPermissionCatalog(permissionCatalogData);
      return {
        admins: mergedAdmins as Admin[],
        roles: mergedRoles as Role[],
        departments: deptsData as unknown as Department[],
        units: unitsData as unknown as Unit[],
        permissionCatalog: permissionCatalogData,
      };
    } catch (err) {
      console.error('Failed to load admins data:', err);
      return {
        admins: [] as Admin[],
        roles: [] as Role[],
        departments: [] as Department[],
        units: [] as Unit[],
        permissionCatalog: [] as PermissionCatalogGroup[],
      };
    } finally {
      setLoading(false);
    }
  }, [branches, loggedInAdmin?.branchId, loggedInAdmin?.branchIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (dialogMode !== 'edit') {
      return;
    }

    if (formRoleId) {
      const role = roles.find((r) => r.id === formRoleId);
      if (role) {
        setFormCustomPermissions([...role.permissions]);
        setFormCustomGranularPerms(normalizeGranularPermissions(role.granularPermissions));
      }
    } else {
      setFormCustomPermissions([]);
      setFormCustomGranularPerms({});
      setShowCustomizePermissions(false);
    }
  }, [dialogMode, formRoleId, roles]);

  // --- Derived data ---
  const filteredAdmins = admins.filter(a => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.phone && a.phone.includes(q));
  });
  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / ADMINS_PAGE_SIZE));
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * ADMINS_PAGE_SIZE,
    currentPage * ADMINS_PAGE_SIZE,
  );
  const visiblePageNumbers = getVisiblePageNumbers(currentPage, totalPages);
  const currentPageStart = filteredAdmins.length === 0 ? 0 : ((currentPage - 1) * ADMINS_PAGE_SIZE) + 1;
  const currentPageEnd = Math.min(currentPage * ADMINS_PAGE_SIZE, filteredAdmins.length);
  const rolesForLevel = roles.filter((r) =>
    r.level === formLevel || (formLevel === 'unit' && r.level === 'department')
  );
  const departmentsForSelection = formBranchIds.length > 0
    ? departments.filter((d) => d.branchId && formBranchIds.includes(d.branchId))
    : departments;
  const unitsForSelection = formDepartmentIds.length > 0
    ? units.filter((u) => formDepartmentIds.includes(u.departmentId))
    : units;
  const availablePermissionsForLevel = deriveAssignablePermissions({ catalog: permissionCatalog, scopeLevel: formLevel });
  const selectedRolePreset = roles.find((r) => r.id === formRoleId);
  const presetPermissionIds = selectedRolePreset?.permissions ?? [];
  const presetGranularPerms = normalizeGranularPermissions(selectedRolePreset?.granularPermissions);

  const creatableAdminLevels = getManageableAdminLevels(loggedInAdmin, 'create')
    .filter((level) => level !== 'branch');
  const editableAdminLevels = getManageableAdminLevels(loggedInAdmin, 'edit')
    .filter((level) => level !== 'branch');
  const defaultCreatableAdminLevel = creatableAdminLevels[0] || 'church';
  const canCreateAnyAdmin = creatableAdminLevels.length > 0;
  const canEditAdminRecord = (admin: Admin | null | undefined) => {
    if (!admin) return false;
    if (admin.id === loggedInAdmin?.id) return false;
    return hasAdminManagementPermission(loggedInAdmin, admin.level, 'edit');
  };
  const canDeleteAdminRecord = (admin: Admin | null | undefined) => {
    if (!admin) return false;
    if (admin.id === loggedInAdmin?.id) return false;
    return hasAdminManagementPermission(loggedInAdmin, admin.level, 'delete');
  };
  const canSuspendAdminRecord = (admin: Admin | null | undefined) => {
    if (!admin) return false;
    if (admin.id === loggedInAdmin?.id) return false;
    return hasAdminManagementPermission(loggedInAdmin, admin.level, 'suspend');
  };
  const canResetPasswordForAdmin = (admin: Admin | null | undefined) => {
    if (!admin) return false;
    if (admin.id === loggedInAdmin?.id) return false;
    return hasAdminManagementPermission(loggedInAdmin, admin.level, 'reset-password');
  };
  const canViewPasswordForAdmin = (admin: Admin | null | undefined) => canResetPasswordForAdmin(admin);
  const formAccessLevels = dialogMode === 'edit' ? getEditFormAccessLevels(selectedAdmin) : creatableAdminLevels;
  const hasAdminRowActions = (admin: Admin) => (
    canEditAdminRecord(admin)
    || canSuspendAdminRecord(admin)
    || canDeleteAdminRecord(admin)
    || canResetPasswordForAdmin(admin)
    || canViewPasswordForAdmin(admin)
  );
  const isCustomized =
    Boolean(
      formRoleId &&
      (
        formCustomPermissions.length !== presetPermissionIds.length ||
        !presetPermissionIds.every((id) => formCustomPermissions.includes(id)) ||
        !areGranularPermissionsEqual(formCustomGranularPerms, presetGranularPerms)
      )
    );
  const customAddedCount = formCustomPermissions.filter((id) => !presetPermissionIds.includes(id)).length;
  const customRemovedCount = presetPermissionIds.filter((id) => !formCustomPermissions.includes(id)).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // --- Helpers ---
  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormLevel(defaultCreatableAdminLevel);
    setFormBranchIds([]);
    setFormDepartmentIds([]);
    setFormUnitIds([]);
    setFormRoleId('');
    setFormCustomPermissions([]);
    setFormCustomGranularPerms({});
    setShowCustomizePermissions(false);
    setFormProfilePicture(undefined);
  };

  const toggleCustomAction = (permissionId: string, actionId: string) => {
    setFormCustomGranularPerms((prev) => {
      const current = prev[permissionId] || [];
      const updated = current.includes(actionId)
        ? current.filter((id) => id !== actionId)
        : [...current, actionId];
      const next = { ...prev };

      if (updated.length > 0) {
        next[permissionId] = updated;
        setFormCustomPermissions((selected) => selected.includes(permissionId) ? selected : [...selected, permissionId]);
      } else {
        delete next[permissionId];
        setFormCustomPermissions((selected) => selected.filter((id) => id !== permissionId));
      }

      return next;
    });
  };

  const toggleAllCustomActions = (permissionId: string, actionIds: string[]) => {
    setFormCustomGranularPerms((prev) => {
      const current = prev[permissionId] || [];
      const allSelected = actionIds.every((actionId) => current.includes(actionId));
      const next = { ...prev };

      if (allSelected) {
        delete next[permissionId];
        setFormCustomPermissions((selected) => selected.filter((id) => id !== permissionId));
      } else {
        next[permissionId] = [...actionIds];
        setFormCustomPermissions((selected) => selected.includes(permissionId) ? selected : [...selected, permissionId]);
      }

      return next;
    });
  };

  const toggleCustomPermission = (permissionId: string) => {
    const permission = availablePermissionsForLevel.find((item) => item.id === permissionId);
    if (permission?.actions && permission.actions.length > 0) {
      toggleAllCustomActions(permissionId, permission.actions.map((action) => action.id));
      return;
    }

    setFormCustomPermissions((prev) => (
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    ));
  };

  function getEditFormAccessLevels(admin: Admin | null) {
    if (!admin || !canEditAdminRecord(admin)) {
      return editableAdminLevels;
    }

    const levels = ['church', 'department', 'unit'] as AdminLevel[];
    const currentLevelIndex = levels.indexOf(admin.level);

    if (currentLevelIndex === -1) {
      return editableAdminLevels;
    }

    const allowedLevels = new Set<AdminLevel>(editableAdminLevels);
    levels.slice(currentLevelIndex).forEach((level) => {
      allowedLevels.add(level);
    });

    return levels.filter((level) => allowedLevels.has(level));
  }

  const { showToast } = useToast();
  const showSuccess = showToast;

  const getRoleName = (admin: Admin) => {
    const apiRoleNames = Array.isArray((admin as any)._raw?.roles)
      ? (admin as any)._raw.roles.map((role: any) => role?.name).filter(Boolean)
      : [];
    if (apiRoleNames.length > 0) return apiRoleNames.join(', ');
    return roles.find((r) => r.id === admin.roleId)?.name ?? (admin.roleId ? 'Unknown' : 'No role assigned');
  };
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
    if (!canCreateAnyAdmin) {
      showSuccess('You do not have permission to create leaders.', 'error');
      return;
    }
    resetForm();
    setDialogMode('create');
  };

  const openEdit = async (admin: Admin) => {
    if (!canEditAdminRecord(admin)) {
      showSuccess('You do not have permission to edit this leader.', 'error');
      return;
    }
    
    setSaving(true);
    let fullAdmin = admin;
    try {
      const res = await fetchAdmin(admin.id);
      if (res && res.admin) {
        // Overlay the rich data from the specific endpoint
        const a = res.admin;
        const validLevels = ['church', 'branch', 'department', 'unit', 'member'];
        const rawLevel = a.level || a.scopeLevel || a.roles?.[0]?.scopeLevel || a.role?.scopeLevel;
        const level = a.isSuperAdmin
          ? 'church'
          : rawLevel === 'member' || rawLevel === 'unit'
            ? 'unit'
            : validLevels.includes(rawLevel)
              ? rawLevel
              : 'church';
              
        fullAdmin = {
          ...admin,
          level,
          branchIds: Array.isArray(a.branchIds) && a.branchIds.length > 0 ? a.branchIds : (a.branches?.map((b: any) => b.id) || []),
          departmentIds: Array.isArray(a.departmentIds) && a.departmentIds.length > 0 ? a.departmentIds : (a.departments?.map((d: any) => d.id) || []),
          unitIds: Array.isArray(a.unitIds) && a.unitIds.length > 0 ? a.unitIds : (a.units?.map((u: any) => u.id) || []),
          roleId: a.roleId || a.roles?.[0]?.id || admin.roleId,
        };
      }
    } catch (err) {
      console.error('Failed to fetch full admin record:', err);
    } finally {
      setSaving(false);
    }

    setSelectedAdmin(fullAdmin);
    setFormName(fullAdmin.name);
    setFormEmail(fullAdmin.email);
    setFormPhone(fullAdmin.phone || '');
    const normalizedFormLevel: AdminLevel = fullAdmin.level === 'branch' ? 'department' : fullAdmin.level;
    setFormLevel(normalizedFormLevel);
    setFormBranchIds(fullAdmin.branchIds?.length ? [...fullAdmin.branchIds] : fullAdmin.branchId ? [fullAdmin.branchId] : []);
    setFormDepartmentIds(fullAdmin.departmentIds?.length ? [...fullAdmin.departmentIds] : fullAdmin.departmentId ? [fullAdmin.departmentId] : []);
    setFormUnitIds(fullAdmin.unitIds?.length ? [...fullAdmin.unitIds] : fullAdmin.unitId ? [fullAdmin.unitId] : []);
    setFormRoleId(fullAdmin.roleId);
    setFormProfilePicture(fullAdmin.profilePicture);
    if (Array.isArray(fullAdmin.customPermissions)) {
      setTimeout(() => {
        setFormCustomPermissions([...fullAdmin.customPermissions!]);
        setFormCustomGranularPerms(normalizeGranularPermissions(fullAdmin.granularPermissions));
        setShowCustomizePermissions(true);
      }, 0);
    }
    setDialogMode('edit');
  };

  const openAction = (admin: Admin, mode: ActionMode) => {
    const isAllowed =
      mode === 'delete'
        ? canDeleteAdminRecord(admin)
        : mode === 'suspend' || mode === 'activate'
          ? canSuspendAdminRecord(admin)
          : mode === 'reset-password'
            ? canResetPasswordForAdmin(admin)
            : false;

    if (!isAllowed) {
      showSuccess('You do not have permission to manage this leader.', 'error');
      return;
    }

    setSelectedAdmin(admin);
    setActionMode(mode);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedAdmin(null);
    resetForm();
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) return;
    if (!canCreateAnyAdmin || !hasAdminManagementPermission(loggedInAdmin, formLevel, 'create')) {
      showSuccess('You do not have permission to create an leader at this level.', 'error');
      return;
    }
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
        branchId: formLevel === 'church' ? undefined : formBranchIds[0] || loggedInAdmin?.branchId || branches[0]?.id || undefined,
        departmentId: ['department', 'unit'].includes(formLevel) ? formDepartmentIds[0] || undefined : undefined,
        unitId: formLevel === 'unit' ? formUnitIds[0] || undefined : undefined,
        branchIds: (() => {
          if (formLevel === 'church') return undefined;
          if (formBranchIds.length > 0) return formBranchIds;
          // Single-church: auto-resolve the only branch
          const fallback = loggedInAdmin?.branchId || branches[0]?.id;
          return fallback ? [fallback] : undefined;
        })(),
        departmentIds: ['department', 'unit'].includes(formLevel) && formDepartmentIds.length > 0 ? formDepartmentIds : undefined,
        unitIds: formLevel === 'unit' && formUnitIds.length > 0 ? formUnitIds : undefined,
        createdAt: new Date().toISOString(),
      };

      // Create auth user on server (generates temp password)
      await createAdminUser({
        email: formEmail.trim(),
        name: formName.trim(),
        admin: adminRecord,
      });

      await loadData();

      setDialogMode(null);
      resetForm();
      // API sends a verification email - no temp password returned
      showSuccess('Leader created successfully. A verification email has been sent.');
    } catch (err) {
      console.error('Failed to create admin:', err);
      showSuccess(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formName.trim() || !formEmail.trim() || !selectedAdmin) return;
    if (!canEditAdminRecord(selectedAdmin)) {
      showSuccess('You do not have permission to edit this leader.', 'error');
      return;
    }
    setSaving(true);

    try {
      const nextIsSuperAdmin = selectedAdmin.isSuperAdmin && formLevel === 'church';
      const effectiveScopeLevel = nextIsSuperAdmin ? 'church' : formLevel;
      const effectiveBranchIds =
        effectiveScopeLevel === 'church'
          ? []
          : formBranchIds.length > 0
            ? formBranchIds
            : selectedAdmin.branchIds?.length
              ? selectedAdmin.branchIds
              : selectedAdmin.branchId
                ? [selectedAdmin.branchId]
                : loggedInAdmin?.branchId
                  ? [loggedInAdmin.branchId]
                  : branches[0]?.id
                    ? [branches[0].id]
                    : [];
      const effectiveDepartmentIds = ['department', 'unit'].includes(effectiveScopeLevel) ? formDepartmentIds : [];
      const effectiveUnitIds = effectiveScopeLevel === 'unit' ? formUnitIds : [];
      const effectiveBranchId = effectiveBranchIds[0];

      const hasBaseChanges =
        formName.trim() !== selectedAdmin.name ||
        formEmail.trim() !== selectedAdmin.email ||
        (formPhone.trim() || '') !== (selectedAdmin.phone || '') ||
        effectiveScopeLevel !== selectedAdmin.level ||
        nextIsSuperAdmin !== selectedAdmin.isSuperAdmin ||
        effectiveBranchIds.join(',') !== (selectedAdmin.branchIds || []).join(',') ||
        effectiveDepartmentIds.join(',') !== (selectedAdmin.departmentIds || []).join(',') ||
        effectiveUnitIds.join(',') !== (selectedAdmin.unitIds || []).join(',');

      if (hasBaseChanges) {
        await editAdmin(selectedAdmin.id, {
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || undefined,
          isSuperAdmin: nextIsSuperAdmin,
          scopeLevel: effectiveScopeLevel,
          branchIds: effectiveBranchIds.length > 0 ? effectiveBranchIds : undefined,
          departmentIds: effectiveDepartmentIds.length > 0 ? effectiveDepartmentIds : undefined,
          unitIds: effectiveUnitIds.length > 0 ? effectiveUnitIds : undefined,
        });
      }

      const roleChanged = Boolean(formRoleId && formRoleId !== selectedAdmin.roleId);

      if (roleChanged) {
        await assignRoleToAdmin({
          adminId: selectedAdmin.id,
          roleIds: [formRoleId],
        }, effectiveBranchId);
      }

      const originalPresetPermissions = selectedRolePreset?.permissions ?? [];
      const originalPresetGranularPermissions = presetGranularPerms;
      const shouldUpdateCustomization = showCustomizePermissions && Boolean(selectedRolePreset);
      const currentPermissions =
        showCustomizePermissions && isCustomized ? formCustomPermissions : originalPresetPermissions;
      const currentGranularPermissions =
        showCustomizePermissions && isCustomized ? formCustomGranularPerms : originalPresetGranularPermissions;

      if (shouldUpdateCustomization) {
        const catalog = await fetchPermissionGroups();
        const payload = buildRolePermissionPayload({
          permissionIds: currentPermissions,
          granularPermissions: currentGranularPermissions,
          catalog,
        });

        await editRole(selectedRolePreset!.id, {
          name: selectedRolePreset?.name,
          description: (selectedRolePreset as any)?.description || undefined,
          scopeLevel: (selectedRolePreset?.level === 'unit' ? 'department' : selectedRolePreset?.level) as string,
          permissions: payload.permissions,
          permissionGroup: payload.permissionGroup,
        }, (selectedRolePreset as any)?.branchId || effectiveBranchId);
      }

      const refreshedData = await loadData();
      const refreshedAdmin = refreshedData.admins.find((admin) => admin.id === selectedAdmin.id);

      if (refreshedAdmin) {
        setAdmins((prev) => prev.map((admin) => admin.id === selectedAdmin.id ? refreshedAdmin : admin));
      }

      if (selectedAdmin.id === loggedInAdmin?.id) {
        await refreshAdmin();
      }
      closeDialog();
      showSuccess(`"${formName.trim()}" updated successfully.`);
    } catch (err) {
      console.error('Failed to update admin:', err);
      showSuccess(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    if (!canDeleteAdminRecord(selectedAdmin)) {
      showSuccess('You do not have permission to delete this leader.', 'error');
      return;
    }
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
    } catch (err) {
      console.error('Failed to delete admin:', err);
      showSuccess(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!selectedAdmin) return;
    if (!canSuspendAdminRecord(selectedAdmin)) {
      showSuccess('You do not have permission to suspend or reactivate this leader.', 'error');
      return;
    }
    setSaving(true);
    const newStatus = selectedAdmin.status === 'active' ? 'suspended' : 'active';
    const name = selectedAdmin.name;

    try {
      await suspendAdmin(selectedAdmin.id);
      await loadData();
      setActionMode(null);
      setSelectedAdmin(null);
      showSuccess(
        newStatus === 'suspended'
          ? `"${name}" has been suspended. They can no longer access the platform.`
          : `"${name}" has been reactivated.`
      );
    } catch (err) {
      console.error('Failed to toggle suspend:', err);
      showSuccess(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;
    if (!canResetPasswordForAdmin(selectedAdmin)) {
      showSuccess('You do not have permission to reset this leader\'s password.', 'error');
      return;
    }
    setSaving(true);

    try {
      const result = await resetAdminPassword({
        authUserId: selectedAdmin.authUserId,
        email: selectedAdmin.email,
        adminId: selectedAdmin.id,
      });

      // Update the local admin record with new temp password (if any)
      const anyResult = result as any;
      if (anyResult.tempPassword) {
        setAdmins(prev => prev.map(a => a.id === selectedAdmin.id ? { ...a, lastTempPassword: anyResult.tempPassword } : a));
      }

      setActionMode(null);
      const resetEmail = selectedAdmin.email;
      setSelectedAdmin(null);
      // Show result dialog - use API message if no temp password was returned
      setResetApiMessage(result.message || '');
      setTempPassword(anyResult.tempPassword || '');
      setTempPasswordEmail(resetEmail);
      setShowTempPassword(false);
      setCopiedPassword(false);
      setTempPasswordDialog(true);
      setTempPasswordContext('reset');
    } catch (err) {
      console.error('Failed to reset password:', err);
      showSuccess(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewPassword = (admin: Admin) => {
    if (!canViewPasswordForAdmin(admin)) {
      showSuccess('You do not have permission to view this leader\'s password history.', 'error');
      return;
    }
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

  const requiresBranchSelection =
    church.type === 'multi' && (formLevel === 'department' || formLevel === 'unit');
  const isFormValid =
    formName.trim() &&
    formEmail.trim() &&
    formPhone.trim() &&
    formRoleId &&
    (!requiresBranchSelection || formBranchIds.length > 0) &&
    (formLevel !== 'unit' || (formDepartmentIds.length > 0 && formUnitIds.length > 0));

  return (
    <Layout>
      <PageHeader
        title="Leaders"
        description="Manage your church leaders, and control what they can access across your entire church from here."
        action={
          canCreateAnyAdmin
            ? {
                label: 'Add Leader',
                onClick: openCreate,
                icon: <Plus className="w-4 h-4 mr-2" />,
              }
            : undefined
        }
      />

      <div className="p-4 md:p-6">

        {loading ? (
          <BibleLoader message="Loading leaders..." />
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No leaders yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Your leader list is empty because no one has been added yet. Start by adding your first leader to control access and manage roles across your church.
                  </p>
                  {canCreateAnyAdmin && (
                    <Button onClick={openCreate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Leader
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Search bar - only when admins exist */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {filteredAdmins.length === 0
                      ? 'No leaders match your search.'
                      : `Showing ${currentPageStart}-${currentPageEnd} of ${filteredAdmins.length} leaders`}
                  </p>
                </div>
                <Card>
                  <CardContent className="p-0">
                    {filteredAdmins.length === 0 ? (
                      <div className="px-4 py-16 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching leaders</h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                          Try a different name, email address, or phone number to find the leader you&apos;re looking for.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Mobile cards */}
                        <div className="block md:hidden divide-y divide-gray-100">
                          {paginatedAdmins.map((admin) => (
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
                                {hasAdminRowActions(admin) && (
                                  <AdminActionsMenu
                                    admin={admin}
                                    canEdit={canEditAdminRecord(admin)}
                                    canSuspend={canSuspendAdminRecord(admin)}
                                    canDelete={canDeleteAdminRecord(admin)}
                                    canResetPassword={canResetPasswordForAdmin(admin)}
                                    canViewPassword={canViewPasswordForAdmin(admin)}
                                    onEdit={() => openEdit(admin)}
                                    onSuspend={() => openAction(admin, admin.status === 'active' ? 'suspend' : 'activate')}
                                    onDelete={() => openAction(admin, 'delete')}
                                    onResetPassword={() => openAction(admin, 'reset-password')}
                                    onViewPassword={() => handleViewPassword(admin)}
                                  />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={getLevelBadgeColor(admin.level)}>
                                  {ACCESS_LEVEL_INFO[admin.level].label}
                                </Badge>
                                {getStatusBadge(admin)}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">Role:</span> {getRoleName(admin)}
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
                                <TableHead>Leader</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Access Level</TableHead>
                                <TableHead>Scope</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedAdmins.map((admin) => (
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
                                    <span className="text-sm">{getRoleName(admin)}</span>
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
                                    {hasAdminRowActions(admin) && (
                                      <div className="flex justify-end">
                                        <AdminActionsMenu
                                          admin={admin}
                                          canEdit={canEditAdminRecord(admin)}
                                          canSuspend={canSuspendAdminRecord(admin)}
                                          canDelete={canDeleteAdminRecord(admin)}
                                          canResetPassword={canResetPasswordForAdmin(admin)}
                                          canViewPassword={canViewPasswordForAdmin(admin)}
                                          onEdit={() => openEdit(admin)}
                                          onSuspend={() => openAction(admin, admin.status === 'active' ? 'suspend' : 'activate')}
                                          onDelete={() => openAction(admin, 'delete')}
                                          onResetPassword={() => openAction(admin, 'reset-password')}
                                          onViewPassword={() => handleViewPassword(admin)}
                                        />
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {filteredAdmins.length > 0 && (
                  <Card className="mt-4">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-gray-500">
                        <p>Showing {currentPageStart}-{currentPageEnd} of {filteredAdmins.length} leaders</p>
                        <p>Page {currentPage} of {totalPages}</p>
                      </div>
                      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(event) => {
                                event.preventDefault();
                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                            />
                          </PaginationItem>
                          {visiblePageNumbers.map((page) => (
                            <PaginationItem key={page}>
                              {typeof page === 'number' ? (
                                <PaginationLink
                                  href="#"
                                  isActive={page === currentPage}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setCurrentPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              ) : (
                                <PaginationEllipsis />
                              )}
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(event) => {
                                event.preventDefault();
                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                              }}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </CardContent>
                  </Card>
                )}
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
              {dialogMode === 'create' ? 'Add New Leader' : 'Edit Leader'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Create a new leader and assign their access level and role. A temporary password will be generated for them to log in.'
                : "Update this leader's details, access level, or role assignment."}
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
                  <Label htmlFor="admin-phone">Phone Number *</Label>
                  <Input id="admin-phone" type="tel" placeholder="+1 (555) 000-0000" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div className="space-y-3">
              <div>
                <Label>Access Level *</Label>
                <p className="text-xs text-gray-500 mt-1">This determines what parts of the church this leader can manage</p>
              </div>
              {dialogMode === 'edit' && selectedAdmin?.isSuperAdmin && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This leader is currently a Super Admin. Choose a smaller access level below to remove Super Admin access when you save.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formAccessLevels.map((level) => {
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

            {/* Conditional: Branch Selection for Department/Unit admins (multi-church only) */}
            {(formLevel === 'department' || formLevel === 'unit') && church.type === 'multi' && (
              <div className="space-y-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                <Label>Select Branch *</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {branches.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-purple-100/50 cursor-pointer">
                      <Checkbox
                        checked={formBranchIds.includes(b.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormBranchIds(prev => [...prev, b.id]);
                          } else {
                            setFormBranchIds(prev => prev.filter(id => id !== b.id));
                            // Clear departments/units that belonged to this branch
                            const branchDeptIds = departments.filter(d => d.branchId === b.id).map(d => d.id);
                            setFormDepartmentIds(prev => prev.filter(id => !branchDeptIds.includes(id)));
                            const branchUnitIds = units.filter(u => branchDeptIds.includes(u.departmentId)).map(u => u.id);
                            setFormUnitIds(prev => prev.filter(id => !branchUnitIds.includes(id)));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{b.name} {b.isHeadquarters ? '(HQ)' : ''}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-purple-700">Select the branch this leader belongs to. Only departments from the selected branch will appear below.</p>
              </div>
            )}

            {/* Conditional: Department Selection (multi) */}
            {(formLevel === 'department' || formLevel === 'unit') && (
              <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-100">
                <Label>
                  Select Department(s) / Outreach(es)
                  {formLevel === 'unit' ? ' *' : ''}
                </Label>
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
                      ? 'Optional: choose one or more departments/outreaches to narrow this leader to specific teams within the selected branch.'
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
                  <p className="text-xs text-orange-700">Select one or more units. This leader will manage members and activities within them.</p>
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
                  <p className="text-xs text-gray-500">Roles determine what actions this leader can perform.</p>
                </>
              )}
            </div>

            {dialogMode === 'edit' && formRoleId && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Customize Permissions
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">Fine-tune this leader without changing the base role.</p>
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
                        <button
                          type="button"
                          onClick={() => {
                            setFormCustomPermissions([...presetPermissionIds]);
                            setFormCustomGranularPerms(normalizeGranularPermissions(presetGranularPerms));
                          }}
                          className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 flex-shrink-0 ml-2"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {groupPermissionsForDisplay(availablePermissionsForLevel, formLevel).map((categoryGroup) => {
                        return (
                          <div key={categoryGroup.key} className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{categoryGroup.label}</p>
                              {categoryGroup.note && (
                                <p className="text-xs text-gray-400 mt-1">{categoryGroup.note}</p>
                              )}
                            </div>
                            <div className="space-y-2 ml-1">
                              {categoryGroup.permissions.map((p) => {
                                const isInPreset = presetPermissionIds.includes(p.id);
                                const isChecked = formCustomPermissions.includes(p.id);
                                const wasAdded = isChecked && !isInPreset;
                                const wasRemoved = !isChecked && isInPreset;
                                return (
                                  <div key={p.id} className={`flex items-start gap-3 p-2 rounded-md transition-colors ${wasAdded ? 'bg-green-50' : wasRemoved ? 'bg-red-50' : ''}`}>
                                    <Checkbox
                                      id={`perm-${p.id}`}
                                      checked={isChecked}
                                      onCheckedChange={() => toggleCustomPermission(p.id)}
                                    />
                                    <div className="flex-1">
                                      <Label htmlFor={`perm-${p.id}`} className="cursor-pointer text-sm font-medium text-gray-900 flex items-center gap-2">
                                        {p.name}
                                        {wasAdded && <span className="text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Added</span>}
                                        {wasRemoved && <span className="text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded">Removed</span>}
                                      </Label>
                                      <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                                      {p.actions && p.actions.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                          {p.actions.map((action) => (
                                            <div key={action.id} className="flex items-start gap-2">
                                              <Checkbox
                                                id={`perm-${p.id}-${action.id}`}
                                                checked={formCustomGranularPerms[p.id]?.includes(action.id) || false}
                                                onCheckedChange={() => toggleCustomAction(p.id, action.id)}
                                              />
                                              <Label
                                                htmlFor={`perm-${p.id}-${action.id}`}
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
                {dialogMode === 'create' ? 'Create Leader' : 'Save Changes'}
              </Button>
            </div>

            {/* Microcopy about email */}
            {dialogMode === 'create' && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  A secure temporary password will be generated when you click "Create Leader".
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
                <><CheckCircle className="w-5 h-5 text-green-600" /> Leader Created Successfully</>
              ) : tempPasswordContext === 'reset' ? (
                <><KeyRound className="w-5 h-5 text-blue-600" /> Password Reset Successful</>
              ) : (
                <><Eye className="w-5 h-5 text-gray-600" /> Stored Temporary Password</>
              )}
            </DialogTitle>
            <DialogDescription>
              {tempPasswordContext === 'created' ? (
                <>A temporary password has been generated for <strong>{tempPasswordEmail}</strong>. Share this password with the leader so they can log in.</>
              ) : tempPasswordContext === 'reset' ? (
                resetApiMessage && !tempPassword
                  ? <>{resetApiMessage}</>
                  : <>A new temporary password has been generated for <strong>{tempPasswordEmail}</strong>. Their old password no longer works. Share this new password with them.</>
              ) : (
                <>This is the last temporary password generated for <strong>{tempPasswordEmail}</strong>. If it no longer works, use "Reset Password" to generate a new one.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(tempPasswordContext !== 'reset' || tempPassword) && (
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
            )}

            {tempPasswordContext !== 'view' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Make sure to copy or write down this password before closing this dialog.
                  The leader can change it after logging in.
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
              Delete Leader
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                Are you sure you want to permanently remove{' '}
                <span className="font-semibold text-gray-900">"{selectedAdmin?.name}"</span> as an leader?
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
              Delete Leader
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
              {actionMode === 'suspend' ? 'Suspend Leader' : 'Reactivate Leader'}
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
  canEdit,
  canSuspend,
  canDelete,
  canResetPassword,
  canViewPassword,
  onEdit,
  onSuspend,
  onDelete,
  onResetPassword,
  onViewPassword,
}: {
  admin: Admin;
  canEdit: boolean;
  canSuspend: boolean;
  canDelete: boolean;
  canResetPassword: boolean;
  canViewPassword: boolean;
  onEdit: () => void;
  onSuspend: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  onViewPassword: () => void;
}) {
  const hasPrimaryActions = canEdit || canViewPassword || canResetPassword || canSuspend;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Open admin actions" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={12}
        className="z-[9999] w-48"
      >
        {canEdit && (
          <DropdownMenuItem onSelect={onEdit}>
            <Edit className="w-4 h-4" />
            Edit
          </DropdownMenuItem>
        )}
        {canViewPassword && (
          <DropdownMenuItem onSelect={onViewPassword}>
            <Eye className="w-4 h-4" />
            View Password
          </DropdownMenuItem>
        )}
        {canResetPassword && (
          <DropdownMenuItem onSelect={onResetPassword}>
            <KeyRound className="w-4 h-4" />
            Reset Password
          </DropdownMenuItem>
        )}
        {canSuspend && (
          <DropdownMenuItem onSelect={onSuspend}>
            {admin.status === 'active' ? (
              <><ShieldBan className="w-4 h-4 text-orange-500" /><span className="text-orange-700">Suspend</span></>
            ) : (
              <><ShieldCheck className="w-4 h-4 text-green-500" /><span className="text-green-700">Reactivate</span></>
            )}
          </DropdownMenuItem>
        )}
        {canDelete && hasPrimaryActions && <DropdownMenuSeparator />}
        {canDelete && (
          <DropdownMenuItem onSelect={onDelete} className="text-red-600 focus:text-red-700">
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
