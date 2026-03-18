// Core Types for Churchset

export type ChurchType = 'single' | 'multi';
export type AdminLevel = 'church' | 'branch' | 'department' | 'unit';
export type EntityType = 'department' | 'outreach';
export type RoadmapStatus = 'not-started' | 'in-progress' | 'completed';
export type ProgramFrequency = 'one-time' | 'weekly' | 'monthly' | 'custom';
export type ProgramStatus = 'ongoing' | 'unmanaged' | 'past' | 'upcoming';
export type LedgerEntryType = 'income' | 'expense';
export type NewcomerTrainingStatus = 'not-enrolled' | 'started' | 'in-progress' | 'finished' | 'dropped-off';

export interface Church {
  id: string;
  name: string;
  type: ChurchType;
  currency?: string; // e.g. 'USD', 'NGN', 'GBP'
  /** 'hierarchical' = strict chain of command, 'direct' = anyone can report to anyone above */
  reportingMode?: 'hierarchical' | 'direct';
  /** Base64 data URL of the church logo */
  logoUrl?: string;
  /** Opacity for the logo watermark (0-100, default 4) */
  logoOpacity?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: Date;
}

export interface Branch {
  id: string;
  churchId: string;
  name: string;
  isHeadquarters: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  branchId: string | null;
  name: string;
  type: EntityType;
  description?: string;
  createdAt: Date;
}

export interface Unit {
  id: string;
  departmentId: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  level: AdminLevel[];
  category: string;
  /** Sub-actions for granular control, e.g. ['view', 'create', 'edit', 'delete'] */
  actions?: PermissionAction[];
}

export interface PermissionAction {
  id: string;
  label: string;
}

export interface Role {
  id: string;
  churchId: string;
  name: string;
  level: AdminLevel;
  permissions: string[]; // Permission IDs (backward compat: included if any action is selected)
  /** Granular per-permission actions, e.g. { 'manage-branches': ['view', 'create'] } */
  granularPermissions?: Record<string, string[]>;
  createdAt: Date;
}

export interface Admin {
  id: string;
  authUserId?: string;
  churchId: string;
  name: string;
  email: string;
  phone?: string;
  /** Base64 data URL of the admin's profile picture */
  profilePicture?: string;
  roleId: string;
  level: AdminLevel;
  isSuperAdmin: boolean;
  status: 'active' | 'suspended';
  branchId?: string;
  departmentId?: string;
  unitId?: string;
  /** Multi-assignment: an admin can manage multiple branches/departments/units */
  branchIds?: string[];
  departmentIds?: string[];
  unitIds?: string[];
  /** Live permissions resolved from the admin's assigned backend role(s) */
  permissions?: string[];
  /** Granular action map resolved from backend role permissions */
  granularPermissions?: Record<string, string[]>;
  customPermissions?: string[]; // Effective permissions when admin-specific customization overrides the role preset
  lastTempPassword?: string; // Last generated temporary password (for prototype testing)
  createdAt: Date;
}

export interface Member {
  id: string;
  churchId: string;
  branchId?: string;
  departmentId?: string;
  unitId?: string;
  /** Multi-assignment: a member can belong to multiple branches/departments/units */
  branchIds?: string[];
  departmentIds?: string[];
  unitIds?: string[];
  fullName: string;
  gender: 'male' | 'female';
  phone: string;
  whatsapp?: string;
  email?: string;
  yearJoined: number;
  maritalStatus: 'single' | 'married' | 'widowed' | 'divorced';
  address: string;
  ageRange?: string;
  birthdayMonth: number; // 1-12
  birthdayDay: number; // 1-31
  birthdayYear?: number;
  country: string;
  state: string;
  LGA?: string;
  activity?: string;
  comments?: string;
  /** Training class assignment (same model as newcomers) */
  trainingClassId?: string;
  trainingStatus?: NewcomerTrainingStatus;
  createdAt: Date;
}

// Workforce: references a Member by ID with department assignment
export interface WorkforceMember {
  id: string;
  churchId: string;
  memberId: string; // References Member.id
  branchId?: string;
  departmentId: string;
  unitId?: string;
  roadmapMarkers: WorkforceRoadmap[];
  createdAt: Date;
}

// Training programs that workforce members progress through
export interface TrainingProgram {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface WorkforceRoadmap {
  id: string;
  programId: string; // References TrainingProgram.id
  status: RoadmapStatus;
  startDate?: Date;
  completionDate?: Date;
}

export interface Program {
  id: string;
  churchId: string;
  branchId?: string;
  name: string;
  type: ProgramFrequency;
  weeklyDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (for weekly)
  monthlyDate?: number; // 1-31 (for monthly)
  monthlyNthWeekdays?: { weekday: number; nth: number }[]; // for monthly rules like "first Friday"
  customDates?: string[]; // ISO date strings (for custom)
  customDateTimes?: { date: string; startTime: string; endTime: string }[]; // per-date times (for custom)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  departmentIds: string[];
  collectionTypes: string[]; // e.g. ["Tithe", "Offering"]
  createdBy: string;
  createdAt: Date;
}

export interface ProgramInstance {
  id: string;
  programId: string;
  churchId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  attendance: {
    men?: number;
    women?: number;
    children?: number;
  };
  workforceAttendance: string[]; // workforce member IDs who attended
  collections: { name: string; amount: number }[];
  managed: boolean;
  managedAt?: Date;
}

export interface Collection {
  id: string;
  churchId: string;
  branchId?: string;
  programId?: string;
  programInstanceId?: string;
  name: string;
  amount: number;
  date: Date;
  createdBy: string;
  createdAt: Date;
}

export interface Newcomer {
  id: string;
  churchId: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  visitType: 'first-timer' | 'second-timer';
  visitDate: Date;
  /** Optional program/event the newcomer attended */
  programId?: string;
  formResponses?: Record<string, any>;
  followUps: FollowUp[];
  /** Training class assignment for newcomer progression */
  trainingClassId?: string;
  trainingStatus?: NewcomerTrainingStatus;
  /** Whether this newcomer has been moved to the Members list */
  movedToMemberId?: string;
  createdAt: Date;
}

/** Newcomer training class (e.g. Baptism Class, New Convert Class) */
export interface NewcomerTrainingClass {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  /** Duration in weeks */
  durationWeeks?: number;
  createdAt: Date;
}

/** Member training class (e.g. Leadership Class, Bible Study Course) */
export interface MemberTrainingClass {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  durationWeeks?: number;
  createdAt: Date;
}

export interface FollowUp {
  id: string;
  newcomerId: string;
  adminId: string;
  comment: string;
  type: 'call' | 'sms' | 'email' | 'note';
  createdAt: Date;
}

export interface NewcomerForm {
  id: string;
  churchId: string;
  name: string;
  visitType: 'first-timer' | 'second-timer';
  fields: FormField[];
  isActive: boolean;
  shareableLink: string;
  qrCode: string;
  createdAt: Date;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'single-choice' | 'multiple-choice' | 'yes-no';
  options?: string[];
  required: boolean;
  order: number;
}

export interface SMSWallet {
  id: string;
  churchId: string;
  balance: number;
  transactions: SMSTransaction[];
}

export interface SMSTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
}

export interface SMSMessage {
  id: string;
  churchId: string;
  recipientCount: number;
  message: string;
  scheduledDate?: Date;
  sentDate?: Date;
  status: 'draft' | 'scheduled' | 'sent';
  creditsUsed: number;
  createdBy: string;
  createdAt: Date;
}

// Finance Types

/** Reusable collection type (e.g. "Tithe", "Offering") that can be assigned to programs */
export interface CollectionType {
  id: string;
  churchId: string;
  name: string;
  /** 'church' = applies to all branches (super-admin only), 'branch'/'department'/'unit' = scoped */
  scope: 'church' | 'branch' | 'department' | 'unit';
  scopeId?: string; // branchId, departmentId, or unitId depending on scope
  createdBy: string;
  createdAt: Date;
}

/** Income or expense entry in the finance ledger */
export interface LedgerEntry {
  id: string;
  churchId: string;
  branchId?: string;
  departmentId?: string;
  unitId?: string;
  scope?: 'church' | 'branch' | 'department' | 'unit';
  scopeId?: string;
  type: LedgerEntryType;
  amount: number;
  description: string;
  date: Date;
  /** If this entry was auto-generated from a program collection */
  programId?: string;
  programInstanceId?: string;
  createdBy: string;
  createdAt: Date;
}

/** A standalone (non-program) collection with a target goal, e.g. "Buy a new bus" */
export interface StandaloneCollection {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  targetAmount: number;
  dueDate: Date;
  /** Scope: 'church' = church-wide, otherwise scoped to branch/dept/unit */
  scope: 'church' | 'branch' | 'department' | 'unit';
  scopeId?: string;
  entries: StandaloneCollectionEntry[];
  createdBy: string;
  createdAt: Date;
}

export interface StandaloneCollectionEntry {
  id: string;
  donorName: string;
  amount: number;
  date: Date;
  createdBy: string;
}

// Reports Types

export interface Report {
  id: string;
  churchId: string;
  branchId?: string;
  departmentId?: string;
  title: string;
  /** Rich text content (HTML) */
  content: string;
  responseComments?: string;
  /** Data snippets embedded in the report */
  dataInserts?: ReportDataInsert[];
  /** Admin ID who authored the report */
  authorId: string;
  authorName: string;
  authorLevel: AdminLevel;
  creatorEmail?: string;
  /** Admin ID the report is sent to */
  recipientId: string;
  recipientName: string;
  /** Read status */
  isRead: boolean;
  readAt?: Date;
  /** Starred / pinned by recipient */
  isStarred?: boolean;
  /** Attached file URLs (base64 or blob names) */
  attachments?: ReportAttachment[];
  /** Thread replies */
  replies?: ReportReply[];
  /** If this report is a reply, the ID of the parent report */
  parentReportId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReportReply {
  id: string;
  authorId: string;
  authorName: string;
  authorLevel: AdminLevel;
  content: string;
  attachments?: ReportAttachment[];
  createdAt: Date;
}

export interface ReportDataInsert {
  id: string;
  type: 'members-count' | 'workforce-count' | 'newcomers-count' | 'programs-summary' | 'finance-summary' | 'custom' | 'report-reference';
  label: string;
  value: string;
}

export interface ReportAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  /** base64 data URI for small files, or a description */
  dataUrl?: string;
  size: number;
  file?: File;
}


