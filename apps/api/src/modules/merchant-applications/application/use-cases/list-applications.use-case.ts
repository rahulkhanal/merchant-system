import { Injectable } from '@nestjs/common';
import { MerchantApplication } from '../../domain/merchant-application.js';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { ApplicationStatus } from '../../domain/application-status.enum.js';
import { Role } from '../../../identity/domain/role.enum.js';
import { ListOptions, PaginatedResult } from '../dtos/pagination.dto.js';

export type { ListOptions, PaginatedResult };

@Injectable()
export class ListApplicationsUseCase {
  constructor(private readonly repo: MerchantApplicationRepository) {}

  execute(actorId: string, role: Role, opts: ListOptions): Promise<PaginatedResult<MerchantApplication>> {
    if (role === Role.ADMIN) return this.repo.listAllPaginated(opts);
    if (role === Role.REVIEWER) return this.repo.listByStatusPaginated(opts.status ?? ApplicationStatus.UNDER_REVIEW, opts);
    return this.repo.listByOwnerPaginated(actorId, opts);
  }
}
