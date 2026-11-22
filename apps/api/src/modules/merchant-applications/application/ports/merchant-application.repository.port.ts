import { MerchantApplication } from '../../domain/merchant-application.js';
import { ApplicationStatus } from '../../domain/application-status.enum.js';
import { ListOptions, PaginatedResult } from '../dtos/pagination.dto.js';

export abstract class MerchantApplicationRepository {
  abstract create(createdById: string): Promise<MerchantApplication>;
  abstract findById(id: string): Promise<MerchantApplication | null>;
  abstract findByIdAndOwner(id: string, createdById: string): Promise<MerchantApplication | null>;
  abstract findStalledApplications(): Promise<MerchantApplication[]>;
  abstract save(application: MerchantApplication): Promise<MerchantApplication>;
  abstract listByOwner(createdById: string): Promise<MerchantApplication[]>;
  abstract listAll(): Promise<MerchantApplication[]>;
  abstract listByStatus(status: ApplicationStatus): Promise<MerchantApplication[]>;
  abstract listAllPaginated(opts: ListOptions): Promise<PaginatedResult<MerchantApplication>>;
  abstract listByStatusPaginated(status: ApplicationStatus, opts: ListOptions): Promise<PaginatedResult<MerchantApplication>>;
  abstract listByOwnerPaginated(createdById: string, opts: ListOptions): Promise<PaginatedResult<MerchantApplication>>;
}
