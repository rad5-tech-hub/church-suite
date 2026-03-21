import type { AdminLevel, Permission } from '../types';

type PermissionCategoryDefinition = {
  key: string;
  label: string;
  note?: string;
};

const CATEGORY_DEFINITIONS: Record<AdminLevel, PermissionCategoryDefinition[]> = {
  church: [
    { key: 'Church Management', label: 'Church management' },
    { key: 'Leadership', label: 'Leadership', note: 'Manage roles and manage leaders' },
    { key: 'Department Management', label: 'Department Management' },
    { key: 'Unit Management', label: 'Unit Management' },
    { key: 'Members', label: 'Members' },
    { key: 'Workforce', label: 'Workforce' },
    { key: 'Programs', label: 'Programs - Attendance' },
    { key: 'Finance', label: 'Finance' },
    { key: 'Communication', label: 'Communication' },
    { key: 'Engagement', label: 'Engagement' },
    { key: 'Reports', label: 'Reports' },
  ],
  branch: [
    { key: 'Leadership', label: 'Leadership' },
    { key: 'Department Management', label: 'Department Management' },
    { key: 'Unit Management', label: 'Unit Management' },
    { key: 'Members', label: 'Members' },
    { key: 'Workforce', label: 'Workforce' },
    { key: 'Programs', label: 'Programs - Attendance' },
    { key: 'Finance', label: 'Finance' },
    { key: 'Communication', label: 'Communication' },
    { key: 'Engagement', label: 'Engagement' },
    { key: 'Reports', label: 'Reports' },
  ],
  department: [
    { key: 'Leadership', label: 'Leadership' },
    { key: 'Department Management', label: 'Department' },
    { key: 'Unit Management', label: 'Unit Management' },
    { key: 'Members', label: 'Members' },
    { key: 'Workforce', label: 'Workforce' },
    { key: 'Programs', label: 'Programs - Attendance' },
    { key: 'Finance', label: 'Finance' },
    { key: 'Communication', label: 'Communication' },
    { key: 'Engagement', label: 'Engagement' },
    { key: 'Reports', label: 'Reports' },
  ],
  unit: [
    { key: 'Programs', label: 'Programs', note: "Attendance is pending for unit roles" },
    { key: 'Communication', label: 'Communication' },
    { key: 'Engagement', label: 'Engagement' },
    { key: 'Reports', label: 'Reports' },
  ],
};

export type PermissionCategoryGroup = PermissionCategoryDefinition & {
  permissions: Permission[];
};

export function getPermissionCategoryDefinitions(level: AdminLevel) {
  return CATEGORY_DEFINITIONS[level];
}

export function groupPermissionsForDisplay(
  permissions: Permission[],
  level: AdminLevel
): PermissionCategoryGroup[] {
  const categories = getPermissionCategoryDefinitions(level);

  return categories
    .map((category) => ({
      ...category,
      permissions: permissions.filter((permission) => permission.category === category.key),
    }))
    .filter((category) => category.permissions.length > 0);
}
