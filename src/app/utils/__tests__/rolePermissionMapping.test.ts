import { describe, it, expect } from 'vitest';
import {
  normalizePermissionCatalog,
  buildRolePermissionPayload,
  mapBackendRolePermissions,
  extractUnmappedBackendRolePermissions,
  deriveAssignablePermissions,
  type PermissionCatalogGroup,
} from '../rolePermissionMapping';

// Minimal catalog fixture
const memberGroup: PermissionCatalogGroup = {
  id: 'grp-members',
  name: 'Members',
  permissions: [
    { id: 'perm-view', name: 'view', permissionGroupId: 'grp-members' },
    { id: 'perm-create', name: 'create', permissionGroupId: 'grp-members' },
    { id: 'perm-edit', name: 'edit', permissionGroupId: 'grp-members' },
    { id: 'perm-delete', name: 'delete', permissionGroupId: 'grp-members' },
  ],
};

const branchGroup: PermissionCatalogGroup = {
  id: 'grp-branch',
  name: 'Branch',
  permissions: [
    { id: 'perm-b-view', name: 'view', permissionGroupId: 'grp-branch' },
    { id: 'perm-b-create', name: 'create', permissionGroupId: 'grp-branch' },
  ],
};

const catalog: PermissionCatalogGroup[] = [memberGroup, branchGroup];

describe('normalizePermissionCatalog', () => {
  it('returns an empty array for empty input', () => {
    expect(normalizePermissionCatalog([])).toEqual([]);
  });

  it('passes through flat group-level entries', () => {
    const result = normalizePermissionCatalog(catalog);
    expect(result.some((g) => g.id === 'grp-members')).toBe(true);
    expect(result.some((g) => g.id === 'grp-branch')).toBe(true);
  });

  it('deduplicates permissions within a group', () => {
    const duplicated = [
      {
        id: 'grp-dup',
        name: 'Dup',
        permissions: [
          { id: 'perm-x', name: 'view' },
          { id: 'perm-x', name: 'view' }, // duplicate
        ],
      },
    ];
    const result = normalizePermissionCatalog(duplicated);
    const grp = result.find((g) => g.id === 'grp-dup');
    const permX = grp?.permissions?.filter((p) => p.id === 'perm-x') || [];
    expect(permX.length).toBe(1);
  });

  it('handles entries with nested permissionGroups', () => {
    const nested = [
      {
        id: 'top',
        permissionGroups: [
          { id: 'nested-grp', name: 'Nested Group', permissions: [{ id: 'np-1', name: 'view' }] },
        ],
      },
    ];
    const result = normalizePermissionCatalog(nested);
    expect(result.some((g) => g.id === 'nested-grp')).toBe(true);
  });

  it('handles entries that carry back-reference group metadata on each permission', () => {
    const withRefs = [
      {
        id: 'ref-group',
        name: 'Ref Group',
        permissions: [
          { id: 'rp-1', name: 'view', group: { id: 'ref-group', name: 'Ref Group' } },
        ],
      },
    ];
    const result = normalizePermissionCatalog(withRefs);
    expect(result.some((g) => g.id === 'ref-group')).toBe(true);
  });
});

describe('buildRolePermissionPayload', () => {
  it('maps frontend permission id to matching backend permission ids', () => {
    const result = buildRolePermissionPayload({
      permissionIds: ['manage-members'],
      catalog,
    });
    // All four CRUD backend permissions should be included (view, create, edit, delete selected by default)
    expect(result.permissions).toContain('perm-view');
    expect(result.permissions).toContain('perm-create');
    expect(result.permissions).toContain('perm-edit');
    expect(result.permissions).toContain('perm-delete');
    expect(result.permissionGroup).toContain('grp-members');
  });

  it('respects granular permissions — only maps selected actions', () => {
    const result = buildRolePermissionPayload({
      permissionIds: ['manage-members'],
      granularPermissions: { 'manage-members': ['view'] },
      catalog,
    });
    expect(result.permissions).toContain('perm-view');
    expect(result.permissions).not.toContain('perm-create');
    expect(result.permissions).not.toContain('perm-delete');
  });

  it('records unsupported permission ids when no catalog group matches', () => {
    const result = buildRolePermissionPayload({
      permissionIds: ['manage-nonexistent'],
      catalog,
    });
    expect(result.unsupportedPermissionIds).toContain('manage-nonexistent');
  });

  it('passes UUID-like ids directly when catalog is empty', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = buildRolePermissionPayload({
      permissionIds: [uuid],
      catalog: [],
    });
    expect(result.permissions).toContain(uuid);
    expect(result.unsupportedPermissionIds).toHaveLength(0);
  });

  it('handles known UUID-format permission ids that exist in catalog', () => {
    // Use real UUID-format IDs so the function routes through the catalog lookup path
    const uuidCatalog: PermissionCatalogGroup[] = [
      {
        id: '11111111-1111-1111-8111-111111111111',
        name: 'Members',
        permissions: [
          { id: '22222222-2222-2222-8222-222222222222', name: 'view', permissionGroupId: '11111111-1111-1111-8111-111111111111' },
        ],
      },
    ];
    const result = buildRolePermissionPayload({
      permissionIds: ['22222222-2222-2222-8222-222222222222'],
      catalog: uuidCatalog,
    });
    expect(result.permissions).toContain('22222222-2222-2222-8222-222222222222');
    expect(result.permissionGroup).toContain('11111111-1111-1111-8111-111111111111');
  });
});

describe('mapBackendRolePermissions', () => {
  it('maps a full group ref to the frontend permission id', () => {
    const result = mapBackendRolePermissions({
      permissionGroups: [{ id: 'grp-members', name: 'Members' }],
      catalog,
      scopeLevel: 'church',
    });
    expect(result.permissions).toContain('manage-members');
  });

  it('maps specific backend permission ids to granular frontend actions', () => {
    const result = mapBackendRolePermissions({
      permissions: [
        { id: 'perm-view', name: 'view', group: { id: 'grp-members', name: 'Members' } },
      ],
      catalog,
      scopeLevel: 'church',
    });
    expect(result.permissions).toContain('manage-members');
    expect(result.granularPermissions['manage-members']).toContain('view');
  });

  it('returns empty result for empty inputs', () => {
    const result = mapBackendRolePermissions({ catalog });
    expect(result.permissions).toHaveLength(0);
    expect(Object.keys(result.granularPermissions)).toHaveLength(0);
  });

  it('resolves branch scope admin group to manage-branch-admins', () => {
    const adminGroup: PermissionCatalogGroup = {
      id: 'grp-admin',
      name: 'Admin',
      permissions: [{ id: 'adm-view', name: 'view', permissionGroupId: 'grp-admin' }],
    };
    const result = mapBackendRolePermissions({
      permissionGroups: [{ id: 'grp-admin', name: 'Admin' }],
      catalog: [adminGroup],
      scopeLevel: 'branch',
    });
    expect(result.permissions).toContain('manage-branch-admins');
  });
});

describe('extractUnmappedBackendRolePermissions', () => {
  it('preserves group ids that have no corresponding frontend mapping', () => {
    const result = extractUnmappedBackendRolePermissions({
      permissionGroups: ['unknown-group-id'],
      catalog: [],
    });
    expect(result.permissionGroup).toContain('unknown-group-id');
  });

  it('does not preserve group ids that map to a frontend permission', () => {
    const result = extractUnmappedBackendRolePermissions({
      permissionGroups: [{ id: 'grp-members', name: 'Members' }],
      catalog,
    });
    expect(result.permissionGroup).not.toContain('grp-members');
  });

  it('preserves permission ids with no group mapping', () => {
    const result = extractUnmappedBackendRolePermissions({
      permissions: ['unknown-perm-id'],
      catalog: [],
    });
    expect(result.permissions).toContain('unknown-perm-id');
  });
});

describe('deriveAssignablePermissions', () => {
  it('returns all permissions for scope when catalog is empty', () => {
    const result = deriveAssignablePermissions({ catalog: [], scopeLevel: 'church' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.level.includes('church'))).toBe(true);
  });

  it('returns branch-level permissions for branch scope', () => {
    const result = deriveAssignablePermissions({ catalog: [], scopeLevel: 'branch' });
    expect(result.every((p) => p.level.includes('branch'))).toBe(true);
  });

  it('filters actions to only those supported by the catalog', () => {
    // catalog only has view/create for members group
    const twoActionCatalog: PermissionCatalogGroup[] = [
      {
        id: 'grp-members',
        name: 'Members',
        permissions: [
          { id: 'perm-view', name: 'view', permissionGroupId: 'grp-members' },
          { id: 'perm-create', name: 'create', permissionGroupId: 'grp-members' },
        ],
      },
    ];
    const result = deriveAssignablePermissions({ catalog: twoActionCatalog, scopeLevel: 'church' });
    const membersPermission = result.find((p) => p.id === 'manage-members');
    if (membersPermission?.actions) {
      const actionIds = membersPermission.actions.map((a) => a.id);
      expect(actionIds).toContain('view');
      expect(actionIds).toContain('create');
      expect(actionIds).not.toContain('delete');
    }
  });
});
