import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) entityId!: string;
  @ApiProperty({ example: 'MerchantApplication' }) entityType!: string;
  @ApiProperty({ example: 'APPROVED' }) action!: string;
  @ApiProperty({ format: 'uuid' }) actorId!: string;
  @ApiProperty({ type: Object }) metadata!: Record<string, unknown>;
  @ApiProperty({ type: Date }) createdAt!: Date;
}
