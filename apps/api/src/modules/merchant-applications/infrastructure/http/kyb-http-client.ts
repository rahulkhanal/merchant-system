import { Injectable, Logger } from '@nestjs/common';
import { KybCheckInput, KybCheckResult, KybProviderPort } from '../../application/ports/kyb-provider.port.js';

const KYB_MOCK_URL = process.env['KYB_MOCK_URL'] ;
const KYB_API_KEY = process.env['KYB_MOCK_API_KEY']!;
const TIMEOUT_MS = 10_000;

export class KybProviderError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

@Injectable()
export class KybHttpClient implements KybProviderPort {
  private readonly logger = new Logger(KybHttpClient.name);

  async check(input: KybCheckInput): Promise<KybCheckResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${KYB_MOCK_URL}/kyb/checks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': KYB_API_KEY,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (err) {
      throw new Error(`KYB provider unreachable: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`KYB provider returned ${response.status}: ${body}`);
      throw new KybProviderError(`KYB provider error: ${response.status}`, response.status);
    }

    return response.json() as Promise<KybCheckResult>;
  }
}
