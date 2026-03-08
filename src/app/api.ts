// ─── Church Suite API Service ────────────────────────────────
// All API calls mapped to the real backend at https://testchurch.bookbank.com.ng
// Maintains backward-compatible exports so existing pages continue to work.

import { apiFetch, buildQuery, setAccessToken, setTenantId, getTenantId, getAccessToken, decodeJwtClaims, getApiBaseUrl } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  VerifyAdminRequest,
  VerifyAdminResponse,
  CreateChurchRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CreateAdminRequest,
  EditAdminRequest,
  ViewAdminsResponse,
  ApiAdmin,
  CreateBranchRequest,
  EditBranchRequest,
  ApiBranch,
  CreateDepartmentRequest,
  EditDepartmentRequest,
  ApiDepartment,
  CreateUnitsRequest,
  EditUnitRequest,
  ApiUnit,
  CreateMemberRequest,
  EditMemberRequest,
  ApiMember,
  ApiChurch,
  CreateEventRequest,
  EventAttendanceRequest,
  WorkerAttendanceRequest,
  CreateFollowUpRequest,
  EditFollowUpRequest,
  ApiFollowUp,
  CreateCollectionRequest,
  CreateWalletRequest,
  SendSmsRequest,
  CreateRoleRequest,
  EditRoleRequest,
  AssignRoleRequest,
  EditAdminPermissionRequest,
  UpdateAccountRequest,
  GrowthMetricsParams,
  CreateCustomQuestionsRequest,
  CreateCustomFormRequest,
  CreateReportRequest,
  SubscribeRequest,
} from './apiTypes';

// Re-export the core fetch so existing imports still work
export { apiFetch } from './apiClient';

// ═══════════════════════════════════════════════════════════════
// API → INTERNAL TYPE MAPPERS
// The backend returns different field names / shapes from the
// internal types used by page components.  These mappers bridge
// the gap so all consuming pages get correctly shaped data.
// ═══════════════════════════════════════════════════════════════

/** Map a raw API admin → internal Admin shape */
function mapApiAdmin(a: any): any {
  // Clamp scopeLevel to valid AdminLevel values
  const validLevels = ['church', 'branch', 'department', 'unit'];
  const level = validLevels.includes(a.scopeLevel) ? a.scopeLevel : 'church';
  return {
    id: a.id,
    churchId: a.churchId || '',
    name: a.name || '',
    email: a.email || '',
    phone: a.phone || '',
    roleId: '',
    level,
    isSuperAdmin: a.isSuperAdmin || false,
    status: a.isActive === false || a.isDeleted ? 'suspended' : 'active',
    branchId: a.branchId || a.branch?.id || null,
    departmentId: a.departments?.[0]?.id,
    unitId: a.units?.[0]?.id,
    branchIds: a.branchId ? [a.branchId] : [],
    departmentIds: a.departments?.map((d: any) => d.id) || [],
    unitIds: a.units?.map((u: any) => u.id) || [],
    createdAt: new Date(a.createdAt),
    _raw: a,
  };
}

/** Map a raw API member → internal Member shape */
function mapApiMember(m: any): any {
  return {
    id: m.id,
    churchId: m.churchId || '',
    branchId: m.branchId || '',
    departmentId: m.departments?.[0]?.id,
    unitId: m.units?.[0]?.id,
    departmentIds: m.departments?.map((d: any) => d.id) || [],
    unitIds: m.units?.map((u: any) => u.id) || [],
    fullName: m.name || '',
    gender: (m.sex || 'male').toLowerCase(),
    phone: m.phoneNo || '',
    whatsapp: m.whatappNo || '',
    email: m.email || '',
    yearJoined: m.memberSince ? parseInt(m.memberSince) || new Date().getFullYear() : new Date().getFullYear(),
    maritalStatus: (m.maritalStatus || 'single').toLowerCase(),
    address: m.address || '',
    ageRange: m.ageFrom && m.ageTo ? `${m.ageFrom}-${m.ageTo}` : undefined,
    birthdayMonth: m.birthMonth || 0,
    birthdayDay: m.birthDay || 0,
    country: m.nationality || '',
    state: m.state || '',
    roadmapMarkers: Array.isArray(m.roadmapMarkers) ? m.roadmapMarkers : [],
    createdAt: new Date(m.createdAt),
    _raw: m,
  };
}

/** Map a raw API event → internal Program shape */
function mapApiEvent(ev: any): any {
  const recurrenceToType: Record<string, string> = {
    none: 'one-time',
    weekly: 'weekly',
    monthly: 'monthly',
    annually: 'monthly',
    custom: 'custom',
  };
  const firstOcc = ev.occurrences?.[0];
  return {
    id: ev.id,
    churchId: firstOcc?.churchId || ev.churchId || ev.tenantId || '',
    branchId: firstOcc?.branchId || ev.branchId || '',
    name: ev.title || '',
    type: recurrenceToType[ev.recurrenceType] || 'one-time',
    weeklyDays: ev.byWeekday?.map((w: any) => w.weekday) || [],
    monthlyDate: firstOcc ? new Date(firstOcc.date).getDate() : undefined,
    startTime: firstOcc?.startTime || '',
    endTime: firstOcc?.endTime || '',
    customDates: ev.occurrences?.map((o: any) => (o.date || '').split('T')[0]).filter(Boolean) || [],
    departmentIds: ev.departmentIds || [],
    collectionTypes: [],
    createdBy: '',
    createdAt: new Date(ev.createdAt),
    occurrences: ev.occurrences || [],
    _raw: ev,
  };
}

/** Map a raw API follow-up → internal Newcomer shape */
function mapApiFollowUp(f: any): any {
  const parts = (f.name || '').trim().split(/\s+/);
  return {
    id: f.id,
    churchId: f.churchId || '',
    branchId: f.branchId || '',
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    phone: f.phoneNo || '',
    address: f.address || '',
    email: '',
    visitType: f.isVisitor ? 'first-timer' : 'second-timer',
    visitDate: new Date(f.createdAt),
    followUps: [],
    formResponses: {},
    createdAt: new Date(f.createdAt),
    sex: f.sex,
    maritalStatus: f.maritalStatus,
    newComersComment: f.newComersComment,
    adminComment: f.adminComment,
    birthMonth: f.birthMonth,
    birthDay: f.birthDay,
    _raw: f,
  };
}

// ═══════════════════════════════════════════════════════════════
// AUTH / SETUP
// ═══════════════════════════════════════════════════════════════

/** POST /church/create-church (multipart form-data) */
export async function createChurch(data: CreateChurchRequest) {
  const formData = new FormData();
  formData.append('churchName', data.churchName);
  formData.append('address', data.address);
  formData.append('phone', data.phone);
  if (data.email) formData.append('email', data.email);
  if (data.isHeadQuarter != null) formData.append('isHeadQuarter', String(data.isHeadQuarter));
  formData.append('name', data.name);
  formData.append('adminEmail', data.adminEmail);
  formData.append('adminPassword', data.adminPassword);
  formData.append('confirmPassword', data.confirmPassword);
  if (data.logo) formData.append('logo', data.logo);
  if (data.backgroundImage) formData.append('backgroundImage', data.backgroundImage);

  return apiFetch<any>('/church/create-church', {
    method: 'POST',
    body: formData,
    skipAuth: true,
  } as any);
}

/** POST /church/verify-admin */
export async function verifyAdmin(data: VerifyAdminRequest) {
  return apiFetch<VerifyAdminResponse>('/church/verify-admin', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  } as any);
}

/** POST /church/login */
export async function loginApi(data: LoginRequest) {
  const response = await apiFetch<LoginResponse>('/church/login', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  } as any);

  // Store the token and tenant info
  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }
  if (response.tenant?.id) {
    setTenantId(response.tenant.id);
  }

  return response;
}

/** POST /church/refresh-token */
export async function refreshAccessToken() {
  const response = await apiFetch<{ accessToken: string }>('/church/refresh-token', {
    method: 'POST',
    skipAuth: true,
  } as any);
  if (response.accessToken) {
    setAccessToken(response.accessToken);
    // Restore tenantId from JWT claims if not already in sessionStorage
    if (!getTenantId()) {
      const claims = decodeJwtClaims(response.accessToken);
      if (claims.tenantId) {
        setTenantId(claims.tenantId);
      }
    }
  }
  return response;
}

/** POST /church/resend-verification-email */
export async function resendVerificationEmail(email: string) {
  return apiFetch<{ message: string }>('/church/resend-verification-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipAuth: true,
  } as any);
}

/** GET /church/logout */
export async function logoutApi() {
  try {
    await apiFetch<any>('/church/logout', { method: 'GET' });
  } catch {
    // Ignore logout errors
  }
  setAccessToken(null);
  setTenantId(null);
}

/** PATCH /church/change-password */
export async function changePassword(data: ChangePasswordRequest) {
  return apiFetch<{ message: string }>('/church/change-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** POST /church/forgot-password */
export async function forgotPassword(data: ForgotPasswordRequest) {
  return apiFetch<{ message: string }>('/church/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  } as any);
}

/** PATCH /church/reset-password?token=... */
export async function resetPassword(data: ResetPasswordRequest, token: string) {
  return apiFetch<{ message: string }>(`/church/reset-password${buildQuery({ token })}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    skipAuth: true,
  } as any);
}

// Backward compat aliases
export const signupAdmin = createChurch;

// ═══════════════════════════════════════════════════════════════
// ADMINS
// ═══════════════════════════════════════════════════════════════

/** GET /church/view-admins */
export async function fetchAdmins(): Promise<any[]> {
  const res = await apiFetch<ViewAdminsResponse>('/church/view-admins');
  const raw = res.admins || [];
  return raw.map(mapApiAdmin);
}

/** GET /church/an-admin/:adminId */
export async function fetchAdmin(adminId: string) {
  return apiFetch<any>(`/church/an-admin/${adminId}`);
}

/** POST /church/create-admin */
export async function createAdmin(data: CreateAdminRequest) {
  return apiFetch<{ message: string }>('/church/create-admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-admin/:adminId */
export async function editAdmin(adminId: string, data: EditAdminRequest) {
  return apiFetch<any>(`/church/edit-admin/${adminId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** PATCH /church/delete-admin/:adminId (suspend / soft delete) */
export async function suspendAdmin(adminId: string) {
  return apiFetch<any>(`/church/delete-admin/${adminId}`, {
    method: 'PATCH',
  });
}

/** PATCH /church/delete-admin/:adminId (permanent delete) */
export async function deleteAdminPermanently(adminId: string) {
  return apiFetch<any>(`/church/delete-admin/${adminId}`, {
    method: 'PATCH',
  });
}

// Backward-compat aliases used by existing pages
export const saveAdmins = async (_admins: any[]) => {
  console.warn('saveAdmins: bulk save not supported by real API, use createAdmin/editAdmin instead');
  return { success: true };
};

export const createAdminUser = async (data: { email: string; name: string; admin: any }) => {
  const phone = data.admin?.phone?.trim();
  const result = await createAdmin({
    name: data.name,
    email: data.email,
    ...(phone ? { phone } : {}),
    scopeLevel: data.admin?.level || 'church',
    roleIds: data.admin?.roleId ? [data.admin.roleId] : undefined,
    branchIds: data.admin?.branchIds?.length ? data.admin.branchIds : undefined,
    departmentIds: data.admin?.departmentIds?.length ? data.admin.departmentIds : undefined,
    unitIds: data.admin?.unitIds?.length ? data.admin.unitIds : undefined,
  });
  return { admin: data.admin, tempPassword: '', authUserId: '', ...result };
};

export const resetAdminPassword = async (data: { authUserId?: string; email?: string; adminId?: string }) => {
  if (data.email) {
    return forgotPassword({ email: data.email });
  }
  return { message: 'Password reset initiated', tempPassword: '' };
};

export const deleteAdminUser = async (data: { authUserId?: string; adminId: string }) => {
  await deleteAdminPermanently(data.adminId);
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// BRANCHES
// ═══════════════════════════════════════════════════════════════

/** GET /church/get-branches */
export async function fetchBranches(): Promise<ApiBranch[]> {
  const res = await apiFetch<any>('/church/get-branches');
  return Array.isArray(res.branches) ? res.branches : Array.isArray(res) ? res : [];
}

/** POST /church/create-branch */
export async function createBranch(data: CreateBranchRequest) {
  return apiFetch<any>('/church/create-branch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-branch/:branchId */
export async function editBranch(branchId: string, data: EditBranchRequest) {
  return apiFetch<any>(`/church/edit-branch/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** DELETE /church/delete-branch/:branchId */
export async function deleteBranchApi(branchId: string) {
  return apiFetch<any>(`/church/delete-branch/${branchId}`, {
    method: 'DELETE',
  });
}

// Backward-compat aliases
export const saveBranches = async (_branches: any[]) => {
  console.warn('saveBranches: bulk save not supported by real API, use createBranch/editBranch instead');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// DEPARTMENTS
// ═══════════════════════════════════════════════════════════════

/** GET /church/get-departments */
export async function fetchDepartments(): Promise<ApiDepartment[]> {
  const res = await apiFetch<any>('/church/get-departments');
  return Array.isArray(res.departments) ? res.departments : Array.isArray(res) ? res : [];
}

/** POST /church/create-dept */
export async function createDepartment(data: CreateDepartmentRequest) {
  return apiFetch<any>('/church/create-dept', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-dept/:deptId */
export async function editDepartment(deptId: string, data: EditDepartmentRequest) {
  return apiFetch<any>(`/church/edit-dept/${deptId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** PATCH /church/suspend-dept/:deptId/branch/:branchId */
export async function suspendDepartment(deptId: string, branchId: string) {
  return apiFetch<any>(`/church/suspend-dept/${deptId}/branch/${branchId}`, {
    method: 'PATCH',
  });
}

/** DELETE /church/delete-dept/suspend-dept/:deptId/branch/:branchId */
export async function deleteDepartmentApi(deptId: string, branchId: string) {
  return apiFetch<any>(`/church/delete-dept/suspend-dept/${deptId}/branch/${branchId}`, {
    method: 'DELETE',
  });
}

// Backward-compat alias
export const saveDepartments = async (_departments: any[]) => {
  console.warn('saveDepartments: bulk save not supported by real API');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════════════════

/** GET /church/all-units */
export async function fetchUnits(): Promise<ApiUnit[]> {
  const res = await apiFetch<any>('/church/all-units');
  return Array.isArray(res.units) ? res.units : Array.isArray(res) ? res : [];
}

/** GET /church/a-department/:deptId/branch/:branchId (units of a department) */
export async function fetchUnitsOfDepartment(deptId: string, branchId: string) {
  return apiFetch<any>(`/church/a-department/${deptId}/branch/${branchId}`);
}

/** POST /church/create-units */
export async function createUnits(data: CreateUnitsRequest) {
  return apiFetch<any>('/church/create-units', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-unit/:unitId */
export async function editUnit(unitId: string, data: EditUnitRequest) {
  return apiFetch<any>(`/church/edit-unit/${unitId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** PATCH /church/delete-unit/:unitId */
export async function deleteUnit(unitId: string) {
  return apiFetch<any>(`/church/delete-unit/${unitId}`, {
    method: 'PATCH',
  });
}

// Backward-compat alias
export const saveUnits = async (_units: any[]) => {
  console.warn('saveUnits: bulk save not supported by real API');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// MEMBERS (Workers)
// ═══════════════════════════════════════════════════════════════

/** GET /member/all-members */
export async function fetchMembers(): Promise<any[]> {
  const res = await apiFetch<any>('/member/all-members');
  const raw = Array.isArray(res.data) ? res.data : Array.isArray(res.members) ? res.members : Array.isArray(res) ? res : [];
  return raw.map(mapApiMember);
}

/** GET /member/a-member/:memberId */
export async function fetchMember(memberId: string) {
  return apiFetch<any>(`/member/a-member/${memberId}`);
}

/** POST /member/add-member?churchId=...&branchId=... */
export async function createMember(data: CreateMemberRequest, churchId?: string, branchId?: string) {
  return apiFetch<any>(`/member/add-member${buildQuery({ churchId, branchId })}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /member/edit-member/:memberId/branch/:branchId */
export async function editMember(memberId: string, branchId: string, data: EditMemberRequest) {
  return apiFetch<any>(`/member/edit-member/${memberId}/branch/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** PATCH /member/suspend-member/:memberId/branch/:branchId */
export async function suspendMember(memberId: string, branchId: string) {
  return apiFetch<any>(`/member/suspend-member/${memberId}/branch/${branchId}`, {
    method: 'PATCH',
  });
}

// Backward-compat aliases
export const saveMembers = async (_members: any[]) => {
  console.warn('saveMembers: bulk save not supported by real API');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// CHURCH
// ═══════════════════════════════════════════════════════════════

/** GET /church/get-church */
export async function fetchChurchConfig(_churchId?: string): Promise<any> {
  try {
    const res = await apiFetch<any>('/church/get-church');
    // API returns { message, data: { ...church, branch: [...] } }
    return res.data || res.church || res || null;
  } catch {
    return null;
  }
}

/** PATCH /church/edit-church (multipart form-data) */
export async function saveChurchConfig(config: any) {
  const formData = new FormData();
  // Text fields
  const name = config.churchName || config.name;
  if (name) formData.append('churchName', name);
  if (config.address) formData.append('address', config.address);
  if (config.phone) formData.append('phone', config.phone);
  if (config.email) formData.append('email', config.email);
  // File uploads
  if (config.logo instanceof File) formData.append('logo', config.logo);
  if (config.backgroundImage instanceof File) formData.append('backgroundImage', config.backgroundImage);

  return apiFetch<any>('/church/edit-church', {
    method: 'PATCH',
    body: formData,
  });
}

/**
 * Upload a church logo via XHR so upload progress can be tracked.
 * Resolves with the Cloudinary URL returned by the server, or undefined.
 */
export function uploadLogoWithProgress(
  file: File,
  onProgress: (pct: number) => void
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('logo', file);

    const xhr = new XMLHttpRequest();
    xhr.open('PATCH', `${getApiBaseUrl()}/church/edit-church`);
    xhr.timeout = 120_000; // 2 minutes — enough for large images on slow connections

    const token = getAccessToken();
    const tenantId = getTenantId();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (tenantId) xhr.setRequestHeader('x-tenant-id', tenantId);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res?.church?.logo ?? res?.logo ?? undefined);
        } catch { resolve(undefined); }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject({ body: { message: body?.error?.message || body?.message || `Upload failed (${xhr.status})` } });
        } catch {
          reject({ body: { message: `Upload failed (${xhr.status})` } });
        }
      }
    };

    xhr.onerror = () => reject({ body: { message: 'Network error. Please check your connection.' } });
    xhr.ontimeout = () => reject({ body: { message: 'Upload timed out. Please try again.' } });

    xhr.send(formData);
  });
}

// ═══════════════════════════════════════════════════════════════
// EVENTS / PROGRAMS
// ═══════════════════════════════════════════════════════════════

/** POST /church/create-event */
export async function createEvent(data: CreateEventRequest) {
  return apiFetch<any>('/church/create-event', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** GET /church/get-events?branchId=... */
export async function fetchPrograms(branchId?: string): Promise<any[]> {
  try {
    const res = await apiFetch<any>(`/church/get-events${buildQuery({ branchId })}`);
    const raw = Array.isArray(res.events) ? res.events : Array.isArray(res) ? res : [];
    return raw.map(mapApiEvent);
  } catch {
    // API may require branchId — return empty if not provided
    return [];
  }
}

/** GET /church/get-event/:eventOccurrenceId */
export async function fetchEventOccurrence(occurrenceId: string) {
  return apiFetch<any>(`/church/get-event/${occurrenceId}`);
}

/** POST /church/create-attendance/:eventOccurrenceId */
export async function createEventAttendance(occurrenceId: string, data: EventAttendanceRequest) {
  return apiFetch<any>(`/church/create-attendance/${occurrenceId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** POST /church/worker-attendance/occurance/:occurrenceId/department/:deptId */
export async function recordWorkerAttendance(occurrenceId: string, deptId: string, records: WorkerAttendanceRequest[]) {
  return apiFetch<any>(`/church/worker-attendance/occurance/${occurrenceId}/department/${deptId}`, {
    method: 'POST',
    body: JSON.stringify(records),
  });
}

/** POST /church/event-collections/:eventOccurrenceId */
export async function addEventCollectionFund(occurrenceId: string, updates: { id: string; amount: number }[]) {
  return apiFetch<any>(`/church/event-collections/${occurrenceId}`, {
    method: 'POST',
    body: JSON.stringify({ updates }),
  });
}

/** PATCH /church/edit-an-event/:eventOccurrenceId/branch/:branchId */
export async function editEventOccurrence(occurrenceId: string, branchId: string, data: any) {
  return apiFetch<any>(`/church/edit-an-event/${occurrenceId}/branch/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** GET /members/members-event/:eventOccurrenceId */
export async function fetchMembersForEvent(occurrenceId: string, branchId?: string, departmentId?: string) {
  return apiFetch<any>(`/members/members-event/${occurrenceId}${buildQuery({ branchId, departmentId })}`);
}

/** PATCH /church/soft-delete-event/:eventId */
export async function softDeleteEvent(eventId: string) {
  return apiFetch<any>(`/church/soft-delete-event/${eventId}`, {
    method: 'PATCH',
  });
}

// Backward-compat aliases for Programs
export const savePrograms = async (_programs: any[]) => {
  console.warn('savePrograms: bulk save not supported by real API');
  return { success: true };
};

export const fetchProgramInstances = async () => {
  return [];
};

export const saveProgramInstances = async (_instances: any[]) => {
  console.warn('saveProgramInstances: not supported - use createEventAttendance');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/** POST /member/add-follow-up?churchId=...&branchId=... */
export async function createFollowUp(data: CreateFollowUpRequest, churchId?: string, branchId?: string) {
  return apiFetch<any>(`/member/add-follow-up${buildQuery({ churchId, branchId })}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** GET /member/get-follow-up?branchId=... */
export async function fetchNewcomers(branchId?: string): Promise<any[]> {
  try {
    const res = await apiFetch<any>(`/member/get-follow-up${buildQuery({ branchId })}`);
    const raw = Array.isArray(res.results) ? res.results : Array.isArray(res.followUps) ? res.followUps : Array.isArray(res.followUp) ? res.followUp : Array.isArray(res) ? res : [];
    return raw.map(mapApiFollowUp);
  } catch {
    // API requires branchId — return empty if not provided
    return [];
  }
}

/** PATCH /member/edit-follow-up/:followUpId?branchId=... */
export async function editFollowUp(followUpId: string, data: EditFollowUpRequest, branchId?: string) {
  return apiFetch<any>(`/member/edit-follow-up/${followUpId}${buildQuery({ branchId })}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** POST /follow/custom-questions?branchId=... */
export async function createCustomQuestions(data: CreateCustomQuestionsRequest, branchId?: string) {
  return apiFetch<any>(`/follow/custom-questions${buildQuery({ branchId })}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /follow/edit-question/:questionId?branchId=... */
export async function editCustomQuestion(questionId: string, data: any, branchId?: string) {
  return apiFetch<any>(`/follow/edit-question/${questionId}${buildQuery({ branchId })}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** POST /follow/custom-form?branchId=... */
export async function createCustomForm(data: CreateCustomFormRequest, branchId?: string) {
  return apiFetch<any>(`/follow/custom-form${buildQuery({ branchId })}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /follow/edit-form/:formId?branchId=... */
export async function editCustomForm(formId: string, data: any, branchId?: string) {
  return apiFetch<any>(`/follow/edit-form/${formId}${buildQuery({ branchId })}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** GET /follow/all-forms?branchId=... */
export async function fetchNewcomerForms(branchId?: string): Promise<any[]> {
  try {
    const res = await apiFetch<any>(`/follow/all-forms${buildQuery({ branchId })}`);
    return Array.isArray(res.forms) ? res.forms : Array.isArray(res) ? res : [];
  } catch {
    // API requires branchId or churchId — return empty if not provided
    return [];
  }
}

// Backward-compat aliases
export const saveNewcomers = async (_newcomers: any[]) => {
  console.warn('saveNewcomers: bulk save not supported by real API');
  return { success: true };
};

export const saveNewcomerForms = async (_forms: any[]) => {
  console.warn('saveNewcomerForms: bulk save not supported by real API');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// COLLECTIONS
// ═══════════════════════════════════════════════════════════════

const COLLECTION_ADMIN_CACHE_KEY = 'churchset_current_admin';
const COLLECTION_CHURCH_CACHE_KEY = 'churchset_church_data';
const PROGRAM_COLLECTIONS_KEY = 'churchset_program_collections';

function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function dedupeCollections(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter((item: any) => {
    const key = item?.id || [item?.name, item?.scopeType, item?.scopeId, item?.branchId, item?.departmentId].filter(Boolean).join(':');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchCollectionsByBranch(branchId: string, query?: Record<string, string | boolean | undefined>): Promise<any[]> {
  const res = await apiFetch<any>(`/church/get-all-collections/${branchId}${buildQuery(query || {})}`);
  return Array.isArray(res.collections) ? res.collections : Array.isArray(res) ? res : [];
}

function getCachedCollectionContext() {
  const admin = readSessionJson<any>(COLLECTION_ADMIN_CACHE_KEY) || {};
  const churchData = readSessionJson<any>(COLLECTION_CHURCH_CACHE_KEY) || {};
  const storedBranches = Array.isArray(churchData?.branches) ? churchData.branches : [];
  const branchIds = Array.from(new Set([
    admin?.branchId,
    ...(Array.isArray(admin?.branchIds) ? admin.branchIds : []),
    ...storedBranches.map((branch: any) => branch?.id),
  ].filter(Boolean)));

  return {
    adminLevel: admin?.level,
    branchIds,
    churchId: churchData?.church?.id || admin?.churchId,
    departmentId: admin?.departmentId || admin?.departmentIds?.[0],
  };
}

async function fetchCollectionCatalog(branchId?: string): Promise<any[]> {
  try {
    if (branchId) {
      return dedupeCollections(await fetchCollectionsByBranch(branchId));
    }

    const context = getCachedCollectionContext();
    if (context.branchIds.length === 0) {
      return [];
    }

    if (context.departmentId) {
      return dedupeCollections(await fetchCollectionsByBranch(context.branchIds[0], { departmentId: context.departmentId }));
    }

    if (context.adminLevel === 'branch') {
      return dedupeCollections(await fetchCollectionsByBranch(context.branchIds[0], { branch: true }));
    }

    const requests: Promise<any[]>[] = context.branchIds.map((id: string) => fetchCollectionsByBranch(id, { branch: true }));
    if (context.churchId) {
      requests.unshift(fetchCollectionsByBranch(context.branchIds[0], { churchId: context.churchId }));
    }

    const results = await Promise.all(requests);
    return dedupeCollections(results.flat());
  } catch {
    return [];
  }
}

/** GET locally stored program collections */
export async function fetchCollections(branchId?: string): Promise<any[]> {
  try {
    const churchId = getCachedCollectionContext().churchId;
    const raw = localStorage.getItem(PROGRAM_COLLECTIONS_KEY);
    const items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((item: any) => (!churchId || item?.churchId === churchId) && (!branchId || item?.branchId === branchId))
      .map((item: any) => ({
        ...item,
        date: item?.date ? new Date(item.date) : new Date(),
        createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(),
      }));
  } catch {
    return [];
  }
}

/** POST /church/create-collection?branchId=...&departmentId=... */
export async function createCollection(data: CreateCollectionRequest, branchId?: string, departmentId?: string) {
  const resolvedBranchId = branchId || data.branchId || data.branchIds?.[0];
  const resolvedDepartmentId = departmentId || data.departmentId || data.departmentIds?.[0];
  const { branchId: _branchId, departmentId: _departmentId, ...payload } = data;
  return apiFetch<any>(`/church/create-collection${buildQuery({ branchId: resolvedBranchId, departmentId: resolvedDepartmentId })}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** PATCH /church/edit-collection/:collectionId?departmentId=... */
export async function editCollection(collectionId: string, data: any, departmentId?: string) {
  return apiFetch<any>(`/church/edit-collection/${collectionId}${buildQuery({ departmentId })}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Backward-compat aliases
export const saveCollections = async (collections: any[]) => {
  try { localStorage.setItem(PROGRAM_COLLECTIONS_KEY, JSON.stringify(collections)); } catch { /* ignore */ }
  return { success: true };
};

export async function fetchCollectionTypes(): Promise<any[]> {
  try {
    const items = await fetchCollectionCatalog();
    return items.map((c: any) => ({
      id: c.id,
      churchId: c.churchId || '',
      name: c.name || '',
      scope: c.scopeType || 'church',
      scopeId: c.scopeId || c.branchId || c.departmentId || c.unitId || undefined,
      createdBy: c.createdBy || '',
      createdAt: new Date(c.createdAt || Date.now()),
    }));
  } catch {
    return [];
  }
}
export const saveCollectionTypes = async (_types: any[]) => ({ success: true });
export async function fetchStandaloneCollections(): Promise<any[]> {
  try {
    const items = await fetchCollectionCatalog();
    return items
      .filter((c: any) => c.endTime)
      .map((c: any) => ({
        id: c.id,
        churchId: c.churchId || '',
        name: c.name || '',
        description: c.description || '',
        targetAmount: c.targetAmount || 0,
        dueDate: new Date(c.endTime),
        scope: c.scopeType || 'church',
        scopeId: c.scopeId || c.branchId || c.departmentId || undefined,
        entries: [],
        createdBy: c.createdBy || '',
        createdAt: new Date(c.createdAt || Date.now()),
      }));
  } catch {
    return [];
  }
}
export const saveStandaloneCollections = async (_collections: any[]) => ({ success: true });

// ═══════════════════════════════════════════════════════════════
// WALLET & SMS
// ═══════════════════════════════════════════════════════════════

/** POST /wallet/fund-wallet/:branchId */
export async function createOrFundWallet(branchId: string, data: CreateWalletRequest) {
  return apiFetch<any>(`/wallet/fund-wallet/${branchId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** GET /wallet/my-wallet */
export async function fetchSMSWallet(): Promise<any> {
  try {
    const res = await apiFetch<any>('/wallet/my-wallet');
    // API returns { wallets: [...] } as an array — pick the first one
    const raw = Array.isArray(res.wallets) ? res.wallets[0]
      : Array.isArray(res.wallet) ? res.wallet[0]
      : res.wallet ?? res ?? null;
    if (!raw || !raw.id) return null;
    return {
      id: raw.id,
      churchId: raw.churchId ?? '',
      balance: parseFloat(raw.balance) || 0,
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    };
  } catch {
    return null;
  }
}

/** POST /wallet/send-sms */
export async function sendSms(data: SendSmsRequest) {
  return apiFetch<any>('/wallet/send-sms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Backward-compat alias
export const saveSMSWallet = async (_wallet: any) => {
  console.warn('saveSMSWallet: not supported by real API');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// ROLES & PERMISSIONS
// ═══════════════════════════════════════════════════════════════

/** GET /tenants/permission-groups */
export async function fetchPermissionGroups(): Promise<any[]> {
  try {
    const res = await apiFetch<any>('/tenants/permission-groups');
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

/** POST /tenants/create-role */
export async function createRole(data: CreateRoleRequest) {
  return apiFetch<any>('/tenants/create-role', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PATCH /tenants/edit-role/:roleId?branchId=... */
export async function editRole(roleId: string, data: EditRoleRequest, branchId?: string) {
  return apiFetch<any>(`/tenants/edit-role/${roleId}${buildQuery({ branchId })}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** DELETE /tenants/delete-role/:roleId */
export async function deleteRole(roleId: string) {
  return apiFetch<any>(`/tenants/delete-role/${roleId}`, {
    method: 'DELETE',
  });
}

/** POST /tenants/assign-role?branchId=... */
export async function assignRoleToAdmin(data: AssignRoleRequest, branchId?: string) {
  return apiFetch<any>(`/tenants/assign-role${buildQuery({ branchId })}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** GET /church/admin-role/:adminId */
export async function fetchAdminRole(adminId: string) {
  return apiFetch<any>(`/church/admin-role/${adminId}`);
}

/** PATCH /tenants/edit-admin-permission/:adminId */
export async function editAdminPermission(adminId: string, data: EditAdminPermissionRequest) {
  return apiFetch<any>(`/tenants/edit-admin-permission/${adminId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// fetchRoles — GET /tenants/all-roles?branchId=...
export async function fetchRoles(branchId?: string): Promise<any[]> {
  if (!branchId) return [];
  try {
    const res = await apiFetch<any>(`/tenants/all-roles${buildQuery({ branchId })}`);
    const list = Array.isArray(res.data) ? res.data : Array.isArray(res.roles) ? res.roles : [];
    return list.map((r: any) => ({
      id: r.id,
      churchId: r.churchId || '',
      branchId: r.branchId,
      name: r.name,
      description: r.description || '',
      level: (
        r.scopeLevel === 'church' ? 'church'
        : r.scopeLevel === 'branch' ? 'branch'
        : 'department'
      ) as any,
      permissions: Array.isArray(r.permissions)
        ? r.permissions.map((p: any) => (typeof p === 'string' ? p : p.id))
        : [],
      createdAt: new Date(r.createdAt),
    }));
  } catch {
    return [];
  }
}

export const saveRoles = async (_roles: any[]) => {
  console.warn('saveRoles: bulk save not supported, use createRole/editRole');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

/** GET /member/get-dashboard?scope=all&startDate=...&endDate=... */
export async function fetchDashboard(params?: {
  scope?: string;
  startDate?: string;
  endDate?: string;
  compareStartDate?: string;
  compareEndDate?: string;
}) {
  return apiFetch<any>(`/member/get-dashboard${buildQuery(params || {})}`);
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT / FINANCE
// ═══════════════════════════════════════════════════════════════

/** POST /wallet/update-account?branchId=...&departmentId=... */
export async function updateAccount(data: UpdateAccountRequest, branchId?: string, departmentId?: string) {
  return apiFetch<any>(`/wallet/update-account${buildQuery({ branchId, departmentId })}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** GET /wallet/get-account-record?branchId=... */
export async function fetchAccountRecords(branchId?: string) {
  return apiFetch<any>(`/wallet/get-account-record${buildQuery({ branchId })}`);
}

// Backward-compat aliases for finance
export const fetchLedgerEntries = async () => {
  try {
    const res = await fetchAccountRecords();
    // API returns { result: { results: [...], pagination: {...} } }
    const results = res?.result?.results;
    const raw = Array.isArray(results) ? results : Array.isArray(res.records) ? res.records : Array.isArray(res) ? res : [];
    // Map API account records → internal LedgerEntry shape
    return raw.map((r: any) => {
      const credit = parseFloat(r.credit) || 0;
      const debit = parseFloat(r.debit) || 0;
      return {
        id: r.id || `le-${Math.random().toString(36).slice(2)}`,
        churchId: r.churchId || r.tenantId || '',
        branchId: r.branchId,
        type: credit > 0 ? 'income' : 'expense',
        amount: credit > 0 ? credit : debit,
        description: r.description || '',
        date: new Date(r.createdAt || r.date),
        createdBy: r.creator?.name || r.createdBy || '',
        createdAt: new Date(r.createdAt),
        _raw: r,
      };
    });
  } catch {
    return [];
  }
};

export const saveLedgerEntries = async (_entries: any[]) => {
  console.warn('saveLedgerEntries: use updateAccount instead');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// IMPORT / EXPORT
// ═══════════════════════════════════════════════════════════════

/** GET /member/export */
export async function exportMembersToExcel() {
  return apiFetch<Blob>('/member/export');
}

/** POST /member/import?branchId=... (multipart) */
export async function importMembers(file: File, branchId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<any>(`/member/import${buildQuery({ branchId })}`, {
    method: 'POST',
    body: formData,
  });
}

/** GET /member/import-template/:branchId */
export async function fetchMemberImportTemplate(branchId: string) {
  return apiFetch<Blob>(`/member/import-template/${branchId}`);
}

/** GET /member/export-followup?branchId=... */
export async function exportFollowUpToExcel(branchId?: string) {
  return apiFetch<Blob>(`/member/export-followup${buildQuery({ branchId })}`);
}

/** GET /member/import-followup-template/:branchId */
export async function fetchFollowUpImportTemplate(branchId: string) {
  return apiFetch<Blob>(`/member/import-followup-template/${branchId}`);
}

/** POST /member/import-followup?branchId=... */
export async function importFollowUp(file: File, branchId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<any>(`/member/import-followup${buildQuery({ branchId })}`, {
    method: 'POST',
    body: formData,
  });
}

// ═══════════════════════════════════════════════════════════════
// NON-WORKER MEMBERS
// ═══════════════════════════════════════════════════════════════

/** POST /member/non-worker?churchId=...&branchId=... */
export async function createNonWorkerMember(data: any, churchId?: string, branchId?: string) {
  return apiFetch<any>(`/member/non-worker${buildQuery({ churchId, branchId })}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** POST /member/all-church-member?branchId=... */
export async function fetchAllChurchMembers(branchId?: string) {
  const res = await apiFetch<any>(`/member/all-church-member${buildQuery({ branchId })}`, {
    method: 'POST',
  });
  const raw = Array.isArray(res.members) ? res.members : Array.isArray(res) ? res : [];
  return raw.map(mapApiMember);
}

// ═══════════════════════════════════════════════════════════════
// GROWTH / ANALYTICS
// ═══════════════════════════════════════════════════════════════

/** GET /growth/event-metrics?branchId=...&metricType=...&startDate=...&endDate=... */
export async function fetchGrowthMetrics(params: GrowthMetricsParams) {
  return apiFetch<any>(`/growth/event-metrics${buildQuery(params as any)}`);
}

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════

/** POST /tenants/write-report (multipart) */
export async function createReport(data: CreateReportRequest) {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('comments', data.comments);
  if (data.churchId) formData.append('churchId', data.churchId);
  if (data.branchId) formData.append('branchId', data.branchId);
  if (data.responseComments) formData.append('responseComments', data.responseComments);
  if (data.file) formData.append('file', data.file);

  return apiFetch<any>('/tenants/write-report', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchReports(): Promise<any[]> {
  return [];
}

export const saveReports = async (_reports: any[]) => {
  console.warn('saveReports: use createReport instead');
  return { success: true };
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/** GET /tenants/get-notifications */
export async function fetchNotifications() {
  return apiFetch<any>('/tenants/get-notifications');
}

/** PATCH /tenants/mark-read */
export async function markNotificationRead(data: { socket_id: string; channel_name: string }) {
  return apiFetch<any>('/tenants/mark-read/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION / PLANS
// ═══════════════════════════════════════════════════════════════

/** POST /plan/subscribe */
export async function subscribeToPlan(data: SubscribeRequest) {
  return apiFetch<any>('/plan/subscribe', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** GET /plan/pricing-configs */
export async function fetchPricingConfigs() {
  return apiFetch<any>('/plan/pricing-configs');
}

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPAT STUBS
// ═══════════════════════════════════════════════════════════════

export const fetchWorkforce = async () => {
  try {
    return await fetchMembers();
  } catch {
    return [];
  }
};

export const saveWorkforce = async (_workforce: any[]) => {
  console.warn('saveWorkforce: use createMember/editMember instead');
  return { success: true };
};

export const fetchTrainingPrograms = async () => [];
export const saveTrainingPrograms = async (_programs: any[]) => ({ success: true });

const NEWCOMER_CLASSES_KEY = 'churchset_newcomer_training_classes';
export const fetchNewcomerTrainingClasses = async (): Promise<any[]> => {
  try { return JSON.parse(localStorage.getItem(NEWCOMER_CLASSES_KEY) || '[]'); } catch { return []; }
};
export const saveNewcomerTrainingClasses = async (classes: any[]) => {
  try { localStorage.setItem(NEWCOMER_CLASSES_KEY, JSON.stringify(classes)); } catch { /* ignore */ }
  return { success: true };
};

const MEMBER_CLASSES_KEY = 'churchset_member_training_classes';
export const fetchMemberTrainingClasses = async (): Promise<any[]> => {
  try { return JSON.parse(localStorage.getItem(MEMBER_CLASSES_KEY) || '[]'); } catch { return []; }
};
export const saveMemberTrainingClasses = async (classes: any[]) => {
  try { localStorage.setItem(MEMBER_CLASSES_KEY, JSON.stringify(classes)); } catch { /* ignore */ }
  return { success: true };
};