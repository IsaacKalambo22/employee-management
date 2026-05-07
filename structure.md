# HR System Architecture & Implementation Plan

## Core Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Frontend        | Next.js 16 (App Router)             |
| Runtime         | React 19                            |
| Language        | TypeScript                          |
| Database        | PostgreSQL                          |
| ORM             | Prisma 7                            |
| Styling         | Tailwind CSS 4                      |
| UI              | shadcn/ui                           |
| Authentication  | NextAuth.js v5                      |
| Validation      | Zod                                 |
| Forms           | React Hook Form                     |
| Email           | Resend + React Email                |
| File Uploads    | UploadThing or Supabase Storage     |
| State           | Server State + minimal client state |
| Tables          | TanStack Table                      |
| Charts          | Recharts                            |
| Background Jobs | Trigger.dev or Inngest              |
| Deployment      | Vercel                              |
| Monitoring      | Sentry                              |
| Testing         | Vitest + Playwright                 |

---

# Architecture Rules (Non-Negotiable)

## Rendering Rules

1. Use Server Components by default.
2. Only use `"use client"` for:

   * forms
   * modal state
   * dropdown interactions
   * charts
   * drag-and-drop
   * optimistic updates
3. Data fetching belongs in Server Components.
4. Never fetch server data inside `useEffect` unless absolutely necessary.
5. Prefer streaming and Suspense boundaries for large pages.

---

## Mutation Rules

1. Use Server Actions for all mutations.
2. Do not create REST endpoints for internal CRUD.
3. Every mutation must:

   * validate with Zod
   * check permissions
   * write audit logs
   * revalidate cache
4. Multi-step operations must use `prisma.$transaction()`.
5. Return structured action states:

```ts
{
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}
```

---

## Authentication & Authorization Rules

1. All protected routes use middleware.
2. Roles are resolved server-side.
3. Never trust role claims from the client.
4. Every action validates:

   * authenticated user
   * organization membership
   * permissions
5. Use RBAC initially.
6. Upgrade to permission-based access later.

---

## Database Rules

1. Use UUIDs for all primary keys.
2. Use soft deletes where business recovery matters.
3. Add `createdAt` and `updatedAt` everywhere.
4. Use Prisma enums for:

   * roles
   * statuses
   * leave types
5. Use indexes intentionally.
6. Avoid N+1 queries.
7. Prefer pagination over loading large lists.

---

## UI Rules

1. Use shadcn/ui as the base system.
2. Do not build custom primitives before checking shadcn.
3. Build reusable data tables.
4. Use consistent spacing and typography.
5. Every loading state must have skeletons.
6. Every destructive action must have confirmation dialogs.
7. Use toast notifications consistently.
8. Mobile-first responsive design.

---

## Code Quality Rules

1. Strict TypeScript only.
2. No `any`.
3. Shared validation schemas.
4. Feature-based folder structure.
5. Shared business logic belongs in `/lib`.
6. No duplicated business logic.
7. Keep components small.
8. Separate UI from business logic.

---

# Recommended Folder Structure

```txt
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── tables/
│   ├── forms/
│   ├── charts/
│   └── shared/
│
├── features/
│   ├── employees/
│   ├── departments/
│   ├── attendance/
│   ├── payroll/
│   ├── leave/
│   ├── recruitment/
│   └── performance/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── permissions/
│   ├── validations/
│   ├── email/
│   ├── audit/
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── hooks/
├── types/
└── styles/
```

---

# Core Modules

## Phase 1 Modules (MVP)

### Authentication

Features:

* Login
* Password reset
* Session management
* Role-based redirects
* Middleware protection

Roles:

* SUPER_ADMIN
* HR_ADMIN
* MANAGER
* EMPLOYEE

---

### Employee Management

Features:

* Create employee
* Edit employee
* Employee profile
* Department assignment
* Job title management
* Document uploads
* Emergency contacts
* Employment status

Database Models:

* Employee
* Department
* Position
* EmergencyContact
* EmployeeDocument

---

### Leave Management

Features:

* Apply leave
* Approve/reject leave
* Leave balance tracking
* Leave calendar
* Leave policies
* Notifications

Database Models:

* LeaveRequest
* LeaveBalance
* LeavePolicy
* LeaveApproval

---

### Attendance

Features:

* Clock in/out
* Attendance logs
* Manual corrections
* Attendance reports
* Late tracking

Database Models:

* Attendance
* AttendanceCorrection

---

### Payroll

Features:

* Salary structures
* Payroll runs
* Payslips
* Deductions
* Bonuses
* Export payroll

Database Models:

* PayrollRun
* Payslip
* SalaryStructure
* Deduction

---

# Recommended Prisma Schema Structure

## Core User/Auth Models

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String?
  role        Role
  employeeId  String?
  employee    Employee?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Employee {
  id            String   @id @default(uuid())
  firstName     String
  lastName      String
  phone         String?
  departmentId  String?
  positionId    String?
  hireDate      DateTime
  status        EmploymentStatus
  user          User?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

# Authentication Setup

## NextAuth Strategy

Use:

* Credentials provider
* OAuth optional later
* JWT sessions

Store:

* role
* employeeId
* organizationId

inside the session.

---

# Middleware Architecture

## Middleware Responsibilities

1. Verify authentication.
2. Redirect unauthorized users.
3. Protect role-based routes.
4. Handle organization scoping.

Example:

```txt
/dashboard/admin → HR_ADMIN only
/dashboard/manager → MANAGER+
/dashboard/employee → authenticated users
```

---

# Feature Architecture Pattern

Each feature should contain:

```txt
features/
└── leave/
    ├── actions/
    ├── components/
    ├── queries/
    ├── schemas/
    ├── services/
    ├── types/
    └── utils/
```

---

# Data Fetching Pattern

## Server Components

```tsx
const employees = await getEmployees()
```

## Client Components

Use:

* optimistic UI
* transitions
* interactive filters

Avoid:

* heavy client fetching
* duplicated queries

---

# Validation Strategy

## Zod Everywhere

Use shared schemas:

```txt
schemas/
├── employee.ts
├── leave.ts
└── payroll.ts
```

Example:

```ts
export const createEmployeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
})
```

---

# Forms Strategy

Use:

* React Hook Form
* Zod Resolver
* Server Actions

Pattern:

```txt
Form Component
  → validates client-side
  → submits server action
  → server validates again
  → DB transaction
  → revalidatePath()
```

---

# Audit Logging System

## Required Audit Fields

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  actorId     String
  action      String
  entityType  String
  entityId    String
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

Track:

* approvals
* salary updates
* deletions
* login events
* role changes

---

# Notification System

## Types

* Email
* In-app notifications
* Optional SMS later

Events:

* leave approval
* payroll generated
* onboarding reminder
* attendance correction

---

# Tailwind CSS 4 Strategy

## Design Tokens

Use CSS variables.

Example:

```css
:root {
  --radius: 0.75rem;
}
```

## Theme Rules

1. Use semantic colors.
2. Avoid inline styles.
3. Keep spacing consistent.
4. Use utility composition.

---

# shadcn/ui Component Plan

## Essential Components

Install first:

```bash
button
card
dialog
dropdown-menu
form
input
label
select
sheet
skeleton
table
tabs
textarea
toast
tooltip
calendar
popover
command
badge
avatar
```

---

# Table Strategy

Use TanStack Table.

Features:

* sorting
* filtering
* pagination
* row selection
* export support

Create reusable:

```txt
DataTable
```

that all modules use.

---

# Caching Strategy

## Next.js Cache

Use:

```ts
revalidatePath()
revalidateTag()
```

Tag examples:

```txt
employees
leave-requests
payroll
attendance
```

---

# File Upload Strategy

## Documents

Use UploadThing or Supabase Storage.

Allowed uploads:

* PDF
* DOCX
* PNG
* JPG

Store metadata in DB.

Never store files directly in PostgreSQL.

---

# Email Architecture

## React Email Templates

Templates:

* onboarding
* leave approval
* payroll notification
* password reset

Use Resend for delivery.

---

# Reporting Architecture

## Reports

Generate:

* attendance summaries
* leave analytics
* payroll exports
* department statistics

Export:

* PDF
* Excel
* CSV

---

# Search Architecture

## Global Search

Use PostgreSQL full-text search initially.

Searchable:

* employees
* departments
* leave requests
* payroll records

Upgrade later:

* Meilisearch
* Elasticsearch

---

# Background Jobs

## Use Jobs For

* payroll generation
* scheduled emails
* reminders
* monthly reports
* leave balance resets

Recommended:

* Trigger.dev
* Inngest

---

# Security Rules

## Mandatory Security

1. CSRF protection.
2. Rate limiting.
3. Input validation.
4. File upload validation.
5. Secure headers.
6. SQL injection protection via Prisma.
7. Audit sensitive actions.
8. Encrypt secrets.
9. Environment variable validation.
10. Session expiration policies.

---

# Environment Variables

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
UPLOADTHING_SECRET=
```

Validate using Zod at startup.

---

# Performance Rules

1. Paginate everything.
2. Avoid loading huge datasets.
3. Use database indexes.
4. Use streaming for heavy dashboards.
5. Lazy-load charts.
6. Optimize images.
7. Avoid unnecessary client components.

---

# Error Handling Strategy

## UI

* Toasts for mutations
* Error boundaries
* Empty states
* Retry buttons

## Server

* Structured errors
* Sentry logging
* Transaction rollback

---

# Testing Strategy

## Unit Testing

Use:

* Vitest
* Testing Library

Test:

* validation
* utilities
* business logic
* permissions

## E2E Testing

Use Playwright.

Test:

* login
* leave approvals
* payroll generation
* employee CRUD

---

# CI/CD Pipeline

## GitHub Actions

Steps:

1. Install dependencies
2. Lint
3. Type check
4. Run tests
5. Prisma generate
6. Build app
7. Deploy

---

# Deployment Architecture

## Recommended

| Service      | Platform                  |
| ------------ | ------------------------- |
| Frontend     | Vercel                    |
| Database     | Neon / Supabase / Railway |
| File Storage | Supabase Storage          |
| Email        | Resend                    |
| Monitoring   | Sentry                    |

---

# Step-by-Step Implementation Plan

# Phase 0 — Project Initialization

## Step 1: Create Project

```bash
npx create-next-app@latest
```

Enable:

* TypeScript
* App Router
* ESLint
* Tailwind

---

## Step 2: Install Core Dependencies

```bash
npm install prisma @prisma/client
npm install next-auth
npm install zod react-hook-form
npm install @hookform/resolvers
npm install lucide-react
npm install sonner
npm install recharts
npm install @tanstack/react-table
```

---

## Step 3: Initialize Prisma

```bash
npx prisma init
```

---

## Step 4: Configure Tailwind CSS 4

Set up:

* global styles
* CSS variables
* theme tokens

---

## Step 5: Install shadcn/ui

```bash
npx shadcn@latest init
```

Install base components.

---

# Phase 1 — Foundation

## Step 6: Configure Database

Create:

* User
* Employee
* Department
* AuditLog

Run migrations.

---

## Step 7: Configure Authentication

Implement:

* login
* middleware
* protected routes
* role checks

---

## Step 8: Build Layout System

Create:

* dashboard shell
* sidebar
* top navigation
* breadcrumbs
* mobile navigation

---

# Phase 2 — Employee Module

## Step 9: Employee CRUD

Build:

* create employee
* edit employee
* employee profile
* employee list

Add:

* pagination
* filtering
* searching

---

## Step 10: Department Module

Build:

* department CRUD
* manager assignment
* department analytics

---

# Phase 3 — Leave Management

## Step 11: Leave Policies

Create:

* leave types
* yearly balances
* carry-over logic

---

## Step 12: Leave Workflow

Implement:

* apply leave
* approve/reject
* notifications
* audit logs
* calendar integration

---

# Phase 4 — Attendance

## Step 13: Attendance Tracking

Build:

* clock in/out
* attendance reports
* lateness detection
* attendance corrections

---

# Phase 5 — Payroll

## Step 14: Salary Structures

Implement:

* base salary
* deductions
* bonuses
* tax handling

---

## Step 15: Payroll Processing

Build:

* payroll generation
* payslips
* exports
* approvals

---

# Phase 6 — Reporting & Analytics

## Step 16: Dashboards

Create:

* HR dashboard
* employee dashboard
* manager dashboard

---

## Step 17: Reports

Build:

* PDF exports
* Excel exports
* analytics charts

---

# Phase 7 — Production Hardening

## Step 18: Monitoring

Add:

* Sentry
* logging
* analytics

---

## Step 19: Testing

Add:

* unit tests
* E2E tests
* accessibility testing

---

## Step 20: Deployment

Deploy:

* Vercel
* PostgreSQL provider
* storage
* email

Configure:

* backups
* environment variables
* monitoring

---

# Recommended Development Order

1. Authentication
2. Employees
3. Departments
4. Leave
5. Attendance
6. Payroll
7. Reporting
8. Notifications
9. Analytics
10. Background jobs

---

# Long-Term Scaling Recommendations

## After MVP

Consider:

* Multi-tenant architecture
* Permission-based access control
* Real-time notifications
* Event-driven architecture
* CQRS for payroll
* Dedicated reporting service
* AI-assisted HR insights
* Mobile app
* Public employee portal

---

# Final Recommended Principles

## Always Optimize For

1. Maintainability
2. Type safety
3. Predictable architecture
4. Fast developer experience
5. Secure defaults
6. Reusable UI
7. Consistent business logic
8. Database integrity
9. Performance
10. Auditability

---

# Recommended First Week Roadmap

## Day 1

* Initialize project
* Install dependencies
* Configure Prisma
* Configure auth

## Day 2

* Build layouts
* Setup shadcn/ui
* Configure middleware

## Day 3

* Employee schema
* Employee CRUD
* Tables

## Day 4

* Departments
* Search/filter system

## Day 5

* Leave system foundation
* Notifications
* Audit logging

## Day 6

* Dashboard widgets
* Charts
* Analytics

## Day 7

* Refactoring
* Testing
* Deployment prep
