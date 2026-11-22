import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ApplicationStatus } from '../../domain/application-status.enum.js';
import { MerchantApplication } from '../../domain/merchant-application.js';
import { OwnerInfo } from '../../domain/owner-info.js';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';

export interface UpdateApplicationInput {
  businessName?: string;
  legalBusinessName?: string;
  businessType?: string;
  country?: string;
  mcc?: string;
  monthlyVolume?: number;
  ownerInfo?: OwnerInfo;
  bankAccountNumber?: string;
  routingNumber?: string;
}

const EDITABLE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.DRAFT,
  ApplicationStatus.INFO_REQUESTED,
];

@Injectable()
export class UpdateApplicationUseCase {
  constructor(private readonly repo: MerchantApplicationRepository) {}

  async execute(id: string, actorId: string, input: UpdateApplicationInput): Promise<MerchantApplication> {
    const app = await this.repo.findByIdAndOwner(id, actorId);
    if (!app) throw new NotFoundException('Application not found');

    if (!EDITABLE_STATUSES.includes(app.status)) {
      throw new UnprocessableEntityException(`Cannot edit application in status ${app.status}`);
    }

    if (input.businessName !== undefined) app.businessName = input.businessName;
    if (input.legalBusinessName !== undefined) app.legalBusinessName = input.legalBusinessName;
    if (input.businessType !== undefined) app.businessType = input.businessType;
    if (input.country !== undefined) app.country = input.country;
    if (input.mcc !== undefined) app.mcc = input.mcc;
    if (input.monthlyVolume !== undefined) app.monthlyVolume = input.monthlyVolume;
    if (input.ownerInfo !== undefined) app.ownerInfo = { ...app.ownerInfo, ...input.ownerInfo };
    if (input.bankAccountNumber !== undefined) app.bankAccountNumber = input.bankAccountNumber;
    if (input.routingNumber !== undefined) app.routingNumber = input.routingNumber;

    return this.repo.save(app);
  }
}
