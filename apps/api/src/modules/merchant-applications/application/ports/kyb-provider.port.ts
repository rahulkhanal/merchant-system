export interface KybCheckInput {
  reference: string;
  businessName: string;
  legalBusinessName: string;
  businessType: string;
  country: string;
  mcc: string;
  monthlyVolume: number;
}

export interface KybCheckResult {
  outcome: 'approved' | 'flagged' | 'rejected';
  referenceId: string;
  checkedAt: string;
}

export abstract class KybProviderPort {
  abstract check(input: KybCheckInput): Promise<KybCheckResult>;
}
