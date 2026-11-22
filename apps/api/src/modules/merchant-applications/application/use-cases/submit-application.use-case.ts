import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { KybQueuePort } from '../ports/kyb-queue.port.js';
import { MerchantApplication } from '../../domain/merchant-application.js';

const KYB_ENQUEUE_TIMEOUT_MS = 3000;

@Injectable()
export class SubmitApplicationUseCase {
  private readonly logger = new Logger(SubmitApplicationUseCase.name);

  constructor(
    private readonly repo: MerchantApplicationRepository,
    private readonly kybQueue: KybQueuePort,
  ) {}

  async execute(id: string, actorId: string): Promise<MerchantApplication> {
    const app = await this.repo.findByIdAndOwner(id, actorId);
    if (!app) throw new NotFoundException('Application not found');

    app.submit();
    const saved = await this.repo.save(app);

    try {
      await Promise.race([
        this.kybQueue.enqueue(saved.id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('KYB queue timeout')), KYB_ENQUEUE_TIMEOUT_MS),
        ),
      ]);
    } catch (err) {
      this.logger.warn(`Failed to enqueue KYB job for ${saved.id}: ${(err as Error).message}. Sweep will recover.`);
    }

    return saved;
  }
}
