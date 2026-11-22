import { describe, it, expect, beforeEach } from 'vitest';
import { MerchantApplication, InvalidTransitionError, MissingRequiredFieldsError } from './merchant-application.js';
import { ApplicationStatus } from './application-status.enum.js';
import { RiskStatus } from './risk-status.enum.js';

const baseProps = {
  id: 'app-1',
  createdById: 'user-1',
  assignedReviewerId: null,
  status: ApplicationStatus.DRAFT,
  riskStatus: null,
  submissionCount: 0,
  businessName: null,
  legalBusinessName: null,
  businessType: null,
  country: null,
  mcc: null,
  monthlyVolume: null,
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
};

const filledProps = {
  ...baseProps,
  businessName: 'Acme Corp',
  legalBusinessName: 'Acme Corporation LLC',
  businessType: 'LLC',
  country: 'US',
  mcc: '5411',
  monthlyVolume: 50000,
};

function makeDraft() {
  return MerchantApplication.reconstitute({ ...baseProps });
}

function makeFilledDraft() {
  return MerchantApplication.reconstitute({ ...filledProps });
}

function makeSubmitted() {
  return MerchantApplication.reconstitute({
    ...filledProps,
    status: ApplicationStatus.SUBMITTED,
    riskStatus: RiskStatus.PENDING,
    submissionCount: 1,
    submittedAt: new Date(),
  });
}

function makeUnderReview() {
  return MerchantApplication.reconstitute({
    ...filledProps,
    status: ApplicationStatus.UNDER_REVIEW,
    riskStatus: RiskStatus.APPROVED,
    submissionCount: 1,
    submittedAt: new Date(),
    riskReference: 'ref-1',
    riskCheckedAt: new Date(),
  });
}

describe('MerchantApplication domain', () => {
  describe('submit()', () => {
    it('transitions DRAFT → SUBMITTED when all required fields are present', () => {
      const app = makeFilledDraft();
      app.submit();
      expect(app.status).toBe(ApplicationStatus.SUBMITTED);
      expect(app.riskStatus).toBe(RiskStatus.PENDING);
      expect(app.submissionCount).toBe(1);
      expect(app.submittedAt).toBeInstanceOf(Date);
    });

    it('increments submissionCount on each submit', () => {
      const app = MerchantApplication.reconstitute({
        ...filledProps,
        status: ApplicationStatus.INFO_REQUESTED,
        submissionCount: 2,
        submittedAt: new Date(),
      });
      app.submit();
      expect(app.submissionCount).toBe(3);
    });

    it('throws MissingRequiredFieldsError when required fields are absent', () => {
      const app = makeDraft();
      expect(() => app.submit()).toThrow(MissingRequiredFieldsError);
    });

    it('lists all missing fields in the error message', () => {
      const app = makeDraft();
      let err: MissingRequiredFieldsError | null = null;
      try {
        app.submit();
      } catch (e) {
        err = e as MissingRequiredFieldsError;
      }
      expect(err?.message).toContain('businessName');
      expect(err?.message).toContain('monthlyVolume');
    });

    it('throws InvalidTransitionError when already SUBMITTED', () => {
      const app = makeSubmitted();
      expect(() => app.submit()).toThrow(InvalidTransitionError);
    });

    it('throws InvalidTransitionError when APPROVED', () => {
      const app = MerchantApplication.reconstitute({
        ...filledProps,
        status: ApplicationStatus.APPROVED,
        submissionCount: 1,
        submittedAt: new Date(),
      });
      expect(() => app.submit()).toThrow(InvalidTransitionError);
    });

    it('allows re-submit from INFO_REQUESTED', () => {
      const app = MerchantApplication.reconstitute({
        ...filledProps,
        status: ApplicationStatus.INFO_REQUESTED,
        submissionCount: 1,
        submittedAt: new Date(),
      });
      expect(() => app.submit()).not.toThrow();
      expect(app.status).toBe(ApplicationStatus.SUBMITTED);
    });
  });

  describe('recordRiskAssessment()', () => {
    it('transitions SUBMITTED → UNDER_REVIEW and sets risk fields', () => {
      const app = makeSubmitted();
      const checkedAt = new Date();
      app.recordRiskAssessment(RiskStatus.APPROVED, 'ref-123', checkedAt);
      expect(app.status).toBe(ApplicationStatus.UNDER_REVIEW);
      expect(app.riskStatus).toBe(RiskStatus.APPROVED);
      expect(app.riskReference).toBe('ref-123');
      expect(app.riskCheckedAt).toBe(checkedAt);
    });

    it('throws InvalidTransitionError when not SUBMITTED', () => {
      const app = makeDraft();
      expect(() => app.recordRiskAssessment(RiskStatus.APPROVED, 'ref', new Date())).toThrow(InvalidTransitionError);
    });
  });

  describe('markRiskReviewFailed()', () => {
    it('sets riskStatus to FAILED without changing application status', () => {
      const app = makeSubmitted();
      app.markRiskReviewFailed();
      expect(app.riskStatus).toBe(RiskStatus.FAILED);
      expect(app.status).toBe(ApplicationStatus.SUBMITTED);
    });
  });

  describe('approve()', () => {
    it('transitions UNDER_REVIEW → APPROVED', () => {
      const app = makeUnderReview();
      app.approve('Looks good');
      expect(app.status).toBe(ApplicationStatus.APPROVED);
      expect(app.decidedAt).toBeInstanceOf(Date);
      expect(app.decisionNotes).toBe('Looks good');
    });

    it('sets decisionNotes to null when no notes provided', () => {
      const app = makeUnderReview();
      app.approve();
      expect(app.decisionNotes).toBeNull();
    });

    it('throws InvalidTransitionError when not UNDER_REVIEW', () => {
      const app = makeSubmitted();
      expect(() => app.approve()).toThrow(InvalidTransitionError);
    });
  });

  describe('reject()', () => {
    it('transitions UNDER_REVIEW → REJECTED', () => {
      const app = makeUnderReview();
      app.reject('Fraud risk');
      expect(app.status).toBe(ApplicationStatus.REJECTED);
      expect(app.decidedAt).toBeInstanceOf(Date);
      expect(app.decisionNotes).toBe('Fraud risk');
    });

    it('throws InvalidTransitionError when not UNDER_REVIEW', () => {
      const app = makeSubmitted();
      expect(() => app.reject()).toThrow(InvalidTransitionError);
    });
  });

  describe('requestInfo()', () => {
    it('transitions UNDER_REVIEW → INFO_REQUESTED', () => {
      const app = makeUnderReview();
      app.requestInfo('Need more docs');
      expect(app.status).toBe(ApplicationStatus.INFO_REQUESTED);
      expect(app.decidedAt).toBeInstanceOf(Date);
      expect(app.decisionNotes).toBe('Need more docs');
    });

    it('throws InvalidTransitionError when not UNDER_REVIEW', () => {
      const app = makeDraft();
      expect(() => app.requestInfo()).toThrow(InvalidTransitionError);
    });
  });
});
