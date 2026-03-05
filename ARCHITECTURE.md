# Churchset - Complete System Architecture & Design

## 📋 Table of Contents

1. [Product Vision](#product-vision)
2. [User Personas](#user-personas)
3. [UX Philosophy](#ux-philosophy)
4. [Information Architecture](#information-architecture)
5. [Feature Breakdown by Level](#feature-breakdown-by-level)
6. [Role & Permission System Design](#role--permission-system-design)
7. [Database Schema](#database-schema)
8. [API Structure](#api-structure)
9. [System Architecture](#system-architecture)
10. [UI Wireframe Descriptions](#ui-wireframe-descriptions)
11. [Onboarding Flow](#onboarding-flow)
12. [Follow-Up Module Deep Design](#follow-up-module-deep-design)
13. [Workforce Tracking Logic](#workforce-tracking-logic)
14. [Security & Multi-Tenancy](#security--multi-tenancy)
15. [Scalability Considerations](#scalability-considerations)

---

## 1. Product Vision

**Churchset** is a comprehensive church management SaaS platform designed to simplify administrative tasks for church leaders who may not be technically savvy. The platform enables churches to:

- Manage organizational structure (branches, departments, units)
- Track members and workforce development
- Schedule and manage programs/events
- Record financial collections
- Engage with newcomers through systematic follow-up
- Communicate via SMS with wallet-based credits
- Generate reports and analytics

### Core Values

- **Simplicity First**: Every feature is designed for non-technical users
- **Clear Guidance**: Contextual hints and explanatory text throughout
- **Hierarchical Control**: Strict access control based on organizational structure
- **Flexibility**: Support for both single and multi-branch churches
- **Engagement Focus**: Special emphasis on newcomer follow-up and member engagement

---

## 2. User Personas

### Pastor John (Super Admin)
- **Role**: Senior Pastor / Church Founder
- **Tech Savvy**: Low
- **Goals**: Oversee entire church operations, delegate to department heads
- **Pain Points**: Overwhelmed by paperwork, hard to track member growth
- **Needs**: Simple dashboard, quick access to reports, ability to create roles

### Sarah (Department Admin)
- **Role**: Youth Ministry Leader
- **Tech Savvy**: Medium
- **Goals**: Manage youth department, track program attendance, communicate with members
- **Pain Points**: Can't see other departments, needs departmental autonomy
- **Needs**: Department-scoped view, workforce management, event creation

### Michael (Unit Admin)
- **Role**: Youth Choir Leader
- **Tech Savvy**: Low
- **Goals**: Manage choir members, schedule rehearsals
- **Pain Points**: Limited to unit scope, simple task execution
- **Needs**: Minimal features, clear instructions, easy member management

---

## 3. UX Philosophy

### Design Principles

1. **Every Page Explains Itself**
   - Simple sentence at top: "This page helps you manage your church departments."
   - One primary action button clearly labeled
   - Breadcrumb navigation for context

2. **Minimal Cognitive Load**
   - Card-based layouts with clear sections
   - Progressive disclosure (show only what's needed)
   - Consistent patterns across all pages

3. **Friendly & Conversational**
   - Microcopy uses "you" and "your church"
   - Confirmation dialogs explain consequences
   - Empty states are encouraging, not blank

4. **Step-by-Step Workflows**
   - Onboarding is a guided wizard
   - Complex actions broken into multiple steps
   - Progress indicators show where you are

5. **Mobile-First Design**
   - Responsive grid layouts
   - Touch-friendly button sizes
   - Collapsible sidebar for mobile

---

## 4. Information Architecture

### Hierarchy Structure

```
Church
├── Branch (if multi-branch)
│   ├── Department/Outreach
│   │   └── Unit
│   │       └── Members/Workforce
│   └── Programs
│       └── Collections
└── Administration
    ├── Roles
    └── Admins
```

### Navigation Structure

**Church Level Menu:**
- Dashboard
- Branches (multi-branch only)
- Departments
- Units
- Administration
  - Roles
  - Administrators
- Members
- Workforce
- Programs
- Collections
- Follow-Up
- Communication
  - SMS
  - Wallet
- Reports

**Department Level Menu:**
- Dashboard
- My Units
- Members
- Workforce
- Programs
- Collections
- Follow-Up
- Communication
- Reports

**Unit Level Menu:**
- Dashboard
- Members
- Programs
- Collections
- Follow-Up
- Reports

---

## 5. Feature Breakdown by Level

### Church Level (Full Control)

**Can Create, Read, Update, Delete:**
- Branches (if multi-branch)
- Departments/Outreaches
- Units (all)
- Roles with permissions
- Admin accounts (Church, Department, Unit)
- Members (all)
- Workforce (all)
- Programs/Events
- Collections
- Newcomer forms
- SMS campaigns
- Reports (view all levels)

**Special Capabilities:**
- Manage SMS wallet credits
- Set up auto-birthday SMS
- View aggregated data from all branches/departments
- Assign custom permissions to individual admins
- Create roadmap markers for workforce development

### Department Level

**Can Create, Read, Update, Delete:**
- Units (within their department only)
- Members (within department)
- Workforce (within department)
- Programs (department-scoped)
- Collections (department-scoped)
- SMS (department members only)

**Can View:**
- Activities of units under their department
- Department-scoped reports

**Cannot:**
- Access other departments
- Manage branches
- Create roles or church-level admins
- View church-wide financial data

### Unit Level

**Can Create, Read, Update, Delete:**
- Members (within unit)
- Programs (unit-scoped)
- Collections (unit-scoped)

**Can:**
- Submit reports to department level
- Access follow-up module (if permitted)
- Send SMS to unit members (if permitted)

**Cannot:**
- Create units
- Access other units
- Manage workforce roadmaps
- View department or church-level data

---

## 6. Role & Permission System Design

### Permission Matrix

| Permission | Church | Department | Unit | Description |
|-----------|--------|-----------|------|-------------|
| Manage Branches | ✓ | ✗ | ✗ | Create/edit church branches |
| Manage Departments | ✓ | ✗ | ✗ | Create/edit departments |
| Manage Units | ✓ | ✗ | ✗ | Manage units across all depts |
| Manage Department Units | ✗ | ✓ | ✗ | Manage units within dept |
| Manage Roles | ✓ | ✗ | ✗ | Create custom roles |
| Manage Admins | ✓ | ✗ | ✗ | Create admin accounts |
| Manage Workforce | ✓ | ✓ | ✗ | Track workforce development |
| Manage Members | ✓ | ✓ | ✓ | Add/edit members |
| Manage Programs | ✓ | ✓ | ✓ | Create events/programs |
| Manage Collections | ✓ | ✓ | ✓ | Record financial collections |
| Follow-Up | ✓ | ✓ | ✓ | Access newcomer module |
| Manage SMS | ✓ | ✓ | ✓ | Send SMS communications |
| Manage Wallet | ✓ | ✓ | ✓ | View/manage SMS credits |
| View Reports | ✓ | ✓ | ✓ | Access analytics |
| Submit Reports | ✗ | ✓ | ✓ | Submit to higher levels |
| Customize Newcomer Forms | ✓ | ✓ | ✗ | Create custom forms |
| Manage Attendance | ✓ | ✓ | ✓ | Record program attendance |

### Role Creation Flow

1. Admin navigates to Roles page
2. Clicks "Create Role"
3. Enters:
   - Role Name (e.g., "Head Accountant")
   - Level (Church/Department/Unit)
4. Permissions are filtered by selected level
5. Permissions grouped by category:
   - Church Management
   - Administration
   - Department Management
   - Members
   - Workforce
   - Programs
   - Finance
   - Communication
   - Engagement
   - Reports
6. Each permission shows:
   - Name
   - Description (tooltip/hint)
   - Level restriction badge
7. Save role with selected permissions

### Admin Assignment Flow

1. Create Role first (prerequisite)
2. Navigate to Administrators
3. Click "Add Administrator"
4. Enter:
   - Name
   - Email
   - Select Role (dropdown)
   - Assign Level (auto-filled from role)
   - Assign to Branch/Department/Unit (based on level)
5. Option to customize permissions (override role defaults)
6. Super Admin checkbox (Church level only)
7. Send invitation email

---

## 7. Database Schema

### Core Tables

#### churches
```sql
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type ENUM('single', 'multi') NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### branches
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_headquarters BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### departments
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type ENUM('department', 'outreach') NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### units
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  level ENUM('church', 'department', 'unit') NOT NULL,
  permissions JSONB NOT NULL, -- Array of permission IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### admins
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE RESTRICT,
  level ENUM('church', 'department', 'unit') NOT NULL,
  is_super_admin BOOLEAN DEFAULT false,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  custom_permissions JSONB, -- Override role permissions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### members
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  church_join_date DATE,
  department_join_date DATE,
  unit_join_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### workforce
```sql
CREATE TABLE workforce (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### workforce_roadmap_markers
```sql
CREATE TABLE workforce_roadmap_markers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workforce_id UUID REFERENCES workforce(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status ENUM('not-started', 'in-progress', 'completed') DEFAULT 'not-started',
  start_date DATE,
  completion_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### programs
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency ENUM('one-time', 'daily', 'weekly', 'monthly', 'yearly') NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### collections
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### newcomers
```sql
CREATE TABLE newcomers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  visit_type ENUM('first-timer', 'second-timer') NOT NULL,
  visit_date DATE NOT NULL,
  form_responses JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### follow_ups
```sql
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  newcomer_id UUID REFERENCES newcomers(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id),
  comment TEXT NOT NULL,
  type ENUM('call', 'sms', 'email', 'note') NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### newcomer_forms
```sql
CREATE TABLE newcomer_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  visit_type ENUM('first-timer', 'second-timer') NOT NULL,
  fields JSONB NOT NULL, -- Form field definitions
  is_active BOOLEAN DEFAULT true,
  shareable_link VARCHAR(500),
  qr_code VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### sms_wallets
```sql
CREATE TABLE sms_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### sms_transactions
```sql
CREATE TABLE sms_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES sms_wallets(id) ON DELETE CASCADE,
  type ENUM('credit', 'debit') NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP DEFAULT NOW()
);
```

#### sms_messages
```sql
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  recipient_count INTEGER NOT NULL,
  message TEXT NOT NULL,
  scheduled_date TIMESTAMP,
  sent_date TIMESTAMP,
  status ENUM('draft', 'scheduled', 'sent') DEFAULT 'draft',
  credits_used INTEGER NOT NULL,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_branches_church_id ON branches(church_id);
CREATE INDEX idx_departments_branch_id ON departments(branch_id);
CREATE INDEX idx_units_department_id ON units(department_id);
CREATE INDEX idx_admins_church_id ON admins(church_id);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_members_church_id ON members(church_id);
CREATE INDEX idx_members_department_id ON members(department_id);
CREATE INDEX idx_newcomers_church_id ON newcomers(church_id);
CREATE INDEX idx_newcomers_visit_date ON newcomers(visit_date);
CREATE INDEX idx_programs_church_id ON programs(church_id);
CREATE INDEX idx_collections_church_id ON collections(church_id);
CREATE INDEX idx_audit_logs_church_id ON audit_logs(church_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 8. API Structure

### RESTful API Endpoints

#### Authentication
```
POST   /api/auth/register          # Onboarding - create church
POST   /api/auth/login             # Admin login
POST   /api/auth/logout            # Admin logout
POST   /api/auth/forgot-password   # Password reset
GET    /api/auth/me                # Get current admin info
```

#### Churches
```
GET    /api/churches/:id           # Get church details
PATCH  /api/churches/:id           # Update church details
```

#### Branches
```
GET    /api/churches/:churchId/branches           # List branches
POST   /api/churches/:churchId/branches           # Create branch
GET    /api/branches/:id                          # Get branch
PATCH  /api/branches/:id                          # Update branch
DELETE /api/branches/:id                          # Delete branch
```

#### Departments
```
GET    /api/branches/:branchId/departments        # List departments
POST   /api/branches/:branchId/departments        # Create department
GET    /api/departments/:id                       # Get department
PATCH  /api/departments/:id                       # Update department
DELETE /api/departments/:id                       # Delete department
```

#### Units
```
GET    /api/departments/:deptId/units             # List units
POST   /api/departments/:deptId/units             # Create unit
GET    /api/units/:id                             # Get unit
PATCH  /api/units/:id                             # Update unit
DELETE /api/units/:id                             # Delete unit
```

#### Roles
```
GET    /api/churches/:churchId/roles              # List roles
POST   /api/churches/:churchId/roles              # Create role
GET    /api/roles/:id                             # Get role
PATCH  /api/roles/:id                             # Update role
DELETE /api/roles/:id                             # Delete role
GET    /api/permissions                           # Get all permissions
```

#### Admins
```
GET    /api/churches/:churchId/admins             # List admins
POST   /api/churches/:churchId/admins             # Create admin
GET    /api/admins/:id                            # Get admin
PATCH  /api/admins/:id                            # Update admin
DELETE /api/admins/:id                            # Delete admin
```

#### Members
```
GET    /api/churches/:churchId/members            # List members (filtered by scope)
POST   /api/churches/:churchId/members            # Create member
GET    /api/members/:id                           # Get member
PATCH  /api/members/:id                           # Update member
DELETE /api/members/:id                           # Delete member
```

#### Workforce
```
GET    /api/churches/:churchId/workforce          # List workforce
POST   /api/workforce                             # Add to workforce
GET    /api/workforce/:id                         # Get workforce profile
PATCH  /api/workforce/:id                         # Update workforce
DELETE /api/workforce/:id                         # Remove from workforce
POST   /api/workforce/:id/roadmap-markers         # Add roadmap marker
PATCH  /api/workforce/:id/roadmap-markers/:markerId  # Update marker status
```

#### Programs
```
GET    /api/churches/:churchId/programs           # List programs
POST   /api/programs                              # Create program
GET    /api/programs/:id                          # Get program
PATCH  /api/programs/:id                          # Update program
DELETE /api/programs/:id                          # Delete program
```

#### Collections
```
GET    /api/churches/:churchId/collections        # List collections
POST   /api/collections                           # Record collection
GET    /api/collections/:id                       # Get collection
PATCH  /api/collections/:id                       # Update collection
DELETE /api/collections/:id                       # Delete collection
GET    /api/collections/summary                   # Get financial summary
```

#### Newcomers
```
GET    /api/churches/:churchId/newcomers          # List newcomers
POST   /api/newcomers                             # Add newcomer
GET    /api/newcomers/:id                         # Get newcomer
PATCH  /api/newcomers/:id                         # Update newcomer
DELETE /api/newcomers/:id                         # Delete newcomer
POST   /api/newcomers/:id/follow-ups              # Add follow-up
```

#### Newcomer Forms
```
GET    /api/churches/:churchId/newcomer-forms     # List forms
POST   /api/newcomer-forms                        # Create form
GET    /api/newcomer-forms/:id                    # Get form
PATCH  /api/newcomer-forms/:id                    # Update form
DELETE /api/newcomer-forms/:id                    # Delete form
POST   /api/newcomer-forms/:id/submit             # Public form submission
```

#### SMS
```
GET    /api/churches/:churchId/sms                # List SMS messages
POST   /api/sms/send                              # Send SMS
POST   /api/sms/schedule                          # Schedule SMS
GET    /api/sms/wallet                            # Get wallet balance
POST   /api/sms/wallet/topup                      # Add credits
GET    /api/sms/wallet/transactions               # Get transactions
```

#### Reports
```
GET    /api/reports/attendance                    # Attendance report
GET    /api/reports/financial                     # Financial report
GET    /api/reports/growth                        # Growth metrics
GET    /api/reports/programs                      # Program analytics
```

---

## 9. System Architecture

### Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript
- React Router 7 (Data Mode)
- Tailwind CSS v4
- Radix UI components
- Lucide React icons
- React Hook Form for forms
- Recharts for analytics

**Backend (Recommended):**
- Node.js with Express or NestJS
- PostgreSQL 15+ (primary database)
- Redis (caching & sessions)
- TypeScript

**Authentication:**
- JWT tokens
- Refresh token rotation
- Role-based middleware

**Storage:**
- AWS S3 or CloudFlare R2 (file uploads)
- PostgreSQL JSONB (form responses)

**SMS Gateway:**
- Twilio or Africa's Talking
- Queue-based sending (Bull/BullMQ)

**Hosting:**
- Frontend: Vercel/Netlify
- Backend: AWS/Google Cloud/Railway
- Database: AWS RDS/Supabase/Railway

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐             ┌────────▼────────┐
│  Web App Server │             │  Web App Server │
│    (Frontend)   │             │    (Frontend)   │
└────────┬────────┘             └────────┬────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                ┌────────▼────────┐
                │   API Gateway   │
                └────────┬────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐             ┌────────▼────────┐
│  API Server 1   │             │  API Server 2   │
│   (Node.js)     │             │   (Node.js)     │
└────────┬────────┘             └────────┬────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼────────┐ ┌────▼─────┐ ┌──────▼──────┐
│   PostgreSQL    │ │  Redis   │ │  SMS Queue  │
│   (Database)    │ │ (Cache)  │ │  (BullMQ)   │
└─────────────────┘ └──────────┘ └──────┬──────┘
                                         │
                                  ┌──────▼──────┐
                                  │ SMS Gateway │
                                  │  (Twilio)   │
                                  └─────────────┘
```

### Multi-Tenancy Strategy

**Database Design:**
- Single database, multi-tenant
- All tables have `church_id` column
- Row-Level Security (RLS) policies
- Tenant isolation at query level

**Data Isolation:**
```javascript
// Middleware ensures tenant context
app.use((req, res, next) => {
  const churchId = req.admin.church_id;
  req.tenant = { churchId };
  next();
});

// All queries scoped by church_id
const members = await db.members.findMany({
  where: { church_id: req.tenant.churchId }
});
```

### Security Architecture

**Authentication Flow:**
1. Admin enters credentials
2. Server validates and generates JWT
3. JWT contains: admin_id, church_id, role_id, level
4. Refresh token stored in httpOnly cookie
5. Access token valid for 15 minutes
6. Refresh token valid for 7 days

**Authorization Middleware:**
```javascript
const checkPermission = (permission) => {
  return async (req, res, next) => {
    const admin = req.admin;
    const role = await getRole(admin.role_id);
    
    // Check custom permissions first
    const permissions = admin.custom_permissions || role.permissions;
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
app.delete('/api/branches/:id', 
  authenticate, 
  checkPermission('manage-branches'),
  deleteBranch
);
```

**Scope Enforcement:**
```javascript
const scopeFilter = (req, query) => {
  const { level, department_id, unit_id } = req.admin;
  
  switch(level) {
    case 'unit':
      query.where.unit_id = unit_id;
      break;
    case 'department':
      query.where.department_id = department_id;
      break;
    case 'church':
      // No additional filter
      break;
  }
  
  return query;
};
```

---

## 10. UI Wireframe Descriptions

### Onboarding Screens

**Screen 1: Welcome**
- Large hero section with Churchset logo
- Title: "Welcome to Churchset"
- Subtitle: "Let's get your church management system set up"
- 3 benefit cards with icons
- "Get Started" button

**Screen 2: Church Type Selection**
- Progress indicator (step 1 of 3)
- Title: "Choose Your Church Structure"
- Two large radio card options:
  - Single Branch (with description)
  - Multi-Branch (with description)
- Back and Continue buttons

**Screen 3: Church Details**
- Progress indicator (step 2 of 3)
- Form fields:
  - Church Name (required)
  - Headquarters Branch Name (conditional)
- Helpful hints under each field
- Back and Continue buttons

**Screen 4: Admin Account**
- Progress indicator (step 3 of 3)
- Form fields:
  - Full Name
  - Email
  - Password
- Password strength indicator
- Back and Complete Setup buttons

**Screen 5: Complete**
- Success checkmark icon
- "All Set!" message
- Brief next steps
- "Go to Dashboard" button

### Dashboard Layout

**Header:**
- Logo and church name
- Current admin name and role
- Logout button

**Sidebar:**
- Role-based navigation menu
- Active state highlighting
- Collapsible on mobile

**Main Content:**
- Page header with title and description
- Primary action button
- Stats cards (4 across)
- Quick actions grid
- Recent activity sidebar

### Department Management

**List View:**
- Grid of department cards
- Each card shows:
  - Department icon
  - Name and type badge
  - Branch assignment
  - Unit count
  - Member count
  - Edit and Delete buttons

**Create Dialog:**
- Modal overlay
- Form with:
  - Name field
  - Type radio (Department/Outreach)
  - Branch dropdown
  - Description textarea
- Cancel and Create buttons

### Follow-Up Module

**Main View:**
- Tabs: Newcomers, Forms, Bulk SMS
- Search bar with filter dropdown
- Grid of newcomer cards
- Each card:
  - Name and visit type badge
  - Contact info
  - Quick action buttons (Call, SMS, Email)
  - Follow-up history (expandable)

**Newcomer Forms Tab:**
- List of forms
- Each shows:
  - Form name and type
  - Active/Inactive status
  - Field preview
  - Shareable link
  - QR code button

**Form Builder:**
- Drag-and-drop field designer
- Field types:
  - Text input
  - Single choice
  - Multiple choice
  - Yes/No
- Required toggle
- Field reordering
- Preview mode

### Workforce Tracking

**Workforce Card:**
- Member photo/avatar
- Name and contact
- Department/Unit badges
- Progress bar (overall completion)
- Roadmap markers list:
  - Marker name
  - Status badge (Not Started, In Progress, Completed)
  - Start/completion dates

**Roadmap Detail Dialog:**
- Full profile view
- Each marker expandable
- Status dropdown to update
- Date pickers for start/completion
- "Add Roadmap Marker" button

### Roles & Permissions

**Role Card:**
- Role name
- Level badge
- Permission count
- Expandable permission list grouped by category

**Create Role Dialog:**
- Role name input
- Level selector
- Permissions grouped by category
- Checkboxes with descriptions
- Hint text explaining each permission
- Level restriction badges

---

## 11. Onboarding Flow

### Step-by-Step Process

**Step 1: Welcome (Orientation)**
- **Purpose**: Introduce Churchset value proposition
- **Content**:
  - Hero with church icon
  - 3 key benefits with icons
  - "Simple, Complete, Flexible" messaging
- **Action**: Click "Get Started"
- **Duration**: ~10 seconds

**Step 2: Church Type Selection**
- **Purpose**: Determine single vs. multi-branch
- **Content**:
  - Visual explanation of each option
  - Clear use cases
  - Friendly descriptions
- **Action**: Select type, click "Continue"
- **Validation**: Type must be selected
- **Duration**: ~30 seconds

**Step 3: Church Information**
- **Purpose**: Collect church name and initial branch
- **Content**:
  - Church name field
  - Branch name (if multi-branch)
  - Hints explaining each field
- **Action**: Fill fields, click "Continue"
- **Validation**: Required fields must be filled
- **Duration**: ~45 seconds

**Step 4: Admin Account Creation**
- **Purpose**: Create Super Admin account
- **Content**:
  - Name, email, password fields
  - Password requirements shown
  - Security note
- **Action**: Fill form, click "Complete Setup"
- **Validation**: 
  - Email format
  - Password min 8 characters
  - All fields required
- **Duration**: ~60 seconds

**Step 5: Completion**
- **Purpose**: Confirm setup and guide next steps
- **Content**:
  - Success animation
  - "What's next" suggestions
  - Direct link to dashboard
- **Action**: Click "Go to Dashboard"
- **Duration**: ~15 seconds

**Total Onboarding Time**: ~3 minutes

### First-Time Dashboard Experience

**Upon First Login:**
1. Welcome modal appears
2. "Quick Tour" prompt
3. Highlights key features
4. Points to "Create Department" as first action
5. Option to dismiss or take tour

**Suggested First Actions (shown in modal):**
1. Create your first department
2. Add a role for department leaders
3. Invite department administrators
4. Add church members
5. Schedule your first program

---

## 12. Follow-Up Module Deep Design

### Core Features

**1. Newcomer Collection Forms**

**Form Structure:**
```json
{
  "id": "form-uuid",
  "name": "First Timer Form",
  "visit_type": "first-timer",
  "fields": [
    {
      "id": "field-1",
      "label": "How did you hear about us?",
      "type": "single-choice",
      "options": ["Friend", "Social Media", "Website"],
      "required": true,
      "order": 1
    },
    {
      "id": "field-2",
      "label": "Prayer requests",
      "type": "text",
      "required": false,
      "order": 2
    }
  ],
  "is_active": true,
  "shareable_link": "https://churchset.app/f/abc123",
  "qr_code": "https://api.qr.com/generate?data=..."
}
```

**Field Types:**
- **Text**: Free-form input
- **Single Choice**: Radio buttons
- **Multiple Choice**: Checkboxes
- **Yes/No**: Boolean toggle

**Form Builder Interface:**
- Drag-and-drop field arrangement
- Field type selector
- Required toggle
- Preview mode
- Auto-generate shareable link
- Auto-generate QR code

**2. Newcomer Dashboard**

**Display:**
- Grid of newcomer cards
- Filterable by visit type
- Searchable by name/email/phone
- Sortable by visit date

**Each Card Shows:**
- Name and visit type badge
- Visit date
- Contact information (email, phone)
- Quick actions: Call, SMS, Email
- Follow-up history count
- Tap-to-call on phone numbers
- Mailto on email addresses

**3. Follow-Up Tracking**

**Follow-Up Types:**
- **Call**: Log phone conversation
- **SMS**: Log text message sent
- **Email**: Log email sent
- **Note**: General comment

**Follow-Up Form:**
- Comment textarea
- Type selector
- Timestamp (auto)
- Admin attribution (auto)

**Follow-Up Display:**
- Chronological list
- Type badge
- Admin name
- Date/time
- Comment text

**4. Bulk SMS to Newcomers**

**Recipient Selection:**
- All newcomers
- First-timers only
- Second-timers only
- Visited this week
- Visited this month
- Custom date range

**Message Composer:**
- Textarea for message
- Character counter (160 = 1 credit)
- Preview recipients count
- Cost calculator (recipients × message length / 160)

**Scheduling:**
- Send immediately
- Schedule for specific date/time
- Recurring (e.g., weekly welcome message)

**5. Auto Birthday SMS**

**Configuration:**
- Enable/disable toggle
- Message template with {NAME} placeholder
- Time to send (e.g., 9:00 AM on birthday)
- Cost per month estimate

**Logic:**
```javascript
// Daily cron job
const today = new Date();
const members = await getMembersWithBirthday(today);

for (const member of members) {
  const message = birthdayTemplate.replace('{NAME}', member.firstName);
  await sendSMS(member.phone, message);
  await debitWallet(churchId, 1); // 1 credit per SMS
}
```

---

## 13. Workforce Tracking Logic

### Roadmap Marker System

**Marker Structure:**
```javascript
{
  id: "marker-uuid",
  workforce_id: "workforce-uuid",
  name: "Spiritual Authority Class",
  status: "in-progress",
  start_date: "2024-01-15",
  completion_date: null,
  created_at: "2024-01-10"
}
```

**Status Flow:**
```
not-started → in-progress → completed
```

**Status Transitions:**
- **Not Started → In Progress**: Set start_date to today
- **In Progress → Completed**: Set completion_date to today
- **Completed → In Progress**: Clear completion_date
- **Any → Not Started**: Clear both dates

### Progress Calculation

```javascript
const calculateProgress = (workforce) => {
  const total = workforce.roadmap_markers.length;
  if (total === 0) return 0;
  
  const completed = workforce.roadmap_markers.filter(
    m => m.status === 'completed'
  ).length;
  
  return (completed / total) * 100;
};
```

### Common Roadmap Templates

**Default Markers (can be customized):**
1. Spiritual Authority Class
2. School of Ministry
3. Leadership Training
4. Specialized Skills (Music, Media, etc.)
5. Mentorship Program

**Admin Can:**
- Create custom markers
- Assign markers to workforce
- Update marker status
- Set start/completion dates
- View progress reports

### Workforce Development Workflow

1. **Add Member to Workforce**
   - Select from existing members
   - Assign to department/unit
   - Optionally assign initial markers

2. **Assign Roadmap Markers**
   - Select from predefined list
   - Or create custom marker
   - Set expected timeline

3. **Track Progress**
   - Update status as they progress
   - Record start dates
   - Record completion dates
   - Add notes/comments

4. **View Reports**
   - Individual progress
   - Department progress overview
   - Completion rates
   - Timeline analytics

### Member Profile Enhancement

When viewing workforce member:
```
┌─────────────────────────────────────────┐
│ David Johnson                            │
│ Youth Ministry → Youth Choir             │
├─────────────────────────────────────────┤
│ Timeline:                                │
│ • Joined church: Jan 2022                │
│ • Joined Youth Ministry: Jan 2023        │
│ • Joined Youth Choir: Feb 2023           │
│                                          │
│ You've been in Youth Choir for 1 year   │
└─────────────────────────────────────────┘
```

---

## 14. Security & Multi-Tenancy

### Authentication Security

**Password Requirements:**
- Minimum 8 characters
- Must contain: uppercase, lowercase, number
- Hashed with bcrypt (cost factor 12)
- Never stored in plain text

**JWT Strategy:**
```javascript
// Access Token (15 min)
{
  admin_id: "uuid",
  church_id: "uuid",
  role_id: "uuid",
  level: "church|department|unit",
  exp: timestamp
}

// Refresh Token (7 days)
{
  admin_id: "uuid",
  token_version: 1, // Increment to invalidate all tokens
  exp: timestamp
}
```

**Token Refresh Flow:**
1. Access token expires (15 min)
2. Client sends refresh token
3. Server validates refresh token
4. Server checks token_version
5. Server issues new access token
6. Server rotates refresh token (optional)

### Row-Level Security

**PostgreSQL RLS Policies:**

```sql
-- Enable RLS on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Church admins see all members in their church
CREATE POLICY church_admin_members ON members
  FOR ALL
  TO authenticated
  USING (
    church_id = current_setting('app.current_church_id')::uuid
    AND current_setting('app.admin_level') = 'church'
  );

-- Department admins see only their department
CREATE POLICY dept_admin_members ON members
  FOR ALL
  TO authenticated
  USING (
    church_id = current_setting('app.current_church_id')::uuid
    AND department_id = current_setting('app.current_department_id')::uuid
    AND current_setting('app.admin_level') = 'department'
  );

-- Unit admins see only their unit
CREATE POLICY unit_admin_members ON members
  FOR ALL
  TO authenticated
  USING (
    church_id = current_setting('app.current_church_id')::uuid
    AND unit_id = current_setting('app.current_unit_id')::uuid
    AND current_setting('app.admin_level') = 'unit'
  );
```

**Setting Session Variables:**
```javascript
app.use(async (req, res, next) => {
  if (req.admin) {
    await db.query(`
      SET app.current_church_id = $1;
      SET app.admin_level = $2;
      SET app.current_department_id = $3;
      SET app.current_unit_id = $4;
    `, [
      req.admin.church_id,
      req.admin.level,
      req.admin.department_id || null,
      req.admin.unit_id || null
    ]);
  }
  next();
});
```

### API Security Measures

**Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

**CORS Configuration:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

**SQL Injection Prevention:**
- Use parameterized queries only
- ORM (Prisma/TypeORM) for type safety
- Never concatenate user input into SQL

**XSS Prevention:**
- Sanitize all user input
- Content Security Policy headers
- React auto-escapes by default

### Audit Logging

**What to Log:**
- All CRUD operations
- Login/logout events
- Permission changes
- Failed authentication attempts
- Data exports

**Audit Log Entry:**
```javascript
{
  id: "uuid",
  church_id: "uuid",
  admin_id: "uuid",
  action: "DELETE_DEPARTMENT",
  entity_type: "department",
  entity_id: "dept-uuid",
  old_values: { name: "Youth Ministry", ... },
  new_values: null,
  ip_address: "192.168.1.1",
  created_at: "2024-02-24T10:30:00Z"
}
```

---

## 15. Scalability Considerations

### Database Optimization

**Indexing Strategy:**
- Index all foreign keys
- Composite index on (church_id, entity_type) for common queries
- Index on commonly filtered columns (date fields, status)

**Query Optimization:**
```javascript
// Bad: N+1 query problem
const members = await db.members.findMany();
for (const member of members) {
  member.department = await db.departments.findOne(member.department_id);
}

// Good: Join with eager loading
const members = await db.members.findMany({
  include: {
    department: true,
    unit: true
  }
});
```

**Pagination:**
```javascript
const getMembers = async (churchId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  
  return await db.members.findMany({
    where: { church_id: churchId },
    skip: offset,
    take: limit,
    orderBy: { created_at: 'desc' }
  });
};
```

### Caching Strategy

**Redis Cache Layers:**

**1. Session Cache:**
- Store JWT refresh tokens
- Store admin session data
- TTL: 7 days

**2. Data Cache:**
```javascript
// Cache expensive queries
const getDepartments = async (churchId) => {
  const cacheKey = `church:${churchId}:departments`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Query database
  const departments = await db.departments.findMany({
    where: { church_id: churchId }
  });
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(departments));
  
  return departments;
};
```

**3. Invalidation:**
```javascript
// Invalidate on updates
const updateDepartment = async (id, data) => {
  const dept = await db.departments.update({ where: { id }, data });
  
  // Invalidate cache
  await redis.del(`church:${dept.church_id}:departments`);
  
  return dept;
};
```

### Horizontal Scaling

**Stateless API Servers:**
- No session storage on server
- JWT tokens contain all auth info
- Any server can handle any request

**Load Balancing:**
```
User → Load Balancer → [API Server 1]
                    → [API Server 2]
                    → [API Server 3]
                           ↓
                    [Database Read Replicas]
                    [Database Write Master]
```

**Database Read Replicas:**
- Master handles writes
- Replicas handle reads
- 80/20 read/write ratio in typical usage

### Async Processing

**SMS Queue:**
```javascript
// Add to queue instead of sending immediately
const sendBulkSMS = async (recipients, message) => {
  for (const recipient of recipients) {
    await smsQueue.add('send-sms', {
      to: recipient.phone,
      message: message,
      church_id: recipient.church_id
    });
  }
};

// Worker processes queue
smsQueue.process('send-sms', async (job) => {
  const { to, message } = job.data;
  await twilioClient.messages.create({ to, body: message });
});
```

**Email Queue:**
- Similar pattern for bulk emails
- Background job for birthday emails
- Retry logic for failed sends

### Monitoring & Alerts

**Metrics to Track:**
- API response times
- Database query times
- Error rates
- Active users
- SMS sending rate
- Cache hit/miss ratio

**Alerting Thresholds:**
- API response > 500ms
- Error rate > 1%
- Database CPU > 80%
- Disk space < 20%

### Cost Optimization

**SMS Credits:**
- Bulk purchase discounts
- Alert when balance low (< 100 credits)
- Auto top-up option
- Usage analytics per church

**Database:**
- Archive old audit logs (> 1 year)
- Compress old program records
- Soft delete instead of hard delete

**Storage:**
- Image optimization (compress uploads)
- CDN for static assets
- Lazy loading for large lists

---

## Implementation Roadmap

### Phase 1: MVP (Months 1-2)
- [ ] Authentication & onboarding
- [ ] Church/branch structure
- [ ] Department & unit management
- [ ] Basic member management
- [ ] Role & permission system

### Phase 2: Core Features (Months 3-4)
- [ ] Program management
- [ ] Collection tracking
- [ ] Workforce development
- [ ] Basic reporting

### Phase 3: Engagement (Months 5-6)
- [ ] Follow-up module
- [ ] Newcomer forms
- [ ] SMS integration
- [ ] Wallet system

### Phase 4: Advanced (Months 7-8)
- [ ] Advanced analytics
- [ ] Attendance tracking
- [ ] Mobile app (React Native)
- [ ] API for integrations

---

## Conclusion

This architecture document provides a comprehensive blueprint for building Churchset as a production-ready SaaS platform. The system prioritizes:

1. **User Experience**: Simple, guided, and friendly for non-technical users
2. **Security**: Multi-tenant isolation, RBAC, audit logging
3. **Scalability**: Horizontal scaling, caching, async processing
4. **Flexibility**: Single/multi-branch, custom roles, extensible permissions

The implementation should follow industry best practices while maintaining the core value of simplicity for end users.
