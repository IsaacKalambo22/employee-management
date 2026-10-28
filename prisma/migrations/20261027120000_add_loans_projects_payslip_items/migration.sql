-- CreateEnum
CREATE TYPE "PayslipItemType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'FINANCE_OFFICER';

-- AlterTable
ALTER TABLE "Requisition" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "proposedBudget" DECIMAL(65,30) NOT NULL,
    "approvedBudget" DECIMAL(65,30),
    "spentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "proposedById" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipItem" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "type" "PayslipItemType" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayslipItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyInstallment" DECIMAL(65,30) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "deductionId" TEXT,
    "repaymentStart" TIMESTAMP(3),
    "repaymentEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_departmentId_fiscalYear_idx" ON "Project"("departmentId", "fiscalYear");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "PayslipItem_payslipId_idx" ON "PayslipItem"("payslipId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_deductionId_key" ON "LoanApplication"("deductionId");

-- CreateIndex
CREATE INDEX "LoanApplication_employeeId_idx" ON "LoanApplication"("employeeId");

-- CreateIndex
CREATE INDEX "LoanApplication_status_idx" ON "LoanApplication"("status");

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipItem" ADD CONSTRAINT "PayslipItem_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

