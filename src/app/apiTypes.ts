// ─── API Response Types ─────────────────────────────────────
// Types matching the real Church Suite backend API responses

// ─── Auth ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
  };
  tenant: {
    id: string;
    name: string;
    isHeadQuarter: boolean;
  };
  accessToken: string;
}

export interface VerifyAdminRequest {
  email: string;
  otp: string;
}

export interface VerifyAdminResponse {
  message: string;
  accessToken: string;
  ip: string;
}

export interface CreateChurchRequest {
  churchName: string;
  address: string;
  phone: string;
  email?: string;
  isHeadQuarter?: boolean;
  name: string; // admin name
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  logo?: File;
  backgroundImage?: File;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

// ─── Admin ───────────────────────────────────────────────────

export interface ApiAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  scopeLevel: 'church' | 'branch' | 'department' | 'unit' | 'member';
  title: string;
  isSuperAdmin: boolean;
  tenantId: string;
  churchId: string;
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginIp: string | null;
  lastLoginAt: string | null;
  isDeleted: boolean;
  branch: ApiBranch | null;
  departments: ApiDepartmentRef[];
  units: ApiUnitRef[];
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  phone?: string;
  branchIds?: string[];
  roleIds?: string[];
  scopeLevel: 'church' | 'branch' | 'department' | 'unit' | 'member';
  title?: string;
  departmentIds?: string[];
  unitIds?: string[];
}

export interface EditAdminRequest {
  name?: string;
  email?: string;
  phone?: string;
  branchIds?: string[];
  scopeLevel?: string;
  departmentIds?: string[];
}

export interface ViewAdminsResponse {
  message: string;
  pagination?: {
    hasNextPage: boolean;
    nextCursor: string;
    nextPage: number | null;
  };
  admins: ApiAdmin[];
}

// ─── Branch ──────────────────────────────────────────────────

export interface ApiBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  churchId: string;
  tenantId: string;
  isDeleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface EditBranchRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// ─── Department ──────────────────────────────────────────────

export interface ApiDepartment {
  id: string;
  name: string;
  description: string;
  type: string; // 'Department' | 'Outreach' etc.
  churchId: string;
  tenantId: string;
  branchId: string | null;
  isDeleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDepartmentRef {
  id: string;
  name: string;
  description?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  branchId?: string;
  description?: string;
  type?: string;
}

export interface EditDepartmentRequest {
  name?: string;
  branchId?: string;
  description?: string;
  type?: string;
}

// ─── Unit ────────────────────────────────────────────────────

export interface ApiUnit {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  branchId: string | null;
  churchId: string;
  tenantId: string;
  isDeleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUnitRef {
  id: string;
  name: string;
}

export interface CreateUnitsRequest {
  branchId: string;
  departmentId: string;
  units: { name: string; description?: string }[];
}

export interface EditUnitRequest {
  name?: string;
  description?: string;
}

// ─── Member (Worker) ────────────────────────────────────────

export interface ApiMember {
  id: string;
  name: string;
  address: string;
  whatappNo: string;
  phoneNo: string;
  sex: string;
  ageFrom: number;
  ageTo: number;
  birthMonth: number;
  birthDay: number;
  state: string;
  LGA: string;
  nationality: string;
  maritalStatus: string;
  memberSince: string;
  activity: string;
  comments: string;
  branchId: string;
  churchId: string;
  tenantId: string;
  isDeleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  departments: ApiDepartmentRef[];
  units: ApiUnitRef[];
}

export interface CreateMemberRequest {
  name: string;
  address?: string;
  whatappNo?: string;
  phoneNo?: string;
  sex?: string;
  ageFrom?: number;
  ageTo?: number;
  birthMonth?: string;
  birthDay?: string;
  state?: string;
  LGA?: string;
  nationality?: string;
  maritalStatus?: string;
  memberSince?: string;
  branchId?: string;
  departmentIds?: string[];
  unitIds?: string[];
  comments?: string;
}

export interface EditMemberRequest {
  sex?: string;
  ageFrom?: number;
  ageTo?: number;
  birthMonth?: string;
  birthDay?: string;
  state?: string;
  LGA?: string;
  maritalStatus?: string;
  nationality?: string;
  memberSince?: string;
  activity?: string;
  comments?: string;
  departmentIds?: string[];
  unitIds?: string[];
}

// ─── Church ──────────────────────────────────────────────────

export interface ApiChurch {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  backgroundImg: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Events / Programs ──────────────────────────────────────

export interface CreateEventRequest {
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  recurrenceType: 'none' | 'weekly' | 'monthly' | 'annually' | 'custom';
  byWeekday?: { weekday: number; startTime: string; endTime: string }[];
  branchId?: string;
  departmentIds?: string[];
}

export interface ApiEventOccurrence {
  id: string;
  eventId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  branchId: string;
  churchId: string;
  tenantId: string;
  attendance: {
    total: number;
    male: number;
    female: number;
    children: number;
    adults: number;
  } | null;
  collections: any[];
  createdAt: string;
  updatedAt: string;
}

export interface EventAttendanceRequest {
  total?: number;
  male?: number;
  female?: number;
  children?: number;
  adults?: number;
}

export interface WorkerAttendanceRequest {
  workerId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  arrivalTime?: string;
}

// ─── Follow-Up ───────────────────────────────────────────────

export interface ApiFollowUp {
  id: string;
  name: string;
  address: string;
  phoneNo: string;
  sex: string;
  newComersComment: string;
  maritalStatus: string;
  adminComment: string;
  birthMonth: number;
  birthDay: number;
  isVisitor: boolean;
  branchId: string;
  churchId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowUpRequest {
  name: string;
  address?: string;
  phoneNo?: string;
  sex?: string;
  newComersComment?: string;
  maritalStatus?: string;
  adminComment?: string;
  birthMonth?: number;
  birthDay?: number;
  isVisitor?: boolean;
  formId?: string;
  answers?: { questionId: string; answer: string }[];
}

export interface EditFollowUpRequest {
  name?: string;
  address?: string;
  whatappNo?: string;
  timer?: string;
  isVisitor?: boolean;
  phoneNo?: string;
  sex?: string;
  birthMonth?: number;
  birthDay?: number;
  formId?: string;
  adminComment?: string;
  answers?: { questionId: string; answer: string }[];
}

// ─── Collections ─────────────────────────────────────────────

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  scopeType?: 'church' | 'branch' | 'department';
  type?: string;
  endTime?: string;
  branchId?: string;
  departmentId?: string;
  branchIds?: string[];
  departmentIds?: string[];
  members?: { memberId: string; departmentId: string }[];
}

// ─── Wallet ──────────────────────────────────────────────────

export interface CreateWalletRequest {
  action: 'create' | 'fund' | 'create_and_fund';
  walletType: 'personal' | 'branch' | 'department';
  departmentId?: string;
  amount?: number;
}

export interface SendSmsRequest {
  message: string;
  walletId: string;
  toNumbers: string[];
  channel?: 'generic' | 'whatsapp';
  followUpIds?: string[];
  sendAt?: string;
}

// ─── Roles & Permissions ────────────────────────────────────

export interface CreateRoleRequest {
  name: string;
  description?: string;
  scopeLevel: 'church' | 'branch' | 'department';
  branchId?: string;
  permissions?: string[];
  permissionGroup?: string[];
  granularPermissions?: Record<string, string[]>;
}

export interface EditRoleRequest {
  name?: string;
  description?: string;
  scopeLevel?: string;
  permissions?: string[];
  permissionGroup?: string[];
  granularPermissions?: Record<string, string[]>;
  currentPermissions?: any[];
  currentPermissionGroups?: any[];
}

export interface AssignRoleRequest {
  adminId: string;
  roleIds: string[];
}

export interface EditAdminPermissionRequest {
  overrides: ({ permissionId: string; isGranted: boolean } | { permissionGroupId: string; isGranted: boolean })[];
}

// ─── Dashboard ───────────────────────────────────────────────

export interface DashboardResponse {
  message: string;
  data: any;
}

// ─── Reports ─────────────────────────────────────────────────

export interface CreateReportRequest {
  title: string;
  comments: string;
  churchId?: string;
  branchId?: string;
  responseComments?: string;
  file?: File;
}

// ─── Account / Finance ──────────────────────────────────────

export interface UpdateAccountRequest {
  amount: number;
  description: string;
  type: 'credit' | 'debit';
}

// ─── Growth / Analytics ──────────────────────────────────────

export interface GrowthMetricsParams {
  branchId?: string;
  metricType?: 'attendance' | 'followup' | 'collection';
  startDate?: string;
  endDate?: string;
}

// ─── Custom Questions / Forms ────────────────────────────────

export interface CreateCustomQuestionsRequest {
  questions: {
    question: string;
    type: 'text' | 'yes-no' | 'multi-choice';
    options?: string[];
  }[];
}

export interface CreateCustomFormRequest {
  name: string;
  description?: string;
  config?: {
    visibleFields?: string[];
    requiredFields?: string[];
    defaults?: Record<string, any>;
  };
  questions?: { id: string; order: number }[];
}

// ─── Subscription ────────────────────────────────────────────

export interface SubscribeRequest {
  planId: string;
  billingCycle?: string;
  branchCount?: number;
}

// ─── Import/Export ───────────────────────────────────────────

export interface ImportResult {
  message: string;
  imported: number;
  failed: number;
  errors?: any[];
}
