import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MerchantApplication } from '../src/modules/merchant-applications/domain/merchant-application.js';
import { ApplicationStatus } from '../src/modules/merchant-applications/domain/application-status.enum.js';
import { RiskStatus } from '../src/modules/merchant-applications/domain/risk-status.enum.js';
import { GetApplicationUseCase } from '../src/modules/merchant-applications/application/use-cases/get-application.use-case.js';
import { ListApplicationsUseCase } from '../src/modules/merchant-applications/application/use-cases/list-applications.use-case.js';
import { RecordDecisionUseCase } from '../src/modules/merchant-applications/application/use-cases/record-decision.use-case.js';
import { UpdateApplicationUseCase } from '../src/modules/merchant-applications/application/use-cases/update-application.use-case.js';
import { Role } from '../src/modules/identity/domain/role.enum.js';

function makeApp(overrides: Partial<Parameters<typeof MerchantApplication.reconstitute>[0]> = {}) {
  return MerchantApplication.reconstitute({
    id: 'app-1',
    createdById: 'sales-user-1',
    assignedReviewerId: null,
    status: ApplicationStatus.DRAFT,
    riskStatus: null,
    submissionCount: 0,
    businessName: 'Acme',
    legalBusinessName: 'Acme LLC',
    businessType: 'LLC',
    country: 'US',
    mcc: '5411',
    monthlyVolume: 10000,
    ownerInfo: null,
    bankAccountNumber: null,
    routingNumber: null,
    riskScore: null,
    riskReasons: null,
    riskReference: null,
    riskCheckedAt: null,
    submittedAt: null,
    decidedAt: null,
    decisionNotes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1,
    ...overrides,
  });
}

function makeUnderReview(overrides = {}) {
  return makeApp({
    status: ApplicationStatus.UNDER_REVIEW,
    riskStatus: RiskStatus.APPROVED,
    submissionCount: 1,
    submittedAt: new Date(),
    riskReference: 'ref-1',
    riskCheckedAt: new Date(),
    ...overrides,
  });
}

describe('SALES object-level isolation', () => {
  let repo: ReturnType<typeof makeRepoMock>;

  function makeRepoMock() {
    return {
      findById: vi.fn(),
      findByIdAndOwner: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      submit: vi.fn(),
      listAll: vi.fn(),
      listAllPaginated: vi.fn(),
      listByOwner: vi.fn(),
      listByOwnerPaginated: vi.fn(),
      listByStatus: vi.fn(),
      listByStatusPaginated: vi.fn(),
      findStalledApplications: vi.fn(),
      recordRiskAssessment: vi.fn(),
      markRiskReviewFailed: vi.fn(),
    };
  }

  beforeEach(() => {
    repo = makeRepoMock();
  });

  describe('GetApplicationUseCase', () => {
    it('SALES user can read their own application', async () => {
      const app = makeApp({ createdById: 'sales-1' });
      repo.findByIdAndOwner.mockResolvedValue(app);
      const uc = new GetApplicationUseCase(repo as any);
      const result = await uc.execute('app-1', 'sales-1', Role.SALES);
      expect(result).toBe(app);
      expect(repo.findByIdAndOwner).toHaveBeenCalledWith('app-1', 'sales-1');
    });

    it('SALES user cannot read another user\'s application — returns 404', async () => {
      repo.findByIdAndOwner.mockResolvedValue(null);
      const uc = new GetApplicationUseCase(repo as any);
      await expect(uc.execute('app-1', 'sales-other', Role.SALES)).rejects.toThrow(NotFoundException);
    });

    it('REVIEWER can read any application', async () => {
      const app = makeApp({ createdById: 'sales-1' });
      repo.findById.mockResolvedValue(app);
      const uc = new GetApplicationUseCase(repo as any);
      const result = await uc.execute('app-1', 'reviewer-1', Role.REVIEWER);
      expect(result).toBe(app);
      expect(repo.findById).toHaveBeenCalledWith('app-1');
    });

    it('ADMIN can read any application', async () => {
      const app = makeApp({ createdById: 'sales-1' });
      repo.findById.mockResolvedValue(app);
      const uc = new GetApplicationUseCase(repo as any);
      const result = await uc.execute('app-1', 'admin-1', Role.ADMIN);
      expect(result).toBe(app);
    });

    it('returns 404 when application does not exist for ADMIN', async () => {
      repo.findById.mockResolvedValue(null);
      const uc = new GetApplicationUseCase(repo as any);
      await expect(uc.execute('nonexistent', 'admin-1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('UpdateApplicationUseCase', () => {
    it('SALES user cannot update another user\'s application', async () => {
      repo.findByIdAndOwner.mockResolvedValue(null);
      const { UpdateApplicationUseCase } = await import('../src/modules/merchant-applications/application/use-cases/update-application.use-case.js');
      const uc = new UpdateApplicationUseCase(repo as any);
      await expect(uc.execute('app-1', 'sales-other', { businessName: 'Evil Corp' })).rejects.toThrow(NotFoundException);
    });

    it('SALES user can update their own application', async () => {
      const app = makeApp({ createdById: 'sales-1' });
      repo.findByIdAndOwner.mockResolvedValue(app);
      repo.save.mockResolvedValue(app);
      const { UpdateApplicationUseCase } = await import('../src/modules/merchant-applications/application/use-cases/update-application.use-case.js');
      const uc = new UpdateApplicationUseCase(repo as any);
      const result = await uc.execute('app-1', 'sales-1', { businessName: 'New Name' });
      expect(result).toBeDefined();
    });
  });

  describe('ListApplicationsUseCase', () => {
    const opts = { page: 1, limit: 20 };

    it('SALES users only see their own applications', async () => {
      repo.listByOwnerPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
      const uc = new ListApplicationsUseCase(repo as any);
      await uc.execute('sales-1', Role.SALES, opts);
      expect(repo.listByOwnerPaginated).toHaveBeenCalledWith('sales-1', opts);
      expect(repo.listAllPaginated).not.toHaveBeenCalled();
    });

    it('REVIEWER users see UNDER_REVIEW applications', async () => {
      repo.listByStatusPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
      const uc = new ListApplicationsUseCase(repo as any);
      await uc.execute('reviewer-1', Role.REVIEWER, opts);
      expect(repo.listByStatusPaginated).toHaveBeenCalledWith(ApplicationStatus.UNDER_REVIEW, opts);
    });

    it('ADMIN users see all applications', async () => {
      repo.listAllPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
      const uc = new ListApplicationsUseCase(repo as any);
      await uc.execute('admin-1', Role.ADMIN, opts);
      expect(repo.listAllPaginated).toHaveBeenCalledWith(opts);
    });

    it('REVIEWER uses provided status filter if given', async () => {
      repo.listByStatusPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
      const uc = new ListApplicationsUseCase(repo as any);
      await uc.execute('reviewer-1', Role.REVIEWER, { ...opts, status: ApplicationStatus.UNDER_REVIEW });
      expect(repo.listByStatusPaginated).toHaveBeenCalledWith(ApplicationStatus.UNDER_REVIEW, expect.objectContaining({ status: ApplicationStatus.UNDER_REVIEW }));
    });
  });

  describe('RecordDecisionUseCase - assigned reviewer enforcement', () => {
    function makeAuditRepoMock() {
      return { create: vi.fn().mockResolvedValue(undefined), findByEntityId: vi.fn() };
    }

    it('assigned reviewer can record a decision', async () => {
      const app = makeUnderReview({ assignedReviewerId: 'reviewer-1' });
      repo.findById.mockResolvedValue(app);
      repo.save.mockImplementation(async (a: MerchantApplication) => a);
      const uc = new RecordDecisionUseCase(repo as any, makeAuditRepoMock() as any);
      const result = await uc.execute('app-1', 'reviewer-1', 'APPROVED', 'All good');
      expect(result.status).toBe(ApplicationStatus.APPROVED);
    });

    it('non-assigned reviewer is blocked with ForbiddenException', async () => {
      const app = makeUnderReview({ assignedReviewerId: 'reviewer-1' });
      repo.findById.mockResolvedValue(app);
      const uc = new RecordDecisionUseCase(repo as any, makeAuditRepoMock() as any);
      await expect(uc.execute('app-1', 'reviewer-2', 'APPROVED')).rejects.toThrow(ForbiddenException);
    });

    it('any reviewer can decide when no reviewer is assigned', async () => {
      const app = makeUnderReview({ assignedReviewerId: null });
      repo.findById.mockResolvedValue(app);
      repo.save.mockImplementation(async (a: MerchantApplication) => a);
      const uc = new RecordDecisionUseCase(repo as any, makeAuditRepoMock() as any);
      const result = await uc.execute('app-1', 'any-reviewer', 'REJECTED', 'Nope');
      expect(result.status).toBe(ApplicationStatus.REJECTED);
    });

    it('throws NotFoundException when application does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      const uc = new RecordDecisionUseCase(repo as any, makeAuditRepoMock() as any);
      await expect(uc.execute('nonexistent', 'reviewer-1', 'APPROVED')).rejects.toThrow(NotFoundException);
    });
  });
});
