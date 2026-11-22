import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { KybCheckRequest, KybCheckResult, KybOutcome, Scenario, selectScenario } from './types.js';

const SCENARIOS: Record<string, Scenario> = {
  approved: { name: 'approved', outcome: KybOutcome.APPROVED },
  flagged: { name: 'flagged', outcome: KybOutcome.FLAGGED },
  rejected: { name: 'rejected', outcome: KybOutcome.REJECTED },
  outage: { name: 'outage', failure: { statusCode: 503, message: 'KYB provider is temporarily unavailable' } },
  slow: { name: 'slow', outcome: KybOutcome.APPROVED, delayMs: 4000 },
};

export class SimulatedProviderFailure extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'SimulatedProviderFailure';
  }
}

@Injectable()
export class KybChecksService {
  async check(body: KybCheckRequest): Promise<KybCheckResult> {
    const scenario = SCENARIOS[selectScenario(body.legalBusinessName)];

    if (scenario.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, scenario.delayMs));
    }

    if (scenario.failure) {
      throw new SimulatedProviderFailure(scenario.failure.statusCode, scenario.failure.message);
    }

    return {
      outcome: scenario.outcome as KybOutcome,
      referenceId: randomUUID(),
      checkedAt: new Date().toISOString(),
    };
  }
}
