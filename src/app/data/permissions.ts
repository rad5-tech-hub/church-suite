import { Permission, PermissionAction } from '../types';

/** Standard CRUD-style sub-actions */
const CRUD_ACTIONS: PermissionAction[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
];

const VIEW_ONLY: PermissionAction[] = [
  { id: 'view', label: 'View' },
];

const MANAGE_ACTIONS: PermissionAction[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'assign', label: 'Assign / Unassign' },
];

const REPORT_ACTIONS: PermissionAction[] = [
  { id: 'view', label: 'View Reports' },
  { id: 'export', label: 'Export / Print' },
];

export const PERMISSIONS: Permission[] = [
  // Church Level Only
  {
    id: 'manage-branches',
    name: 'Manage Branches',
    description: 'Create, edit, and delete church branches (multi-branch only)',
    level: ['church'],
    category: 'Church Management',
    actions: CRUD_ACTIONS,
  },
  {
    id: 'manage-subscription',
    name: 'Manage Subscription',
    description: 'Manage church subscription plan and billing',
    level: ['church'],
    category: 'Church Management',
    actions: [{ id: 'view', label: 'View' }, { id: 'edit', label: 'Manage' }],
  },
  {
    id: 'manage-departments',
    name: 'Manage Departments & Outreaches',
    description: 'Create, edit, and delete departments (internal operations like prayer, sanctuary cleaning) and outreaches (external missions like prison outreach, community programs)',
    level: ['church', 'branch', 'department'],
    category: 'Department Management',
    actions: CRUD_ACTIONS,
  },
  {
    id: 'manage-units',
    name: 'Manage Units',
    description: 'Create, edit, and delete units across all departments and outreaches',
    level: ['church', 'branch'],
    category: 'Unit Management',
    actions: CRUD_ACTIONS,
  },
  {
    id: 'manage-roles',
    name: 'Manage Roles',
    description: 'Create and manage roles with custom permissions',
    level: ['church'],
    category: 'Leadership',
    actions: CRUD_ACTIONS,
  },
  {
    id: 'manage-church-admins',
    name: 'Manage Church Admins',
    description: 'Create and manage church-level leaders',
    level: ['church'],
    category: 'Leadership',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'create', label: 'Create' },
      { id: 'edit', label: 'Edit' },
      { id: 'delete', label: 'Delete' },
      { id: 'suspend', label: 'Suspend / Reactivate' },
      { id: 'reset-password', label: 'Reset Password' },
    ],
  },
  {
    id: 'manage-branch-admins',
    name: 'Manage Branch Admins',
    description: 'Create and manage branch-level leaders',
    level: ['church', 'branch'],
    category: 'Leadership',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'create', label: 'Create' },
      { id: 'edit', label: 'Edit' },
      { id: 'delete', label: 'Delete' },
      { id: 'suspend', label: 'Suspend / Reactivate' },
      { id: 'reset-password', label: 'Reset Password' },
    ],
  },
  {
    id: 'manage-department-admins',
    name: 'Manage Department/Outreach Admins',
    description: 'Create and manage department-level and outreach-level leaders',
    level: ['church', 'branch'],
    category: 'Leadership',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'create', label: 'Create' },
      { id: 'edit', label: 'Edit' },
      { id: 'delete', label: 'Delete' },
      { id: 'suspend', label: 'Suspend / Reactivate' },
    ],
  },
  {
    id: 'manage-unit-admins',
    name: 'Manage Unit Admins',
    description: 'Create and manage unit-level leaders',
    level: ['church', 'branch', 'department'],
    category: 'Leadership',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'create', label: 'Create' },
      { id: 'edit', label: 'Edit' },
      { id: 'delete', label: 'Delete' },
    ],
  },
  {
    id: 'view-all-data',
    name: 'View All Data',
    description: 'Access to view all church, department, outreach, and unit data',
    level: ['church'],
    category: 'Reports',
    actions: REPORT_ACTIONS,
  },
  {
    id: 'view-branch-data',
    name: 'View Branch Data',
    description: 'Access to view all data within the assigned branch',
    level: ['branch'],
    category: 'Reports',
    actions: REPORT_ACTIONS,
  },

  // Church, Branch, and Department Level
  {
    id: 'manage-workforce',
    name: 'Manage Workforce',
    description: 'Add, edit, and track workforce members and their progress',
    level: ['church', 'branch', 'department'],
    category: 'Workforce',
    actions: MANAGE_ACTIONS,
  },
  {
    id: 'manage-department-units',
    name: 'Manage Units',
    description: 'Create and manage units within your department or outreach',
    level: ['department'],
    category: 'Unit Management',
    actions: CRUD_ACTIONS,
  },

  // All Levels
  {
    id: 'manage-members',
    name: 'Manage Members',
    description: 'Add, edit, and manage church members within your scope',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Members',
    actions: CRUD_ACTIONS,
  },
  {
    id: 'manage-programs',
    name: 'Manage Programs',
    description: 'Create and manage programs and events',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Programs',
    actions: CRUD_ACTIONS,
  },
  {
    id: 'manage-collections',
    name: 'Manage Collections',
    description: 'Record and track tithes, offerings, and other collections',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Finance',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'create', label: 'Record' },
      { id: 'edit', label: 'Edit' },
      { id: 'delete', label: 'Delete' },
    ],
  },
  {
    id: 'view-reports',
    name: 'View Reports',
    description: 'Access reports and analytics for your level',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Reports',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'export', label: 'Export / Print' },
      { id: 'star', label: 'Star / Pin' },
    ],
  },
  {
    id: 'submit-reports',
    name: 'Submit Reports',
    description: 'Submit reports to higher levels',
    level: ['branch', 'department', 'unit'],
    category: 'Reports',
    actions: [
      { id: 'create', label: 'Compose & Send' },
      { id: 'attach', label: 'Attach Files' },
      { id: 'data-insert', label: 'Insert Platform Data' },
    ],
  },
  {
    id: 'follow-up',
    name: 'Follow-Up',
    description: 'Access newcomer follow-up module, view contacts, add comments, and send SMS/emails',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Engagement',
    actions: [
      { id: 'view', label: 'View Newcomers' },
      { id: 'create', label: 'Add Newcomers' },
      { id: 'edit', label: 'Edit & Follow Up' },
      { id: 'move', label: 'Move to Members' },
    ],
  },
  {
    id: 'manage-sms',
    name: 'Manage SMS',
    description: 'Send bulk SMS and manage SMS communications',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Communication',
    actions: [
      { id: 'view', label: 'View' },
      { id: 'send', label: 'Send SMS' },
    ],
  },
  {
    id: 'manage-wallet',
    name: 'Manage Wallet',
    description: 'View and manage SMS wallet credits',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Finance',
    actions: [
      { id: 'view', label: 'View Balance' },
      { id: 'topup', label: 'Top Up' },
    ],
  },
  {
    id: 'manage-attendance',
    name: 'Manage Attendance',
    description: 'Record and track attendance for programs',
    level: ['church', 'branch', 'department', 'unit'],
    category: 'Programs',
    actions: [
      { id: 'view', label: 'View Attendance' },
      { id: 'record', label: 'Record Attendance' },
    ],
  },
  {
    id: 'customize-newcomer-forms',
    name: 'Customize Newcomer Forms',
    description: 'Create and customize forms for first-timers and second-timers',
    level: ['church', 'branch', 'department'],
    category: 'Engagement',
    actions: CRUD_ACTIONS,
  }
];

export const PERMISSION_CATEGORIES = [
  'Church Management',
  'Leadership',
  'Department Management',
  'Unit Management',
  'Members',
  'Workforce',
  'Programs',
  'Finance',
  'Communication',
  'Engagement',
  'Reports'
];
