import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MerchantApplicationRepository } from '../../application/ports/merchant-application.repository.port.js';
import { KybQueuePort } from '../../application/ports/kyb-queue.port.js';

@Injectable()
export class StalledReviewSweep {
  private readonly logger = new Logger(StalledReviewSweep.name);

  constructor(
    private readonly repo: MerchantApplicationRepository,
    private readonly kybQueue: KybQueuePort,
  ) {}

  @Cron('*/60 * * * * *')
  async sweep(): Promise<void> {
    const stalled = await this.repo.findStalledApplications();
    if (stalled.length === 0) return;

    this.logger.log(`Sweep found ${stalled.length} stalled application(s) — re-enqueueing`);

    await Promise.allSettled(
      stalled.map((app) =>
        this.kybQueue.enqueue(app.id).catch((err: Error) =>
          this.logger.error(`Failed to re-enqueue ${app.id}: ${err.message}`),
        ),
      ),
    );
  }
}
