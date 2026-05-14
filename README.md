# HR Management System

A comprehensive HR management system built with Next.js 16, featuring employee management, leave management, requisitions, attendance tracking, payroll processing, and more.

## 🚀 Features

- **Employee Management**: Full CRUD operations with document storage
- **Leave Management**: Multi-level approval workflow with email/SMS notifications
- **Requisition System**: Budget-aware requisition processing with LPO generation
- **Attendance Tracking**: Clock in/out system with late detection
- **Payroll Processing**: Salary management, deductions, and payslip generation
- **Role-Based Access**: SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE roles
- **Analytics Dashboard**: Role-specific dashboards with charts and reports
- **Audit Logging**: Complete audit trail for all sensitive actions
- **Notifications**: Email (SMTP) and SMS (Vonage) integration

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

After seeding, you can log in with these credentials:

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | admin@company.com | password123 |
| HR_ADMIN | john.smith@company.com | password123 |
| MANAGER | jane.doe@company.com | password123 |
| EMPLOYEE | mike.johnson@company.com | password123 |

## 🏗️ Project Structure

```
hr-system/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility functions and configurations
│   │   ├── actions/         # Server actions
│   │   ├── auth/            # Authentication configuration
│   │   ├── db/              # Prisma client
│   │   ├── email/           # Email templates
│   │   ├── sms/             # SMS templates
│   │   └── permissions.ts   # Role-based permissions
│   └── proxy.ts             # Next.js proxy (middleware replacement)
├── prisma/
│   ├── schema.prisma        # Database schema
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
- Audit logging for sensitive operations
- Input validation with Zod

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
