import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { KybQueuePort } from '../../application/ports/kyb-queue.port.js';

export const KYB_QUEUE_NAME = 'kyb';

@Injectable()
export class KybBullMQQueue implements KybQueuePort {
  constructor(@InjectQueue(KYB_QUEUE_NAME) private readonly queue: Queue) {}

  async enqueue(applicationId: string): Promise<void> {
    await this.queue.add('process-risk-review', { applicationId });
  }
}
