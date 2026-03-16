import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Admin } from '../types';
import { loginApi, logoutApi, fetchAdmin, fetchAdminPermissionState, refreshAccessToken } from '../api';
import { AUTH_SESSION_EXPIRED_EVENT, getAccessToken, setAccessToken, setTenantId, decodeJwtClaims } from '../apiClient';

interface AuthContextType {
  currentAdmin: Admin | null;
  accessToken: string | null;
  isLoading: boolean;
  /** True when the church signed up with the multi-branch option (derived from JWT) */
  isHeadQuarter: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; warning?: string; needsEmailVerification?: boolean }>;
  signOut: (options?: { confirmed?: boolean }) => Promise<boolean>;
  /** Called after onboarding to set the current admin without going through login page */
  setCurrentAdmin: (admin: Admin) => void;
  /** Refresh current admin data from the server */
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// sessionStorage key - cleared automatically when the browser tab/window closes
const ADMIN_CACHE_KEY = 'churchset_current_admin';
const TENANT_META_NAME_KEY = 'churchset_tenant_name';
const TENANT_META_HQ_KEY = 'churchset_is_hq';
const CHURCH_DATA_KEY = 'churchset_church_data';

function normalizeGranularPermissions(granularPermissions?: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(granularPermissions || {})
      .filter(([, actions]) => Array.isArray(actions) && actions.length > 0)
      .map(([permissionId, actions]) => [permissionId, Array.from(new Set(actions.filter(Boolean)))])
  );
}

function normalizePermissionIds(permissionIds?: string[]) {
  return Array.from(new Set((permissionIds || []).filter(Boolean)));
}

// Removed hasResolvedPermissionState

function mergePermissionState(
  admin: Admin,
  permissionState?: {
    roleId?: string;
    permissions?: string[];
    granularPermissions?: Record<string, string[]>;
  } | null
): Admin {
  const hasExplicitPermissions = Array.isArray(admin.customPermissions) || Array.isArray(admin.permissions);
  const hasExplicitGranularPermissions = admin.granularPermissions !== undefined;
  const hasExplicitPermissionState = hasExplicitPermissions || hasExplicitGranularPermissions;
  const explicitPermissions = Array.isArray(admin.customPermissions)
    ? normalizePermissionIds(admin.customPermissions)
    : Array.isArray(admin.permissions)
      ? normalizePermissionIds(admin.permissions)
      : undefined;

  return {
    ...admin,
    roleId: permissionState?.roleId || admin.roleId,
    permissions: hasExplicitPermissions
      ? explicitPermissions
      : Array.isArray(permissionState?.permissions)
        ? normalizePermissionIds(permissionState.permissions)
        : admin.permissions,
    granularPermissions: hasExplicitPermissionState
      ? normalizeGranularPermissions(admin.granularPermissions)
      : normalizeGranularPermissions(permissionState?.granularPermissions ?? admin.granularPermissions),
  };
}

function normalizeAdminScopeLevel(rawLevel?: string | null, isSuperAdmin?: boolean): Admin['level'] {
  if (isSuperAdmin) return 'church';
  if (rawLevel === 'member' || rawLevel === 'unit') return 'unit';
  if (rawLevel === 'church' || rawLevel === 'branch' || rawLevel === 'department') return rawLevel;
  return 'branch';
}

/** Map API admin response to the internal Admin type */
function mapApiAdminToAdmin(apiAdmin: any): Admin {
  const branchIds = Array.isArray(apiAdmin.branchIds) && apiAdmin.branchIds.length > 0
    ? apiAdmin.branchIds.filter(Boolean)
    : Array.isArray(apiAdmin.branches)
      ? apiAdmin.branches.map((branch: any) => branch?.id).filter(Boolean)
      : apiAdmin.branchId
        ? [apiAdmin.branchId]
        : [];
  const departmentIds = Array.isArray(apiAdmin.departmentIds) && apiAdmin.departmentIds.length > 0
    ? apiAdmin.departmentIds.filter(Boolean)
    : Array.isArray(apiAdmin.departments)
      ? apiAdmin.departments.map((department: any) => department?.id).filter(Boolean)
      : apiAdmin.departmentId
        ? [apiAdmin.departmentId]
        : [];
  const unitIds = Array.isArray(apiAdmin.unitIds) && apiAdmin.unitIds.length > 0
    ? apiAdmin.unitIds.filter(Boolean)
    : Array.isArray(apiAdmin.units)
      ? apiAdmin.units.map((unit: any) => unit?.id).filter(Boolean)
      : apiAdmin.unitId
        ? [apiAdmin.unitId]
        : [];
  const rawLevel = apiAdmin.level || apiAdmin.scopeLevel || apiAdmin.roles?.[0]?.scopeLevel || apiAdmin.role?.scopeLevel;
  const level = normalizeAdminScopeLevel(rawLevel, apiAdmin.isSuperAdmin);
  const customPermissions = Array.isArray(apiAdmin.customPermissions)
    ? normalizePermissionIds(apiAdmin.customPermissions)
    : undefined;
  const permissions = Array.isArray(apiAdmin.permissions)
    ? normalizePermissionIds(apiAdmin.permissions)
    : customPermissions;
  return {
    id: apiAdmin.id as string,
    churchId: apiAdmin.churchId || '',
    name: apiAdmin.name,
    email: apiAdmin.email,
    phone: apiAdmin.phone,
    isSuperAdmin: apiAdmin.isSuperAdmin ?? false,
    roleId: apiAdmin.roleId || apiAdmin.roles?.[0]?.id || '',
    level,
    status: apiAdmin.status || (apiAdmin.isActive === false ? 'suspended' : 'active'),
    branchId: apiAdmin.branchId || apiAdmin.branch?.id || branchIds[0] || undefined,
    departmentId: apiAdmin.departmentId || departmentIds[0] || undefined,
    unitId: apiAdmin.unitId || unitIds[0] || undefined,
    branchIds,
    departmentIds,
    unitIds,
    permissions,
    granularPermissions: normalizeGranularPermissions(apiAdmin.granularPermissions),
    customPermissions,
    createdAt: apiAdmin.createdAt instanceof Date ? apiAdmin.createdAt : new Date(apiAdmin.createdAt || Date.now()),
    profilePicture: apiAdmin.profilePicture,
  };
}

function normalizeEmail(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function findMatchingAdminRecord(admins: any[], cachedAdmin: Admin | null, claims: Record<string, any>) {
  const claimId = String(claims.id || claims.userId || '').trim();
  const claimEmail = normalizeEmail(claims.email);
  const cachedEmail = normalizeEmail(cachedAdmin?.email);

  return admins.find((admin: any) => {
    const adminEmail = normalizeEmail(admin?.email);
    return Boolean(
      (claimId && admin?.id === claimId) ||
      (claimEmail && adminEmail === claimEmail) ||
      (cachedAdmin?.id && admin?.id === cachedAdmin.id) ||
      (cachedEmail && adminEmail === cachedEmail)
    );
  });
}

function isEmailVerificationRequiredMessage(message: string) {
  const normalized = normalizeEmail(message).replace(/\.$/, '');
  return normalized === 'email verification required' || normalized.includes('verification required');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdminState] = useState<Admin | null>(() => {
    try {
      const cached = sessionStorage.getItem(ADMIN_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return null;
  });
  // Access token lives in memory only (set by apiClient); state mirrors it for reactivity
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  // Derive isHeadQuarter: JWT claims are authoritative (server-signed, tamper-proof).
  // Fall back to sessionStorage cache written at login if the JWT doesn't carry the claim.
  const isHeadQuarter = (() => {
    const token = accessToken || getAccessToken();
    if (token) {
      const claims = decodeJwtClaims(token);
      if (claims.isHeadQuarter != null) return Boolean(claims.isHeadQuarter);
    }
    // Fallback: value stored from login response body
    try {
      return sessionStorage.getItem(TENANT_META_HQ_KEY) === 'true';
    } catch { return false; }
  })();

  // Persist current admin to sessionStorage (cleared when browser tab closes)
  const persistAdmin = (admin: Admin | null) => {
    try {
      if (admin) sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(admin));
      else sessionStorage.removeItem(ADMIN_CACHE_KEY);
    } catch { /* ignore */ }
  };

  const clearSessionState = () => {
    setAccessToken(null);
    setTenantId(null);
    setAccessTokenState(null);
    setCurrentAdminState(null);
    persistAdmin(null);
    try {
      sessionStorage.removeItem(TENANT_META_NAME_KEY);
      sessionStorage.removeItem(TENANT_META_HQ_KEY);
      sessionStorage.removeItem(CHURCH_DATA_KEY);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleSessionExpired = () => {
      clearSessionState();
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired as EventListener);
  }, []);

  // On mount: access token is not persisted anywhere, so try to silently
  // restore it from the httpOnly refresh-token cookie set by the server.
  useEffect(() => {
    const initSession = async () => {
      try {
        let token = getAccessToken();
        if (!token) {
          // Attempt a silent token refresh using the httpOnly cookie
          try {
            await refreshAccessToken();
            token = getAccessToken();
            if (token) {
              setAccessTokenState(token);
            }
          } catch {
            // No valid refresh token - clear stale session and force login
            clearSessionState();
          }
        }
        if (token) {
          try {
            const claims = decodeJwtClaims(token);
            // Start with the cached admin (already loaded from sessionStorage as initial state)
            let resolvedAdmin: Admin | null = currentAdmin;
            try {
              if (claims.id) {
                const adminResponse = await fetchAdmin(String(claims.id));
                if (adminResponse && adminResponse.admin) {
                  resolvedAdmin = mapApiAdminToAdmin(adminResponse.admin);
                }
              }
            } catch {
              // fetchAdmins can return 403 for limited-permission admins - the token is
              // still valid. Fall back to the cached admin from sessionStorage. If there's
              // no cached admin either, build a minimal one from the JWT claims so the
              // session stays alive and the user can continue working.
              if (!resolvedAdmin && claims.id) {
                const adminBranchId = claims.branchId || undefined;
                resolvedAdmin = {
                  id: String(claims.id),
                  churchId: claims.churchId || '',
                  name: claims.name ?? '',
                  email: claims.email ?? '',
                  isSuperAdmin: claims.isSuperAdmin ?? false,
                  roleId: '',
                  level: claims.isSuperAdmin ? 'church' : 'branch',
                  status: 'active',
                  createdAt: new Date(),
                  branchId: adminBranchId,
                  branchIds: adminBranchId ? [adminBranchId] : [],
                };
              }
            }
            if (resolvedAdmin && resolvedAdmin.id) {
              try {
                const permissionState = await fetchAdminPermissionState(resolvedAdmin.id, resolvedAdmin.level);
                resolvedAdmin = mergePermissionState(resolvedAdmin, permissionState);
              } catch {
                // Keep the cached admin when permission hydration is unavailable.
              }
            }
            if (resolvedAdmin) {
              setCurrentAdminState(resolvedAdmin);
              persistAdmin(resolvedAdmin);
            }
          } catch {
            // Token genuinely unusable - wipe everything
            clearSessionState();
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string; warning?: string; needsEmailVerification?: boolean }> => {
    try {
      const response = await loginApi({ email, password });

      setAccessToken(response.accessToken);
      setAccessTokenState(response.accessToken);

      // When the account has no active subscription the API returns 403 with
      // requiresSubscription=true + an accessToken but no user/tenant fields.
      // Decode the JWT claims as fallback so login doesn't crash.
      let userId = response.user?.id;
      let userName = response.user?.name ?? email;
      let userEmail = response.user?.email ?? email;
      let userIsSuperAdmin = response.user?.isSuperAdmin ?? false;
      let tenantId = response.tenant?.id ?? '';
      let tenantName = response.tenant?.name ?? '';

      // Always decode JWT - it is the authoritative source for isHeadQuarter
      const claims = decodeJwtClaims(response.accessToken);
      const adminBranchId = claims.branchId || undefined;

      // JWT claims take priority; fall back to response body.
      // null means "unknown" - we won't overwrite an existing sessionStorage value in that case.
      const tenantIsHq: boolean | null =
        claims.isHeadQuarter != null
          ? Boolean(claims.isHeadQuarter)
          : response.tenant?.isHeadQuarter != null
            ? Boolean(response.tenant.isHeadQuarter)
            : null;

      if (!userId && response.accessToken) {
        userId = claims.id ?? '';
        userName = claims.name ?? email;
        userEmail = claims.email ?? email;
        userIsSuperAdmin = claims.isSuperAdmin ?? false;
        tenantId = claims.tenantId ?? '';
        tenantName = claims.church_name ?? '';
      }

      // Build admin from login response
      const admin: Admin = {
        id: userId ?? '',
        churchId: claims.churchId || '',
        name: userName,
        email: userEmail,
        isSuperAdmin: userIsSuperAdmin,
        roleId: '',
        level: userIsSuperAdmin ? 'church' : 'branch',
        status: 'active',
        createdAt: new Date(),
        branchId: adminBranchId,
        branchIds: adminBranchId ? [adminBranchId] : [],
      };

      // Persist tenant ID so the apiClient sends x-tenant-id on every request
      if (tenantId) {
        setTenantId(tenantId);
      }

      // Store tenant info in sessionStorage.
      // Only write the HQ flag if we actually know the value - otherwise preserve
      // any existing value (e.g. set during onboarding before the 403 login response).
      try {
        if (tenantName) sessionStorage.setItem(TENANT_META_NAME_KEY, tenantName);
        if (tenantIsHq !== null) {
          sessionStorage.setItem(TENANT_META_HQ_KEY, String(tenantIsHq));
        }
      } catch { /* ignore */ }

      let resolvedAdmin = admin;
      try {
        if (admin.id) {
          const adminResponse = await fetchAdmin(admin.id);
          if (adminResponse && adminResponse.admin) {
            resolvedAdmin = mapApiAdminToAdmin(adminResponse.admin);
          }
        }
      } catch {
        // Some admins cannot fetch their own profile. Fall back to the JWT-based session.
      }

      if (resolvedAdmin.id) {
        try {
          const permissionState = await fetchAdminPermissionState(resolvedAdmin.id, resolvedAdmin.level);
          resolvedAdmin = mergePermissionState(resolvedAdmin, permissionState);
        } catch {
          // Keep the JWT-based admin if live permission hydration fails.
        }
      }

      setCurrentAdminState(resolvedAdmin);
      persistAdmin(resolvedAdmin);

      // Surface subscription warning - non-blocking, user still gets in
      if ((response as any).requiresSubscription) {
        return { warning: 'Your church subscription is inactive. Some features may be limited.' };
      }

      return {};
    } catch (err: any) {
      console.error('Sign in error:', err);
      const message = err?.body?.message || err?.message || 'An unexpected error occurred';
      return {
        error: message,
        needsEmailVerification: isEmailVerificationRequiredMessage(message),
      };
    }
  };

  const signOut = async (options?: { confirmed?: boolean }) => {
    const isConfirmed =
      options?.confirmed === true ||
      typeof window === 'undefined' ||
      window.confirm('Are you sure you want to log out of Churchset?');

    if (!isConfirmed) {
      return false;
    }

    await logoutApi();
    clearSessionState();
    return true;
  };

  const setCurrentAdmin = (admin: Admin) => {
    setCurrentAdminState(admin);
    persistAdmin(admin);
  };

  const refreshAdmin = async () => {
    if (!currentAdmin) return;

    let updatedAdmin: Admin | null = null;

    try {
      if (currentAdmin.id) {
        const adminResponse = await fetchAdmin(currentAdmin.id);
        if (adminResponse && adminResponse.admin) {
          updatedAdmin = mapApiAdminToAdmin(adminResponse.admin);
        }
      }
    } catch (err) {
      console.error('Failed to refresh admin:', err);
    }

    if (updatedAdmin && updatedAdmin.id) {
      try {
        const permissionState = await fetchAdminPermissionState(updatedAdmin.id, updatedAdmin.level);
        updatedAdmin = mergePermissionState(updatedAdmin, permissionState);
      } catch (err) {
        console.error('Failed to refresh admin permissions:', err);
      }
    }

    if (updatedAdmin) {
      setCurrentAdminState(updatedAdmin);
      persistAdmin(updatedAdmin);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentAdmin,
        accessToken,
        isLoading,
        isHeadQuarter,
        signIn,
        signOut,
        setCurrentAdmin,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




