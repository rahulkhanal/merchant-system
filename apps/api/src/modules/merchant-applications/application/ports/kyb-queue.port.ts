export abstract class KybQueuePort {
  abstract enqueue(applicationId: string): Promise<void>;
}
