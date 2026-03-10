import { PERMISSIONS } from '../data/permissions';
import type { Admin, AdminLevel } from '../types';
type AdminPermissionAction = string;
type PermissionRequirement = string | { permissionId: string; action?: AdminPermissionAction };
const ADMIN_PERMISSION_BY_LEVEL: Record<AdminLevel, string> = {
  church: 'manage-church-admins',
  branch: 'manage-branch-admins',
  department: 'manage-department-admins',
  unit: 'manage-unit-admins',
};
function isSuperAdmin(admin?: Pick<Admin, 'isSuperAdmin'> | null) {
  return admin?.isSuperAdmin === true;
}
function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
function getAdminPermissionIds(admin?: Pick<Admin, 'permissions' | 'customPermissions'> | null) {
  return new Set(
    unique([
      ...(Array.isArray(admin?.permissions) ? admin.permissions : []),
      ...(Array.isArray(admin?.customPermissions) ? admin.customPermissions : []),
    ])
  );
}
export function getGrantedActions(admin: Admin | null | undefined, permissionId: string) {
  const definition = PERMISSIONS.find((permission) => permission.id === permissionId);
  if (isSuperAdmin(admin)) {
    return unique(definition?.actions?.map((action) => action.id) || []);
  }
  const permissionIds = getAdminPermissionIds(admin);
  if (!permissionIds.has(permissionId)) {
    return [] as string[];
  }
  const explicitActions = admin?.granularPermissions?.[permissionId];
  if (Array.isArray(explicitActions) && explicitActions.length > 0) {
    return unique(explicitActions);
  }
  return unique(definition?.actions?.map((action) => action.id) || []);
}
export function hasPermission(
  admin: Admin | null | undefined,
  permissionId: string,
  action?: AdminPermissionAction
) {
  if (isSuperAdmin(admin)) {
    return true;
  }
  const permissionIds = getAdminPermissionIds(admin);
  if (!permissionIds.has(permissionId)) {
    return false;
  }
  if (!action) {
    return true;
  }
  return getGrantedActions(admin, permissionId).includes(action);
}
export function hasAnyPermission(
  admin: Admin | null | undefined,
  requirements: PermissionRequirement[]
) {
  if (isSuperAdmin(admin)) {
    return true;
  }
  return requirements.some((requirement) => (
    typeof requirement === 'string'
      ? hasPermission(admin, requirement)
      : hasPermission(admin, requirement.permissionId, requirement.action)
  ));
}
export function getAdminPermissionForLevel(level: AdminLevel) {
  return ADMIN_PERMISSION_BY_LEVEL[level];
}
export function hasAdminManagementPermission(
  admin: Admin | null | undefined,
  level: AdminLevel,
  action?: AdminPermissionAction
) {
  if (isSuperAdmin(admin)) {
    return true;
  }
  return hasPermission(admin, getAdminPermissionForLevel(level), action);
}
export function getManageableAdminLevels(
  admin: Admin | null | undefined,
  action?: AdminPermissionAction
) {
  const levels = ['church', 'branch', 'department', 'unit'] as AdminLevel[];
  if (isSuperAdmin(admin)) {
    return levels;
  }
  return levels.filter((level) => hasAdminManagementPermission(admin, level, action));
}