import { PERMISSIONS } from '../data/permissions';
import type { AdminLevel, Permission } from '../types';

type CatalogPermission = {
  id: string;
  name?: string;
  permissionGroupId?: string;
  description?: string;
  order?: number;
  group?: { id?: string; name?: string };
};

export type PermissionCatalogGroup = {
  id: string;
  name?: string;
  description?: string;
  permissions?: CatalogPermission[];
};

type PermissionRef = string | (CatalogPermission & { group?: { id?: string; name?: string } });
type PermissionGroupRef = string | { id?: string; name?: string; permissions?: CatalogPermission[] };

const FRONTEND_PERMISSION_TO_GROUP_NAMES: Record<string, string[]> = {
  'manage-branches': ['Branch'],
  'manage-departments': ['Department'],
  'manage-units': ['Unit'],
  'manage-department-units': ['Unit'],
  'manage-church-admins': ['Admin'],
  'manage-branch-admins': ['Admin'],
  'manage-department-admins': ['Admin'],
  'manage-unit-admins': ['Admin'],
  'manage-workforce': ['Workers'],
  'manage-members': ['Members'],
  'manage-programs': ['Programs'],
  'manage-collections': ['Collection', 'Finance'],
  'view-reports': ['Reports'],
  'submit-reports': ['Reports'],
  'view-all-data': ['Reports'],
  'view-branch-data': ['Reports'],
  'follow-up': ['FollowUp'],
  'manage-sms': ['Messaging'],
  'manage-wallet': ['Wallet'],
  'manage-attendance': ['Attendance'],
  'customize-newcomer-forms': ['FollowUp'],
};

const FRONTEND_ACTION_TO_BACKEND_ACTIONS: Record<string, string[]> = {
  view: ['view'],
  create: ['create'],
  edit: ['edit'],
  delete: ['delete'],
  assign: ['edit'],
  suspend: ['edit'],
  'reset-password': ['edit'],
  export: ['view'],
  star: ['view'],
  attach: ['create'],
  'data-insert': ['create'],
  move: ['edit'],
  send: ['create'],
  topup: ['create'],
  record: ['create'],
};

function normalize(value: string | undefined | null) {
  return (value || '').trim().toLowerCase();
}

function buildLookupKeys(value: string | undefined | null) {
  const base = normalize(value);
  if (!base) return [];

  const compact = base.replace(/[^a-z0-9]/g, '');
  const variants = new Set<string>([base, compact].filter(Boolean));

  if (base.endsWith('s')) {
    variants.add(base.slice(0, -1));
  }
  if (compact.endsWith('s')) {
    variants.add(compact.slice(0, -1));
  }

  return Array.from(variants).filter(Boolean);
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getPermissionDefinition(permissionId: string) {
  return PERMISSIONS.find((permission) => permission.id === permissionId);
}

function mergeCatalogPermission(
  existing: CatalogPermission | undefined,
  next: any,
  permissionGroupId?: string
): CatalogPermission {
  return {
    id: existing?.id || next?.id || '',
    name: existing?.name || next?.name,
    description: existing?.description || next?.description,
    order: existing?.order ?? next?.order,
    permissionGroupId: existing?.permissionGroupId || next?.permissionGroupId || next?.group?.id || permissionGroupId,
  };
}

export function normalizePermissionCatalog(catalog: any[]): PermissionCatalogGroup[] {
  const groupsByKey = new Map<string, PermissionCatalogGroup>();

  function ensureGroup(groupLike: any): PermissionCatalogGroup | undefined {
    if (!groupLike) return undefined;
    const groupId = typeof groupLike === 'string' ? groupLike : groupLike.id;
    const groupName = typeof groupLike === 'object' ? groupLike.name : undefined;
    const key = groupId || normalize(groupName);
    if (!key) return undefined;

    const existing = groupsByKey.get(key) || {
      id: groupId || key,
      name: groupName || '',
      description: groupLike?.description,
      permissions: [] as CatalogPermission[],
    };

    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, existing);
    }

    if (!existing.id && groupId) existing.id = groupId;
    if (!existing.name && groupName) existing.name = groupName;
    if (!existing.description && groupLike?.description) existing.description = groupLike.description;

    if (Array.isArray(groupLike?.permissions)) {
      for (const permission of groupLike.permissions) {
        if (!permission?.id) continue;
        const current = existing.permissions?.find((entry) => entry.id === permission.id);
        const merged = mergeCatalogPermission(current, permission, existing.id);
        if (current) {
          Object.assign(current, merged);
        } else {
          existing.permissions = [...(existing.permissions || []), merged];
        }
      }
    }

    return existing;
  }

  for (const entry of Array.isArray(catalog) ? catalog : []) {
    const hasNestedGroups = Array.isArray(entry?.permissionGroups) && entry.permissionGroups.length > 0;
    const hasNestedPermissionRefs = Array.isArray(entry?.permissions)
      && entry.permissions.some((permission: any) => permission?.group || permission?.permissionGroupId);

    if (!hasNestedGroups && !hasNestedPermissionRefs) {
      ensureGroup(entry);
      continue;
    }

    if (Array.isArray(entry?.permissionGroups)) {
      entry.permissionGroups.forEach((group: any) => {
        ensureGroup(group);
      });
    }

    // If the entry itself is a named group (id + name) whose permissions carry
    // back-references (already-normalized data), register it by name first so
    // that name-based lookups still work after the second normalization pass.
    if (!hasNestedGroups && entry?.id && entry?.name) {
      ensureGroup({ id: entry.id, name: entry.name, description: entry.description });
    }

    if (Array.isArray(entry?.permissions)) {
      entry.permissions.forEach((permission: any) => {
        const group = ensureGroup(permission?.group || { id: permission?.permissionGroupId, name: permission?.group?.name });
        if (!group || !permission?.id) return;
        const current = group.permissions?.find((entryPermission) => entryPermission.id === permission.id);
        const merged = mergeCatalogPermission(current, permission, group.id);
        if (current) {
          Object.assign(current, merged);
        } else {
          group.permissions = [...(group.permissions || []), merged];
        }
      });
    }
  }

  return Array.from(groupsByKey.values())
    .filter((group) => group?.id)
    .map((group) => ({
      ...group,
      permissions: Array.from(
        new Map(
          (group.permissions || [])
            .filter((permission) => permission?.id)
            .map((permission) => [permission.id, { ...permission, permissionGroupId: permission.permissionGroupId || group.id }])
        ).values()
      ),
    }));
}

function getSelectedFrontendActions(
  permissionId: string,
  granularPermissions?: Record<string, string[]>
) {
  const explicit = granularPermissions?.[permissionId];
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit;
  }
  const definition = getPermissionDefinition(permissionId);
  return definition?.actions?.map((action) => action.id) || [];
}

function resolveFrontendPermissionsForGroup(groupName: string, scopeLevel?: string) {
  const groupKeys = new Set(buildLookupKeys(groupName));
  if (groupKeys.has('branch')) return ['manage-branches'];
  if (groupKeys.has('department')) return ['manage-departments'];
  if (groupKeys.has('unit')) return [scopeLevel === 'department' ? 'manage-department-units' : 'manage-units'];
  if (groupKeys.has('member')) return ['manage-members'];
  if (groupKeys.has('worker')) return ['manage-workforce'];
  if (groupKeys.has('program')) return ['manage-programs'];
  if (groupKeys.has('collection') || groupKeys.has('finance')) return ['manage-collections'];
  if (groupKeys.has('followup')) return ['follow-up'];
  if (groupKeys.has('messaging') || groupKeys.has('message') || groupKeys.has('sms')) return ['manage-sms'];
  if (groupKeys.has('wallet')) return ['manage-wallet'];
  if (groupKeys.has('attendance')) return ['manage-attendance'];
  if (groupKeys.has('report')) return ['view-reports', 'submit-reports'];
  if (groupKeys.has('admin')) {
    if (scopeLevel === 'branch') return ['manage-branch-admins'];
    if (scopeLevel === 'department') return ['manage-department-admins'];
    if (scopeLevel === 'unit') return ['manage-unit-admins'];
    return ['manage-church-admins'];
  }
  return [];
}

function mapBackendActionsToFrontendActions(permissionId: string, backendActions: Set<string>) {
  const definition = getPermissionDefinition(permissionId);
  const availableActions = definition?.actions || [];
  if (backendActions.size === 0) {
    return availableActions.map((action) => action.id);
  }
  return availableActions
    .filter((action) => {
      const aliases = FRONTEND_ACTION_TO_BACKEND_ACTIONS[action.id] || [];
      return aliases.some((alias) => backendActions.has(alias));
    })
    .map((action) => action.id);
}

function buildCatalogMetadata(catalog: PermissionCatalogGroup[]) {
  const normalizedCatalog = normalizePermissionCatalog(catalog);
  const groupsById = new Map(
    normalizedCatalog
      .filter((group) => group?.id)
      .map((group) => [group.id, group])
  );
  const permissionMetaById = new Map<string, { groupName: string; actionName: string }>();
  for (const group of normalizedCatalog) {
    for (const permission of group.permissions || []) {
      permissionMetaById.set(permission.id, {
        groupName: group.name || '',
        actionName: permission.name || '',
      });
    }
  }
  return { groupsById, permissionMetaById, normalizedCatalog };
}

function resolveCatalogGroupsForFrontendPermission(
  permissionId: string,
  groupByName: Map<string, PermissionCatalogGroup>
) {
  const candidateNames = FRONTEND_PERMISSION_TO_GROUP_NAMES[permissionId] || [];
  const groups = new Map<string, PermissionCatalogGroup>();

  for (const candidateName of candidateNames) {
    for (const key of buildLookupKeys(candidateName)) {
      const group = groupByName.get(key);
      if (group?.id) {
        groups.set(group.id, group);
      }
    }
  }

  return Array.from(groups.values());
}

function resolvePermissionGroupMeta(
  permissionRef: PermissionRef,
  groupsById: Map<string, PermissionCatalogGroup>,
  permissionMetaById: Map<string, { groupName: string; actionName: string }>
) {
  const permissionId = typeof permissionRef === 'string' ? permissionRef : permissionRef?.id;
  const meta = permissionId ? permissionMetaById.get(permissionId) : undefined;
  const fallbackGroupId = typeof permissionRef === 'object'
    ? permissionRef.permissionGroupId || permissionRef.group?.id
    : undefined;
  const fallbackGroupName = typeof permissionRef === 'object' ? permissionRef.group?.name : undefined;
  return {
    groupName: meta?.groupName || fallbackGroupName || (fallbackGroupId ? groupsById.get(fallbackGroupId)?.name : undefined),
    actionName: meta?.actionName || (typeof permissionRef === 'object' ? permissionRef.name : undefined),
  };
}

export function deriveAssignablePermissions(options: {
  catalog: PermissionCatalogGroup[];
  scopeLevel: AdminLevel;
}) {
  const { catalog, scopeLevel } = options;
  const normalizedCatalog = normalizePermissionCatalog(catalog);
  const availablePermissions = PERMISSIONS.filter((permission) => permission.level.includes(scopeLevel));
  const groupByName = new Map<string, PermissionCatalogGroup>();

  normalizedCatalog
    .filter((group) => group?.id)
    .forEach((group) => {
      for (const key of buildLookupKeys(group.name || group.id)) {
        if (!groupByName.has(key)) {
          groupByName.set(key, group);
        }
      }
    });

  if (groupByName.size === 0) {
    return availablePermissions;
  }

  return availablePermissions
    .map((permission) => {
      const groups = resolveCatalogGroupsForFrontendPermission(permission.id, groupByName);
      if (groups.length === 0) return permission;

      const availableBackendActions = new Set(
        groups.flatMap((group) => (group.permissions || []).map((catalogPermission) => normalize(catalogPermission.name)))
      );
      const consumedBackendActions = new Set<string>();
      const supportedActions = (permission.actions || []).filter((action) => {
        const aliases = FRONTEND_ACTION_TO_BACKEND_ACTIONS[action.id] || [];
        const matchedBackendAction = aliases.find(
          (alias) => availableBackendActions.has(alias) && !consumedBackendActions.has(alias)
        );
        if (!matchedBackendAction) return false;
        consumedBackendActions.add(matchedBackendAction);
        return true;
      });

      return {
        ...permission,
        description: permission.description || groups[0]?.description,
        actions: supportedActions.length > 0 ? supportedActions : permission.actions,
      };
    })
    .filter((permission): permission is Permission => Boolean(permission));
}

export function buildRolePermissionPayload(options: {
  permissionIds: string[];
  granularPermissions?: Record<string, string[]>;
  catalog: PermissionCatalogGroup[];
}) {
  const { permissionIds, granularPermissions, catalog } = options;
  const normalizedCatalog = normalizePermissionCatalog(catalog);
  const groupByName = new Map<string, PermissionCatalogGroup>();
  const permissionToGroupId = new Map<string, string>();
  const knownGroupIds = new Set<string>();

  normalizedCatalog
    .filter((group) => group?.id)
    .forEach((group) => {
      knownGroupIds.add(group.id);
      for (const key of buildLookupKeys(group.name || group.id)) {
        if (!groupByName.has(key)) {
          groupByName.set(key, group);
        }
      }
      for (const permission of group.permissions || []) {
        if (permission?.id) {
          permissionToGroupId.set(permission.id, permission.permissionGroupId || group.id);
        }
      }
    });

  if (groupByName.size === 0 && permissionIds.every(isUuidLike)) {
    return {
      permissions: permissionIds,
      permissionGroup: [] as string[],
      unsupportedPermissionIds: [] as string[],
    };
  }

  const backendPermissionIds = new Set<string>();
  const backendPermissionGroupIds = new Set<string>();
  const unsupportedPermissionIds = new Set<string>();

  for (const permissionId of permissionIds) {
    if (isUuidLike(permissionId)) {
      const directGroupId = permissionToGroupId.get(permissionId);
      if (directGroupId) {
        backendPermissionIds.add(permissionId);
        backendPermissionGroupIds.add(directGroupId);
        continue;
      }
      if (knownGroupIds.has(permissionId)) {
        backendPermissionGroupIds.add(permissionId);
        continue;
      }
    }

    const groups = resolveCatalogGroupsForFrontendPermission(permissionId, groupByName);
    if (groups.length === 0) {
      unsupportedPermissionIds.add(permissionId);
      continue;
    }

    const selectedActions = getSelectedFrontendActions(permissionId, granularPermissions);
    const mappedActionNames = new Set(
      selectedActions.flatMap((actionId) => FRONTEND_ACTION_TO_BACKEND_ACTIONS[actionId] || [])
    );

    for (const group of groups) {
      backendPermissionGroupIds.add(group.id);
      for (const permission of group.permissions || []) {
        if (mappedActionNames.has(normalize(permission.name))) {
          backendPermissionIds.add(permission.id);
        }
      }
    }
  }

  return {
    permissions: Array.from(backendPermissionIds),
    permissionGroup: Array.from(backendPermissionGroupIds),
    unsupportedPermissionIds: Array.from(unsupportedPermissionIds),
  };
}

export function extractUnmappedBackendRolePermissions(options: {
  permissions?: PermissionRef[];
  permissionGroups?: PermissionGroupRef[];
  scopeLevel?: string;
  catalog: PermissionCatalogGroup[];
}) {
  const { permissions = [], permissionGroups = [], scopeLevel, catalog } = options;
  const { groupsById, permissionMetaById } = buildCatalogMetadata(catalog);
  const preservedPermissionIds = new Set<string>();
  const preservedPermissionGroupIds = new Set<string>();

  for (const groupRef of permissionGroups) {
    const groupId = typeof groupRef === 'string' ? groupRef : groupRef?.id;
    const groupName =
      (typeof groupRef === 'string' ? groupsById.get(groupRef)?.name : groupRef?.name) ||
      (groupId ? groupsById.get(groupId)?.name : undefined);
    if (!groupId) {
      continue;
    }
    if (!groupName || resolveFrontendPermissionsForGroup(groupName, scopeLevel).length === 0) {
      preservedPermissionGroupIds.add(groupId);
    }
  }

  for (const permissionRef of permissions) {
    const permissionId = typeof permissionRef === 'string' ? permissionRef : permissionRef?.id;
    if (!permissionId) {
      continue;
    }
    const { groupName } = resolvePermissionGroupMeta(permissionRef, groupsById, permissionMetaById);
    if (!groupName || resolveFrontendPermissionsForGroup(groupName, scopeLevel).length === 0) {
      preservedPermissionIds.add(permissionId);
    }
  }

  return {
    permissions: Array.from(preservedPermissionIds),
    permissionGroup: Array.from(preservedPermissionGroupIds),
  };
}

export function mapBackendRolePermissions(options: {
  permissions?: PermissionRef[];
  permissionGroups?: PermissionGroupRef[];
  scopeLevel?: string;
  catalog: PermissionCatalogGroup[];
}) {
  const { permissions = [], permissionGroups = [], scopeLevel, catalog } = options;
  const { groupsById, permissionMetaById } = buildCatalogMetadata(catalog);
  const backendActionsByGroup = new Map<string, Set<string>>();

  for (const groupRef of permissionGroups) {
    const groupId = typeof groupRef === 'string' ? groupRef : groupRef?.id;
    const groupName =
      (typeof groupRef === 'string' ? groupsById.get(groupRef)?.name : groupRef?.name) ||
      (groupId ? groupsById.get(groupId)?.name : undefined);
    if (!groupId || !groupName) {
      continue;
    }
    if (!backendActionsByGroup.has(groupName)) {
      backendActionsByGroup.set(groupName, new Set<string>());
    }
  }

  for (const permissionRef of permissions) {
    const permissionId = typeof permissionRef === 'string' ? permissionRef : permissionRef?.id;
    if (!permissionId) {
      continue;
    }
    const { groupName, actionName } = resolvePermissionGroupMeta(permissionRef, groupsById, permissionMetaById);
    if (!groupName) {
      continue;
    }
    if (!backendActionsByGroup.has(groupName)) {
      backendActionsByGroup.set(groupName, new Set<string>());
    }
    if (actionName) {
      backendActionsByGroup.get(groupName)?.add(normalize(actionName));
    }
  }

  const selectedPermissionIds = new Set<string>();
  const granularPermissions: Record<string, string[]> = {};

  for (const [groupName, backendActions] of backendActionsByGroup.entries()) {
    for (const frontendPermissionId of resolveFrontendPermissionsForGroup(groupName, scopeLevel)) {
      const frontendActions = mapBackendActionsToFrontendActions(frontendPermissionId, backendActions);
      if (backendActions.size > 0 && frontendActions.length === 0) {
        continue;
      }
      selectedPermissionIds.add(frontendPermissionId);
      if (frontendActions.length > 0) {
        granularPermissions[frontendPermissionId] = frontendActions;
      }
    }
  }

  return {
    permissions: Array.from(selectedPermissionIds),
    granularPermissions,
  };
}



