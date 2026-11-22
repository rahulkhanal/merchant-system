export enum KybOutcome {
  APPROVED = 'approved',
  FLAGGED = 'flagged',
  REJECTED = 'rejected',
}

export interface KybCheckRequest {
  legalBusinessName: string;
}

export interface KybCheckResult {
  outcome: KybOutcome;
  referenceId: string;
  checkedAt: string;
}

export interface ScenarioFailure {
  statusCode: number;
  message: string;
}

export interface Scenario {
  name: string;
  outcome?: KybOutcome;
  delayMs?: number;
  failure?: ScenarioFailure;
}

const SCENARIO_KEYWORDS: Record<string, string> = {
  flagged: 'flagged',
  rejected: 'rejected',
  outage: 'outage',
  slow: 'slow',
};

export function selectScenario(legalBusinessName: string): string {
  const lower = legalBusinessName.toLowerCase();
  for (const [keyword, scenarioName] of Object.entries(SCENARIO_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return scenarioName;
    }
  }
  return 'approved';
}
