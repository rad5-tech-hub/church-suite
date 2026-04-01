import { describe, it, expect } from 'vitest';
import {
  getGrantedActions,
  hasPermission,
  hasAnyPermission,
  getAdminPermissionForLevel,
  hasAdminManagementPermission,
  getManageableAdminLevels,
} from '../adminPermissions';
import type { Admin } from '../../types';

// Minimal admin factory
function makeAdmin(overrides: Partial<Admin> = {}): Admin {
  return {
    id: 'admin-1',
    churchId: 'church-1',
    name: 'Test Admin',
    email: 'test@church.com',
    roleId: 'role-1',
    level: 'church',
    isSuperAdmin: false,
    status: 'active',
    permissions: [],
    createdAt: new Date(),
    ...overrides,
  };
}

describe('adminPermissions', () => {
  describe('getAdminPermissionForLevel', () => {
    it('returns correct permission id for each admin level', () => {
      expect(getAdminPermissionForLevel('church')).toBe('manage-church-admins');
      expect(getAdminPermissionForLevel('branch')).toBe('manage-branch-admins');
      expect(getAdminPermissionForLevel('department')).toBe('manage-department-admins');
      expect(getAdminPermissionForLevel('unit')).toBe('manage-unit-admins');
    });
  });

  describe('hasPermission', () => {
    it('returns true for super admin regardless of permission', () => {
      const admin = makeAdmin({ isSuperAdmin: true, permissions: [] });
      expect(hasPermission(admin, 'manage-branches')).toBe(true);
      expect(hasPermission(admin, 'manage-members', 'delete')).toBe(true);
    });

    it('returns false for null admin', () => {
      expect(hasPermission(null, 'manage-branches')).toBe(false);
    });

    it('returns false when admin does not have the permission', () => {
      const admin = makeAdmin({ permissions: ['manage-members'] });
      expect(hasPermission(admin, 'manage-branches')).toBe(false);
    });

    it('returns true when admin has the permission (no action required)', () => {
      const admin = makeAdmin({ permissions: ['manage-members'] });
      expect(hasPermission(admin, 'manage-members')).toBe(true);
    });

    it('returns true when admin has permission with matching action', () => {
      const admin = makeAdmin({
        permissions: ['manage-members'],
        granularPermissions: { 'manage-members': ['view', 'create'] },
      });
      expect(hasPermission(admin, 'manage-members', 'view')).toBe(true);
      expect(hasPermission(admin, 'manage-members', 'create')).toBe(true);
    });

    it('returns false when admin has permission but not the required action', () => {
      const admin = makeAdmin({
        permissions: ['manage-members'],
        granularPermissions: { 'manage-members': ['view'] },
      });
      expect(hasPermission(admin, 'manage-members', 'delete')).toBe(false);
    });

    it('uses customPermissions over permissions when customPermissions is set', () => {
      const admin = makeAdmin({
        permissions: ['manage-members'],
        customPermissions: ['manage-branches'],
      });
      expect(hasPermission(admin, 'manage-members')).toBe(false);
      expect(hasPermission(admin, 'manage-branches')).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true for super admin', () => {
      const admin = makeAdmin({ isSuperAdmin: true });
      expect(hasAnyPermission(admin, ['manage-branches', 'manage-members'])).toBe(true);
    });

    it('returns false for null admin', () => {
      expect(hasAnyPermission(null, ['manage-branches'])).toBe(false);
    });

    it('returns true when admin has at least one of the permissions (string form)', () => {
      const admin = makeAdmin({ permissions: ['manage-members'] });
      expect(hasAnyPermission(admin, ['manage-branches', 'manage-members'])).toBe(true);
    });

    it('returns false when admin has none of the permissions', () => {
      const admin = makeAdmin({ permissions: ['manage-sms'] });
      expect(hasAnyPermission(admin, ['manage-branches', 'manage-members'])).toBe(false);
    });

    it('returns true when admin satisfies an object requirement with action', () => {
      const admin = makeAdmin({
        permissions: ['manage-members'],
        granularPermissions: { 'manage-members': ['view'] },
      });
      expect(hasAnyPermission(admin, [{ permissionId: 'manage-members', action: 'view' }])).toBe(true);
    });

    it('returns false when action requirement is not met', () => {
      const admin = makeAdmin({
        permissions: ['manage-members'],
        granularPermissions: { 'manage-members': ['view'] },
      });
      expect(hasAnyPermission(admin, [{ permissionId: 'manage-members', action: 'delete' }])).toBe(false);
    });
  });

  describe('getGrantedActions', () => {
    it('returns all actions for super admin', () => {
      const admin = makeAdmin({ isSuperAdmin: true });
      const actions = getGrantedActions(admin, 'manage-members');
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('returns empty array when admin does not have the permission', () => {
      const admin = makeAdmin({ permissions: [] });
      expect(getGrantedActions(admin, 'manage-members')).toEqual([]);
    });

    it('returns explicit granular actions when set', () => {
      const admin = makeAdmin({
        permissions: ['manage-members'],
        granularPermissions: { 'manage-members': ['view', 'create'] },
      });
      expect(getGrantedActions(admin, 'manage-members')).toEqual(['view', 'create']);
    });

    it('returns all defined actions when permission exists but no granular override', () => {
      const admin = makeAdmin({ permissions: ['manage-members'] });
      const actions = getGrantedActions(admin, 'manage-members');
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  describe('hasAdminManagementPermission', () => {
    it('returns true for super admin at any level', () => {
      const admin = makeAdmin({ isSuperAdmin: true });
      expect(hasAdminManagementPermission(admin, 'church')).toBe(true);
      expect(hasAdminManagementPermission(admin, 'branch')).toBe(true);
      expect(hasAdminManagementPermission(admin, 'department')).toBe(true);
      expect(hasAdminManagementPermission(admin, 'unit')).toBe(true);
    });

    it('returns true when admin has the matching level permission', () => {
      const admin = makeAdmin({ permissions: ['manage-branch-admins'] });
      expect(hasAdminManagementPermission(admin, 'branch')).toBe(true);
    });

    it('returns false when admin lacks the level permission', () => {
      const admin = makeAdmin({ permissions: ['manage-branch-admins'] });
      expect(hasAdminManagementPermission(admin, 'church')).toBe(false);
    });
  });

  describe('getManageableAdminLevels', () => {
    it('returns all levels for super admin', () => {
      const admin = makeAdmin({ isSuperAdmin: true });
      const levels = getManageableAdminLevels(admin);
      expect(levels).toEqual(['church', 'branch', 'department', 'unit']);
    });

    it('returns empty array when admin has no admin-management permissions', () => {
      const admin = makeAdmin({ permissions: ['manage-members'] });
      expect(getManageableAdminLevels(admin)).toEqual([]);
    });

    it('returns only the levels admin can manage', () => {
      const admin = makeAdmin({
        permissions: ['manage-branch-admins', 'manage-unit-admins'],
      });
      const levels = getManageableAdminLevels(admin);
      expect(levels).toContain('branch');
      expect(levels).toContain('unit');
      expect(levels).not.toContain('church');
      expect(levels).not.toContain('department');
    });

    it('filters by action when action is provided', () => {
      const admin = makeAdmin({
        permissions: ['manage-branch-admins'],
        granularPermissions: { 'manage-branch-admins': ['view'] },
      });
      expect(getManageableAdminLevels(admin, 'view')).toContain('branch');
      expect(getManageableAdminLevels(admin, 'delete')).not.toContain('branch');
    });
  });
});
