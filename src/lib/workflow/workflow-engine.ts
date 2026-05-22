import { PrismaClient } from '@prisma/client';
import { ApproverType, WorkflowStatus, ApprovalActionType } from '@prisma/client';
import { AuditLogService } from '@/lib/audit/audit-log';

const prisma = new PrismaClient();

export interface WorkflowStepConfig {
  order: number;
  name: string;
  description?: string;
  approverType: ApproverType;
  approverRole?: string;
  approverId?: string;
  isOptional?: boolean;
  allowDelegation?: boolean;
}

export interface WorkflowTemplateConfig {
  name: string;
  description?: string;
  entityType: string;
  steps: WorkflowStepConfig[];
}

export class WorkflowEngine {
  /**
   * Create a new workflow template
   */
  static async createTemplate(config: WorkflowTemplateConfig) {
    return await prisma.workflowTemplate.create({
      data: {
        name: config.name,
        description: config.description,
        entityType: config.entityType,
        steps: {
          create: config.steps.map((step) => ({
            order: step.order,
            name: step.name,
            description: step.description,
            approverType: step.approverType,
            approverRole: step.approverRole,
            approverId: step.approverId,
            isOptional: step.isOptional || false,
            allowDelegation: step.allowDelegation || false,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  /**
   * Get active template for an entity type
   */
  static async getActiveTemplate(entityType: string) {
    return await prisma.workflowTemplate.findFirst({
      where: { entityType, isActive: true },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  /**
   * Initialize a workflow instance for an entity
   */
  static async initializeWorkflow(
    entityType: string,
    entityId: string,
    initiatedBy: string
  ) {
    const template = await this.getActiveTemplate(entityType);
    if (!template) {
      throw new Error(`No active workflow template found for ${entityType}`);
    }

    const instance = await prisma.workflowInstance.create({
      data: {
        templateId: template.id,
        entityType,
        entityId,
        currentStep: 1,
        status: WorkflowStatus.ACTIVE,
        initiatedBy,
      },
      include: { template: { include: { steps: { orderBy: { order: 'asc' } } } } },
    });

    // Log workflow initiation
    await AuditLogService.logWorkflowInitiated(
      entityType,
      entityId,
      instance.id,
      template.name
    );

    return instance;
  }

  /**
   * Get the current approver for a workflow instance
   */
  static async getCurrentApprover(instanceId: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { template: { include: { steps: { orderBy: { order: 'asc' } } } } },
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    const currentStep = instance.template.steps.find(
      (step) => step.order === instance.currentStep
    );

    if (!currentStep) {
      throw new Error('Current step not found');
    }

    return this.resolveApprover(currentStep, instance.entityId, instance.entityType);
  }

  /**
   * Resolve the approver based on step configuration
   */
  private static async resolveApprover(
    step: any,
    entityId: string,
    entityType: string
  ): Promise<string> {
    switch (step.approverType) {
      case ApproverType.SPECIFIC_USER:
        if (!step.approverId) {
          throw new Error('Specific user approver type requires approverId');
        }
        return step.approverId;

      case ApproverType.ROLE:
        if (!step.approverRole) {
          throw new Error('Role approver type requires approverRole');
        }
        const userWithRole = await prisma.user.findFirst({
          where: { role: step.approverRole as any },
        });
        if (!userWithRole) {
          throw new Error(`No user found with role ${step.approverRole}`);
        }
        return userWithRole.id;

      case ApproverType.LINE_MANAGER:
        if (entityType === 'LEAVE_REQUEST' || entityType === 'REQUISITION') {
          const entity = await prisma.employee.findUnique({
            where: { id: entityId },
            select: { lineManagerId: true },
          });
          if (!entity?.lineManagerId) {
            throw new Error('Employee has no line manager assigned');
          }
          return entity.lineManagerId;
        }
        throw new Error('Line manager approver type not supported for this entity type');

      case ApproverType.DEPARTMENT_HEAD:
        if (entityType === 'LEAVE_REQUEST' || entityType === 'REQUISITION') {
          const entity = await prisma.employee.findUnique({
            where: { id: entityId },
            include: { department: true },
          });
          if (!entity?.department?.managerId) {
            throw new Error('Department has no manager assigned');
          }
          return entity.department.managerId;
        }
        throw new Error('Department head approver type not supported for this entity type');

      default:
        throw new Error(`Unknown approver type: ${step.approverType}`);
    }
  }

  /**
   * Approve a workflow step
   */
  static async approveStep(
    instanceId: string,
    approverId: string,
    comment?: string
  ) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { template: { include: { steps: { orderBy: { order: 'asc' } } } } },
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    if (instance.status !== WorkflowStatus.ACTIVE) {
      throw new Error('Workflow is not active');
    }

    const currentStep = instance.template.steps.find(
      (step) => step.order === instance.currentStep
    );

    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // Verify approver
    const resolvedApproverId = await this.resolveApprover(
      currentStep,
      instance.entityId,
      instance.entityType
    );

    if (resolvedApproverId !== approverId) {
      throw new Error('User is not authorized to approve this step');
    }

    // Record approval action
    await prisma.approvalAction.create({
      data: {
        instanceId,
        stepId: currentStep.id,
        approverId,
        action: ApprovalActionType.APPROVED,
        comment,
        previousStatus: instance.status,
        newStatus: instance.status,
      },
    });

    // Log workflow approval
    await AuditLogService.logWorkflowApproval(
      instance.entityType,
      instance.entityId,
      instanceId,
      currentStep.name,
      approverId,
      comment
    );

    // Move to next step or complete
    const nextStep = instance.template.steps.find(
      (step) => step.order === instance.currentStep + 1
    );

    if (nextStep) {
      // Move to next step
      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { currentStep: instance.currentStep + 1 },
      });
    } else {
      // Complete workflow
      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: WorkflowStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Log workflow completion
      await AuditLogService.logWorkflowCompleted(
        instance.entityType,
        instance.entityId,
        instanceId
      );
    }

    return instance;
  }

  /**
   * Reject a workflow
   */
  static async rejectWorkflow(
    instanceId: string,
    approverId: string,
    comment?: string
  ) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { template: { include: { steps: { orderBy: { order: 'asc' } } } } },
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    if (instance.status !== WorkflowStatus.ACTIVE) {
      throw new Error('Workflow is not active');
    }

    const currentStep = instance.template.steps.find(
      (step) => step.order === instance.currentStep
    );

    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // Verify approver
    const resolvedApproverId = await this.resolveApprover(
      currentStep,
      instance.entityId,
      instance.entityType
    );

    if (resolvedApproverId !== approverId) {
      throw new Error('User is not authorized to reject this workflow');
    }

    // Record rejection action
    await prisma.approvalAction.create({
      data: {
        instanceId,
        stepId: currentStep.id,
        approverId,
        action: ApprovalActionType.REJECTED,
        comment,
        previousStatus: instance.status,
        newStatus: WorkflowStatus.CANCELLED,
      },
    });

    // Log workflow rejection
    await AuditLogService.logWorkflowRejection(
      instance.entityType,
      instance.entityId,
      instanceId,
      currentStep.name,
      approverId,
      comment
    );

    // Cancel workflow
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: WorkflowStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    return instance;
  }

  /**
   * Get workflow history
   */
  static async getWorkflowHistory(instanceId: string) {
    return await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        actions: {
          orderBy: { actedAt: 'asc' },
        },
        template: {
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Get pending approvals for a user
   */
  static async getPendingApprovals(userId: string) {
    const instances = await prisma.workflowInstance.findMany({
      where: {
        status: WorkflowStatus.ACTIVE,
      },
      include: {
        template: {
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    const pendingApprovals = [];

    for (const instance of instances) {
      const currentStep = instance.template.steps.find(
        (step) => step.order === instance.currentStep
      );

      if (currentStep) {
        try {
          const approverId = await this.resolveApprover(
            currentStep,
            instance.entityId,
            instance.entityType
          );

          if (approverId === userId) {
            pendingApprovals.push({
              instance,
              currentStep,
            });
          }
        } catch (error) {
          // Skip if approver resolution fails
          continue;
        }
      }
    }

    return pendingApprovals;
  }
}
