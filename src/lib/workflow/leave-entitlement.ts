import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Leave Entitlement Service
 * 
 * Business Rules:
 * - Grade 9 and Grade 8: 20 days annual leave
 * - Grade 7 to Grade 3: 32 days annual leave
 */

export class LeaveEntitlementService {
  /**
   * Get leave days entitlement based on employee grade
   */
  static getLeaveDaysByGrade(grade: string | null | undefined): number {
    if (!grade) {
      // Default to 20 days if no grade is assigned
      return 20;
    }

    const gradeNum = parseInt(grade);

    // Grade 9 and Grade 8: 20 days
    if (gradeNum >= 8) {
      return 20;
    }

    // Grade 7 to Grade 3: 32 days
    if (gradeNum >= 3 && gradeNum <= 7) {
      return 32;
    }

    // Default for other grades
    return 20;
  }

  /**
   * Get or create leave balance for an employee
   */
  static async getOrCreateLeaveBalance(
    employeeId: string,
    policyId: string,
    year: number
  ) {
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_policyId_year: {
          employeeId,
          policyId,
          year,
        },
      },
    });

    if (!balance) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { grade: true },
      });

      const policy = await prisma.leavePolicy.findUnique({
        where: { id: policyId },
      });

      if (!policy) {
        throw new Error('Leave policy not found');
      }

      // Use policy-specific days if grade is specified in policy
      let allocatedDays = policy.daysPerYear;
      
      if (policy.grade) {
        // Check if employee grade matches policy grade
        if (employee?.grade && this.gradeMatchesPolicy(employee.grade, policy.grade)) {
          allocatedDays = policy.daysPerYear;
        } else {
          // Use grade-based calculation
          allocatedDays = this.getLeaveDaysByGrade(employee?.grade);
        }
      } else {
        // No grade-specific policy, use employee grade
        allocatedDays = this.getLeaveDaysByGrade(employee?.grade);
      }

      balance = await prisma.leaveBalance.create({
        data: {
          employeeId,
          policyId,
          year,
          allocated: allocatedDays,
          used: 0,
          pending: 0,
          carriedOver: 0,
        },
      });
    }

    return balance;
  }

  /**
   * Check if employee grade matches policy grade specification
   */
  private static gradeMatchesPolicy(employeeGrade: string, policyGrade: string): boolean {
    // Handle range notation like "7-3"
    if (policyGrade.includes('-')) {
      const [min, max] = policyGrade.split('-').map(Number);
      const empGradeNum = parseInt(employeeGrade);
      return empGradeNum >= min && empGradeNum <= max;
    }

    // Exact match
    return employeeGrade === policyGrade;
  }

  /**
   * Calculate carry-over from previous year
   */
  static async calculateCarryOver(employeeId: string, policyId: string, fromYear: number, toYear: number) {
    const previousBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_policyId_year: {
          employeeId,
          policyId,
          year: fromYear,
        },
      },
    });

    if (!previousBalance) {
      return 0;
    }

    const policy = await prisma.leavePolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy || !policy.carryOver) {
      return 0;
    }

    const remainingDays = previousBalance.allocated - previousBalance.used - previousBalance.pending;
    const maxCarryOver = policy.maxCarryOver;

    return Math.min(remainingDays, maxCarryOver);
  }

  /**
   * Initialize leave balances for a new year
   */
  static async initializeYearlyBalances(year: number) {
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true },
    });

    const policies = await prisma.leavePolicy.findMany();

    const results = [];

    for (const employee of employees) {
      for (const policy of policies) {
        try {
          // Calculate carry-over from previous year
          const carriedOver = await this.calculateCarryOver(
            employee.id,
            policy.id,
            year - 1,
            year
          );

          // Get or create balance for current year
          const balance = await this.getOrCreateLeaveBalance(
            employee.id,
            policy.id,
            year
          );

          // Update with carry-over
          if (carriedOver > 0) {
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: {
                carriedOver,
                allocated: balance.allocated + carriedOver,
              },
            });
          }

          results.push({
            employee: `${employee.firstName} ${employee.lastName}`,
            policy: policy.name,
            allocated: balance.allocated,
            carriedOver,
          });
        } catch (error) {
          console.error(`Error initializing balance for employee ${employee.id}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Update leave balance when request is approved
   */
  static async updateBalanceOnApproval(requestId: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { policy: true },
    });

    if (!request) {
      throw new Error('Leave request not found');
    }

    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_policyId_year: {
          employeeId: request.employeeId,
          policyId: request.policyId,
          year: request.startDate.getFullYear(),
        },
      },
    });

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    // Update pending and used
    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        pending: Math.max(0, balance.pending - request.days),
        used: balance.used + request.days,
      },
    });

    return balance;
  }

  /**
   * Update leave balance when request is cancelled
   */
  static async updateBalanceOnCancellation(requestId: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Leave request not found');
    }

    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_policyId_year: {
          employeeId: request.employeeId,
          policyId: request.policyId,
          year: request.startDate.getFullYear(),
        },
      },
    });

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    // If request was approved, return days to used
    // If request was pending, return days to pending
    if (request.status === 'APPROVED' || request.status === 'HR_APPROVED') {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: Math.max(0, balance.used - request.days),
        },
      });
    } else if (request.status === 'PENDING') {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: Math.max(0, balance.pending - request.days),
        },
      });
    }

    return balance;
  }

  /**
   * Check if employee has sufficient leave balance
   */
  static async hasSufficientBalance(
    employeeId: string,
    policyId: string,
    days: number,
    year: number
  ): Promise<boolean> {
    const balance = await this.getOrCreateLeaveBalance(employeeId, policyId, year);
    const available = balance.allocated - balance.used - balance.pending;
    return available >= days;
  }

  /**
   * Get leave balance summary for an employee
   */
  static async getLeaveBalanceSummary(employeeId: string, year: number) {
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year,
      },
      include: {
        policy: true,
      },
    });

    return balances.map((balance) => ({
      policy: balance.policy.name,
      allocated: balance.allocated,
      used: balance.used,
      pending: balance.pending,
      carriedOver: balance.carriedOver,
      remaining: balance.allocated - balance.used - balance.pending,
    }));
  }

  /**
   * Recalculate leave balances for an employee (manual adjustment)
   */
  static async recalculateBalances(employeeId: string, year: number) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { grade: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const policies = await prisma.leavePolicy.findMany();

    for (const policy of policies) {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_policyId_year: {
            employeeId,
            policyId: policy.id,
            year,
          },
        },
      });

      if (balance) {
        // Recalculate based on current grade
        const newAllocated = this.getLeaveDaysByGrade(employee.grade);
        
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            allocated: newAllocated + balance.carriedOver,
          },
        });
      }
    }

    return this.getLeaveBalanceSummary(employeeId, year);
  }
}
