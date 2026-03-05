import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Admin } from '../types';
import { loginApi, logoutApi, fetchAdmins, refreshAccessToken } from '../api';
import { getAccessToken, setAccessToken, setTenantId, decodeJwtClaims } from '../apiClient';

interface AuthContextType {
  currentAdmin: Admin | null;
  accessToken: string | null;
  isLoading: boolean;
  /** True when the church signed up with the multi-branch option (derived from JWT) */
  isHeadQuarter: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; warning?: string }>;
  signOut: () => Promise<void>;
  /** Called after onboarding to set the current admin without going through login page */
  setCurrentAdmin: (admin: Admin) => void;
  /** Refresh current admin data from the server */
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// sessionStorage key — cleared automatically when the browser tab/window closes
const ADMIN_CACHE_KEY = 'churchset_current_admin';
const TENANT_META_NAME_KEY = 'churchset_tenant_name';
const TENANT_META_HQ_KEY = 'churchset_is_hq';
const CHURCH_DATA_KEY = 'churchset_church_data';

/** Map API admin response to the internal Admin type */
function mapApiAdminToAdmin(apiAdmin: any): Admin {
  const id = apiAdmin.id as string;
  // Restore profile picture from localStorage (no server-side endpoint for this)
  let profilePicture: string | undefined;
  try {
    profilePicture = localStorage.getItem(`churchset_profile_pic_${id}`) ?? undefined;
  } catch { /* ignore */ }
  return {
    id,
    churchId: apiAdmin.churchId || '',
    name: apiAdmin.name,
    email: apiAdmin.email,
    phone: apiAdmin.phone,
    isSuperAdmin: apiAdmin.isSuperAdmin ?? false,
    roleId: '',
    level: apiAdmin.scopeLevel === 'member' ? 'unit' : (apiAdmin.scopeLevel || 'church'),
    status: apiAdmin.isActive === false ? 'suspended' : 'active',
    branchId: apiAdmin.branchId || undefined,
    branchIds: apiAdmin.branchId ? [apiAdmin.branchId] : [],
    departmentIds: (apiAdmin.departments || []).map((d: any) => d.id),
    unitIds: (apiAdmin.units || []).map((u: any) => u.id),
    createdAt: new Date(apiAdmin.createdAt),
    profilePicture,
  };
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
            // No valid refresh token — clear stale session and force login
            setAccessToken(null);
            setTenantId(null);
            setAccessTokenState(null);
            setCurrentAdminState(null);
            persistAdmin(null);
          }
        }
        if (token) {
          try {
            const admins = await fetchAdmins();
            if (admins && admins.length > 0) {
              const admin: Admin = mapApiAdminToAdmin(admins[0]);
              setCurrentAdminState(admin);
              persistAdmin(admin);
            }
          } catch {
            // Token unusable — wipe everything
            setAccessToken(null);
            setTenantId(null);
            setAccessTokenState(null);
            persistAdmin(null);
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

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
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

      // Always decode JWT — it is the authoritative source for isHeadQuarter
      const claims = decodeJwtClaims(response.accessToken);
      const adminBranchId = claims.branchId || undefined;

      // JWT claims take priority; fall back to response body.
      // null means "unknown" — we won't overwrite an existing sessionStorage value in that case.
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
      // Only write the HQ flag if we actually know the value — otherwise preserve
      // any existing value (e.g. set during onboarding before the 403 login response).
      try {
        if (tenantName) sessionStorage.setItem(TENANT_META_NAME_KEY, tenantName);
        if (tenantIsHq !== null) {
          sessionStorage.setItem(TENANT_META_HQ_KEY, String(tenantIsHq));
        }
      } catch { /* ignore */ }

      setCurrentAdminState(admin);
      persistAdmin(admin);

      // Surface subscription warning — non-blocking, user still gets in
      if ((response as any).requiresSubscription) {
        return { warning: 'Your church subscription is inactive. Some features may be limited.' };
      }

      return {};
    } catch (err: any) {
      console.error('Sign in error:', err);
      const message = err?.body?.message || err?.message || 'An unexpected error occurred';
      return { error: message };
    }
  };

  const signOut = async () => {
    await logoutApi();
    setAccessToken(null);          // clear from sessionStorage + memory
    setAccessTokenState(null);
    setCurrentAdminState(null);
    persistAdmin(null);
    try {
      sessionStorage.removeItem(TENANT_META_NAME_KEY);
      sessionStorage.removeItem(TENANT_META_HQ_KEY);
      sessionStorage.removeItem(CHURCH_DATA_KEY);
    } catch { /* ignore */ }
  };

  const setCurrentAdmin = (admin: Admin) => {
    setCurrentAdminState(admin);
    persistAdmin(admin);
  };

  const refreshAdmin = async () => {
    if (!currentAdmin) return;
    try {
      const admins = await fetchAdmins();
      const apiAdmin = admins.find((a: any) => a.id === currentAdmin.id || a.email === currentAdmin.email);
      if (apiAdmin) {
        const updated = mapApiAdminToAdmin(apiAdmin);
        setCurrentAdminState(updated);
        persistAdmin(updated);
      }
    } catch (err) {
      console.error('Failed to refresh admin:', err);
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