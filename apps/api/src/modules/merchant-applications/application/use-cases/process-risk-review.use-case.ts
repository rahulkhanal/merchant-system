import { Injectable, Logger } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import { RiskStatus } from '../../domain/risk-status.enum.js';
import { KybProviderPort } from '../ports/kyb-provider.port.js';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { KybProviderError } from '../../infrastructure/http/kyb-http-client.js';

@Injectable()
export class ProcessRiskReviewUseCase {
  private readonly logger = new Logger(ProcessRiskReviewUseCase.name);

  constructor(
    private readonly repo: MerchantApplicationRepository,
    private readonly kybProvider: KybProviderPort,
  ) {}

  async execute(applicationId: string): Promise<void> {
    const app = await this.repo.findById(applicationId);
    if (!app) {
      this.logger.warn(`Application ${applicationId} not found — skipping`);
      return;
    }

    if (app.riskStatus !== RiskStatus.PENDING) {
      this.logger.warn(`Application ${applicationId} already processed (${app.riskStatus}) — skipping`);
      return;
    }

    try {
      const result = await this.kybProvider.check({
        reference: `app-${app.id}:${app.submissionCount}`,
        businessName: app.businessName ?? '',
        legalBusinessName: app.legalBusinessName ?? '',
        businessType: app.businessType ?? '',
        country: app.country ?? '',
        mcc: app.mcc ?? '',
        monthlyVolume: app.monthlyVolume ?? 0,
      });

      const outcomeMap: Record<string, RiskStatus> = {
        approved: RiskStatus.APPROVED,
        flagged: RiskStatus.FLAGGED,
        rejected: RiskStatus.REJECTED,
      };

      app.recordRiskAssessment(
        outcomeMap[result.outcome] ?? RiskStatus.FAILED,
        result.referenceId,
        new Date(result.checkedAt),
      );
      await this.repo.save(app);

      this.logger.log(`KYB completed for ${applicationId}: ${result.outcome}`);
    } catch (err) {
      if (err instanceof KybProviderError && err.statusCode >= 400 && err.statusCode < 500) {
        this.logger.error(`KYB 4xx for ${applicationId} — marking FAILED: ${err.message}`);
        app.markRiskReviewFailed();
        await this.repo.save(app);
        throw new UnrecoverableError(err.message);
      }

      // 5xx / network — rethrow so BullMQ retries
      throw err;
    }
  }
}
