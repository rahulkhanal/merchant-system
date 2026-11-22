import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ApplicationStatus } from '../../domain/application-status.enum.js';
import { ListOptions, PaginatedResult } from '../../application/dtos/pagination.dto.js';

import { MerchantApplication } from '../../domain/merchant-application.js';
import { OwnerInfo } from '../../domain/owner-info.js';
import { RiskStatus } from '../../domain/risk-status.enum.js';
import { MerchantApplicationRepository } from '../../application/ports/merchant-application.repository.port.js';
import { MerchantApplicationEntity } from '../entities/merchant-application.entity.js';
import { FieldEncryptionService } from '../services/field-encryption.service.js';

const STALLED_THRESHOLD_MS = 5 * 60 * 1000;

@Injectable()
export class MerchantApplicationTypeOrmRepository implements MerchantApplicationRepository {
  constructor(
    @InjectRepository(MerchantApplicationEntity)
    private readonly repo: Repository<MerchantApplicationEntity>,
    private readonly encryption: FieldEncryptionService,
  ) {}

  async create(createdById: string): Promise<MerchantApplication> {
    const entity = this.repo.create({
      createdById,
      status: ApplicationStatus.DRAFT,
      riskStatus: null,
      submissionCount: 0,
    });
    return this.toDomain(await this.repo.save(entity));
  }

  async findById(id: string): Promise<MerchantApplication | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIdAndOwner(id: string, createdById: string): Promise<MerchantApplication | null> {
    const entity = await this.repo.findOneBy({ id, createdById });
    return entity ? this.toDomain(entity) : null;
  }

  async listByOwner(createdById: string): Promise<MerchantApplication[]> {
    const entities = await this.repo.findBy({ createdById });
    return entities.map((e) => this.toDomain(e));
  }

  async listAll(): Promise<MerchantApplication[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async listByStatus(status: ApplicationStatus): Promise<MerchantApplication[]> {
    const entities = await this.repo.findBy({ status });
    return entities.map((e) => this.toDomain(e));
  }

  async listAllPaginated(opts: ListOptions): Promise<PaginatedResult<MerchantApplication>> {
    const where = opts.status ? { status: opts.status } : {};
    const [entities, total] = await this.repo.findAndCount({
      where,
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      order: { createdAt: 'DESC' },
    });
    return { data: entities.map((e) => this.toDomain(e)), total, page: opts.page, limit: opts.limit };
  }

  async listByStatusPaginated(status: ApplicationStatus, opts: ListOptions): Promise<PaginatedResult<MerchantApplication>> {
    const [entities, total] = await this.repo.findAndCount({
      where: { status },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      order: { createdAt: 'DESC' },
    });
    return { data: entities.map((e) => this.toDomain(e)), total, page: opts.page, limit: opts.limit };
  }

  async listByOwnerPaginated(createdById: string, opts: ListOptions): Promise<PaginatedResult<MerchantApplication>> {
    const where = opts.status ? { createdById, status: opts.status } : { createdById };
    const [entities, total] = await this.repo.findAndCount({
      where,
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      order: { createdAt: 'DESC' },
    });
    return { data: entities.map((e) => this.toDomain(e)), total, page: opts.page, limit: opts.limit };
  }

  async findStalledApplications(): Promise<MerchantApplication[]> {
    const threshold = new Date(Date.now() - STALLED_THRESHOLD_MS);
    const entities = await this.repo.findBy({
      riskStatus: RiskStatus.PENDING,
      updatedAt: LessThan(threshold),
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(domain: MerchantApplication): Promise<MerchantApplication> {
    const entity = await this.repo.findOneByOrFail({ id: domain.id });
    this.applyDomainToEntity(domain, entity);
    return this.toDomain(await this.repo.save(entity));
  }

  private toDomain(entity: MerchantApplicationEntity): MerchantApplication {
    return MerchantApplication.reconstitute({
      id: entity.id,
      createdById: entity.createdById,
      assignedReviewerId: entity.assignedReviewerId,
      status: entity.status,
      riskStatus: entity.riskStatus,
      submissionCount: entity.submissionCount,
      businessName: entity.businessName,
      legalBusinessName: entity.legalBusinessName,
      businessType: entity.businessType,
      country: entity.country,
      mcc: entity.mcc,
      monthlyVolume: entity.monthlyVolume ? Number(entity.monthlyVolume) : null,
      ownerInfo: entity.ownerInfo ? this.decryptOwnerInfo(entity.ownerInfo) : null,
      bankAccountNumber: entity.bankAccountNumber ? this.encryption.decrypt(entity.bankAccountNumber) : null,
      routingNumber: entity.routingNumber ? this.encryption.decrypt(entity.routingNumber) : null,
      riskScore: entity.riskScore,
      riskReasons: entity.riskReasons,
      riskReference: entity.riskReference,
      riskCheckedAt: entity.riskCheckedAt,
      submittedAt: entity.submittedAt,
      decidedAt: entity.decidedAt,
      decisionNotes: entity.decisionNotes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: entity.version,
    });
  }

  private applyDomainToEntity(domain: MerchantApplication, entity: MerchantApplicationEntity): void {
    entity.assignedReviewerId = domain.assignedReviewerId;
    entity.status = domain.status;
    entity.riskStatus = domain.riskStatus;
    entity.submissionCount = domain.submissionCount;
    entity.businessName = domain.businessName;
    entity.legalBusinessName = domain.legalBusinessName;
    entity.businessType = domain.businessType;
    entity.country = domain.country;
    entity.mcc = domain.mcc;
    entity.monthlyVolume = domain.monthlyVolume;
    entity.ownerInfo = domain.ownerInfo ? this.encryptOwnerInfo(domain.ownerInfo) : null;
    entity.bankAccountNumber = domain.bankAccountNumber ? this.encryption.encrypt(domain.bankAccountNumber) : null;
    entity.routingNumber = domain.routingNumber ? this.encryption.encrypt(domain.routingNumber) : null;
    entity.riskReference = domain.riskReference;
    entity.riskCheckedAt = domain.riskCheckedAt;
    entity.submittedAt = domain.submittedAt;
    entity.decidedAt = domain.decidedAt;
    entity.decisionNotes = domain.decisionNotes;
  }

  private encryptOwnerInfo(info: OwnerInfo): Record<string, string> {
    const result: Record<string, string> = {};
    if (info.firstName) result['firstName'] = info.firstName;
    if (info.lastName) result['lastName'] = info.lastName;
    if (info.ssn) result['ssn'] = this.encryption.encrypt(info.ssn);
    if (info.dateOfBirth) result['dateOfBirth'] = this.encryption.encrypt(info.dateOfBirth);
    if (info.taxId) result['taxId'] = this.encryption.encrypt(info.taxId);
    return result;
  }

  private decryptOwnerInfo(raw: Record<string, string>): OwnerInfo {
    return {
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      ssn: raw['ssn'] ? this.encryption.decrypt(raw['ssn']) : undefined,
      dateOfBirth: raw['dateOfBirth'] ? this.encryption.decrypt(raw['dateOfBirth']) : undefined,
      taxId: raw['taxId'] ? this.encryption.decrypt(raw['taxId']) : undefined,
    };
  }
}
