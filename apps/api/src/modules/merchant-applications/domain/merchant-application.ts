import { ApplicationStatus } from './application-status.enum.js';
import { OwnerInfo } from './owner-info.js';
import { RiskStatus } from './risk-status.enum.js';

export class DomainError extends Error {}
export class InvalidTransitionError extends DomainError {
  constructor(from: ApplicationStatus, to: ApplicationStatus) {
    super(`Cannot transition from ${from} to ${to}`);
  }
}
export class MissingRequiredFieldsError extends DomainError {
  constructor(fields: string[]) {
    super(`Missing required fields: ${fields.join(', ')}`);
  }
}

const REQUIRED_FOR_SUBMIT = [
  'businessName',
  'legalBusinessName',
  'businessType',
  'country',
  'mcc',
  'monthlyVolume',
] as const;

export interface MerchantApplicationProps {
  id: string;
  createdById: string;
  assignedReviewerId: string | null;
  status: ApplicationStatus;
  riskStatus: RiskStatus | null;
  submissionCount: number;
  businessName: string | null;
  legalBusinessName: string | null;
  businessType: string | null;
  country: string | null;
  mcc: string | null;
  monthlyVolume: number | null;
  ownerInfo: OwnerInfo | null;
  bankAccountNumber: string | null;
  routingNumber: string | null;
  riskScore: number | null;
  riskReasons: string[] | null;
  riskReference: string | null;
  riskCheckedAt: Date | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  decisionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export class MerchantApplication {
  readonly id: string;
  readonly createdById: string;
  assignedReviewerId: string | null;
  status: ApplicationStatus;
  riskStatus: RiskStatus | null;
  submissionCount: number;

  businessName: string | null;
  legalBusinessName: string | null;
  businessType: string | null;
  country: string | null;
  mcc: string | null;
  monthlyVolume: number | null;

  ownerInfo: OwnerInfo | null;
  bankAccountNumber: string | null;
  routingNumber: string | null;

  riskScore: number | null;
  riskReasons: string[] | null;
  riskReference: string | null;
  riskCheckedAt: Date | null;

  submittedAt: Date | null;
  decidedAt: Date | null;
  decisionNotes: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
  version: number;

  private constructor(props: MerchantApplicationProps) {
    this.id = props.id;
    this.createdById = props.createdById;
    this.assignedReviewerId = props.assignedReviewerId;
    this.status = props.status;
    this.riskStatus = props.riskStatus;
    this.submissionCount = props.submissionCount;
    this.businessName = props.businessName;
    this.legalBusinessName = props.legalBusinessName;
    this.businessType = props.businessType;
    this.country = props.country;
    this.mcc = props.mcc;
    this.monthlyVolume = props.monthlyVolume;
    this.ownerInfo = props.ownerInfo;
    this.bankAccountNumber = props.bankAccountNumber;
    this.routingNumber = props.routingNumber;
    this.riskScore = props.riskScore;
    this.riskReasons = props.riskReasons;
    this.riskReference = props.riskReference;
    this.riskCheckedAt = props.riskCheckedAt;
    this.submittedAt = props.submittedAt;
    this.decidedAt = props.decidedAt;
    this.decisionNotes = props.decisionNotes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.version = props.version;
  }

  static reconstitute(props: MerchantApplicationProps): MerchantApplication {
    return new MerchantApplication(props);
  }

  submit(): void {
    const submittable: ApplicationStatus[] = [ApplicationStatus.DRAFT, ApplicationStatus.INFO_REQUESTED];
    if (!submittable.includes(this.status)) {
      throw new InvalidTransitionError(this.status, ApplicationStatus.SUBMITTED);
    }

    const missing = REQUIRED_FOR_SUBMIT.filter((f) => !this[f]);
    if (missing.length > 0) throw new MissingRequiredFieldsError(missing);

    this.status = ApplicationStatus.SUBMITTED;
    this.riskStatus = RiskStatus.PENDING;
    this.submissionCount += 1;
    this.submittedAt = new Date();
  }

  recordRiskAssessment(outcome: RiskStatus, reference: string, checkedAt: Date): void {
    if (this.status !== ApplicationStatus.SUBMITTED) {
      throw new InvalidTransitionError(this.status, ApplicationStatus.UNDER_REVIEW);
    }
    this.status = ApplicationStatus.UNDER_REVIEW;
    this.riskStatus = outcome;
    this.riskReference = reference;
    this.riskCheckedAt = checkedAt;
  }

  markRiskReviewFailed(): void {
    this.riskStatus = RiskStatus.FAILED;
  }

  approve(notes?: string): void {
    if (this.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new InvalidTransitionError(this.status, ApplicationStatus.APPROVED);
    }
    this.status = ApplicationStatus.APPROVED;
    this.decidedAt = new Date();
    this.decisionNotes = notes ?? null;
  }

  reject(notes?: string): void {
    if (this.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new InvalidTransitionError(this.status, ApplicationStatus.REJECTED);
    }
    this.status = ApplicationStatus.REJECTED;
    this.decidedAt = new Date();
    this.decisionNotes = notes ?? null;
  }

  requestInfo(notes?: string): void {
    if (this.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new InvalidTransitionError(this.status, ApplicationStatus.INFO_REQUESTED);
    }
    this.status = ApplicationStatus.INFO_REQUESTED;
    this.decidedAt = new Date();
    this.decisionNotes = notes ?? null;
  }
}
