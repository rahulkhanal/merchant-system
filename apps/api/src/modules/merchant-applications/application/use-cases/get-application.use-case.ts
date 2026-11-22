import { Injectable, NotFoundException } from '@nestjs/common';
import { MerchantApplication } from '../../domain/merchant-application.js';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { Role } from '../../../identity/domain/role.enum.js';

@Injectable()
export class GetApplicationUseCase {
  constructor(private readonly repo: MerchantApplicationRepository) {}

  async execute(id: string, actorId: string, role: Role): Promise<MerchantApplication> {
    if (role === Role.ADMIN || role === Role.REVIEWER) {
      const app = await this.repo.findById(id);
      if (!app) throw new NotFoundException('Application not found');
      return app;
    }
    const app = await this.repo.findByIdAndOwner(id, actorId);
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }
}
