# Churchset - Church Management SaaS Platform

## 🎯 Overview

Churchset is a comprehensive church management SaaS platform designed specifically for church administrators who are not tech-savvy. The system prioritizes simplicity, clear navigation, and friendly guidance while providing powerful features for managing church operations.

## ✨ Key Features

### 🏛️ Organizational Structure
- **Multi-Branch Support**: Manage headquarters and multiple branch locations
- **Department Management**: Create departments and outreach programs
- **Unit Organization**: Organize departments into smaller units
- **Hierarchical Access Control**: Strict permission enforcement at each level

### 👥 People Management
- **Member Tracking**: Complete member database with join date tracking
- **Workforce Development**: Track ministry workers with roadmap markers
- **Newcomer Follow-Up**: Systematic engagement with first and second-timers
- **Admin Management**: Role-based administrators at all levels

### 📅 Programs & Events
- **Event Scheduling**: One-time and recurring programs (daily, weekly, monthly, yearly)
- **Attendance Tracking**: Monitor program participation
- **Collection Management**: Link financial collections to specific programs

### 💬 Communication
- **SMS Integration**: Bulk messaging with wallet-based credits
- **Scheduled Messaging**: Plan messages in advance
- **Auto-Birthday SMS**: Automated birthday greetings
- **Follow-Up Tools**: Call, SMS, and email logging

### 📊 Analytics & Reporting
- **Financial Reports**: Collection summaries and trends
- **Growth Metrics**: Member and newcomer analytics
- **Attendance Reports**: Program participation tracking
- **Workforce Progress**: Training completion rates

### 🔐 Security & Permissions
- **Role-Based Access Control**: Custom roles with granular permissions
- **Level-Based Restrictions**: Church, Department, and Unit level access
- **Custom Permissions**: Override role defaults for specific admins
- **Audit Logging**: Track all system changes

## 🚀 Quick Start

### Onboarding Process

1. **Choose Church Type**
   - Single Branch: One main location
   - Multi-Branch: Headquarters with additional branches

2. **Enter Church Details**
   - Church name
   - Branch name (if multi-branch)

3. **Create Admin Account**
   - Your name and email
   - Secure password
   - Becomes Super Admin automatically

4. **Start Managing**
   - Create departments
   - Add roles
   - Invite administrators
   - Add members

## 📱 User Guide

### For Church Admins (Super Admin)

**What You Can Do:**
- ✅ Manage all branches, departments, and units
- ✅ Create and assign roles
- ✅ Add administrators at all levels
- ✅ View all church data and reports
- ✅ Manage SMS wallet and communications
- ✅ Customize newcomer forms
- ✅ Track workforce development

**Getting Started:**
1. Create your first department
2. Create a role (e.g., "Department Head")
3. Invite a department administrator
4. Add church members
5. Schedule your first program

### For Department Admins

**What You Can Do:**
- ✅ Manage units within your department
- ✅ Add and manage department members
- ✅ Track workforce in your department
- ✅ Create department programs
- ✅ Record collections
- ✅ Follow up with newcomers
- ✅ Send SMS to department members
- ✅ Submit reports to church level

**What You Cannot Do:**
- ❌ Access other departments
- ❌ Manage church branches
- ❌ Create roles or church admins
- ❌ View church-wide financial data

### For Unit Admins

**What You Can Do:**
- ✅ Manage unit members
- ✅ Create unit programs
- ✅ Record collections
- ✅ Follow up with newcomers (if permitted)
- ✅ Submit reports
- ✅ View unit reports

**What You Cannot Do:**
- ❌ Create or manage units
- ❌ Access other units or departments
- ❌ Manage workforce roadmaps
- ❌ View department or church-level data

## 🎨 Design Philosophy

### Every Page Has:
1. **Clear Title**: What this page is for
2. **Simple Description**: One sentence explaining the purpose
3. **Primary Action**: One main button (e.g., "Create Department")
4. **Breadcrumbs**: Show where you are in the system

### UX Principles:
- **Simplicity First**: No technical jargon
- **Guided Actions**: Step-by-step workflows
- **Friendly Tone**: Conversational microcopy
- **Visual Clarity**: Card-based layouts with clear sections
- **Mobile Responsive**: Works on all devices

## 🔧 Technical Stack

### Frontend
- React 18.3.1 with TypeScript
- React Router 7 (Data Mode)
- Tailwind CSS v4
- Radix UI Components
- Lucide React Icons

### Recommended Backend
- Node.js with Express/NestJS
- PostgreSQL 15+
- Redis for caching
- JWT authentication

### Third-Party Services
- SMS Gateway (Twilio/Africa's Talking)
- Email Service (SendGrid/AWS SES)
- File Storage (AWS S3/CloudFlare R2)

## 📊 Database Structure

### Core Entities
- Churches
- Branches
- Departments (Department/Outreach)
- Units
- Roles (with permissions)
- Admins
- Members
- Workforce (with roadmap markers)
- Programs
- Collections
- Newcomers (with follow-ups)
- Newcomer Forms
- SMS Wallet & Transactions

### Key Relationships
```
Church → Branches → Departments → Units → Members
                                       → Workforce
Church → Roles → Admins
Church → Programs → Collections
Church → Newcomers → Follow-Ups
Church → Newcomer Forms
Church → SMS Wallet → Transactions
```

## 🔐 Permission System

### Permission Categories
1. **Church Management**: Branches, Departments, Units
2. **Administration**: Roles, Admins
3. **Members**: Member CRUD
4. **Workforce**: Development tracking
5. **Programs**: Event management
6. **Finance**: Collections, Wallet
7. **Communication**: SMS
8. **Engagement**: Follow-up, Forms
9. **Reports**: Analytics

### Permission Levels
- **Church Level Only**: Manage branches, departments, roles
- **Church & Department**: Manage workforce
- **All Levels**: Members, programs, collections, follow-up

## 📈 Follow-Up Module

### Features
- **Custom Forms**: Create forms with custom fields
- **Field Types**: Text, single-choice, multiple-choice, yes/no
- **Shareable Links**: Direct URLs for form submissions
- **QR Codes**: Quick access for in-person visits
- **Follow-Up Tracking**: Log calls, SMS, emails, notes
- **Bulk SMS**: Send messages to newcomers
- **Contact Actions**: Tap-to-call, click-to-email

### Workflow
1. Create newcomer form (First Timer / Second Timer)
2. Share link or QR code
3. Visitors fill out form
4. Newcomers appear in dashboard
5. Admins follow up via call/SMS/email
6. Log interactions
7. Send bulk welcome messages

## 🎯 Workforce Development

### Roadmap System
- **Markers**: Spiritual Authority Class, School of Ministry, etc.
- **Statuses**: Not Started, In Progress, Completed
- **Tracking**: Start dates and completion dates
- **Progress**: Visual progress bar showing completion percentage

### Features
- Create custom roadmap markers
- Assign markers to workforce members
- Update status as they progress
- View individual and department progress
- Generate completion reports

## 💳 SMS Wallet System

### How It Works
1. **Top-Up**: Add credits to wallet
2. **Send SMS**: Deducts credits (160 chars = 1 credit)
3. **Track Usage**: Transaction history
4. **Auto-Debit**: Birthday SMS, bulk campaigns

### Features
- Balance display
- Transaction history
- Top-up functionality
- Cost calculator for bulk messages
- Low balance alerts

## 🛣️ Roadmap

### Phase 1: MVP ✅
- Authentication & onboarding
- Church structure management
- Role & permission system
- Basic member management

### Phase 2: Core Features (Current)
- Program management
- Collection tracking
- Workforce development
- Follow-up module
- SMS integration

### Phase 3: Advanced Features
- Advanced reporting
- Mobile app
- API integrations
- Automated workflows

### Phase 4: Enterprise
- White-label options
- Custom integrations
- Advanced analytics
- Multi-language support

## 🆘 Support & Documentation

### Getting Help
- In-app contextual hints
- Email support: support@churchset.app
- Video tutorials (coming soon)
- Knowledge base (coming soon)

### Best Practices
1. **Start Small**: Create one department first
2. **Train Leaders**: Help department heads understand their scope
3. **Use Roles Wisely**: Create specific roles for specific tasks
4. **Track Engagement**: Use follow-up module consistently
5. **Monitor Finances**: Regular collection recording

## 🔒 Security

### Data Protection
- Multi-tenant database isolation
- Row-level security policies
- Encrypted data at rest and in transit
- Regular security audits

### Privacy
- GDPR compliant data handling
- Member data export functionality
- Right to be forgotten support
- Transparent privacy policy

### Authentication
- Secure password hashing (bcrypt)
- JWT with refresh tokens
- Session management
- Password reset flow

## 📄 License

Proprietary - All rights reserved to Churchset

## 🤝 Contributing

This is a production SaaS platform. For feature requests or bug reports, contact support@churchset.app

---

## 🎉 Success Stories

> "Churchset helped us organize our 5 branches seamlessly. The follow-up module has doubled our newcomer retention!" - Pastor John, Grace Church

> "As a non-technical person, I was worried about using church software. Churchset is so simple, I set it up in minutes!" - Sarah, Youth Leader

> "The workforce tracking feature is amazing. We can now see exactly where each leader is in their development journey." - Michael, Senior Pastor

---

Built with ❤️ for churches worldwide
