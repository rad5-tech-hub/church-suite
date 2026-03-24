// All API calls mapped to the real backend at https://testchurch.bookbank.com.ng
// Maintains backward-compatible exports so existing pages continue to work.

import {
  ApiRequestError,
  apiFetch,
  buildQuery,
  setAccessToken,
  setTenantId,
  getTenantId,
  getAccessToken,
  decodeJwtClaims,
  getApiBaseUrl,
} from "./apiClient";
import {
  buildRolePermissionPayload,
  mapBackendRolePermissions,
  normalizePermissionCatalog,
  type PermissionCatalogGroup,
} from "./utils/rolePermissionMapping";
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
  CreateNonWorkerMemberRequest,
  EditMemberRequest,
  ApiMember,
  ApiChurch,
  CreateEventRequest,
  EditEventOccurrenceRequest,
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
} from "./apiTypes";
import type {
  AdminLevel,
  Report,
  ReportAttachment,
  ReportDataInsert,
  ReportReply,
  ReportRecipientEntry,
} from "./types";

// Re-export the core fetch so existing imports still work
export { apiFetch } from "./apiClient";

let permissionCatalogCache: PermissionCatalogGroup[] | null = null;
let permissionCatalogPromise: Promise<PermissionCatalogGroup[]> | null = null;

async function requestPermissionCatalog(): Promise<PermissionCatalogGroup[]> {
  const res = await apiFetch<any>("/tenants/permission-groups");
  return normalizePermissionCatalog(extractPermissionCatalogResponse(res));
}

export async function getPermissionCatalog(): Promise<
  PermissionCatalogGroup[]
> {
  if (permissionCatalogCache && permissionCatalogCache.length > 0) {
    return permissionCatalogCache;
  }

  if (!permissionCatalogPromise) {
    permissionCatalogPromise = requestPermissionCatalog()
      .then((groups) => {
        permissionCatalogCache =
          Array.isArray(groups) && groups.length > 0 ? groups : null;
        return permissionCatalogCache || [];
      })
      .catch(() => [])
      .finally(() => {
        permissionCatalogPromise = null;
      });
  }

  return permissionCatalogPromise;
}

function normalizeScopeLevel(scopeLevel?: string | null) {
  if (!scopeLevel) return undefined;
  const normalized = String(scopeLevel).trim().toLowerCase();
  return normalized === "member" ? "unit" : normalized;
}

function normalizeGranularPermissions(
  granularPermissions?: Record<string, string[]>,
) {
  return Object.fromEntries(
    Object.entries(granularPermissions || {})
      .filter(([, actions]) => Array.isArray(actions) && actions.length > 0)
      .map(([permissionId, actions]) => [
        permissionId,
        Array.from(new Set(actions.filter(Boolean))),
      ]),
  );
}

function normalizePermissionIds(permissionIds?: string[]) {
  return Array.from(new Set((permissionIds || []).filter(Boolean)));
}

function hasResolvedRolePermissions(role: any) {
  return (
    Array.isArray(role?.permissions) || Array.isArray(role?.permissionGroups)
  );
}

function extractRolesFromAdminRoleResponse(payload: any) {
  const candidates = [
    payload?.data?.roles,
    payload?.roles,
    payload?.admin?.roles,
    payload?.data?.role ? [payload.data.role] : null,
    payload?.role ? [payload.role] : null,
    payload?.admin?.role ? [payload.admin.role] : null,
  ];

  const roles = candidates.find(
    (candidate) => Array.isArray(candidate) && candidate.length > 0,
  );
  return Array.isArray(roles) ? roles : [];
}

function extractDirectAdminPermissionState(
  payload: any,
  scopeLevel: string | undefined,
  catalog: PermissionCatalogGroup[],
) {
  const candidates = [
    payload?.data,
    payload?.admin,
    payload?.data?.admin,
    payload,
  ];

  for (const candidate of candidates) {
    const permissions = Array.isArray(candidate?.permissions)
      ? candidate.permissions
      : undefined;
    const permissionGroups = Array.isArray(candidate?.permissionGroups)
      ? candidate.permissionGroups
      : undefined;

    if (!permissions && !permissionGroups) {
      continue;
    }

    return mapBackendRolePermissions({
      permissions: permissions || [],
      permissionGroups: permissionGroups || [],
      scopeLevel: normalizeScopeLevel(
        scopeLevel || candidate?.scopeLevel || candidate?.level,
      ),
      catalog,
    });
  }

  return null;
}

function mergeRolePermissionState(
  roles: any[],
  scopeLevel: string | undefined,
  catalog: PermissionCatalogGroup[],
) {
  const permissionIds = new Set<string>();
  const granularPermissions = new Map<string, Set<string>>();

  for (const role of Array.isArray(roles) ? roles : []) {
    const mapped = mapBackendRolePermissions({
      permissions: Array.isArray(role?.permissions) ? role.permissions : [],
      permissionGroups: Array.isArray(role?.permissionGroups)
        ? role.permissionGroups
        : [],
      scopeLevel: normalizeScopeLevel(scopeLevel || role?.scopeLevel),
      catalog,
    });

    mapped.permissions.forEach((permissionId) =>
      permissionIds.add(permissionId),
    );
    Object.entries(mapped.granularPermissions || {}).forEach(
      ([permissionId, actions]) => {
        if (!granularPermissions.has(permissionId)) {
          granularPermissions.set(permissionId, new Set<string>());
        }
        actions.forEach((action) =>
          granularPermissions.get(permissionId)?.add(action),
        );
      },
    );
  }

  return {
    permissions: Array.from(permissionIds),
    granularPermissions: Object.fromEntries(
      Array.from(granularPermissions.entries()).map(
        ([permissionId, actions]) => [permissionId, Array.from(actions)],
      ),
    ),
  };
}

async function enrichAdminWithAccess(
  admin: any,
  catalog: PermissionCatalogGroup[],
) {
  const existingRoles = Array.isArray(admin?.roles) ? admin.roles : [];
  let roles = existingRoles;
  let roleRes: any = null;
  const needsRoleLookup =
    roles.length === 0 ||
    roles.some((role: any) => !hasResolvedRolePermissions(role));

  if (needsRoleLookup && admin?.id) {
    try {
      roleRes = await fetchAdminRole(admin.id);
      const resolvedRoles = extractRolesFromAdminRoleResponse(roleRes);
      if (resolvedRoles.length > 0) {
        roles = resolvedRoles;
      }
    } catch {
      // Keep whatever role data we already have.
    }
  }

  const resolvedScopeLevel =
    admin?.level || admin?.scopeLevel || roles?.[0]?.scopeLevel;
  const permissionState = mergeRolePermissionState(
    roles,
    resolvedScopeLevel,
    catalog,
  );
  const directPermissionState = roleRes
    ? extractDirectAdminPermissionState(roleRes, resolvedScopeLevel, catalog)
    : null;
  const hasExplicitPermissions =
    Array.isArray(admin?.permissions) ||
    Array.isArray(admin?.customPermissions);
  const hasExplicitGranularPermissions = Object.prototype.hasOwnProperty.call(
    admin || {},
    "granularPermissions",
  );
  const explicitPermissions = Array.isArray(admin?.permissions)
    ? normalizePermissionIds(admin.permissions)
    : Array.isArray(admin?.customPermissions)
      ? normalizePermissionIds(admin.customPermissions)
      : undefined;
  const explicitGranularPermissions = normalizeGranularPermissions(
    admin?.granularPermissions,
  );
  const hasExplicitPermissionState =
    hasExplicitPermissions || hasExplicitGranularPermissions;

  return {
    ...admin,
    roleId: admin?.roleId || roles?.[0]?.id || "",
    roles,
    permissions: hasExplicitPermissions
      ? explicitPermissions || []
      : directPermissionState?.permissions || permissionState.permissions,
    granularPermissions: hasExplicitPermissionState
      ? explicitGranularPermissions
      : directPermissionState?.granularPermissions ||
        permissionState.granularPermissions,
  };
}
// The backend returns different field names / shapes from the
// internal types used by page components.  These mappers bridge
// the gap so all consuming pages get correctly shaped data.

/** Map a raw API admin to the internal Admin shape */
function mapApiAdmin(a: any): any {
  const validLevels = ["church", "branch", "department", "unit", "member"];
  const rawLevel =
    a.level || a.scopeLevel || a.roles?.[0]?.scopeLevel || a.role?.scopeLevel;
  const level = a.isSuperAdmin
    ? "church"
    : rawLevel === "member" || rawLevel === "unit"
      ? "unit"
      : validLevels.includes(rawLevel)
        ? rawLevel
        : "church";
  const branchIds =
    Array.isArray(a.branchIds) && a.branchIds.length > 0
      ? a.branchIds.filter(Boolean)
      : Array.isArray(a.branches)
        ? a.branches.map((branch: any) => branch?.id).filter(Boolean)
        : a.branchId
          ? [a.branchId]
          : [];
  const departmentIds =
    Array.isArray(a.departmentIds) && a.departmentIds.length > 0
      ? a.departmentIds.filter(Boolean)
      : a.departments?.map((d: any) => d.id) || [];
  const unitIds =
    Array.isArray(a.unitIds) && a.unitIds.length > 0
      ? a.unitIds.filter(Boolean)
      : a.units?.map((u: any) => u.id) || [];
  const customPermissions = Array.isArray(a.customPermissions)
    ? normalizePermissionIds(a.customPermissions)
    : undefined;
  const permissions = Array.isArray(a.permissions)
    ? normalizePermissionIds(a.permissions)
    : customPermissions;

  return {
    id: a.id,
    churchId: a.churchId || "",
    name: a.name || "",
    email: a.email || "",
    phone: a.phone || "",
    roleId: a.roleId || a.roles?.[0]?.id || "",
    level,
    isSuperAdmin: a.isSuperAdmin || false,
    status: a.isDeleted || a.isActive === false ? "suspended" : "active",
    branchId: a.branchId || a.branch?.id || branchIds[0] || null,
    departmentId: departmentIds[0],
    unitId: unitIds[0],
    branchIds,
    departmentIds,
    unitIds,
    permissions,
    granularPermissions: normalizeGranularPermissions(a.granularPermissions),
    customPermissions,
    createdAt: new Date(a.createdAt || Date.now()),
    _raw: a,
  };
}

/** Map a raw API member to the internal Member shape */
function mapApiMember(m: any): any {
  return {
    id: m.id || m._id || m.memberId,
    churchId: m.churchId || "",
    branchId: m.branchId || "",
    departmentId: m.departments?.[0]?.id || m.departments?.[0]?._id,
    unitId: m.units?.[0]?.id || m.units?.[0]?._id,
    departmentIds: m.departments?.map((d: any) => d.id) || [],
    unitIds: m.units?.map((u: any) => u.id) || [],
    fullName: m.name || "",
    gender: (m.sex || "male").toLowerCase(),
    phone: m.phoneNo || "",
    whatsapp: m.whatappNo || "",
    email: m.email || "",
    yearJoined: m.memberSince
      ? parseInt(m.memberSince) || new Date().getFullYear()
      : new Date().getFullYear(),
    maritalStatus: (m.maritalStatus || "single").toLowerCase(),
    address: m.address || "",
    ageRange: m.ageFrom && m.ageTo ? `${m.ageFrom}-${m.ageTo}` : undefined,
    birthdayMonth: parseInt(m.birthMonth || "0", 10) || 0,
    birthdayDay: parseInt(m.birthDay || "0", 10) || 0,
    country: m.nationality || "",
    state: m.state || "",
    LGA: m.LGA || "",
    activity: (m.activity || "active").toLowerCase(),
    comments: m.comments || "",
    isDeleted: m.isDeleted === true,
    isActive: m.isActive !== false,
    roadmapMarkers: Array.isArray(m.roadmapMarkers) ? m.roadmapMarkers : [],
    createdAt: new Date(m.createdAt || Date.now()),
    _raw: m,
  };
}

function normalizeRelativeApiPath(path?: string | null) {
  if (!path || typeof path !== "string") return null;
  const baseUrl = getApiBaseUrl();
  return path.startsWith(baseUrl) ? path.slice(baseUrl.length) : path;
}

function extractChurchMemberResults(response: any) {
  const results = Array.isArray(response?.data?.results)
    ? response.data.results
    : Array.isArray(response?.data?.members)
      ? response.data.members
      : Array.isArray(response?.members)
        ? response.members
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
  const pagination = response?.data?.pagination || response?.pagination;
  const nextPage = pagination?.hasNextPage
    ? normalizeRelativeApiPath(pagination?.nextPage)
    : null;

  return { results, nextPage };
}

function hasCursorPaginationParams(path: string | null) {
  if (!path) return false;

  try {
    const parsed = new URL(path, "https://churchset.local");
    return ["cursor", "lastId", "sortBy", "sortOrder"].some((key) =>
      parsed.searchParams.has(key),
    );
  } catch {
    return false;
  }
}

function buildChurchMemberPagePath(
  branchId?: string,
  isWorker?: boolean,
  nextPagePath?: string | null,
) {
  if (!nextPagePath) {
    const queryObj: Record<string, string | boolean | undefined> = {
      branchId,
    };
    if (isWorker !== undefined) queryObj.isWorker = isWorker;
    return `/member/all-church-member${buildQuery(queryObj)}`;
  }

  const normalizedPath = normalizeRelativeApiPath(nextPagePath) || nextPagePath;

  try {
    const parsed = new URL(normalizedPath, "https://churchset.local");
    if (branchId && !parsed.searchParams.has("branchId")) {
      parsed.searchParams.set("branchId", branchId);
    }
    if (isWorker !== undefined && !parsed.searchParams.has("isWorker")) {
      parsed.searchParams.set("isWorker", String(isWorker));
    }

    const query = parsed.searchParams.toString();
    return `${parsed.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return normalizedPath;
  }
}

async function requestChurchMemberPage(
  path: string,
  requestMethod: "GET" | "POST",
) {
  try {
    const response = await apiFetch<any>(
      path,
      requestMethod === "POST" ? { method: "POST" } : undefined,
    );
    return { response, requestMethod };
  } catch (error) {
    const shouldRetryAsPost =
      requestMethod === "GET" &&
      error instanceof ApiRequestError &&
      (error.status === 404 ||
        error.status === 405 ||
        (error.status === 400 && hasCursorPaginationParams(path)));

    if (!shouldRetryAsPost) throw error;

    const response = await apiFetch<any>(path, { method: "POST" });
    return { response, requestMethod: "POST" as const };
  }
}

async function fetchChurchMemberPages(branchId?: string, isWorker?: boolean) {
  const resolvedBranchId = resolveFallbackBranchId(branchId);
  let requestMethod: "GET" | "POST" = "GET";
  let nextPath: string | null = buildChurchMemberPagePath(
    resolvedBranchId,
    isWorker,
  );
  const visitedPaths = new Set<string>();
  const collected: any[] = [];

  while (nextPath && !visitedPaths.has(nextPath) && visitedPaths.size < 50) {
    visitedPaths.add(nextPath);

    const page = await requestChurchMemberPage(nextPath, requestMethod);
    const response = page.response;
    requestMethod = page.requestMethod;

    const { results, nextPage } = extractChurchMemberResults(response);
    collected.push(...results);
    nextPath = nextPage
      ? buildChurchMemberPagePath(resolvedBranchId, isWorker, nextPage)
      : null;
  }

  return { branchId: resolvedBranchId, records: collected };
}

/** Map a raw API event to the internal Event shape */
function mapApiEvent(ev: any): any {
  const dayNameToIndex: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const recurrenceToType: Record<string, string> = {
    none: "one-time",
    weekly: "weekly",
    monthly: "monthly",
    annually: "monthly",
    custom: "custom",
  };
  const firstOcc = ev.occurrences?.[0];
  const normalizedWeeklyDays = Array.isArray(ev.byWeekday)
    ? ev.byWeekday
        .map((item: any) => (typeof item === "number" ? item : Number(item?.weekday)))
        .filter((day: number) => Number.isFinite(day) && day >= 0 && day <= 6)
    : Array.isArray(ev.occurrences)
      ? ev.occurrences
          .map((occurrence: any) => dayNameToIndex[String(occurrence?.dayOfWeek || "").toLowerCase()])
          .filter((day: number) => Number.isFinite(day) && day >= 0 && day <= 6)
    : [];
  return {
    id: ev.id,
    churchId: firstOcc?.churchId || ev.churchId || ev.tenantId || "",
    branchId: firstOcc?.branchId || ev.branchId || "",
    name: ev.title || "",
    description: ev.description || "",
    type: recurrenceToType[ev.recurrenceType] || "one-time",
    weeklyDays: Array.from(new Set(normalizedWeeklyDays)).sort((a, b) => a - b),
    monthlyDate: firstOcc ? new Date(firstOcc.date).getDate() : undefined,
    monthlyNthWeekdays: Array.isArray(ev.nthWeekdays)
      ? ev.nthWeekdays
          .map((rule: any) => ({
            weekday: Number(rule?.weekday),
            nth: Number(rule?.nth),
            startTime: rule?.startTime || undefined,
            endTime: rule?.endTime || undefined,
          }))
          .filter(
            (rule: { weekday: number; nth: number; startTime?: string; endTime?: string }) =>
              Number.isFinite(rule.weekday) &&
              rule.weekday >= 0 &&
              rule.weekday <= 6 &&
              Number.isFinite(rule.nth) &&
              (rule.nth === -1 || rule.nth >= 1),
          )
      : [],
    startTime: firstOcc?.startTime || "",
    endTime: firstOcc?.endTime || "",
    customDates:
      ev.occurrences
        ?.map((o: any) => (o.date || "").split("T")[0])
        .filter(Boolean) || [],
    departmentIds: ev.departmentIds || [],
    collectionTypes: [],
    createdBy: "",
    createdAt: new Date(ev.createdAt),
    occurrences: ev.occurrences || [],
    _raw: ev,
  };
}

function extractProgramResults(response: any) {
  const events = Array.isArray(response?.data?.events)
    ? response.data.events
    : Array.isArray(response?.events)
      ? response.events
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
  const pagination = response?.data?.pagination || response?.pagination;
  const hasMorePages =
    pagination?.hasNextPage === true || pagination?.hasMore === true;

  let nextPage: string | null = null;
  if (hasMorePages) {
    if (pagination?.nextPage) {
      nextPage = normalizeRelativeApiPath(pagination.nextPage);
    } else if (pagination?.nextCursor) {
      nextPage = `/church/get-events?cursor=${encodeURIComponent(pagination.nextCursor)}`;
    }
  }

  return { events, nextPage };
}

type FetchProgramsParams = {
  branchId?: string;
  startDate?: string;
  endDate?: string;
};

function buildProgramsPagePath(
  params?: FetchProgramsParams,
  nextPagePath?: string | null,
) {
  const branchId = params?.branchId;
  const startDate = params?.startDate;
  const endDate = params?.endDate;

  if (!nextPagePath) {
    return `/church/get-events${buildQuery({ branchId, startDate, endDate })}`;
  }

  const normalizedPath = normalizeRelativeApiPath(nextPagePath) || nextPagePath;

  try {
    const parsed = new URL(normalizedPath, "https://churchset.local");
    if (branchId && !parsed.searchParams.has("branchId")) {
      parsed.searchParams.set("branchId", branchId);
    }
    if (startDate && !parsed.searchParams.has("startDate")) {
      parsed.searchParams.set("startDate", startDate);
    }
    if (endDate && !parsed.searchParams.has("endDate")) {
      parsed.searchParams.set("endDate", endDate);
    }

    const query = parsed.searchParams.toString();
    return `${parsed.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return normalizedPath;
  }
}

/** Map a raw API follow-up to the internal FollowUp shape */
function mapApiFollowUp(f: any): any {
  const parts = (f.name || "").trim().split(/\s+/);
  return {
    id: f.id,
    churchId: f.churchId || "",
    branchId: f.branchId || "",
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
    phone: f.phoneNo || "",
    address: f.address || "",
    email: f.email || "",
    whatsapp: f.whatappNo || "",
    visitType: f.isVisitor ? "first-timer" : "second-timer",
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
    called: f.called || false,
    messaged: f.messaged || false,
    visited: f.visited || false,
    timer: f.timer,
    eventOccurrenceId: f.eventOccurrenceId ?? null,
    formId: f.formId ?? null,
    answers: Array.isArray(f.answers)
      ? f.answers.map((answer: any) => ({
          questionId: answer?.questionId || answer?.question?.id,
          answer: answer?.answer ?? null,
        }))
      : [],
    eventAttended: f.eventAttended,
    isActive: f.isActive,
    _raw: f,
  };
}

const MEMBER_OVERRIDES_KEY = "churchset_member_overrides";
const NEWCOMER_OVERRIDES_KEY = "churchset_newcomer_overrides";
const HIDDEN_ADMIN_IDS_KEY = "churchset_hidden_admin_ids";
const HIDDEN_MEMBER_IDS_KEY = "churchset_hidden_member_ids";
const HIDDEN_NEWCOMER_IDS_KEY = "churchset_hidden_newcomer_ids";
const HIDDEN_LEDGER_IDS_KEY = "churchset_hidden_ledger_ids";
const HIDDEN_COLLECTION_TYPE_IDS_KEY = "churchset_hidden_collection_type_ids";
const HIDDEN_FUNDRAISER_IDS_KEY = "churchset_hidden_fundraiser_ids";
const WORKFORCE_ROADMAPS_KEY = "churchset_workforce_roadmaps";

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local storage write failures
  }
}

function readHiddenIdSet(key: string): Set<string> {
  return new Set(readLocalJson<string[]>(key, []).filter(Boolean));
}

function addHiddenIds(key: string, ids: string[]) {
  const next = Array.from(
    new Set([...readLocalJson<string[]>(key, []), ...ids.filter(Boolean)]),
  );
  writeLocalJson(key, next);
}

function uniqueIds(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function arraysEqualAsSets(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

function buildWorkforceEntryId(
  memberId: string,
  departmentId: string,
  unitId?: string,
) {
  return `wf-${memberId}-${departmentId}-${unitId || "none"}`;
}

function normalizeRoadmapMarkers(markers: any[]) {
  return (Array.isArray(markers) ? markers : []).map((marker: any) => ({
    ...marker,
    startDate: marker?.startDate ? new Date(marker.startDate) : undefined,
    completionDate: marker?.completionDate
      ? new Date(marker.completionDate)
      : undefined,
  }));
}

function pickMemberLocalOverride(member: any) {
  return {
    fullName: member.fullName,
    branchId: member.branchId,
    gender: member.gender,
    phone: member.phone,
    whatsapp: member.whatsapp,
    email: member.email,
    yearJoined: member.yearJoined,
    maritalStatus: member.maritalStatus,
    address: member.address,
    ageRange: member.ageRange,
    birthdayMonth: member.birthdayMonth,
    birthdayDay: member.birthdayDay,
    birthdayYear: member.birthdayYear,
    country: member.country,
    state: member.state,
    LGA: member.LGA,
    activity: member.activity,
    comments: member.comments,
    trainingClassId: member.trainingClassId,
    trainingStatus: member.trainingStatus,
  };
}

function pickNewcomerLocalOverride(newcomer: any) {
  return {
    email: newcomer.email,
    whatsapp: newcomer.whatsapp,
    visitType: newcomer.visitType,
    visitDate: newcomer.visitDate,
    programId: newcomer.programId,
    sex: newcomer.sex,
    maritalStatus: newcomer.maritalStatus,
    newComersComment: newcomer.newComersComment,
    adminComment: newcomer.adminComment,
    birthMonth: newcomer.birthMonth,
    birthDay: newcomer.birthDay,
    timer: newcomer.timer,
    isActive: newcomer.isActive,
    called: newcomer.called,
    messaged: newcomer.messaged,
    visited: newcomer.visited,
    eventOccurrenceId: newcomer.eventOccurrenceId,
    formId: newcomer.formId,
    answers: newcomer.answers,
    trainingClassId: newcomer.trainingClassId,
    trainingStatus: newcomer.trainingStatus,
    movedToMemberId: newcomer.movedToMemberId,
    followUps: newcomer.followUps,
  };
}

export async function hideMemberLocally(memberId: string) {
  addHiddenIds(HIDDEN_MEMBER_IDS_KEY, [memberId]);
  return { success: true };
}

export async function hideAdminLocally(adminId: string) {
  addHiddenIds(HIDDEN_ADMIN_IDS_KEY, [adminId]);
  return { success: true };
}

export async function hideNewcomersLocally(newcomerIds: string[]) {
  addHiddenIds(HIDDEN_NEWCOMER_IDS_KEY, newcomerIds);
  return { success: true };
}

export async function markNewcomerMovedToMember(
  newcomerId: string,
  movedToMemberId = "moved",
) {
  const overrides = readLocalJson<Record<string, any>>(
    NEWCOMER_OVERRIDES_KEY,
    {},
  );
  overrides[newcomerId] = {
    ...(overrides[newcomerId] || {}),
    movedToMemberId,
  };
  writeLocalJson(NEWCOMER_OVERRIDES_KEY, overrides);
  return { success: true };
}

export async function hideLedgerEntryLocally(entryId: string) {
  addHiddenIds(HIDDEN_LEDGER_IDS_KEY, [entryId]);
  return { success: true };
}

export async function hideCollectionTypeLocally(collectionTypeId: string) {
  addHiddenIds(HIDDEN_COLLECTION_TYPE_IDS_KEY, [collectionTypeId]);
  return { success: true };
}

export async function hideFundraiserLocally(fundraiserId: string) {
  addHiddenIds(HIDDEN_FUNDRAISER_IDS_KEY, [fundraiserId]);
  return { success: true };
}

// AUTH / SETUP

/** POST /church/create-church (multipart form-data) */
export async function createChurch(data: CreateChurchRequest) {
  const formData = new FormData();
  formData.append("churchName", data.churchName);
  formData.append("address", data.address);
  formData.append("phone", data.phone);
  if (data.email) formData.append("email", data.email);
  if (data.isHeadQuarter != null)
    formData.append("isHeadQuarter", String(data.isHeadQuarter));
  formData.append("name", data.name);
  formData.append("adminEmail", data.adminEmail);
  formData.append("adminPassword", data.adminPassword);
  formData.append("confirmPassword", data.confirmPassword);
  if (data.logo) formData.append("logo", data.logo);
  if (data.backgroundImage)
    formData.append("backgroundImage", data.backgroundImage);

  return apiFetch<any>("/church/create-church", {
    method: "POST",
    body: formData,
    skipAuth: true,
  } as any);
}

/** POST /church/verify-admin */
export async function verifyAdmin(data: VerifyAdminRequest) {
  return apiFetch<VerifyAdminResponse>("/church/verify-admin", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  } as any);
}

/** POST /church/login */
export async function loginApi(data: LoginRequest) {
  const response = await apiFetch<LoginResponse>("/church/login", {
    method: "POST",
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
  const response = await apiFetch<{ accessToken: string }>(
    "/church/refresh-token",
    {
      method: "POST",
      skipAuth: true,
    } as any,
  );
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
  return apiFetch<{ message: string }>("/church/resend-verification-email", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuth: true,
  } as any);
}

/** GET /church/logout */
export async function logoutApi() {
  try {
    await apiFetch<any>("/church/logout", { method: "GET" });
  } catch {
    // Ignore logout errors
  }
  setAccessToken(null);
  setTenantId(null);
}

/** PATCH /church/change-password */
export async function changePassword(data: ChangePasswordRequest) {
  return apiFetch<{ message: string }>("/church/change-password", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** POST /church/forgot-password */
export async function forgotPassword(data: ForgotPasswordRequest) {
  return apiFetch<{ message: string }>("/church/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  } as any);
}

/** PATCH /church/reset-password?token=... */
export async function resetPassword(data: ResetPasswordRequest, token: string) {
  return apiFetch<{ message: string }>(
    `/church/reset-password${buildQuery({ token })}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
      skipAuth: true,
    } as any,
  );
}

// Backward compat aliases
export const signupAdmin = createChurch;

// ADMINS

export function resolveFallbackBranchId(branchId?: string) {
  if (branchId) return branchId;
  const scope = getCachedAdminScope();
  if (scope.branchId) return scope.branchId;
  const churchDataStr =
    typeof window !== "undefined"
      ? sessionStorage.getItem("churchset_church_data")
      : null;
  const churchData = churchDataStr ? JSON.parse(churchDataStr) : null;
  if (churchData?.branches?.length > 0) {
    return churchData.branches[0].id;
  }
  return undefined;
}

function resolveScopedDepartmentId(departmentId?: string) {
  if (departmentId) return departmentId;
  const scope = getCachedAdminScope();
  const isDepartmentScoped =
    scope.level === "department" ||
    scope.level === "unit" ||
    !!scope.departmentId ||
    !!scope.unitId;
  return isDepartmentScoped ? scope.departmentId : undefined;
}

function getNextAdminsPagePath(response: ViewAdminsResponse): string | null {
  const nextPage = response?.pagination?.nextPage;
  if (!response?.pagination?.hasNextPage || typeof nextPage !== "string" || !nextPage) {
    return null;
  }

  const apiBaseUrl = getApiBaseUrl();
  if (nextPage.startsWith(apiBaseUrl)) {
    return nextPage.slice(apiBaseUrl.length);
  }

  if (/^https?:\/\//i.test(nextPage)) {
    try {
      const parsed = new URL(nextPage);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }

  return nextPage.startsWith("/") ? nextPage : `/${nextPage}`;
}

function buildAdminsPagePath(branchId?: string, nextPagePath?: string | null) {
  if (!nextPagePath) {
    return `/church/view-admins${buildQuery({ branchId })}`;
  }

  const normalizedPath = normalizeRelativeApiPath(nextPagePath) || nextPagePath;

  try {
    const parsed = new URL(normalizedPath, "https://churchset.local");
    parsed.searchParams.delete("cursor");
    parsed.searchParams.delete("lastId");
    parsed.searchParams.delete("sortBy");
    parsed.searchParams.delete("sortOrder");
    if (branchId && !parsed.searchParams.has("branchId")) {
      parsed.searchParams.set("branchId", branchId);
    }

    const query = parsed.searchParams.toString();
    return `${parsed.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return normalizedPath;
  }
}

/** GET /church/view-admins */
export async function fetchAdmins(branchId?: string): Promise<any[]> {
  const resolved = resolveFallbackBranchId(branchId);
  const raw: ApiAdmin[] = [];
  const seenPaths = new Set<string>();
  let nextPath: string | null = buildAdminsPagePath(resolved);

  while (nextPath && !seenPaths.has(nextPath) && seenPaths.size < 50) {
    seenPaths.add(nextPath);

    const response = await apiFetch<ViewAdminsResponse>(nextPath);
    raw.push(...(response.admins || []));
    nextPath = buildAdminsPagePath(resolved, getNextAdminsPagePath(response));
  }

  const deduped = Array.from(
    new Map(raw.map((admin) => [admin.id, admin])).values(),
  );
  const catalog = deduped.length > 0 ? await getPermissionCatalog() : [];
  const enriched = await Promise.all(
    deduped.map((admin: any) => enrichAdminWithAccess(admin, catalog)),
  );
  return enriched.map(mapApiAdmin);
}

/** GET /tenants/report-recipients */
export async function fetchReportRecipients(
  churchId?: string,
): Promise<Array<{ id: string; name: string }>> {
  const response = await apiFetch<any>(
    `/tenants/report-recipients${buildQuery({ churchId })}`,
  );
  const admins = Array.isArray(response?.admins) ? response.admins : [];

  return admins
    .map((admin: any) => ({
      id: admin?.id || "",
      name: admin?.name || "Unknown",
    }))
    .filter((admin) => Boolean(admin.id));
}

/** GET /church/an-admin/:adminId */
export async function fetchAdmin(adminId: string) {
  return apiFetch<any>(`/church/an-admin/${adminId}`);
}

/** POST /church/create-admin */
export async function createAdmin(data: CreateAdminRequest) {
  return apiFetch<{ message: string }>("/church/create-admin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-admin/:adminId */
export async function editAdmin(adminId: string, data: EditAdminRequest) {
  return apiFetch<any>(`/church/edit-admin/${adminId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** PATCH /church/suspend-admin/:adminId (suspend / soft delete) */
export async function suspendAdmin(adminId: string) {
  return apiFetch<any>(`/church/suspend-admin/${adminId}`, {
    method: "PATCH",
  });
}

/** PATCH /church/delete-admin/:adminId (permanent delete) */
export async function deleteAdminPermanently(adminId: string) {
  return apiFetch<any>(`/church/delete-admin/${adminId}`, {
    method: "PATCH",
  });
}

// Backward-compat aliases used by existing pages
export const saveAdmins = async (_admins: any[]) => {
  console.warn(
    "saveAdmins: bulk save not supported by real API, use createAdmin/editAdmin instead",
  );
  return { success: true };
};

export const createAdminUser = async (data: {
  email: string;
  name: string;
  admin: any;
}) => {
  const phone = data.admin?.phone?.trim();
  const result = await createAdmin({
    name: data.name,
    email: data.email,
    ...(phone ? { phone } : {}),
    scopeLevel: data.admin?.level || "church",
    roleIds: data.admin?.roleId ? [data.admin.roleId] : undefined,
    branchIds: data.admin?.branchIds?.length ? data.admin.branchIds : undefined,
    departmentIds: data.admin?.departmentIds?.length
      ? data.admin.departmentIds
      : undefined,
    unitIds: data.admin?.unitIds?.length ? data.admin.unitIds : undefined,
  });
  return { admin: data.admin, tempPassword: "", authUserId: "", ...result };
};

export const resetAdminPassword = async (data: {
  authUserId?: string;
  email?: string;
  adminId?: string;
}) => {
  if (data.email) {
    return forgotPassword({ email: data.email });
  }
  return { message: "Password reset initiated", tempPassword: "" };
};

export const deleteAdminUser = async (data: {
  authUserId?: string;
  adminId: string;
}) => {
  await deleteAdminPermanently(data.adminId);
  return { success: true };
};

// BRANCHES

/** GET /church/get-branches */
export async function fetchBranches(): Promise<ApiBranch[]> {
  const res = await apiFetch<any>("/church/get-branches");
  return Array.isArray(res.branches)
    ? res.branches
    : Array.isArray(res)
      ? res
      : [];
}

/** POST /church/create-branch */
export async function createBranch(data: CreateBranchRequest) {
  return apiFetch<any>("/church/create-branch", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-branch/:branchId */
export async function editBranch(branchId: string, data: EditBranchRequest) {
  return apiFetch<any>(`/church/edit-branch/${branchId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** DELETE /church/delete-branch/:branchId */
export async function deleteBranchApi(branchId: string) {
  return apiFetch<any>(`/church/delete-branch/${branchId}`, {
    method: "DELETE",
  });
}

// Backward-compat aliases
export const saveBranches = async (_branches: any[]) => {
  console.warn(
    "saveBranches: bulk save not supported by real API, use createBranch/editBranch instead",
  );
  return { success: true };
};

// DEPARTMENTS

/** GET /church/get-departments */
export async function fetchDepartments(
  branchId?: string,
): Promise<ApiDepartment[]> {
  const res = await apiFetch<any>(
    `/church/get-departments${buildQuery({ branchId: resolveDepartmentBranchId(branchId) })}`,
  );
  return Array.isArray(res.departments)
    ? res.departments
    : Array.isArray(res)
      ? res
      : [];
}

/** POST /church/create-dept */
export async function createDepartment(data: CreateDepartmentRequest) {
  return apiFetch<any>("/church/create-dept", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-dept/:deptId */
export async function editDepartment(
  deptId: string,
  data: EditDepartmentRequest,
) {
  return apiFetch<any>(`/church/edit-dept/${deptId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** PATCH /church/suspend-dept/:deptId/branch/:branchId */
export async function suspendDepartment(deptId: string, branchId: string) {
  return apiFetch<any>(`/church/suspend-dept/${deptId}/branch/${branchId}`, {
    method: "PATCH",
  });
}

/** DELETE /church/delete-dept/:deptId/branch/:branchId */
export async function deleteDepartmentApi(deptId: string, branchId: string) {
  return apiFetch<any>(`/church/delete-dept/${deptId}/branch/${branchId}`, {
    method: "DELETE",
  });
}

// Backward-compat alias
export const saveDepartments = async (_departments: any[]) => {
  console.warn("saveDepartments: bulk save not supported by real API");
  return { success: true };
};

// UNITS

/** GET /church/all-units */
export async function fetchUnits(
  branchId?: string,
  departmentId?: string,
): Promise<ApiUnit[]> {
  const resolvedBranchId = resolveFallbackBranchId(branchId);
  const resolvedDepartmentId = resolveScopedDepartmentId(departmentId);
  const q = buildQuery({
    branchId: resolvedBranchId,
    departmentId: resolvedDepartmentId,
  });
  const res = await apiFetch<any>(`/church/all-units${q}`);
  const units = Array.isArray(res.units)
    ? res.units
    : Array.isArray(res)
      ? res
      : [];
  return units.filter(
    (unit: ApiUnit) => unit?.isDeleted !== true && unit?.isActive !== false,
  );
}

/** GET /church/a-department/:deptId/branch/:branchId (units of a department) */
export async function fetchUnitsOfDepartment(deptId: string, branchId: string) {
  return apiFetch<any>(`/church/a-department/${deptId}/branch/${branchId}`);
}

/** POST /church/create-units */
export async function createUnits(data: CreateUnitsRequest) {
  return apiFetch<any>("/church/create-units", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /church/edit-unit/:unitId */
export async function editUnit(unitId: string, data: EditUnitRequest) {
  return apiFetch<any>(`/church/edit-unit/${unitId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** PATCH /church/soft-delete-unit/:unitId/branch/:branchId */
export async function softDeleteUnit(unitId: string, branchId: string) {
  return apiFetch<any>(
    `/church/soft-delete-unit/${unitId}/branch/${branchId}`,
    {
      method: "PATCH",
    },
  );
}

/** DELETE /church/delete-unit/:unitId/branch/:branchId?departmentId=... */
export async function deleteUnit(
  unitId: string,
  branchId: string,
  departmentId?: string,
) {
  return apiFetch<any>(
    `/church/delete-unit/${unitId}/branch/${branchId}${buildQuery({ departmentId: resolveScopedDepartmentId(departmentId) })}`,
    {
      method: "DELETE",
    },
  );
}

// Backward-compat alias
export const saveUnits = async (_units: any[]) => {
  console.warn("saveUnits: bulk save not supported by real API");
  return { success: true };
};

// MEMBERS (Workers)

/** /member/all-church-member?branchId=... */
export async function fetchMembers(
  branchId?: string,
  departmentId?: string,
  isWorker?: boolean,
): Promise<any[]> {
  const { branchId: resolvedBranchId, records } = await fetchChurchMemberPages(
    branchId,
    isWorker,
  );
  const resolvedDepartmentId = resolveScopedDepartmentId(departmentId);
  const canFilterByDepartment = records.some(
    (member: any) =>
      member?.departmentId ||
      (Array.isArray(member?.departmentIds) &&
        member.departmentIds.length > 0) ||
      (Array.isArray(member?.departments) && member.departments.length > 0),
  );
  const hiddenIds = readHiddenIdSet(HIDDEN_MEMBER_IDS_KEY);
  const overrides = readLocalJson<Record<string, any>>(
    MEMBER_OVERRIDES_KEY,
    {},
  );
  const seenIds = new Set<string>();

  return records
    .filter(
      (member: any) =>
        member?.isDeleted !== true &&
        member?.isActive !== false &&
        !hiddenIds.has(member.id) &&
        !hiddenIds.has(member._id),
    )
    .map(mapApiMember)
    .map((member: any) => ({
      ...member,
      branchId: member.branchId || resolvedBranchId || "",
    }))
    .filter(
      (member: any) =>
        !resolvedDepartmentId ||
        !canFilterByDepartment ||
        member.departmentId === resolvedDepartmentId ||
        member.departmentIds?.includes(resolvedDepartmentId),
    )
    .filter((member: any) => {
      if (!member?.id || seenIds.has(member.id)) return false;
      seenIds.add(member.id);
      return true;
    })
    .map((member: any) => ({
      ...member,
      ...(overrides[member.id] || {}),
    }))
    .filter(
      (member: any) =>
        member?.isDeleted !== true && member?.isActive !== false,
    );
}

/** GET /member/a-member/:memberId */
export async function fetchMember(memberId: string) {
  const res = await apiFetch<any>(`/member/a-member/${memberId}`);
  const raw = res.data?.member || res.data || res.member || res;
  const mappedMember = mapApiMember(raw);
  const overrides = readLocalJson<Record<string, any>>(MEMBER_OVERRIDES_KEY, {});
  return {
    ...mappedMember,
    ...(overrides[mappedMember.id || memberId] || {}),
  };
}

/** POST /member/non-worker?churchId=...&branchId=... */
export async function createMember(
  data: CreateNonWorkerMemberRequest,
  churchId?: string,
  branchId?: string,
) {
  return apiFetch<any>(
    `/member/non-worker${buildQuery({ churchId, branchId })}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/** POST /member/add-member?churchId=... */
export async function createWorkforceMember(
  data: CreateMemberRequest,
  churchId?: string,
) {
  return apiFetch<any>(`/member/add-member${buildQuery({ churchId })}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /member/edit-member/:memberId/branch/:branchId?departmentId=... */
export async function editMember(
  memberId: string,
  branchId: string,
  data: EditMemberRequest,
  departmentId?: string,
) {
  return apiFetch<any>(
    `/member/edit-member/${memberId}/branch/${branchId}${buildQuery({ departmentId: resolveScopedDepartmentId(departmentId) })}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

/** PATCH /member/move-member/:memberId/branch/:branchId */
export async function moveMember(memberId: string, branchId: string) {
  return apiFetch<any>(`/member/move-member/${memberId}/branch/${branchId}`, {
    method: "PATCH",
  });
}

/** PATCH /member/suspend-member/:memberId/branch/:branchId */
export async function suspendMember(memberId: string, branchId: string) {
  const response = await apiFetch<any>(
    `/member/suspend-member/${memberId}/branch/${branchId}`,
    {
      method: "PATCH",
    },
  );

  const msg = response?.message || response?.data?.message || "";
  if (
    msg === "Member soft-deleted successfully" ||
    msg.includes("deleted") ||
    response?.success
  ) {
    addHiddenIds(HIDDEN_MEMBER_IDS_KEY, [memberId]);
    return response;
  }

  // If the API didn't fail but gave us an unexpected message, throw an error
  if (!response || response.error || response.status === "error") {
    throw new Error(
      msg || response?.error || "Failed to remove member",
    );
  }

  addHiddenIds(HIDDEN_MEMBER_IDS_KEY, [memberId]);
  return response;
}

// Backward-compat aliases
export const saveMembers = async (members: any[]) => {
  const existing = readLocalJson<Record<string, any>>(MEMBER_OVERRIDES_KEY, {});
  const next = { ...existing };
  for (const member of Array.isArray(members) ? members : []) {
    if (!member?.id) continue;
    next[member.id] = {
      ...(existing[member.id] || {}),
      ...pickMemberLocalOverride(member),
    };
  }
  writeLocalJson(MEMBER_OVERRIDES_KEY, next);
  return { success: true };
};

// CHURCH

/** GET /church/get-church */
export async function fetchChurchConfig(_churchId?: string): Promise<any> {
  try {
    const res = await apiFetch<any>("/church/get-church");
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
  if (name) formData.append("churchName", name);
  if (config.address) formData.append("address", config.address);
  if (config.phone) formData.append("phone", config.phone);
  if (config.email) formData.append("email", config.email);
  // File uploads
  if (config.logo instanceof File) formData.append("logo", config.logo);
  if (config.backgroundImage instanceof File)
    formData.append("backgroundImage", config.backgroundImage);

  return apiFetch<any>("/church/edit-church", {
    method: "PATCH",
    body: formData,
  });
}

/**
 * Upload a church logo via XHR so upload progress can be tracked.
 * Resolves with the Cloudinary URL returned by the server, or undefined.
 */
export function uploadLogoWithProgress(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("logo", file);

    const xhr = new XMLHttpRequest();
    xhr.open("PATCH", `${getApiBaseUrl()}/church/edit-church`);
    xhr.timeout = 120_000; // 2 minutes for large uploads

    const token = getAccessToken();
    const tenantId = getTenantId();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    if (tenantId) xhr.setRequestHeader("x-tenant-id", tenantId);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res?.church?.logo ?? res?.logo ?? undefined);
        } catch {
          resolve(undefined);
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject({
            body: {
              message:
                body?.error?.message ||
                body?.message ||
                `Upload failed (${xhr.status})`,
            },
          });
        } catch {
          reject({ body: { message: `Upload failed (${xhr.status})` } });
        }
      }
    };

    xhr.onerror = () =>
      reject({
        body: { message: "Network error. Please check your connection." },
      });
    xhr.ontimeout = () =>
      reject({ body: { message: "Upload timed out. Please try again." } });

    xhr.send(formData);
  });
}

// EVENTS / PROGRAMS

/** POST /church/create-event */
export async function createEvent(data: CreateEventRequest) {
  return apiFetch<any>("/church/create-event", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** GET /church/get-events?branchId=...&startDate=...&endDate=... */
export async function fetchPrograms(params?: string | FetchProgramsParams): Promise<any[]> {
  const resolvedParams: FetchProgramsParams =
    typeof params === "string"
      ? { branchId: resolveFallbackBranchId(params) }
      : {
          ...params,
          branchId: resolveFallbackBranchId(params?.branchId),
        };
  const raw: any[] = [];
  const seenPaths = new Set<string>();
  let nextPath: string | null = buildProgramsPagePath(resolvedParams);

  try {
    while (nextPath && !seenPaths.has(nextPath) && seenPaths.size < 50) {
      seenPaths.add(nextPath);
      const res = await apiFetch<any>(nextPath);
      const { events, nextPage } = extractProgramResults(res);
      raw.push(...events);
      nextPath = nextPage
        ? buildProgramsPagePath(resolvedParams, nextPage)
        : null;
    }

    return raw.map(mapApiEvent);
  } catch {
    // API may require branchId; include it when available
    return [];
  }
}

/** GET /church/get-event/:eventOccurrenceId */
export async function fetchEventOccurrence(occurrenceId: string) {
  const response = await apiFetch<any>(`/church/get-event/${occurrenceId}`);
  return (
    response?.eventOccurrence || response?.data?.eventOccurrence || response
  );
}

/** POST /church/create-attendance/:eventOccurrenceId */
export async function createEventAttendance(
  occurrenceId: string,
  data: EventAttendanceRequest,
) {
  return apiFetch<any>(`/church/create-attendance/${occurrenceId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** POST /church/worker-attendance/occurance/:occurrenceId/department/:deptId */
export async function recordWorkerAttendance(
  occurrenceId: string,
  deptId: string,
  records: WorkerAttendanceRequest[],
) {
  return apiFetch<any>(
    `/church/worker-attendance/occurance/${occurrenceId}/department/${deptId}`,
    {
      method: "POST",
      body: JSON.stringify(records),
    },
  );
}

/** POST /church/event-collections/:eventOccurrenceId */
export async function addEventCollectionFund(
  occurrenceId: string,
  updates: { id: string; amount: number }[],
) {
  return apiFetch<any>(`/church/event-collections/${occurrenceId}`, {
    method: "POST",
    body: JSON.stringify({ updates }),
  });
}

/** PATCH /church/edit-an-event/:eventOccurrenceId/branch/:branchId */
export async function editEventOccurrence(
  occurrenceId: string,
  branchId: string,
  data: EditEventOccurrenceRequest,
) {
  try {
    return await apiFetch<any>(
      `/church/edit-an-event/${occurrenceId}/branch/${branchId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  } catch (error) {
    const shouldRetryLegacyPath =
      error instanceof ApiRequestError &&
      (error.status === 404 || error.status === 405);

    if (!shouldRetryLegacyPath) {
      throw error;
    }

    return apiFetch<any>(
      `/church/get-event/${occurrenceId}/branch/${branchId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  }
}

/** GET /members/members-event/:eventOccurrenceId */
export async function fetchMembersForEvent(
  occurrenceId: string,
  branchId?: string,
  departmentId?: string,
) {
  return apiFetch<any>(
    `/members/members-event/${occurrenceId}${buildQuery({ branchId, departmentId })}`,
  );
}

/** PATCH /church/soft-delete-event/:eventId */
export async function softDeleteEvent(eventId: string) {
  return apiFetch<any>(`/church/soft-delete-event/${eventId}`, {
    method: "PATCH",
  });
}

// Backward-compat aliases for Programs
export const savePrograms = async (_programs: any[]) => {
  console.warn("savePrograms: bulk save not supported by real API");
  return { success: true };
};

export const fetchProgramInstances = async () => {
  return [];
};

export const saveProgramInstances = async (_instances: any[]) => {
  console.warn(
    "saveProgramInstances: not supported - use createEventAttendance",
  );
  return { success: true };
};

// FOLLOW-UP MANAGEMENT

/** POST /member/add-follow-up?churchId=...&branchId=... */
export async function createFollowUp(
  data: CreateFollowUpRequest,
  churchId?: string,
  branchId?: string,
) {
  return apiFetch<any>(
    `/member/add-follow-up${buildQuery({ churchId, branchId })}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/** GET /member/get-follow-up?branchId=... */
export async function fetchNewcomers(branchId?: string): Promise<any[]> {
  try {
    const resolvedBranchId = resolveFallbackBranchId(branchId);
    const res = await apiFetch<any>(
      `/member/get-follow-up${buildQuery({ branchId: resolvedBranchId })}`,
    );
    const hiddenIds = readHiddenIdSet(HIDDEN_NEWCOMER_IDS_KEY);
    const overrides = readLocalJson<Record<string, any>>(
      NEWCOMER_OVERRIDES_KEY,
      {},
    );
    const raw = Array.isArray(res?.results)
      ? res.results
      : Array.isArray(res?.data?.results)
        ? res.data.results
        : Array.isArray(res?.followUps)
          ? res.followUps
          : Array.isArray(res?.data?.followUps)
            ? res.data.followUps
            : Array.isArray(res?.followUp)
              ? res.followUp
              : Array.isArray(res?.data?.followUp)
                ? res.data.followUp
                : Array.isArray(res?.data)
                  ? res.data
                  : Array.isArray(res)
                    ? res
                    : [];
    return raw
      .filter((item: any) => !item.isDeleted && !hiddenIds.has(item.id))
      .map(mapApiFollowUp)
      .map((newcomer: any) => ({
        ...newcomer,
        ...(overrides[newcomer.id] || {}),
      }));
  } catch {
    // API requires branchId; include it when available
    return [];
  }
}

/** PATCH /member/edit-follow-up/:followUpId?branchId=... */
export async function editFollowUp(
  followUpId: string,
  data: EditFollowUpRequest,
  branchId?: string,
) {
  return apiFetch<any>(
    `/member/edit-follow-up/${followUpId}${buildQuery({ branchId })}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

/** POST /follow/custom-questions?branchId=... */
export async function createCustomQuestions(
  data: CreateCustomQuestionsRequest,
  branchId?: string,
) {
  return apiFetch<any>(`/follow/custom-questions${buildQuery({ branchId })}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /follow/edit-question/:questionId?branchId=... */
export async function editCustomQuestion(
  questionId: string,
  data: any,
  branchId?: string,
) {
  return apiFetch<any>(
    `/follow/edit-question/${questionId}${buildQuery({ branchId })}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

/** POST /follow/custom-form?branchId=... */
export async function createCustomForm(
  data: CreateCustomFormRequest,
  branchId?: string,
) {
  return apiFetch<any>(`/follow/custom-form${buildQuery({ branchId })}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH /follow/edit-form/:formId?branchId=... */
export async function editCustomForm(
  formId: string,
  data: any,
  branchId?: string,
) {
  return apiFetch<any>(
    `/follow/edit-form/${formId}${buildQuery({ branchId })}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

/** GET /follow/all-forms?branchId=... */
export async function fetchNewcomerForms(branchId?: string): Promise<any[]> {
  try {
    const res = await apiFetch<any>(
      `/follow/all-forms${buildQuery({ branchId })}`,
    );
    return Array.isArray(res.forms) ? res.forms : Array.isArray(res) ? res : [];
  } catch {
    // API requires branchId or churchId; include both when available
    return [];
  }
}

// Backward-compat aliases
export const saveNewcomers = async (newcomers: any[]) => {
  const existing = readLocalJson<Record<string, any>>(
    NEWCOMER_OVERRIDES_KEY,
    {},
  );
  const next = { ...existing };
  for (const newcomer of Array.isArray(newcomers) ? newcomers : []) {
    if (!newcomer?.id) continue;
    next[newcomer.id] = {
      ...(existing[newcomer.id] || {}),
      ...pickNewcomerLocalOverride(newcomer),
    };
  }
  writeLocalJson(NEWCOMER_OVERRIDES_KEY, next);
  return { success: true };
};

export const saveNewcomerForms = async (_forms: any[]) => {
  console.warn("saveNewcomerForms: bulk save not supported by real API");
  return { success: true };
};

// COLLECTIONS

const ADMIN_CACHE_KEY = "churchset_current_admin";
const CHURCH_CACHE_KEY = "churchset_church_data";
const PROGRAM_COLLECTIONS_KEY = "churchset_program_collections";

function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function normalizeAdminLevel(rawLevel?: string | null) {
  if (!rawLevel) return undefined;
  return rawLevel === "member" ? "unit" : rawLevel;
}

function getCachedAdminScope() {
  const cachedAdmin = readSessionJson<any>(ADMIN_CACHE_KEY) || {};
  const churchData = readSessionJson<any>(CHURCH_CACHE_KEY) || {};
  const token = getAccessToken();
  const claims = token ? decodeJwtClaims(token) : {};
  const storedBranches = Array.isArray(churchData?.branches)
    ? churchData.branches
    : [];

  const branchIds = Array.from(
    new Set(
      [
        claims.branchId,
        ...(Array.isArray(claims.branchIds) ? claims.branchIds : []),
        cachedAdmin?.branchId,
        ...(Array.isArray(cachedAdmin?.branchIds) ? cachedAdmin.branchIds : []),
        ...storedBranches.map((branch: any) => branch?.id),
      ].filter(Boolean),
    ),
  );

  const departmentIds = Array.from(
    new Set(
      [
        claims.departmentId,
        ...(Array.isArray(claims.departmentIds) ? claims.departmentIds : []),
        cachedAdmin?.departmentId,
        ...(Array.isArray(cachedAdmin?.departmentIds)
          ? cachedAdmin.departmentIds
          : []),
      ].filter(Boolean),
    ),
  );

  const unitIds = Array.from(
    new Set(
      [
        claims.unitId,
        ...(Array.isArray(claims.unitIds) ? claims.unitIds : []),
        cachedAdmin?.unitId,
        ...(Array.isArray(cachedAdmin?.unitIds) ? cachedAdmin.unitIds : []),
      ].filter(Boolean),
    ),
  );

  const level =
    normalizeAdminLevel(claims.scopeLevel || claims.level) ||
    normalizeAdminLevel(cachedAdmin?.level) ||
    (claims.isSuperAdmin ? "church" : undefined);

  return {
    level,
    branchId: branchIds[0],
    branchIds,
    departmentId: departmentIds[0],
    departmentIds,
    unitId: unitIds[0],
    unitIds,
    churchId:
      claims.churchId || churchData?.church?.id || cachedAdmin?.churchId,
  };
}

function resolveDepartmentBranchId(branchId?: string) {
  if (branchId) return branchId;
  const scope = getCachedAdminScope();
  const isDepartmentScoped =
    scope.level === "department" ||
    scope.level === "unit" ||
    !!scope.departmentId ||
    !!scope.unitId;
  return isDepartmentScoped ? scope.branchId : undefined;
}

function dedupeCollections(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter((item: any) => {
    const key =
      item?.id ||
      [
        item?.name,
        item?.scopeType,
        item?.scopeId,
        item?.branchId,
        item?.departmentId,
        ...(Array.isArray(item?.branchIds) ? item.branchIds : []),
        ...(Array.isArray(item?.departmentIds) ? item.departmentIds : []),
      ]
        .filter(Boolean)
        .join(":");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueCollectionIds(
  ...groups: Array<Array<string | null | undefined> | undefined>
) {
  return Array.from(
    new Set(
      groups
        .flatMap((group) => group || [])
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        ),
    ),
  );
}

function extractCollectionAssignmentIds(
  assignments: any[] | undefined,
  collectionId: string | undefined,
  assignmentType: "branch" | "department",
) {
  const idKey = assignmentType === "branch" ? "branchId" : "departmentId";
  const nestedKey = assignmentType === "branch" ? "branch" : "department";

  return uniqueCollectionIds(
    ...(Array.isArray(assignments) ? assignments : [])
      .filter((assignment: any) => {
        const assignmentCollectionId =
          assignment?.collectionId ||
          assignment?.collection?.id ||
          assignment?.collection?.collectionId;
        return !collectionId || !assignmentCollectionId || assignmentCollectionId === collectionId;
      })
      .map((assignment: any) => [
        assignment?.[idKey],
        assignment?.[nestedKey]?.id,
        assignment?.scopeId,
      ]),
  );
}

function normalizeCollectionScope(item: any) {
  const branchIds = uniqueCollectionIds(
    Array.isArray(item?.branchIds) ? item.branchIds : [],
    [item?.branchId, item?.branch?.id],
  );
  const departmentIds = uniqueCollectionIds(
    Array.isArray(item?.departmentIds) ? item.departmentIds : [],
    [item?.departmentId, item?.department?.id],
  );
  const rawScopeType =
    typeof item?.scopeType === "string" ? item.scopeType.toLowerCase() : "";
  const scopeType =
    rawScopeType === "department"
      ? "department"
      : rawScopeType === "branch"
        ? "branch"
        : rawScopeType === "church"
          ? "church"
          : departmentIds.length > 0
            ? "department"
            : branchIds.length > 0
              ? "branch"
              : "church";
  const scopeId =
    scopeType === "department"
      ? item?.scopeId || departmentIds[0]
      : scopeType === "branch"
        ? item?.scopeId || branchIds[0]
        : undefined;

  return {
    scopeType,
    scopeId,
    branchIds: branchIds.length > 0 ? branchIds : undefined,
    departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
  };
}

async function fetchCollectionsByBranch(
  branchId: string,
  query?: Record<string, string | boolean | undefined>,
): Promise<any[]> {
  const res = await apiFetch<any>(
    `/church/get-all-collections/${branchId}${buildQuery(query || {})}`,
  );
  const collections = Array.isArray(res?.collections)
    ? res.collections
    : Array.isArray(res)
      ? res
      : [];
  const responseScopeType =
    typeof res?.scopeType === "string" ? res.scopeType.toLowerCase() : undefined;
  const branchAssignments = Array.isArray(res?.branchAssignments)
    ? res.branchAssignments
    : [];
  const departmentAssignments = Array.isArray(res?.departmentAssignments)
    ? res.departmentAssignments
    : [];
  const requestedBranchScope = query?.branch === true || query?.branch === "true";
  const requestedDepartmentId =
    typeof query?.departmentId === "string" ? query.departmentId : undefined;

  return collections.map((collection: any) => {
    const scopeType =
      typeof collection?.scopeType === "string"
        ? collection.scopeType.toLowerCase()
        : responseScopeType;
    const inferredBranchIds = uniqueCollectionIds(
      Array.isArray(collection?.branchIds) ? collection.branchIds : [],
      [collection?.branchId, collection?.branch?.id],
      extractCollectionAssignmentIds(branchAssignments, collection?.id, "branch"),
      scopeType === "branch" && requestedBranchScope ? [branchId] : [],
    );
    const inferredDepartmentIds = uniqueCollectionIds(
      Array.isArray(collection?.departmentIds) ? collection.departmentIds : [],
      [collection?.departmentId, collection?.department?.id],
      extractCollectionAssignmentIds(
        departmentAssignments,
        collection?.id,
        "department",
      ),
      scopeType === "department" && requestedDepartmentId
        ? [requestedDepartmentId]
        : [],
    );
    const scopeId =
      collection?.scopeId ||
      (scopeType === "department"
        ? inferredDepartmentIds[0]
        : scopeType === "branch"
          ? inferredBranchIds[0]
          : undefined);

    return {
      ...collection,
      scopeType: scopeType || collection?.scopeType,
      scopeId,
      branchId: collection?.branchId || collection?.branch?.id || inferredBranchIds[0],
      departmentId:
        collection?.departmentId ||
        collection?.department?.id ||
        inferredDepartmentIds[0],
      branchIds: inferredBranchIds.length > 0 ? inferredBranchIds : undefined,
      departmentIds:
        inferredDepartmentIds.length > 0 ? inferredDepartmentIds : undefined,
      __responseScope: responseScopeType,
    };
  });
}

function getCachedCollectionContext() {
  const admin = readSessionJson<any>(ADMIN_CACHE_KEY) || {};
  const churchData = readSessionJson<any>(CHURCH_CACHE_KEY) || {};
  const storedBranches = Array.isArray(churchData?.branches)
    ? churchData.branches
    : [];
  const branchIds = Array.from(
    new Set(
      [
        admin?.branchId,
        ...(Array.isArray(admin?.branchIds) ? admin.branchIds : []),
        ...storedBranches.map((branch: any) => branch?.id),
      ].filter(Boolean),
    ),
  );

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
      return dedupeCollections(
        await fetchCollectionsByBranch(context.branchIds[0], {
          departmentId: context.departmentId,
        }),
      );
    }

    if (context.adminLevel === "branch") {
      return dedupeCollections(
        await fetchCollectionsByBranch(context.branchIds[0], { branch: true }),
      );
    }

    const requests: Promise<any[]>[] = context.branchIds.map((id: string) =>
      fetchCollectionsByBranch(id, { branch: true }),
    );
    if (context.churchId) {
      requests.unshift(
        fetchCollectionsByBranch(context.branchIds[0], {
          churchId: context.churchId,
        }),
      );
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
      .filter(
        (item: any) =>
          (!churchId || item?.churchId === churchId) &&
          (!branchId || item?.branchId === branchId),
      )
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
export async function createCollection(
  data: CreateCollectionRequest,
  branchId?: string,
  departmentId?: string,
) {
  const {
    branchId: _branchId,
    departmentId: _departmentId,
    branchIds: _branchIds,
    departmentIds: _departmentIds,
    scopeType,
    ...payload
  } = data;
  const resolvedBranchId = _branchId || branchId;
  const resolvedDepartmentId = _departmentId || departmentId;
  const body = {
    ...payload,
    ...(scopeType ? { scopeType } : {}),
    ...(Array.isArray(_branchIds) && _branchIds.length > 0
      ? { branchIds: _branchIds.filter(Boolean) }
      : {}),
    ...(Array.isArray(_departmentIds) && _departmentIds.length > 0
      ? { departmentIds: _departmentIds.filter(Boolean) }
      : {}),
  };

  return apiFetch<any>(
    `/church/create-collection${buildQuery({
      branchId: resolvedBranchId,
      departmentId: resolvedDepartmentId,
    })}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/** PATCH /church/edit-collection/:collectionId?departmentId=... */
export async function editCollection(
  collectionId: string,
  data: any,
  departmentId?: string,
) {
  return apiFetch<any>(
    `/church/edit-collection/${collectionId}${buildQuery({ departmentId })}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

// Backward-compat aliases
export const saveCollections = async (collections: any[]) => {
  try {
    localStorage.setItem(PROGRAM_COLLECTIONS_KEY, JSON.stringify(collections));
  } catch {
    /* ignore */
  }
  return { success: true };
};

export async function fetchCollectionTypes(): Promise<any[]> {
  try {
    const hiddenIds = readHiddenIdSet(HIDDEN_COLLECTION_TYPE_IDS_KEY);
    const items = await fetchCollectionCatalog();
    return items
      .map((c: any) => {
        const scope = normalizeCollectionScope(c);
        return {
          id: c.id,
          churchId: c.churchId || "",
          name: c.name || "",
          scope: scope.scopeType,
          scopeId: scope.scopeId,
          branchIds: scope.branchIds,
          departmentIds: scope.departmentIds,
          createdBy: c.createdBy || "",
          createdAt: new Date(c.createdAt || Date.now()),
        };
      })
      .filter((collectionType: any) => !hiddenIds.has(collectionType.id));
  } catch {
    return [];
  }
}
export const saveCollectionTypes = async (_types: any[]) => ({ success: true });
export async function fetchStandaloneCollections(): Promise<any[]> {
  try {
    const hiddenIds = readHiddenIdSet(HIDDEN_FUNDRAISER_IDS_KEY);
    const items = await fetchCollectionCatalog();
    return items
      .filter((c: any) => c.endTime)
      .map((c: any) => {
        const scope = normalizeCollectionScope(c);
        return {
          id: c.id,
          churchId: c.churchId || "",
          name: c.name || "",
          description: c.description || "",
          targetAmount: c.targetAmount || 0,
          dueDate: new Date(c.endTime),
          scope: scope.scopeType,
          scopeId: scope.scopeId,
          branchIds: scope.branchIds,
          departmentIds: scope.departmentIds,
          entries: [],
          createdBy: c.createdBy || "",
          createdAt: new Date(c.createdAt || Date.now()),
        };
      })
      .filter((collection: any) => !hiddenIds.has(collection.id));
  } catch {
    return [];
  }
}
export const saveStandaloneCollections = async (_collections: any[]) => ({
  success: true,
});

// WALLET & SMS

/** POST /wallet/fund-wallet/:branchId */
export async function createOrFundWallet(
  branchId: string,
  data: CreateWalletRequest,
) {
  return apiFetch<any>(`/wallet/fund-wallet/${branchId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** GET /wallet/my-wallet */
export async function fetchSMSWallet(): Promise<any> {
  try {
    const res = await apiFetch<any>("/wallet/my-wallet");
    // API returns { wallets: [...] } as an array
    const raw = Array.isArray(res.wallets)
      ? res.wallets[0]
      : Array.isArray(res.wallet)
        ? res.wallet[0]
        : (res.wallet ?? res ?? null);
    if (!raw || !raw.id) return null;
    return {
      id: raw.id,
      churchId: raw.churchId ?? "",
      balance: parseFloat(raw.balance) || 0,
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    };
  } catch {
    return null;
  }
}

/** POST /wallet/send-sms */
export async function sendSms(data: SendSmsRequest) {
  return apiFetch<any>("/wallet/send-sms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** GET /wallet/sms-logs */
export async function fetchSmsLogs(): Promise<any> {
  const res = await apiFetch<any>("/wallet/sms-logs");
  console.log("[fetchSmsLogs] response:", res);
  return res;
}

// Backward-compat alias
export const saveSMSWallet = async (_wallet: any) => {
  console.warn("saveSMSWallet: not supported by real API");
  return { success: true };
};

// ROLES & PERMISSIONS

function extractPermissionCatalogResponse(payload: any): any[] {
  const directCandidates = [
    payload?.data,
    payload?.permissionGroups,
    payload?.groups,
    payload?.permissions,
    payload?.data?.permissionGroups,
    payload?.data?.groups,
    payload?.data?.permissions,
    payload?.data?.data,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

/** GET /tenants/permission-groups */
export async function fetchPermissionGroups(): Promise<
  PermissionCatalogGroup[]
> {
  try {
    const normalized = await requestPermissionCatalog();
    if (normalized.length > 0) {
      permissionCatalogCache = normalized;
    }
    return normalized;
  } catch {
    return [];
  }
}

/** POST /tenants/create-role */
export async function createRole(
  data: CreateRoleRequest & { granularPermissions?: Record<string, string[]> },
) {
  const { granularPermissions, ...rest } = data;
  const hasResolvedBackendSelections = Array.isArray(rest.permissionGroup);
  let payload: CreateRoleRequest;

  if (hasResolvedBackendSelections) {
    payload = {
      ...rest,
      permissions: normalizePermissionIds(rest.permissions),
      permissionGroup: normalizePermissionIds(rest.permissionGroup),
    };
  } else {
    const catalog = await getPermissionCatalog();
    const mapped = buildRolePermissionPayload({
      permissionIds: rest.permissions || [],
      granularPermissions,
      catalog,
    });

    if (
      (rest.permissions || []).length > 0 &&
      mapped.permissions.length === 0 &&
      mapped.permissionGroup.length === 0
    ) {
      throw new Error(
        "Unable to resolve live permission groups. Please refresh and try again.",
      );
    }

    payload = {
      ...rest,
      permissions: mapped.permissions,
      permissionGroup: mapped.permissionGroup,
    };
  }

  return apiFetch<any>("/tenants/create-role", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** PATCH /tenants/edit-role/:roleId?branchId=... */
export async function editRole(
  roleId: string,
  data: EditRoleRequest & {
    granularPermissions?: Record<string, string[]>;
  },
  branchId?: string,
) {
  const { granularPermissions, ...rest } = data;
  const hasResolvedBackendSelections = Array.isArray(rest.permissionGroup);
  let payload: EditRoleRequest;

  if (hasResolvedBackendSelections) {
    payload = {
      ...rest,
      permissions: normalizePermissionIds(rest.permissions),
      permissionGroup: normalizePermissionIds(rest.permissionGroup),
    };
  } else {
    const catalog = await getPermissionCatalog();
    const mapped = buildRolePermissionPayload({
      permissionIds: rest.permissions || [],
      granularPermissions,
      catalog,
    });
    if (
      (rest.permissions || []).length > 0 &&
      mapped.permissions.length === 0 &&
      mapped.permissionGroup.length === 0
    ) {
      throw new Error(
        "Unable to resolve live permission groups. Please refresh and try again.",
      );
    }

    payload = {
      ...rest,
      permissions: mapped.permissions,
      permissionGroup: mapped.permissionGroup,
    };
  }

  return apiFetch<any>(
    `/tenants/edit-role/${roleId}${buildQuery({ branchId })}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

/** PATCH /tenants/delete-role/:roleId */
export async function deleteRole(roleId: string) {
  return apiFetch<any>(`/tenants/delete-role/${roleId}`, {
    method: "PATCH",
  });
}

/** POST /tenants/assign-role?branchId=... */
export async function assignRoleToAdmin(
  data: AssignRoleRequest,
  branchId?: string,
) {
  const resolved = resolveFallbackBranchId(branchId);
  return apiFetch<any>(
    `/tenants/assign-role${buildQuery({ branchId: resolved })}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/** GET /church/admin-role/:adminId */
export async function fetchAdminRole(adminId: string) {
  return apiFetch<any>(`/church/admin-role/${adminId}`);
}

export async function fetchAdminPermissionState(
  adminId: string,
  scopeLevel?: string,
) {
  const [roleRes, catalog] = await Promise.all([
    fetchAdminRole(adminId),
    getPermissionCatalog(),
  ]);
  const roles = extractRolesFromAdminRoleResponse(roleRes);
  const permissionState =
    extractDirectAdminPermissionState(roleRes, scopeLevel, catalog) ||
    mergeRolePermissionState(roles, scopeLevel, catalog);

  return {
    roleId: roles[0]?.id || "",
    roles,
    permissions: permissionState.permissions,
    granularPermissions: permissionState.granularPermissions,
  };
}
/** PATCH /tenants/edit-admin-permission/:adminId */
export async function editAdminPermission(
  adminId: string,
  data: EditAdminPermissionRequest,
) {
  return apiFetch<any>(`/tenants/edit-admin-permission/${adminId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// fetchRoles accepts multiple backend response shapes
export async function fetchRoles(branchId?: string): Promise<any[]> {
  if (!branchId) return [];
  try {
    const [res, catalog] = await Promise.all([
      apiFetch<any>(`/tenants/all-roles${buildQuery({ branchId })}`),
      getPermissionCatalog(),
    ]);
    const list = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.roles)
        ? res.roles
        : [];

    // Enrich each role with full permission details from /tenants/get-role/:id
    const detailedList = await Promise.all(
      list.map(async (r: any) => {
        try {
          const detail = await apiFetch<any>(`/tenants/get-role/${r.id}`);
          const role = detail?.role ?? detail;
          return {
            ...r,
            permissions: Array.isArray(role?.permissions)
              ? role.permissions
              : Array.isArray(r.permissions)
                ? r.permissions
                : [],
            permissionGroups: Array.isArray(role?.permissionGroups)
              ? role.permissionGroups
              : Array.isArray(r.permissionGroups)
                ? r.permissionGroups
                : [],
          };
        } catch {
          return r;
        }
      }),
    );

    return detailedList.map((r: any) => ({
      ...mapBackendRolePermissions({
        permissions: Array.isArray(r.permissions) ? r.permissions : [],
        permissionGroups: Array.isArray(r.permissionGroups)
          ? r.permissionGroups
          : [],
        scopeLevel: r.scopeLevel,
        catalog,
      }),
      id: r.id,
      churchId: r.churchId || "",
      branchId: r.branchId,
      name: r.name,
      description: r.description || "",
      rawPermissions: Array.isArray(r.permissions) ? r.permissions : [],
      rawPermissionGroups: Array.isArray(r.permissionGroups)
        ? r.permissionGroups
        : [],
      level: (r.scopeLevel === "church"
        ? "church"
        : r.scopeLevel === "branch"
          ? "branch"
          : r.scopeLevel === "unit" || r.scopeLevel === "member"
            ? "unit"
            : "department") as any,
      createdAt: new Date(r.createdAt),
    }));
  } catch {
    return [];
  }
}

export const saveRoles = async (_roles: any[]) => {
  console.warn("saveRoles: bulk save not supported, use createRole/editRole");
  return { success: true };
};

// DASHBOARD

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

// ACCOUNT / FINANCE

/** POST /wallet/update-account?branchId=...&departmentId=... */
export async function updateAccount(
  data: UpdateAccountRequest,
  branchId?: string,
  departmentId?: string,
) {
  return apiFetch<any>(
    `/wallet/update-account${buildQuery({ branchId, departmentId })}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/** GET /wallet/get-account-record?branchId=... */
export async function fetchAccountRecords(
  branchId?: string,
  departmentId?: string,
) {
  return apiFetch<any>(
    `/wallet/get-account-record${buildQuery({ branchId, departmentId })}`,
  );
}

// Backward-compat aliases for finance
function normalizeLedgerScope(
  scope?: string | null,
): "church" | "branch" | "department" | "unit" | undefined {
  const normalized = String(scope || "")
    .trim()
    .toLowerCase();
  return normalized === "church" ||
    normalized === "branch" ||
    normalized === "department" ||
    normalized === "unit"
    ? normalized
    : undefined;
}

function extractAccountRecordRows(response: any): any[] {
  const results = response?.result?.results;
  const data = response?.data;
  return Array.isArray(results)
    ? results
    : Array.isArray(data)
      ? data
      : Array.isArray(response?.records)
        ? response.records
        : Array.isArray(response)
          ? response
          : [];
}

function getNextAccountRecordsPath(response: any): string | null {
  const pagination = response?.result?.pagination || response?.pagination;
  if (
    !pagination?.hasNextPage ||
    typeof pagination?.nextPage !== "string" ||
    !pagination.nextPage
  ) {
    return null;
  }

  const nextPage = pagination.nextPage;
  const apiBaseUrl = getApiBaseUrl();
  if (nextPage.startsWith(apiBaseUrl)) {
    return nextPage.slice(apiBaseUrl.length);
  }

  if (/^https?:\/\//i.test(nextPage)) {
    try {
      const parsed = new URL(nextPage);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }

  return nextPage.startsWith("/") ? nextPage : `/${nextPage}`;
}

export const fetchLedgerEntries = async (
  branchId?: string,
  departmentId?: string,
) => {
  try {
    const raw: any[] = [];
    const seenPaths = new Set<string>();
    let nextPath = `/wallet/get-account-record${buildQuery({ branchId, departmentId })}`;

    while (nextPath && !seenPaths.has(nextPath)) {
      seenPaths.add(nextPath);
      const response = await apiFetch<any>(nextPath);
      const responseScope = normalizeLedgerScope(
        response?.scope || response?.result?.scope || response?.data?.scope,
      );
      raw.push(
        ...extractAccountRecordRows(response).map((row: any) => ({
          ...row,
          __responseScope: responseScope,
        })),
      );
      nextPath = getNextAccountRecordsPath(response) || "";
    }

    return raw.map((r: any) => {
      const credit = parseFloat(r.credit) || 0;
      const debit = parseFloat(r.debit) || 0;
      const scope =
        normalizeLedgerScope(r.__responseScope || r.scope || r.scopeType) ||
        (r.unitId
          ? "unit"
          : r.departmentId || departmentId
            ? "department"
            : r.branchId || branchId
              ? "branch"
              : "church");
      const resolvedBranchId = r.branchId || branchId;
      const resolvedDepartmentId =
        r.departmentId ||
        (scope === "department" || scope === "unit" ? departmentId : undefined);
      const resolvedUnitId = r.unitId;
      const scopeId =
        r.scopeId ||
        (scope === "unit"
          ? resolvedUnitId
          : scope === "department"
            ? resolvedDepartmentId
            : scope === "branch"
              ? resolvedBranchId
              : undefined);
      return {
        id:
          r.id ||
          [
            branchId || "church",
            departmentId || "all",
            r.createdAt || r.date || "",
            r.description || "",
            credit,
            debit,
          ].join(":"),
        churchId: r.churchId || r.tenantId || "",
        branchId: resolvedBranchId,
        departmentId: resolvedDepartmentId,
        unitId: resolvedUnitId,
        scope,
        scopeId,
        type: credit > 0 ? "income" : "expense",
        amount: credit > 0 ? credit : debit,
        description: r.description || "",
        date: new Date(r.createdAt || r.date || Date.now()),
        createdBy: r.creator?.name || r.createdBy || "",
        createdAt: new Date(r.createdAt || r.date || Date.now()),
        _raw: r,
      };
    });
  } catch {
    return [];
  }
};

export const saveLedgerEntries = async (_entries: any[]) => {
  console.warn("saveLedgerEntries: use updateAccount instead");
  return { success: true };
};

// IMPORT / EXPORT

/** GET /member/export */
export async function exportMembersToExcel() {
  return apiFetch<Blob>("/member/export");
}

/** POST /member/import?branchId=... (multipart) */
export async function importMembers(file: File, branchId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<any>(`/member/import${buildQuery({ branchId })}`, {
    method: "POST",
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
  formData.append("file", file);
  return apiFetch<any>(`/member/import-followup${buildQuery({ branchId })}`, {
    method: "POST",
    body: formData,
  });
}

// NON-WORKER MEMBERS

/** POST /member/non-worker?churchId=...&branchId=... */
export async function createNonWorkerMember(
  data: CreateNonWorkerMemberRequest,
  churchId?: string,
  branchId?: string,
) {
  return createMember(data, churchId, branchId);
}

/** /member/all-church-member?branchId=... */
export async function fetchAllChurchMembers(
  branchId?: string,
  isWorker?: boolean,
) {
  const { branchId: resolvedBranchId, records } = await fetchChurchMemberPages(
    branchId,
    isWorker,
  );
  const seenIds = new Set<string>();

  return records
    .filter(
      (member: any) => member?.isDeleted !== true && member?.isActive !== false,
    )
    .map(mapApiMember)
    .map((member: any) => ({
      ...member,
      branchId: member.branchId || resolvedBranchId || "",
    }))
    .filter((member: any) => {
      if (!member?.id || seenIds.has(member.id)) return false;
      seenIds.add(member.id);
      return true;
    });
}

// GROWTH / ANALYTICS

/** GET /growth/event-metrics?branchId=...&metricType=...&startDate=...&endDate=... */
export async function fetchGrowthMetrics(params: GrowthMetricsParams) {
  return apiFetch<any>(`/growth/event-metrics${buildQuery(params as any)}`);
}

// REPORTS

const REPORT_UI_STATE_KEY = "churchset-report-ui-state-v1";

type ReportUiState = Record<
  string,
  {
    isRead?: boolean;
    readAt?: string;
    isStarred?: boolean;
    replies?: Array<{
      id: string;
      authorId: string;
      authorName: string;
      authorLevel: AdminLevel;
      content: string;
      attachments?: ReportAttachment[];
      createdAt: string;
    }>;
    dataInserts?: ReportDataInsert[];
  }
>;

function inferReportLevel(raw: any): AdminLevel {
  if (raw?.departmentId) return "department";
  if (raw?.branchId) return "branch";
  return "church";
}

function mapApiReportAttachment(file: any, index: number): ReportAttachment {
  return {
    id: file?.url || "report-file-" + index,
    name: file?.fileName || "Attachment " + (index + 1),
    type: file?.fileType || "application/octet-stream",
    dataUrl: file?.url,
    size: typeof file?.size === "number" ? file.size : Number(file?.size) || 0,
  };
}

function mapApiReportRecipientEntries(raw: any): ReportRecipientEntry[] {
  const rawRecipients = Array.isArray(raw?.recipients) ? raw.recipients : [];

  return rawRecipients.map((recipient: any, index: number) => ({
    id:
      recipient?.id ||
      recipient?.recipientId ||
      "report-recipient-" + (raw?.id || "unknown") + "-" + index,
    recipientId:
      recipient?.recipientId || recipient?.recipient?.id || recipient?.id || "",
    recipientName:
      recipient?.recipient?.name ||
      recipient?.name ||
      recipient?.admin?.name ||
      recipient?.email ||
      "",
    recipientEmail:
      recipient?.recipient?.email ||
      recipient?.email ||
      recipient?.admin?.email ||
      undefined,
    isRead: Boolean(recipient?.isRead),
    readAt: recipient?.readAt ? new Date(recipient.readAt) : undefined,
  }));
}

function mapApiReportRecipients(
  raw: any,
  recipientEntries: ReportRecipientEntry[],
) {
  const rawRecipients = Array.isArray(raw?.recipients)
    ? raw.recipients
    : Array.isArray(raw?.recipientIds)
      ? raw.recipientIds
      : raw?.recipientId
        ? [raw.recipientId]
        : [];
  const mappedIds = (
    recipientEntries.length > 0
      ? recipientEntries.map((recipient) => recipient.recipientId)
      : rawRecipients.map((recipient: any) =>
          typeof recipient === "string"
            ? recipient
            : recipient?.id || recipient?.recipientId || recipient?.adminId || "",
        )
  ).filter(Boolean);
  const mappedNames = (
    recipientEntries.length > 0
      ? recipientEntries.map((recipient) => recipient.recipientName)
      : rawRecipients.map((recipient: any) =>
          typeof recipient === "string"
            ? ""
            : recipient?.name ||
              recipient?.recipient?.name ||
              recipient?.admin?.name ||
              recipient?.email ||
              "",
        )
  ).filter(Boolean);
  const fallbackId = raw?.departmentId || raw?.branchId || raw?.churchId || "";
  const fallbackName = raw?.departmentId
    ? "Department"
    : raw?.branchId
      ? "Branch"
      : "Church";

  return {
    recipientId: mappedIds[0] || fallbackId,
    recipientName: mappedNames[0] || fallbackName,
    recipientIds: mappedIds.length > 0 ? mappedIds : fallbackId ? [fallbackId] : [],
    recipientNames:
      mappedNames.length > 0 ? mappedNames : fallbackName ? [fallbackName] : [],
  };
}

function mapApiReportReply(raw: any, fallbackLevel: AdminLevel): ReportReply {
  const attachments = Array.isArray(raw?.files)
    ? raw.files
    : Array.isArray(raw?.file)
      ? raw.file
      : [];

  return {
    id: raw?.id || "",
    authorId: raw?.repliedBy || raw?.replier?.id || "",
    authorName: raw?.replier?.name || "Unknown",
    authorLevel: fallbackLevel,
    content: raw?.replyText || raw?.content || "",
    attachments: attachments.map(mapApiReportAttachment),
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
  };
}

function resolveReportType(
  rawType: unknown,
  fallbackType?: ReportFilter,
): Report["reportType"] | undefined {
  if (fallbackType === "sent" || fallbackType === "received") {
    return fallbackType;
  }

  if (rawType === "sent" || rawType === "received" || rawType === "starred") {
    return rawType;
  }

  return undefined;
}

function mapApiReport(raw: any, fallbackType?: ReportFilter): Report {
  const authorLevel = inferReportLevel(raw);
  const recipientEntries = mapApiReportRecipientEntries(raw);
  const recipients = mapApiReportRecipients(raw, recipientEntries);
  const attachments = Array.isArray(raw?.files)
    ? raw.files
    : Array.isArray(raw?.file)
      ? raw.file
      : [];
  const reportType = resolveReportType(raw?.reportType, fallbackType);
  const primaryRecipientEntry =
    reportType === "received"
      ? recipientEntries[0]
      : recipientEntries.find((entry) => entry.isRead) || recipientEntries[0];
  const isRead =
    typeof raw?.isRead === "boolean"
      ? raw.isRead
      : primaryRecipientEntry?.isRead || false;
  const readAt = raw?.readAt
    ? new Date(raw.readAt)
    : primaryRecipientEntry?.readAt;

  return {
    id: raw?.id || "",
    churchId: raw?.churchId || "",
    branchId: raw?.branchId || undefined,
    departmentId: raw?.departmentId || undefined,
    title: raw?.title || "",
    content: raw?.comments || "",
    responseComments: raw?.responseComments || "",
    authorId: raw?.senderId || raw?.createdBy || raw?.sender?.id || raw?.creator?.id || "",
    authorName: raw?.sender?.name || raw?.creator?.name || "Unknown",
    authorLevel,
    creatorEmail: raw?.sender?.email || raw?.creator?.email || undefined,
    ...recipients,
    recipientEntryId: primaryRecipientEntry?.id,
    recipientEntries,
    reportType,
    isRead,
    readAt,
    isStarred: Boolean(raw?.isStarred),
    attachments: attachments.map(mapApiReportAttachment),
    replies: Array.isArray(raw?.replies)
      ? raw.replies.map((reply: any) => mapApiReportReply(reply, authorLevel))
      : [],
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw?.updatedAt ? new Date(raw.updatedAt) : undefined,
  };
}

function mergeReportUiState(
  report: Report,
  uiState?: ReportUiState[string],
): Report {
  if (!uiState) return report;

  return {
    ...report,
    isRead: uiState.isRead ?? report.isRead,
    isStarred: uiState.isStarred ?? report.isStarred,
    readAt: uiState.readAt ? new Date(uiState.readAt) : report.readAt,
    replies:
      uiState.replies?.map((reply) => ({
        ...reply,
        createdAt: new Date(reply.createdAt),
      })) || report.replies,
    dataInserts: uiState.dataInserts || report.dataInserts,
  };
}

function serializeReportReplies(replies?: ReportReply[]) {
  return replies?.map((reply) => ({
    ...reply,
    createdAt:
      reply.createdAt instanceof Date
        ? reply.createdAt.toISOString()
        : new Date(reply.createdAt).toISOString(),
  }));
}

/** POST /tenants/write-report (multipart) */
export async function createReport(data: CreateReportRequest) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("comments", data.comments);
  if (data.churchId) formData.append("churchId", data.churchId);
  if (data.branchId) formData.append("branchId", data.branchId);
  if (data.departmentId) formData.append("departmentId", data.departmentId);
  (data.recipients || []).filter(Boolean).forEach((recipientId) => {
    formData.append("recipients", recipientId);
  });
  if (data.responseComments)
    formData.append("responseComments", data.responseComments);
  const files =
    data.files ||
    (Array.isArray(data.file) ? data.file : data.file ? [data.file] : []);
  const fileFieldName =
    Array.isArray(data.recipients) && data.recipients.length > 0
      ? "files"
      : "file";
  files.forEach((file) => {
    if (file instanceof File) {
      formData.append(fileFieldName, file);
    }
  });

  return apiFetch<any>("/tenants/write-report", {
    method: "POST",
    body: formData,
  });
}

export type ReportFilter = "sent" | "received" | "starred";

export async function fetchReports(filter: ReportFilter): Promise<Report[]> {
  const response = await apiFetch<any>("/tenants/get-report?filter=" + filter);
  const reports = Array.isArray(response?.reports)
    ? response.reports
    : Array.isArray(response)
      ? response
      : [];
  const uiState = readLocalJson<ReportUiState>(REPORT_UI_STATE_KEY, {});

  return reports
    .map((report: any) =>
      mergeReportUiState(mapApiReport(report, filter), uiState[report?.id || ""]),
    )
    .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function fetchReportById(
  reportId: string,
  fallbackType?: Exclude<Report["reportType"], "starred">,
): Promise<Report> {
  try {
    const response = await apiFetch<any>("/tenants/get-report/" + reportId);
    const rawReport = response?.report || response;
    const uiState = readLocalJson<ReportUiState>(REPORT_UI_STATE_KEY, {});
    return mergeReportUiState(
      mapApiReport(rawReport, fallbackType),
      uiState[rawReport?.id || reportId],
    );
  } catch (error) {
    const results = await Promise.allSettled([
      fetchReports("received"),
      fetchReports("sent"),
    ]);
    const foundReport = results
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<Report[]> =>
          result.status === "fulfilled",
      )
      .flatMap((result) => result.value)
      .find((report) => report.id === reportId);

    if (foundReport) {
      return foundReport;
    }

    throw error;
  }
}

export async function markReportRead(reportId: string) {
  return apiFetch<any>("/tenants/mark-report-read/" + reportId, {
    method: "PATCH",
  });
}

export const saveReports = async (reports: Report[]) => {
  const existing = readLocalJson<ReportUiState>(REPORT_UI_STATE_KEY, {});
  const next: ReportUiState = { ...existing };

  reports.forEach((report) => {
    next[report.id] = {
      ...existing[report.id],
      isRead: report.isRead,
      isStarred: report.isStarred,
      readAt:
        report.readAt instanceof Date
          ? report.readAt.toISOString()
          : report.readAt
            ? new Date(report.readAt).toISOString()
            : undefined,
      replies: serializeReportReplies(report.replies),
      dataInserts: report.dataInserts,
    };
  });

  writeLocalJson(REPORT_UI_STATE_KEY, next);
  return { success: true };
};

// NOTIFICATIONS

/** GET /tenants/get-notifications */
export async function fetchNotifications() {
  return apiFetch<any>("/tenants/get-notifications");
}

/** PATCH /tenants/mark-read */
export async function markNotificationRead(data: {
  socket_id: string;
  channel_name: string;
}) {
  return apiFetch<any>("/tenants/mark-read/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// SUBSCRIPTION / PLANS

/** POST /plan/subscribe */
export async function subscribeToPlan(data: SubscribeRequest) {
  return apiFetch<any>("/plan/subscribe", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** GET /plan/pricing-configs */
export async function fetchPricingConfigs() {
  return apiFetch<any>("/plan/pricing-configs");
}

// BACKWARD COMPAT STUBS

export const fetchWorkforce = async (branchId?: string) => {
  try {
    const [workers, units] = await Promise.all([
      fetchMembers(branchId, undefined, true),
      fetchUnits(),
    ]);
    const roadmapStore = readLocalJson<Record<string, any[]>>(
      WORKFORCE_ROADMAPS_KEY,
      {},
    );
    const unitDeptMap = new Map(
      (units as any[]).map((unit: any) => [unit.id, unit.departmentId]),
    );
    const workforce: any[] = [];

    for (const member of workers as any[]) {
      let departmentIds = uniqueIds(
        Array.isArray(member.departmentIds) && member.departmentIds.length > 0
          ? member.departmentIds
          : member.departmentId
            ? [member.departmentId]
            : [],
      );

      // Since they are obtained with isWorker=true, they belong in workforce.
      // If the backend doesn't return nested department ids, assign a fallback array.
      if (departmentIds.length === 0) {
        departmentIds = ["unassigned-department"];
      }

      const unitIds = uniqueIds(
        Array.isArray(member.unitIds) && member.unitIds.length > 0
          ? member.unitIds
          : member.unitId
            ? [member.unitId]
            : [],
      );

      for (const departmentId of departmentIds) {
        const matchingUnitId = unitIds.find(
          (unitId) => unitDeptMap.get(unitId) === departmentId,
        );
        const entryId = buildWorkforceEntryId(
          member.id,
          departmentId,
          matchingUnitId,
        );
        workforce.push({
          id: entryId,
          churchId: member.churchId,
          memberId: member.id,
          branchId: member.branchId,
          departmentId,
          unitId: matchingUnitId,
          roadmapMarkers: normalizeRoadmapMarkers(roadmapStore[entryId] || []),
          createdAt: member.createdAt || new Date(),
        });
      }
    }

    return workforce;
  } catch {
    return [];
  }
};

export const saveWorkforce = async (
  workforce: any[],
  options?: { syncAssignments?: boolean; removeEntryIds?: string[] },
) => {
  const entries = Array.isArray(workforce) ? workforce : [];
  const existingRoadmapStore = readLocalJson<Record<string, any[]>>(
    WORKFORCE_ROADMAPS_KEY,
    {},
  );
  const roadmapStore = { ...existingRoadmapStore };

  for (const entry of entries) {
    if (!entry?.id) continue;
    roadmapStore[entry.id] = Array.isArray(entry.roadmapMarkers)
      ? entry.roadmapMarkers
      : [];
  }

  for (const entryId of options?.removeEntryIds || []) {
    if (!entryId) continue;
    delete roadmapStore[entryId];
  }

  writeLocalJson(WORKFORCE_ROADMAPS_KEY, roadmapStore);

  if (options?.syncAssignments === false) {
    return { success: true };
  }

  try {
    const members = await fetchMembers();
    const groupedAssignments = new Map<
      string,
      { departmentIds: Set<string>; unitIds: Set<string> }
    >();

    for (const entry of entries) {
      if (!entry?.memberId || !entry?.departmentId) continue;
      if (!groupedAssignments.has(entry.memberId)) {
        groupedAssignments.set(entry.memberId, {
          departmentIds: new Set<string>(),
          unitIds: new Set<string>(),
        });
      }
      const assignment = groupedAssignments.get(entry.memberId)!;
      assignment.departmentIds.add(entry.departmentId);
      if (entry.unitId) assignment.unitIds.add(entry.unitId);
    }

    const updates: Promise<any>[] = [];
    for (const member of members as any[]) {
      const desired = groupedAssignments.get(member.id);
      const nextDepartmentIds = desired
        ? Array.from(desired.departmentIds)
        : [];
      const nextUnitIds = desired ? Array.from(desired.unitIds) : [];
      const currentDepartmentIds = uniqueIds(
        Array.isArray(member.departmentIds) && member.departmentIds.length > 0
          ? member.departmentIds
          : member.departmentId
            ? [member.departmentId]
            : [],
      );
      const currentUnitIds = uniqueIds(
        Array.isArray(member.unitIds) && member.unitIds.length > 0
          ? member.unitIds
          : member.unitId
            ? [member.unitId]
            : [],
      );

      if (
        arraysEqualAsSets(currentDepartmentIds, nextDepartmentIds) &&
        arraysEqualAsSets(currentUnitIds, nextUnitIds)
      ) {
        continue;
      }

      const branchId = member.branchId || member.branchIds?.[0];
      if (!branchId) continue;

      updates.push(
        editMember(member.id, branchId, {
          branchId: branchId,
          departmentIds: nextDepartmentIds,
          unitIds: nextUnitIds,
        }),
      );
    }

    await Promise.all(updates);
  } catch {
    // Keep local roadmap state even if backend assignment sync fails
  }

  return { success: true };
};

export const fetchTrainingPrograms = async () => [];
export const saveTrainingPrograms = async (_programs: any[]) => ({
  success: true,
});

const NEWCOMER_CLASSES_KEY = "churchset_newcomer_training_classes";
export const fetchNewcomerTrainingClasses = async (): Promise<any[]> => {
  try {
    return JSON.parse(localStorage.getItem(NEWCOMER_CLASSES_KEY) || "[]");
  } catch {
    return [];
  }
};
export const saveNewcomerTrainingClasses = async (classes: any[]) => {
  try {
    localStorage.setItem(NEWCOMER_CLASSES_KEY, JSON.stringify(classes));
  } catch {
    /* ignore */
  }
  return { success: true };
};

const MEMBER_CLASSES_KEY = "churchset_member_training_classes";
export const fetchMemberTrainingClasses = async (): Promise<any[]> => {
  try {
    return JSON.parse(localStorage.getItem(MEMBER_CLASSES_KEY) || "[]");
  } catch {
    return [];
  }
};
export const saveMemberTrainingClasses = async (classes: any[]) => {
  try {
    localStorage.setItem(MEMBER_CLASSES_KEY, JSON.stringify(classes));
  } catch {
    /* ignore */
  }
  return { success: true };
};
