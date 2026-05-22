# HR Management System

A comprehensive HR management system built with Next.js 16, featuring employee management, leave management, requisitions, attendance tracking, payroll processing, and advanced workflow automation.

## 🚀 Features

### Core HR Modules
- **Employee Management**: Full CRUD operations with document storage and hierarchy support
- **Leave Management**: Multi-level approval workflow with grade-based entitlement automation
- **Requisition System**: Budget-aware requisition processing with LPO generation
- **Attendance Tracking**: Clock in/out system with late detection
- **Payroll Processing**: Salary management, deductions, and payslip generation with self-service access

### Advanced Workflow Engine
- **Multi-Level Approvals**: Configurable workflow templates for leave, requisitions, and payroll
- **Dynamic Approvers**: Support for specific users, roles, line managers, and department heads
- **Workflow Visualization**: Real-time status tracking with visual progress indicators
- **Approval Timeline**: Complete audit trail with comments and timestamps
- **Delegation Support**: Optional approval delegation capability

### Leave Entitlement Automation
- **Grade-Based Allocation**: Automatic leave allocation based on employee grade
  - Grade 9-8: 20 days annual leave
  - Grade 7-3: 32 days annual leave
- **Carry-Over Calculation**: Automatic calculation of carried-over leave
- **Balance Management**: Real-time balance updates on approval/rejection
- **Yearly Initialization**: Automated yearly balance reset and allocation

### Centralized Notification System
- **Multi-Channel Support**: Email, SMS, and in-app notifications
- **Queue-Based Processing**: Reliable notification delivery with retry logic
- **Template System**: Reusable notification templates for common events
- **Event-Driven**: Automatic notifications on workflow state changes

### Role-Based Access Control
- **SUPER_ADMIN**: Full system access and configuration
- **HR_ADMIN**: Employee management, leave approvals, payroll processing
- **MANAGER**: Team management, leave/requisition approvals
- **EMPLOYEE**: Self-service access to leave, requisitions, payslips
- **FINANCE**: Budget management, requisition approvals, payroll oversight

### Analytics & Dashboards
- **HR Dashboard**: Organization-wide analytics, workflow status, budget overview
- **Manager Dashboard**: Team analytics, attendance tracking, pending approvals
- **Employee Dashboard**: Self-service widgets, leave balances, recent activity
- **Finance Dashboard**: Budget utilization, requisition analytics, payroll summary

### Audit & Compliance
- **Comprehensive Audit Logging**: All workflow actions, approvals, and state changes
- **Entity-Level Tracking**: Audit logs linked to specific entities (leave, requisition, payroll)
- **User Activity Tracking**: Complete user action history
- **Action-Based Filtering**: Query logs by action type, entity, or user

### Security & Performance
- **Rate Limiting**: 100 requests/minute per IP
- **Secure Headers**: HSTS, X-Frame-Options, CSP
- **CSRF Protection**: Same-site cookie validation
- **Input Validation**: Zod schema validation
- **Monitoring**: Sentry integration for error tracking and performance

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.5 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (JWT)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Validation**: Zod
- **Forms**: React Hook Form
- **Charts**: Recharts
- **File Storage**: Supabase Storage
- **Email**: Nodemailer
- **SMS**: Vonage
- **Testing**: Vitest (unit), Playwright (E2E)
- **Monitoring**: Sentry
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 20+ LTS
- PostgreSQL database
- Supabase account (for file storage)
- SMTP server (for emails)
- Vonage account (for SMS)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd hr-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Important:** Generate a secure NEXTAUTH_SECRET by running:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Replace the placeholder in `.env` with the generated secret.

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 5. Start the development server

```bash
npm run dev
```

**Note:** The seed script runs automatically when you start the development server. It checks if default users already exist and skips seeding if they do, displaying a message with the existing users. This ensures your database is always ready without duplicate data.

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

## 📊 Default Users

After seeding, you can log in with these test credentials:

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | admin@company.com | password123 |
| HR_ADMIN | john.smith@company.com | password123 |
| MANAGER | jane.doe@company.com | password123 |
| EMPLOYEE | mike.johnson@company.com | password123 |

**Note:** These are default test credentials for development only. Change them immediately after first login in production.

## 🚀 Production Deployment (Vercel)

### 1. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

- `DATABASE_URL`: Your Neon database connection string
- `NEXTAUTH_SECRET`: Generate a secure random string
- `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://your-project.vercel.app`)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `NEXT_PUBLIC_BUCKET_NAME`: Your storage bucket name
- (Optional) SMTP and VONAGE variables for email/SMS

### 2. Seed the Production Database

**Important:** The default users don't exist in production until you seed the database.

Run the seed script with your production environment variables:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-neon-database-url"

# Run the seed
npm run seed:prod
```

Or use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.production

# Run seed
npm run seed:prod
```

### 3. Deploy to Vercel

```bash
vercel --prod
```

After deployment, you can log in with the default credentials listed above.

## 🏗️ Project Structure

```
hr-system/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # Role-specific dashboards
│   │   │   ├── hr/          # HR dashboard
│   │   │   ├── manager/     # Manager dashboard
│   │   │   ├── employee/    # Employee dashboard
│   │   │   └── finance/     # Finance dashboard
│   │   ├── leave/           # Leave management pages
│   │   ├── requisitions/    # Requisition management pages
│   │   ├── payroll/         # Payroll management pages
│   │   └── employees/       # Employee management pages
│   ├── components/          # React components
│   │   ├── workflow/        # Workflow visualization components
│   │   │   ├── workflow-status.tsx
│   │   │   └── workflow-timeline.tsx
│   │   ├── analytics/       # Analytics chart components
│   │   ├── ui/              # shadcn/ui components
│   │   └── ...
│   ├── lib/                 # Utility functions and configurations
│   │   ├── actions/         # Server actions
│   │   │   ├── leaves.ts    # Leave management actions
│   │   │   ├── requisitions.ts # Requisition actions
│   │   │   ├── payroll.ts   # Payroll actions
│   │   │   └── analytics.ts # Analytics functions
│   │   ├── workflow/        # Workflow engine
│   │   │   ├── workflow-engine.ts
│   │   │   └── leave-entitlement.ts
│   │   ├── notifications/   # Notification service
│   │   │   └── notification-service.ts
│   │   ├── audit/           # Audit logging
│   │   │   └── audit-log.ts
│   │   ├── auth/            # Authentication configuration
│   │   ├── db/              # Prisma client
│   │   ├── email/           # Email templates
│   │   ├── sms/             # SMS templates
│   │   └── permissions.ts   # Role-based permissions
│   └── proxy.ts             # Next.js proxy (middleware replacement)
├── prisma/
│   ├── schema.prisma        # Database schema with workflow models
│   └── seed.mjs            # Database seed data
├── e2e/                     # Playwright E2E tests
├── src/lib/actions/__tests__/ # Vitest unit tests
└── public/                  # Static assets
```

## 🔒 Security Features

- Rate limiting (100 requests/minute per IP)
- Secure headers (HSTS, X-Frame-Options, CSP)
- CSRF protection with same-site cookies
- Role-based access control
- Comprehensive audit logging for all workflow actions
- Input validation with Zod

## 🏛️ Services & Architecture

### Workflow Engine (`src/lib/workflow/workflow-engine.ts`)

The workflow engine provides a flexible, template-based approval system:

```typescript
// Create a workflow template
await WorkflowEngine.createTemplate({
  name: "Leave Approval",
  entityType: "LEAVE_REQUEST",
  steps: [
    { order: 1, name: "Manager Approval", approverType: ApproverType.LINE_MANAGER },
    { order: 2, name: "HR Approval", approverType: ApproverType.ROLE, approverRole: "HR_ADMIN" }
  ]
})

// Initialize workflow for an entity
const instance = await WorkflowEngine.initializeWorkflow(
  "LEAVE_REQUEST",
  leaveRequestId,
  userId
)

// Approve a step
await WorkflowEngine.approveStep(instanceId, approverId, "Approved")

// Reject workflow
await WorkflowEngine.rejectWorkflow(instanceId, approverId, "Reason")
```

### Leave Entitlement Service (`src/lib/workflow/leave-entitlement.ts`)

Automates leave balance management based on employee grade:

```typescript
// Get or create leave balance
const balance = await LeaveEntitlementService.getOrCreateLeaveBalance(
  employeeId,
  policyId,
  year
)

// Update balance on approval
await LeaveEntitlementService.updateBalanceOnApproval(leaveRequestId)

// Update balance on cancellation
await LeaveEntitlementService.updateBalanceOnCancellation(leaveRequestId)

// Initialize yearly balances
await LeaveEntitlementService.initializeYearlyBalances(year)
```

### Notification Service (`src/lib/notifications/notification-service.ts`)

Centralized notification system with multi-channel support:

```typescript
// Queue a notification
await NotificationService.queueNotification({
  recipientId: userId,
  type: NotificationType.LEAVE_APPROVED,
  channel: NotificationChannel.EMAIL,
  subject: "Leave Approved",
  message: "Your leave request has been approved",
  metadata: { leaveRequestId }
})

// Process notification queue
await NotificationService.processQueue()

// Send leave-specific notifications
await NotificationService.notifyLeaveSubmission(managerId, employeeName, details)
await NotificationService.notifyLeaveApproval(employeeId, approverEmail, details)
await NotificationService.notifyLeaveRejection(employeeId, approverEmail, reason)
```

### Audit Log Service (`src/lib/audit/audit-log.ts`)

Comprehensive audit logging for compliance and tracking:

```typescript
// Log workflow actions
await AuditLogService.logWorkflowInitiated(entityType, entityId, instanceId, templateName)
await AuditLogService.logWorkflowApproval(entityType, entityId, instanceId, stepName, approverId, comment)
await AuditLogService.logWorkflowRejection(entityType, entityId, instanceId, stepName, approverId, reason)
await AuditLogService.logWorkflowCompleted(entityType, entityId, instanceId)

// Log leave actions
await AuditLogService.logLeaveRequestCreated(leaveRequestId, employeeId, leaveType, startDate, endDate, days)
await AuditLogService.logLeaveRequestApproved(leaveRequestId, approverId, comment)
await AuditLogService.logLeaveRequestRejected(leaveRequestId, approverId, reason)

// Log requisition actions
await AuditLogService.logRequisitionCreated(requisitionId, employeeId, category, amount)
await AuditLogService.logRequisitionApproved(requisitionId, approverId, stepName, comment)

// Log payroll actions
await AuditLogService.logPayrollProcessed(payrollId, period, employeeCount, totalAmount)

// Query audit logs
const logs = await AuditLogService.getEntityAuditLogs("LEAVE_REQUEST", leaveRequestId)
const userLogs = await AuditLogService.getUserAuditLogs(userId)
const actionLogs = await AuditLogService.getAuditLogsByAction(AuditAction.WORKFLOW_APPROVED)
```

### Analytics Service (`src/lib/actions/analytics.ts`)

Role-specific analytics functions for dashboards:

```typescript
// HR Dashboard
const hrAnalytics = await getHRDashboardAnalytics()
// Returns: employee, attendance, leave, requisition, workflow, budget, pendingActions

// Manager Dashboard
const managerAnalytics = await getManagerDashboardAnalytics()
// Returns: team, leave, requisition

// Employee Dashboard
const employeeAnalytics = await getEmployeeDashboardAnalytics()
// Returns: leaveBalances, attendance, recentLeaveRequests, recentRequisitions, recentPayslips

// Finance Dashboard
const financeAnalytics = await getFinanceDashboardAnalytics()
// Returns: budget, requisition, payroll, pendingFinanceApprovals
```

### UI Components

#### Workflow Status Component (`src/components/workflow/workflow-status.tsx`)

Visualizes workflow progress with step-by-step status indicators:

```typescript
<WorkflowStatus
  steps={[
    { id: "1", name: "Manager Approval", status: "COMPLETED", approver: "John Doe", completedAt: new Date() },
    { id: "2", name: "HR Approval", status: "IN_PROGRESS", approver: "Jane Smith" },
    { id: "3", name: "Finance Review", status: "PENDING" }
  ]}
  currentStatus="IN_PROGRESS"
/>
```

#### Workflow Timeline Component (`src/components/workflow/workflow-timeline.tsx`)

Displays approval history with avatars and comments:

```typescript
<WorkflowTimeline
  actions={[
    {
      id: "1",
      action: "APPROVED",
      approverName: "John Doe",
      approverEmail: "john@company.com",
      comments: "Approved as requested",
      createdAt: new Date(),
      stepName: "Manager Approval"
    }
  ]}
  entityType="LEAVE_REQUEST"
  entityId="leave-123"
/>
```

## 📈 Monitoring

The system integrates with Sentry for:
- Error tracking
- Performance monitoring
- Session replay
- Log aggregation

## 🚀 Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

See `vercel.json` for deployment configuration.

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software.
