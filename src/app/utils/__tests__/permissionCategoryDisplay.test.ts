import { describe, it, expect } from 'vitest';
import {
  getPermissionCategoryDefinitions,
  groupPermissionsForDisplay,
} from '../permissionCategoryDisplay';
import { PERMISSIONS } from '../../data/permissions';
import type { AdminLevel, Permission } from '../../types';

describe('getPermissionCategoryDefinitions', () => {
  it('returns non-empty definitions for each admin level', () => {
    const levels: AdminLevel[] = ['church', 'branch', 'department', 'unit'];
    for (const level of levels) {
      const defs = getPermissionCategoryDefinitions(level);
      expect(Array.isArray(defs)).toBe(true);
      expect(defs.length).toBeGreaterThan(0);
    }
  });

  it('church level includes Church Management category', () => {
    const defs = getPermissionCategoryDefinitions('church');
    expect(defs.some((d) => d.key === 'Church Management')).toBe(true);
  });

  it('unit level does NOT include Church Management category', () => {
    const defs = getPermissionCategoryDefinitions('unit');
    expect(defs.some((d) => d.key === 'Church Management')).toBe(false);
  });

  it('all levels include Programs category', () => {
    const levels: AdminLevel[] = ['church', 'branch', 'department', 'unit'];
    for (const level of levels) {
      const defs = getPermissionCategoryDefinitions(level);
      expect(defs.some((d) => d.key === 'Programs')).toBe(true);
    }
  });
});

describe('groupPermissionsForDisplay', () => {
  const samplePermissions: Permission[] = [
    {
      id: 'manage-members',
      name: 'Manage Members',
      description: 'Manage church members',
      level: ['church', 'branch'],
      category: 'Members',
      actions: [{ id: 'view', label: 'View' }, { id: 'create', label: 'Create' }],
    },
    {
      id: 'manage-branches',
      name: 'Manage Branches',
      description: 'Manage branches',
      level: ['church'],
      category: 'Church Management',
      actions: [{ id: 'view', label: 'View' }],
    },
    {
      id: 'view-reports',
      name: 'View Reports',
      description: 'View reports',
      level: ['church', 'branch', 'department', 'unit'],
      category: 'Reports',
      actions: [{ id: 'view', label: 'View' }],
    },
  ];

  it('groups permissions into the correct categories for church level', () => {
    const groups = groupPermissionsForDisplay(samplePermissions, 'church');
    const keys = groups.map((g) => g.key);
    expect(keys).toContain('Members');
    expect(keys).toContain('Church Management');
    expect(keys).toContain('Reports');
  });

  it('excludes empty categories', () => {
    const groups = groupPermissionsForDisplay([], 'church');
    expect(groups).toEqual([]);
  });

  it('each group contains only permissions matching its category', () => {
    const groups = groupPermissionsForDisplay(samplePermissions, 'church');
    for (const group of groups) {
      for (const permission of group.permissions) {
        expect(permission.category).toBe(group.key);
      }
    }
  });

  it('works with real PERMISSIONS data for church level', () => {
    const groups = groupPermissionsForDisplay(PERMISSIONS, 'church');
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.permissions.length > 0)).toBe(true);
  });

  it('works with real PERMISSIONS data for branch level', () => {
    const branchPermissions = PERMISSIONS.filter((p) => p.level.includes('branch'));
    const groups = groupPermissionsForDisplay(branchPermissions, 'branch');
    expect(groups.length).toBeGreaterThan(0);
  });
});
