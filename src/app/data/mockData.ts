import { Church, Branch, Department, Unit, Role, Admin, Member, WorkforceMember, Program, Collection, Newcomer, NewcomerForm, SMSWallet } from '../types';

// Mock Church
export const mockChurch: Church = {
  id: 'church-1',
  name: 'Grace Community Church',
  type: 'single',
  createdAt: new Date('2022-01-15')
};

// Mock Branches (only for multi-church setups)
export const mockBranches: Branch[] = [
  {
    id: 'branch-hq',
    churchId: 'church-1',
    name: 'Headquarters',
    isHeadquarters: true,
    createdAt: new Date('2022-01-15')
  },
  {
    id: 'branch-2',
    churchId: 'church-1',
    name: 'North Campus',
    isHeadquarters: false,
    createdAt: new Date('2023-03-01')
  },
  {
    id: 'branch-3',
    churchId: 'church-1',
    name: 'East Side Branch',
    isHeadquarters: false,
    createdAt: new Date('2023-09-15')
  }
];

// Mock Departments (directly under church for single church type)
export const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    branchId: 'church-1', // For single church, this references the church directly
    name: 'Youth Ministry',
    type: 'department',
    description: 'Ministry for young people aged 13-25',
    createdAt: new Date('2022-02-01')
  },
  {
    id: 'dept-2',
    branchId: 'church-1',
    name: 'Worship Team',
    type: 'department',
    description: 'Music and worship ministry',
    createdAt: new Date('2022-02-01')
  },
  {
    id: 'dept-3',
    branchId: 'church-1',
    name: 'Community Outreach',
    type: 'outreach',
    description: 'Reaching out to the local community',
    createdAt: new Date('2022-02-15')
  },
  {
    id: 'dept-4',
    branchId: 'church-1',
    name: 'Children Ministry',
    type: 'department',
    description: 'Ministry for children aged 3-12',
    createdAt: new Date('2022-04-01')
  }
];

// Mock Units
export const mockUnits: Unit[] = [
  {
    id: 'unit-1',
    departmentId: 'dept-1',
    name: 'Youth Choir',
    description: 'Youth singing group',
    createdAt: new Date('2022-03-01')
  },
  {
    id: 'unit-2',
    departmentId: 'dept-1',
    name: 'Youth Media Team',
    description: 'Social media and graphics',
    createdAt: new Date('2022-03-01')
  },
  {
    id: 'unit-3',
    departmentId: 'dept-2',
    name: 'Singers',
    description: 'Vocal team',
    createdAt: new Date('2022-02-10')
  },
  {
    id: 'unit-4',
    departmentId: 'dept-2',
    name: 'Instrumentalists',
    description: 'Band and musicians',
    createdAt: new Date('2022-02-10')
  }
];

// Mock Roles
export const mockRoles: Role[] = [
  {
    id: 'role-1',
    churchId: 'church-1',
    name: 'Super Administrator',
    level: 'church',
    permissions: ['manage-branches', 'manage-subscription', 'manage-departments', 'manage-units', 'manage-roles', 'manage-church-admins', 'manage-branch-admins', 'manage-department-admins', 'manage-unit-admins', 'view-all-data', 'manage-workforce', 'manage-members', 'manage-programs', 'manage-collections', 'view-reports', 'follow-up', 'manage-sms', 'manage-wallet', 'manage-attendance', 'customize-newcomer-forms'],
    createdAt: new Date('2022-01-15')
  },
  {
    id: 'role-5',
    churchId: 'church-1',
    name: 'Branch Pastor',
    level: 'branch',
    permissions: ['manage-departments', 'manage-units', 'manage-branch-admins', 'manage-department-admins', 'manage-unit-admins', 'view-branch-data', 'manage-workforce', 'manage-members', 'manage-programs', 'manage-collections', 'view-reports', 'submit-reports', 'follow-up', 'manage-sms', 'manage-wallet', 'manage-attendance', 'customize-newcomer-forms'],
    createdAt: new Date('2022-01-20')
  },
  {
    id: 'role-2',
    churchId: 'church-1',
    name: 'Head of Department',
    level: 'department',
    permissions: ['manage-workforce', 'manage-department-units', 'manage-members', 'manage-programs', 'manage-collections', 'view-reports', 'submit-reports', 'follow-up', 'manage-sms', 'manage-wallet', 'manage-attendance'],
    createdAt: new Date('2022-02-01')
  },
  {
    id: 'role-3',
    churchId: 'church-1',
    name: 'Unit Leader',
    level: 'unit',
    permissions: ['manage-members', 'manage-programs', 'manage-collections', 'view-reports', 'submit-reports', 'follow-up', 'manage-attendance'],
    createdAt: new Date('2022-02-01')
  },
  {
    id: 'role-4',
    churchId: 'church-1',
    name: 'Accountant',
    level: 'church',
    permissions: ['manage-collections', 'view-reports', 'manage-wallet'],
    createdAt: new Date('2022-02-15')
  }
];

// Mock Admins
export const mockAdmins: Admin[] = [
  {
    id: 'admin-1',
    churchId: 'church-1',
    name: 'Pastor John Smith',
    email: 'john.smith@gracechurch.com',
    phone: '+1234567800',
    roleId: 'role-1',
    level: 'church',
    isSuperAdmin: true,
    status: 'active',
    createdAt: new Date('2022-01-15')
  },
  {
    id: 'admin-2',
    churchId: 'church-1',
    name: 'Sarah Williams',
    email: 'sarah.w@gracechurch.com',
    phone: '+1234567801',
    roleId: 'role-2',
    level: 'department',
    isSuperAdmin: false,
    status: 'active',
    departmentId: 'dept-1',
    createdAt: new Date('2022-02-05')
  },
  {
    id: 'admin-3',
    churchId: 'church-1',
    name: 'Michael Brown',
    email: 'michael.b@gracechurch.com',
    phone: '+1234567802',
    roleId: 'role-3',
    level: 'unit',
    isSuperAdmin: false,
    status: 'active',
    departmentId: 'dept-1',
    unitId: 'unit-1',
    createdAt: new Date('2022-03-10')
  }
];

// Mock Members
export const mockMembers: Member[] = [
  {
    id: 'member-1',
    churchId: 'church-1',
    branchId: 'church-1',
    departmentId: 'dept-1',
    unitId: 'unit-1',
    fullName: 'David Johnson',
    gender: 'male',
    phone: '+1234567890',
    email: 'david.j@email.com',
    yearJoined: 2022,
    maritalStatus: 'married',
    address: '123 Faith Street',
    ageRange: '26-35',
    birthdayMonth: 3,
    birthdayDay: 15,
    country: 'United States',
    state: 'California',
    createdAt: new Date('2022-03-01')
  },
  {
    id: 'member-2',
    churchId: 'church-1',
    branchId: 'church-1',
    departmentId: 'dept-2',
    fullName: 'Emily Davis',
    gender: 'female',
    phone: '+1234567891',
    email: 'emily.d@email.com',
    yearJoined: 2021,
    maritalStatus: 'single',
    address: '456 Grace Avenue',
    ageRange: '18-25',
    birthdayMonth: 6,
    birthdayDay: 20,
    country: 'United States',
    state: 'Texas',
    createdAt: new Date('2021-06-15')
  }
];

// Mock Workforce
export const mockWorkforce: WorkforceMember[] = [
  {
    id: 'work-1',
    churchId: 'church-1',
    memberId: 'member-1',
    branchId: 'church-1',
    departmentId: 'dept-1',
    unitId: 'unit-1',
    createdAt: new Date('2022-03-01'),
    roadmapMarkers: []
  },
  {
    id: 'work-2',
    churchId: 'church-1',
    memberId: 'member-2',
    branchId: 'church-1',
    departmentId: 'dept-2',
    unitId: 'unit-3',
    createdAt: new Date('2021-06-15'),
    roadmapMarkers: []
  }
];

// Mock Programs
export const mockPrograms: Program[] = [
  {
    id: 'prog-1',
    churchId: 'church-1',
    branchId: 'church-1',
    name: 'Sunday Service',
    type: 'weekly',
    weeklyDays: [0],
    startTime: '09:00',
    endTime: '12:00',
    departmentIds: ['dept-1'],
    collectionTypes: ['Tithe', 'Offering'],
    createdBy: 'admin-1',
    createdAt: new Date('2022-01-15')
  },
  {
    id: 'prog-2',
    churchId: 'church-1',
    branchId: 'church-1',
    name: 'Youth Night',
    type: 'monthly',
    monthlyDate: 5,
    startTime: '18:00',
    endTime: '20:00',
    departmentIds: ['dept-1'],
    collectionTypes: ['Offering'],
    createdBy: 'admin-2',
    createdAt: new Date('2022-02-01')
  },
  {
    id: 'prog-3',
    churchId: 'church-1',
    branchId: 'church-1',
    name: 'Easter Celebration',
    type: 'one-time',
    customDates: ['2024-03-31'],
    startTime: '08:00',
    endTime: '14:00',
    departmentIds: ['dept-1'],
    collectionTypes: ['Tithe', 'Offering', 'Special Appeal'],
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-15')
  }
];

// Mock Collections
export const mockCollections: Collection[] = [
  {
    id: 'coll-1',
    churchId: 'church-1',
    branchId: 'church-1',
    programId: 'prog-1',
    name: 'Sunday Tithe',
    amount: 5420.00,
    date: new Date('2024-02-18'),
    createdBy: 'admin-1',
    createdAt: new Date('2024-02-18')
  },
  {
    id: 'coll-2',
    churchId: 'church-1',
    branchId: 'church-1',
    programId: 'prog-1',
    name: 'Sunday Offering',
    amount: 2150.00,
    date: new Date('2024-02-18'),
    createdBy: 'admin-1',
    createdAt: new Date('2024-02-18')
  },
  {
    id: 'coll-3',
    churchId: 'church-1',
    branchId: 'church-1',
    programId: 'prog-2',
    name: 'Youth Fund',
    amount: 850.00,
    date: new Date('2024-02-10'),
    createdBy: 'admin-2',
    createdAt: new Date('2024-02-10')
  }
];

// Mock Newcomers
export const mockNewcomers: Newcomer[] = [
  {
    id: 'new-1',
    churchId: 'church-1',
    branchId: 'church-1',
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.m@email.com',
    phone: '+1234567892',
    visitType: 'first-timer',
    visitDate: new Date('2024-02-18'),
    formResponses: {
      'how-did-you-hear': 'Friend invited me',
      'prayer-request': 'Need guidance in career'
    },
    followUps: [
      {
        id: 'follow-1',
        newcomerId: 'new-1',
        adminId: 'admin-2',
        comment: 'Called and welcomed. Very friendly!',
        type: 'call',
        createdAt: new Date('2024-02-19')
      }
    ],
    createdAt: new Date('2024-02-18')
  },
  {
    id: 'new-2',
    churchId: 'church-1',
    branchId: 'church-1',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.t@email.com',
    phone: '+1234567893',
    visitType: 'second-timer',
    visitDate: new Date('2024-02-18'),
    formResponses: {
      'interested-in-membership': 'Yes'
    },
    followUps: [],
    createdAt: new Date('2024-02-18')
  }
];

// Mock Newcomer Forms
export const mockNewcomerForms: NewcomerForm[] = [
  {
    id: 'form-1',
    churchId: 'church-1',
    name: 'First Timer Form',
    visitType: 'first-timer',
    fields: [
      {
        id: 'field-1',
        label: 'How did you hear about us?',
        type: 'single-choice',
        options: ['Friend/Family', 'Social Media', 'Website', 'Drove by', 'Other'],
        required: true,
        order: 1
      },
      {
        id: 'field-2',
        label: 'Do you have any prayer requests?',
        type: 'text',
        required: false,
        order: 2
      },
      {
        id: 'field-3',
        label: 'Would you like to receive updates?',
        type: 'yes-no',
        required: true,
        order: 3
      }
    ],
    isActive: true,
    shareableLink: 'https://churchset.app/form/first-timer-church-1',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://churchset.app/form/first-timer-church-1',
    createdAt: new Date('2022-02-01')
  },
  {
    id: 'form-2',
    churchId: 'church-1',
    name: 'Second Timer Form',
    visitType: 'second-timer',
    fields: [
      {
        id: 'field-4',
        label: 'Are you interested in church membership?',
        type: 'yes-no',
        required: true,
        order: 1
      },
      {
        id: 'field-5',
        label: 'Which ministries interest you?',
        type: 'multiple-choice',
        options: ['Worship Team', 'Youth Ministry', 'Children Ministry', 'Community Outreach', 'Ushering', 'Media Team'],
        required: false,
        order: 2
      }
    ],
    isActive: true,
    shareableLink: 'https://churchset.app/form/second-timer-church-1',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://churchset.app/form/second-timer-church-1',
    createdAt: new Date('2022-02-01')
  }
];

// Mock SMS Wallet
export const mockSMSWallet: SMSWallet = {
  id: 'wallet-1',
  churchId: 'church-1',
  balance: 2500,
  transactions: [
    {
      id: 'txn-1',
      type: 'credit',
      amount: 5000,
      description: 'Initial wallet funding',
      date: new Date('2024-01-01')
    },
    {
      id: 'txn-2',
      type: 'debit',
      amount: 150,
      description: 'Birthday SMS campaign - 150 messages',
      date: new Date('2024-01-15')
    },
    {
      id: 'txn-3',
      type: 'credit',
      amount: 2000,
      description: 'Wallet top-up',
      date: new Date('2024-02-01')
    },
    {
      id: 'txn-4',
      type: 'debit',
      amount: 4350,
      description: 'Welcome message to newcomers - 435 messages',
      date: new Date('2024-02-10')
    }
  ]
};

// Current logged in admin (for demo purposes)
export const currentAdmin: Admin = mockAdmins[0]; // Super Admin