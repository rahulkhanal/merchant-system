import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:v1:';

@Injectable()
export class FieldEncryptionService {
  private readonly key: Buffer;

  constructor() {
    const raw = process.env['FIELD_ENCRYPTION_KEY'];
    if (!raw) throw new Error('FIELD_ENCRYPTION_KEY env var is required');
    this.key = Buffer.from(raw, 'hex');
    if (this.key.length !== 32) throw new Error('FIELD_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
  }

  decrypt(value: string): string {
    if (!value.startsWith(PREFIX)) return value;
    const parts = value.slice(PREFIX.length).split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted field format');
    const [ivHex, tagHex, ciphertextHex] = parts as [string, string, string];
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(ciphertextHex, 'hex')).toString('utf8') + decipher.final('utf8');
  }

  isEncrypted(value: string): boolean {
    return value.startsWith(PREFIX);
  }

  maskApplication(app: import('../../domain/merchant-application.js').MerchantApplication) {
    return {
      id: app.id,
      createdById: app.createdById,
      assignedReviewerId: app.assignedReviewerId,
      status: app.status,
      riskStatus: app.riskStatus,
      submissionCount: app.submissionCount,
      businessName: app.businessName,
      legalBusinessName: app.legalBusinessName,
      businessType: app.businessType,
      country: app.country,
      mcc: app.mcc,
      monthlyVolume: app.monthlyVolume,
      ownerInfo: app.ownerInfo
        ? {
            firstName: app.ownerInfo.firstName,
            lastName: app.ownerInfo.lastName,
            ssn: app.ownerInfo.ssn ? this.mask(app.ownerInfo.ssn, 'ssn') : null,
            dateOfBirth: app.ownerInfo.dateOfBirth ? '[REDACTED]' : null,
            taxId: app.ownerInfo.taxId ? '[REDACTED]' : null,
          }
        : null,
      bankAccountNumber: app.bankAccountNumber ? this.mask(app.bankAccountNumber, 'bankAccount') : null,
      routingNumber: app.routingNumber ? '[REDACTED]' : null,
      riskScore: app.riskScore,
      riskReasons: app.riskReasons,
      riskReference: app.riskReference,
      riskCheckedAt: app.riskCheckedAt,
      submittedAt: app.submittedAt,
      decidedAt: app.decidedAt,
      decisionNotes: app.decisionNotes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  mask(value: string, type: 'ssn' | 'bankAccount' | 'routingNumber' | 'default'): string {
    const plain = this.isEncrypted(value) ? this.decrypt(value) : value;
    switch (type) {
      case 'ssn':
        return `***-**-${plain.slice(-4)}`;
      case 'bankAccount':
        return `****${plain.slice(-4)}`;
      case 'routingNumber':
      case 'default':
        return '[REDACTED]';
    }
  }
}
