import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProcessRiskReviewUseCase } from '../../application/use-cases/process-risk-review.use-case.js';
import { KYB_QUEUE_NAME } from '../queue/kyb.bullmq.queue.js';

interface KybJobData {
  applicationId: string;
}

@Processor(KYB_QUEUE_NAME, {
  concurrency: 5,
  limiter: { max: 10, duration: 1000 },
})
export class ProcessRiskReviewProcessor extends WorkerHost {
  constructor(private readonly useCase: ProcessRiskReviewUseCase) {
    super();
  }

  async process(job: Job<KybJobData>): Promise<void> {
    await this.useCase.execute(job.data.applicationId);
  }
}
